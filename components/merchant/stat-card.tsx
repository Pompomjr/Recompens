/**
 * Tuile de statistique du dashboard (cf SPEC §6, §17).
 * Volontairement sans graphique : "Ne pas remplir le dashboard de graphiques
 * inutiles." Un chiffre, un libellé, rien de plus.
 */
export function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 ${
        highlight
          ? "border-amber-300 bg-amber-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      <span
        className={`font-display text-[28px] leading-none tabular-nums ${
          highlight ? "text-amber-700" : "text-neutral-900"
        }`}
      >
        {value}
      </span>
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
    </div>
  );
}
