"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * « Gardez votre carte » — l'invitation à l'ajouter à l'écran d'accueil.
 *
 * Le problème qu'elle résout est le plus grave du produit : l'identité du
 * client tient à un cookie. Onglet fermé, téléphone changé, cookies effacés,
 * et sa carte est perdue — le seul recours est de revenir en boutique
 * rescanner le QR du comptoir. Ses visites, elles, ne reviennent pas.
 *
 * Deux chemins, parce que les deux plateformes ne se ressemblent pas :
 *  - Android/Chrome expose `beforeinstallprompt` : on capte l'événement et on
 *    ouvre la vraie boîte de dialogue système d'un seul geste ;
 *  - iOS ne l'expose pas, et ne l'exposera pas. Il faut donc DÉCRIRE le geste
 *    — Partager, puis « Sur l'écran d'accueil ». Un texte vaut mieux qu'un
 *    bouton qui ne ferait rien.
 *
 * Le bloc disparaît une fois l'application installée, et se laisse écarter :
 * l'oubli est mémorisé dans le navigateur, sinon la même invitation
 * réapparaîtrait à chaque visite validée — au moment précis où le client est
 * content de son passage.
 */

const OUBLI = "recompens.garder-carte.ecarte";

type InvitePrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Vrai une fois le composant monté dans le navigateur.
 *
 * Passe par `useSyncExternalStore` plutôt que par un `useState` posé depuis un
 * effet : l'environnement (iOS ? déjà installée ? déjà écartée ?) se LIT, il
 * ne se synchronise pas. Le poser en état déclencherait un rendu en cascade,
 * que React déconseille et que le linter refuse.
 */
function useClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function dejaEcarte() {
  try {
    return window.localStorage.getItem(OUBLI) === "1";
  } catch {
    // Navigation privée ou stockage bloqué : on propose, c'est le défaut le
    // moins pénalisant.
    return false;
  }
}

export function GarderCarte() {
  const estClient = useClient();
  const [invite, setInvite] = useState<InvitePrompt | null>(null);
  const [ecarte, setEcarte] = useState(false);

  useEffect(() => {
    const capter = (event: Event) => {
      // Sans ça, Chrome affiche sa propre bannière EN PLUS de la nôtre : deux
      // demandes pour la même chose.
      event.preventDefault();
      setInvite(event as InvitePrompt);
    };

    window.addEventListener("beforeinstallprompt", capter);
    return () => window.removeEventListener("beforeinstallprompt", capter);
  }, []);

  if (!estClient || ecarte || dejaEcarte()) return null;

  // Déjà installée : plus rien à proposer.
  const installee =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (installee) return null;

  const ua = window.navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPad récent : il se déclare « Macintosh », seul le tactile le trahit.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  // Ni invite système, ni iOS : navigateur de bureau, ou plateforme sans
  // installation. Inutile d'expliquer un geste qui n'existe pas ici.
  if (!invite && !ios) return null;

  function ecarter() {
    try {
      window.localStorage.setItem(OUBLI, "1");
    } catch {
      // Rien à faire : le bloc disparaît pour cette visite, c'est déjà ça.
    }
    setEcarte(true);
  }

  async function installer() {
    if (!invite) return;
    await invite.prompt();
    const { outcome } = await invite.userChoice;
    if (outcome === "accepted") setEcarte(true);
    setInvite(null);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-paper/15 bg-paper/[0.06] p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base tracking-tight text-paper">
          Gardez votre carte à portée de main
        </h2>
        <p className="text-sm text-paper/60">
          Ajoutez-la à votre écran d&apos;accueil : vous la retrouverez d&apos;un
          geste, et vous ne la perdrez pas si vous fermez cette page.
        </p>
      </div>

      {invite ? (
        <button
          type="button"
          onClick={installer}
          className="self-start rounded-lg px-5 py-2.5 font-display text-sm tracking-[0.04em]"
          style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
        >
          AJOUTER À L&apos;ÉCRAN D&apos;ACCUEIL
        </button>
      ) : (
        <p className="text-sm text-paper/75">
          Appuyez sur <strong className="text-paper">Partager</strong> en bas de
          votre navigateur, puis sur{" "}
          <strong className="text-paper">« Sur l&apos;écran d&apos;accueil »</strong>.
        </p>
      )}

      <button
        type="button"
        onClick={ecarter}
        className="self-start font-mono text-[11px] tracking-[0.16em] text-paper/40 underline"
      >
        NON MERCI
      </button>
    </section>
  );
}
