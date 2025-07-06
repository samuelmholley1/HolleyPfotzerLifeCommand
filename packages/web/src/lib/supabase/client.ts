import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase'; // We will create this type next

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
