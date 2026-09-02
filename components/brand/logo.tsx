/**
 * La marque Recompens, en trois formes.
 *
 * Un logo n'est pas un dessin unique : c'est un système, avec une version par
 * taille disponible. Ici :
 *
 *  - `Wordmark`   — le mot complet, avec les deux E ajourés en vert.
 *                   Pour les en-têtes et tout ce qui dépasse ~120 px de large.
 *  - `BrandMark`  — la pastille ronde au R ajouré. De 24 à 64 px.
 *  - `BrandMarkSolid` — la même au R PLEIN. En dessous de 24 px, les entailles
 *                   se referment et la lettre devient une tache : la version
 *                   simplifiée n'est pas une trahison du logo, c'est la seule
 *                   façon de rester lisible.
 *
 * Les lettres pleines sont en Saira 800, les ajourées en Saira Stencil One.
 * Deux membres de la même famille : les proportions concordent, et les
 * entailles passent pour un parti pris plutôt que pour un accident.
 */

/** Vert de la marque. Sur fond clair, il doit être foncé pour rester lisible. */
export const BRAND_GREEN = "#2FBF71";
export const BRAND_GREEN_DARK = "#1E8A50";

export function Wordmark({
  className = "",
  accent,
  onDark = false,
}: {
  className?: string;
  /** Couleur des deux E. Par défaut, le vert adapté au fond. */
  accent?: string;
  onDark?: boolean;
}) {
  const green = accent ?? (onDark ? BRAND_GREEN : BRAND_GREEN_DARK);

  return (
    <span
      className={`inline-flex items-baseline font-[family-name:var(--font-brand)] font-extrabold leading-none tracking-[0.01em] ${className}`}
    >
      R
      <StencilLetter color={green}>E</StencilLetter>
      COMP
      <StencilLetter color={green}>E</StencilLetter>
      NS
      <span className="sr-only"> — Recompens</span>
    </span>
  );
}

function StencilLetter({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  return (
    <span
      aria-hidden
      className="font-[family-name:var(--font-brand-stencil)] font-normal"
      style={{ color }}
    >
      {children}
    </span>
  );
}

/**
 * La pastille ronde, R ajouré. À partir de 24 px.
 */
export function BrandMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: BRAND_GREEN }}
      role="img"
      aria-label="Recompens"
    >
      <span
        aria-hidden
        className="font-[family-name:var(--font-brand-stencil)] leading-none"
        style={{ fontSize: size * 0.58, color: "#10331F" }}
      >
        R
      </span>
    </span>
  );
}

/**
 * La pastille au R plein, pour les tailles où les entailles se referment.
 */
export function BrandMarkSolid({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: BRAND_GREEN }}
      role="img"
      aria-label="Recompens"
    >
      <span
        aria-hidden
        className="font-[family-name:var(--font-brand)] font-extrabold leading-none"
        style={{ fontSize: size * 0.6, color: "#10331F" }}
      >
        R
      </span>
    </span>
  );
}
