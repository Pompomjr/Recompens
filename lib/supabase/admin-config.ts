/**
 * Configuration des appels d'administration Supabase, validée.
 *
 * ⚠️ Manipule `SUPABASE_SERVICE_ROLE_KEY` : code SERVEUR uniquement.
 *
 * Pourquoi une validation plutôt qu'une simple lecture d'`process.env` : une
 * clé Supabase se copie depuis un dashboard qui l'affiche ABRÉGÉE, avec des
 * points de suspension au milieu. Copier ce qui est affiché donne une clé
 * contenant « … » (caractère 8230), qui a l'air correcte à l'œil nu.
 *
 * `fetch` refuse alors de construire l'en-tête — les valeurs d'en-tête HTTP
 * sont limitées aux caractères de 0 à 255 — et lève une exception dont le
 * message parle de « ByteString » et d'un « index », sans jamais nommer la
 * clé. Le piège a coûté deux séances de recherche sur ce projet, à deux
 * endroits différents. On le détecte donc une bonne fois, et on le NOMME.
 */

type Config =
  | { ok: true; base: string; serviceKey: string }
  | { ok: false; message: string };

export function adminConfig(): Config {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base || !serviceKey) {
    console.error("[supabase] URL ou clé de service absente de l'environnement");
    return { ok: false, message: "Configuration serveur incomplète." };
  }

  // Une clé légitime est en ASCII imprimable. Tout le reste vient d'un
  // copier-coller abîmé : abréviation, espace insécable, guillemet typographique.
  const fautif = [...serviceKey].findIndex(
    (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126
  );

  if (fautif !== -1) {
    const caractere = serviceKey[fautif];
    console.error(
      `[supabase] SUPABASE_SERVICE_ROLE_KEY contient un caractère non ASCII ` +
        `à la position ${fautif} (code ${caractere.charCodeAt(0)}). ` +
        `La clé a probablement été copiée abrégée depuis le dashboard.`
    );
    return {
      ok: false,
      message:
        "La clé de service Supabase est invalide : elle contient un caractère " +
        "interdit, signe d'une clé copiée abrégée. Elle doit être recopiée en " +
        "entier depuis Supabase.",
    };
  }

  return { ok: true, base, serviceKey };
}
