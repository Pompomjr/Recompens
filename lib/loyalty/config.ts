/**
 * Délai minimum entre deux visites validées sur UNE MÊME carte.
 *
 * Pourquoi : le QR client est un token fixe (cf SPEC §9). Rien n'empêche
 * plusieurs personnes de présenter le même QR — capture d'écran, photo — pour
 * cumuler leurs achats sur une seule carte. Le QR tournant qui réglerait le
 * problème à la racine est explicitement hors périmètre V0.1 (cf SPEC §1).
 * Ce délai est le garde-fou peu coûteux : il n'empêche pas le partage, mais
 * il casse le cas « plusieurs achats d'affilée sur la même carte ».
 *
 * Réglage : `LOYALTY_MIN_MINUTES_BETWEEN_VISITS` dans `.env`.
 *   - valeur par défaut : 30 minutes
 *   - `0` désactive complètement la règle
 *
 * ÉVOLUTION PRÉVUE : à terme, ce délai sera un réglage par programme, choisi
 * par le commerçant. Le jour venu, ajouter un champ `minMinutesBetweenVisits`
 * sur `LoyaltyProgram` et le lire dans `addVisit()` à la place de cette
 * constante — le reste de la logique ne bouge pas.
 */
const DEFAULT_MIN_MINUTES_BETWEEN_VISITS = 30;

function readMinMinutes(): number {
  const raw = process.env.LOYALTY_MIN_MINUTES_BETWEEN_VISITS;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_MIN_MINUTES_BETWEEN_VISITS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    // Valeur illisible: on retombe sur le défaut plutôt que de désactiver
    // silencieusement la protection.
    return DEFAULT_MIN_MINUTES_BETWEEN_VISITS;
  }

  return Math.floor(parsed);
}

export const MIN_MINUTES_BETWEEN_VISITS = readMinMinutes();
