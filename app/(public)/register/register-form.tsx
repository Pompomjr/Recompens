"use client";

import { useActionState } from "react";
import { registerMerchantAction } from "@/lib/auth/actions";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/lib/auth/form-state";

/**
 * cf SPEC §6 — Inscription commerçant : Email / password → Nom commerce.
 * Le rôle MERCHANT n'est pas un champ du formulaire : il est imposé par la
 * Server Action, sinon n'importe qui pourrait s'inscrire ADMIN (cf SPEC §5).
 */
export function RegisterMerchantForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerMerchantAction,
    initialAuthFormState
  );

  if (state.status === "confirm_email") {
    return (
      <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-800">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">
          Nom du commerce
        </span>
        <input
          type="text"
          name="merchantName"
          required
          minLength={2}
          maxLength={80}
          placeholder="Café Dupont"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">
          Mot de passe
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-base outline-none focus:border-neutral-900"
        />
        <span className="text-xs text-neutral-500">8 caractères minimum.</span>
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
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
