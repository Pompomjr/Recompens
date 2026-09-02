"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/lib/auth/actions";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/lib/auth/form-state";

/**
 * Choix du nouveau mot de passe.
 *
 * Deux champs plutôt qu'un : le texte est masqué, et une faute de frappe
 * enfermerait la personne dehors une seconde fois — précisément ce qu'on est
 * en train de réparer.
 */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updatePasswordAction,
    initialAuthFormState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Nouveau mot de passe
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
        <span className="text-xs text-fg-faint">8 caractères minimum.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Confirmez le mot de passe
        </span>
        <input
          type="password"
          name="confirmation"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Enregistrement…" : "ENREGISTRER"}
      </button>
    </form>
  );
}
