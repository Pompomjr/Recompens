import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { safeLogoUrl } from "@/lib/merchant/logo";
import { MerchantSettingsForm } from "@/components/admin/merchant-settings-form";

/**
 * cf SPEC §16 — /admin, l'espace de l'exploitant.
 *
 * Il existe pour une raison très concrète : jusqu'ici, régler le style de
 * carte, la silhouette, la couleur ou le délai anti-cumul demandait un accès
 * au Table Editor de Supabase. Autrement dit, personne ne pouvait installer un
 * commerçant sans toucher directement à la base — le goulot qui empêchait de
 * passer de trois commerces à dix.
 *
 * Ce sont les réglages que le commerçant NE décide pas. Ceux qui lui
 * appartiennent — nom du programme, seuil, récompense, logo — restent dans son
 * propre espace.
 */
export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login?next=/admin");
    if (error instanceof ForbiddenError) redirect("/");
    throw error;
  }

  const [merchants, cartesParProgramme, programmes] = await Promise.all([
    prisma.merchant.findMany({
      orderBy: { createdAt: "asc" },
      include: { programs: { orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    prisma.loyaltyMembership.groupBy({
      by: ["programId"],
      _count: { _all: true },
    }),
    prisma.loyaltyProgram.findMany({ select: { id: true, merchantId: true } }),
  ]);

  // Le compte de cartes est rattaché au commerce via son programme : un
  // commerce pourra un jour en avoir plusieurs, et le total doit suivre.
  const parCommerce = new Map<string, number>();
  for (const ligne of cartesParProgramme) {
    const programme = programmes.find((p) => p.id === ligne.programId);
    if (!programme) continue;
    parCommerce.set(
      programme.merchantId,
      (parCommerce.get(programme.merchantId) ?? 0) + ligne._count._all
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-fg">
          Exploitation
        </h1>
        <p className="text-sm text-fg-soft">
          Les réglages que le commerçant ne décide pas. Ce qui lui appartient —
          seuil, récompense, logo — reste dans son espace.
        </p>
      </div>

      {merchants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-sm text-fg-faint">
          Aucun commerce enregistré.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {merchants.map((merchant) => (
            <MerchantSettingsForm
              key={merchant.id}
              merchant={{
                id: merchant.id,
                name: merchant.name,
                logoUrl: safeLogoUrl(merchant.logoUrl),
                cardStyle: merchant.cardStyle,
                vesselShape: merchant.vesselShape,
                brandColor: merchant.brandColor,
                qrOrnementLogo: merchant.qrOrnementLogo,
                minMinutesBetweenVisits:
                  merchant.programs[0]?.minMinutesBetweenVisits ?? null,
                programName: merchant.programs[0]?.name ?? null,
                clients: parCommerce.get(merchant.id) ?? 0,
              }}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-fg-faint">
        {merchants.length} commerce{merchants.length > 1 ? "s" : ""}.
      </p>

      <Link
        href="/dashboard"
        className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
      >
        ALLER À MON DASHBOARD COMMERÇANT →
      </Link>
    </main>
  );
}
