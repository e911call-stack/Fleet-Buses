import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase-client';
import type { Database } from '@/types/supabase';

type Tenant = Database['public']['Tables']['tenants']['Row'];

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: React.ReactNode;
  slug: string;
}

export function TenantProvider({ children, slug }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch tenant by slug
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setTenant(null);
      } else {
        setTenant(data);
        setError(null);

        // Apply tenant branding to DOM
        if (data) {
          applyBranding(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = (tenantData: Tenant) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', tenantData.primary_color || '#007BFF');
    root.style.setProperty('--secondary-color', tenantData.secondary_color || '#6C757D');
    root.style.setProperty('--accent-color', tenantData.accent_color || '#FF6B6B');
    root.style.setProperty('--background-color', tenantData.background_color || '#FFFFFF');
    root.style.setProperty('--text-color', tenantData.text_color || '#333333');

    if (tenantData.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) link.href = tenantData.favicon_url;
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [slug]);

  const value: TenantContextType = {
    tenant,
    loading,
    error,
    refetch: fetchTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return context;
}
