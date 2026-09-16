import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark, BrandMark } from "@/components/brand/logo";
import { LoyaltyCard } from "@/components/customer/loyalty-card";

/**
 * Page d'accueil publique.
 *
 * Deux publics arrivent ici et n'ont pas le même besoin : le commerçant, qui
 * découvre le produit et doit comprendre en une phrase ce qu'il achète ; et
 * le client déjà inscrit, qui cherche sa carte. D'où les deux chemins, de
 * poids visuel différent.
 *
 * La page MONTRE le produit au lieu de le décrire. Avant, un titre, deux
 * boutons et trois étapes numérotées auraient pu vendre n'importe quoi : le
 * commerçant devait imaginer ce que verrait son client, alors que c'est le
 * meilleur argument du produit. La carte ci-dessous est le vrai composant de
 * l'espace client, pas une capture qui vieillirait à chaque retouche.
 */

/**
 * La carte d'exemple. Un commerce fictif, un prénom courant : la page montre
 * ce que voit un client sans exposer personne.
 *
 * Sept tampons sur dix, et le septième qui tombe à l'ouverture : c'est le
 * geste du produit, joué une fois, sans boucle. Au-delà, l'écran qui gigote
 * fatigue et détourne du bouton.
 */
const EXEMPLE = {
  merchantName: "La Boulangerie",
  logoUrl: null,
  brandColor: "#A63A28",
  firstName: "Camille",
  cardNumber: "7A2F",
  memberSince: "03/2026",
  visitCount: 7,
  visitsRequired: 10,
  rewardName: "Une viennoiserie offerte",
  rewardAvailable: false,
  qrDataUrl: "",
} as const;

const ETAPES = [
  "Vous créez votre programme : le nombre de visites et la récompense.",
  "Vous imprimez le QR code et le posez sur votre comptoir.",
  "À chaque passage, vous scannez la carte du client. Il voit son compteur monter.",
];

/**
 * Anneau de focus aux couleurs de la marque. Le fond est sombre sur toute
 * cette page, le vert y tient 7,7:1 — contrairement aux pages papier de
 * l'espace client, où la règle ne serait pas lisible. D'où une classe
 * locale plutôt qu'une règle globale.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // Les liens de confirmation partis avant la mise à jour du template
  // atterrissent ici, sur l'URL du site, avec un code à échanger. On les
  // renvoie vers la route qui sait ouvrir une session : sans ça, la personne
  // voit la page d'accueil et croit que rien ne s'est passé.
  const { code } = await searchParams;
  if (code) {
    redirect(`/auth/confirm?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="flex flex-1 flex-col bg-ink text-paper">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Wordmark className="text-xl" onDark />
        <Link
          href="/login"
          className={`py-2 text-sm font-medium text-paper/70 underline underline-offset-4 ${FOCUS}`}
        >
          Se connecter
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-6 pb-14 pt-4 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            {/* Pas de retours à la ligne forcés : sur un téléphone, ils
                cassaient le titre en cinq lignes au lieu de trois, avec
                « fidélité » seul sur la sienne. L'équilibrage laisse le
                navigateur répartir les mots selon la largeur réelle. */}
            <h1 className="text-balance font-display text-[34px] leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              La carte de fidélité de vos clients,{" "}
              <span style={{ color: "#2FBF71" }}>sur leur téléphone.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-paper/65">
              Ils scannent le QR posé sur votre comptoir, leur carte se crée
              toute seule. Aucune application à installer, ni pour eux, ni pour
              vous.
            </p>
          </div>

          {/* Côte à côte seulement quand la colonne est assez large. Entre
              768 et 1024 px, la page passe en deux colonnes et la colonne de
              texte redevient étroite : les deux boutons y coupaient leur
              libellé sur deux lignes. On les empile donc de nouveau à cette
              largeur, et `whitespace-nowrap` garantit qu'aucun ne se casse. */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center">
            <Link
              href="/register"
              className={`flex h-14 items-center justify-center whitespace-nowrap px-8 font-display text-base tracking-[0.06em] ${FOCUS}`}
              style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
            >
              CRÉER MON COMMERCE
            </Link>
            {/* Contour à 45 % : à 25 %, le bord du bouton tenait 2:1 sur le
                fond et disparaissait en plein soleil. Un élément non textuel
                doit tenir 3:1 pour qu'on perçoive qu'il est cliquable. */}
            <Link
              href="/customer"
              className={`flex h-14 items-center justify-center whitespace-nowrap border border-paper/45 px-8 font-display text-base tracking-[0.06em] text-paper ${FOCUS}`}
            >
              VOIR MA CARTE
            </Link>
          </div>
        </div>

        <figure className="mx-auto flex w-full max-w-[340px] flex-col gap-5 md:mx-0 md:justify-self-end">
          {/* Masquée aux lecteurs d'écran : ses textes (« Camille »,
              « La Boulangerie ») seraient lus comme de vraies informations.
              La légende dit ce que l'image montre. */}
          <div
            className="-rotate-2 shadow-[0_28px_60px_-16px_rgba(0,0,0,0.7)]"
            aria-hidden
          >
            <LoyaltyCard {...EXEMPLE} justStamped showQr={false} />
          </div>
          <figcaption className="text-center text-sm text-paper/60">
            Exemple : ce que voit votre client au moment où son 7e tampon tombe.
          </figcaption>
        </figure>
      </section>

      {/* Les étapes, en tampons.
          C'était la section la plus plate de la page : de petits chiffres
          verts et du texte gris, sans aucun des moyens que le reste de la
          page possède déjà. Les numéros prennent donc la forme du tampon de
          la carte — même cercle, même inclinaison calculée — et un trait
          pointillé, celui des cases vides du ticket, les relie en parcours.
          Rien d'autre n'est ajouté : pas de nouvelle couleur, pas de nouvelle
          police, et aucun mouvement, le tampon du haut de page restant le
          seul geste animé. */}
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="border-t border-paper/15 pb-2 pt-14 md:pt-20">
          <ol className="flex flex-col md:grid md:grid-cols-3 md:gap-10">
            {ETAPES.map((etape, index) => {
              // Même formule que les tampons de LoyaltyCard : chacun posé de
              // travers, de façon stable d'un affichage à l'autre.
              const tilt = ((index * 37) % 17) - 8;
              const derniere = index === ETAPES.length - 1;

              return (
                <li
                  key={index}
                  className={`relative grid grid-cols-[4rem_1fr] gap-5 md:flex md:flex-col md:gap-6 ${
                    derniere ? "" : "pb-10 md:pb-0"
                  }`}
                >
                  {derniere ? null : (
                    <>
                      {/* Trait vertical sur téléphone, horizontal au-delà :
                          il part du bord du tampon et s'arrête sur le suivant. */}
                      <span
                        className="absolute bottom-0 left-8 top-16 border-l-2 border-dashed border-paper/20 md:hidden"
                        aria-hidden
                      />
                      <span
                        className="absolute -right-10 left-[5.5rem] top-8 hidden border-t-2 border-dashed border-paper/20 md:block"
                        aria-hidden
                      />
                    </>
                  )}

                  {/* Le numéro est déjà porté par la liste ordonnée : le
                      tampon est décoratif pour les lecteurs d'écran. */}
                  <span
                    className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] bg-ink font-display text-2xl"
                    style={{
                      borderColor: "#2FBF71",
                      color: "#2FBF71",
                      transform: `rotate(${tilt}deg)`,
                    }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>

                  <span className="pt-4 text-lg leading-8 text-paper/80 md:pt-0">
                    {etape}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Le tarif. Un commerçant qui ne trouve ni prix ni moyen de parler à
          quelqu'un ne peut pas décider — il part. Tant que les tarifs
          s'ajustent commerce par commerce, on donne une porte plutôt qu'un
          chiffre. */}
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="flex flex-col gap-6 border-t border-paper/15 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-md flex-col gap-2">
            <h2 className="font-display text-2xl tracking-tight">
              Tarif sur demande
            </h2>
            <p className="text-base leading-7 text-paper/70">
              Le tarif dépend de votre commerce. Écrivez-nous, on en parle.
            </p>
          </div>
          <a
            href="mailto:contact@recompens.com"
            className={`flex h-12 items-center justify-center border border-paper/45 px-6 text-base font-medium text-paper ${FOCUS}`}
          >
            contact@recompens.com
          </a>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-5xl items-center gap-3 p-6">
        <BrandMark size={28} />
        {/* En police courante et à 60 % : le libellé en police mono à 40 %
            tenait à peine plus de 3:1 à 11 px, et la mono y jouait le
            costume « technique » plutôt qu'un vrai rôle. */}
        <span className="text-sm text-paper/60">
          Cartes de fidélité pour commerces de proximité
        </span>
      </footer>
    </main>
  );
}
