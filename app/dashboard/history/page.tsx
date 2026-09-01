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
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Retour au dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Historique
      </h1>

      {transactions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
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
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-neutral-900">
                    {transaction.membership.customer.firstName}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {formatTransactionType(transaction.type)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(transaction.createdAt)} à{" "}
                    {formatTime(transaction.createdAt)}
                  </span>
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${
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

          <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
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
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-neutral-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-600">
                      {formatTime(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {transaction.membership.customer.firstName}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatTransactionType(transaction.type)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        transaction.visitDelta > 0
                          ? "text-neutral-900"
                          : "text-amber-700"
                      }`}
                    >
                      {formatVisitDelta(transaction.visitDelta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-500">
            {transactions.length} dernières opérations.
          </p>
        </>
      )}
    </main>
  );
}
