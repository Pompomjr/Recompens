/**
 * Envoi du logo d'un commerce vers Supabase Storage.
 *
 * ⚠️ Ce module utilise `SUPABASE_SERVICE_ROLE_KEY` : code SERVEUR uniquement,
 * comme lib/auth/admin.ts.
 *
 * Le choix de la clé de service mérite d'être expliqué, parce qu'il a l'air
 * d'un raccourci et n'en est pas un. L'alternative serait d'envoyer le fichier
 * depuis le navigateur avec la session du commerçant, et de contrôler le droit
 * d'écriture par une politique RLS sur le bucket. Mais cette politique devrait
 * vérifier que le chemin correspond bien AU commerce de la personne — une
 * règle SQL fragile, à écrire à la main dans le dashboard, et qui échouerait
 * en silence si elle était mal saisie.
 *
 * Ici, l'autorisation est faite en amont par `requireMerchant()`, et le chemin
 * est DÉRIVÉ de la session : `merchants/<merchantId>`. Un commerçant ne peut
 * donc écrire que sur son propre fichier, quoi qu'il envoie — la garantie ne
 * dépend d'aucune configuration extérieure au code.
 */

/**
 * Nom EXACT du bucket créé dans Supabase — la casse compte. Il est public
 * parce que ces logos sont affichés à des clients non authentifiés, sur la
 * carte comme sur l'affichette.
 */
export const LOGO_BUCKET = "Logo";

/** 2 Mo. Un logo de commerce pèse quelques dizaines de Ko ; au-delà, c'est
 *  une photo envoyée par erreur, et elle serait chargée en 4G au comptoir. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * SVG volontairement exclu : un SVG peut contenir du script, et celui-ci
 * serait servi depuis le domaine Supabase à tous les clients du commerce.
 */
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

type Resultat =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function uploadMerchantLogo(
  merchantId: string,
  file: File
): Promise<Resultat> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base || !serviceKey) {
    console.error("[storage] configuration Supabase absente");
    return { ok: false, message: "Envoi impossible pour le moment." };
  }

  // Chemin sans extension : le type est porté par `content-type`. Un même
  // commerce écrase donc toujours son propre fichier, sans laisser d'orphelin
  // quand il passe d'un PNG à un JPEG.
  const chemin = `merchants/${merchantId}`;

  try {
    const response = await fetch(
      `${base}/storage/v1/object/${LOGO_BUCKET}/${chemin}`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": file.type,
          // Remplace la version précédente au lieu d'échouer.
          "x-upsert": "true",
        },
        body: await file.arrayBuffer(),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `[storage] envoi refusé : HTTP ${response.status} — ${detail}`
      );
      // Le cas le plus probable, et le seul que le commerçant ne peut pas
      // deviner : le bucket n'existe pas encore.
      return {
        ok: false,
        message:
          response.status === 404
            ? "L'espace de stockage n'est pas encore configuré. Prévenez-nous."
            : "L'envoi a échoué. Réessayez dans un instant.",
      };
    }

    // L'URL publique est stable : sans le paramètre de version, le navigateur
    // et le CDN continueraient de servir l'ancien logo après un remplacement.
    const url = `${base}/storage/v1/object/public/${LOGO_BUCKET}/${chemin}?v=${Date.now()}`;
    return { ok: true, url };
  } catch (error) {
    console.error("[storage] envoi impossible:", error);
    return { ok: false, message: "L'envoi a échoué. Réessayez dans un instant." };
  }
}

/**
 * Supprime le fichier. L'échec n'est pas remonté à l'utilisateur : ce qui
 * compte pour lui, c'est que la base ne pointe plus vers son logo. Un fichier
 * resté sur le stockage n'est visible de personne.
 */
export async function deleteMerchantLogo(merchantId: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !serviceKey) return;

  try {
    await fetch(
      `${base}/storage/v1/object/${LOGO_BUCKET}/merchants/${merchantId}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
  } catch (error) {
    console.error("[storage] suppression impossible:", error);
  }
}
