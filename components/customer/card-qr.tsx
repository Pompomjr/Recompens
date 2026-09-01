"use client";

import { useState } from "react";

/**
 * cf SPEC §8 — bouton "AFFICHER MON QR", et §9 — le QR ne contient qu'un
 * token opaque, jamais le compteur ni d'information sensible.
 *
 * L'image est générée côté serveur puis passée ici en data URL : ce composant
 * ne fait que la montrer ou la cacher.
 */
export function CardQr({ qrDataUrl }: { qrDataUrl: string }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="w-full rounded-xl bg-neutral-900 px-6 py-4 text-base font-semibold text-white"
      >
        AFFICHER MON QR
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée
          côté serveur : rien à optimiser ni de domaine distant à autoriser. */}
      <img
        src={qrDataUrl}
        alt="Votre QR code de fidélité"
        className="h-60 w-60 rounded-lg border border-neutral-200 bg-white"
      />
      <p className="text-center text-sm text-neutral-600">
        Présentez ce QR au commerçant pour valider votre visite.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-sm text-neutral-500 underline"
      >
        Masquer
      </button>
    </div>
  );
}
