import Link from "next/link";
import { RegisterMerchantForm } from "./register-form";
import { Wordmark } from "@/components/brand/logo";

/**
 * cf SPEC §16 — page publique /register.
 *
 * Réservée au parcours commerçant du §6. Les clients ne passent JAMAIS par
 * ici : ils s'inscrivent en scannant le QR du commerce, ce qui les amène sur
 * /join/[programId] où le compte CUSTOMER et la carte sont créés ensemble
 * (cf SPEC §8) — implémenté à l'étape 06.
 */
export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 p-6">
      <Link href="/" className="self-start">
        <Wordmark className="text-lg" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-neutral-900">
          Créer mon compte commerçant
        </h1>
        <p className="text-sm text-neutral-600">
          Votre commerce et votre programme de fidélité, en quelques minutes.
        </p>
      </div>

      <RegisterMerchantForm />

      <div className="flex flex-col gap-3 text-center text-sm text-neutral-600">
        <p>
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-medium underline">
            Se connecter
          </Link>
        </p>
        <p className="text-xs text-neutral-500">
          Vous êtes client d&apos;un commerce ? Scannez simplement le QR code
          affiché en boutique : votre carte se crée toute seule.
        </p>
      </div>
    </main>
  );
}
