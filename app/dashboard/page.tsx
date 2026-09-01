import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { getMerchantDashboardStats } from "@/lib/dashboard/stats";
import { StatCard } from "@/components/merchant/stat-card";
import { NavCard } from "@/components/merchant/nav-card";
import { formatVisits } from "@/lib/format";

/**
 * Dashboard commerçant (cf SPEC §6).
 *
 * `requireMerchant()` est rappelé ici même si le layout le fait déjà : c'est
 * lui qui fournit le `merchant.id` utilisé pour filtrer TOUTES les stats. On
 * ne lit jamais un identifiant de commerce depuis l'URL (cf SPEC §18).
 *
 * Mise en page mobile-first et hiérarchie imposée par le §17 :
 * SCAN → CLIENT → VALIDER. Le bouton de scan est donc la première action
 * visible, avant les listes.
 */
export default async function DashboardPage() {
  const { merchant } = await requireMerchant();
  const { customerCount, visitsToday, rewardsAvailable, program } =
    await getMerchantDashboardStats(merchant.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-5">
      {/* cf SPEC §6 : "Le bouton SCANNER UN CLIENT doit être l'action principale." */}
      <Link
        href="/dashboard/scan"
        className="flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-7 font-display text-xl tracking-[0.04em] text-white shadow-sm active:bg-neutral-800"
      >
        SCANNER UN CLIENT
      </Link>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Clients" value={customerCount} />
        <StatCard label="Visites aujourd'hui" value={visitsToday} />
        <StatCard
          label="Récompenses à donner"
          value={rewardsAvailable}
          highlight={rewardsAvailable > 0}
        />
      </section>

      {/* Tant qu'aucun programme n'existe, le scan et l'inscription client
          n'ont rien à quoi se rattacher : on met la création en avant. */}
      {!program ? (
        <section className="flex flex-col gap-3 rounded-xl border border-neutral-900 bg-neutral-50 p-5">
          <h2 className="font-display text-lg tracking-tight text-neutral-900">
            Créez votre programme de fidélité
          </h2>
          <p className="text-sm text-neutral-600">
            C&apos;est lui qui définit le nombre de visites nécessaires et la
            récompense. Sans programme, vos clients ne peuvent pas encore
            s&apos;inscrire.
          </p>
          <Link
            href="/dashboard/program"
            className="self-start rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Créer mon programme
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Programme actif
          </span>
          <span className="font-display text-base tracking-tight text-neutral-900">{program.name}</span>
          <span className="text-sm text-neutral-600">
            {formatVisits(program.visitsRequired)} → {program.rewardName}
          </span>
        </section>
      )}

      <nav className="flex flex-col gap-3">
        <NavCard
          href="/dashboard/program"
          title="Programme de fidélité"
          description="Visites nécessaires, récompense, QR d'inscription"
        />
        <NavCard
          href="/dashboard/customers"
          title="Clients"
          description="Vos clients et leur nombre de visites"
        />
        <NavCard
          href="/dashboard/history"
          title="Historique"
          description="Toutes les visites et récompenses"
        />
        <NavCard
          href="/dashboard/settings"
          title="Paramètres"
          description="Informations de votre commerce"
        />
      </nav>
    </main>
  );
}
