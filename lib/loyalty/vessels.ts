import type { VesselShape } from "@prisma/client";

/**
 * Silhouettes du style « Contenant » (cf maquettes).
 *
 * Deux familles, parce que deux métiers ne racontent pas la progression de la
 * même façon :
 *
 *  - `fill`  — le contenant se REMPLIT. Une tasse, une assiette. Le geste
 *              suppose un contenant ouvert par le haut.
 *  - `stack` — l'objet se CONSTRUIT, couche après couche. Un sandwich. Chaque
 *              visite ajoute un ingrédient : la progression se lit sans même
 *              regarder le chiffre, ce qui en fait la plus parlante des deux.
 *
 * Dans les deux cas, la couleur du CONTENU appartient à la silhouette, pas au
 * commerce : des pâtes sont couleur pâtes. Seule la couleur de fond de la
 * carte vient de `Merchant.brandColor`.
 */

type Base = {
  width: number;
  height: number;
  /**
   * Le geste joué après une visite validée.
   *
   * - `drop` : la mascotte TOMBE dans le contenant. Le plus fort, mais il
   *   exige un contenant ouvert par le haut et un objet crédible.
   * - `streak` : la mascotte TRAVERSE l'écran et sort par le coin. Marche
   *   partout.
   */
  gesture: "drop" | "streak";
  /** Hauteur de l'ouverture, où la mascotte disparaît quand elle tombe. */
  rimY: number;
  /** Position du chiffre, en pourcentage de la hauteur. */
  labelTop: string;
  /** Couleur dominante, reprise par le bouton et la pastille du commerce. */
  accent: string;
};

export type FillSpec = Base & {
  kind: "fill";
  /** Intérieur du contenant, sert de masque au contenu. */
  clip: string;
  /** Traits du contenant, dessinés par-dessus le contenu. */
  strokes: string[];
  strokeWidth: number;
  /** Bandes horizontales délimitant le niveau plein et le niveau vide. */
  interiorTop: number;
  interiorBottom: number;
  surface: { cx: number; rx: number; ry: number };
  /** Détails posés sur la surface (spaghettis, mousse…). */
  garnish: string[];
  fill: string;
  fillLight: string;
};

export type MoundSpec = Base & {
  kind: "mound";
  /** Le contenant lui-même, dessiné en traits. */
  strokes: string[];
  strokeWidth: number;
  /** La portion, à sa taille maximale. */
  mound: { cx: number; cy: number; rx: number; ry: number };
  /** Taille de la portion à la première visite, en proportion du maximum. */
  minScale: number;
  fill: string;
  fillLight: string;
  /** Brins dessinés sur la portion, révélés au fil des visites. */
  strands: string[];
};

export type StackSpec = Base & {
  kind: "stack";
  /** Ce qui est toujours là, sous la pile. */
  base: { d: string; fill: string };
  /** Ce qui vient coiffer la pile, une fois la carte complète. */
  top: { d: string; fill: string };
  /** Bande verticale où s'empilent les couches. */
  stackTop: number;
  stackBottom: number;
  /** Marge horizontale des couches, par rapport à la largeur. */
  inset: number;
  /** Palette des ingrédients, parcourue en boucle. */
  fillings: string[];
};

export type VesselSpec = FillSpec | MoundSpec | StackSpec;

const CUP: FillSpec = {
  kind: "fill",
  width: 186,
  height: 236,
  gesture: "drop",
  rimY: 34,
  accent: "#F2B872",
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

/**
 * Une assiette de pâtes, vue de trois quarts.
 *
 * Contrairement à la tasse, une assiette ne se « remplit » pas par le bas :
 * ce qui grossit, c'est la portion. Chaque visite l'élargit et découvre un
 * brin de plus — la progression se voit à la quantité, pas à un niveau.
 */
const PASTA: MoundSpec = {
  kind: "mound",
  width: 240,
  height: 180,
  // Rien ne « tombe » dans une assiette : la tomate traverse l'écran.
  gesture: "streak",
  rimY: 60,
  accent: "#E8C36A",
  strokes: [
    // Le marli, puis le fond de l'assiette.
    "M10 92 a110 52 0 1 0 220 0 a110 52 0 1 0 -220 0",
    "M34 92 a86 38 0 1 0 172 0 a86 38 0 1 0 -172 0",
  ],
  strokeWidth: 6,
  mound: { cx: 120, cy: 90, rx: 76, ry: 31 },
  minScale: 0.42,
  fill: "#E8C36A",
  fillLight: "#F5DFA4",
  strands: [
    "M58 84 c18 -16 44 -16 62 0 c18 16 44 16 62 0",
    "M62 96 c20 -14 46 -12 64 2 c16 12 38 12 54 0",
    "M56 76 c22 -12 50 -8 70 6",
    "M70 102 c22 -12 50 -10 70 2",
    "M60 88 c16 10 40 14 60 6 c16 -6 34 -4 48 4",
    "M74 78 c18 -10 42 -8 58 4",
    "M66 104 c24 -6 52 -2 72 -10",
    "M80 92 c20 -14 44 -12 60 2",
  ],
  labelTop: "44%",
};

/**
 * Le sandwich se construit : une tranche du dessous toujours présente, les
 * ingrédients qui s'empilent visite après visite, et la tranche du dessus qui
 * vient coiffer le tout quand la carte est complète.
 *
 * C'est le seul dessin où la progression se lit sans chiffre — d'où son
 * intérêt pour montrer le produit à quelqu'un qui le découvre.
 */
const SANDWICH: StackSpec = {
  kind: "stack",
  width: 240,
  height: 210,
  gesture: "streak",
  rimY: 46,
  accent: "#E8B562",
  base: {
    d: "M22 168 h196 a16 16 0 0 1 0 26 h-196 a16 16 0 0 1 0 -26 Z",
    fill: "#E8B562",
  },
  top: {
    d: "M22 56 a98 40 0 0 1 196 0 v10 a10 10 0 0 1 -10 10 h-176 a10 10 0 0 1 -10 -10 Z",
    fill: "#E8B562",
  },
  stackTop: 84,
  stackBottom: 166,
  inset: 14,
  // Salade, tomate, fromage, jambon — parcourus en boucle.
  fillings: ["#7FB069", "#E24E3B", "#F2C14E", "#E9A0A0"],
  labelTop: "38%",
};

const SPECS: Record<VesselShape, VesselSpec> = { CUP, PASTA, SANDWICH };

export function vesselSpec(shape: VesselShape): VesselSpec {
  return SPECS[shape];
}

/**
 * De combien descendre le contenu pour représenter `visitCount` sur
 * `visitsRequired`. 0 = plein, `interiorBottom - interiorTop` = vide.
 * Ne concerne que les silhouettes qui se remplissent.
 */
export function fillOffset(
  spec: FillSpec,
  visitCount: number,
  visitsRequired: number
): number {
  const depth = spec.interiorBottom - spec.interiorTop;
  if (visitsRequired <= 0) return 0;
  const ratio = Math.min(Math.max(visitCount / visitsRequired, 0), 1);
  return Math.round(depth * (1 - ratio));
}

/**
 * Les couches à dessiner pour une silhouette qui se construit.
 *
 * La hauteur d'une couche s'adapte au nombre de visites requises : quatre
 * visites donnent quatre couches épaisses, dix en donnent dix fines. La pile
 * occupe toujours la même bande, quel que soit le programme.
 */
export function stackLayers(
  spec: StackSpec,
  visitCount: number,
  visitsRequired: number
) {
  const total = Math.max(visitsRequired, 1);
  const bande = spec.stackBottom - spec.stackTop;
  const hauteur = bande / total;

  return Array.from({ length: total }, (_, index) => {
    // La première couche est en bas de la pile.
    const rang = total - 1 - index;
    return {
      index,
      y: spec.stackTop + rang * hauteur,
      hauteur,
      couleur: spec.fillings[index % spec.fillings.length],
      posee: index < visitCount,
      // Léger décalage horizontal, pour que la pile ne soit pas un empilement
      // de rectangles parfaitement alignés.
      decalage: ((index * 29) % 9) - 4,
    };
  });
}

/**
 * Taille de la portion et nombre de brins visibles, pour une silhouette qui
 * grossit. La portion n'est jamais nulle : même à une visite, il y a quelque
 * chose dans l'assiette — sinon le client a l'impression de n'avoir rien.
 */
export function moundProgress(
  spec: MoundSpec,
  visitCount: number,
  visitsRequired: number
) {
  const total = Math.max(visitsRequired, 1);
  const ratio = Math.min(Math.max(visitCount / total, 0), 1);

  return {
    scale: spec.minScale + (1 - spec.minScale) * ratio,
    strands: Math.round(spec.strands.length * ratio),
  };
}
