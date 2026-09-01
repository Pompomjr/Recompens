import { prisma } from "@/lib/db/prisma";

/**
 * cf SPEC §14 — Historique.
 *
 * La table `Transaction` est l'historique immuable (§4) : on la LIT, on ne la
 * modifie ni ne la supprime jamais. C'est elle qui fait foi, pas le compteur
 * de la carte — un compteur peut être remis à zéro par une récompense (§13),
 * la trace des visites, elle, reste.
 */

/**
 * Historique du commerçant. Scopé par `merchantId`, qui vient de
 * `requireMerchant()` : un commerçant ne voit jamais les opérations d'un autre
 * (cf SPEC §18).
 *
 * Le `merchantId` dénormalisé sur `Transaction` permet ce filtrage sans
 * remonter toute la chaîne membership → programme → commerce.
 */
export async function getMerchantTransactions(
  merchantId: string,
  take = 100
) {
  return prisma.transaction.findMany({
    where: { merchantId },
    include: { membership: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Activité d'une carte, pour la vue client (§14 : "Le client doit pouvoir
 * voir son activité.").
 *
 * L'appelant DOIT avoir vérifié au préalable que la carte appartient bien au
 * client authentifié — cette fonction ne fait que lire.
 */
export async function getMembershipTransactions(
  membershipId: string,
  take = 50
) {
  return prisma.transaction.findMany({
    where: { membershipId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
