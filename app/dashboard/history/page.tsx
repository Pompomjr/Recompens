import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { getMerchantTransactions } from "@/lib/transactions/queries";
import {
  formatDate,
  formatTime,
  formatTransactionType,
  formatVisitDelta,
} from "@/lib/format";

/**
 * cf SPEC §14 — "Le commerçant doit pouvoir voir : date, heure, client,
 * action, variation."
 *
 * Aucune action sur cette page : l'historique est immuable (§4). On ne peut
 * ni corriger ni supprimer une ligne — c'est ce qui en fait une preuve.
 */
export default async function HistoryPage() {
  const { merchant } = await requireMerchant();
  const transactions = await getMerchantTransactions(merchant.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-5">
      <Link href="/dashboard" className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline">
        ← RETOUR AU DASHBOARD
      </Link>

      <h1 className="font-display text-2xl tracking-tight text-fg">
        Historique
      </h1>

      {transactions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-sm text-fg-faint">
          Aucune opération pour le moment. Chaque visite validée et chaque
          récompense remise apparaîtra ici.
        </p>
      ) : (
        <>
          {/* Mobile-first (§17) : une carte par opération sur petit écran,
              un tableau dès qu'il y a la place. */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised p-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-fg">
                    {transaction.membership.customer.firstName}
                  </span>
                  <span className="text-sm text-fg-faint">
                    {formatTransactionType(transaction.type)}
                  </span>
                  <span className="text-xs text-fg-faint">
                    {formatDate(transaction.createdAt)} à{" "}
                    {formatTime(transaction.createdAt)}
                  </span>
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${
                    transaction.visitDelta > 0
                      ? "text-fg"
                      : "text-amber-300"
                  }`}
                >
                  {formatVisitDelta(transaction.visitDelta)}
                </span>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface-raised sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Heure</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3 text-right">Variation</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-fg-soft">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-fg-soft">
                      {formatTime(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">
                      {transaction.membership.customer.firstName}
                    </td>
                    <td className="px-4 py-3 text-fg-soft">
                      {formatTransactionType(transaction.type)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        transaction.visitDelta > 0
                          ? "text-fg"
                          : "text-amber-300"
                      }`}
                    >
                      {formatVisitDelta(transaction.visitDelta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-fg-faint">
            {transactions.length} dernières opérations.
          </p>
        </>
      )}
    </main>
  );
}
