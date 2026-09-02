import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateProgramJoinQr } from "@/lib/qr/generate";
import { getAppUrl } from "@/lib/app-url";
import { cardTheme } from "@/lib/theme";
import { safeLogoUrl } from "@/lib/merchant/logo";
import { Poster } from "@/components/merchant/poster";

/**
 * L'affichette de comptoir, prête à imprimer.
 *
 * Elle est GÉNÉRÉE, pas dessinée une fois pour toutes : le nom du commerce,
 * la règle et le QR viennent de la base. Un commerçant qui passe de 10 à 8
 * visites réimprime et l'affichette est juste — un visuel figé aurait menti
 * dès la première modification.
 *
 * Comme partout dans le dashboard, le programme est retrouvé par le
 * `merchant.id` de la session, jamais par un identifiant d'URL (cf SPEC §18).
 */
export default async function AffichePage() {
  const { merchant } = await requireMerchant();

  const program = await prisma.loyaltyProgram.findFirst({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "asc" },
  });

  // Sans programme, il n'y a ni règle à annoncer ni QR à imprimer.
  if (!program) {
    redirect("/dashboard/program");
  }

  const appUrl = await getAppUrl();
  // 1200 px : le QR fait 55 mm sur le papier, soit ~550 dpi. Large marge,
  // volontairement — c'est le seul geste demandé au client.
  const qrDataUrl = await generateProgramJoinQr(program.id, appUrl, 1200);
  const { ink, onInk } = cardTheme(merchant.brandColor);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-5">
      <div data-hors-impression className="flex flex-col gap-5">
        <Link
          href="/dashboard/program"
          className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
        >
          ← RETOUR AU PROGRAMME
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl tracking-tight text-fg">
            Affichette de comptoir
          </h1>
          <p className="text-sm text-fg-soft">
            À poser près de la caisse. Vos clients la scannent et leur carte se
            crée sur leur téléphone, sans installer d&apos;application.
          </p>
        </div>

        {!program.active ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
            Votre programme est arrêté : personne ne pourra s&apos;inscrire en
            scannant cette affichette tant qu&apos;il ne sera pas réactivé.
          </p>
        ) : null}
      </div>

      <Poster
        merchantName={merchant.name}
        logoUrl={safeLogoUrl(merchant.logoUrl)}
        vesselShape={
          merchant.cardStyle === "VESSEL" ? merchant.vesselShape : null
        }
        visitsRequired={program.visitsRequired}
        rewardName={program.rewardName}
        qrDataUrl={qrDataUrl}
        ink={ink}
        onInk={onInk}
      />

      <div
        data-hors-impression
        className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-5"
      >
        <h2 className="font-display text-base tracking-tight text-fg">
          Conseils d&apos;impression
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-fg-soft">
          <li>
            Dans la fenêtre d&apos;impression, choisissez le format
            correspondant et réglez l&apos;échelle sur <strong>100 %</strong> :
            un ajustement automatique rétrécit le QR.
          </li>
          <li>
            Cochez « graphiques d&apos;arrière-plan » si votre navigateur le
            propose, sinon les aplats de couleur ne sortiront pas.
          </li>
          <li>
            Papier mat plutôt que brillant : un reflet sur le QR empêche
            certains téléphones de le lire.
          </li>
          <li>
            <strong>Testez le QR imprimé</strong> avec votre propre téléphone
            avant d&apos;en tirer plusieurs exemplaires.
          </li>
        </ul>
      </div>
    </main>
  );
}
