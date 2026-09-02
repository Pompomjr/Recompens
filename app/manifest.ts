import type { MetadataRoute } from "next";

/**
 * Manifeste de l'application web.
 *
 * Il existe pour une seule raison : permettre au client d'AJOUTER SA CARTE À
 * L'ÉCRAN D'ACCUEIL. Sans manifeste, Android ne propose jamais l'installation,
 * et le client n'a d'autre moyen de retrouver sa carte que de revenir en
 * boutique rescanner le QR du comptoir.
 *
 * `start_url` pointe sur /customer et non sur l'accueil : quelqu'un qui
 * installe depuis sa carte veut retrouver SES cartes, pas la page de
 * présentation du produit.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recompens — mes cartes de fidélité",
    short_name: "Recompens",
    description:
      "Vos cartes de fidélité chez vos commerces de proximité, sans application à installer.",
    lang: "fr",
    start_url: "/customer",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#17140F",
    theme_color: "#2FBF71",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
