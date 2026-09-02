import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

/**
 * Point d'atterrissage du lien de confirmation d'adresse.
 *
 * Confirmer OUVRE la session : le commerçant arrive directement sur son
 * dashboard, sans ressaisir le mot de passe qu'il vient de choisir. C'est le
 * moment où il est le plus susceptible d'abandonner, et lui redemander de se
 * connecter n'apporte aucune sécurité — il vient de prouver qu'il a accès à
 * la boîte mail.
 *
 * Contrairement à `/auth/reset`, la vérification passe par `token_hash` et non
 * par un `code` PKCE. La raison est concrète : le mail est très souvent ouvert
 * sur le téléphone alors que l'inscription a été faite sur l'ordinateur. Le
 * vérificateur PKCE, lui, vit dans un cookie du navigateur d'origine — il
 * serait introuvable, et le lien échouerait sur l'appareil le plus courant.
 * `verifyOtp` ne dépend d'aucun cookie préalable et marche partout.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    // Lien tronqué par le client mail, ou template pas encore à jour.
    return NextResponse.redirect(new URL("/login?confirme=expire", url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    // Jeton expiré, ou déjà utilisé — un lien de confirmation ne sert qu'une
    // fois. Dans les deux cas la personne peut simplement se connecter.
    console.error("[confirm] vérification impossible:", error.code ?? error.message);
    return NextResponse.redirect(new URL("/login?confirme=expire", url));
  }

  // La session est posée : `requireMerchant()` prendra le relais et renverra
  // vers la création du commerce si la ligne métier manque.
  return NextResponse.redirect(new URL("/dashboard", url));
}
