import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { JoinForm } from "@/components/customer/join-form";
import { formatVisits } from "@/lib/format";

/**
 * cf SPEC §8 — Page atteinte en scannant le QR du commerce.
 *
 * Page publique : c'est le point d'entrée d'un client qui n'a pas encore de
 * compte. Le `programId` de l'URL n'est pas un secret (cf SPEC §9) — il ne
 * donne accès à aucune donnée client, seulement au nom du commerce et aux
 * règles du programme.
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
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold text-neutral-900">
          Programme indisponible
        </h1>
        <p className="text-sm text-neutral-600">
          Ce QR code ne correspond à aucun programme actif. Demandez au
          commerçant de vous en présenter un autre.
        </p>
        <Link href="/" className="text-sm text-neutral-500 underline">
          Retour à l&apos;accueil
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

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Bienvenue chez {program.merchant.name}
        </h1>
        <p className="text-sm text-neutral-600">
          {formatVisits(program.visitsRequired)} et{" "}
          {program.rewardName.toLowerCase()}. Aucune application à installer.
        </p>
      </div>

      <JoinForm programId={program.id} />

      <p className="text-center text-xs text-neutral-500">
        Votre carte reste accessible depuis ce téléphone.
      </p>
    </main>
  );
}
