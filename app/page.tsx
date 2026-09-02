import Link from "next/link";
import { Wordmark, BrandMark } from "@/components/brand/logo";

/**
 * Page d'accueil publique.
 *
 * Deux publics arrivent ici et n'ont pas le même besoin : le commerçant, qui
 * découvre le produit et doit comprendre en une phrase ce qu'il achète ; et
 * le client déjà inscrit, qui cherche sa carte. D'où les deux chemins, de
 * poids visuel différent.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-ink text-paper">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between p-6">
        <Wordmark className="text-xl" onDark />
        <Link
          href="/login"
          className="font-mono text-[11px] tracking-[0.16em] text-paper/60 underline"
        >
          SE CONNECTER
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 p-6">
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-[40px] leading-[1.05] tracking-tight sm:text-[52px]">
            La carte de fidélité
            <br />
            de vos clients,
            <br />
            <span style={{ color: "#2FBF71" }}>sur leur téléphone.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-paper/65">
            Ils scannent le QR posé sur votre comptoir, leur carte se crée
            toute seule. Aucune application à installer, ni pour eux, ni pour
            vous.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="/register"
            className="flex h-14 items-center justify-center px-8 font-display text-base tracking-[0.06em]"
            style={{ backgroundColor: "#2FBF71", color: "#10331F" }}
          >
            CRÉER MON COMMERCE
          </Link>
          <Link
            href="/customer"
            className="flex h-14 items-center justify-center border border-paper/25 px-8 font-display text-base tracking-[0.06em] text-paper"
          >
            VOIR MA CARTE
          </Link>
        </div>

        <ol className="flex flex-col gap-4 border-t border-paper/15 pt-8">
          {[
            "Vous créez votre programme : le nombre de visites et la récompense.",
            "Vous imprimez le QR code et le posez sur votre comptoir.",
            "À chaque passage, vous scannez la carte du client. Il voit son compteur monter.",
          ].map((etape, index) => (
            <li key={index} className="flex gap-4">
              <span
                className="font-display text-sm leading-6"
                style={{ color: "#2FBF71" }}
              >
                0{index + 1}
              </span>
              <span className="text-[15px] leading-6 text-paper/70">
                {etape}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <footer className="mx-auto flex w-full max-w-2xl items-center gap-3 p-6">
        <BrandMark size={28} />
        <span className="font-mono text-[11px] tracking-[0.14em] text-paper/40">
          CARTES DE FIDÉLITÉ POUR COMMERCES DE PROXIMITÉ
        </span>
      </footer>
    </main>
  );
}
