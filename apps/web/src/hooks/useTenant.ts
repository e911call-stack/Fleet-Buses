import { useTenantContext } from '@/lib/tenant-context';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

interface TenantResult {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  [key: string]: any;
}

export function useTenant(slug?: string) {
  const context = useTenantContext();
  const [tenant, setTenant] = useState<TenantResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // Use context if available, otherwise fetch directly
    if (context?.tenant) {
      setTenant(context.tenant as TenantResult);
      setLoading(false);
    } else {
      const fetchTenant = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single();

          setTenant(data as TenantResult);
        } catch (error) {
          console.error('Error fetching tenant:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTenant();
    }
  }, [slug, context?.tenant]);

  return {
    tenant,
    loading,
    error: context?.error,
  };
}
