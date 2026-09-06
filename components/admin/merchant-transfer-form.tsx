"use client";

import { useActionState } from "react";
import { transferMerchantAction } from "@/lib/admin/transfer";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * Remise du commerce à son propriétaire, devant lui.
 *
 * Replié, et séparé des réglages : ce n'est pas une manipulation courante, et
 * elle change de main un compte entier. Mais elle doit rester faisable en
 * trente secondes au comptoir — d'où un seul champ, une case, un bouton.
 *
 * Le texte affiché après coup dit quoi faire ensuite : sans ça, on se retrouve
 * à expliquer de mémoire à un commerçant qui attend.
 */
export function MerchantTransferForm({
  merchantId,
  merchantName,
  ownerEmail,
  clients,
}: {
  merchantId: string;
  merchantName: string;
  ownerEmail: string | null;
  clients: number;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    transferMerchantAction,
    initialFormState
  );

  const etiquette =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-faint";

  if (state.status === "success") {
    return (
      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-brand/40 bg-brand/10 p-4">
        <p role="status" className="text-sm text-fg">
          {state.message}
        </p>
        <p className="text-sm text-fg-soft">
          Sur son téléphone : <strong className="text-fg">recompens.com/login</strong>{" "}
          → « Mot de passe oublié » → il reçoit le lien à sa nouvelle adresse.
        </p>
      </div>
    );
  }

  return (
    <details className="mt-4 rounded-lg border border-line p-4">
      <summary className="cursor-pointer text-sm font-medium text-fg-soft">
        Remettre ce commerce à son propriétaire
      </summary>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="merchantId" value={merchantId} />

        <p className="text-sm text-fg-soft">
          Le compte change de main. Son identifiant de programme ne bouge pas,
          donc <strong className="text-fg">l&apos;affichette déjà imprimée reste valable</strong>.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className={etiquette}>Adresse du commerçant</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            placeholder="commercant@exemple.be"
            className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
          />
          <span className="text-xs text-fg-faint">
            Remplace {ownerEmail ?? "l'adresse actuelle"}. Vous ne choisissez
            pas son mot de passe : il le définira lui-même.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-line p-3.5">
          <input
            type="checkbox"
            name="reinitialiser"
            defaultChecked
            className="mt-0.5 size-4"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">
              Effacer les {clients} carte{clients > 1 ? "s" : ""} de test
            </span>
            <span className="text-sm text-fg-faint">
              Le commerce démarre à zéro client. Le programme, le logo et le QR
              sont conservés.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="confirmation"
            required
            className="mt-0.5 size-4"
          />
          <span className="text-sm text-fg-soft">
            Je confirme : après ce transfert, je n&apos;aurai plus accès au
            dashboard de {merchantName}.
          </span>
        </label>

        {state.status === "error" ? (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg border border-brand/50 px-5 py-2.5 font-display text-sm tracking-[0.04em] text-brand disabled:opacity-50"
        >
          {pending ? "Transfert…" : "TRANSFÉRER LE COMMERCE"}
        </button>
      </form>
    </details>
  );
}
