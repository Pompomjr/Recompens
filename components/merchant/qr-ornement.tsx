import type { VesselShape } from "@prisma/client";

/**
 * Le décor posé AUTOUR du QR de l'affichette.
 *
 * L'idée : le QR n'est pas un carré tombé du ciel, c'est une étiquette posée
 * sur un objet du métier — une planche, une assiette, une soucoupe. Le décor
 * vient du même réglage `Merchant.vesselShape` qui pilote la carte du client :
 * l'affichette et la carte racontent donc la même histoire, et accueillir un
 * nouveau commerce ne demande aucun dessin supplémentaire.
 *
 * Sans silhouette, PAS de décor. Le repli sur le logo en filigrane a été
 * essayé puis retiré : appliqué à tout le monde par défaut, il habillait des
 * affichettes qui n'avaient rien demandé. Ce sera un choix par commerce, pas
 * une valeur par défaut.
 *
 * ⚠️ RÈGLE INTANGIBLE : le décor n'entre JAMAIS dans la zone de silence du QR.
 * Un code a besoin d'une marge blanche vide sur ses quatre côtés — c'est là
 * que le lecteur trouve ses bords. Le QR garde donc sa plaque blanche, posée
 * PAR-DESSUS ce décor, et toutes les formes ci-dessous sont dimensionnées
 * pour que la plaque tienne largement à l'intérieur. Le scan est le seul
 * geste du produit : il passe avant l'esthétique, sans discussion.
 */

const BOIS = "#C98A4B";
const BOIS_OMBRE = "#A5682F";
const FAIENCE = "#F4EDE0";
const FAIENCE_CLAIRE = "#FBF7F0";
const CAFE = "#4A2C15";

export function QrOrnement({
  shape,
  accent,
}: {
  shape: VesselShape | null;
  /** Couleur du commerce, pour les filets. */
  accent: string;
}) {
  const cadre: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  };

  if (shape === "SANDWICH") {
    return (
      <svg
        viewBox="0 0 240 212"
        style={{ ...cadre, width: "23em", height: "20.3em" }}
        aria-hidden
      >
        {/* Épaisseur, puis dessus : une planche est taillée d'une pièce. */}
        <g fill={BOIS_OMBRE}>
          <rect x="2" y="82" width="52" height="40" rx="20" />
          <rect x="26" y="16" width="200" height="184" rx="20" />
        </g>
        <rect x="2" y="76" width="52" height="40" rx="20" fill={BOIS} />
        <rect x="26" y="10" width="200" height="184" rx="20" fill={BOIS} />
        <circle cx="24" cy="96" r="9" fill={BOIS_OMBRE} />

        <g
          fill="none"
          stroke={CAFE}
          strokeOpacity="0.12"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M44 40 C 110 28, 170 38, 210 30" />
          <path d="M44 176 C 112 164, 168 176, 210 166" />
        </g>
      </svg>
    );
  }

  if (shape === "PASTA") {
    return (
      <svg
        viewBox="0 0 240 240"
        style={{ ...cadre, width: "21.5em", height: "21.5em" }}
        aria-hidden
      >
        <circle cx="120" cy="124" r="118" fill={BOIS_OMBRE} opacity="0.25" />
        <circle cx="120" cy="120" r="118" fill={FAIENCE} />
        <circle
          cx="120"
          cy="120"
          r="110"
          fill={FAIENCE_CLAIRE}
          stroke={accent}
          strokeOpacity="0.35"
          strokeWidth="4"
        />
      </svg>
    );
  }

  if (shape === "CUP") {
    return (
      <svg
        viewBox="0 0 240 240"
        style={{ ...cadre, width: "21.5em", height: "21.5em" }}
        aria-hidden
      >
        <circle cx="120" cy="124" r="114" fill={BOIS_OMBRE} opacity="0.25" />
        <circle cx="120" cy="120" r="114" fill={FAIENCE} />
        <circle
          cx="120"
          cy="120"
          r="108"
          fill={FAIENCE_CLAIRE}
          stroke={accent}
          strokeOpacity="0.35"
          strokeWidth="4"
        />
        {/* Trois grains posés sur le marli, aux seuls endroits que la plaque
            du QR ne recouvrira pas. */}
        {[200, 340, 90].map((angle) => {
          const r = (angle * Math.PI) / 180;
          const x = 120 + Math.cos(r) * 100;
          const y = 120 + Math.sin(r) * 100;
          return (
            <g key={angle} transform={`translate(${x} ${y}) rotate(${angle})`}>
              <ellipse rx="12" ry="8.5" fill={CAFE} opacity="0.55" />
              <path
                d="M-9 0 q9 -5 18 0"
                fill="none"
                stroke={FAIENCE}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    );
  }

  // Aucune silhouette : rien autour du QR.
  return null;
}
