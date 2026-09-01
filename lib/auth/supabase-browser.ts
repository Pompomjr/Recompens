import { createBrowserClient } from "@supabase/ssr";

// À utiliser uniquement dans les composants "use client".
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
