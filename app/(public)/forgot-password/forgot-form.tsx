"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/lib/auth/form-state";

/**
 * Demande de lien de réinitialisation.
 *
 * La confirmation est volontairement la même que l'adresse existe ou non :
 * dire « compte inconnu » révélerait qui est inscrit.
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    initialAuthFormState
  );

  if (state.status === "sent") {
    return (
      <p className="rounded-lg border border-line bg-surface-raised p-4 text-sm text-fg-soft">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
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
        {pending ? "Envoi…" : "RECEVOIR LE LIEN"}
      </button>
    </form>
  );
}
