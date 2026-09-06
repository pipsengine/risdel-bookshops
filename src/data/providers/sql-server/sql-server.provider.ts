import type { DataProvider } from "@/data/contracts/repositories";
import type {
  AuditLog,
  AuditLogInput,
  DataProviderDiagnostics,
  LoginHistory,
  Notification,
  NumberSequence,
  PaginatedResult,
  PasswordHistory,
  PersistenceHealth,
  RolePermission,
  SchemaMigration,
  SystemSetting,
  UserRole,
  UserSession,
  DocumentMeta,
  DashboardMetric,
  DashboardAlert,
  DashboardPreference
} from "@/data/contracts/types";
import { ConfigurationError } from "@/lib/errors";
import { databaseConfigured, databaseHealth } from "@/lib/db";

function notReady(entity: string): never {
  throw new ConfigurationError(
    `SQL Server provider domain operations for ${entity} are not implemented in this release. Use DATA_PROVIDER=google-sheets, or extend the SQL repositories.`
  );
}

class UnimplementedRepo {
  findById() {
    return notReady("entity");
  }
  findMany() {
    return notReady("entity");
  }
  create() {
    return notReady("entity");
  }
  update() {
    return notReady("entity");
  }
  deactivate() {
    return notReady("entity");
  }
  exists() {
    return notReady("entity");
  }
}

/** Preserved SQL Server provider surface. Health works; domain CRUD awaits Module SQL wiring. */
export class SqlServerProvider implements DataProvider {
  readonly name = "sql-server" as const;

  companies = new UnimplementedRepo() as unknown as DataProvider["companies"];
  branches = new UnimplementedRepo() as unknown as DataProvider["branches"];
  warehouses = new UnimplementedRepo() as unknown as DataProvider["warehouses"];
  users = new UnimplementedRepo() as unknown as DataProvider["users"];
  roles = new UnimplementedRepo() as unknown as DataProvider["roles"];
  permissions = new UnimplementedRepo() as unknown as DataProvider["permissions"];
  userRoles = {
    findByUserId: async (): Promise<UserRole[]> => notReady("userRoles"),
    assign: async (): Promise<UserRole> => notReady("userRoles"),
    revoke: async (): Promise<void> => notReady("userRoles"),
    listAll: async (): Promise<UserRole[]> => notReady("userRoles")
  };
  rolePermissions = {
    findByRoleId: async (): Promise<RolePermission[]> => notReady("rolePermissions"),
    grant: async (): Promise<RolePermission> => notReady("rolePermissions"),
    revoke: async (): Promise<void> => notReady("rolePermissions"),
    listAll: async (): Promise<RolePermission[]> => notReady("rolePermissions")
  };
  userSessions = {
    findById: async (): Promise<UserSession | null> => notReady("userSessions"),
    findByTokenHash: async (): Promise<UserSession | null> => notReady("userSessions"),
    create: async (): Promise<UserSession> => notReady("userSessions"),
    revoke: async (): Promise<void> => notReady("userSessions"),
    revokeAllForUser: async (): Promise<void> => notReady("userSessions")
  };
  passwordHistory = {
    findByUserId: async (): Promise<PasswordHistory[]> => notReady("passwordHistory"),
    add: async (): Promise<PasswordHistory> => notReady("passwordHistory")
  };
  audit = {
    append: async (_input: AuditLogInput): Promise<AuditLog> => notReady("audit"),
    findMany: async (): Promise<PaginatedResult<AuditLog>> => notReady("audit")
  };
  loginHistory = {
    append: async (): Promise<LoginHistory> => notReady("loginHistory"),
    findMany: async (): Promise<PaginatedResult<LoginHistory>> => notReady("loginHistory")
  };
  notifications = {
    findById: async (): Promise<Notification | null> => notReady("notifications"),
    findForUser: async (): Promise<PaginatedResult<Notification>> => notReady("notifications"),
    create: async (): Promise<Notification> => notReady("notifications"),
    markRead: async (): Promise<Notification> => notReady("notifications")
  };
  documents = {
    findById: async (): Promise<DocumentMeta | null> => notReady("documents"),
    findByEntity: async (): Promise<DocumentMeta[]> => notReady("documents"),
    create: async (): Promise<DocumentMeta> => notReady("documents")
  };
  settings = {
    get: async (): Promise<SystemSetting | null> => notReady("settings"),
    set: async (): Promise<SystemSetting> => notReady("settings"),
    list: async (): Promise<SystemSetting[]> => notReady("settings")
  };
  numberSequences = {
    findByKey: async (): Promise<NumberSequence | null> => notReady("numberSequences"),
    next: async () => notReady("numberSequences"),
    upsert: async (): Promise<NumberSequence> => notReady("numberSequences")
  };
  dashboard = {
    listMetrics: async (): Promise<DashboardMetric[]> => notReady("dashboard"),
    listAlerts: async (): Promise<DashboardAlert[]> => notReady("dashboard"),
    getPreferences: async (): Promise<DashboardPreference[]> => notReady("dashboard"),
    upsertPreference: async (): Promise<DashboardPreference> => notReady("dashboard")
  };
  schemaMigrations = {
    list: async (): Promise<SchemaMigration[]> => notReady("schemaMigrations"),
    record: async (): Promise<SchemaMigration> => notReady("schemaMigrations"),
    has: async (): Promise<boolean> => notReady("schemaMigrations")
  };

  async health(): Promise<PersistenceHealth> {
    if (!databaseConfigured()) {
      return {
        provider: this.name,
        status: "Not configured",
        detail: "Set SQL Server variables in .env.local"
      };
    }
    const db = await databaseHealth();
    return {
      provider: this.name,
      status: db.status,
      detail: db.detail
    };
  }

  async diagnostics(): Promise<DataProviderDiagnostics> {
    const health = await this.health();
    return {
      provider: this.name,
      status: health.status,
      spreadsheetConfigured: false,
      requiredSheets: [],
      availableCount: 0,
      totalCount: 0,
      schemaVersion: null,
      lastCheckedAt: new Date().toISOString(),
      detail: health.detail
    };
  }
}
