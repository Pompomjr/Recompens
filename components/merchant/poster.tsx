"use client";

import { useState } from "react";
import { BrandMarkSolid } from "@/components/brand/logo";
import { formatVisits } from "@/lib/format";

/**
 * L'affichette de comptoir.
 *
 * C'est la seule pièce imprimée du produit, et le seul endroit où un client
 * découvre le programme. Trois contraintes ont dicté la mise en page :
 *
 *  1. Elle est lue DEBOUT, à un mètre, pendant qu'on paie. Une seule idée
 *     doit être lisible à cette distance : ce qu'on gagne. Le reste ne se lit
 *     qu'une fois penché sur le QR.
 *  2. Le QR doit être scanné du premier coup. Il fait 55 mm de côté en A5 —
 *     très au-dessus du minimum technique — parce que la marge sert à
 *     absorber la main qui tremble et la lumière du comptoir, pas le lecteur.
 *  3. Elle sera souvent imprimée sur l'imprimante du commerce. D'où la
 *     version claire par défaut : une affichette pleine d'encre sort baveuse
 *     d'une jet d'encre bas de gamme, et le QR avec elle.
 *
 * La couleur vient du commerce, pas de Recompens : c'est SON affichette. Le
 * vert de la marque n'apparaît qu'en pied, à la taille d'une mention légale.
 */

type Variante = "clair" | "sombre";
type Format = "a5" | "a4";

/**
 * Tout l'intérieur de l'affichette est dimensionné en `em`. Changer la seule
 * taille de base rééchelonne la composition entière — c'est ce qui permet au
 * A4 d'être exactement le A5 agrandi, sans une seule valeur à retoucher.
 */
const FORMATS: Record<Format, { largeur: string; hauteur: string; base: string; libelle: string }> = {
  a5: { largeur: "148mm", hauteur: "210mm", base: "3.6mm", libelle: "A5 — comptoir" },
  a4: { largeur: "210mm", hauteur: "297mm", base: "5.1mm", libelle: "A4 — vitrine" },
};

export function Poster({
  merchantName,
  logoUrl,
  visitsRequired,
  rewardName,
  qrDataUrl,
  ink,
  onInk,
}: {
  merchantName: string;
  /** Logo du commerce. Absent, l'affichette s'ouvre directement sur le nom. */
  logoUrl: string | null;
  visitsRequired: number;
  rewardName: string;
  qrDataUrl: string;
  /** Couleur du commerce. */
  ink: string;
  /** Texte lisible posé dessus. */
  onInk: string;
}) {
  const [variante, setVariante] = useState<Variante>("clair");
  const [format, setFormat] = useState<Format>("a5");

  const dims = FORMATS[format];
  const sombre = variante === "sombre";

  // En version sombre la couleur du commerce devient le papier ; en version
  // claire elle reste une encre d'accent sur fond blanc cassé.
  const fond = sombre ? ink : "#FBFAF7";
  const texte = sombre ? onInk : "#16171A";
  const accent = sombre ? onInk : ink;
  const discret = sombre ? `${onInk}99` : "#6B6F76";
  const filet = sombre ? `${onInk}33` : "#DFDBD2";

  return (
    <div className="flex flex-col gap-5">
      {/* Réglages : à l'écran seulement, jamais sur le papier. */}
      <div
        data-hors-impression
        className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-raised p-4"
      >
        <Choix
          label="Version"
          options={[
            { valeur: "clair", libelle: "Claire" },
            { valeur: "sombre", libelle: "Couleur du commerce" },
          ]}
          valeur={variante}
          onChange={(v) => setVariante(v as Variante)}
        />
        <Choix
          label="Format"
          options={[
            { valeur: "a5", libelle: FORMATS.a5.libelle },
            { valeur: "a4", libelle: FORMATS.a4.libelle },
          ]}
          valeur={format}
          onChange={(v) => setFormat(v as Format)}
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded-lg px-5 py-2.5 font-display text-sm tracking-[0.04em]"
          style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
        >
          IMPRIMER
        </button>
      </div>

      {sombre ? (
        <p
          data-hors-impression
          className="rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
        >
          La version couleur consomme beaucoup d&apos;encre. Sur une imprimante
          de bureau, vérifiez que le QR reste net avant d&apos;en tirer
          plusieurs — sinon, préférez la version claire.
        </p>
      ) : null}

      {/* L'affichette elle-même. `affiche` porte les règles d'impression. */}
      <div className="overflow-x-auto">
        <div
          className={`affiche affiche--${format} mx-auto`}
          style={{
            width: dims.largeur,
            height: dims.hauteur,
            fontSize: dims.base,
            backgroundColor: fond,
            color: texte,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "3.4em 2.6em",
            boxSizing: "border-box",
          }}
        >
          {/* Le logo ouvre l'affiche : c'est lui que le client reconnaît de
              loin, mieux qu'un intertitre.

              Contrairement à la carte, il n'est PAS enfermé dans un rond. Une
              enseigne dessine rarement son logo dans un cercle — une planche,
              une devanture, un bandeau sont larges — et la pastille ronde les
              réduirait au tiers de la place disponible. Ici la hauteur est
              fixe, la largeur libre.

              La plaque blanche reste, y compris sur fond clair : beaucoup de
              logos de commerce sont dessinés en foncé sur blanc, et la
              version couleur les ferait disparaître. */}
          {logoUrl ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "0.5em 0.8em",
                marginBottom: "1em",
                lineHeight: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- adresse
                  saisie en base : la passer à l'optimiseur imposerait de
                  déclarer chaque domaine dans next.config. */}
              <img
                src={logoUrl}
                alt={merchantName}
                style={{
                  height: "5em",
                  width: "auto",
                  maxWidth: "15em",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          ) : null}

          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "0.82em",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accent,
            }}
          >
            Carte de fidélité
          </p>

          <h1
            style={{
              margin: "0.5em 0 0 0",
              fontFamily: "var(--font-display)",
              fontSize: "2.1em",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {merchantName}
          </h1>

          {/* L'offre : la seule chose lisible à un mètre. */}
          <p
            style={{
              margin: "1.5em 0 0 0",
              fontFamily: "var(--font-display)",
              fontSize: "1.55em",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            {formatVisits(visitsRequired)}
            <br />
            <span style={{ color: accent }}>= {rewardName}</span>
          </p>

          <div
            style={{
              width: "3.4em",
              height: "0.16em",
              backgroundColor: accent,
              margin: "1.5em 0",
            }}
          />

          {/* Le QR est posé sur du blanc même en version sombre : un lecteur
              a besoin du contraste maximal, et la couleur du commerce ne vaut
              pas un scan raté. */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "0.7em",
              lineHeight: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL
                générée côté serveur : rien à optimiser, rien à autoriser. */}
            <img
              src={qrDataUrl}
              alt={`QR code d'inscription — ${merchantName}`}
              style={{ width: "14.2em", height: "14.2em", display: "block" }}
            />
          </div>

          <p
            style={{
              margin: "1.3em 0 0 0",
              fontFamily: "var(--font-display)",
              fontSize: "1.05em",
              lineHeight: 1.2,
            }}
          >
            Scannez pour créer votre carte
          </p>

          <ol
            style={{
              listStyle: "none",
              margin: "1.1em 0 0 0",
              padding: 0,
              display: "flex",
              gap: "1.4em",
              fontSize: "0.86em",
              lineHeight: 1.35,
            }}
          >
            {["Scannez le code", "Entrez votre prénom", "C'est fait"].map(
              (etape, index) => (
                <li key={etape} style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85em",
                      color: accent,
                      marginBottom: "0.3em",
                    }}
                  >
                    {index + 1}
                  </span>
                  {etape}
                </li>
              )
            )}
          </ol>

          <p
            style={{
              margin: "1.2em 0 0 0",
              fontSize: "0.86em",
              color: discret,
            }}
          >
            Aucune application à installer.
          </p>

          {/* Pied : la marque, à la taille d'une mention. C'est l'affichette
              du commerce, pas la nôtre. */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "1.4em",
              borderTop: `1px solid ${filet}`,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5em",
            }}
          >
            <BrandMarkSolid size={14} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62em",
                letterSpacing: "0.16em",
                color: discret,
              }}
            >
              PROPULSÉ PAR RECOMPENS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Choix({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: { valeur: string; libelle: string }[];
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
        {label}
      </span>
      <div className="flex gap-1.5">
        {options.map((option) => {
          const actif = option.valeur === valeur;
          return (
            <button
              key={option.valeur}
              type="button"
              onClick={() => onChange(option.valeur)}
              aria-pressed={actif}
              className={`rounded-lg border px-3 py-2 text-sm ${
                actif
                  ? "border-brand text-fg"
                  : "border-line text-fg-faint"
              }`}
              style={actif ? { backgroundColor: "rgba(47,191,113,0.12)" } : undefined}
            >
              {option.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
