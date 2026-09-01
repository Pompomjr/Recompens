import Link from "next/link";
import { LoginForm } from "./login-form";

// cf SPEC §16 — page publique /login (commerçant comme client).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Connexion
        </h1>
        <p className="text-sm text-neutral-600">
          Accédez à votre espace commerçant ou à votre carte de fidélité.
        </p>
      </div>

      <LoginForm next={next} />

      <p className="text-center text-sm text-neutral-600">
        Vous êtes commerçant et n&apos;avez pas encore de compte ?{" "}
        <Link href="/register" className="font-medium underline">
          Créer mon compte
        </Link>
      </p>
    </main>
  );
}
