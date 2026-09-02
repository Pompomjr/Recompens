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
      <div className="rounded-lg border border-line bg-surface-raised p-4">
        <p className="text-sm text-fg-soft">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Nom du commerce
        </span>
        <input
          type="text"
          name="merchantName"
          required
          minLength={2}
          maxLength={80}
          placeholder="Café Dupont"
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint">
          Mot de passe
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
        />
        <span className="text-xs text-fg-faint">8 caractères minimum.</span>
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
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
