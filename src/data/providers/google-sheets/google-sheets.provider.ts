import type { DataProvider } from "@/data/contracts/repositories";
import type { DataProviderDiagnostics, PersistenceHealth } from "@/data/contracts/types";
import { ConfigurationError, IntegrationError } from "@/lib/errors";
import { DATA_SCHEMA_VERSION, REQUIRED_SHEETS, SHEET_HEADERS, SHEETS } from "./sheets.config";
import { getGoogleSheetsClient, resetGoogleSheetsClient } from "./google-sheets.client";
import { maskSpreadsheetId, requireSheetsEnv } from "./sheets.mapper";
import {
  SheetsAuditRepository,
  SheetsBranchRepository,
  SheetsCompanyRepository,
  SheetsDashboardRepository,
  SheetsDocumentRepository,
  SheetsLoginHistoryRepository,
  SheetsNotificationRepository,
  SheetsNumberSequenceRepository,
  SheetsPasswordHistoryRepository,
  SheetsPermissionRepository,
  SheetsRolePermissionRepository,
  SheetsRoleRepository,
  SheetsSchemaMigrationRepository,
  SheetsSettingsRepository,
  SheetsUserRepository,
  SheetsUserRoleRepository,
  SheetsUserSessionRepository,
  SheetsWarehouseRepository
} from "./repositories";

export class GoogleSheetsProvider implements DataProvider {
  readonly name = "google-sheets" as const;

  companies = new SheetsCompanyRepository();
  branches = new SheetsBranchRepository();
  warehouses = new SheetsWarehouseRepository();
  users = new SheetsUserRepository();
  roles = new SheetsRoleRepository();
  permissions = new SheetsPermissionRepository();
  userRoles = new SheetsUserRoleRepository();
  rolePermissions = new SheetsRolePermissionRepository();
  userSessions = new SheetsUserSessionRepository();
  passwordHistory = new SheetsPasswordHistoryRepository();
  audit = new SheetsAuditRepository();
  loginHistory = new SheetsLoginHistoryRepository();
  notifications = new SheetsNotificationRepository();
  documents = new SheetsDocumentRepository();
  settings = new SheetsSettingsRepository();
  numberSequences = new SheetsNumberSequenceRepository();
  dashboard = new SheetsDashboardRepository();
  schemaMigrations = new SheetsSchemaMigrationRepository();

  async health(): Promise<PersistenceHealth> {
    try {
      requireSheetsEnv();
    } catch (error) {
      return {
        provider: this.name,
        status: "Not configured",
        detail: error instanceof Error ? error.message : "Google Sheets is not configured.",
        spreadsheetIdMasked: maskSpreadsheetId(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
      };
    }

    try {
      const client = getGoogleSheetsClient();
      const titles = await client.listSheetTitles();
      const available = REQUIRED_SHEETS.filter((s) => titles.includes(s)).length;
      const status =
        available === REQUIRED_SHEETS.length
          ? "Healthy"
          : available > 0
            ? "Degraded"
            : "Unavailable";
      return {
        provider: this.name,
        status,
        detail:
          status === "Healthy"
            ? "Google Sheets connection successful"
            : `Spreadsheet reachable; ${available}/${REQUIRED_SHEETS.length} required sheets present`,
        spreadsheetIdMasked: maskSpreadsheetId(client.spreadsheetId),
        lastSuccessfulReadAt: client.getLastSuccessfulReadAt(),
        requiredSheets: { total: REQUIRED_SHEETS.length, available }
      };
    } catch (error) {
      return {
        provider: this.name,
        status: "Unavailable",
        detail: error instanceof IntegrationError || error instanceof ConfigurationError
          ? error.message
          : "Google Sheets connection failed",
        spreadsheetIdMasked: maskSpreadsheetId(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
      };
    }
  }

  async diagnostics(): Promise<DataProviderDiagnostics> {
    const checkedAt = new Date().toISOString();
    try {
      requireSheetsEnv();
      const client = getGoogleSheetsClient();
      const titles = await client.listSheetTitles();
      const requiredSheets = REQUIRED_SHEETS.map((name) => ({
        name,
        present: titles.includes(name)
      }));
      const availableCount = requiredSheets.filter((s) => s.present).length;
      const schema = await this.settings.get("System", "DATA_SCHEMA_VERSION");
      const health = await this.health();
      return {
        provider: this.name,
        status: health.status,
        spreadsheetConfigured: true,
        spreadsheetIdMasked: maskSpreadsheetId(client.spreadsheetId),
        requiredSheets,
        availableCount,
        totalCount: REQUIRED_SHEETS.length,
        schemaVersion: schema?.settingValue ?? null,
        lastCheckedAt: checkedAt,
        detail: health.detail
      };
    } catch (error) {
      return {
        provider: this.name,
        status: "Not configured",
        spreadsheetConfigured: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
        spreadsheetIdMasked: maskSpreadsheetId(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
        requiredSheets: REQUIRED_SHEETS.map((name) => ({ name, present: false })),
        availableCount: 0,
        totalCount: REQUIRED_SHEETS.length,
        schemaVersion: null,
        lastCheckedAt: checkedAt,
        detail: error instanceof Error ? error.message : "Diagnostics failed"
      };
    }
  }
}

export async function ensureGoogleSheetsStructure(): Promise<{
  created: string[];
  existing: string[];
}> {
  const client = getGoogleSheetsClient();
  const created: string[] = [];
  const existing: string[] = [];
  for (const name of REQUIRED_SHEETS) {
    const result = await client.ensureSheet(name, SHEET_HEADERS[name]);
    if (result === "created") created.push(name);
    else existing.push(name);
  }
  return { created, existing };
}

export { SHEETS, SHEET_HEADERS, DATA_SCHEMA_VERSION, REQUIRED_SHEETS, resetGoogleSheetsClient };
