import { z } from "zod";

/**
 * cf SPEC §8 — Parcours client : Prénom, Email (optionnel),
 * bouton "CRÉER MA CARTE".
 *
 * Aucun mot de passe : le client est authentifié par une session anonyme
 * Supabase. L'email vide est normalisé en `null` plutôt qu'en chaîne vide,
 * pour ne pas créer de collision sur la contrainte d'unicité de `User.email`.
 */

/**
 * Le prénom est LIBRE — chiffres, ponctuation, emojis compris.
 *
 * C'est un choix : « Lola 🌸 » ou « K-Dine » font sourire, et un client qui se
 * sent libre de se nommer s'inscrit plus volontiers. Ce qu'on refuse, ce n'est
 * pas la fantaisie, ce sont les mots offensants — et eux se reconnaissent au
 * sens, pas aux caractères.
 *
 * Deux exigences subsistent malgré tout :
 *  - au moins UNE lettre, sinon le commerçant ne peut pas appeler son client ;
 *  - pas d'adresse web, seul usage détourné qui vise le commerçant plutôt que
 *    ses voisins de file.
 */
const AU_MOINS_UNE_LETTRE = /\p{L}/u;
const ADRESSE_WEB = /(https?:|www\.|\.[a-z]{2,4}(\/|$))/i;

/**
 * Normalisation AGRESSIVE, pour la comparaison seulement — jamais pour
 * l'affichage.
 *
 * Elle défait les contournements habituels, qui sont toujours les mêmes :
 * accents (Pütain), espaces et points (s.a.l.o.p.e), chiffres et symboles à la
 * place des lettres (C0nn4rd, n1gg3r, $alope), et lettres répétées (niiiique).
 * Sans elle, une liste noire ne tient pas dix minutes.
 */
function normalise(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    // `\p{M}` : les marques combinantes, c'est-à-dire les accents détachés
    // par NFD. Écrire leur plage en clair mettrait des caractères invisibles
    // dans le source, qui ne survivent pas au premier changement d'encodage.
    .replace(/\p{M}/gu, "")
    // Chaque chiffre vers la lettre qu'il IMITE, et une seule fois : mettre
    // « 3 » avec les « i » avant de le traiter comme un « e » faisait passer
    // n1gg3r, et « 0 » vers « a » faisait passer C0nn4rd. Une équivalence
    // fausse ne protège de rien tout en donnant l'illusion du contraire.
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/[^a-z]/g, "")
    // Lettres répétées ramenées à une seule : « niiiique » devient « nique ».
    .replace(/(.)\1+/g, "$1");
}

/**
 * Termes cherchés N'IMPORTE OÙ dans le prénom normalisé.
 *
 * Réservé aux mots assez longs et sans ambiguïté pour qu'aucun vrai prénom ne
 * les contienne par accident. Chaque entrée est écrite sous sa forme DÉJÀ
 * normalisée — donc sans lettre doublée, puisque la normalisation les réduit.
 */
const INTERDITS_PARTOUT = [
  // Insultes françaises
  "conard", "conase", "salop", "encule", "enculer", "putain", "batard",
  "nique", "niker", "fdp", "ntm", "tapete", "pedale", "trav",
  // Néerlandais / anglais
  "klotzak", "hoerin", "fuck", "fucker", "bitch", "ashole", "cunt", "whore",
  // Racisme et haine — la seule catégorie où l'on préfère un faux positif
  // à un faux négatif.
  "bicot", "bougnoul", "youpin",
  "hitler", "adolfhitler", "adolphitler", "nazi", "hailhitler", "sieghail",
  "kukluxklan",
];

/**
 * Termes refusés seulement si le prénom ENTIER s'y réduit.
 *
 * Ce sont les mots courts, qui apparaissent innocemment à l'intérieur de vrais
 * prénoms : « con » est dans Constance, « pd » dans une initiale, « bite »
 * dans Bitencourt. Les chercher partout recalerait des clients réels — ce qui
 * est bien pire qu'un prénom grossier, puisque la personne est devant le
 * comptoir et ne comprend pas pourquoi on la refuse.
 */
const INTERDITS_EXACTS = new Set([
  "con", "pd", "pute", "kut", "bite", "zizi", "couile", "merde", "chatte",
  "penis", "vagin", "salaud", "pines", "teub", "nichon",
  // Injures raciales dont la forme réduite se confond avec de vrais prénoms :
  // « nigger » se réduit à « niger », qui est aussi un prénom porté, et
  // « Nigar » en est voisin. Les chercher partout recalerait des clients
  // réels au comptoir — pire qu'un prénom grossier, parce que la personne
  // est là, devant tout le monde, sans comprendre. En exact, le contournement
  // reste couvert : n1gg3r comme NIGGER se réduisent à « niger ».
  "niger", "niga", "negro", "negre",
]);

function prenomAcceptable(valeur: string): boolean {
  const n = normalise(valeur);
  if (!n) return true; // Aucune lettre : c'est l'autre règle qui tranchera.
  if (INTERDITS_EXACTS.has(n)) return false;
  return !INTERDITS_PARTOUT.some((terme) => n.includes(terme));
}

export const joinProgramSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Votre prénom est requis")
    .max(30, "Prénom trop long")
    .refine((valeur) => AU_MOINS_UNE_LETTRE.test(valeur), {
      message: "Votre prénom doit contenir au moins une lettre.",
    })
    .refine((valeur) => !ADRESSE_WEB.test(valeur), {
      message: "Votre prénom ne peut pas contenir d'adresse web.",
    })
    .refine(prenomAcceptable, {
      message: "Merci d'entrer votre vrai prénom.",
    }),
  email: z
    .union([z.literal(""), z.email("Adresse email invalide")])
    .optional()
    .transform((value) => (value ? value : null)),
});

export type JoinProgramInput = z.infer<typeof joinProgramSchema>;
