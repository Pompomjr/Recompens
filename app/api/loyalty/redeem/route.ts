import { NextResponse } from "next/server";
import {
  requireMerchant,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { redeemReward } from "@/lib/loyalty/visit";
import { findMembershipById } from "@/lib/loyalty/scan";

/**
 * cf SPEC §15 — /api/loyalty/redeem, et §13 — Utilisation de la récompense.
 *
 * Comme pour la visite, aucune logique métier ici : `redeemReward()` revérifie
 * lui-même `reward_available == true` avant d'agir, dans la même transaction
 * que la remise à zéro du compteur. C'est ce qui rend impossible la double
 * utilisation (cf SPEC §18 : "Reward → utilisation deux fois : Impossible.").
 *
 * Concrètement : deux clics simultanés partent, le premier consomme la
 * récompense, le second trouve `reward_available == false` et est refusé.
 */
export async function POST(request: Request) {
  try {
    const { user, merchant } = await requireMerchant();

    const body = await request.json().catch(() => null);
    const membershipId = body?.membershipId;

    if (typeof membershipId !== "string" || !membershipId.trim()) {
      return NextResponse.json(
        { error: "Carte introuvable. Rescannez le client." },
        { status: 400 }
      );
    }

    await redeemReward({
      merchantId: merchant.id,
      membershipId: membershipId.trim(),
      createdByUserId: user.id,
    });

    const updated = await findMembershipById({
      merchantId: merchant.id,
      membershipId: membershipId.trim(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("[api/loyalty/redeem]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
