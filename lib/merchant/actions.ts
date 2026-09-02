"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireMerchant } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms/state";
import {
  uploadMerchantLogo,
  deleteMerchantLogo,
  MAX_LOGO_BYTES,
  LOGO_TYPES,
} from "./storage";

/**
 * Envoi ou remplacement du logo du commerce.
 *
 * Comme partout, le commerce vient de `requireMerchant()` et jamais du
 * formulaire (cf SPEC §18) : le chemin de stockage en découle, donc un
 * commerçant ne peut écrire que sur son propre fichier.
 */
export async function updateMerchantLogoAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { merchant } = await requireMerchant();

  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choisissez une image." };
  }

  if (!LOGO_TYPES.includes(file.type as (typeof LOGO_TYPES)[number])) {
    return {
      status: "error",
      message: "Format accepté : PNG, JPEG ou WEBP.",
    };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return {
      status: "error",
      message: `Image trop lourde (${Math.round(
        file.size / 1024 / 1024
      )} Mo). Maximum 2 Mo.`,
    };
  }

  const envoi = await uploadMerchantLogo(merchant.id, file);

  if (!envoi.ok) {
    return { status: "error", message: envoi.message };
  }

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: { logoUrl: envoi.url },
  });

  // Le logo apparaît dans l'en-tête du dashboard et sur l'affichette : les
  // deux doivent se rafraîchir, pas seulement la page des paramètres.
  revalidatePath("/dashboard", "layout");

  return { status: "success", message: "Logo enregistré." };
}

/**
 * Retrait du logo. La carte et l'affichette retombent sur l'initiale du nom.
 */
export async function removeMerchantLogoAction(): Promise<void> {
  const { merchant } = await requireMerchant();

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: { logoUrl: null },
  });

  await deleteMerchantLogo(merchant.id);

  revalidatePath("/dashboard", "layout");
}
