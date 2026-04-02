import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Singleton instance
let client: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
