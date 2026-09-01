import { NextResponse } from "next/server";
import {
  requireMerchant,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { addVisit } from "@/lib/loyalty/visit";
import { findMembershipByQrToken } from "@/lib/loyalty/scan";

/**
 * cf SPEC §15 — /api/loyalty/visit, et §11 — Validation.
 *
 * Cette route ne contient AUCUNE logique métier : elle authentifie, puis
 * délègue à `addVisit()`, seul endroit autorisé à toucher `visit_count`
 * (cf SPEC §5). L'atomicité (Transaction créée + compteur incrémenté) est
 * garantie là-bas, pas ici.
 *
 * On ne reçoit que le `qrToken` scanné : jamais un `membershipId` ni un
 * compteur envoyé par le client (cf SPEC §18).
 */
export async function POST(request: Request) {
  try {
    const { user, merchant } = await requireMerchant();

    const body = await request.json().catch(() => null);
    const qrToken = body?.qrToken;

    if (typeof qrToken !== "string" || !qrToken.trim()) {
      return NextResponse.json(
        { error: "QR illisible. Réessayez." },
        { status: 400 }
      );
    }

    await addVisit({
      merchantId: merchant.id,
      qrToken: qrToken.trim(),
      createdByUserId: user.id,
    });

    // On renvoie la carte dans le même format que /api/loyalty/scan, pour que
    // l'écran de scan n'ait qu'à remplacer ce qu'il affiche.
    const updated = await findMembershipByQrToken({
      merchantId: merchant.id,
      qrToken: qrToken.trim(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // Couvre aussi le refus du délai anti-cumul (cf lib/loyalty/config.ts).
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("[api/loyalty/visit]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
