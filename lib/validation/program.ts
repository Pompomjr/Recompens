import { z } from "zod";

/**
 * cf SPEC §7 — Création du programme : Nom, Visites nécessaires, Récompense.
 *
 * `visitsRequired` arrive du formulaire sous forme de chaîne : on le convertit
 * et on le borne côté serveur. Un client qui enverrait 0 ou un nombre négatif
 * rendrait la récompense immédiatement disponible — donc la borne basse est
 * une règle métier, pas du confort d'interface (cf SPEC §5).
 */
export const createProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom du programme est requis")
    .max(80, "Le nom du programme est trop long"),
  visitsRequired: z.coerce
    .number()
    .int("Le nombre de visites doit être un entier")
    .min(1, "Il faut au moins 1 visite")
    .max(100, "100 visites maximum"),
  rewardName: z
    .string()
    .trim()
    .min(2, "La récompense est requise")
    .max(80, "Le nom de la récompense est trop long"),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
