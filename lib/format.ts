import type { TransactionType } from "@prisma/client";

/**
 * Formats d'affichage partagés par les vues d'historique (cf SPEC §14 :
 * date, heure, client, action, variation).
 *
 * Le fuseau est fixé explicitement : ces pages sont rendues côté serveur, et
 * un serveur déployé sur Vercel tourne en UTC. Sans ça, une visite de 20h
 * s'afficherait à 18h.
 */
const TIME_ZONE = "Europe/Brussels";

const dateFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("fr-BE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatDate(value: Date) {
  return dateFormatter.format(value);
}

export function formatTime(value: Date) {
  return timeFormatter.format(value);
}

/** Libellé lisible du type de transaction (§4 : VISIT, REWARD_REDEEMED). */
export function formatTransactionType(type: TransactionType) {
  return type === "VISIT" ? "Visite" : "Récompense utilisée";
}

/** Variation du compteur, signe compris. */
export function formatVisitDelta(delta: number) {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "—";
}

/**
 * "1 visite" / "10 visites".
 *
 * Un programme réglé sur une seule visite affichait "1 visites" : un détail,
 * mais c'est la première phrase que lit le client en scannant le QR.
 */
export function formatVisits(count: number) {
  return `${count} ${visitsLabel(count)}`;
}

/** Le mot seul, pour un libellé placé sous un compteur "X / Y". */
export function visitsLabel(count: number) {
  return count > 1 ? "visites" : "visite";
}
