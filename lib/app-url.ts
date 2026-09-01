import { headers } from "next/headers";

/**
 * Adresse publique de l'application, utilisée pour construire l'URL encodée
 * dans le QR d'inscription (cf SPEC §7, §9).
 *
 * Trois niveaux, dans cet ordre :
 *  1. `NEXT_PUBLIC_APP_URL` si elle est renseignée ET non vide ;
 *  2. sinon, l'hôte de la requête en cours ;
 *  3. sinon seulement, localhost.
 *
 * Le niveau 2 existe parce qu'une variable définie mais VIDE produisait
 * silencieusement un QR encodant `/join/<id>` — un chemin relatif, qu'aucun
 * appareil photo ne sait ouvrir. Un test `?? ` ne rattrape pas la chaîne vide.
 *
 * Derrière le proxy de Vercel, l'hôte réel est dans `x-forwarded-host` ;
 * `host` seul y vaut l'hôte interne.
 */
export async function getAppUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    // Une barre oblique finale doublerait le séparateur de l'URL construite.
    return configured.replace(/\/+$/, "");
  }

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? null;

  if (host) {
    const protocol =
      headerList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
