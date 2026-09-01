/**
 * État partagé des formulaires d'authentification.
 *
 * Volontairement HORS de `lib/auth/actions.ts` : un fichier "use server" ne
 * peut exporter que des fonctions async (toute autre valeur exportée devient
 * un endpoint potentiel). Le type et la constante initiale vivent donc ici,
 * importables aussi bien par le serveur que par les composants client.
 */
export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "confirm_email"; message: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };
