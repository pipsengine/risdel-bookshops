/**
 * Google Sheets schema migrations.
 * Recorded in System_SchemaMigrations. Idempotent when used with sheets:init.
 */
export const SHEET_MIGRATIONS = [
  { version: "001", name: "foundation", description: "Core system sheets and headers" },
  { version: "002", name: "identity", description: "Auth users, roles, permissions, sessions" },
  { version: "003", name: "organisation", description: "Company, branch, warehouse sheets" },
  { version: "004", name: "dashboard", description: "Dashboard metrics, alerts, preferences" }
] as const;
