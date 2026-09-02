"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { requireCustomer } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/app-url";
import type { FormState } from "@/lib/forms/state";
import { z } from "zod";

/**
 * Rattacher une adresse email à une carte, et la retrouver plus tard.
 *
 * Le problème : un client est une session ANONYME Supabase. Son identité tient
 * à un cookie, et rien d'autre. « Ajouter à l'écran d'accueil » protège le cas
 * courant, pas le téléphone changé ni les cookies effacés.
 *
 * La solution passe par Supabase plutôt que par un jeton maison : on rattache
 * l'adresse au compte anonyme existant, ce qui le rend permanent SANS créer un
 * second compte ni casser les cartes déjà en cours. La reconnexion se fait
 * ensuite par lien magique. Aucun mot de passe n'est demandé au client — le
 * §8 n'en veut pas, et un mot de passe pour une carte de fidélité ne serait
 * jamais retenu.
 */

const emailSchema = z.email("Adresse email invalide");

/**
 * Étape 1 — le client donne son adresse. Supabase lui envoie un lien de
 * confirmation ; tant qu'il n'a pas cliqué, l'adresse n'est pas rattachée.
 */
export async function attacherEmailAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { customer } = await requireCustomer();

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const email = parsed.data.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${appUrl}/auth/confirm` }
  );

  if (error) {
    console.error("[recuperation] rattachement impossible:", error.code ?? error.message);

    // Le seul cas que le client peut corriger lui-même.
    if (error.code === "email_exists") {
      return {
        status: "error",
        message:
          "Cette adresse est déjà utilisée. Utilisez « J'ai perdu ma carte » pour la retrouver.",
      };
    }

    return {
      status: "error",
      message: "Impossible d'enregistrer cette adresse. Réessayez plus tard.",
    };
  }

  // L'adresse est notée côté métier tout de suite, pour que le commerçant
  // puisse joindre son client ; l'identifiant d'authentification, lui, ne
  // basculera qu'une fois le lien cliqué.
  await prisma.customer.update({
    where: { id: customer.id },
    data: { email },
  });

  revalidatePath("/customer");

  return {
    status: "success",
    message:
      "Vérifiez votre boîte mail : le lien reçu rattachera définitivement votre carte à cette adresse.",
  };
}

/**
 * Étape 2 — le client a perdu sa carte et redonne son adresse. Un lien magique
 * lui rouvre SA session.
 *
 * `shouldCreateUser: false` est essentiel : sans lui, une adresse inconnue
 * créerait un compte vide, et la personne se retrouverait connectée à une
 * page « aucune carte » sans comprendre pourquoi.
 */
export async function retrouverCarteAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const email = parsed.data.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${appUrl}/auth/confirm`,
    },
  });

  if (error) {
    console.error("[recuperation] lien magique impossible:", error.code ?? error.message);
  }

  // Réponse identique que l'adresse existe ou non : dire « cette adresse est
  // inconnue » permettrait à n'importe qui de tester des adresses et de savoir
  // qui est client de quel commerce.
  return {
    status: "success",
    message:
      "Si une carte est rattachée à cette adresse, vous venez de recevoir un lien pour la retrouver.",
  };
}
