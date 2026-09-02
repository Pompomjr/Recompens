import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { ForgotPasswordForm } from "./forgot-form";

/**
 * Mot de passe oublié.
 *
 * Sans cet écran, un commerçant qui perd son mot de passe est définitivement
 * dehors : il n'a pas accès à la console d'administration, et se réinscrire
 * lui répond « adresse déjà utilisée ».
 */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expire?: string }>;
}) {
  const { expire } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <Link href="/" className="self-start">
        <Wordmark className="text-lg" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-fg">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-fg-soft">
          Indiquez l&apos;adresse de votre compte commerçant. Vous recevrez un
          lien pour en choisir un nouveau.
        </p>
      </div>

      {expire ? (
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          Ce lien n&apos;est plus valable — il a expiré ou a déjà servi.
          Demandez-en un nouveau ci-dessous.
        </p>
      ) : null}

      <ForgotPasswordForm />

      <p className="text-center text-sm text-fg-soft">
        <Link href="/login" className="font-medium text-brand underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
