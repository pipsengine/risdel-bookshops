import type {
  AuditLog,
  AuditLogInput,
  Branch,
  Company,
  DashboardAlert,
  DashboardMetric,
  DashboardPreference,
  DataProviderDiagnostics,
  DocumentMeta,
  ListQuery,
  LoginHistory,
  Notification,
  NumberSequence,
  PaginatedResult,
  PasswordHistory,
  Permission,
  PersistenceHealth,
  Role,
  RolePermission,
  SchemaMigration,
  SystemSetting,
  User,
  UserRole,
  UserSession,
  Warehouse
} from "./types";

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByCode(code: string): Promise<Company | null>;
  findMany(query?: ListQuery): Promise<PaginatedResult<Company>>;
  create(data: Omit<Company, "id" | "createdAt"> & { id?: string }): Promise<Company>;
  update(id: string, data: Partial<Company>): Promise<Company>;
  deactivate(id: string, deletedBy?: string | null): Promise<Company>;
  exists(id: string): Promise<boolean>;
}

export interface BranchRepository {
  findById(id: string): Promise<Branch | null>;
  findByCode(companyId: string, code: string): Promise<Branch | null>;
  findMany(query?: ListQuery & { companyId?: string }): Promise<PaginatedResult<Branch>>;
  create(data: Omit<Branch, "id" | "createdAt"> & { id?: string }): Promise<Branch>;
  update(id: string, data: Partial<Branch>): Promise<Branch>;
  deactivate(id: string, deletedBy?: string | null): Promise<Branch>;
  exists(id: string): Promise<boolean>;
}

export interface WarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByCode(branchId: string, code: string): Promise<Warehouse | null>;
  findMany(query?: ListQuery & { branchId?: string }): Promise<PaginatedResult<Warehouse>>;
  create(data: Omit<Warehouse, "id" | "createdAt"> & { id?: string }): Promise<Warehouse>;
  update(id: string, data: Partial<Warehouse>): Promise<Warehouse>;
  deactivate(id: string, deletedBy?: string | null): Promise<Warehouse>;
  exists(id: string): Promise<boolean>;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(query?: ListQuery): Promise<PaginatedResult<User>>;
  create(data: Omit<User, "id" | "createdAt"> & { id?: string }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  deactivate(id: string, deletedBy?: string | null): Promise<User>;
  exists(id: string): Promise<boolean>;
}

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  findMany(query?: ListQuery): Promise<PaginatedResult<Role>>;
  create(data: Omit<Role, "id" | "createdAt"> & { id?: string }): Promise<Role>;
  update(id: string, data: Partial<Role>): Promise<Role>;
  deactivate(id: string): Promise<Role>;
  exists(id: string): Promise<boolean>;
}

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByKey(permissionKey: string): Promise<Permission | null>;
  findMany(query?: ListQuery): Promise<PaginatedResult<Permission>>;
  create(data: Omit<Permission, "id" | "createdAt"> & { id?: string }): Promise<Permission>;
  exists(id: string): Promise<boolean>;
}

export interface UserRoleRepository {
  findByUserId(userId: string): Promise<UserRole[]>;
  assign(userId: string, roleId: string, assignedBy?: string | null): Promise<UserRole>;
  revoke(userId: string, roleId: string): Promise<void>;
  listAll(): Promise<UserRole[]>;
}

export interface RolePermissionRepository {
  findByRoleId(roleId: string): Promise<RolePermission[]>;
  grant(roleId: string, permissionId: string): Promise<RolePermission>;
  revoke(roleId: string, permissionId: string): Promise<void>;
  listAll(): Promise<RolePermission[]>;
}

export interface UserSessionRepository {
  findById(id: string): Promise<UserSession | null>;
  findByTokenHash(hash: string): Promise<UserSession | null>;
  create(data: Omit<UserSession, "id" | "createdAt"> & { id?: string }): Promise<UserSession>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface PasswordHistoryRepository {
  findByUserId(userId: string): Promise<PasswordHistory[]>;
  add(userId: string, passwordHash: string): Promise<PasswordHistory>;
}

export interface AuditRepository {
  append(input: AuditLogInput): Promise<AuditLog>;
  findMany(query?: ListQuery): Promise<PaginatedResult<AuditLog>>;
}

export interface LoginHistoryRepository {
  append(input: Omit<LoginHistory, "id" | "occurredAt"> & { occurredAt?: string }): Promise<LoginHistory>;
  findMany(query?: ListQuery): Promise<PaginatedResult<LoginHistory>>;
}

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findForUser(userId: string, query?: ListQuery): Promise<PaginatedResult<Notification>>;
  create(data: Omit<Notification, "id" | "createdAt"> & { id?: string }): Promise<Notification>;
  markRead(id: string): Promise<Notification>;
}

export interface DocumentRepository {
  findById(id: string): Promise<DocumentMeta | null>;
  findByEntity(entityType: string, entityId: string): Promise<DocumentMeta[]>;
  create(data: Omit<DocumentMeta, "id" | "uploadedAt"> & { id?: string }): Promise<DocumentMeta>;
}

export interface SettingsRepository {
  get(category: string, key: string): Promise<SystemSetting | null>;
  set(category: string, key: string, value: string, meta?: Partial<SystemSetting>): Promise<SystemSetting>;
  list(category?: string): Promise<SystemSetting[]>;
}

export interface NumberSequenceRepository {
  findByKey(sequenceKey: string): Promise<NumberSequence | null>;
  next(sequenceKey: string): Promise<{ sequence: NumberSequence; formatted: string }>;
  upsert(data: Omit<NumberSequence, "id"> & { id?: string }): Promise<NumberSequence>;
}

export interface DashboardRepository {
  listMetrics(): Promise<DashboardMetric[]>;
  listAlerts(): Promise<DashboardAlert[]>;
  getPreferences(userId: string): Promise<DashboardPreference[]>;
  upsertPreference(userId: string, key: string, value: string): Promise<DashboardPreference>;
}

export interface SchemaMigrationRepository {
  list(): Promise<SchemaMigration[]>;
  record(version: string, name: string, checksum?: string): Promise<SchemaMigration>;
  has(version: string): Promise<boolean>;
}

export interface DataProvider {
  readonly name: import("./types").DataProviderName;
  health(): Promise<PersistenceHealth>;
  diagnostics(): Promise<DataProviderDiagnostics>;
  companies: CompanyRepository;
  branches: BranchRepository;
  warehouses: WarehouseRepository;
  users: UserRepository;
  roles: RoleRepository;
  permissions: PermissionRepository;
  userRoles: UserRoleRepository;
  rolePermissions: RolePermissionRepository;
  userSessions: UserSessionRepository;
  passwordHistory: PasswordHistoryRepository;
  audit: AuditRepository;
  loginHistory: LoginHistoryRepository;
  notifications: NotificationRepository;
  documents: DocumentRepository;
  settings: SettingsRepository;
  numberSequences: NumberSequenceRepository;
  dashboard: DashboardRepository;
  schemaMigrations: SchemaMigrationRepository;
}
