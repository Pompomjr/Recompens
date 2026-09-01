import { redirect } from "next/navigation";
import {
  requireMerchant,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { LogoutButton } from "@/components/ui/logout-button";

/**
 * Barrière d'accès réelle de l'espace commerçant (cf SPEC §16).
 *
 * Le middleware a déjà pu rediriger un visiteur, mais son verdict repose sur
 * `user_metadata`, modifiable par l'utilisateur. C'est ICI que le rôle est
 * lu en base et fait autorité — cf SPEC §18 : "Les autorisations doivent
 * être vérifiées côté serveur."
 *
 * Chaque route API du dashboard doit refaire ce contrôle de son côté : un
 * layout ne protège pas les Route Handlers.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  let merchantName: string;

  try {
    const { merchant } = await requireMerchant();
    merchantName = merchant.name;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login?next=/dashboard");
    }
    if (error instanceof ForbiddenError) {
      redirect("/");
    }
    throw error;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <span className="font-semibold text-neutral-900">{merchantName}</span>
        <LogoutButton />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
