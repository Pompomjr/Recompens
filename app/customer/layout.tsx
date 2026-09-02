import { redirect } from "next/navigation";
import {
  requireCustomer,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { ServiceWorker } from "@/components/customer/service-worker";

/**
 * Barrière d'accès réelle de l'espace client (cf SPEC §16).
 *
 * Rappel SPEC §3 : un CUSTOMER ne peut que CONSULTER. Aucune page sous
 * /customer ne doit exposer d'action modifiant `visit_count` — la seule
 * écriture possible passe par un commerçant authentifié dans
 * `lib/loyalty/visit.ts` (cf SPEC §5).
 *
 * Le fond sombre n'est pas décoratif : c'est lui qui apparaît dans les
 * encoches de la perforation et donne à la carte son air de ticket découpé.
 */
export default async function CustomerLayout({
  children,
}: LayoutProps<"/customer">) {
  let firstName: string;

  try {
    const { customer } = await requireCustomer();
    firstName = customer.firstName;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login?next=/customer");
    }
    if (error instanceof ForbiddenError) {
      redirect("/");
    }
    throw error;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ink text-paper">
      <ServiceWorker />
      <header className="mx-auto flex w-full max-w-sm items-center justify-between px-5 pt-5">
        <span className="font-display text-sm tracking-wide">
          {firstName.toUpperCase()}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="font-mono text-[11px] tracking-[0.16em] text-paper/45 underline"
          >
            DÉCONNEXION
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
