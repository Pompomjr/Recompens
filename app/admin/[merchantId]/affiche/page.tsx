import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateProgramJoinQr } from "@/lib/qr/generate";
import { getAppUrl } from "@/lib/app-url";
import { cardTheme } from "@/lib/theme";
import { safeLogoUrl } from "@/lib/merchant/logo";
import { Poster } from "@/components/merchant/poster";

/**
 * L'affichette d'un commerce, vue depuis l'exploitation.
 *
 * Elle existe parce qu'un commerce TRANSFÉRÉ n'est plus accessible depuis
 * /dashboard : le compte appartient au commerçant. Or c'est justement après
 * l'installation qu'on a besoin de réimprimer — une affichette tachée, un
 * second point de vente, un changement de couleur.
 *
 * C'est la seule chose de l'espace commerçant reprise ici, et volontairement :
 * le programme, le logo et les clients appartiennent au commerçant. Lui
 * reprendre la main dessus depuis l'exploitation serait commode aujourd'hui et
 * malsain dès le dixième commerce.
 *
 * Contrairement au dashboard, le `merchantId` vient ICI de l'URL — c'est tout
 * l'objet de la page. `requireAdmin()` est donc la seule barrière, et elle
 * suffit : un commerçant qui devinerait l'adresse est renvoyé à l'accueil.
 */
export default async function AdminAffichePage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login?next=/admin");
    if (error instanceof ForbiddenError) redirect("/");
    throw error;
  }

  const { merchantId } = await params;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { programs: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  if (!merchant) notFound();

  const program = merchant.programs[0];
  if (!program) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-5">
        <Link
          href="/admin"
          className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
        >
          ← RETOUR À L&apos;EXPLOITATION
        </Link>
        <h1 className="font-display text-2xl tracking-tight text-fg">
          {merchant.name}
        </h1>
        <p className="rounded-xl border border-dashed border-line p-5 text-sm text-fg-faint">
          Ce commerce n&apos;a pas encore de programme : il n&apos;y a ni règle à
          annoncer ni QR à imprimer.
        </p>
      </main>
    );
  }

  const appUrl = await getAppUrl();
  const qrDataUrl = await generateProgramJoinQr(program.id, appUrl, 1200);
  const { ink, onInk } = cardTheme(merchant.brandColor);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-5">
      <div data-hors-impression className="flex flex-col gap-3">
        <Link
          href="/admin"
          className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
        >
          ← RETOUR À L&apos;EXPLOITATION
        </Link>
        <h1 className="font-display text-2xl tracking-tight text-fg">
          Affichette — {merchant.name}
        </h1>
        {!program.active ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
            Programme arrêté : personne ne pourra s&apos;inscrire en scannant
            cette affichette.
          </p>
        ) : null}
      </div>

      <Poster
        merchantName={merchant.name}
        logoUrl={safeLogoUrl(merchant.logoUrl)}
        vesselShape={
          merchant.cardStyle === "VESSEL" ? merchant.vesselShape : null
        }
        ornementLogo={merchant.qrOrnementLogo}
        visitsRequired={program.visitsRequired}
        rewardName={program.rewardName}
        qrDataUrl={qrDataUrl}
        ink={ink}
        onInk={onInk}
      />
    </main>
  );
}
