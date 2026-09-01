"use client";

import { useState } from "react";

/**
 * cf SPEC §8 — bouton « AFFICHER MON QR », et §9 — le QR ne contient qu'un
 * token opaque, jamais le compteur ni d'information sensible.
 *
 * L'image est générée côté serveur puis passée ici en data URL : ce composant
 * ne fait que la montrer ou la cacher. Il est replié par défaut — le client
 * n'affiche son code qu'au moment de payer.
 */
export function CardQr({
  qrDataUrl,
  ink,
  onInk,
}: {
  qrDataUrl: string;
  ink: string;
  onInk: string;
}) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="flex h-15 w-full items-center justify-center gap-2.5 font-display text-[15px] tracking-[0.09em]"
        style={{ backgroundColor: ink, color: onInk, height: "60px" }}
      >
        <QrIcon />
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
        className="size-56 bg-white p-2"
      />
      <p className="text-center text-sm text-[color:var(--ink-soft)]">
        Présentez ce QR au commerçant pour valider votre visite.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="font-mono text-[11px] tracking-[0.16em] text-[color:var(--ink-soft)] underline"
      >
        MASQUER
      </button>
    </div>
  );
}

function QrIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
    </svg>
  );
}
