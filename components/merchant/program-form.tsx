"use client";

import { useActionState } from "react";
import { createProgramAction } from "@/lib/programs/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * cf SPEC §7 — Écran : Nom / Visites nécessaires / Récompense / bouton CRÉER.
 *
 * Les contraintes HTML (`required`, `min`, `max`) ne sont qu'un confort :
 * la validation qui fait foi est celle de la Server Action (cf SPEC §5).
 */
export function ProgramForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createProgramAction,
    initialFormState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">
          Nom du programme
        </span>
        <input
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Carte fidélité Café Dupont"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">
          Visites nécessaires
        </span>
        <input
          type="number"
          name="visitsRequired"
          required
          min={1}
          max={100}
          defaultValue={10}
          inputMode="numeric"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
        <span className="text-xs text-neutral-500">
          Nombre de passages avant que la récompense se débloque.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Récompense</span>
        <input
          type="text"
          name="rewardName"
          required
          minLength={2}
          maxLength={80}
          placeholder="1 café offert"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-neutral-900 px-5 py-3 text-base font-medium text-white disabled:opacity-50"
      >
        {pending ? "Création…" : "CRÉER"}
      </button>
    </form>
  );
}
