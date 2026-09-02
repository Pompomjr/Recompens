"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker.
 *
 * Il ne sert pas à mettre en cache — il ne met rien en cache, cf public/sw.js.
 * Il existe parce que Chrome exige sa présence pour proposer l'ajout à
 * l'écran d'accueil, qui est le seul moyen pour un client de ne pas perdre sa
 * carte. Un échec d'enregistrement n'a donc aucune conséquence visible :
 * l'invitation se rabat alors sur les instructions manuelles.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[sw] enregistrement impossible:", error);
    });
  }, []);

  return null;
}
