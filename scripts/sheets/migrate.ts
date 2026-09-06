import { loadEnvFiles } from "./load-env";
import { getDataProvider, resetDataProvider } from "../../src/data";
import {
  ensureGoogleSheetsStructure,
  resetGoogleSheetsClient
} from "../../src/data/providers/google-sheets/google-sheets.provider";
import { SHEET_MIGRATIONS } from "./migrations";

async function main() {
  loadEnvFiles();
  process.env.DATA_PROVIDER = "google-sheets";
  resetGoogleSheetsClient();
  resetDataProvider();

  console.log("Ensuring sheet structure…");
  await ensureGoogleSheetsStructure();

  const db = getDataProvider();
  for (const migration of SHEET_MIGRATIONS) {
    if (await db.schemaMigrations.has(migration.version)) {
      console.log(`Skip ${migration.version} ${migration.name} (already applied)`);
      continue;
    }
    await db.schemaMigrations.record(migration.version, migration.name);
    console.log(`Applied ${migration.version} ${migration.name}`);
  }
  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
