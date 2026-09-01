import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

type MembershipWithRelations = Prisma.LoyaltyMembershipGetPayload<{
  include: { customer: true; program: true };
}>;

/**
 * Réponse volontairement minimale : rien de plus que ce que le §10 demande
 * d'afficher au commerçant (nom du client, compteur actuel). Ni email, ni
 * identifiant technique du client, ni historique.
 */
function toScanResult(membership: MembershipWithRelations) {
  return {
    membershipId: membership.id,
    firstName: membership.customer.firstName,
    visitCount: membership.visitCount,
    visitsRequired: membership.program.visitsRequired,
    rewardAvailable: membership.rewardAvailable,
    rewardName: membership.program.rewardName,
  };
}

export type ScanResult = ReturnType<typeof toScanResult>;

/**
 * Contrôles communs à toute lecture de carte par un commerçant.
 * cf SPEC §18 : "Merchant A → client Merchant B : Impossible."
 */
function assertBelongsToMerchant(
  membership: MembershipWithRelations | null,
  merchantId: string
): MembershipWithRelations {
  if (!membership) {
    throw new ForbiddenError("QR invalide ou expiré");
  }
  if (membership.program.merchantId !== merchantId) {
    throw new ForbiddenError("Ce client n'appartient pas à votre commerce");
  }
  if (!membership.program.active) {
    throw new ForbiddenError("Ce programme de fidélité n'est plus actif");
  }
  return membership;
}

/**
 * cf SPEC §10 — Scanner.
 *
 * "Le serveur récupère le membership. Il vérifie : merchant connecté,
 * membership existe, membership appartient au programme du merchant."
 *
 * Lecture seule : l'écriture reste l'affaire exclusive de `addVisit()` et
 * `redeemReward()` (cf SPEC §5).
 */
export async function findMembershipByQrToken(params: {
  merchantId: string;
  qrToken: string;
}) {
  const membership = await prisma.loyaltyMembership.findUnique({
    where: { qrToken: params.qrToken },
    include: { customer: true, program: true },
  });

  return toScanResult(assertBelongsToMerchant(membership, params.merchantId));
}

/**
 * Même lecture, à partir de l'identifiant de carte — utilisé après une remise
 * de récompense, qui travaille sur le membershipId (cf SPEC §13).
 */
export async function findMembershipById(params: {
  merchantId: string;
  membershipId: string;
}) {
  const membership = await prisma.loyaltyMembership.findUnique({
    where: { id: params.membershipId },
    include: { customer: true, program: true },
  });

  return toScanResult(assertBelongsToMerchant(membership, params.merchantId));
}
