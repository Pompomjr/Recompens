"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import { initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";

/**
 * Changement de mot de passe depuis les paramètres.
 *
 * Replié par défaut : personne ne vient ici pour ça, et un formulaire de mot
 * de passe ouvert en permanence sur un écran d'arrière-boutique invite à des
 * manipulations qu'on ne souhaite pas.
 */
export function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    changePasswordAction,
    initialAuthFormState
  );

  const champ =
    "rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand";
  const etiquette =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint";

  return (
    <details className="rounded-xl border border-line bg-surface-raised p-5">
      <summary className="cursor-pointer font-display text-[15px] tracking-tight text-fg">
        Changer mon mot de passe
      </summary>

      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Mot de passe actuel</span>
          <input
            type="password"
            name="actuel"
            required
            autoComplete="current-password"
            className={champ}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Nouveau mot de passe</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={champ}
          />
          <span className="text-xs text-fg-faint">8 caractères minimum.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Confirmez le nouveau mot de passe</span>
          <input
            type="password"
            name="confirmation"
            required
            minLength={8}
            autoComplete="new-password"
            className={champ}
          />
        </label>

        {state.status === "error" ? (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        ) : null}

        {state.status === "sent" ? (
          <p role="status" className="text-sm text-brand">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg px-5 py-2.5 font-display text-sm tracking-[0.04em] disabled:opacity-50"
          style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
        >
          {pending ? "Enregistrement…" : "CHANGER LE MOT DE PASSE"}
        </button>
      </form>
    </details>
  );
}
