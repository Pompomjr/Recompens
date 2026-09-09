"use client";

import { useActionState } from "react";
import { addForgottenVisitAction } from "@/lib/customers/manual-visit";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * « Visite oubliée » — le rattrapage, depuis la liste des clients.
 *
 * En DEUX temps volontairement. Cette liste se parcourt au pouce, sur un
 * téléphone posé près de la caisse : un bouton qui crédite au premier appui
 * ferait des visites fantômes à chaque frôlement. Le second appui coûte une
 * seconde et supprime toute la classe d'erreurs.
 *
 * Le libellé nomme le client : dans une liste, on confirme souvent la ligne
 * d'à côté.
 */
export function VisiteOubliee({
  membershipId,
  firstName,
}: {
  membershipId: string;
  firstName: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addForgottenVisitAction,
    initialFormState
  );

  if (state.status === "success") {
    return (
      <p role="status" className="text-xs font-medium text-brand">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="membershipId" value={membershipId} />

      <details className="text-right">
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.1em] text-fg-faint underline">
          VISITE OUBLIÉE
        </summary>
        <button
          type="submit"
          disabled={pending}
          className="mt-1.5 rounded-md border border-brand/50 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-brand disabled:opacity-50"
        >
          {pending ? "…" : `AJOUTER +1 À ${firstName.toUpperCase()}`}
        </button>
      </details>

      {state.status === "error" ? (
        <p role="alert" className="text-xs text-red-400">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
