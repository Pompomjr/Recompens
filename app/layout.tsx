import type { Metadata } from "next";
import {
  Archivo_Black,
  Instrument_Sans,
  IBM_Plex_Mono,
  Saira,
  Saira_Stencil,
} from "next/font/google";
import "./globals.css";

/**
 * Typographie du produit.
 *
 * `globals.css` référençait `--font-geist-sans` sans que rien ne la charge :
 * l'application s'affichait donc en Arial. Les trois familles ci-dessous sont
 * chargées par `next/font`, qui les sert depuis notre propre domaine et
 * réserve leur place à l'avance — pas de scintillement au chargement.
 *
 * - Archivo Black : les titres et les grands chiffres, à lire à un mètre.
 * - Instrument Sans : tout le reste.
 * - IBM Plex Mono : les numéros de carte et les libellés du ticket.
 * - Saira et Saira Stencil : la marque, et elle seule. Deux membres de
 *   la MÊME famille : c'est ce qui permet d'alterner lettres pleines et
 *   lettres ajourées sans que le mot se disloque (cf components/brand/logo.tsx).
 */
const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const brand = Saira({
  weight: ["600", "800"],
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

const brandStencil = Saira_Stencil({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand-stencil",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recompens — Cartes de fidélité digitales",
  description:
    "La carte de fidélité de vos clients, sur leur téléphone. Aucune application à installer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`h-full antialiased ${display.variable} ${sans.variable} ${mono.variable} ${brand.variable} ${brandStencil.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
