import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateProgramJoinQr } from "@/lib/qr/generate";
import { getAppUrl } from "@/lib/app-url";
import { ProgramForm } from "@/components/merchant/program-form";
import { ProgramEditForm } from "@/components/merchant/program-edit-form";
import { formatVisits } from "@/lib/format";

/**
 * cf SPEC §7 — Création du programme, puis affichage et téléchargement du QR
 * d'inscription.
 *
 * Le programme est toujours retrouvé via le `merchant.id` de la session, pas
 * via un identifiant d'URL : un commerçant ne peut donc pas afficher le
 * programme d'un autre (cf SPEC §18).
 */
export default async function ProgramPage() {
  const { merchant } = await requireMerchant();

  const program = await prisma.loyaltyProgram.findFirst({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-5">
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Retour au dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Programme de fidélité
      </h1>

      {!program ? (
        <>
          <p className="text-sm text-neutral-600">
            Définissez vos règles. Exemple : 10 visites pour 1 café offert.
          </p>
          <ProgramForm />
        </>
      ) : (
        <ProgramDetails program={program} />
      )}
    </main>
  );
}

/**
 * cf SPEC §7 : "Après création : afficher le QR d'inscription, permettre de
 * télécharger le QR." Le QR encode l'URL /join/[programId] — l'identifiant du
 * programme n'est pas un secret, il ne sert qu'à rejoindre le programme
 * (cf SPEC §9).
 */
async function ProgramDetails({
  program,
}: {
  program: {
    id: string;
    name: string;
    visitsRequired: number;
    rewardName: string;
    active: boolean;
  };
}) {
  const appUrl = await getAppUrl();
  const joinUrl = `${appUrl}/join/${program.id}`;
  const qrDataUrl = await generateProgramJoinQr(program.id, appUrl);

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-neutral-500">Nom</span>
          <span className="font-medium text-neutral-900">{program.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-neutral-500">Règle</span>
          <span className="font-medium text-neutral-900">
            {formatVisits(program.visitsRequired)} → {program.rewardName}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-neutral-500">Statut</span>
          <span className="font-medium text-neutral-900">
            {program.active ? "Actif" : "Inactif"}
          </span>
        </div>
      </section>

      {!program.active ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Ce programme est arrêté : plus personne ne peut s&apos;inscrire ni
          valider de visite. Les cartes de vos clients sont conservées et
          repartiront dès que vous le réactiverez.
        </p>
      ) : null}

      <ProgramEditForm
        programId={program.id}
        name={program.name}
        visitsRequired={program.visitsRequired}
        rewardName={program.rewardName}
        active={program.active}
      />

      <section className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="self-start font-semibold text-neutral-900">
          QR d&apos;inscription
        </h2>
        <p className="self-start text-sm text-neutral-600">
          Imprimez-le et posez-le sur votre comptoir. Vos clients le scannent
          pour créer leur carte, sans installer d&apos;application.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée
            côté serveur : ni domaine distant à autoriser, ni optimisation utile. */}
        <img
          src={qrDataUrl}
          alt={`QR code d'inscription pour ${program.name}`}
          className="h-56 w-56 rounded-lg border border-neutral-200"
        />

        <a
          href={qrDataUrl}
          download={`qr-inscription-${program.id}.png`}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Télécharger le QR
        </a>

        <p className="w-full break-all text-center text-xs text-neutral-500">
          {joinUrl}
        </p>
      </section>
    </>
  );
}
