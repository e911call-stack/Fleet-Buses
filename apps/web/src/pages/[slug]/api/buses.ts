import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string };

  if (!slug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  // Create Supabase client with auth token
  const supabase = createServerSupabaseClient(req, res);

  // Check if user is authenticated
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
    return res.status(401).json({ error: 'User not found' });
  }

  // Verify tenant slug matches user's tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('id', userTenant.tenant_id)
    .single();

  if (!tenant) {
    return res.status(403).json({ error: 'Forbidden - Tenant mismatch' });
  }

  // GET - List buses
  if (req.method === 'GET') {
    const { data: buses, error } = await supabase
      .from('buses')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get stats
    const stats = {
      activeBuses: buses?.filter(b => b.status === 'active').length || 0,
      totalStudents: 0, // Would query subscriptions table
      onTimePercentage: 95, // Would calculate from trips
    };

    return res.status(200).json({ buses, stats });
  }

  // POST - Create bus
  if (req.method === 'POST') {
    const { plate_number, capacity, name } = req.body;

    if (!plate_number || !capacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: newBus, error } = await supabase
      .from('buses')
      .insert({
        tenant_id: tenant.id,
        plate_number,
        capacity,
        name,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(newBus);
  }

  // PUT - Update bus
  if (req.method === 'PUT') {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Bus ID is required' });
    }

    const { data: updatedBus, error } = await supabase
      .from('buses')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(updatedBus);
  }

  // DELETE - Delete bus
  if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Bus ID is required' });
    }

    const { error } = await supabase
      .from('buses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
