import { logoutAction } from "@/lib/auth/actions";

/**
 * La déconnexion passe par une Server Action : c'est le serveur qui efface
 * les cookies de session, pas un script côté navigateur.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-sm font-medium text-neutral-600 underline"
      >
        Se déconnecter
      </button>
    </form>
  );
}
