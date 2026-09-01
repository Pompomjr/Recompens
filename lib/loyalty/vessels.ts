import type { VesselShape } from "@prisma/client";

/**
 * Silhouettes du style « Contenant » (cf maquettes).
 *
 * Chaque métier a la sienne, et c'est précisément ce qui limite ce style :
 * il faut un dessin par commerce, là où le style « Ticket » n'en demande
 * aucun. On ne l'active donc que quand le contenant EST le produit qu'on
 * vient chercher — une tasse chez un café, une assiette au restaurant. Chez
 * un coiffeur, un flacon ne raconte rien.
 *
 * La couleur du CONTENU appartient à la silhouette, pas au commerce : des
 * pâtes sont couleur pâtes. Seule la couleur de fond vient du commerce
 * (`Merchant.brandColor`).
 *
 * Le contenu est dessiné « plein » puis descendu : la géométrie ne dépend
 * donc jamais du compteur, seul le décalage change (cf `fillOffset`).
 */
export type VesselSpec = {
  width: number;
  height: number;
  /**
   * Le geste joué après une visite validée.
   *
   * - `drop` : la mascotte TOMBE dans le contenant. Le geste le plus fort,
   *   mais il exige que le contenant soit ouvert par le haut et que l'objet
   *   qui tombe soit crédible — un grain dans une tasse.
   * - `streak` : la mascotte TRAVERSE l'écran et sort par le coin. Marche
   *   partout, y compris quand rien ne « tombe » naturellement dans le
   *   contenant.
   */
  gesture: "drop" | "streak";
  /** Hauteur de l'ouverture, où la mascotte disparaît quand elle tombe. */
  rimY: number;
  /** Intérieur du contenant, sert de masque au contenu. */
  clip: string;
  /** Traits du contenant, dessinés par-dessus le contenu. */
  strokes: string[];
  /** Épaisseur des traits. */
  strokeWidth: number;
  /** Bandes horizontales délimitant le niveau plein et le niveau vide. */
  interiorTop: number;
  interiorBottom: number;
  /** Surface du contenu, au niveau plein. */
  surface: { cx: number; rx: number; ry: number };
  /** Détails posés sur la surface (spaghettis, mousse…). */
  garnish: string[];
  fill: string;
  fillLight: string;
  /** Position du chiffre, en pourcentage de la hauteur. */
  labelTop: string;
};

const CUP: VesselSpec = {
  width: 186,
  height: 236,
  gesture: "drop",
  rimY: 34,
  clip: "M30 34 h112 l-13 148 a26 26 0 0 1 -26 24 h-34 a26 26 0 0 1 -26 -24 Z",
  strokes: [
    "M142 62 h14 a30 30 0 0 1 0 60 h-19",
    "M30 34 h112 l-13 148 a26 26 0 0 1 -26 24 h-34 a26 26 0 0 1 -26 -24 Z",
    "M22 34 h128",
  ],
  strokeWidth: 7,
  interiorTop: 86,
  interiorBottom: 196,
  surface: { cx: 93, rx: 76, ry: 11 },
  garnish: [],
  fill: "#F2B872",
  fillLight: "#FBD9A8",
  labelTop: "42%",
};

const PASTA: VesselSpec = {
  width: 220,
  height: 190,
  // Rien ne « tombe » dans une assiette de pâtes : la tomate traverse.
  gesture: "streak",
  rimY: 62,
  clip: "M24 62 h172 l-17 78 a36 36 0 0 1 -35 28 h-68 a36 36 0 0 1 -35 -28 Z",
  strokes: [
    "M24 62 h172 l-17 78 a36 36 0 0 1 -35 28 h-68 a36 36 0 0 1 -35 -28 Z",
    "M12 62 h196",
  ],
  strokeWidth: 7,
  interiorTop: 66,
  interiorBottom: 158,
  surface: { cx: 110, rx: 84, ry: 12 },
  // Trois spaghettis posés sur la surface : ce qui distingue une assiette de
  // pâtes d'un simple bol rempli.
  garnish: [
    "M48 62 c14 -13 34 -13 48 0 c14 13 34 13 48 0",
    "M62 70 c16 -11 36 -9 50 3 c12 12 30 12 44 1",
    "M56 55 c18 -9 40 -5 54 6",
  ],
  fill: "#E8C36A",
  fillLight: "#F5DFA4",
  labelTop: "50%",
};

const SPECS: Record<VesselShape, VesselSpec> = { CUP, PASTA };

export function vesselSpec(shape: VesselShape): VesselSpec {
  return SPECS[shape];
}

/**
 * De combien descendre le contenu pour représenter `visitCount` sur
 * `visitsRequired`. 0 = plein, `interiorBottom - interiorTop` = vide.
 */
export function fillOffset(
  spec: VesselSpec,
  visitCount: number,
  visitsRequired: number
): number {
  const depth = spec.interiorBottom - spec.interiorTop;
  if (visitsRequired <= 0) return 0;
  const ratio = Math.min(Math.max(visitCount / visitsRequired, 0), 1);
  return Math.round(depth * (1 - ratio));
}
