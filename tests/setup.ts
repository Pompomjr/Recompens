import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Préparation commune à tous les tests.
 *
 * 1. Charger `.env`. Next.js le fait tout seul au démarrage, vitest non, et
 *    Prisma a besoin de `DATABASE_URL`.
 * Le délai anti-cumul, lui, n'a plus besoin d'être forcé ici : il vit
 * désormais sur le programme (`LoyaltyProgram.minMinutesBetweenVisits`), et
 * chaque test fixe la valeur qu'il veut éprouver.
 */
function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");

  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new Error(
      "Fichier .env introuvable : les tests ont besoin de DATABASE_URL."
    );
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    // Une variable déjà présente dans l'environnement l'emporte sur le
    // fichier : c'est la convention habituelle, et ça permet de surcharger
    // ponctuellement en ligne de commande.
    if (process.env[key] === undefined) {
      process.env[key] = trimmed.slice(separator + 1).trim();
    }
  }
}

loadEnvFile();
