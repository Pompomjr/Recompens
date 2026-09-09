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
 * Ce qu'un prénom peut contenir : des lettres, des espaces, des traits
 * d'union, des apostrophes. Rien d'autre.
 *
 * C'est le garde-fou le plus efficace, et le seul sans faux positif : il
 * accepte « Jean-Pierre », « N'Diaye », « Éloïse », « Van Der Berg », et
 * refuse tout ce qui passe par des chiffres, des symboles ou une adresse web.
 * L'essentiel des saisies pour rire tombe là — elles cherchent l'effet, donc
 * la ponctuation.
 */
const CARACTERES_AUTORISES = /^[\p{L}][\p{L}\s'’-]*$/u;

/**
 * Une courte liste d'insultes, comparée au prénom ENTIER une fois normalisé.
 *
 * Volontairement minuscule, et volontairement sans recherche par sous-chaîne.
 * Un filtre par sous-chaîne recale « Constance » et « Pinson » ; un filtre
 * exhaustif est une course perdue d'avance contre les variantes d'orthographe.
 *
 * Le vrai recours pour ce qui passe au travers n'est pas un filtre plus
 * sévère, c'est que le commerçant puisse supprimer la carte : lui seul sait
 * si « Pinpin » est une blague ou le surnom d'une habituée.
 */
const REFUSES = new Set([
  "connard", "connasse", "salope", "encule", "enculee", "pute", "putain",
  "batard", "batarde", "merde", "merdeux", "nique", "niquer", "pd", "tapette",
  "kut", "hoer", "klootzak", "fuck", "fucker", "bitch", "asshole", "dick",
  "hitler", "nazi",
]);

function normalise(valeur: string) {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    // `\p{M}` désigne les marques combinantes — les accents détachés par NFD.
    // Écrire leur plage en clair marchait, mais le source contenait alors des
    // caractères invisibles qui ne survivent pas au premier changement
    // d'encodage : le filtre laisserait passer « Pütain » sans rien signaler.
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "");
}



export const joinProgramSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Votre prénom est requis")
    .max(30, "Prénom trop long")
    .regex(
      CARACTERES_AUTORISES,
      "Votre prénom ne peut contenir que des lettres."
    )
    .refine((valeur) => !REFUSES.has(normalise(valeur)), {
      message: "Merci d'entrer votre vrai prénom.",
    }),
  email: z
    .union([z.literal(""), z.email("Adresse email invalide")])
    .optional()
    .transform((value) => (value ? value : null)),
});

export type JoinProgramInput = z.infer<typeof joinProgramSchema>;
