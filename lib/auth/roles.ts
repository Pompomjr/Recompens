import type { Role } from "@prisma/client";

/**
 * Espaces protégés par rôle (cf SPEC §16 — Pages).
 * Partagé entre le middleware (Edge, sans accès Prisma) et les Server Actions
 * pour qu'il n'existe qu'une seule table de correspondance rôle → accueil.
 */
export type AppRole = Role;

export const ROLE_HOME: Record<AppRole, string> = {
  CUSTOMER: "/customer",
  MERCHANT: "/dashboard",
  ADMIN: "/admin",
};

/** Préfixe d'URL → rôle exigé pour y accéder. */
export const PROTECTED_PREFIXES: { prefix: string; role: AppRole }[] = [
  { prefix: "/dashboard", role: "MERCHANT" },
  { prefix: "/customer", role: "CUSTOMER" },
  { prefix: "/admin", role: "ADMIN" },
];
