import { createSupabaseServerClient } from "./supabase-server";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Non authentifié") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Récupère l'utilisateur courant (session Supabase + enregistrement métier).
 * Retourne null si personne n'est authentifié.
 *
 * Toute route API qui touche à visit_count, reward_available ou aux données
 * d'un autre commerçant DOIT passer par cette fonction plutôt que de faire
 * confiance à un id envoyé par le client (cf SPEC §5, §18).
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { merchant: true, customer: true },
  });

  return user;
}

/**
 * À utiliser en tête de chaque route API protégée.
 * Lève une erreur explicite si l'utilisateur n'est pas authentifié
 * ou n'a pas le bon rôle — ne jamais se contenter d'un check côté UI.
 */
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (user.role !== role) throw new ForbiddenError(`Rôle requis: ${role}`);
  return user;
}

export async function requireMerchant() {
  const user = await requireRole("MERCHANT" as Role);
  if (!user.merchant) {
    throw new ForbiddenError("Aucun commerce associé à ce compte");
  }
  return { user, merchant: user.merchant };
}

export async function requireCustomer() {
  const user = await requireRole("CUSTOMER" as Role);
  if (!user.customer) {
    throw new ForbiddenError("Aucun profil client associé à ce compte");
  }
  return { user, customer: user.customer };
}
