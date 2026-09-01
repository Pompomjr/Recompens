import Link from "next/link";
import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { cardTheme } from "@/lib/theme";
import { visitsLabel } from "@/lib/format";

/**
 * cf SPEC §16 — /customer : les cartes du client.
 *
 * Les cartes sont lues à partir du `customer.id` de la session, jamais d'un
 * identifiant d'URL (cf SPEC §18).
 */
export default async function CustomerHomePage() {
  const { customer } = await requireCustomer();

  const memberships = await prisma.loyaltyMembership.findMany({
    where: { customerId: customer.id },
    include: { program: { include: { merchant: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 p-5">
      <h1 className="font-display text-3xl tracking-tight text-paper">
        MES CARTES
      </h1>

      {memberships.length === 0 ? (
        <p className="border border-dashed border-paper/20 p-5 text-sm text-paper/50">
          Vous n&apos;avez pas encore de carte. Scannez le QR code affiché chez
          un commerçant pour en créer une.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {memberships.map((membership) => {
            const { program } = membership;
            const { ink } = cardTheme(program.merchant.brandColor);
            const remaining = Math.max(
              program.visitsRequired - membership.visitCount,
              0
            );

            return (
              <li key={membership.id}>
                <Link
                  href={`/customer/card/${membership.id}`}
                  className="flex items-center gap-4 bg-paper px-4 py-4 [background-image:radial-gradient(rgba(23,20,15,0.055)_1px,transparent_1px)] [background-size:3px_3px]"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 font-display text-base text-ink"
                    style={{ borderColor: ink, color: ink }}
                    aria-hidden
                  >
                    {program.merchant.name.trim().charAt(0).toUpperCase()}
                  </span>

                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="font-display text-base leading-tight text-ink">
                      {program.merchant.name.toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-[color:var(--ink-soft)]">
                      {membership.visitCount} / {program.visitsRequired}{" "}
                      {visitsLabel(program.visitsRequired).toUpperCase()}
                    </span>
                  </span>

                  {membership.rewardAvailable ? (
                    <span
                      className="border-2 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.14em]"
                      style={{ borderColor: ink, color: ink }}
                    >
                      OFFERT
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] tracking-wide text-[color:var(--ink-soft)]">
                      −{remaining}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
