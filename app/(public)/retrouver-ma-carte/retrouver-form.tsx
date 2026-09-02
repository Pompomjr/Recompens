"use client";

import { useActionState } from "react";
import { retrouverCarteAction } from "@/lib/customers/recovery";
import { initialFormState, type FormState } from "@/lib/forms/state";

export function RetrouverForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    retrouverCarteAction,
    initialFormState
  );

  // Une fois le lien parti, le formulaire n'a plus rien à demander : le
  // laisser affiché inviterait à recliquer, et donc à épuiser le quota
  // d'envoi de Supabase sur une adresse qui a déjà reçu son lien.
  if (state.status === "success") {
    return (
      <p
        role="status"
        className="rounded-lg border border-line bg-surface-raised px-4 py-4 text-sm text-fg-soft"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Votre adresse email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="vous@exemple.be"
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
        className="rounded-lg px-5 py-3.5 font-display text-[15px] tracking-[0.04em] disabled:opacity-50"
        style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
      >
        {pending ? "Envoi…" : "RECEVOIR LE LIEN"}
      </button>
    </form>
  );
}
