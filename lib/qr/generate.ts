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

export async function generateProgramJoinQr(
  programId: string,
  appUrl: string,
  /**
   * Largeur du PNG. La valeur par défaut suffit à l'écran ; l'affichette
   * demande beaucoup plus, sinon le QR imprimé est flou et devient pénible
   * à scanner — c'est le seul geste que le client fait, il doit marcher du
   * premier coup.
   */
  width?: number
) {
  const joinUrl = `${appUrl}/join/${programId}`;
  return QRCode.toDataURL(joinUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    ...(width ? { width } : {}),
  });
}

export async function generateCustomerQr(qrToken: string) {
  // Payload volontairement minimal: juste le token, pas d'URL complète,
  // pour garder le contenu du QR client aussi court/opaque que possible.
  return QRCode.toDataURL(qrToken, { errorCorrectionLevel: "M", margin: 2 });
}
