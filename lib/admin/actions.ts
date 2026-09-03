"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import type { FormState } from "@/lib/forms/state";

/**
 * Réglages d'exploitation d'un commerce.
 *
 * Ce sont les réglages que le COMMERÇANT ne décide pas : style de carte,
 * silhouette, couleur, délai anti-cumul. Ils vivaient jusqu'ici dans le Table
 * Editor de Supabase, ce qui rendait chaque installation dépendante d'un accès
 * à la base — le vrai goulot pour passer de trois commerces à dix.
 *
 * `requireAdmin()` est appelé ici et pas seulement dans la page : une Server
 * Action est une porte d'entrée à part entière, un layout ne la protège pas
 * (cf SPEC §18).
 */

const schema = z.object({
  merchantId: z.string().uuid("Commerce introuvable"),
  cardStyle: z.enum(["TICKET", "VESSEL"]),
  vesselShape: z
    .union([z.literal(""), z.enum(["CUP", "PASTA", "SANDWICH"])])
    .transform((v) => (v ? v : null)),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur attendue au format #RRGGBB"),
  qrOrnementLogo: z.boolean(),
  minMinutesBetweenVisits: z
    .number()
    .int("Le délai doit être un nombre entier de minutes")
    .min(0, "Le délai ne peut pas être négatif")
    .max(1440, "Le délai ne peut pas dépasser 24 heures"),
});

export async function updateMerchantSettingsAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    merchantId: formData.get("merchantId"),
    cardStyle: formData.get("cardStyle"),
    vesselShape: formData.get("vesselShape"),
    brandColor: formData.get("brandColor"),
    qrOrnementLogo: formData.get("qrOrnementLogo") === "on",
    minMinutesBetweenVisits: Number(formData.get("minMinutesBetweenVisits")),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // VESSEL sans silhouette retomberait sur TICKET côté carte : plutôt que de
  // laisser un réglage qui ment, on le refuse ici.
  if (data.cardStyle === "VESSEL" && !data.vesselShape) {
    return {
      status: "error",
      message: "Le style « contenant » demande une silhouette.",
    };
  }

  await prisma.merchant.update({
    where: { id: data.merchantId },
    data: {
      cardStyle: data.cardStyle,
      vesselShape: data.vesselShape,
      brandColor: data.brandColor,
      qrOrnementLogo: data.qrOrnementLogo,
    },
  });

  // Le délai vit sur le PROGRAMME, pas sur le commerce : c'est la règle du
  // programme, et un commerce pourra un jour en avoir plusieurs.
  await prisma.loyaltyProgram.updateMany({
    where: { merchantId: data.merchantId },
    data: { minMinutesBetweenVisits: data.minMinutesBetweenVisits },
  });

  revalidatePath("/admin");
  // La carte du client et l'affichette changent d'aspect : leurs pages sont
  // dynamiques, mais le dashboard du commerçant est mis en cache par route.
  revalidatePath("/dashboard", "layout");

  return { status: "success", message: "Réglages enregistrés." };
}
