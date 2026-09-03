import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_PREFIXES, ROLE_HOME, type AppRole } from "@/lib/auth/roles";

/**
 * Proxy d'authentification (étape 03).
 *
 * Next.js 16 a renommé `middleware.ts` en `proxy.ts` (l'ancien nom est
 * déprécié) — cf node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md.
 *
 * Deux responsabilités :
 *  1. Rafraîchir la session Supabase à chaque requête (pattern standard
 *     @supabase/ssr : les cookies rafraîchis doivent être posés À LA FOIS
 *     sur la requête transmise au rendu et sur la réponse renvoyée).
 *  2. Rediriger tôt les visiteurs qui n'ont rien à faire sur /dashboard/*,
 *     /customer/* ou /admin/*.
 *
 * ⚠️ Le point 2 est une vérification OPTIMISTE, pas de la sécurité, pour
 * deux raisons cumulées :
 *   - le rôle lu ici vient de `user_metadata`, que l'utilisateur peut
 *     modifier lui-même via `supabase.auth.updateUser()` ;
 *   - la doc Next 16 (guides/authentication, "Optimistic checks with Proxy")
 *     déconseille explicitement toute requête base de données ici, ce fichier
 *     s'exécutant sur CHAQUE route, y compris les prefetch.
 *
 * L'autorisation réelle est vérifiée côté serveur, en base, par
 * `requireMerchant()` / `requireCustomer()` dans les layouts et les routes
 * API (cf SPEC §5 et §18 : "Les autorisations doivent être vérifiées côté
 * serveur.").
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT : `getUser()` (et pas `getSession()`) — c'est l'appel qui
  // revalide le jeton auprès de Supabase et déclenche son rafraîchissement.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const role = user?.user_metadata?.role as AppRole | undefined;

  const protectedMatch = PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (protectedMatch) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return redirectPreservingSession(loginUrl, response);
    }

    // Mauvais espace : on renvoie l'utilisateur chez lui plutôt que de lui
    // afficher une page qui échouera de toute façon côté serveur.
    //
    // /admin est l'exception : son accès dépend aussi d'une liste d'adresses
    // (cf lib/auth/admin-access.ts) que ce fichier ne peut pas consulter sans
    // requête base, déconseillée ici. On laisse donc passer, et `requireAdmin()`
    // tranche côté serveur — comme partout, c'est LUI qui fait autorité.
    if (protectedMatch.role !== "ADMIN" && role && role !== protectedMatch.role) {
      return redirectPreservingSession(
        new URL(ROLE_HOME[role], request.url),
        response
      );
    }
  }

  // Déjà connecté : /login et /register n'ont plus de sens.
  if (user && role && (pathname === "/login" || pathname === "/register")) {
    return redirectPreservingSession(
      new URL(ROLE_HOME[role], request.url),
      response
    );
  }

  return response;
}

/**
 * Une redirection crée une nouvelle réponse : sans ce report, les cookies de
 * session rafraîchis plus haut seraient perdus et l'utilisateur serait
 * déconnecté à la redirection suivante.
 */
function redirectPreservingSession(url: URL, from: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * Toutes les requêtes sauf les assets statiques et les images, afin que
     * la session soit rafraîchie sur chaque navigation réelle.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
