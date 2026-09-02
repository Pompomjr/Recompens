/**
 * Appels d'administration Supabase.
 *
 * ⚠️ Ce module utilise `SUPABASE_SERVICE_ROLE_KEY`, qui contourne toutes les
 * règles d'accès. Il ne doit être importé QUE depuis du code serveur —
 * Server Actions et Route Handlers. Jamais depuis un composant "use client",
 * sous peine d'envoyer la clé au navigateur.
 */

/**
 * Supprime un compte d'authentification.
 *
 * Sert à annuler une inscription à moitié faite : si le compte Supabase est
 * créé mais que l'écriture en base échoue, laisser le compte en place enferme
 * la personne dans une impasse — la connexion répond « compte incomplet », et
 * la réinscription « adresse déjà utilisée ». Plus aucune issue.
 *
 * En le supprimant, on revient à l'état d'avant : l'adresse est libre, la
 * personne peut réessayer.
 *
 * Retourne `true` si le compte n'existe plus après l'appel.
 */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "[admin] SUPABASE_SERVICE_ROLE_KEY absente : impossible d'annuler l'inscription"
    );
    return false;
  }

  try {
    const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[admin] suppression du compte ${userId} refusée : HTTP ${response.status}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[admin] suppression du compte ${userId} impossible:`, error);
    return false;
  }
}
