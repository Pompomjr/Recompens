"use client";

import { useActionState, useRef, useState } from "react";
import { updateMerchantLogoAction } from "@/lib/merchant/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";
import { MerchantLogo } from "./merchant-logo";

/**
 * Envoi du logo du commerce.
 *
 * L'aperçu est affiché AVANT l'envoi, depuis le fichier local : le commerçant
 * découvre tout de suite que son logo carré sera rogné en rond, et peut
 * changer d'image sans avoir attendu un aller-retour serveur.
 */
export function LogoForm({
  merchantName,
  logoUrl,
}: {
  merchantName: string;
  logoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateMerchantLogoAction,
    initialFormState
  );
  const [apercu, setApercu] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Aperçu local si un fichier vient d'être choisi, logo enregistré sinon.
  const affiche = apercu ?? logoUrl;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base tracking-tight text-fg">
          Logo du commerce
        </h2>
        <p className="text-sm text-fg-soft">
          Il apparaîtra sur la carte de vos clients et sur votre affichette de
          comptoir. Sans logo, c&apos;est l&apos;initiale de votre nom qui est
          affichée.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <MerchantLogo
          name={merchantName}
          logoUrl={affiche}
          size={64}
          color="var(--fg-soft)"
          border="var(--line)"
          className="font-display"
        />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const fichier = event.target.files?.[0];
              setApercu(fichier ? URL.createObjectURL(fichier) : null);
            }}
            className="block w-full text-sm text-fg-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-4 file:py-2 file:font-display file:text-sm file:text-fg"
          />
          <p className="text-xs text-fg-faint">
            PNG, JPEG ou WEBP — 2 Mo maximum. Un logo carré, ou détouré sur
            fond transparent, rendra le mieux.
          </p>
        </div>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p role="status" className="text-sm text-brand">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg px-5 py-2.5 font-display text-sm tracking-[0.04em] disabled:opacity-50"
        style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
      >
        {pending ? "Envoi…" : "ENREGISTRER LE LOGO"}
      </button>
    </form>
  );
}
