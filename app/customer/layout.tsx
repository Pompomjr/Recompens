import { redirect } from "next/navigation";
import {
  requireCustomer,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { LogoutButton } from "@/components/ui/logout-button";

/**
 * Barrière d'accès réelle de l'espace client (cf SPEC §16).
 *
 * Rappel SPEC §3 : un CUSTOMER ne peut que CONSULTER. Aucune page sous
 * /customer ne doit exposer d'action modifiant `visit_count` — la seule
 * écriture possible passe par un merchant authentifié dans
 * `lib/loyalty/visit.ts` (cf SPEC §5).
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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <span className="font-semibold text-neutral-900">{firstName}</span>
        <LogoutButton />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
