"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireMerchant, ForbiddenError } from "@/lib/auth/session";
import {
  createProgramSchema,
  updateProgramSchema,
} from "@/lib/validation/program";
import { DEFAULT_MIN_MINUTES_BETWEEN_VISITS } from "@/lib/loyalty/config";
import { updateProgram } from "./update";
import type { FormState } from "@/lib/forms/state";

/**
 * cf SPEC §7 — Création du programme de fidélité.
 *
 * Le `merchantId` n'est JAMAIS lu depuis le formulaire : il vient de
 * `requireMerchant()`, donc de la session serveur. Sans ça, n'importe qui
 * pourrait créer un programme au nom d'un autre commerce (cf SPEC §18 :
 * "Merchant A → client Merchant B : Impossible.").
 */
export async function createProgramAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { merchant } = await requireMerchant();

  const parsed = createProgramSchema.safeParse({
    name: formData.get("name"),
    visitsRequired: formData.get("visitsRequired"),
    rewardName: formData.get("rewardName"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  // V0.1 : un seul programme par commerce. Le schéma en autorise plusieurs,
  // mais le parcours du §7 comme le dashboard du §6 en supposent un seul.
  const existing = await prisma.loyaltyProgram.findFirst({
    where: { merchantId: merchant.id },
  });

  if (existing) {
    return {
      status: "error",
      message: "Votre commerce a déjà un programme de fidélité.",
    };
  }

  await prisma.loyaltyProgram.create({
    data: {
      merchantId: merchant.id,
      name: parsed.data.name,
      visitsRequired: parsed.data.visitsRequired,
      rewardName: parsed.data.rewardName,
      // Réglage d'exploitation, pas un choix du commerçant : il n'apparaît
      // dans aucun formulaire. L'ajustement par commerce se fait à la main
      // dans Supabase (cf lib/loyalty/config.ts).
      minMinutesBetweenVisits: DEFAULT_MIN_MINUTES_BETWEEN_VISITS,
    },
  });

  // Le dashboard affiche le programme actif : son cache doit être invalidé.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");

  redirect("/dashboard/program");
}

/**
 * Modification d'un programme.
 *
 * Le programme est retrouvé par son id, mais on vérifie ensuite qu'il
 * appartient bien au commerce authentifié (cf SPEC §18) : sans ce contrôle,
 * un commerçant pourrait modifier les règles d'un concurrent en changeant un
 * identifiant dans le formulaire.
 *
 * Effet de bord assumé : changer le nombre de visites requis touche les
 * cartes DÉJÀ en cours. La règle retenue est écrite dans `syncRewards()`.
 */
export async function updateProgramAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { merchant } = await requireMerchant();

  const programId = formData.get("programId");
  if (typeof programId !== "string" || !programId) {
    return { status: "error", message: "Programme introuvable." };
  }

  const parsed = updateProgramSchema.safeParse({
    name: formData.get("name"),
    visitsRequired: formData.get("visitsRequired"),
    rewardName: formData.get("rewardName"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  try {
    await updateProgram({
      merchantId: merchant.id,
      programId,
      name: parsed.data.name,
      visitsRequired: parsed.data.visitsRequired,
      rewardName: parsed.data.rewardName,
      active: parsed.data.active,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", message: error.message };
    }
    console.error("[programme] modification échouée:", error);
    return {
      status: "error",
      message: "La modification a échoué. Réessayez.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");

  return { status: "idle" };
}
