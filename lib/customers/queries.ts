import { prisma } from "@/lib/db/prisma";

/**
 * Les clients d'un commerce, avec leur compteur.
 *
 * cf SPEC §18 : le `merchantId` vient TOUJOURS de `requireMerchant()`, jamais
 * d'un paramètre d'URL. Un commerçant ne peut donc pas lire les clients d'un
 * autre, quelle que soit la requête qu'il fabrique.
 *
 * On lit les CARTES et non les clients : un client peut être inscrit à
 * plusieurs programmes du même commerce, et c'est bien la carte qui porte le
 * compteur. La liste est ordonnée par dernière visite, parce que la question
 * du commerçant n'est pas « qui sont mes clients » mais « qui revient ».
 */
export async function getMerchantCustomers(merchantId: string) {
  const memberships = await prisma.loyaltyMembership.findMany({
    where: { program: { merchantId } },
    include: {
      customer: true,
      program: true,
      // La date de la dernière visite ne se déduit pas du compteur : une
      // récompense remise ne change pas `visitCount`.
      transactions: {
        where: { type: "VISIT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return memberships.map((membership) => ({
    id: membership.id,
    firstName: membership.customer.firstName,
    email: membership.customer.email,
    visitCount: membership.visitCount,
    visitsRequired: membership.program.visitsRequired,
    rewardAvailable: membership.rewardAvailable,
    programName: membership.program.name,
    derniereVisite: membership.transactions[0]?.createdAt ?? null,
    inscritLe: membership.createdAt,
  }));
}
