/**
 * Tuile de statistique du dashboard (cf SPEC §6, §17).
 * Volontairement sans graphique : « Ne pas remplir le dashboard de graphiques
 * inutiles. » Un chiffre, un libellé, rien de plus.
 *
 * `highlight` sert aux récompenses en attente : c'est la seule information du
 * dashboard qui appelle une action, elle mérite de sortir du lot.
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
          ? "border-amber-400/40 bg-amber-400/10"
          : "border-line bg-surface-raised"
      }`}
    >
      <span
        className={`font-display text-[28px] leading-none tabular-nums ${
          highlight ? "text-amber-300" : "text-fg"
        }`}
      >
        {value}
      </span>
      <span
        className={`font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${
          highlight ? "text-amber-200/70" : "text-fg-faint"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
