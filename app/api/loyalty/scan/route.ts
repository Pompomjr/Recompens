import { NextResponse } from "next/server";
import {
  requireMerchant,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { findMembershipByQrToken } from "@/lib/loyalty/scan";

/**
 * cf SPEC §15 — /api/loyalty/scan.
 *
 * Un layout ne protège pas une route API : `requireMerchant()` est donc
 * rappelé ici. Sans ça, n'importe qui pourrait poster un qrToken et
 * apprendre le prénom et le compteur du client (cf SPEC §18 : "Client →
 * appeler directement l'API de validation : Refusé.").
 */
export async function POST(request: Request) {
  try {
    const { merchant } = await requireMerchant();

    const body = await request.json().catch(() => null);
    const qrToken = body?.qrToken;

    if (typeof qrToken !== "string" || !qrToken.trim()) {
      return NextResponse.json(
        { error: "QR illisible. Réessayez." },
        { status: 400 }
      );
    }

    const result = await findMembershipByQrToken({
      merchantId: merchant.id,
      qrToken: qrToken.trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("[api/loyalty/scan]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
