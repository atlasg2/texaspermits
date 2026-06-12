import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. SERVER ONLY (never import into a client
// component). Used for reading the scraped data tables in server components.
export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
