"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/lib/auth/form-state";

/**
 * Formulaire de connexion. Aucun rôle n'est envoyé depuis le navigateur :
 * la destination après connexion est décidée côté serveur à partir de
 * `User.role` en base (cf SPEC §5).
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    initialAuthFormState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
          autoComplete="current-password"
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
