"use client";

import { useActionState } from "react";
import { joinProgramAction } from "@/lib/customers/actions";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * cf SPEC §8 — Prénom, Email (optionnel), bouton « CRÉER MA CARTE ».
 *
 * Le `programId` est transporté en champ caché, mais il est revérifié en base
 * par la Server Action : le formulaire n'est jamais cru sur parole (§5).
 *
 * Les couleurs viennent du commerce : c'est sa page, pas la nôtre.
 */
export function JoinForm({
  programId,
  ink,
  onInk,
}: {
  programId: string;
  ink: string;
  onInk: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    joinProgramAction,
    initialFormState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="programId" value={programId} />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[color:var(--ink-soft)]">
          PRÉNOM
        </span>
        <input
          type="text"
          name="firstName"
          required
          maxLength={50}
          autoComplete="given-name"
          placeholder="Votre prénom"
          className="h-14 border-2 border-[color:var(--ink-faint)] bg-white px-4 text-base text-ink outline-none placeholder:text-[color:var(--ink-faint)] focus:border-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[color:var(--ink-soft)]">
          EMAIL <span className="font-normal opacity-70">— OPTIONNEL</span>
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Pour retrouver votre carte"
          className="h-14 border-2 border-[color:var(--ink-faint)] bg-white px-4 text-base text-ink outline-none placeholder:text-[color:var(--ink-faint)] focus:border-ink"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-16 font-display text-lg tracking-[0.06em] disabled:opacity-50"
        style={{ backgroundColor: ink, color: onInk }}
      >
        {pending ? "CRÉATION…" : "CRÉER MA CARTE"}
      </button>
    </form>
  );
}
