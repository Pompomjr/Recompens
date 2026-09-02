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
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Nom du programme
        </span>
        <input
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Carte fidélité Café Dupont"
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
          required
          min={1}
          max={100}
          defaultValue={10}
          inputMode="numeric"
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
        <span className="text-xs text-fg-faint">
          Nombre de passages avant que la récompense se débloque.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">Récompense</span>
        <input
          type="text"
          name="rewardName"
          required
          minLength={2}
          maxLength={80}
          placeholder="1 café offert"
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg px-5 py-3.5 font-display text-[15px] tracking-[0.04em] disabled:opacity-50" style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
      >
        {pending ? "Création…" : "CRÉER"}
      </button>
    </form>
  );
}
