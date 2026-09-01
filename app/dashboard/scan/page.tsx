import Link from "next/link";
import { requireMerchant } from "@/lib/auth/session";
import { ScanClient } from "@/components/scanner/scan-client";

/**
 * cf SPEC §10 — Scanner un client.
 *
 * `requireMerchant()` est rappelé ici : le layout protège l'affichage, mais
 * c'est le contrôle serveur qui fait foi (cf SPEC §18).
 */
export default async function ScanPage() {
  await requireMerchant();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 p-5">
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Retour au dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Scanner un client
      </h1>
      <p className="-mt-3 text-sm text-neutral-600">
        Présentez le QR du client devant la caméra.
      </p>

      <ScanClient />
    </main>
  );
}
