"use client";

import { useActionState } from "react";
import { attacherEmailAction } from "@/lib/customers/recovery";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * « Ne perdez pas vos visites » — le rattachement d'une adresse à la carte.
 *
 * Replié par défaut : le client vient voir son compteur, pas remplir un
 * formulaire. Mais l'enjeu est réel, d'où la phrase qui le nomme sans
 * dramatiser — un client qui perd ses sept visites ne revient pas.
 *
 * N'apparaît que si aucune adresse n'est encore rattachée.
 */
export function AttacherEmail() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    attacherEmailAction,
    initialFormState
  );

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="rounded-2xl border border-paper/15 bg-paper/[0.06] p-5 text-sm text-paper/70"
      >
        {state.message}
      </p>
    );
  }

  return (
    <details className="rounded-2xl border border-paper/15 bg-paper/[0.06] p-5">
      <summary className="cursor-pointer font-display text-base tracking-tight text-paper">
        Ne perdez pas vos visites
      </summary>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-paper/60">
          Enregistrez votre adresse email : si vous changez de téléphone ou
          effacez vos données de navigation, elle vous permettra de retrouver
          votre carte et vos visites.
        </p>

        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="vous@exemple.be"
          className="rounded-lg border border-paper/20 bg-paper/5 px-3.5 py-2.5 text-base text-paper outline-none placeholder:text-paper/35 focus:border-paper/50"
        />

        {state.status === "error" ? (
          <p role="alert" className="text-sm text-red-300">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg px-5 py-2.5 font-display text-sm tracking-[0.04em] disabled:opacity-50"
          style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
        >
          {pending ? "Envoi…" : "ENREGISTRER MON ADRESSE"}
        </button>

        <p className="text-xs text-paper/40">
          Nous ne l&apos;utilisons que pour cela. Aucun envoi commercial.
        </p>
      </form>
    </details>
  );
}
