/**
 * Délai minimum entre deux visites validées sur UNE MÊME carte.
 *
 * Pourquoi cette règle : le QR client est un token fixe (cf SPEC §9). Rien
 * n'empêche plusieurs personnes de présenter le même QR — capture d'écran,
 * photo — pour cumuler leurs achats sur une seule carte. Le QR tournant qui
 * réglerait le problème à la racine est hors périmètre V0.1 (cf SPEC §1).
 *
 * OÙ VIT LA VALEUR : sur le programme, colonne
 * `LoyaltyProgram.minMinutesBetweenVisits`. Une valeur PAR COMMERCE, parce
 * qu'elle dépend du métier : une pizzeria du midi et un salon de coiffure
 * n'ont pas le même rythme de passage. `addVisit()` lit cette colonne, et
 * elle seule.
 *
 * QUI LA RÈGLE, AUJOURD'HUI : l'exploitant de la plateforme, à la main, dans
 * le Table Editor de Supabase (table `loyalty_programs`). Le commerçant ne
 * voit pas ce réglage et ne peut pas le modifier — c'est délibéré tant qu'on
 * n'a pas d'écran d'administration (cf SPEC §3, rôle ADMIN, et §16 /admin).
 * Le jour venu, il n'y aura qu'à brancher un formulaire sur cette colonne :
 * la logique de validation, elle, ne bougera pas.
 *
 * La constante ci-dessous ne sert qu'à la valeur donnée aux programmes
 * NOUVELLEMENT créés. Elle se règle par `LOYALTY_MIN_MINUTES_BETWEEN_VISITS`.
 */
const FALLBACK_DEFAULT_MINUTES = 30;

/** Bornes acceptées. 0 désactive complètement la règle. */
export const MIN_COOLDOWN_MINUTES = 0;
export const MAX_COOLDOWN_MINUTES = 1440; // 24 h

function readDefaultMinutes(): number {
  const raw = process.env.LOYALTY_MIN_MINUTES_BETWEEN_VISITS;
  if (raw === undefined || raw.trim() === "") return FALLBACK_DEFAULT_MINUTES;

  const parsed = Number(raw);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_COOLDOWN_MINUTES ||
    parsed > MAX_COOLDOWN_MINUTES
  ) {
    // Valeur illisible: on retombe sur le défaut plutôt que de créer
    // silencieusement des programmes sans protection.
    return FALLBACK_DEFAULT_MINUTES;
  }

  return Math.floor(parsed);
}

/** Valeur attribuée à un programme au moment de sa création. */
export const DEFAULT_MIN_MINUTES_BETWEEN_VISITS = readDefaultMinutes();
