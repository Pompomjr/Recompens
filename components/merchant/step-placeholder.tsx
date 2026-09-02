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
      <Link
        href="/dashboard"
        className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
      >
        ← RETOUR AU DASHBOARD
      </Link>
      <h1 className="font-display text-2xl tracking-tight text-fg">{title}</h1>
      <p className="text-sm text-fg-soft">{description}</p>
      <p className="rounded-lg border border-dashed border-line p-4 text-sm text-fg-faint">
        Écran construit à l&apos;{step}.
      </p>
    </main>
  );
}
