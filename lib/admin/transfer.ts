"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { adminConfig } from "@/lib/supabase/admin-config";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { getAppUrl } from "@/lib/app-url";
import type { FormState } from "@/lib/forms/state";

/**
 * Remise du commerce à son propriétaire.
 *
 * Le scénario réel : on prépare un commerce à l'avance — nom, règle, logo,
 * affichette imprimée — puis on l'installe devant le commerçant. S'il créait
 * son compte lui-même à ce moment-là, il obtiendrait un NOUVEAU programme,
 * donc un nouveau QR, et l'affichette déjà posée sur son comptoir ne
 * vaudrait plus rien.
 *
 * On transfère donc le compte existant plutôt que d'en créer un second :
 * l'identifiant du programme ne bouge pas, le QR imprimé reste valable, et le
 * commerce démarre le jour même.
 *
 * L'exploitant ne choisit JAMAIS le mot de passe du commerçant : on bascule
 * l'adresse, et c'est le commerçant qui définit le sien via « mot de passe
 * oublié ». Personne ne connaît le mot de passe de personne.
 */

const schema = z.object({
  merchantId: z.string().uuid("Commerce introuvable"),
  email: z.email("Adresse email invalide"),
  reinitialiser: z.boolean(),
  envoyerLien: z.boolean(),
  confirmation: z.literal(true, {
    message: "Cochez la case de confirmation avant de transférer.",
  }),
});

export async function transferMerchantAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    merchantId: formData.get("merchantId"),
    email: formData.get("email"),
    reinitialiser: formData.get("reinitialiser") === "on",
    envoyerLien: formData.get("envoyerLien") === "on",
    confirmation: formData.get("confirmation") === "on",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { merchantId, email: brut, reinitialiser, envoyerLien } = parsed.data;
  const email = brut.trim().toLowerCase();

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { owner: true },
  });

  if (!merchant) {
    return { status: "error", message: "Commerce introuvable." };
  }

  if (merchant.owner.email?.toLowerCase() === email) {
    return {
      status: "error",
      message: "Ce commerce appartient déjà à cette adresse.",
    };
  }

  const config = adminConfig();
  if (!config.ok) return { status: "error", message: config.message };

  // L'adresse d'authentification d'abord : c'est la seule étape qui peut
  // échouer pour une raison extérieure (adresse déjà prise). La faire en
  // premier évite d'effacer des clients pour un transfert qui n'aboutira pas.
  const reponse = await fetch(
    `${config.base}/auth/v1/admin/users/${merchant.ownerId}`,
    {
      method: "PUT",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
      },
      // `email_confirm` évite d'envoyer un mail de confirmation de changement
      // d'adresse : le commerçant est devant nous, et il prouvera l'accès à sa
      // boîte en demandant son mot de passe dans la minute qui suit.
      body: JSON.stringify({ email, email_confirm: true }),
    }
  );

  if (!reponse.ok) {
    const detail = await reponse.text();
    console.error(
      `[transfert] changement d'adresse refusé : HTTP ${reponse.status} — ${detail}`
    );

    return {
      status: "error",
      message: detail.includes("already been registered")
        ? "Cette adresse a déjà un compte Recompens. Utilisez-en une autre, ou supprimez l'ancien compte."
        : `Le transfert a échoué (erreur ${reponse.status}).`,
    };
  }

  await prisma.user.update({
    where: { id: merchant.ownerId },
    data: { email },
  });

  let cartesEffacees = 0;

  if (reinitialiser) {
    // Les CARTES du commerce, pas les clients : un client peut avoir des
    // cartes ailleurs, les supprimer le priverait des autres.
    await prisma.transaction.deleteMany({ where: { merchantId } });
    const { count } = await prisma.loyaltyMembership.deleteMany({
      where: { program: { merchantId } },
    });
    cartesEffacees = count;
  }

  // Le lien de mot de passe, envoyé dans la foulée.
  //
  // Sans lui, il reste au commerçant à trouver « Mot de passe oublié » sur la
  // page de connexion — l'étape la plus fragile de l'installation, celle qu'on
  // finit par faire à sa place sur son téléphone. Ici on sait que le compte
  // existe : l'échec est donc RAPPORTÉ, contrairement à /forgot-password où le
  // message reste volontairement identique dans tous les cas.
  let lien = "";

  if (envoyerLien) {
    const supabase = await createSupabaseServerClient();
    const appUrl = await getAppUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset`,
    });

    if (error) {
      console.error(
        "[transfert] envoi du lien impossible:",
        error.code ?? error.message
      );
      // Supabase n'accepte qu'un envoi par minute et par adresse : le cas le
      // plus probable, et le seul que l'exploitant peut corriger en attendant.
      lien =
        error.code === "over_email_send_rate_limit"
          ? " Le lien n'a PAS été envoyé (trop de demandes pour cette adresse) : réessayez dans une minute depuis la page de connexion."
          : " Le lien n'a PAS été envoyé — faites-lui utiliser « Mot de passe oublié ».";
    } else {
      lien = " Le lien pour choisir son mot de passe vient de lui être envoyé.";
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard", "layout");

  return {
    status: "success",
    message:
      `${merchant.name} appartient maintenant à ${email}` +
      (reinitialiser ? ` — ${cartesEffacees} carte(s) de test effacée(s)` : "") +
      `.` +
      lien,
  };
}
