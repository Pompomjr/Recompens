import QRCode from "qrcode";

/**
 * cf SPEC §9 : le QR ne doit JAMAIS contenir visit_count ou des infos
 * sensibles — uniquement un identifiant opaque permettant de retrouver
 * la ressource côté serveur.
 *
 * - QR programme → encode l'URL /join/[programId] (programId n'est pas secret,
 *   il sert juste à rejoindre le programme).
 * - QR client → encode uniquement le membership.qrToken (uuid opaque),
 *   jamais le membershipId "métier" ni le compteur.
 */

export async function generateProgramJoinQr(programId: string, appUrl: string) {
  const joinUrl = `${appUrl}/join/${programId}`;
  return QRCode.toDataURL(joinUrl, { errorCorrectionLevel: "M", margin: 2 });
}

export async function generateCustomerQr(qrToken: string) {
  // Payload volontairement minimal: juste le token, pas d'URL complète,
  // pour garder le contenu du QR client aussi court/opaque que possible.
  return QRCode.toDataURL(qrToken, { errorCorrectionLevel: "M", margin: 2 });
}
