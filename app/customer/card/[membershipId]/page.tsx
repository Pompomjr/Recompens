import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateCustomerQr } from "@/lib/qr/generate";
import { getMembershipTransactions } from "@/lib/transactions/queries";
import { CardQr } from "@/components/customer/card-qr";
import {
  formatDate,
  formatTime,
  formatTransactionType,
  formatVisitDelta,
  visitsLabel,
} from "@/lib/format";

/**
 * cf SPEC §8 — la carte de fidélité du client :
 *   [Commerce] / X sur Y visites / Encore Z visites / [AFFICHER MON QR]
 * et §14 — "Le client doit pouvoir voir son activité."
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
  const remaining = Math.max(program.visitsRequired - membership.visitCount, 0);

  // L'historique n'est chargé qu'après la vérification d'appartenance
  // ci-dessus : jamais avant.
  const [qrDataUrl, transactions] = await Promise.all([
    generateCustomerQr(membership.qrToken),
    getMembershipTransactions(membership.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 p-5">
      <Link href="/customer" className="text-sm text-neutral-500 underline">
        ← Mes cartes
      </Link>

      <section className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
        <span className="text-lg font-semibold text-neutral-900">
          {program.merchant.name}
        </span>

        <span className="text-4xl font-bold tabular-nums text-neutral-900">
          {membership.visitCount} / {program.visitsRequired}
        </span>
        <span className="text-sm text-neutral-500">
          {visitsLabel(program.visitsRequired)}
        </span>

        {/* cf SPEC §12 : la récompense disponible doit être visible du client. */}
        {membership.rewardAvailable ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Récompense disponible : {program.rewardName}. Présentez votre QR au
            commerçant.
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">
            Encore {remaining} {remaining > 1 ? "visites" : "visite"} pour
            obtenir {program.rewardName.toLowerCase()}.
          </p>
        )}
      </section>

      <CardQr qrDataUrl={qrDataUrl} />

      {/* cf SPEC §14 — activité du client. Lecture seule. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-neutral-900">Mon activité</h2>

        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
            Votre première visite apparaîtra ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatTransactionType(transaction.type)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(transaction.createdAt)} à{" "}
                    {formatTime(transaction.createdAt)}
                  </span>
                </span>
                <span
                  className={`text-base font-semibold tabular-nums ${
                    transaction.visitDelta > 0
                      ? "text-neutral-900"
                      : "text-amber-700"
                  }`}
                >
                  {formatVisitDelta(transaction.visitDelta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
