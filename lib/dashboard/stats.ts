import { prisma } from "@/lib/db/prisma";

/**
 * Chiffres affichés en haut du dashboard (cf SPEC §6 : nombre de clients,
 * visites du jour, récompenses).
 *
 * Toutes les requêtes sont filtrées par `merchantId`, qui provient
 * exclusivement de `requireMerchant()` côté serveur — jamais d'un paramètre
 * d'URL ni d'un champ de formulaire (cf SPEC §18 : "Merchant A → client
 * Merchant B : Impossible.").
 */
export async function getMerchantDashboardStats(merchantId: string) {
  // "Visites du jour" = depuis minuit, heure du serveur.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [customerRows, visitsToday, rewardsAvailable, program] =
    await Promise.all([
      // Un client inscrit à deux programmes du même commerce ne compte qu'une
      // fois : on regroupe par customerId plutôt que de compter les cartes.
      prisma.loyaltyMembership.groupBy({
        by: ["customerId"],
        where: { program: { merchantId } },
      }),

      // cf SPEC §18 : "Chaque visite → exactement une transaction."
      // Compter les transactions VISIT est donc la source de vérité.
      prisma.transaction.count({
        where: {
          merchantId,
          type: "VISIT",
          createdAt: { gte: startOfToday },
        },
      }),

      prisma.loyaltyMembership.count({
        where: { rewardAvailable: true, program: { merchantId } },
      }),

      prisma.loyaltyProgram.findFirst({
        where: { merchantId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  return {
    customerCount: customerRows.length,
    visitsToday,
    rewardsAvailable,
    program,
  };
}
