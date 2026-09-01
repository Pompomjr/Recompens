import { z } from "zod";

/**
 * cf SPEC §8 — Parcours client : Prénom, Email (optionnel),
 * bouton "CRÉER MA CARTE".
 *
 * Aucun mot de passe : le client est authentifié par une session anonyme
 * Supabase. L'email vide est normalisé en `null` plutôt qu'en chaîne vide,
 * pour ne pas créer de collision sur la contrainte d'unicité de `User.email`.
 */
export const joinProgramSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Votre prénom est requis")
    .max(50, "Prénom trop long"),
  email: z
    .union([z.literal(""), z.email("Adresse email invalide")])
    .optional()
    .transform((value) => (value ? value : null)),
});

export type JoinProgramInput = z.infer<typeof joinProgramSchema>;
