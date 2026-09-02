"use client";

import { useState } from "react";

/**
 * La pastille du commerce : son logo s'il en a un, l'initiale de son nom
 * sinon.
 *
 * Le repli n'est pas un pis-aller — c'est ce qui permet d'accueillir un
 * commerçant le jour même, sans attendre qu'il retrouve son fichier. Le même
 * composant sert sur la carte client, sur l'affichette et dans le dashboard,
 * pour que le logo apparaisse partout dès qu'il est renseigné, et nulle part
 * tant qu'il ne l'est pas.
 *
 * Il replie AUSSI quand l'image ne charge pas. Le cas s'est produit en vrai :
 * le fichier avait été supprimé du stockage alors que la base pointait encore
 * dessus, et chaque écran affichait l'icône d'image cassée — y compris la
 * carte des clients, qui n'y sont pour rien. Une adresse enregistrée n'est
 * pas une garantie que le fichier existe encore, d'où ce composant client.
 *
 * Le logo, lui, est posé À NU sur le fond. Le disque et le filet appartiennent
 * au repli, pas à l'image : un PNG détouré posé sur une plaque blanche donne
 * une vignette collée sur la page, visible comme telle sur fond sombre. Il
 * n'est pas non plus rogné en rond — un logo large y perdrait ses extrémités.
 *
 * Contrepartie assumée : un logo très foncé sur une encre très foncée sera
 * peu lisible. C'est au commerçant de fournir un fichier adapté, et l'écran
 * Paramètres le lui dit — plutôt que de dégrader tous les logos corrects pour
 * protéger le cas rare.
 */

export function MerchantLogo({
  name,
  logoUrl,
  size,
  /** Couleur du texte et du filet quand il n'y a pas de logo. */
  color,
  /** Fond de la pastille de repli. Transparent si absent. */
  background,
  /** Filet autour de la pastille. */
  border,
  className = "",
  style: styleExterne,
}: {
  name: string;
  logoUrl: string | null;
  /**
   * Nombre de pixels, ou n'importe quelle longueur CSS. L'affichette passe
   * des `em` pour que le logo grandisse avec le format ; les écrans passent
   * des pixels.
   */
  size: number | string;
  color: string;
  background?: string;
  border?: string;
  className?: string;
  /** Marges éventuelles, laissées à l'appelant. */
  style?: React.CSSProperties;
}) {
  const [imageCassee, setImageCassee] = useState(false);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "9999px",
    ...styleExterne,
  };

  if (logoUrl && !imageCassee) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ ...style, borderRadius: undefined }}
        role="img"
        aria-label={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- adresse saisie
            à la main en base : la faire passer par l'optimiseur d'images
            imposerait de déclarer chaque domaine dans next.config. */}
        <img
          src={logoUrl}
          alt=""
          onError={() => setImageCassee(true)}
          style={{
            width: "100%",
            height: "100%",
            // `contain` et pas `cover` : un logo rogné devient une autre
            // marque. Mieux vaut du blanc autour qu'un nom coupé.
            objectFit: "contain",
            boxSizing: "border-box",
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        ...style,
        color,
        fontSize: typeof size === "number" ? size * 0.42 : "1.6em",
        ...(background ? { backgroundColor: background } : {}),
        ...(border ? { border: `2px solid ${border}` } : {}),
      }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
