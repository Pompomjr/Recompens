import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { cardTheme } from "@/lib/theme";
import { formatVisits } from "@/lib/format";
import { JoinForm } from "@/components/customer/join-form";

/**
 * cf SPEC §8 — Page atteinte en scannant le QR du commerce.
 *
 * C'est la première impression du produit : un inconnu, debout dans une
 * boutique, décide en trois secondes s'il s'inscrit. D'où le parti pris —
 * le nom du commerce en grand, la règle en une ligne, un seul bouton.
 *
 * Page publique : le `programId` de l'URL n'est pas un secret (cf SPEC §9),
 * il ne donne accès à aucune donnée client.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  const program = await prisma.loyaltyProgram.findUnique({
    where: { id: programId },
    include: { merchant: true },
  });

  if (!program || !program.active) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 bg-paper-tint p-6 text-center">
        <h1 className="font-display text-2xl text-ink">
          PROGRAMME INDISPONIBLE
        </h1>
        <p className="text-sm text-[color:var(--ink-soft)]">
          Ce QR code ne correspond à aucun programme actif. Demandez au
          commerçant de vous en présenter un autre.
        </p>
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.16em] text-[color:var(--ink-soft)] underline"
        >
          RETOUR À L&apos;ACCUEIL
        </Link>
      </main>
    );
  }

  // Client déjà inscrit à ce programme : inutile de lui redemander son
  // prénom, on l'envoie directement sur sa carte.
  const user = await getCurrentUser();
  if (user?.customer) {
    const membership = await prisma.loyaltyMembership.findUnique({
      where: {
        customerId_programId: {
          customerId: user.customer.id,
          programId: program.id,
        },
      },
    });
    if (membership) redirect(`/customer/card/${membership.id}`);
  }

  const { ink, onInk } = cardTheme(program.merchant.brandColor);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 bg-paper-tint px-6 py-10">
      <div className="flex flex-col items-center gap-5 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-full font-display text-3xl"
          style={{ backgroundColor: ink, color: onInk }}
          aria-hidden
        >
          {program.merchant.name.trim().charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[color:var(--ink-soft)]">
            BIENVENUE CHEZ
          </span>
          <h1 className="font-display text-[34px] leading-none tracking-tight text-ink">
            {program.merchant.name.toUpperCase()}
          </h1>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{ backgroundColor: ink, color: onInk }}
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-xl leading-none">
            {formatVisits(program.visitsRequired).toUpperCase()}
          </span>
          <span className="text-sm opacity-70">
            et {program.rewardName.toLowerCase()}
          </span>
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] opacity-60">
          SANS APPLI
        </span>
      </div>

      <JoinForm programId={program.id} ink={ink} onInk={onInk} />

      <p className="text-center text-xs text-[color:var(--ink-soft)]">
        Votre carte reste accessible depuis ce téléphone.
      </p>
    </main>
  );
}
