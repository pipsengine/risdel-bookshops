import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { loadEnvFiles } from "./load-env";
import { getDataProvider, resetDataProvider } from "../../src/data";
import { resetGoogleSheetsClient } from "../../src/data/providers/google-sheets/google-sheets.provider";
import { SHEETS } from "../../src/data/providers/google-sheets/sheets.config";
import { getGoogleSheetsClient } from "../../src/data/providers/google-sheets/google-sheets.client";

async function main() {
  loadEnvFiles();
  process.env.DATA_PROVIDER = "google-sheets";
  resetGoogleSheetsClient();
  resetDataProvider();

  const stamp = new Date().toISOString().slice(0, 10);
  const outDir = resolve(process.cwd(), "exports", stamp);
  mkdirSync(outDir, { recursive: true });

  const client = getGoogleSheetsClient();
  const mapping: Record<string, string> = {
    companies: SHEETS.companies,
    branches: SHEETS.branches,
    warehouses: SHEETS.warehouses,
    settings: SHEETS.settings,
    numberSequences: SHEETS.numberSequences,
    notifications: SHEETS.notifications,
    documents: SHEETS.documents,
    users: SHEETS.users,
    roles: SHEETS.roles,
    permissions: SHEETS.permissions,
    userRoles: SHEETS.userRoles,
    rolePermissions: SHEETS.rolePermissions,
    userSessions: SHEETS.userSessions,
    passwordHistory: SHEETS.passwordHistory,
    auditLogs: SHEETS.auditLogs,
    loginHistory: SHEETS.loginHistory,
    dashboardMetrics: SHEETS.dashboardMetrics,
    dashboardAlerts: SHEETS.dashboardAlerts,
    dashboardPreferences: SHEETS.dashboardPreferences,
    schemaMigrations: SHEETS.schemaMigrations
  };

  for (const [file, sheet] of Object.entries(mapping)) {
    try {
      const { headers, rows } = await client.getSheetRows(sheet, true);
      const records = rows.map((r) => r.record);
      writeFileSync(resolve(outDir, `${file}.json`), JSON.stringify({ headers, records }, null, 2));
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const v = (r.record[h] || "").replace(/"/g, '""');
              return `"${v}"`;
            })
            .join(",")
        )
      ].join("\n");
      writeFileSync(resolve(outDir, `${file}.csv`), csv);
      console.log(`Exported ${file} (${records.length} rows)`);
    } catch (error) {
      console.warn(`Skipped ${file}:`, error instanceof Error ? error.message : error);
    }
  }

  // Also verify provider health for the export run
  const health = await getDataProvider().health();
  console.log(`Provider status: ${health.status}`);
  console.log(`Output: ${outDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
