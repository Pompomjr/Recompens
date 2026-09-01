import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    // Les tests écrivent dans une VRAIE base Postgres : deux fichiers qui
    // tourneraient en parallèle se marcheraient dessus.
    fileParallelism: false,
    // Supabase est distant, les allers-retours réseau sont plus lents qu'un
    // Postgres local.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    // Reproduit l'alias "@/*" du tsconfig.json, sans dépendance supplémentaire.
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
