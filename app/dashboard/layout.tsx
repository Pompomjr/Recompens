import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requireMerchant,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMarkSolid } from "@/components/brand/logo";
import { MerchantLogo } from "@/components/merchant/merchant-logo";
import { estAdmin } from "@/lib/auth/admin-access";
import { revenirAMonCompteAction } from "@/lib/admin/exploitation";
import { safeLogoUrl } from "@/lib/merchant/logo";

/**
 * Barrière d'accès réelle de l'espace commerçant (cf SPEC §16).
 *
 * Le middleware a déjà pu rediriger un visiteur, mais son verdict repose sur
 * `user_metadata`, modifiable par l'utilisateur. C'est ICI que le rôle est
 * lu en base et fait autorité — cf SPEC §18 : « Les autorisations doivent
 * être vérifiées côté serveur. »
 *
 * Chaque route API du dashboard doit refaire ce contrôle de son côté : un
 * layout ne protège pas les Route Handlers.
 *
 * L'en-tête porte le nom du COMMERCE, pas le nôtre : c'est son outil. Notre
 * marque signe en pied de page, discrètement.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  let merchantName: string;
  let merchantLogo: string | null;
  // L'exploitant est aussi commerçant : il lui faut un chemin vers /admin
  // depuis son propre dashboard, sinon la page n'existe qu'en la tapant.
  let exploitant = false;
  let exploitation = false;

  try {
    const { user, merchant, exploitation: agitPourAutrui } =
      await requireMerchant();
    merchantName = merchant.name;
    merchantLogo = safeLogoUrl(merchant.logoUrl);
    exploitant = estAdmin(user);
    exploitation = agitPourAutrui;
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
    <div className="flex min-h-full flex-1 flex-col bg-surface text-fg">
      {/* Agir sur le commerce d'autrui ne doit jamais être discret : sans ce
          bandeau, on croit régler son propre commerce et on modifie celui du
          voisin. Il est donc en haut, en couleur, et porte la sortie. */}
      {exploitation ? (
        <div
          data-hors-impression
          className="flex items-center justify-center gap-4 bg-amber-400/15 px-5 py-2.5 text-center"
        >
          <span className="font-mono text-[11px] tracking-[0.12em] text-amber-200">
            VOUS AGISSEZ SUR {merchantName.toUpperCase()}
          </span>
          <form action={revenirAMonCompteAction}>
            <button
              type="submit"
              className="font-mono text-[11px] tracking-[0.12em] text-amber-100 underline"
            >
              REVENIR À MON COMPTE
            </button>
          </form>
        </div>
      ) : null}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 border-b border-line px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <MerchantLogo
            name={merchantName}
            logoUrl={merchantLogo}
            size={28}
            color="var(--fg-soft)"
            border="var(--line)"
            className="font-display"
          />
          <span className="font-display text-[15px] tracking-tight text-fg">
            {merchantName}
          </span>
        </Link>
        <span className="flex items-center gap-4">
          {exploitant ? (
            <Link
              href="/admin"
              className="font-mono text-[11px] tracking-[0.16em] text-brand underline"
            >
              EXPLOITATION
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="font-mono text-[11px] tracking-[0.16em] text-fg-faint underline"
            >
              DÉCONNEXION
            </button>
          </form>
        </span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 px-5 pb-6 pt-2">
        <BrandMarkSolid size={16} />
        <span className="font-mono text-[10px] tracking-[0.16em] text-fg-faint">
          PROPULSÉ PAR RECOMPENS
        </span>
      </footer>
    </div>
  );
}
