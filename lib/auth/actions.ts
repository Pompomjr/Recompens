"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";
import { prisma } from "@/lib/db/prisma";
import {
  loginSchema,
  registerMerchantSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { getAppUrl } from "@/lib/app-url";
import { ROLE_HOME, type AppRole } from "./roles";
import { deleteAuthUser } from "./admin";
import type { AuthFormState } from "./form-state";

/**
 * Server Actions d'authentification (SPEC §6 pour le commerçant, §16 pour
 * les pages /login et /register).
 *
 * Toutes les vérifications de rôle se font ici et dans les layouts serveur,
 * jamais dans le navigateur (cf SPEC §5, §18 : "Les autorisations doivent
 * être vérifiées côté serveur.").
 */
/**
 * Empêche l'open redirect : on n'accepte comme destination qu'un chemin
 * interne ("/dashboard"), jamais une URL absolue fournie par le client.
 */
function safeInternalPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * cf SPEC §6 — Inscription commerçant :
 *   Email / password → Nom commerce → Dashboard.
 *
 * Le compte Supabase Auth et les enregistrements métier User (role=MERCHANT)
 * + Merchant sont créés ensemble : l'écriture Prisma imbriquée est exécutée
 * dans une seule transaction DB, donc jamais de User sans Merchant associé
 * (ce que `requireMerchant()` refuserait).
 *
 * Le `User.id` est volontairement l'id Supabase Auth : c'est la jointure
 * utilisée par `getCurrentUser()` (cf lib/auth/session.ts).
 */
export async function registerMerchantAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerMerchantSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    merchantName: formData.get("merchantName"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { email, password, merchantName } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Indice de rôle lisible par le middleware (Edge, sans accès à la DB).
      // ATTENTION : `user_metadata` est modifiable par l'utilisateur lui-même
      // via `supabase.auth.updateUser()`. Ce champ ne sert donc QU'À du
      // routage/UX. La seule source de vérité du rôle reste `User.role` en
      // base, revérifié côté serveur par `requireMerchant()` / `requireCustomer()`
      // (cf SPEC §5, §18).
      data: { role: "MERCHANT" satisfies AppRole },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const authUser = data.user;
  if (!authUser) {
    return {
      status: "error",
      message: "Création du compte impossible, réessayez.",
    };
  }

  // Adresse DÉJÀ inscrite. Supabase ne le dit pas franchement — ce serait
  // offrir à un attaquant le moyen de savoir qui a un compte — mais il le
  // signale en renvoyant un utilisateur SANS identité, et avec un id
  // fabriqué. Prendre cet id pour argent comptant crée une ligne métier
  // orpheline, impossible à rattacher ensuite au vrai compte : c'est
  // exactement ce qui bloquait la connexion.
  if (authUser.identities?.length === 0) {
    return {
      status: "error",
      message:
        "Un compte existe déjà avec cette adresse. Connectez-vous, ou utilisez « mot de passe oublié ».",
    };
  }

  // Supabase renvoie le même utilisateur si l'email existe déjà sans être
  // confirmé : on ne recrée alors pas les lignes métier.
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });

  if (!existing) {
    try {
      await prisma.user.create({
        data: {
          id: authUser.id,
          email,
          role: "MERCHANT",
          merchant: { create: { name: merchantName } },
        },
      });
    } catch (error) {
      // Sans cette trace, la vraie cause reste invisible : le message
      // ci-dessous est écrit pour un commerçant, pas pour un développeur.
      console.error("[register] création User + Merchant échouée:", error);

      // On ANNULE le compte d'authentification qu'on vient de créer. Le
      // laisser en place enfermerait la personne : la connexion répondrait
      // « compte incomplet » et la réinscription « adresse déjà utilisée »,
      // sans aucune issue. En le supprimant, l'adresse redevient libre et
      // un simple nouvel essai suffit.
      const annule = await deleteAuthUser(authUser.id);

      return {
        status: "error",
        message: annule
          ? "La création a échoué. Réessayez — votre adresse reste disponible."
          : "La création a échoué et n'a pas pu être annulée. Contactez le support.",
      };
    }
  }

  // Si la confirmation d'email est activée dans Supabase, aucune session
  // n'est ouverte tout de suite : on ne peut pas rediriger vers /dashboard.
  if (!data.session) {
    return {
      status: "confirm_email",
      message:
        "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
    };
  }

  redirect(ROLE_HOME.MERCHANT);
}

/**
 * cf SPEC §16 (/login). La destination dépend du rôle lu EN BASE, pas d'un
 * champ caché du formulaire.
 */
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const requestedNext = safeInternalPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    // La cause réelle est tracée pour nous : sans elle, un commerçant bloqué
    // et nous cherchons à l'aveugle. Ce qu'il voit, lui, reste volontairement
    // générique pour ne pas révéler si l'adresse existe.
    console.error("[login] échec:", error?.code ?? error?.message ?? "sans erreur");

    // Deux cas méritent un vrai message : ils ne sont pas des identifiants
    // erronés, et laisser croire le contraire envoie la personne changer un
    // mot de passe qui était bon.
    if (error?.code === "email_not_confirmed") {
      return {
        status: "error",
        message:
          "Votre adresse n'est pas encore confirmée. Cliquez sur le lien reçu par mail, puis reconnectez-vous.",
      };
    }

    if (error?.code === "over_request_rate_limit") {
      return {
        status: "error",
        message:
          "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
      };
    }

    return {
      status: "error",
      message:
        "Email ou mot de passe incorrect. Utilisez « Mot de passe oublié » si vous avez un doute.",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (!user) {
    // Compte Supabase sans enregistrement métier : état incohérent, on ferme
    // la session plutôt que de laisser passer un utilisateur sans rôle.
    //
    // Depuis l'annulation d'inscription (cf `deleteAuthUser`), cet état ne
    // devrait plus survenir : une création qui échoue ne laisse plus de
    // compte derrière elle. S'il apparaît quand même, la trace ci-dessous
    // permet de le repérer dans les logs plutôt que de le découvrir par un
    // commerçant bloqué.
    console.error(
      `[login] compte d'authentification sans enregistrement métier: ${data.user.id}`
    );
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "Ce compte n'est rattaché à aucun commerce. Créez-en un depuis la page d'inscription, ou contactez le support.",
    };
  }

  const home = ROLE_HOME[user.role];

  // On n'honore `next` que s'il correspond à l'espace du rôle réel.
  const destination =
    requestedNext && requestedNext.startsWith(home) ? requestedNext : home;

  redirect(destination);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Demande de réinitialisation du mot de passe.
 *
 * cf SPEC §18 dans l'esprit : la réponse est TOUJOURS la même, que l'adresse
 * existe ou non. Répondre « adresse inconnue » offrirait à un attaquant le
 * moyen de savoir quels commerçants sont inscrits — c'est la même raison qui
 * fait que Supabase brouille déjà l'inscription d'une adresse existante.
 *
 * Le lien reçu ramène sur /auth/reset, qui échange le code contre une session
 * de récupération avant d'ouvrir le formulaire.
 */
export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${appUrl}/auth/reset` }
  );

  if (error) {
    // Tracé pour nous, invisible pour la personne : lui dire que l'envoi a
    // échoué reviendrait à confirmer que l'adresse existe.
    console.error("[reset] envoi impossible:", error.message);
  }

  return {
    status: "sent",
    message:
      "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Pensez à regarder vos indésirables.",
  };
}

/**
 * Enregistre le nouveau mot de passe.
 *
 * Ne fonctionne qu'avec la session ouverte par le lien de récupération :
 * sans elle, `updateUser` échoue. C'est ce qui empêche quiconque d'appeler
 * cette action pour changer le mot de passe d'un autre.
 */
export async function updatePasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message:
        "Ce lien de réinitialisation a expiré. Demandez-en un nouveau depuis la page de connexion.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  redirect(record ? ROLE_HOME[record.role] : "/login");
}
