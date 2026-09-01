import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// À utiliser dans les Server Components, Route Handlers et Server Actions.
// C'est le SEUL endroit fiable pour connaître l'utilisateur authentifié
// côté serveur — cf SPEC §5 : "Le frontend ne doit jamais être considéré
// comme une source de confiance."
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component: ignoré si un middleware
            // gère déjà le rafraîchissement de session.
          }
        },
      },
    }
  );
}
