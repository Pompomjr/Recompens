/**
 * Thème de la carte client, dérivé de la couleur du commerce.
 *
 * Un seul réglage en base (`Merchant.brandColor`) suffit à décliner la carte :
 * l'encre des tampons, la couleur du bouton, les accents. Le papier et le
 * texte restent constants — c'est ce qui donne une famille reconnaissable
 * plutôt qu'un patchwork.
 *
 * cf les maquettes : style « Ticket », universel, sans dessin par métier.
 */
const FALLBACK_INK = "#A63A28";

/** Une couleur hex valide, sinon l'encre par défaut. */
export function safeBrandColor(value: string | null | undefined): string {
  if (!value) return FALLBACK_INK;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : FALLBACK_INK;
}

/**
 * Luminance perçue, pour décider si le texte posé sur cette couleur doit
 * être clair ou sombre. Sans ça, un commerçant qui choisit un jaune vif
 * obtient un bouton illisible.
 */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.5 ? "#17140F" : "#EFE4CE";
}

export type CardTheme = {
  /** Encre des tampons et des accents. */
  ink: string;
  /** Texte lisible posé sur l'encre. */
  onInk: string;
};

export function cardTheme(brandColor: string | null | undefined): CardTheme {
  const ink = safeBrandColor(brandColor);
  return { ink, onInk: readableOn(ink) };
}
