import { ImageResponse } from "next/og";

/**
 * L'aperçu affiché quand on partage recompens.com — WhatsApp, Messenger, mail.
 *
 * Sans lui, le lien arrivait nu : une adresse grise, aucune image. Or les
 * commerçants se passent le lien entre eux, et un lien sans aperçu est un
 * lien qu'on ne clique pas.
 *
 * L'image est générée au build (statique), avec les polices de la marque
 * chargées depuis Google Fonts. Le moteur d'images n'accepte que TTF, OTF et
 * WOFF : les fichiers servis par `next/font` (WOFF2) ne lui conviennent pas.
 * Chaque police a un REPLI — si le réseau manque au build, l'aperçu sort avec
 * la police par défaut plutôt que de faire échouer tout le déploiement pour
 * une vignette.
 */

export const alt =
  "Recompens — la carte de fidélité de vos clients, sur leur téléphone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VERT = "#2FBF71";
const ENCRE = "#17140F";
const PAPIER = "#EFE4CE";

const TITRE_1 = "La carte de fidélité de vos clients,";
const TITRE_2 = "sur leur téléphone.";
const SOUS_TITRE = "Aucune application à installer.";

/**
 * Charge une police Google, réduite aux seuls caractères utilisés.
 *
 * Le paramètre `text` fait servir un sous-ensemble de quelques kilo-octets ;
 * sans agent utilisateur de navigateur moderne, Google répond en TrueType,
 * le format que le moteur d'images sait lire.
 */
async function police(
  famille: string,
  texte: string
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${famille}&text=${encodeURIComponent(texte)}`
    ).then((reponse) => reponse.text());

    const url = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/
    )?.[1];
    if (!url) return null;

    const reponse = await fetch(url);
    return reponse.ok ? await reponse.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const [archivo, saira, stencil] = await Promise.all([
    police("Archivo+Black", TITRE_1 + TITRE_2 + SOUS_TITRE),
    police("Saira:wght@800", "RCOMPNS"),
    police("Saira+Stencil+One", "E"),
  ]);

  const fonts = [
    archivo && { name: "Archivo Black", data: archivo, weight: 400 as const },
    saira && { name: "Saira", data: saira, weight: 800 as const },
    stencil && { name: "Saira Stencil", data: stencil, weight: 400 as const },
  ]
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .map((f) => ({ ...f, style: "normal" as const }));

  // Le mot-symbole : lettres pleines en Saira, les deux E ajourés en vert,
  // comme dans components/brand/logo.tsx. Sans ses polices, il retombe sur
  // Archivo Black plutôt que sur la police par défaut.
  const lettres = saira ? "Saira" : archivo ? "Archivo Black" : undefined;
  const ajourees = stencil ? "Saira Stencil" : lettres;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: ENCRE,
          color: PAPIER,
          padding: "72px 84px",
          fontFamily: archivo ? "Archivo Black" : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 1,
            fontFamily: lettres,
          }}
        >
          <span>R</span>
          <span style={{ color: VERT, fontFamily: ajourees, fontWeight: 400 }}>
            E
          </span>
          <span>COMP</span>
          <span style={{ color: VERT, fontFamily: ajourees, fontWeight: 400 }}>
            E
          </span>
          <span>NS</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 78,
            lineHeight: 1.05,
            letterSpacing: -1,
          }}
        >
          <span>{TITRE_1}</span>
          <span style={{ color: VERT }}>{TITRE_2}</span>
        </div>

        <div style={{ display: "flex", fontSize: 32, color: "rgba(239,228,206,0.72)" }}>
          {SOUS_TITRE}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined }
  );
}
