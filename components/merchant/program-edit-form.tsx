"use client";

import { useActionState, useState } from "react";
import { updateProgramAction } from "@/lib/programs/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * Modification d'un programme existant.
 *
 * Replié par défaut : le commerçant vient sur cette page pour son QR, pas
 * pour changer ses règles. Ouvrir l'écran sur un formulaire d'édition
 * inviterait à modifier ce qui marche.
 */
export function ProgramEditForm({
  programId,
  name,
  visitsRequired,
  rewardName,
  active,
}: {
  programId: string;
  name: string;
  visitsRequired: number;
  rewardName: string;
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProgramAction,
    initialFormState
  );
  const [visits, setVisits] = useState(visitsRequired);

  const seuilChange = visits !== visitsRequired;

  return (
    <details className="rounded-xl border border-line bg-surface-raised p-5">
      <summary className="cursor-pointer font-display text-[15px] tracking-tight text-fg">
        Modifier le programme
      </summary>

      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="programId" value={programId} />

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
            Nom du programme
          </span>
          <input
            type="text"
            name="name"
            defaultValue={name}
            required
            minLength={2}
            maxLength={80}
            className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
            Visites nécessaires
          </span>
          <input
            type="number"
            name="visitsRequired"
            value={visits}
            onChange={(event) => setVisits(Number(event.target.value))}
            required
            min={1}
            max={100}
            inputMode="numeric"
            className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
          />
        </label>

        {seuilChange ? (
          <p className="rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Ce changement s&apos;applique aux cartes déjà en cours. Un client
            ayant déjà atteint le nouveau seuil verra sa récompense se
            débloquer. Une récompense déjà gagnée n&apos;est jamais reprise.
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
            Récompense
          </span>
          <input
            type="text"
            name="rewardName"
            defaultValue={rewardName}
            required
            minLength={2}
            maxLength={80}
            className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-line p-3.5">
          <input
            type="checkbox"
            name="active"
            defaultChecked={active}
            className="mt-0.5 size-4"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">
              Programme actif
            </span>
            <span className="text-sm text-fg-faint">
              Décoché, plus personne ne peut s&apos;inscrire ni valider de
              visite. Les cartes et l&apos;historique sont conservés.
            </span>
          </span>
        </label>

        {state.status === "error" ? (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg px-5 py-3.5 font-display text-[15px] tracking-[0.04em] disabled:opacity-50" style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
        >
          {pending ? "Enregistrement…" : "ENREGISTRER"}
        </button>
      </form>
    </details>
  );
}
