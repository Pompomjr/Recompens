import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateCustomerQr } from "@/lib/qr/generate";
import { getMembershipTransactions } from "@/lib/transactions/queries";
import { LoyaltyCard } from "@/components/customer/loyalty-card";
import { safeLogoUrl } from "@/lib/merchant/logo";
import { GarderCarte } from "@/components/customer/garder-carte";
import { BrandMarkSolid } from "@/components/brand/logo";
import { VesselCard } from "@/components/customer/vessel-card";
import {
  formatDate,
  formatTime,
  formatTransactionType,
  formatVisitDelta,
  isWithin,
} from "@/lib/format";

/** Une visite validée dans les deux dernières minutes anime le dernier tampon. */
const STAMP_ANIMATION_WINDOW_MS = 2 * 60 * 1000;

/**
 * cf SPEC §8 — la carte de fidélité du client, et §14 — son activité.
 *
 * Sécurité (cf SPEC §18) : la carte est retrouvée par son id d'URL, mais on
 * vérifie ensuite qu'elle appartient bien au client authentifié. Sans ce
 * contrôle, changer l'identifiant dans la barre d'adresse afficherait la
 * carte de quelqu'un d'autre.
 *
 * Rappel §3 : le client ne peut que CONSULTER. Cette page n'expose donc
 * aucune action modifiant le compteur.
 */
export default async function CustomerCardPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const { customer } = await requireCustomer();

  const membership = await prisma.loyaltyMembership.findUnique({
    where: { id: membershipId },
    include: { program: { include: { merchant: true } } },
  });

  if (!membership || membership.customerId !== customer.id) {
    notFound();
  }

  const { program } = membership;
  const { merchant } = program;

  // L'historique n'est chargé qu'après la vérification d'appartenance.
  const [qrDataUrl, transactions] = await Promise.all([
    generateCustomerQr(membership.qrToken),
    getMembershipTransactions(membership.id),
  ]);

  const lastVisit = transactions.find((t) => t.type === "VISIT");
  const justStamped =
    lastVisit !== undefined &&
    isWithin(lastVisit.createdAt, STAMP_ANIMATION_WINDOW_MS);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 p-5">
      <Link
        href="/customer"
        className="font-mono text-[11px] tracking-[0.16em] text-paper/50 underline"
      >
        ← MES CARTES
      </Link>

      {/* Le style est un réglage du commerce. VESSEL sans silhouette
          retombe sur TICKET : un réglage incomplet ne casse jamais la carte
          d'un client. */}
      {merchant.cardStyle === "VESSEL" && merchant.vesselShape ? (
        <VesselCard
          merchantName={merchant.name}
          logoUrl={safeLogoUrl(merchant.logoUrl)}
          brandColor={merchant.brandColor}
          shape={merchant.vesselShape}
          visitCount={membership.visitCount}
          visitsRequired={program.visitsRequired}
          rewardName={program.rewardName}
          rewardAvailable={membership.rewardAvailable}
          qrDataUrl={qrDataUrl}
          justStamped={justStamped}
        />
      ) : (
        <LoyaltyCard
          merchantName={merchant.name}
          logoUrl={safeLogoUrl(merchant.logoUrl)}
          brandColor={merchant.brandColor}
          firstName={customer.firstName}
          cardNumber={membership.id.slice(0, 4).toUpperCase()}
          memberSince={formatDate(membership.createdAt).slice(3)}
          visitCount={membership.visitCount}
          visitsRequired={program.visitsRequired}
          rewardName={program.rewardName}
          rewardAvailable={membership.rewardAvailable}
          qrDataUrl={qrDataUrl}
          justStamped={justStamped}
        />
      )}

      {/* Juste sous la carte : c'est le moment où le client la regarde, donc
          le seul où lui proposer de la garder a une chance d'aboutir. */}
      <GarderCarte />

      {/* cf SPEC §14 — activité du client. Lecture seule. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.16em] text-paper/45">
          MON ACTIVITÉ
        </h2>

        {transactions.length === 0 ? (
          <p className="border border-dashed border-paper/20 p-4 text-sm text-paper/45">
            Votre première visite apparaîtra ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-px overflow-hidden">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 bg-paper/5 px-4 py-3"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-paper">
                    {formatTransactionType(transaction.type)}
                  </span>
                  <span className="font-mono text-[11px] tracking-wide text-paper/40">
                    {formatDate(transaction.createdAt)} —{" "}
                    {formatTime(transaction.createdAt)}
                  </span>
                </span>
                <span className="font-display text-base text-paper/80">
                  {formatVisitDelta(transaction.visitDelta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notre marque vit ICI, discrètement. La pastille en haut de la carte
          appartient au commerce : c'est son identité que le client vient
          chercher, pas la nôtre. */}
      <footer className="flex items-center justify-center gap-2 pb-2">
        <BrandMarkSolid size={16} />
        <span className="font-mono text-[10px] tracking-[0.16em] text-paper/35">
          PROPULSÉ PAR RECOMPENS
        </span>
      </footer>
    </main>
  );
}
