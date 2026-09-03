/**
 * Qui a le droit d'entrer dans /admin.
 *
 * Deux portes, et la seconde demande une explication.
 *
 * 1. Le rôle ADMIN en base — la voie normale.
 * 2. Une liste d'adresses dans `ADMIN_EMAILS` — la voie de l'exploitant.
 *
 * La seconde existe parce que l'exploitant du produit est AUSSI commerçant :
 * il gère ses propres commerces de démonstration. Lui donner le rôle ADMIN
 * lui ferait perdre l'accès à /dashboard, et donc à ses propres commerces.
 * Un compte séparé règlerait le problème, au prix d'une adresse email de plus
 * et d'un second mot de passe à retenir pour une personne seule.
 *
 * L'adresse comparée vient de la ligne `User` EN BASE, pas de `user_metadata`
 * ni d'un champ de formulaire — donc d'une source que l'utilisateur ne peut
 * pas modifier lui-même (cf SPEC §5 et §18).
 */

function listeAutorisee(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((adresse) => adresse.trim().toLowerCase())
    .filter(Boolean);
}

export function estAdmin(user: {
  role: string;
  email: string | null;
}): boolean {
  if (user.role === "ADMIN") return true;

  const email = user.email?.trim().toLowerCase();
  return email ? listeAutorisee().includes(email) : false;
}
