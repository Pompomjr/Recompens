import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { ResetPasswordForm } from "./reset-form";

/**
 * Choix du nouveau mot de passe, après avoir suivi le lien reçu par mail.
 *
 * La page n'est accessible qu'avec la session ouverte par /auth/reset. Sans
 * elle, on renvoie vers la demande plutôt que d'afficher un formulaire qui
 * échouerait à l'envoi.
 */
export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password?expire=1");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <Link href="/" className="self-start">
        <Wordmark className="text-lg" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-neutral-900">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-neutral-600">
          Choisissez-en un nouveau pour {user.email}. Vous serez connecté dans
          la foulée.
        </p>
      </div>

      <ResetPasswordForm />
    </main>
  );
}
