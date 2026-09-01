"use client";

import { useActionState } from "react";
import { joinProgramAction } from "@/lib/customers/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * cf SPEC §8 — Prénom, Email (optionnel), bouton "CRÉER MA CARTE".
 *
 * Le `programId` est transporté en champ caché, mais il est revérifié en base
 * par la Server Action : le formulaire n'est jamais cru sur parole (§5).
 */
export function JoinForm({ programId }: { programId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    joinProgramAction,
    initialFormState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="programId" value={programId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Prénom</span>
        <input
          type="text"
          name="firstName"
          required
          maxLength={50}
          autoComplete="given-name"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">
          Email <span className="font-normal text-neutral-500">(optionnel)</span>
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
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
        className="mt-2 rounded-lg bg-neutral-900 px-5 py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Création…" : "CRÉER MA CARTE"}
      </button>
    </form>
  );
}
