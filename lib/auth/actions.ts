"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";
import { prisma } from "@/lib/db/prisma";
import { loginSchema, registerMerchantSchema } from "@/lib/validation/auth";
import { ROLE_HOME, type AppRole } from "./roles";
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
    } catch {
      return {
        status: "error",
        message:
          "Le compte d'authentification a été créé mais pas le commerce. Contactez le support.",
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
    // Message volontairement générique : ne pas révéler si l'email existe.
    return { status: "error", message: "Email ou mot de passe incorrect." };
  }

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (!user) {
    // Compte Supabase sans enregistrement métier : état incohérent, on ferme
    // la session plutôt que de laisser passer un utilisateur sans rôle.
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Ce compte est incomplet. Contactez le support.",
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
