import { z } from "zod";

/**
 * Schémas de validation des formulaires d'authentification.
 *
 * cf SPEC §5 : "Le frontend ne doit jamais être considéré comme une source
 * de confiance." Toute donnée arrivant d'un <form> repasse par ces schémas
 * côté serveur, même si le champ HTML est déjà `required`.
 */

const email = z.email("Adresse email invalide");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis"),
});

/**
 * cf SPEC §6 (parcours commerçant) : Email / password / Nom commerce.
 * /register est réservé au commerçant — le client, lui, s'inscrit
 * automatiquement via /join/[programId] (cf SPEC §8).
 */
export const registerMerchantSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  merchantName: z
    .string()
    .trim()
    .min(2, "Le nom du commerce est requis")
    .max(80, "Le nom du commerce est trop long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterMerchantInput = z.infer<typeof registerMerchantSchema>;

/**
 * Demande de réinitialisation. On ne valide que l'adresse : la réponse sera
 * la même qu'elle existe ou non, pour ne pas révéler qui a un compte.
 */
export const forgotPasswordSchema = z.object({ email });

/**
 * Nouveau mot de passe.
 *
 * La confirmation n'est pas une formalité : le champ est masqué, une faute de
 * frappe enfermerait la personne dehors une seconde fois — exactement ce
 * qu'on est en train de réparer.
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmation"],
  });
