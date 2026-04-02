import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export interface TenantBranding {
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  email_logo_url: string | null;
  email_footer_text: string | null;
  whatsapp_message_prefix: string | null;
  support_email: string | null;
  support_phone: string | null;
}

export function useTenantBranding(slug?: string) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchBranding = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('tenants')
          .select(
            'logo_url,favicon_url,primary_color,secondary_color,accent_color,background_color,text_color,email_logo_url,email_footer_text,whatsapp_message_prefix,support_email,support_phone'
          )
          .eq('slug', slug)
          .single();

        if (data) {
          setBranding(data);
          applyBrandingToDOM(data);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [slug]);

  return { branding, loading };
}

function applyBrandingToDOM(branding: TenantBranding) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', branding.primary_color);
  root.style.setProperty('--secondary-color', branding.secondary_color);
  root.style.setProperty('--accent-color', branding.accent_color);
  root.style.setProperty('--background-color', branding.background_color);
  root.style.setProperty('--text-color', branding.text_color);
}
