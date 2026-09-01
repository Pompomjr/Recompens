import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/session";
import { MIN_MINUTES_BETWEEN_VISITS } from "./config";

/**
 * cf SPEC §5 (règle fondamentale) et §11 (validation).
 *
 * Chaîne obligatoire, TOUJOURS respectée par cette fonction:
 *   merchant authentifié → membership trouvé via qrToken
 *   → vérif que le membership appartient à UN programme de CE merchant
 *   → transaction DB atomique (Transaction créée + visit_count incrémenté)
 *
 * Ne jamais accepter un visit_count ou un membershipId "de confiance"
 * envoyé par le client: on ne travaille qu'à partir du qrToken scanné
 * et de l'identité du merchant authentifié côté serveur.
 */
export async function addVisit(params: {
  merchantId: string;
  qrToken: string;
  createdByUserId: string;
}) {
  const { merchantId, qrToken, createdByUserId } = params;

  const membership = await prisma.loyaltyMembership.findUnique({
    where: { qrToken },
    include: { program: true },
  });

  if (!membership) {
    throw new ForbiddenError("QR invalide ou expiré");
  }

  // cf SPEC §18: "Merchant A → client Merchant B : Impossible."
  if (membership.program.merchantId !== merchantId) {
    throw new ForbiddenError("Ce client n'appartient pas à votre commerce");
  }

  if (!membership.program.active) {
    throw new ForbiddenError("Ce programme de fidélité n'est plus actif");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Anti-cumul: une même carte ne peut pas être créditée deux fois coup sur
    // coup (cf lib/loyalty/config.ts pour le pourquoi et le réglage).
    // Le contrôle est fait DANS la transaction, au plus près de l'écriture.
    if (MIN_MINUTES_BETWEEN_VISITS > 0) {
      const lastVisit = await tx.transaction.findFirst({
        where: { membershipId: membership.id, type: "VISIT" },
        orderBy: { createdAt: "desc" },
      });

      if (lastVisit) {
        const minutesSince =
          (Date.now() - lastVisit.createdAt.getTime()) / 60_000;

        if (minutesSince < MIN_MINUTES_BETWEEN_VISITS) {
          const wait = Math.ceil(MIN_MINUTES_BETWEEN_VISITS - minutesSince);
          throw new ForbiddenError(
            `Visite déjà validée pour ce client il y a moins de ${MIN_MINUTES_BETWEEN_VISITS} minutes. Réessayez dans ${wait} min.`
          );
        }
      }
    }

    const newVisitCount = membership.visitCount + 1;
    const rewardAvailable = newVisitCount >= membership.program.visitsRequired;

    const updated = await tx.loyaltyMembership.update({
      where: { id: membership.id },
      data: {
        visitCount: newVisitCount,
        rewardAvailable,
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        membershipId: membership.id,
        merchantId,
        type: "VISIT",
        visitDelta: 1,
        description: `Visite validée — ${newVisitCount}/${membership.program.visitsRequired}`,
        createdBy: createdByUserId,
      },
    });

    return { membership: updated, transaction };
  });

  return result;
}

/**
 * cf SPEC §13. Remet le compteur à zéro et consomme la récompense.
 * Le serveur revérifie reward_available == true avant toute action
 * (cf SPEC §18: "Reward → utilisation deux fois : Impossible.").
 */
export async function redeemReward(params: {
  merchantId: string;
  membershipId: string;
  createdByUserId: string;
}) {
  const { merchantId, membershipId, createdByUserId } = params;

  const membership = await prisma.loyaltyMembership.findUnique({
    where: { id: membershipId },
    include: { program: true },
  });

  if (!membership) throw new ForbiddenError("Membership introuvable");
  if (membership.program.merchantId !== merchantId) {
    throw new ForbiddenError("Ce client n'appartient pas à votre commerce");
  }
  if (!membership.rewardAvailable) {
    throw new ForbiddenError("Aucune récompense disponible pour ce client");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loyaltyMembership.update({
      where: { id: membership.id },
      data: { visitCount: 0, rewardAvailable: false },
    });

    const transaction = await tx.transaction.create({
      data: {
        membershipId: membership.id,
        merchantId,
        type: "REWARD_REDEEMED",
        visitDelta: 0,
        description: `Récompense utilisée: ${membership.program.rewardName}`,
        createdBy: createdByUserId,
      },
    });

    return { membership: updated, transaction };
  });
}
