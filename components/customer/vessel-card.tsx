import type { VesselShape } from "@prisma/client";
import { cardTheme } from "@/lib/theme";
import {
  vesselSpec,
  fillOffset,
  stackLayers,
  moundProgress,
  type FillSpec,
  type MoundSpec,
  type StackSpec,
} from "@/lib/loyalty/vessels";
import { CardQr } from "./card-qr";
import { MerchantLogo } from "@/components/merchant/merchant-logo";

/**
 * La carte de fidélité, style « Contenant » (cf maquettes).
 *
 * Deux façons de raconter la progression, selon la silhouette :
 * le contenant se REMPLIT (tasse, assiette), ou l'objet se CONSTRUIT couche
 * après couche (sandwich). La seconde est la plus lisible : on voit où en est
 * le client sans lire le chiffre.
 *
 * À réserver aux métiers dont l'objet EST le produit — ailleurs, le style
 * « Ticket » raconte mieux la même chose.
 *
 * cf SPEC §8 pour le contenu et §12 pour la récompense.
 */
export function VesselCard({
  merchantName,
  logoUrl,
  brandColor,
  shape,
  visitCount,
  visitsRequired,
  rewardName,
  rewardAvailable,
  qrDataUrl,
  justStamped,
}: {
  merchantName: string;
  /** Logo du commerce, ou null : la pastille retombe sur l'initiale. */
  logoUrl: string | null;
  brandColor: string | null;
  shape: VesselShape;
  visitCount: number;
  visitsRequired: number;
  rewardName: string;
  rewardAvailable: boolean;
  qrDataUrl: string;
  justStamped: boolean;
}) {
  const { ink, onInk } = cardTheme(brandColor);
  const spec = vesselSpec(shape);
  const remaining = Math.max(visitsRequired - visitCount, 0);

  return (
    <section
      className="relative flex w-full flex-col gap-7 overflow-hidden rounded-3xl px-6 pb-7 pt-6"
      style={{ backgroundColor: ink, color: onInk }}
    >
      {justStamped && spec.gesture === "streak" ? (
        <StreakMascot shape={shape} color={spec.accent} />
      ) : null}

      <header className="relative flex items-center gap-3">
        <MerchantLogo
          name={merchantName}
          logoUrl={logoUrl}
          size={40}
          color={ink}
          background={spec.accent}
          className="font-display"
        />
        <span className="font-display text-xl leading-none tracking-tight">
          {merchantName}
        </span>
      </header>

      <div className="relative flex flex-col items-center gap-6">
        <div
          className="relative"
          style={{ width: spec.width, height: spec.height }}
        >
          {spec.kind === "fill" ? (
            <FillDrawing
              spec={spec}
              shape={shape}
              visitCount={visitCount}
              visitsRequired={visitsRequired}
              justStamped={justStamped}
            />
          ) : spec.kind === "mound" ? (
            <MoundDrawing
              spec={spec}
              visitCount={visitCount}
              visitsRequired={visitsRequired}
              justStamped={justStamped}
            />
          ) : (
            <StackDrawing
              spec={spec}
              visitCount={visitCount}
              visitsRequired={visitsRequired}
              justStamped={justStamped}
            />
          )}

          <div
            className="absolute inset-x-0 flex flex-col items-center"
            style={{ top: spec.labelTop }}
          >
            <span
              className={`font-display text-5xl leading-none ${
                justStamped ? "chiffre-saute" : ""
              }`}
              style={{ color: ink }}
            >
              {visitCount}
            </span>
            <span
              className="font-display text-sm"
              style={{ color: ink, opacity: 0.6 }}
            >
              sur {visitsRequired}
            </span>
          </div>
        </div>

        {/* cf SPEC §12 — la récompense doit être visible du client. */}
        {rewardAvailable ? (
          <div
            className="flex w-full flex-col gap-1.5 rounded-2xl px-5 py-4"
            style={{ backgroundColor: spec.accent, color: ink }}
          >
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">
              {spec.kind === "stack" ? "C'est complet" : "Contenant plein"}
            </span>
            <span className="font-display text-xl leading-tight">
              {rewardName}
            </span>
            <span className="text-sm opacity-70">
              Présentez votre QR au commerçant.
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-display text-2xl leading-tight tracking-tight">
              Encore {remaining} {remaining > 1 ? "visites" : "visite"}
            </span>
            <span className="text-sm opacity-60">
              et {rewardName.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      <CardQr
        qrDataUrl={qrDataUrl}
        buttonBg={spec.accent}
        buttonFg={ink}
        rounded
      />
    </section>
  );
}

/**
 * Silhouette qui se remplit. Le contenu est dessiné plein puis descendu : la
 * géométrie ne dépend jamais du compteur, seul le décalage change.
 */
function FillDrawing({
  spec,
  shape,
  visitCount,
  visitsRequired,
  justStamped,
}: {
  spec: FillSpec;
  shape: VesselShape;
  visitCount: number;
  visitsRequired: number;
  justStamped: boolean;
}) {
  const offset = fillOffset(spec, visitCount, visitsRequired);
  const previousOffset = fillOffset(
    spec,
    Math.max(visitCount - 1, 0),
    visitsRequired
  );
  // De combien le contenu remonte au chargement. Toujours positif :
  // l'ancien niveau était plus bas.
  const rise = previousOffset - offset;
  const clipId = `vessel-${shape.toLowerCase()}`;

  return (
    <>
      <svg
        width={spec.width}
        height={spec.height}
        viewBox={`0 0 ${spec.width} ${spec.height}`}
        fill="none"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <path d={spec.clip} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* Le contenant vide, à peine teinté : on voit ce qu'il reste
              à remplir. */}
          <rect
            x={0}
            y={0}
            width={spec.width}
            height={spec.height}
            fill={spec.fill}
            opacity={0.13}
          />

          <g transform={`translate(0, ${offset})`}>
            <g
              className={justStamped && rise > 0 ? "contenu-monte" : ""}
              style={{ "--rise": `${rise}px` } as React.CSSProperties}
            >
              <rect
                x={0}
                y={spec.interiorTop}
                width={spec.width}
                height={spec.height}
                fill={spec.fill}
              />
              <ellipse
                cx={spec.surface.cx}
                cy={spec.interiorTop}
                rx={spec.surface.rx}
                ry={spec.surface.ry}
                fill={spec.fillLight}
              />
              {justStamped && spec.gesture === "drop" ? (
                <ellipse
                  className="onde-surface"
                  cx={spec.surface.cx}
                  cy={spec.interiorTop + 2}
                  rx={spec.surface.rx * 0.7}
                  ry={spec.surface.ry * 0.8}
                  fill="none"
                  stroke="#FFF6E4"
                  strokeWidth={4}
                  style={{
                    transformOrigin: `${spec.surface.cx}px ${
                      spec.interiorTop + 2
                    }px`,
                  }}
                />
              ) : null}
              {spec.garnish.map((d, index) => (
                <path
                  key={index}
                  d={d}
                  stroke={spec.fill}
                  strokeWidth={5}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85}
                />
              ))}
            </g>
          </g>
        </g>

        {spec.strokes.map((d, index) => (
          <path
            key={index}
            d={d}
            stroke={spec.fill}
            strokeWidth={spec.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>

      {justStamped && spec.gesture === "drop" ? (
        <DropZone shape={shape} spec={spec} />
      ) : null}
    </>
  );
}

/**
 * Silhouette dont la PORTION grossit — une assiette.
 *
 * Une assiette ne se remplit pas par le bas : ce qui change, c'est la
 * quantité servie. La portion s'élargit à chaque visite et découvre un brin
 * de plus. Le contenant, lui, ne bouge jamais.
 */
function MoundDrawing({
  spec,
  visitCount,
  visitsRequired,
  justStamped,
}: {
  spec: MoundSpec;
  visitCount: number;
  visitsRequired: number;
  justStamped: boolean;
}) {
  const { scale, strands } = moundProgress(spec, visitCount, visitsRequired);
  const precedent = moundProgress(
    spec,
    Math.max(visitCount - 1, 0),
    visitsRequired
  );
  const { cx, cy, rx, ry } = spec.mound;

  return (
    <svg
      width={spec.width}
      height={spec.height}
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      fill="none"
      aria-hidden
    >
      {/* L'assiette vide, à peine teintée : on voit la place qui reste. */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={spec.fill} opacity={0.12} />

      {visitCount > 0 ? (
        <g
          transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
          style={{ transition: "none" }}
        >
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={spec.fill} />
          <ellipse
            cx={cx}
            cy={cy - ry * 0.22}
            rx={rx * 0.82}
            ry={ry * 0.62}
            fill={spec.fillLight}
            opacity={0.55}
          />
          {spec.strands.slice(0, strands).map((d, index) => (
            <path
              key={index}
              className={
                justStamped && index === precedent.strands ? "couche-posee" : ""
              }
              d={d}
              stroke={spec.fillLight}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              opacity={0.9}
            />
          ))}
        </g>
      ) : null}

      {spec.strokes.map((d, index) => (
        <path
          key={index}
          d={d}
          stroke={spec.accent}
          strokeWidth={spec.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

/**
 * Silhouette qui se construit. Chaque visite pose une couche ; celles qui
 * restent à gagner sont esquissées en pointillés, pour que le client voie ce
 * qu'il lui manque.
 *
 * La tranche du dessus n'arrive qu'à la carte complète : c'est elle qui dit
 * « c'est fini » sans avoir besoin d'un mot.
 */
function StackDrawing({
  spec,
  visitCount,
  visitsRequired,
  justStamped,
}: {
  spec: StackSpec;
  visitCount: number;
  visitsRequired: number;
  justStamped: boolean;
}) {
  const layers = stackLayers(spec, visitCount, visitsRequired);
  const complete = visitCount >= visitsRequired;
  const largeur = spec.width - spec.inset * 2;

  return (
    <svg
      width={spec.width}
      height={spec.height}
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      fill="none"
      aria-hidden
    >
      <path d={spec.base.d} fill={spec.base.fill} />

      {layers.map((couche) =>
        couche.posee ? (
          <rect
            key={couche.index}
            className={
              justStamped && couche.index === visitCount - 1
                ? "couche-posee"
                : ""
            }
            x={spec.inset + couche.decalage}
            y={couche.y}
            width={largeur}
            height={Math.max(couche.hauteur - 2, 3)}
            rx={Math.min(couche.hauteur / 2, 7)}
            fill={couche.couleur}
          />
        ) : (
          <rect
            key={couche.index}
            x={spec.inset + 4}
            y={couche.y}
            width={largeur - 8}
            height={Math.max(couche.hauteur - 2, 3)}
            rx={Math.min(couche.hauteur / 2, 7)}
            fill="none"
            stroke={spec.accent}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            opacity={0.3}
          />
        )
      )}

      {complete ? (
        <path
          className={justStamped ? "couche-posee" : ""}
          d={spec.top.d}
          fill={spec.top.fill}
        />
      ) : null}
    </svg>
  );
}

/**
 * Geste « drop » : la mascotte tombe dans le contenant.
 *
 * La zone est découpée et s'arrête à l'ouverture (`rimY`) : la mascotte ne
 * peut donc PAS être dessinée plus bas, quoi qu'il arrive. Sans ce découpage,
 * elle a l'air de passer devant le contenant au lieu d'y entrer.
 */
const FALL_HEIGHT = 140;

function DropZone({
  shape,
  spec,
}: {
  shape: VesselShape;
  spec: { rimY: number; accent: string };
}) {
  const fall = FALL_HEIGHT + spec.rimY;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 overflow-hidden"
      style={{ top: -FALL_HEIGHT, height: fall }}
      aria-hidden
    >
      <div
        className="mascotte-tombe absolute left-[38%] top-[-18px] size-8"
        style={{ "--fall": `${fall}px` } as React.CSSProperties}
      >
        <MascotIcon shape={shape} color={spec.accent} size={32} />
      </div>
      <div
        className="mascotte-tombe-2 absolute left-[54%] top-[-14px] size-6"
        style={{ "--fall": `${fall}px` } as React.CSSProperties}
      >
        <MascotIcon shape={shape} color={spec.accent} size={24} />
      </div>
    </div>
  );
}

/**
 * Geste « streak » : la mascotte traverse l'écran une fois et sort par le
 * coin. Une icône par silhouette : c'est tout le coût d'un nouveau métier.
 */
function StreakMascot({
  shape,
  color,
}: {
  shape: VesselShape;
  color: string;
}) {
  return (
    <div
      className="mascotte-file pointer-events-none absolute -left-16 top-[900px] z-10 size-12"
      aria-hidden
    >
      <MascotIcon shape={shape} color={color} size={46} />
    </div>
  );
}

/** L'icône du métier, seule chose qui change d'un commerce à l'autre. */
function MascotIcon({
  shape,
  color,
  size,
}: {
  shape: VesselShape;
  color: string;
  size: number;
}) {
  if (shape === "PASTA" || shape === "SANDWICH") {
    // Une tomate : elle vaut pour les deux, et elle roule bien.
    return (
      <div className="mascotte-roule flex size-full items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="14" r="7.4" fill="#E24E3B" />
          <path
            d="M12 6c-1.6-2.1-4.2-2.6-5.8-1"
            stroke="#7FB069"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M12 6c1.6-2.1 4.2-2.6 5.8-1"
            stroke="#7FB069"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M12 5.4v2.2"
            stroke="#7FB069"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // CUP : un grain de café.
  return (
    <div className="flex size-full items-center justify-center">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse
          cx="12"
          cy="12"
          rx="7.5"
          ry="10"
          fill="#6B4423"
          stroke={color}
          strokeWidth="1.7"
        />
        <path
          d="M12 3.5c-2.4 3.6-2.4 13.4 0 17"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
