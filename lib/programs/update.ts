import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/session";

/**
 * Modification d'un programme existant.
 *
 * Comme `addVisit`, la logique vit ici et non dans la Server Action : c'est
 * ce qui la rend testable et ce qui garantit qu'un seul endroit décide.
 *
 * cf SPEC §18 : le programme est retrouvé par son id, mais on vérifie qu'il
 * appartient bien au commerce authentifié. Sans ce contrôle, un commerçant
 * modifierait les règles d'un concurrent en changeant un identifiant dans le
 * formulaire.
 */
export async function updateProgram(params: {
  merchantId: string;
  programId: string;
  name: string;
  visitsRequired: number;
  rewardName: string;
  active: boolean;
}) {
  const { merchantId, programId, name, visitsRequired, rewardName, active } =
    params;

  const program = await prisma.loyaltyProgram.findUnique({
    where: { id: programId },
  });

  if (!program || program.merchantId !== merchantId) {
    throw new ForbiddenError("Ce programme n'appartient pas à votre commerce");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loyaltyProgram.update({
      where: { id: program.id },
      data: { name, visitsRequired, rewardName, active },
    });

    // Les cartes en cours doivent refléter le nouveau seuil, sinon un client
    // ayant déjà assez de visites resterait bloqué sans récompense.
    //
    // RÈGLE : on peut DÉBLOQUER une récompense, jamais en retirer une.
    // Un commerçant qui relève son seuil ne reprend pas ce qu'un client a
    // déjà gagné — c'est une promesse tenue, pas un solde à ajuster. D'où le
    // filtre `rewardAvailable: false` : les récompenses déjà acquises ne sont
    // pas touchées.
    const debloquees = await tx.loyaltyMembership.updateMany({
      where: {
        programId: program.id,
        rewardAvailable: false,
        visitCount: { gte: visitsRequired },
      },
      data: { rewardAvailable: true },
    });

    return { program: updated, rewardsUnlocked: debloquees.count };
  });
}
