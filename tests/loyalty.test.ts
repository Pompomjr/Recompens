import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { addVisit, redeemReward } from "@/lib/loyalty/visit";
import { findMembershipByQrToken } from "@/lib/loyalty/scan";
import { updateProgram } from "@/lib/programs/update";
import { ForbiddenError } from "@/lib/auth/session";

/**
 * cf SPEC §18 — Sécurité minimale, et §11/§13 pour la logique métier.
 *
 * Ces tests tournent contre la VRAIE base : c'est le seul moyen de vérifier
 * l'atomicité et les contraintes d'unicité, qui sont des propriétés de
 * Postgres, pas du code TypeScript.
 *
 * Tout ce qui est créé ici porte un identifiant jetable et est supprimé dans
 * `afterAll` : les données de développement ne sont jamais touchées.
 */

const VISITS_REQUIRED = 3;
const COOLDOWN_MINUTES = 30;

type Fixture = {
  merchantId: string;
  ownerUserId: string;
  programId: string;
  membershipId: string;
  qrToken: string;
  // Second commerce, pour le test "Merchant A → client Merchant B".
  otherMerchantId: string;
  otherOwnerUserId: string;
  createdUserIds: string[];
};

let fixture: Fixture;

async function createMerchant(label: string) {
  const userId = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: `test-${label}-${userId}@local.test`,
      role: "MERCHANT",
      merchant: { create: { name: `Commerce test ${label}` } },
    },
    include: { merchant: true },
  });

  return { userId, merchantId: user.merchant!.id };
}

/**
 * Recule la dernière visite dans le passé pour neutraliser le délai
 * anti-cumul, quand un test a besoin d'enchaîner plusieurs visites.
 * On modifie l'horodatage, pas le compteur : la règle testée reste intacte.
 */
async function backdateLastVisit(membershipId: string) {
  const last = await prisma.transaction.findFirst({
    where: { membershipId, type: "VISIT" },
    orderBy: { createdAt: "desc" },
  });

  if (!last) return;

  await prisma.transaction.update({
    where: { id: last.id },
    data: { createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  });
}

/** Remet la carte à son état initial entre deux tests. */
async function resetMembership() {
  await prisma.transaction.deleteMany({
    where: { membershipId: fixture.membershipId },
  });
  await prisma.loyaltyMembership.update({
    where: { id: fixture.membershipId },
    data: { visitCount: 0, rewardAvailable: false },
  });
  await prisma.loyaltyProgram.update({
    where: { id: fixture.programId },
    data: { active: true, minMinutesBetweenVisits: COOLDOWN_MINUTES },
  });
}

beforeAll(async () => {
  const main = await createMerchant("A");
  const other = await createMerchant("B");

  const program = await prisma.loyaltyProgram.create({
    data: {
      merchantId: main.merchantId,
      name: "Programme de test",
      visitsRequired: VISITS_REQUIRED,
      rewardName: "1 café offert",
      minMinutesBetweenVisits: COOLDOWN_MINUTES,
    },
  });

  const customerUserId = crypto.randomUUID();
  const customer = await prisma.user.create({
    data: {
      id: customerUserId,
      email: `test-client-${customerUserId}@local.test`,
      role: "CUSTOMER",
      customer: {
        create: {
          firstName: "ClientTest",
          memberships: { create: { programId: program.id } },
        },
      },
    },
    include: { customer: { include: { memberships: true } } },
  });

  const membership = customer.customer!.memberships[0];

  fixture = {
    merchantId: main.merchantId,
    ownerUserId: main.userId,
    programId: program.id,
    membershipId: membership.id,
    qrToken: membership.qrToken,
    otherMerchantId: other.merchantId,
    otherOwnerUserId: other.userId,
    createdUserIds: [main.userId, other.userId, customerUserId],
  };
});

afterAll(async () => {
  if (fixture) {
    // Les cascades du schéma emportent merchants, programmes, cartes et
    // transactions.
    await prisma.user.deleteMany({
      where: { id: { in: fixture.createdUserIds } },
    });
  }
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetMembership();
});

describe("SPEC §11 — validation d'une visite", () => {
  it("incrémente le compteur et crée EXACTEMENT une transaction", async () => {
    const result = await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    expect(result.membership.visitCount).toBe(1);

    // cf SPEC §18 : "Chaque visite → exactement une transaction."
    const transactions = await prisma.transaction.findMany({
      where: { membershipId: fixture.membershipId },
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe("VISIT");
    expect(transactions[0].visitDelta).toBe(1);
  });

  it("débloque la récompense une fois le seuil atteint, pas avant", async () => {
    for (let i = 1; i <= VISITS_REQUIRED; i++) {
      const result = await addVisit({
        merchantId: fixture.merchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.ownerUserId,
      });

      expect(result.membership.visitCount).toBe(i);
      expect(result.membership.rewardAvailable).toBe(i >= VISITS_REQUIRED);

      await backdateLastVisit(fixture.membershipId);
    }

    const transactions = await prisma.transaction.count({
      where: { membershipId: fixture.membershipId },
    });
    expect(transactions).toBe(VISITS_REQUIRED);
  });

  it("refuse un QR inconnu", async () => {
    await expect(
      addVisit({
        merchantId: fixture.merchantId,
        qrToken: crypto.randomUUID(),
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse la visite si le programme est inactif", async () => {
    await prisma.loyaltyProgram.update({
      where: { id: fixture.programId },
      data: { active: false },
    });

    await expect(
      addVisit({
        merchantId: fixture.merchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("SPEC §18 — Merchant A → client Merchant B : impossible", () => {
  it("refuse d'ajouter une visite sur le client d'un autre commerce", async () => {
    await expect(
      addVisit({
        merchantId: fixture.otherMerchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.otherOwnerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    const count = await prisma.transaction.count({
      where: { membershipId: fixture.membershipId },
    });
    expect(count).toBe(0);
  });

  it("refuse même de LIRE la carte d'un autre commerce", async () => {
    await expect(
      findMembershipByQrToken({
        merchantId: fixture.otherMerchantId,
        qrToken: fixture.qrToken,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse d'utiliser la récompense d'un client d'un autre commerce", async () => {
    await prisma.loyaltyMembership.update({
      where: { id: fixture.membershipId },
      data: { visitCount: VISITS_REQUIRED, rewardAvailable: true },
    });

    await expect(
      redeemReward({
        merchantId: fixture.otherMerchantId,
        membershipId: fixture.membershipId,
        createdByUserId: fixture.otherOwnerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("Délai anti-cumul entre deux visites", () => {
  it("refuse une seconde visite immédiate sur la même carte", async () => {
    await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    await expect(
      addVisit({
        merchantId: fixture.merchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    // La visite refusée ne doit laisser AUCUNE trace.
    const count = await prisma.transaction.count({
      where: { membershipId: fixture.membershipId },
    });
    expect(count).toBe(1);

    const membership = await prisma.loyaltyMembership.findUnique({
      where: { id: fixture.membershipId },
    });
    expect(membership!.visitCount).toBe(1);
  });

  it("est désactivé quand le programme est réglé sur 0 minute", async () => {
    // Un commerce à forte rotation peut vouloir enchaîner les validations.
    await prisma.loyaltyProgram.update({
      where: { id: fixture.programId },
      data: { minMinutesBetweenVisits: 0 },
    });

    await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    const result = await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    expect(result.membership.visitCount).toBe(2);
  });

  it("suit la valeur propre au programme, pas une valeur globale", async () => {
    await prisma.loyaltyProgram.update({
      where: { id: fixture.programId },
      data: { minMinutesBetweenVisits: 5 },
    });

    await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    await expect(
      addVisit({
        merchantId: fixture.merchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toThrow(/moins de 5 minutes/);
  });

  it("accepte la visite suivante une fois le délai écoulé", async () => {
    await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    await backdateLastVisit(fixture.membershipId);

    const result = await addVisit({
      merchantId: fixture.merchantId,
      qrToken: fixture.qrToken,
      createdByUserId: fixture.ownerUserId,
    });

    expect(result.membership.visitCount).toBe(2);
  });
});

describe("SPEC §13 et §18 — récompense utilisable une seule fois", () => {
  beforeEach(async () => {
    await prisma.loyaltyMembership.update({
      where: { id: fixture.membershipId },
      data: { visitCount: VISITS_REQUIRED, rewardAvailable: true },
    });
  });

  it("remet le compteur à zéro et trace la remise", async () => {
    const result = await redeemReward({
      merchantId: fixture.merchantId,
      membershipId: fixture.membershipId,
      createdByUserId: fixture.ownerUserId,
    });

    expect(result.membership.visitCount).toBe(0);
    expect(result.membership.rewardAvailable).toBe(false);
    expect(result.transaction.type).toBe("REWARD_REDEEMED");
    // La remise ne retire pas de visites : elle repart de zéro (cf SPEC §13).
    expect(result.transaction.visitDelta).toBe(0);
  });

  it("refuse une seconde utilisation", async () => {
    await redeemReward({
      merchantId: fixture.merchantId,
      membershipId: fixture.membershipId,
      createdByUserId: fixture.ownerUserId,
    });

    await expect(
      redeemReward({
        merchantId: fixture.merchantId,
        membershipId: fixture.membershipId,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    // Une seule trace de remise, malgré les deux tentatives.
    const count = await prisma.transaction.count({
      where: { membershipId: fixture.membershipId, type: "REWARD_REDEEMED" },
    });
    expect(count).toBe(1);
  });

  it("refuse la remise si aucune récompense n'est disponible", async () => {
    await prisma.loyaltyMembership.update({
      where: { id: fixture.membershipId },
      data: { visitCount: 0, rewardAvailable: false },
    });

    await expect(
      redeemReward({
        merchantId: fixture.merchantId,
        membershipId: fixture.membershipId,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("SPEC §7 — modification d'un programme", () => {
  const baseArgs = () => ({
    name: "Programme de test",
    rewardName: "1 café offert",
    active: true,
  });

  it("refuse la modification d'un programme d'un autre commerce", async () => {
    await expect(
      updateProgram({
        merchantId: fixture.otherMerchantId,
        programId: fixture.programId,
        visitsRequired: 99,
        ...baseArgs(),
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    const inchange = await prisma.loyaltyProgram.findUnique({
      where: { id: fixture.programId },
    });
    expect(inchange!.visitsRequired).toBe(VISITS_REQUIRED);
  });

  it("débloque la récompense des cartes ayant déjà atteint le nouveau seuil", async () => {
    await prisma.loyaltyMembership.update({
      where: { id: fixture.membershipId },
      data: { visitCount: 2, rewardAvailable: false },
    });

    const result = await updateProgram({
      merchantId: fixture.merchantId,
      programId: fixture.programId,
      visitsRequired: 2,
      ...baseArgs(),
    });

    expect(result.rewardsUnlocked).toBe(1);

    const carte = await prisma.loyaltyMembership.findUnique({
      where: { id: fixture.membershipId },
    });
    expect(carte!.rewardAvailable).toBe(true);
  });

  it("ne reprend JAMAIS une récompense déjà gagnée quand le seuil monte", async () => {
    await prisma.loyaltyMembership.update({
      where: { id: fixture.membershipId },
      data: { visitCount: 3, rewardAvailable: true },
    });

    await updateProgram({
      merchantId: fixture.merchantId,
      programId: fixture.programId,
      visitsRequired: 50,
      ...baseArgs(),
    });

    const carte = await prisma.loyaltyMembership.findUnique({
      where: { id: fixture.membershipId },
    });
    expect(carte!.rewardAvailable).toBe(true);
  });

  it("arrête le programme sans supprimer les cartes", async () => {
    await updateProgram({
      merchantId: fixture.merchantId,
      programId: fixture.programId,
      visitsRequired: VISITS_REQUIRED,
      ...baseArgs(),
      active: false,
    });

    const programme = await prisma.loyaltyProgram.findUnique({
      where: { id: fixture.programId },
    });
    expect(programme!.active).toBe(false);

    // La carte existe toujours : arrêter n'est pas supprimer.
    const carte = await prisma.loyaltyMembership.findUnique({
      where: { id: fixture.membershipId },
    });
    expect(carte).not.toBeNull();

    // Et plus aucune visite ne peut être validée (cf addVisit).
    await expect(
      addVisit({
        merchantId: fixture.merchantId,
        qrToken: fixture.qrToken,
        createdByUserId: fixture.ownerUserId,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
