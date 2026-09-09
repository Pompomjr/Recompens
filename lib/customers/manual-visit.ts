"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMerchant, ForbiddenError } from "@/lib/auth/session";
import { addForgottenVisit } from "@/lib/loyalty/visit";
import type { FormState } from "@/lib/forms/state";

/**
 * Rattraper une visite oubliée, depuis l'écran Clients.
 *
 * Le `merchantId` vient de `requireMerchant()`, jamais du formulaire : le
 * `membershipId` posté ne sert qu'à désigner la carte, et son appartenance est
 * revérifiée en base (cf SPEC §18).
 */
export async function addForgottenVisitAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user, merchant } = await requireMerchant();

  const parsed = z
    .string()
    .uuid("Carte introuvable")
    .safeParse(formData.get("membershipId"));

  if (!parsed.success) {
    return { status: "error", message: "Carte introuvable." };
  }

  try {
    const { membership } = await addForgottenVisit({
      merchantId: merchant.id,
      membershipId: parsed.data,
      createdByUserId: user.id,
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: membership.rewardAvailable
        ? "Visite ajoutée — la récompense est débloquée."
        : "Visite ajoutée.",
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", message: error.message };
    }
    console.error("[rattrapage] ajout impossible:", error);
    return { status: "error", message: "L'ajout a échoué. Réessayez." };
  }
}
