export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
        E-Loyalty
      </h1>
      <p className="max-w-md text-neutral-600">
        Cartes de fidélité digitales pour commerces physiques. Aucune
        application à télécharger.
      </p>
      <div className="flex gap-3">
        <a
          href="/register"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Créer mon compte commerçant
        </a>
        <a
          href="/login"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900"
        >
          Se connecter
        </a>
      </div>
    </main>
  );
}
