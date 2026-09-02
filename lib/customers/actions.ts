"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteAuthUser } from "@/lib/auth/admin";
import { joinProgramSchema } from "@/lib/validation/customer";
import type { FormState } from "@/lib/forms/state";

/**
 * cf SPEC §8 — Inscription du client après scan du QR du commerce.
 *
 * Le `programId` vient de l'URL du QR : il n'est PAS secret (cf SPEC §9), mais
 * il est malgré tout revérifié en base — existence et programme actif — avant
 * toute écriture. Le `visit_count` de la carte créée vaut 0 et ne pourra
 * ensuite être modifié que par `lib/loyalty/visit.ts` (cf SPEC §5).
 */
export async function joinProgramAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const programId = formData.get("programId");

  if (typeof programId !== "string" || !programId) {
    return { status: "error", message: "Programme introuvable." };
  }

  const parsed = joinProgramSchema.safeParse({
    firstName: formData.get("firstName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const program = await prisma.loyaltyProgram.findUnique({
    where: { id: programId },
  });

  if (!program || !program.active) {
    return {
      status: "error",
      message: "Ce programme de fidélité n'est plus disponible.",
    };
  }

  const { firstName, email } = parsed.data;
  const existingUser = await getCurrentUser();

  // Cas 1 — un commerçant scanne son propre QR : on refuse plutôt que de lui
  // fabriquer un profil client sur le même compte.
  if (existingUser && existingUser.role !== "CUSTOMER") {
    return {
      status: "error",
      message:
        "Vous êtes connecté avec un compte commerçant. Déconnectez-vous pour créer une carte client.",
    };
  }

  // Cas 2 — client déjà connu : on ajoute seulement la carte manquante.
  if (existingUser?.customer) {
    const membership = await prisma.loyaltyMembership.upsert({
      where: {
        customerId_programId: {
          customerId: existingUser.customer.id,
          programId: program.id,
        },
      },
      update: {},
      create: { customerId: existingUser.customer.id, programId: program.id },
    });

    revalidatePath("/customer");
    redirect(`/customer/card/${membership.id}`);
  }

  // Cas 3 — nouveau client. Session anonyme Supabase : le §8 ne demande ni
  // mot de passe ni confirmation d'email, juste un prénom.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      // Indice de rôle pour le routage du proxy uniquement — la vérité reste
      // `User.role` en base (cf proxy.ts et SPEC §18).
      data: { role: "CUSTOMER" },
    },
  });

  if (error || !data.user) {
    // Le client final n'a que faire du détail technique, mais le développeur
    // en a besoin : cause la plus fréquente = "Anonymous sign-ins" désactivé
    // dans Supabase (Authentication → Sign In / Providers).
    console.error("[join] signInAnonymously a échoué:", error?.message ?? error);

    return {
      status: "error",
      message:
        "Impossible de créer votre carte. Si le problème persiste, prévenez le commerçant.",
    };
  }

  // User + Customer + carte créés d'un bloc : Prisma exécute une écriture
  // imbriquée dans une seule transaction, donc jamais de client à moitié créé.
  let membershipId: string;
  try {
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        role: "CUSTOMER",
        customer: {
          create: {
            firstName,
            email,
            memberships: { create: { programId: program.id } },
          },
        },
      },
      include: { customer: { include: { memberships: true } } },
    });
    membershipId = user.customer!.memberships[0].id;
  } catch (error) {
    console.error("[join] création User + Customer + carte échouée:", error);

    // Même principe que pour le commerçant : on annule la session anonyme
    // qu'on vient d'ouvrir, sinon elle reste orpheline en base
    // d'authentification, sans carte associée.
    await supabase.auth.signOut();
    await deleteAuthUser(data.user.id);

    return {
      status: "error",
      message:
        "Cette adresse email est déjà utilisée. Laissez le champ vide ou utilisez-en une autre.",
    };
  }

  revalidatePath("/customer");
  redirect(`/customer/card/${membershipId}`);
}
