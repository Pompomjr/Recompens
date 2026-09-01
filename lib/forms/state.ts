/**
 * État générique d'un formulaire piloté par une Server Action.
 *
 * Vit hors des fichiers "use server", qui ne peuvent exporter que des
 * fonctions async (cf lib/auth/form-state.ts pour la même contrainte).
 */
export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string };

export const initialFormState: FormState = { status: "idle" };
