import { createBrowserClient } from "@supabase/ssr";

// Browser client — used by the login form to request a magic link.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
