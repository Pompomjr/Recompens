import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Préparation commune à tous les tests.
 *
 * 1. Charger `.env`. Next.js le fait tout seul au démarrage, vitest non, et
 *    Prisma a besoin de `DATABASE_URL`.
 * 2. Forcer le délai anti-cumul, pour que la suite donne le même résultat
 *    quelle que soit la valeur choisie en local (cf lib/loyalty/config.ts).
 *
 * Ce fichier s'exécute AVANT que les tests n'importent le code applicatif :
 * c'est ce qui permet de fixer `LOYALTY_MIN_MINUTES_BETWEEN_VISITS` avant que
 * la constante ne soit évaluée à l'import.
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

export const TEST_COOLDOWN_MINUTES = 30;
process.env.LOYALTY_MIN_MINUTES_BETWEEN_VISITS = String(TEST_COOLDOWN_MINUTES);
