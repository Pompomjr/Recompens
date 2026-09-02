import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { getMerchantCustomers } from "@/lib/customers/queries";
import { formatDate, visitsLabel } from "@/lib/format";

/**
 * cf SPEC §6 — la liste des clients du commerce.
 *
 * Écran de LECTURE seule. Le compteur ne se modifie que par un scan
 * (cf SPEC §5) : offrir ici un bouton « +1 » contournerait la validation par
 * QR, qui est ce qui empêche un client d'accumuler des visites sans passer en
 * caisse.
 *
 * Ordonné par activité la plus récente, parce que la question du commerçant
 * n'est pas « qui sont mes clients » mais « qui revient ».
 */
export default async function CustomersPage() {
  const { merchant } = await requireMerchant();
  const clients = await getMerchantCustomers(merchant.id);

  const aRecompense = clients.filter((c) => c.rewardAvailable).length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-5">
      <Link
        href="/dashboard"
        className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
      >
        ← RETOUR AU DASHBOARD
      </Link>

      <h1 className="font-display text-2xl tracking-tight text-fg">Clients</h1>

      {clients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-sm text-fg-faint">
          Aucun client pour le moment. Posez votre affichette sur le comptoir :
          chaque client qui scanne le QR apparaîtra ici.
        </p>
      ) : (
        <>
          {aRecompense > 0 ? (
            <p className="rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm text-fg-soft">
              <strong className="text-fg">
                {aRecompense} {aRecompense > 1 ? "clients ont" : "client a"} une
                récompense à recevoir.
              </strong>{" "}
              Elle se remet en scannant leur carte.
            </p>
          ) : null}

          <ul className="flex flex-col gap-2">
            {clients.map((client) => (
              <li
                key={client.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised p-4"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium text-fg">
                    {client.firstName}
                  </span>
                  <span className="font-mono text-[11px] tracking-wide text-fg-faint">
                    {client.derniereVisite
                      ? `DERNIÈRE VISITE ${formatDate(client.derniereVisite)}`
                      : `INSCRIT LE ${formatDate(client.inscritLe)}`}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {client.rewardAvailable ? (
                    <span className="rounded-md border border-brand/50 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-brand">
                      RÉCOMPENSE
                    </span>
                  ) : null}
                  <span className="text-right">
                    <span className="block text-lg font-semibold tabular-nums text-fg">
                      {client.visitCount}
                      <span className="text-fg-faint">
                        /{client.visitsRequired}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                      {visitsLabel(client.visitsRequired)}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-fg-faint">
            {clients.length} {clients.length > 1 ? "cartes" : "carte"} au total.
            Le compteur ne se modifie qu&apos;en scannant la carte du client.
          </p>
        </>
      )}
    </main>
  );
}
