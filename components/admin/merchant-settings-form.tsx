"use client";

import { useActionState, useState } from "react";
import type { CardStyle, VesselShape } from "@prisma/client";
import { updateMerchantSettingsAction } from "@/lib/admin/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";
import { MerchantLogo } from "@/components/merchant/merchant-logo";

/**
 * Les réglages d'un commerce, dans l'écran d'exploitation.
 *
 * Un formulaire replié par commerce plutôt qu'un tableau éditable : on règle
 * un commerce à la fois, en général le jour de son installation. Un tableau
 * inviterait à modifier trois lignes d'un coup sans regarder ce qu'on change.
 */

const SILHOUETTES: { valeur: VesselShape | ""; libelle: string }[] = [
  { valeur: "", libelle: "Aucune" },
  { valeur: "CUP", libelle: "Tasse" },
  { valeur: "PASTA", libelle: "Assiette de pâtes" },
  { valeur: "SANDWICH", libelle: "Sandwich" },
];

export function MerchantSettingsForm({
  merchant,
}: {
  merchant: {
    id: string;
    name: string;
    logoUrl: string | null;
    cardStyle: CardStyle;
    vesselShape: VesselShape | null;
    brandColor: string;
    qrOrnementLogo: boolean;
    minMinutesBetweenVisits: number | null;
    programName: string | null;
    clients: number;
  };
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateMerchantSettingsAction,
    initialFormState
  );
  const [style, setStyle] = useState<CardStyle>(merchant.cardStyle);
  const [couleur, setCouleur] = useState(merchant.brandColor);

  const etiquette =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint";
  const champ =
    "rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none focus:border-brand";

  return (
    <details className="rounded-xl border border-line bg-surface-raised p-5">
      <summary className="flex cursor-pointer items-center gap-3">
        <MerchantLogo
          name={merchant.name}
          logoUrl={merchant.logoUrl}
          size={32}
          color="var(--fg-soft)"
          border="var(--line)"
          className="font-display"
        />
        <span className="flex flex-1 flex-col">
          <span className="font-display text-[15px] tracking-tight text-fg">
            {merchant.name}
          </span>
          <span className="font-mono text-[10px] tracking-[0.12em] text-fg-faint">
            {merchant.cardStyle}
            {merchant.vesselShape ? ` / ${merchant.vesselShape}` : ""} —{" "}
            {merchant.clients} client{merchant.clients > 1 ? "s" : ""}
          </span>
        </span>
        <span
          className="size-5 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: merchant.brandColor }}
          aria-hidden
        />
      </summary>

      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="merchantId" value={merchant.id} />

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Style de carte</span>
          <select
            name="cardStyle"
            value={style}
            onChange={(event) => setStyle(event.target.value as CardStyle)}
            className={champ}
          >
            <option value="TICKET">Ticket — universel</option>
            <option value="VESSEL">Contenant — silhouette du métier</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Silhouette</span>
          <select
            name="vesselShape"
            defaultValue={merchant.vesselShape ?? ""}
            className={champ}
            disabled={style === "TICKET"}
          >
            {SILHOUETTES.map((silhouette) => (
              <option key={silhouette.valeur} value={silhouette.valeur}>
                {silhouette.libelle}
              </option>
            ))}
          </select>
          <span className="text-xs text-fg-faint">
            Elle sert aussi de décor autour du QR sur l&apos;affichette.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Couleur du commerce</span>
          <span className="flex items-center gap-3">
            <input
              type="color"
              value={couleur}
              onChange={(event) => setCouleur(event.target.value)}
              className="h-10 w-14 shrink-0 rounded-lg border border-line bg-surface"
              aria-label="Choisir la couleur"
            />
            <input
              type="text"
              name="brandColor"
              value={couleur}
              onChange={(event) => setCouleur(event.target.value)}
              pattern="#[0-9a-fA-F]{6}"
              required
              className={`${champ} flex-1 font-mono`}
            />
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-line p-3.5">
          <input
            type="checkbox"
            name="qrOrnementLogo"
            defaultChecked={merchant.qrOrnementLogo}
            className="mt-0.5 size-4"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">
              Logo en filigrane autour du QR
            </span>
            <span className="text-sm text-fg-faint">
              Sur l&apos;affichette, et seulement si aucune silhouette n&apos;est
              réglée. Sans logo enregistré, sans effet.
            </span>
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Délai anti-cumul (minutes)</span>
          <input
            type="number"
            name="minMinutesBetweenVisits"
            defaultValue={merchant.minMinutesBetweenVisits ?? 30}
            min={0}
            max={1440}
            required
            inputMode="numeric"
            className={champ}
            disabled={merchant.programName === null}
          />
          <span className="text-xs text-fg-faint">
            {merchant.programName === null
              ? "Aucun programme : rien à régler pour l'instant."
              : "0 désactive le délai. Restaurant ≈ 180, coiffeur ≈ 1440."}
          </span>
        </label>

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
          {pending ? "Enregistrement…" : "ENREGISTRER"}
        </button>
      </form>
    </details>
  );
}
