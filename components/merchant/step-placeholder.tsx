import Link from "next/link";

/**
 * Écran d'attente pour les pages du dashboard prévues par la SPEC §16 mais
 * construites à une étape ultérieure. Évite les liens morts dans la
 * navigation du §6.
 */
export function StepPlaceholder({
  title,
  step,
  description,
}: {
  title: string;
  step: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-5">
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Retour au dashboard
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        {title}
      </h1>
      <p className="text-sm text-neutral-600">{description}</p>
      <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
        Écran construit à l&apos;{step}.
      </p>
    </main>
  );
}
