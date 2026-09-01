"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireMerchant } from "@/lib/auth/session";
import { createProgramSchema } from "@/lib/validation/program";
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
    },
  });

  // Le dashboard affiche le programme actif : son cache doit être invalidé.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");

  redirect("/dashboard/program");
}
