import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string };

  if (!slug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  // Create Supabase client with auth
  const supabase = createServerSupabaseClient(req, res);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify tenant access
  const { data: userTenant } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userTenant) {
    return res.status(401).json({ error: 'User profile not found' });
  }

  // Verify tenant slug matches
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('id', userTenant.tenant_id)
    .single();

  if (!tenant) {
    return res.status(403).json({ error: 'Forbidden - Tenant mismatch' });
  }

  // GET - List trips
  if (req.method === 'GET') {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    let query = supabase
      .from('trips')
      .select(`
        id,
        bus_id,
        driver_id,
        route_id,
        status,
        actual_start_time,
        actual_end_time,
        current_stop_index,
        buses:bus_id(id, plate_number, capacity),
        routes:route_id(id, name, origin, destination),
        drivers:driver_id(id, full_name, phone_number)
      `)
      .eq('tenant_id', tenant.id)
      .order('actual_start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: trips, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ trips });
  }

  // POST - Create trip
  if (req.method === 'POST') {
    const { bus_id, driver_id, route_id } = req.body;

    if (!bus_id || !driver_id || !route_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: newTrip, error } = await supabase
      .from('trips')
      .insert({
        tenant_id: tenant.id,
        bus_id,
        driver_id,
        route_id,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(newTrip);
  }

  // PUT - Update trip (start/end)
  if (req.method === 'PUT') {
    const { id, action } = req.body;

    if (!id || !action) {
      return res.status(400).json({ error: 'Trip ID and action are required' });
    }

    let updateData: any = {};

    if (action === 'start') {
      updateData = {
        status: 'in_progress',
        actual_start_time: new Date().toISOString(),
        current_stop_index: 0,
      };
    } else if (action === 'end') {
      updateData = {
        status: 'completed',
        actual_end_time: new Date().toISOString(),
      };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const { data: updatedTrip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send WhatsApp notification to parents
    if (action === 'start') {
      notifyParentsOfTripStart(updatedTrip);
    }

    return res.status(200).json(updatedTrip);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function notifyParentsOfTripStart(trip: any) {
  // This would integrate with WhatsApp API
  // For now, just logging
  console.log('TODO: Send WhatsApp notification for trip:', trip.id);
}
