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
      className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-neutral-900">{title}</span>
        <span className="text-sm text-neutral-500">{description}</span>
      </span>
      <span aria-hidden className="text-neutral-400">
        →
      </span>
    </Link>
  );
}
