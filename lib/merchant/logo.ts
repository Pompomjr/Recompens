/**
 * Logo du commerce (`Merchant.logoUrl`).
 *
 * Le champ est rempli à la main dans Supabase, comme `brandColor` et
 * `cardStyle` (cf README) — il n'y a pas encore d'écran d'envoi de fichier.
 * Une valeur saisie à la main peut donc être n'importe quoi, et cette adresse
 * finit dans un `src` affiché à des clients : d'où le filtrage.
 *
 * Seuls `http(s)://` et les chemins internes commençant par `/` passent.
 * `javascript:` et `data:` sont écartés — le premier est une porte ouverte,
 * le second permettrait d'embarquer une image arbitraire de plusieurs Mo dans
 * une page chargée en 4G sur le comptoir.
 */
export function safeLogoUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:"
      ? trimmed
      : null;
  } catch {
    // Pas une URL absolue valide : on retombe sur l'initiale du nom.
    return null;
  }
}
