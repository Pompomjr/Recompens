import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

/**
 * Point d'atterrissage du lien de réinitialisation reçu par mail.
 *
 * Supabase vérifie le jeton de son côté puis renvoie ici avec un `code`.
 * Ce code doit être échangé contre une session — c'est cette session, et elle
 * seule, qui autorise ensuite le changement de mot de passe.
 *
 * L'échange se fait obligatoirement côté serveur : le vérificateur PKCE a été
 * déposé dans un cookie au moment de la demande, et n'est lisible que d'ici.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    // Lien tronqué, ou déjà utilisé. On ne dit pas lequel.
    return NextResponse.redirect(new URL("/forgot-password?expire=1", url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[reset] échange du code impossible:", error.message);
    return NextResponse.redirect(new URL("/forgot-password?expire=1", url));
  }

  return NextResponse.redirect(new URL("/reset-password", url));
}
