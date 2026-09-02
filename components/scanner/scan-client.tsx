"use client";

import { useCallback, useState } from "react";
import { QrScanner } from "./qr-scanner";
import type { ScanResult } from "@/lib/loyalty/scan";
import { visitsLabel } from "@/lib/format";

/**
 * cf SPEC §10 (scanner), §11 (validation) et §13 (utilisation de la
 * récompense).
 *
 * Le composant n'interprète JAMAIS le contenu du QR et ne calcule jamais de
 * compteur : il poste ce qu'il a scanné et réaffiche ce que le serveur
 * renvoie (cf SPEC §5, §18).
 */
export function ScanClient() {
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  const lookup = useCallback(async (qrToken: string) => {
    setLoading(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/loyalty/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Scan impossible.");
        setResult(null);
        setToken(null);
        return;
      }

      setToken(qrToken);
      setResult(data as ScanResult);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * cf SPEC §11 — le commerçant confirme "+1 VISITE". Une seule requête, un
   * seul incrément : le bouton est neutralisé pendant l'appel pour qu'un
   * double-clic ne parte pas deux fois.
   */
  const validateVisit = useCallback(async () => {
    if (!token) return;

    setBusy(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/loyalty/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Validation impossible.");
        return;
      }

      const updated = data as ScanResult;
      setResult(updated);
      setConfirmation(buildVisitConfirmation(updated));
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setBusy(false);
    }
  }, [token]);

  /**
   * cf SPEC §13 — Utilisation de la récompense. Le serveur revérifie
   * `reward_available` : si elle a déjà été remise, l'appel est refusé.
   */
  const redeem = useCallback(async () => {
    if (!result) return;

    setBusy(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: result.membershipId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Remise impossible.");
        return;
      }

      const updated = data as ScanResult;
      setResult(updated);
      setConfirmation(
        `Récompense remise à ${updated.firstName}. Sa carte repart à zéro.`
      );
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setBusy(false);
    }
  }, [result]);

  const reset = useCallback(() => {
    setToken(null);
    setResult(null);
    setError(null);
    setConfirmation(null);
    setManualToken("");
  }, []);

  // Un résultat affiché met la caméra en pause: inutile de continuer à
  // décoder pendant que le commerçant lit l'écran.
  const paused = loading || result !== null;

  return (
    <div className="flex flex-col gap-5">
      {!result ? (
        <>
          <QrScanner onDetected={lookup} paused={paused} />

          <details className="rounded-xl border border-line bg-surface-raised p-4">
            <summary className="cursor-pointer text-sm font-medium text-fg-soft">
              Saisir le code manuellement
            </summary>
            <form
              className="mt-3 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (manualToken.trim()) lookup(manualToken.trim());
              }}
            >
              <input
                type="text"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Code du QR client"
                className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-fg-faint focus:border-brand"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg disabled:opacity-50"
              >
                Rechercher
              </button>
            </form>
            <p className="mt-2 text-xs text-fg-faint">
              Utile pour tester depuis un ordinateur sans caméra.
            </p>
          </details>
        </>
      ) : null}

      {loading ? (
        <p className="text-center text-sm text-fg-faint">Recherche…</p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <p className="text-sm text-red-300">{error}</p>
          {!result ? (
            <button
              type="button"
              onClick={reset}
              className="self-start rounded-lg border border-line px-4 py-2 text-sm font-medium text-fg"
            >
              Réessayer
            </button>
          ) : null}
        </div>
      ) : null}

      {confirmation ? (
        <p
          role="status"
          className="rounded-xl border border-brand/35 bg-brand/10 p-4 text-sm font-medium text-brand"
        >
          {confirmation}
        </p>
      ) : null}

      {result ? (
        <ScanResultCard
          result={result}
          onValidate={validateVisit}
          onRedeem={redeem}
          busy={busy}
          onReset={reset}
        />
      ) : null}
    </div>
  );
}

/**
 * Message affiché au commerçant après validation. Il est pensé pour être lu
 * à voix haute au client : on le remercie, et on lui dit où il en est.
 *
 * Le nombre restant est recalculé à partir de ce que le SERVEUR vient de
 * renvoyer, jamais à partir d'un compteur gardé côté navigateur (cf SPEC §5).
 */
function buildVisitConfirmation(result: ScanResult): string {
  if (result.rewardAvailable) {
    return `Bravo ${result.firstName} ! Récompense débloquée : ${result.rewardName}.`;
  }

  const remaining = Math.max(result.visitsRequired - result.visitCount, 0);

  if (remaining === 1) {
    return `Merci ${result.firstName} ! Plus qu'une visite avant ${result.rewardName.toLowerCase()}.`;
  }

  return `Merci ${result.firstName} ! Encore ${remaining} visites avant ${result.rewardName.toLowerCase()}.`;
}

/**
 * cf SPEC §10 — "Puis afficher : nom du client, compteur actuel, bouton
 * +1 VISITE." §17 : le commerçant doit pouvoir valider en quelques secondes,
 * donc l'action du moment occupe toute la largeur.
 *
 * Quand une récompense est disponible (§12), c'est ELLE l'action principale :
 * c'est ce que le client attend au comptoir.
 */
function ScanResultCard({
  result,
  onValidate,
  onRedeem,
  busy,
  onReset,
}: {
  result: ScanResult;
  onValidate: () => void;
  onRedeem: () => void;
  busy: boolean;
  onReset: () => void;
}) {
  // Confirmation en deux temps: remettre une récompense est irréversible,
  // un geste malheureux offre un cadeau.
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-raised p-6 text-center">
      <span className="font-display text-2xl tracking-tight text-fg">
        {result.firstName}
      </span>

      <span className="font-display text-[52px] leading-none tabular-nums text-fg">
        {result.visitCount} / {result.visitsRequired}
      </span>
      <span className="-mt-3 text-sm text-fg-faint">
        {visitsLabel(result.visitsRequired)}
      </span>

      {/* cf SPEC §12 et §13 : récompense visible du commerçant, et remise
          possible en un geste. */}
      {result.rewardAvailable ? (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-400/10 p-4">
          <p className="text-sm font-medium text-amber-200">
            Récompense à remettre : {result.rewardName}
          </p>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="rounded-xl bg-amber-600 px-6 py-5 font-display text-lg tracking-[0.04em] text-white disabled:opacity-50"
            >
              UTILISER LA RÉCOMPENSE
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-amber-100">
                Confirmez que la récompense a bien été remise au client. Le
                compteur repartira à zéro.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onRedeem();
                }}
                disabled={busy}
                className="rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : "OUI, RÉCOMPENSE REMISE"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-sm text-amber-100 underline"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onValidate}
        disabled={busy}
        className="rounded-xl px-6 py-5 font-display text-xl tracking-[0.04em] disabled:opacity-50"
        style={
          result.rewardAvailable
            ? { border: "1px solid var(--line)", color: "var(--fg)" }
            : { backgroundColor: "#2FBF71", color: "#10331F" }
        }
      >
        {busy ? "…" : "+1 VISITE"}
      </button>

      <button
        type="button"
        onClick={onReset}
        className="text-sm text-fg-faint underline"
      >
        Scanner un autre client
      </button>
    </div>
  );
}
