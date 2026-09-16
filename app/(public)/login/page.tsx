import Link from "next/link";
import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/brand/logo";

// cf SPEC §16 — page publique /login (commerçant comme client).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirme?: string }>;
}) {
  const { next, confirme } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 p-6">
      <Link href="/" className="self-start">
        <Wordmark className="text-lg" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-tight text-fg">
          Connexion
        </h1>
        {/* Cette page annonçait « votre espace commerçant OU votre carte de
            fidélité ». Or un client n'a pas de mot de passe — sa carte
            s'ouvre depuis son téléphone ou par un lien envoyé par mail. Il
            saisissait donc une adresse et un mot de passe inventé, se voyait
            refusé, et croyait sa carte perdue. La page ne promet plus que ce
            qu'elle sait faire, et la porte du client est nommée plus bas. */}
        <p className="text-sm text-fg-soft">
          Votre espace commerçant.
        </p>
      </div>

      {/* Un lien de confirmation ne sert qu'une fois : arriver ici signifie
          qu'il a expiré ou qu'il a déjà été utilisé. Dans les deux cas
          l'adresse est probablement déjà confirmée — d'où le ton neutre. */}
      {confirme === "autre-appareil" ? (
        <p
          role="status"
          className="rounded-lg border border-line bg-surface-raised px-4 py-3 text-sm text-fg-soft"
        >
          Votre adresse est confirmée. Ce lien ayant été ouvert sur un autre
          appareil que celui de l&apos;inscription, il reste à vous connecter
          une fois.
        </p>
      ) : null}

      {confirme === "expire" ? (
        <p
          role="status"
          className="rounded-lg border border-line bg-surface-raised px-4 py-3 text-sm text-fg-soft"
        >
          Ce lien de confirmation n&apos;est plus valable — il a peut-être déjà
          servi. Connectez-vous ci-dessous : si votre adresse est confirmée,
          tout fonctionne normalement.
        </p>
      ) : null}

      <LoginForm next={next} />

      {/* Trois phrases centrées du même poids se lisaient comme une liste de
          liens équivalents, alors qu'elles s'adressent à deux publics et à
          trois moments différents. Elles sont désormais hiérarchisées : le
          dépannage du commerçant colle au formulaire, sa création de compte
          suit, et la porte du CLIENT — un autre public, qui ne se connecte
          pas ici — est mise à part par un filet. */}
      <div className="-mt-4 flex flex-col gap-4">
        <p className="text-sm text-fg-soft">
          <Link
            href="/forgot-password"
            className="font-medium text-brand underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>

        <p className="text-sm text-fg-soft">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-brand underline">
            Créer mon commerce
          </Link>
        </p>
      </div>

      <p className="border-t border-line pt-6 text-sm text-fg-soft">
        Vous êtes client d&apos;un commerce et vous avez perdu votre carte ?
        Elle ne s&apos;ouvre pas avec un mot de passe —{" "}
        <Link
          href="/retrouver-ma-carte"
          className="font-medium text-brand underline"
        >
          retrouvez-la ici
        </Link>
        .
      </p>
    </main>
  );
}
