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
      <p className="rounded-lg border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
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
        className="mt-2 rounded-lg bg-neutral-900 px-5 py-3 font-display text-[15px] tracking-[0.04em] text-white disabled:opacity-50"
      >
        {pending ? "Envoi…" : "RECEVOIR LE LIEN"}
      </button>
    </form>
  );
}
