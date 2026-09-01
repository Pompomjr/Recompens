import Link from "next/link";
import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 p-5">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Mes cartes
      </h1>

      {memberships.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
          Vous n&apos;avez pas encore de carte. Scannez le QR code affiché chez
          un commerçant pour en créer une.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {memberships.map((membership) => (
            <li key={membership.id}>
              <Link
                href={`/customer/card/${membership.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-neutral-900">
                    {membership.program.merchant.name}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {membership.visitCount} / {membership.program.visitsRequired}{" "}
                    {visitsLabel(membership.program.visitsRequired)}
                  </span>
                </span>
                {membership.rewardAvailable ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    Récompense
                  </span>
                ) : (
                  <span aria-hidden className="text-neutral-400">
                    →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
