import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SVC  = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Admin client — only used for user creation by Treva super-admin.
// Uses the service role key which bypasses RLS and email confirmation.
export const supabaseAdmin = SUPABASE_SVC
  ? createClient(SUPABASE_URL, SUPABASE_SVC, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
