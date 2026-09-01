import { cardTheme } from "@/lib/theme";
import { visitsLabel } from "@/lib/format";
import { CardQr } from "./card-qr";

/**
 * La carte de fidélité, style « Ticket » (cf maquettes).
 *
 * Un seul gabarit pour tous les commerces : seules changent la couleur
 * (`Merchant.brandColor`) et le nombre de cases. Aucun dessin propre à un
 * métier — c'est ce qui permet d'accueillir un nouveau commerçant sans
 * produire le moindre visuel.
 *
 * cf SPEC §8 pour le contenu (commerce, compteur, visites restantes, bouton
 * AFFICHER MON QR) et §12 pour la récompense.
 */
export function LoyaltyCard({
  merchantName,
  brandColor,
  firstName,
  cardNumber,
  memberSince,
  visitCount,
  visitsRequired,
  rewardName,
  rewardAvailable,
  qrDataUrl,
  justStamped,
}: {
  merchantName: string;
  brandColor: string | null;
  firstName: string;
  cardNumber: string;
  memberSince: string;
  visitCount: number;
  visitsRequired: number;
  rewardName: string;
  rewardAvailable: boolean;
  qrDataUrl: string;
  /** Vrai juste après une visite validée : le dernier tampon s'abat. */
  justStamped: boolean;
}) {
  const { ink, onInk } = cardTheme(brandColor);
  const remaining = Math.max(visitsRequired - visitCount, 0);

  // Au-delà d'une vingtaine de cases, la grille devient illisible sur un
  // téléphone : on bascule sur un grand compteur.
  const showStamps = visitsRequired <= 20;
  const columns = visitsRequired <= 6 ? 3 : 5;

  return (
    <div className="w-full bg-paper [background-image:radial-gradient(rgba(23,20,15,0.055)_1px,transparent_1px)] [background-size:3px_3px]">
      <header className="flex flex-col gap-4 px-6 pb-5 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span
              className="font-mono text-[11px] font-semibold tracking-[0.2em]"
              style={{ color: ink }}
            >
              CARTE DE FIDÉLITÉ
            </span>
            <span className="font-display text-[28px] leading-none tracking-tight text-ink">
              {merchantName.toUpperCase()}
            </span>
          </div>

          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 font-display text-lg text-ink"
            style={{ borderColor: "var(--ink)" }}
            aria-hidden
          >
            {merchantName.trim().charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.09em] text-[color:var(--ink-soft)]">
          <span>
            N° {cardNumber} — {firstName.toUpperCase()}
          </span>
          <span>DEPUIS {memberSince}</span>
        </div>
      </header>

      {/* La perforation : deux encoches découpées dans le papier. Elles
          prennent la couleur du fond de page, d'où le fond sombre imposé
          par le layout client. */}
      <div className="relative flex h-7 items-center" aria-hidden>
        <div className="absolute -left-3.5 size-7 rounded-full bg-ink" />
        <div className="absolute -right-3.5 size-7 rounded-full bg-ink" />
        <div className="mx-5 flex-1 border-t-2 border-dashed border-[color:var(--ink-faint)]" />
      </div>

      <div className="relative flex flex-col gap-6 px-6 pb-7 pt-6">
        {showStamps ? (
          <ul
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: visitsRequired }, (_, index) => {
              const filled = index < visitCount;
              const isNewest = justStamped && index === visitCount - 1;
              // Chaque tampon est posé de travers, comme un vrai. L'angle est
              // dérivé de l'index pour rester stable entre deux affichages.
              const tilt = ((index * 37) % 17) - 8;

              return (
                <li key={index} className="relative aspect-square">
                  {filled ? (
                    <>
                      {isNewest ? (
                        <span
                          className="tampon-encre absolute -inset-1.5 rounded-full"
                          style={{ backgroundColor: ink, opacity: 0.35 }}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={`absolute inset-0 flex items-center justify-center rounded-full border-[2.5px] font-display text-[15px] ${
                          isNewest ? "tampon-neuf" : ""
                        }`}
                        style={
                          {
                            borderColor: ink,
                            color: ink,
                            transform: `rotate(${tilt}deg)`,
                            opacity: 0.92,
                            "--tilt": `${tilt}deg`,
                          } as React.CSSProperties
                        }
                      >
                        {index + 1}
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-[color:var(--ink-faint)]" />
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl leading-none text-ink">
              {visitCount}
            </span>
            <span className="font-display text-2xl text-[color:var(--ink-soft)]">
              / {visitsRequired}
            </span>
          </div>
        )}

        {/* cf SPEC §12 — la récompense disponible doit sauter aux yeux.
            Sur un ticket, ça se dit avec un tampon en travers. */}
        {rewardAvailable ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-8 top-8 flex -rotate-[11deg] items-center justify-center"
              aria-hidden
            >
              <div
                className="flex flex-col items-center gap-0.5 border-[5px] bg-paper/60 px-5 py-2.5"
                style={{ borderColor: ink }}
              >
                <span
                  className="font-display text-[32px] leading-none tracking-wide"
                  style={{ color: ink }}
                >
                  OFFERT
                </span>
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em]"
                  style={{ color: ink }}
                >
                  CARTE COMPLÈTE
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-display text-lg leading-tight text-ink">
                {rewardName.toUpperCase()}
              </span>
              <span className="text-sm text-[color:var(--ink-soft)]">
                Présentez votre QR au commerçant pour en profiter.
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-display text-lg leading-tight text-ink">
              ENCORE {remaining} {visitsLabel(remaining).toUpperCase()}
            </span>
            <span className="text-sm text-[color:var(--ink-soft)]">
              et {rewardName.toLowerCase()}
            </span>
          </div>
        )}

        <CardQr qrDataUrl={qrDataUrl} buttonBg={ink} buttonFg={onInk} />
      </div>
    </div>
  );
}
