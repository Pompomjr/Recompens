import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { RetrouverForm } from "./retrouver-form";

/**
 * « J'ai perdu ma carte » — la porte de secours du client.
 *
 * Elle n'est utile qu'à ceux qui ont rattaché une adresse à leur carte. Les
 * autres n'ont d'autre recours que de rescanner le QR du comptoir, et la page
 * le dit franchement plutôt que de les laisser attendre un mail qui ne
 * viendra pas.
 */
export default function RetrouverMaCartePage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 p-6">
      <Link href="/" className="self-start">
        <Wordmark className="text-lg" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-fg">
          Retrouver ma carte
        </h1>
        <p className="text-sm text-fg-soft">
          Si vous avez enregistré votre adresse email, nous vous envoyons un
          lien qui rouvre votre carte — avec toutes vos visites.
        </p>
      </div>

      <RetrouverForm />

      <p className="text-sm text-fg-soft">
        Vous n&apos;aviez pas donné d&apos;adresse ? Rescannez le QR code affiché
        chez votre commerçant : votre carte y sera rattachée de nouveau.
      </p>
    </main>
  );
}
