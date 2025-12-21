import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses RLS - use only in trusted server-side code.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  // Service role bypasses RLS. Keep server-side only.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

