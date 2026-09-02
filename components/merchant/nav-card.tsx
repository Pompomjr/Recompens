import Link from "next/link";

/**
 * Entrée de navigation du dashboard (cf SPEC §6 : programme fidélité,
 * clients, historique, paramètres).
 */
export function NavCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4 transition-colors hover:border-brand/50"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-[15px] tracking-tight text-fg">
          {title}
        </span>
        <span className="text-sm text-fg-soft">{description}</span>
      </span>
      <span aria-hidden className="text-fg-faint">
        →
      </span>
    </Link>
  );
}
