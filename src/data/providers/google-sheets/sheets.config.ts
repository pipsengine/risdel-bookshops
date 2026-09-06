/** Central registry of Google Sheets tab names. Never scatter literals. */
export const SHEETS = {
  schemaMigrations: "System_SchemaMigrations",
  companies: "System_Companies",
  branches: "System_Branches",
  warehouses: "System_Warehouses",
  settings: "System_Settings",
  numberSequences: "System_NumberSequences",
  notifications: "System_Notifications",
  documents: "System_Documents",
  users: "Auth_Users",
  roles: "Auth_Roles",
  permissions: "Auth_Permissions",
  userRoles: "Auth_UserRoles",
  rolePermissions: "Auth_RolePermissions",
  userSessions: "Auth_UserSessions",
  passwordHistory: "Auth_PasswordHistory",
  auditLogs: "Audit_Logs",
  loginHistory: "Audit_LoginHistory",
  dashboardMetrics: "Dashboard_Metrics",
  dashboardAlerts: "Dashboard_Alerts",
  dashboardPreferences: "Dashboard_Preferences"
} as const;

export type SheetKey = keyof typeof SHEETS;
export type SheetName = (typeof SHEETS)[SheetKey];

export const REQUIRED_SHEETS: SheetName[] = Object.values(SHEETS);

export const DATA_SCHEMA_VERSION = "1";

export const SHEET_HEADERS: Record<SheetName, string[]> = {
  [SHEETS.schemaMigrations]: ["Id", "Version", "Name", "AppliedAt", "Checksum"],
  [SHEETS.companies]: [
    "Id", "Code", "Name", "TradingName", "RegistrationNumber", "TaxNumber", "Email", "Phone",
    "AddressLine1", "AddressLine2", "City", "State", "Country", "CurrencyCode", "TimeZone",
    "LogoPath", "IsActive", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "DeletedAt", "DeletedBy"
  ],
  [SHEETS.branches]: [
    "Id", "CompanyId", "Code", "Name", "BranchType", "Email", "Phone", "Address", "City", "State",
    "IsHeadOffice", "IsActive", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "DeletedAt", "DeletedBy"
  ],
  [SHEETS.warehouses]: [
    "Id", "BranchId", "Code", "Name", "WarehouseType", "Address", "AllowSales", "IsDefault",
    "IsActive", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy", "DeletedAt", "DeletedBy"
  ],
  [SHEETS.settings]: [
    "Id", "Category", "SettingKey", "SettingValue", "DataType", "Description", "IsEncrypted", "UpdatedAt"
  ],
  [SHEETS.numberSequences]: [
    "Id", "SequenceKey", "Prefix", "CurrentValue", "Padding", "ResetRule", "BranchId", "UpdatedAt"
  ],
  [SHEETS.notifications]: [
    "Id", "UserId", "Title", "Message", "Type", "Priority", "Link", "IsRead", "CreatedAt", "ReadAt"
  ],
  [SHEETS.documents]: [
    "Id", "EntityType", "EntityId", "FileName", "OriginalFileName", "MimeType", "FileSize",
    "StorageProvider", "StorageReference", "UploadedBy", "UploadedAt"
  ],
  [SHEETS.users]: [
    "Id", "Email", "DisplayName", "PasswordHash", "MustChangePassword", "FailedLoginCount",
    "LockedUntil", "LastLoginAt", "IsActive", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy",
    "DeletedAt", "DeletedBy"
  ],
  [SHEETS.roles]: [
    "Id", "Code", "Name", "Description", "IsSystem", "IsActive", "CreatedAt", "UpdatedAt"
  ],
  [SHEETS.permissions]: [
    "Id", "PermissionKey", "Module", "Name", "Description", "CreatedAt"
  ],
  [SHEETS.userRoles]: ["Id", "UserId", "RoleId", "AssignedAt", "AssignedBy"],
  [SHEETS.rolePermissions]: ["Id", "RoleId", "PermissionId", "GrantedAt"],
  [SHEETS.userSessions]: [
    "Id", "UserId", "SessionTokenHash", "ExpiresAt", "RevokedAt", "CreatedAt", "IpAddress", "UserAgent"
  ],
  [SHEETS.passwordHistory]: ["Id", "UserId", "PasswordHash", "CreatedAt"],
  [SHEETS.auditLogs]: [
    "Id", "UserId", "Action", "Module", "EntityType", "EntityId", "Description", "OldValues",
    "NewValues", "IpAddress", "UserAgent", "BranchId", "OccurredAt"
  ],
  [SHEETS.loginHistory]: [
    "Id", "UserId", "Email", "WasSuccessful", "FailureReason", "IpAddress", "UserAgent", "OccurredAt"
  ],
  [SHEETS.dashboardMetrics]: [
    "Id", "MetricKey", "Label", "Value", "Unit", "Trend", "Visibility", "SortOrder", "IsActive", "UpdatedAt"
  ],
  [SHEETS.dashboardAlerts]: [
    "Id", "Title", "Message", "Severity", "Module", "IsActive", "CreatedAt", "ExpiresAt"
  ],
  [SHEETS.dashboardPreferences]: [
    "Id", "UserId", "PreferenceKey", "PreferenceValue", "UpdatedAt"
  ]
};
