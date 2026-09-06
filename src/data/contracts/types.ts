export type DataProviderName = "google-sheets" | "sql-server" | "postgresql";

export type PersistenceHealthStatus = "Healthy" | "Degraded" | "Unavailable" | "Not configured";

export interface PersistenceHealth {
  provider: DataProviderName;
  status: PersistenceHealthStatus;
  detail: string;
  spreadsheetIdMasked?: string;
  lastSuccessfulReadAt?: string;
  requiredSheets?: { total: number; available: number };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  branchId?: string | null;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  tradingName?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  currencyCode: string;
  timeZone: string;
  logoPath?: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  branchType?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Warehouse {
  id: string;
  branchId: string;
  code: string;
  name: string;
  warehouseType?: string | null;
  address?: string | null;
  allowSales: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash?: string | null;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Permission {
  id: string;
  permissionKey: string;
  module: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string | null;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionTokenHash: string;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PasswordHistory {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  branchId?: string | null;
  occurredAt: string;
}

export interface LoginHistory {
  id: string;
  userId?: string | null;
  email: string;
  wasSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  occurredAt: string;
}

export interface Notification {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  priority: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface DocumentMeta {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  storageReference: string;
  uploadedBy?: string | null;
  uploadedAt: string;
}

export interface SystemSetting {
  id: string;
  category: string;
  settingKey: string;
  settingValue?: string | null;
  dataType: string;
  description?: string | null;
  isEncrypted: boolean;
  updatedAt?: string | null;
}

export interface NumberSequence {
  id: string;
  sequenceKey: string;
  prefix: string;
  currentValue: number;
  padding: number;
  resetRule: string;
  branchId?: string | null;
  updatedAt?: string | null;
}

export interface DashboardMetric {
  id: string;
  metricKey: string;
  label: string;
  value: string;
  unit?: string | null;
  trend?: string | null;
  visibility: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: string | null;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  module?: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface DashboardPreference {
  id: string;
  userId: string;
  preferenceKey: string;
  preferenceValue: string;
  updatedAt?: string | null;
}

export interface SchemaMigration {
  id: string;
  version: string;
  name: string;
  appliedAt: string;
  checksum?: string | null;
}

export interface DataProviderDiagnostics {
  provider: DataProviderName;
  status: PersistenceHealthStatus;
  spreadsheetConfigured: boolean;
  spreadsheetIdMasked?: string;
  requiredSheets: { name: string; present: boolean }[];
  availableCount: number;
  totalCount: number;
  schemaVersion?: string | null;
  lastCheckedAt: string;
  detail: string;
}
