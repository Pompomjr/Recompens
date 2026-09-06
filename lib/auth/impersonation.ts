import { cookies } from "next/headers";

/**
 * « Agir sur un commerce » — l'exploitant travaille dans l'espace d'un
 * commerçant sans prendre son compte.
 *
 * Le besoin est réel : beaucoup de commerçants ne veulent rien gérer. Il faut
 * pouvoir régler leur programme, envoyer leur logo, imprimer leur affichette —
 * sans leur demander leur mot de passe, et sans dupliquer chaque écran du
 * dashboard dans l'exploitation.
 *
 * Trois partis pris de conception :
 *
 * 1. On ne SE CONNECTE PAS à leur place. La session Supabase reste celle de
 *    l'exploitant : un simple cookie indique sur quel commerce il agit. Son
 *    identité réelle n'est donc jamais perdue, et le retour se fait d'un clic.
 *
 * 2. Le cookie ne fait AUTORITÉ SUR RIEN. Il ne porte qu'un identifiant de
 *    commerce ; c'est `estAdmin()`, vérifié en base à chaque requête, qui
 *    décide s'il est honoré. Un commerçant qui fabriquerait ce cookie à la
 *    main n'obtiendrait strictement rien (cf SPEC §5 et §18).
 *
 * 3. Il expire à la fermeture du navigateur. Agir sur le commerce d'autrui
 *    n'est pas un état dans lequel on reste par défaut.
 */

const COOKIE = "recompens.exploitation";

/** Le commerce sur lequel l'exploitant agit, s'il y en a un. */
export async function commerceExploite(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function poserCommerceExploite(merchantId: string) {
  const store = await cookies();
  store.set(COOKIE, merchantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function retirerCommerceExploite() {
  const store = await cookies();
  store.delete(COOKIE);
}
