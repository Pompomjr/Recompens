import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { safeLogoUrl } from "@/lib/merchant/logo";
import { removeMerchantLogoAction } from "@/lib/merchant/actions";
import { LogoForm } from "@/components/merchant/logo-form";

// cf SPEC §6 — paramètres du commerce.
export default async function SettingsPage() {
  const { merchant } = await requireMerchant();
  const logoUrl = safeLogoUrl(merchant.logoUrl);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-5">
      <Link
        href="/dashboard"
        className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
      >
        ← RETOUR AU DASHBOARD
      </Link>

      <h1 className="font-display text-2xl tracking-tight text-fg">
        Paramètres
      </h1>

      <section className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-fg-faint">
          Commerce
        </span>
        <span className="font-display text-base tracking-tight text-fg">
          {merchant.name}
        </span>
      </section>

      <LogoForm merchantName={merchant.name} logoUrl={logoUrl} />

      {logoUrl ? (
        <form action={removeMerchantLogoAction}>
          <button
            type="submit"
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-fg-soft"
          >
            Retirer le logo
          </button>
        </form>
      ) : null}
    </main>
  );
}
