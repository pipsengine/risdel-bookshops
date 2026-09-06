import { randomUUID } from "crypto";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type {
  AuditLog,
  AuditLogInput,
  Branch,
  Company,
  DashboardAlert,
  DashboardMetric,
  DashboardPreference,
  DocumentMeta,
  ListQuery,
  LoginHistory,
  Notification,
  NumberSequence,
  PaginatedResult,
  PasswordHistory,
  Permission,
  Role,
  RolePermission,
  SchemaMigration,
  SystemSetting,
  User,
  UserRole,
  UserSession,
  Warehouse
} from "@/data/contracts/types";
import type {
  AuditRepository,
  BranchRepository,
  CompanyRepository,
  DashboardRepository,
  DocumentRepository,
  LoginHistoryRepository,
  NotificationRepository,
  NumberSequenceRepository,
  PasswordHistoryRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
  SchemaMigrationRepository,
  SettingsRepository,
  UserRepository,
  UserRoleRepository,
  UserSessionRepository,
  WarehouseRepository
} from "@/data/contracts/repositories";
import { SHEETS } from "../sheets.config";
import {
  normalizeEmail,
  nowIso,
  parseBoolean,
  parseInteger,
  parseNullableString,
  parseString,
  serializeJson
} from "../sheets.mapper";
import { sheetsLock } from "../sheets.lock";
import { getGoogleSheetsClient } from "../google-sheets.client";
import { SheetEntityRepository, isActiveFlag, paginate, sortByField } from "./base";

function companyFrom(r: Record<string, string>): Company | null {
  if (!r.Id) return null;
  return {
    id: r.Id,
    code: parseString(r.Code),
    name: parseString(r.Name),
    tradingName: parseNullableString(r.TradingName),
    registrationNumber: parseNullableString(r.RegistrationNumber),
    taxNumber: parseNullableString(r.TaxNumber),
    email: parseNullableString(r.Email),
    phone: parseNullableString(r.Phone),
    addressLine1: parseNullableString(r.AddressLine1),
    addressLine2: parseNullableString(r.AddressLine2),
    city: parseNullableString(r.City),
    state: parseNullableString(r.State),
    country: parseString(r.Country, "Nigeria"),
    currencyCode: parseString(r.CurrencyCode, "NGN"),
    timeZone: parseString(r.TimeZone, "Africa/Lagos"),
    logoPath: parseNullableString(r.LogoPath),
    isActive: isActiveFlag(r),
    createdAt: parseString(r.CreatedAt, nowIso()),
    createdBy: parseNullableString(r.CreatedBy),
    updatedAt: parseNullableString(r.UpdatedAt),
    updatedBy: parseNullableString(r.UpdatedBy),
    deletedAt: parseNullableString(r.DeletedAt),
    deletedBy: parseNullableString(r.DeletedBy)
  };
}

export class SheetsCompanyRepository
  extends SheetEntityRepository<Company>
  implements CompanyRepository
{
  constructor() {
    super(SHEETS.companies);
  }
  protected fromRecord(record: Record<string, string>) {
    return companyFrom(record);
  }
  protected toRecord(entity: Company) {
    return {
      Id: entity.id,
      Code: entity.code,
      Name: entity.name,
      TradingName: entity.tradingName ?? "",
      RegistrationNumber: entity.registrationNumber ?? "",
      TaxNumber: entity.taxNumber ?? "",
      Email: entity.email ?? "",
      Phone: entity.phone ?? "",
      AddressLine1: entity.addressLine1 ?? "",
      AddressLine2: entity.addressLine2 ?? "",
      City: entity.city ?? "",
      State: entity.state ?? "",
      Country: entity.country,
      CurrencyCode: entity.currencyCode,
      TimeZone: entity.timeZone,
      LogoPath: entity.logoPath ?? "",
      IsActive: entity.isActive,
      CreatedAt: entity.createdAt,
      CreatedBy: entity.createdBy ?? "",
      UpdatedAt: entity.updatedAt ?? "",
      UpdatedBy: entity.updatedBy ?? "",
      DeletedAt: entity.deletedAt ?? "",
      DeletedBy: entity.deletedBy ?? ""
    };
  }
  async findByCode(code: string) {
    const all = await this.findAll();
    return all.find((c) => c.code.toLowerCase() === code.toLowerCase()) ?? null;
  }
  async findMany(query?: ListQuery) {
    let items = this.filterActive(await this.findAll(), query?.activeOnly);
    items = this.searchFilter(items, query?.search, ["code", "name"]);
    items = sortByField(items, query?.sortBy || "name", query?.sortDir);
    return paginate(items, query);
  }
  async create(data: Omit<Company, "id" | "createdAt"> & { id?: string }) {
    const all = await this.findAll();
    this.assertUnique(all, (c) => c.code.toLowerCase() === data.code.toLowerCase(), "Company code already exists.");
    const entity: Company = {
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso(),
      isActive: data.isActive ?? true,
      country: data.country || "Nigeria",
      currencyCode: data.currencyCode || "NGN",
      timeZone: data.timeZone || "Africa/Lagos"
    };
    return this.appendEntity(entity);
  }
  async update(id: string, data: Partial<Company>) {
    if (data.code) {
      const all = await this.findAll();
      this.assertUnique(
        all,
        (c) => c.id !== id && c.code.toLowerCase() === data.code!.toLowerCase(),
        "Company code already exists."
      );
    }
    return this.updateEntity(id, data, data.updatedAt);
  }
  async deactivate(id: string, deletedBy?: string | null) {
    return this.updateEntity(id, {
      isActive: false,
      deletedAt: nowIso(),
      deletedBy: deletedBy ?? null
    });
  }
}

function branchFrom(r: Record<string, string>): Branch | null {
  if (!r.Id) return null;
  return {
    id: r.Id,
    companyId: parseString(r.CompanyId),
    code: parseString(r.Code),
    name: parseString(r.Name),
    branchType: parseNullableString(r.BranchType),
    email: parseNullableString(r.Email),
    phone: parseNullableString(r.Phone),
    address: parseNullableString(r.Address),
    city: parseNullableString(r.City),
    state: parseNullableString(r.State),
    isHeadOffice: parseBoolean(r.IsHeadOffice),
    isActive: isActiveFlag(r),
    createdAt: parseString(r.CreatedAt, nowIso()),
    createdBy: parseNullableString(r.CreatedBy),
    updatedAt: parseNullableString(r.UpdatedAt),
    updatedBy: parseNullableString(r.UpdatedBy),
    deletedAt: parseNullableString(r.DeletedAt),
    deletedBy: parseNullableString(r.DeletedBy)
  };
}

export class SheetsBranchRepository
  extends SheetEntityRepository<Branch>
  implements BranchRepository
{
  constructor() {
    super(SHEETS.branches);
  }
  protected fromRecord(r: Record<string, string>) {
    return branchFrom(r);
  }
  protected toRecord(e: Branch) {
    return {
      Id: e.id,
      CompanyId: e.companyId,
      Code: e.code,
      Name: e.name,
      BranchType: e.branchType ?? "",
      Email: e.email ?? "",
      Phone: e.phone ?? "",
      Address: e.address ?? "",
      City: e.city ?? "",
      State: e.state ?? "",
      IsHeadOffice: e.isHeadOffice,
      IsActive: e.isActive,
      CreatedAt: e.createdAt,
      CreatedBy: e.createdBy ?? "",
      UpdatedAt: e.updatedAt ?? "",
      UpdatedBy: e.updatedBy ?? "",
      DeletedAt: e.deletedAt ?? "",
      DeletedBy: e.deletedBy ?? ""
    };
  }
  async findByCode(companyId: string, code: string) {
    const all = await this.findAll();
    return (
      all.find(
        (b) => b.companyId === companyId && b.code.toLowerCase() === code.toLowerCase()
      ) ?? null
    );
  }
  async findMany(query?: ListQuery & { companyId?: string }) {
    let items = this.filterActive(await this.findAll(), query?.activeOnly);
    if (query?.companyId) items = items.filter((b) => b.companyId === query.companyId);
    items = this.searchFilter(items, query?.search, ["code", "name"]);
    items = sortByField(items, query?.sortBy || "name", query?.sortDir);
    return paginate(items, query);
  }
  async create(data: Omit<Branch, "id" | "createdAt"> & { id?: string }) {
    const companies = new SheetsCompanyRepository();
    if (!(await companies.exists(data.companyId))) {
      throw new NotFoundError("Company not found for branch.");
    }
    const all = await this.findAll();
    this.assertUnique(
      all,
      (b) =>
        b.companyId === data.companyId && b.code.toLowerCase() === data.code.toLowerCase(),
      "Branch code already exists for this company."
    );
    if (data.isHeadOffice) {
      const existingHO = all.find((b) => b.companyId === data.companyId && b.isHeadOffice && b.isActive);
      if (existingHO) throw new ConflictError("Only one head office is allowed per company.");
    }
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso(),
      isActive: data.isActive ?? true,
      isHeadOffice: data.isHeadOffice ?? false
    });
  }
  async update(id: string, data: Partial<Branch>) {
    const current = await this.findById(id);
    if (!current) throw new NotFoundError("Branch not found.");
    if (data.code) {
      const all = await this.findAll();
      this.assertUnique(
        all,
        (b) =>
          b.id !== id &&
          b.companyId === current.companyId &&
          b.code.toLowerCase() === data.code!.toLowerCase(),
        "Branch code already exists for this company."
      );
    }
    return this.updateEntity(id, data, data.updatedAt);
  }
  async deactivate(id: string, deletedBy?: string | null) {
    return this.updateEntity(id, {
      isActive: false,
      deletedAt: nowIso(),
      deletedBy: deletedBy ?? null
    });
  }
}

function warehouseFrom(r: Record<string, string>): Warehouse | null {
  if (!r.Id) return null;
  return {
    id: r.Id,
    branchId: parseString(r.BranchId),
    code: parseString(r.Code),
    name: parseString(r.Name),
    warehouseType: parseNullableString(r.WarehouseType),
    address: parseNullableString(r.Address),
    allowSales: parseBoolean(r.AllowSales, true),
    isDefault: parseBoolean(r.IsDefault),
    isActive: isActiveFlag(r),
    createdAt: parseString(r.CreatedAt, nowIso()),
    createdBy: parseNullableString(r.CreatedBy),
    updatedAt: parseNullableString(r.UpdatedAt),
    updatedBy: parseNullableString(r.UpdatedBy),
    deletedAt: parseNullableString(r.DeletedAt),
    deletedBy: parseNullableString(r.DeletedBy)
  };
}

export class SheetsWarehouseRepository
  extends SheetEntityRepository<Warehouse>
  implements WarehouseRepository
{
  constructor() {
    super(SHEETS.warehouses);
  }
  protected fromRecord(r: Record<string, string>) {
    return warehouseFrom(r);
  }
  protected toRecord(e: Warehouse) {
    return {
      Id: e.id,
      BranchId: e.branchId,
      Code: e.code,
      Name: e.name,
      WarehouseType: e.warehouseType ?? "",
      Address: e.address ?? "",
      AllowSales: e.allowSales,
      IsDefault: e.isDefault,
      IsActive: e.isActive,
      CreatedAt: e.createdAt,
      CreatedBy: e.createdBy ?? "",
      UpdatedAt: e.updatedAt ?? "",
      UpdatedBy: e.updatedBy ?? "",
      DeletedAt: e.deletedAt ?? "",
      DeletedBy: e.deletedBy ?? ""
    };
  }
  async findByCode(branchId: string, code: string) {
    const all = await this.findAll();
    return (
      all.find(
        (w) => w.branchId === branchId && w.code.toLowerCase() === code.toLowerCase()
      ) ?? null
    );
  }
  async findMany(query?: ListQuery & { branchId?: string }) {
    let items = this.filterActive(await this.findAll(), query?.activeOnly);
    if (query?.branchId) items = items.filter((w) => w.branchId === query.branchId);
    items = this.searchFilter(items, query?.search, ["code", "name"]);
    items = sortByField(items, query?.sortBy || "name", query?.sortDir);
    return paginate(items, query);
  }
  async create(data: Omit<Warehouse, "id" | "createdAt"> & { id?: string }) {
    const branches = new SheetsBranchRepository();
    if (!(await branches.exists(data.branchId))) {
      throw new NotFoundError("Branch not found for warehouse.");
    }
    const all = await this.findAll();
    this.assertUnique(
      all,
      (w) =>
        w.branchId === data.branchId && w.code.toLowerCase() === data.code.toLowerCase(),
      "Warehouse code already exists for this branch."
    );
    if (data.isDefault) {
      const existing = all.find((w) => w.branchId === data.branchId && w.isDefault && w.isActive);
      if (existing) throw new ConflictError("Only one default warehouse is allowed per branch.");
    }
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso(),
      isActive: data.isActive ?? true,
      allowSales: data.allowSales ?? true,
      isDefault: data.isDefault ?? false
    });
  }
  async update(id: string, data: Partial<Warehouse>) {
    const current = await this.findById(id);
    if (!current) throw new NotFoundError("Warehouse not found.");
    if (data.code) {
      const all = await this.findAll();
      this.assertUnique(
        all,
        (w) =>
          w.id !== id &&
          w.branchId === current.branchId &&
          w.code.toLowerCase() === data.code!.toLowerCase(),
        "Warehouse code already exists for this branch."
      );
    }
    return this.updateEntity(id, data, data.updatedAt);
  }
  async deactivate(id: string, deletedBy?: string | null) {
    return this.updateEntity(id, {
      isActive: false,
      deletedAt: nowIso(),
      deletedBy: deletedBy ?? null
    });
  }
}

function userFrom(r: Record<string, string>): User | null {
  if (!r.Id) return null;
  return {
    id: r.Id,
    email: normalizeEmail(parseString(r.Email)),
    displayName: parseString(r.DisplayName),
    passwordHash: parseNullableString(r.PasswordHash),
    mustChangePassword: parseBoolean(r.MustChangePassword, true),
    failedLoginCount: parseInteger(r.FailedLoginCount),
    lockedUntil: parseNullableString(r.LockedUntil),
    lastLoginAt: parseNullableString(r.LastLoginAt),
    isActive: isActiveFlag(r),
    createdAt: parseString(r.CreatedAt, nowIso()),
    createdBy: parseNullableString(r.CreatedBy),
    updatedAt: parseNullableString(r.UpdatedAt),
    updatedBy: parseNullableString(r.UpdatedBy),
    deletedAt: parseNullableString(r.DeletedAt),
    deletedBy: parseNullableString(r.DeletedBy)
  };
}

export class SheetsUserRepository
  extends SheetEntityRepository<User>
  implements UserRepository
{
  constructor() {
    super(SHEETS.users);
  }
  protected fromRecord(r: Record<string, string>) {
    return userFrom(r);
  }
  protected toRecord(e: User) {
    return {
      Id: e.id,
      Email: e.email,
      DisplayName: e.displayName,
      PasswordHash: e.passwordHash ?? "",
      MustChangePassword: e.mustChangePassword,
      FailedLoginCount: e.failedLoginCount,
      LockedUntil: e.lockedUntil ?? "",
      LastLoginAt: e.lastLoginAt ?? "",
      IsActive: e.isActive,
      CreatedAt: e.createdAt,
      CreatedBy: e.createdBy ?? "",
      UpdatedAt: e.updatedAt ?? "",
      UpdatedBy: e.updatedBy ?? "",
      DeletedAt: e.deletedAt ?? "",
      DeletedBy: e.deletedBy ?? ""
    };
  }
  async findByEmail(email: string) {
    const all = await this.findAll();
    const target = normalizeEmail(email);
    return all.find((u) => u.email === target) ?? null;
  }
  async findMany(query?: ListQuery) {
    let items = this.filterActive(await this.findAll(), query?.activeOnly);
    items = this.searchFilter(items, query?.search, ["email", "displayName"]);
    items = sortByField(items, query?.sortBy || "email", query?.sortDir);
    return paginate(items, query);
  }
  async create(data: Omit<User, "id" | "createdAt"> & { id?: string }) {
    const all = await this.findAll();
    this.assertUnique(
      all,
      (u) => u.email === normalizeEmail(data.email),
      "User email already exists."
    );
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      email: normalizeEmail(data.email),
      createdAt: nowIso(),
      isActive: data.isActive ?? true,
      mustChangePassword: data.mustChangePassword ?? true,
      failedLoginCount: data.failedLoginCount ?? 0
    });
  }
  async update(id: string, data: Partial<User>) {
    if (data.email) {
      const all = await this.findAll();
      const email = normalizeEmail(data.email);
      this.assertUnique(all, (u) => u.id !== id && u.email === email, "User email already exists.");
      data = { ...data, email };
    }
    return this.updateEntity(id, data, data.updatedAt);
  }
  async deactivate(id: string, deletedBy?: string | null) {
    return this.updateEntity(id, {
      isActive: false,
      deletedAt: nowIso(),
      deletedBy: deletedBy ?? null
    });
  }
}

export class SheetsRoleRepository
  extends SheetEntityRepository<Role>
  implements RoleRepository
{
  constructor() {
    super(SHEETS.roles);
  }
  protected fromRecord(r: Record<string, string>): Role | null {
    if (!r.Id) return null;
    return {
      id: r.Id,
      code: parseString(r.Code),
      name: parseString(r.Name),
      description: parseNullableString(r.Description),
      isSystem: parseBoolean(r.IsSystem),
      isActive: parseBoolean(r.IsActive, true),
      createdAt: parseString(r.CreatedAt, nowIso()),
      updatedAt: parseNullableString(r.UpdatedAt)
    };
  }
  protected toRecord(e: Role) {
    return {
      Id: e.id,
      Code: e.code,
      Name: e.name,
      Description: e.description ?? "",
      IsSystem: e.isSystem,
      IsActive: e.isActive,
      CreatedAt: e.createdAt,
      UpdatedAt: e.updatedAt ?? ""
    };
  }
  async findByCode(code: string) {
    return (await this.findAll()).find((r) => r.code === code) ?? null;
  }
  async findMany(query?: ListQuery) {
    let items = this.filterActive(await this.findAll(), query?.activeOnly);
    items = this.searchFilter(items, query?.search, ["code", "name"]);
    return paginate(sortByField(items, query?.sortBy || "name", query?.sortDir), query);
  }
  async create(data: Omit<Role, "id" | "createdAt"> & { id?: string }) {
    const all = await this.findAll();
    this.assertUnique(all, (r) => r.code === data.code, "Role code already exists.");
    this.assertUnique(all, (r) => r.name.toLowerCase() === data.name.toLowerCase(), "Role name already exists.");
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso(),
      isActive: data.isActive ?? true,
      isSystem: data.isSystem ?? false
    });
  }
  async update(id: string, data: Partial<Role>) {
    return this.updateEntity(id, data);
  }
  async deactivate(id: string) {
    return this.updateEntity(id, { isActive: false, updatedAt: nowIso() });
  }
}

export class SheetsPermissionRepository
  extends SheetEntityRepository<Permission>
  implements PermissionRepository
{
  constructor() {
    super(SHEETS.permissions);
  }
  protected fromRecord(r: Record<string, string>): Permission | null {
    if (!r.Id) return null;
    return {
      id: r.Id,
      permissionKey: parseString(r.PermissionKey),
      module: parseString(r.Module),
      name: parseString(r.Name),
      description: parseNullableString(r.Description),
      createdAt: parseString(r.CreatedAt, nowIso())
    };
  }
  protected toRecord(e: Permission) {
    return {
      Id: e.id,
      PermissionKey: e.permissionKey,
      Module: e.module,
      Name: e.name,
      Description: e.description ?? "",
      CreatedAt: e.createdAt
    };
  }
  async findByKey(permissionKey: string) {
    return (await this.findAll()).find((p) => p.permissionKey === permissionKey) ?? null;
  }
  async findMany(query?: ListQuery) {
    let items = await this.findAll();
    items = this.searchFilter(items, query?.search, ["permissionKey", "name", "module"]);
    return paginate(sortByField(items, query?.sortBy || "permissionKey", query?.sortDir), query);
  }
  async create(data: Omit<Permission, "id" | "createdAt"> & { id?: string }) {
    const all = await this.findAll();
    this.assertUnique(all, (p) => p.permissionKey === data.permissionKey, "Permission key already exists.");
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso()
    });
  }
}

export class SheetsUserRoleRepository implements UserRoleRepository {
  private client = getGoogleSheetsClient();
  private async rows() {
    return (await this.client.getSheetRows(SHEETS.userRoles)).rows;
  }
  async listAll(): Promise<UserRole[]> {
    return (await this.rows())
      .map((r) => ({
        id: r.record.Id || randomUUID(),
        userId: r.record.UserId,
        roleId: r.record.RoleId,
        assignedAt: r.record.AssignedAt || nowIso(),
        assignedBy: parseNullableString(r.record.AssignedBy)
      }))
      .filter((x) => x.userId && x.roleId);
  }
  async findByUserId(userId: string) {
    return (await this.listAll()).filter((x) => x.userId === userId);
  }
  async assign(userId: string, roleId: string, assignedBy?: string | null) {
    const existing = await this.findByUserId(userId);
    if (existing.some((x) => x.roleId === roleId)) {
      return existing.find((x) => x.roleId === roleId)!;
    }
    const entity: UserRole = {
      id: randomUUID(),
      userId,
      roleId,
      assignedAt: nowIso(),
      assignedBy: assignedBy ?? null
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.userRoles,
      recordToRow(SHEET_HEADERS[SHEETS.userRoles], {
        Id: entity.id,
        UserId: entity.userId,
        RoleId: entity.roleId,
        AssignedAt: entity.assignedAt,
        AssignedBy: entity.assignedBy ?? ""
      })
    );
    return entity;
  }
  async revoke(userId: string, roleId: string) {
    const { rows } = await this.client.getSheetRows(SHEETS.userRoles, true);
    const match = rows.find((r) => r.record.UserId === userId && r.record.RoleId === roleId);
    if (!match) return;
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.updateRow(
      SHEETS.userRoles,
      match.rowNumber,
      recordToRow(SHEET_HEADERS[SHEETS.userRoles], {
        Id: "",
        UserId: "",
        RoleId: "",
        AssignedAt: "",
        AssignedBy: ""
      })
    );
  }
}

export class SheetsRolePermissionRepository implements RolePermissionRepository {
  private client = getGoogleSheetsClient();
  async listAll(): Promise<RolePermission[]> {
    const { rows } = await this.client.getSheetRows(SHEETS.rolePermissions);
    return rows
      .map((r) => ({
        id: r.record.Id || randomUUID(),
        roleId: r.record.RoleId,
        permissionId: r.record.PermissionId,
        grantedAt: r.record.GrantedAt || nowIso()
      }))
      .filter((x) => x.roleId && x.permissionId);
  }
  async findByRoleId(roleId: string) {
    return (await this.listAll()).filter((x) => x.roleId === roleId);
  }
  async grant(roleId: string, permissionId: string) {
    const existing = await this.findByRoleId(roleId);
    if (existing.some((x) => x.permissionId === permissionId)) {
      return existing.find((x) => x.permissionId === permissionId)!;
    }
    const entity: RolePermission = {
      id: randomUUID(),
      roleId,
      permissionId,
      grantedAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.rolePermissions,
      recordToRow(SHEET_HEADERS[SHEETS.rolePermissions], {
        Id: entity.id,
        RoleId: entity.roleId,
        PermissionId: entity.permissionId,
        GrantedAt: entity.grantedAt
      })
    );
    return entity;
  }
  async revoke(roleId: string, permissionId: string) {
    const { rows } = await this.client.getSheetRows(SHEETS.rolePermissions, true);
    const match = rows.find(
      (r) => r.record.RoleId === roleId && r.record.PermissionId === permissionId
    );
    if (!match) return;
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.updateRow(
      SHEETS.rolePermissions,
      match.rowNumber,
      recordToRow(SHEET_HEADERS[SHEETS.rolePermissions], {
        Id: "",
        RoleId: "",
        PermissionId: "",
        GrantedAt: ""
      })
    );
  }
}

export class SheetsUserSessionRepository
  extends SheetEntityRepository<UserSession>
  implements UserSessionRepository
{
  constructor() {
    super(SHEETS.userSessions);
  }
  protected fromRecord(r: Record<string, string>): UserSession | null {
    if (!r.Id) return null;
    return {
      id: r.Id,
      userId: parseString(r.UserId),
      sessionTokenHash: parseString(r.SessionTokenHash),
      expiresAt: parseString(r.ExpiresAt),
      revokedAt: parseNullableString(r.RevokedAt),
      createdAt: parseString(r.CreatedAt, nowIso()),
      ipAddress: parseNullableString(r.IpAddress),
      userAgent: parseNullableString(r.UserAgent)
    };
  }
  protected toRecord(e: UserSession) {
    return {
      Id: e.id,
      UserId: e.userId,
      SessionTokenHash: e.sessionTokenHash,
      ExpiresAt: e.expiresAt,
      RevokedAt: e.revokedAt ?? "",
      CreatedAt: e.createdAt,
      IpAddress: e.ipAddress ?? "",
      UserAgent: e.userAgent ?? ""
    };
  }
  async findByTokenHash(hash: string) {
    return (await this.findAll()).find((s) => s.sessionTokenHash === hash && !s.revokedAt) ?? null;
  }
  async create(data: Omit<UserSession, "id" | "createdAt"> & { id?: string }) {
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso()
    });
  }
  async revoke(id: string) {
    await this.updateEntity(id, { revokedAt: nowIso() });
  }
  async revokeAllForUser(userId: string) {
    const sessions = (await this.findAll()).filter((s) => s.userId === userId && !s.revokedAt);
    for (const s of sessions) await this.revoke(s.id);
  }
}

export class SheetsPasswordHistoryRepository implements PasswordHistoryRepository {
  private client = getGoogleSheetsClient();
  async findByUserId(userId: string): Promise<PasswordHistory[]> {
    const { rows } = await this.client.getSheetRows(SHEETS.passwordHistory);
    return rows
      .filter((r) => r.record.UserId === userId)
      .map((r) => ({
        id: r.record.Id,
        userId: r.record.UserId,
        passwordHash: r.record.PasswordHash,
        createdAt: r.record.CreatedAt || nowIso()
      }));
  }
  async add(userId: string, passwordHash: string) {
    const entity: PasswordHistory = {
      id: randomUUID(),
      userId,
      passwordHash,
      createdAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.passwordHistory,
      recordToRow(SHEET_HEADERS[SHEETS.passwordHistory], {
        Id: entity.id,
        UserId: entity.userId,
        PasswordHash: entity.passwordHash,
        CreatedAt: entity.createdAt
      })
    );
    return entity;
  }
}

export class SheetsAuditRepository implements AuditRepository {
  private client = getGoogleSheetsClient();
  async append(input: AuditLogInput): Promise<AuditLog> {
    const entity: AuditLog = {
      id: randomUUID(),
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      description: input.description ?? null,
      oldValues: serializeJson(input.oldValues),
      newValues: serializeJson(input.newValues),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      branchId: input.branchId ?? null,
      occurredAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.auditLogs,
      recordToRow(SHEET_HEADERS[SHEETS.auditLogs], {
        Id: entity.id,
        UserId: entity.userId ?? "",
        Action: entity.action,
        Module: entity.module,
        EntityType: entity.entityType ?? "",
        EntityId: entity.entityId ?? "",
        Description: entity.description ?? "",
        OldValues: entity.oldValues ?? "",
        NewValues: entity.newValues ?? "",
        IpAddress: entity.ipAddress ?? "",
        UserAgent: entity.userAgent ?? "",
        BranchId: entity.branchId ?? "",
        OccurredAt: entity.occurredAt
      })
    );
    return entity;
  }
  async findMany(query?: ListQuery): Promise<PaginatedResult<AuditLog>> {
    const { rows } = await this.client.getSheetRows(SHEETS.auditLogs);
    let items: AuditLog[] = rows.map((r) => ({
      id: r.record.Id,
      userId: parseNullableString(r.record.UserId),
      action: r.record.Action,
      module: r.record.Module,
      entityType: parseNullableString(r.record.EntityType),
      entityId: parseNullableString(r.record.EntityId),
      description: parseNullableString(r.record.Description),
      oldValues: parseNullableString(r.record.OldValues),
      newValues: parseNullableString(r.record.NewValues),
      ipAddress: parseNullableString(r.record.IpAddress),
      userAgent: parseNullableString(r.record.UserAgent),
      branchId: parseNullableString(r.record.BranchId),
      occurredAt: r.record.OccurredAt || nowIso()
    }));
    items = sortByField(items, "occurredAt", "desc");
    return paginate(items, query);
  }
}

export class SheetsLoginHistoryRepository implements LoginHistoryRepository {
  private client = getGoogleSheetsClient();
  async append(
    input: Omit<LoginHistory, "id" | "occurredAt"> & { occurredAt?: string }
  ): Promise<LoginHistory> {
    const entity: LoginHistory = {
      id: randomUUID(),
      userId: input.userId ?? null,
      email: normalizeEmail(input.email),
      wasSuccessful: input.wasSuccessful,
      failureReason: input.failureReason ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      occurredAt: input.occurredAt || nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.loginHistory,
      recordToRow(SHEET_HEADERS[SHEETS.loginHistory], {
        Id: entity.id,
        UserId: entity.userId ?? "",
        Email: entity.email,
        WasSuccessful: entity.wasSuccessful,
        FailureReason: entity.failureReason ?? "",
        IpAddress: entity.ipAddress ?? "",
        UserAgent: entity.userAgent ?? "",
        OccurredAt: entity.occurredAt
      })
    );
    return entity;
  }
  async findMany(query?: ListQuery) {
    const { rows } = await this.client.getSheetRows(SHEETS.loginHistory);
    const items = rows.map((r) => ({
      id: r.record.Id,
      userId: parseNullableString(r.record.UserId),
      email: r.record.Email,
      wasSuccessful: parseBoolean(r.record.WasSuccessful),
      failureReason: parseNullableString(r.record.FailureReason),
      ipAddress: parseNullableString(r.record.IpAddress),
      userAgent: parseNullableString(r.record.UserAgent),
      occurredAt: r.record.OccurredAt || nowIso()
    }));
    return paginate(sortByField(items, "occurredAt", "desc"), query);
  }
}

export class SheetsNotificationRepository
  extends SheetEntityRepository<Notification>
  implements NotificationRepository
{
  constructor() {
    super(SHEETS.notifications);
  }
  protected fromRecord(r: Record<string, string>): Notification | null {
    if (!r.Id) return null;
    return {
      id: r.Id,
      userId: parseNullableString(r.UserId),
      title: parseString(r.Title),
      message: parseString(r.Message),
      type: parseString(r.Type, "INFO"),
      priority: parseString(r.Priority, "NORMAL"),
      link: parseNullableString(r.Link),
      isRead: parseBoolean(r.IsRead),
      createdAt: parseString(r.CreatedAt, nowIso()),
      readAt: parseNullableString(r.ReadAt)
    };
  }
  protected toRecord(e: Notification) {
    return {
      Id: e.id,
      UserId: e.userId ?? "",
      Title: e.title,
      Message: e.message,
      Type: e.type,
      Priority: e.priority,
      Link: e.link ?? "",
      IsRead: e.isRead,
      CreatedAt: e.createdAt,
      ReadAt: e.readAt ?? ""
    };
  }
  async findForUser(userId: string, query?: ListQuery) {
    let items = (await this.findAll()).filter((n) => n.userId === userId);
    items = sortByField(items, "createdAt", "desc");
    return paginate(items, query);
  }
  async create(data: Omit<Notification, "id" | "createdAt"> & { id?: string }) {
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      createdAt: nowIso(),
      isRead: data.isRead ?? false,
      type: data.type || "INFO",
      priority: data.priority || "NORMAL"
    });
  }
  async markRead(id: string) {
    return this.updateEntity(id, { isRead: true, readAt: nowIso() });
  }
}

export class SheetsDocumentRepository
  extends SheetEntityRepository<DocumentMeta>
  implements DocumentRepository
{
  constructor() {
    super(SHEETS.documents);
  }
  protected fromRecord(r: Record<string, string>): DocumentMeta | null {
    if (!r.Id) return null;
    return {
      id: r.Id,
      entityType: parseString(r.EntityType),
      entityId: parseString(r.EntityId),
      fileName: parseString(r.FileName),
      originalFileName: parseString(r.OriginalFileName),
      mimeType: parseString(r.MimeType),
      fileSize: parseInteger(r.FileSize),
      storageProvider: parseString(r.StorageProvider, "local"),
      storageReference: parseString(r.StorageReference || r.StoragePath),
      uploadedBy: parseNullableString(r.UploadedBy),
      uploadedAt: parseString(r.UploadedAt, nowIso())
    };
  }
  protected toRecord(e: DocumentMeta) {
    return {
      Id: e.id,
      EntityType: e.entityType,
      EntityId: e.entityId,
      FileName: e.fileName,
      OriginalFileName: e.originalFileName,
      MimeType: e.mimeType,
      FileSize: e.fileSize,
      StorageProvider: e.storageProvider,
      StorageReference: e.storageReference,
      UploadedBy: e.uploadedBy ?? "",
      UploadedAt: e.uploadedAt
    };
  }
  async findByEntity(entityType: string, entityId: string) {
    return (await this.findAll()).filter(
      (d) => d.entityType === entityType && d.entityId === entityId
    );
  }
  async create(data: Omit<DocumentMeta, "id" | "uploadedAt"> & { id?: string }) {
    return this.appendEntity({
      ...data,
      id: this.newId(data.id),
      uploadedAt: nowIso(),
      storageProvider: data.storageProvider || "local"
    });
  }
}

export class SheetsSettingsRepository implements SettingsRepository {
  private client = getGoogleSheetsClient();
  async list(category?: string): Promise<SystemSetting[]> {
    const cacheKey = `settings:${category || "all"}`;
    const cached = this.client.cache.get<SystemSetting[]>(cacheKey);
    if (cached) return cached;
    const { rows } = await this.client.getSheetRows(SHEETS.settings);
    let items = rows.map((r) => ({
      id: r.record.Id,
      category: r.record.Category,
      settingKey: r.record.SettingKey,
      settingValue: parseNullableString(r.record.SettingValue),
      dataType: r.record.DataType || "string",
      description: parseNullableString(r.record.Description),
      isEncrypted: parseBoolean(r.record.IsEncrypted),
      updatedAt: parseNullableString(r.record.UpdatedAt)
    }));
    if (category) items = items.filter((s) => s.category === category);
    this.client.cache.set(cacheKey, items);
    return items;
  }
  async get(category: string, key: string) {
    return (await this.list(category)).find((s) => s.settingKey === key) ?? null;
  }
  async set(category: string, key: string, value: string, meta?: Partial<SystemSetting>) {
    const { rows } = await this.client.getSheetRows(SHEETS.settings, true);
    const match = rows.find((r) => r.record.Category === category && r.record.SettingKey === key);
    const entity: SystemSetting = {
      id: match?.record.Id || randomUUID(),
      category,
      settingKey: key,
      settingValue: value,
      dataType: meta?.dataType || "string",
      description: meta?.description ?? null,
      isEncrypted: meta?.isEncrypted ?? false,
      updatedAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    const values = recordToRow(SHEET_HEADERS[SHEETS.settings], {
      Id: entity.id,
      Category: entity.category,
      SettingKey: entity.settingKey,
      SettingValue: entity.settingValue ?? "",
      DataType: entity.dataType,
      Description: entity.description ?? "",
      IsEncrypted: entity.isEncrypted,
      UpdatedAt: entity.updatedAt ?? ""
    });
    if (match) await this.client.updateRow(SHEETS.settings, match.rowNumber, values);
    else await this.client.appendRow(SHEETS.settings, values);
    this.client.cache.invalidate("settings:");
    return entity;
  }
}

export class SheetsNumberSequenceRepository implements NumberSequenceRepository {
  private client = getGoogleSheetsClient();
  async findByKey(sequenceKey: string) {
    const { rows } = await this.client.getSheetRows(SHEETS.numberSequences);
    const r = rows.find((x) => x.record.SequenceKey === sequenceKey);
    if (!r) return null;
    return {
      id: r.record.Id,
      sequenceKey: r.record.SequenceKey,
      prefix: r.record.Prefix,
      currentValue: parseInteger(r.record.CurrentValue),
      padding: parseInteger(r.record.Padding, 6),
      resetRule: r.record.ResetRule || "YEARLY",
      branchId: parseNullableString(r.record.BranchId),
      updatedAt: parseNullableString(r.record.UpdatedAt)
    } satisfies NumberSequence;
  }
  async upsert(data: Omit<NumberSequence, "id"> & { id?: string }) {
    const { rows } = await this.client.getSheetRows(SHEETS.numberSequences, true);
    const match = rows.find((x) => x.record.SequenceKey === data.sequenceKey);
    const entity: NumberSequence = {
      id: data.id || match?.record.Id || randomUUID(),
      ...data,
      updatedAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    const values = recordToRow(SHEET_HEADERS[SHEETS.numberSequences], {
      Id: entity.id,
      SequenceKey: entity.sequenceKey,
      Prefix: entity.prefix,
      CurrentValue: entity.currentValue,
      Padding: entity.padding,
      ResetRule: entity.resetRule,
      BranchId: entity.branchId ?? "",
      UpdatedAt: entity.updatedAt ?? ""
    });
    if (match) await this.client.updateRow(SHEETS.numberSequences, match.rowNumber, values);
    else await this.client.appendRow(SHEETS.numberSequences, values);
    this.client.cache.invalidate(`rows:${SHEETS.numberSequences}`);
    return entity;
  }
  async next(sequenceKey: string) {
    return sheetsLock.withLock(`seq:${sequenceKey}`, async () => {
      const current = await this.findByKey(sequenceKey);
      if (!current) throw new NotFoundError(`Number sequence ${sequenceKey} not found.`);
      const nextValue = current.currentValue + 1;
      const sequence = await this.upsert({ ...current, currentValue: nextValue });
      const formatted = `${sequence.prefix}${String(nextValue).padStart(sequence.padding, "0")}`;
      return { sequence, formatted };
    });
  }
}

export class SheetsDashboardRepository implements DashboardRepository {
  private client = getGoogleSheetsClient();
  async listMetrics(): Promise<DashboardMetric[]> {
    const cached = this.client.cache.get<DashboardMetric[]>("dashboard:metrics");
    if (cached) return cached;
    const { rows } = await this.client.getSheetRows(SHEETS.dashboardMetrics);
    const items = rows
      .map((r) => ({
        id: r.record.Id,
        metricKey: r.record.MetricKey,
        label: r.record.Label,
        value: r.record.Value,
        unit: parseNullableString(r.record.Unit),
        trend: parseNullableString(r.record.Trend),
        visibility: r.record.Visibility || "all",
        sortOrder: parseInteger(r.record.SortOrder),
        isActive: parseBoolean(r.record.IsActive, true),
        updatedAt: parseNullableString(r.record.UpdatedAt)
      }))
      .filter((m) => m.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    this.client.cache.set("dashboard:metrics", items);
    return items;
  }
  async listAlerts(): Promise<DashboardAlert[]> {
    const { rows } = await this.client.getSheetRows(SHEETS.dashboardAlerts);
    return rows
      .map((r) => ({
        id: r.record.Id,
        title: r.record.Title,
        message: r.record.Message,
        severity: r.record.Severity || "info",
        module: parseNullableString(r.record.Module),
        isActive: parseBoolean(r.record.IsActive, true),
        createdAt: r.record.CreatedAt || nowIso(),
        expiresAt: parseNullableString(r.record.ExpiresAt)
      }))
      .filter((a) => a.isActive);
  }
  async getPreferences(userId: string) {
    const { rows } = await this.client.getSheetRows(SHEETS.dashboardPreferences);
    return rows
      .filter((r) => r.record.UserId === userId)
      .map((r) => ({
        id: r.record.Id,
        userId: r.record.UserId,
        preferenceKey: r.record.PreferenceKey,
        preferenceValue: r.record.PreferenceValue,
        updatedAt: parseNullableString(r.record.UpdatedAt)
      }));
  }
  async upsertPreference(userId: string, key: string, value: string) {
    const { rows } = await this.client.getSheetRows(SHEETS.dashboardPreferences, true);
    const match = rows.find(
      (r) => r.record.UserId === userId && r.record.PreferenceKey === key
    );
    const entity: DashboardPreference = {
      id: match?.record.Id || randomUUID(),
      userId,
      preferenceKey: key,
      preferenceValue: value,
      updatedAt: nowIso()
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    const values = recordToRow(SHEET_HEADERS[SHEETS.dashboardPreferences], {
      Id: entity.id,
      UserId: entity.userId,
      PreferenceKey: entity.preferenceKey,
      PreferenceValue: entity.preferenceValue,
      UpdatedAt: entity.updatedAt ?? ""
    });
    if (match) await this.client.updateRow(SHEETS.dashboardPreferences, match.rowNumber, values);
    else await this.client.appendRow(SHEETS.dashboardPreferences, values);
    return entity;
  }
}

export class SheetsSchemaMigrationRepository implements SchemaMigrationRepository {
  private client = getGoogleSheetsClient();
  async list(): Promise<SchemaMigration[]> {
    const { rows } = await this.client.getSheetRows(SHEETS.schemaMigrations);
    return rows.map((r) => ({
      id: r.record.Id,
      version: r.record.Version,
      name: r.record.Name,
      appliedAt: r.record.AppliedAt || nowIso(),
      checksum: parseNullableString(r.record.Checksum)
    }));
  }
  async has(version: string) {
    return (await this.list()).some((m) => m.version === version);
  }
  async record(version: string, name: string, checksum?: string) {
    if (await this.has(version)) {
      return (await this.list()).find((m) => m.version === version)!;
    }
    const entity: SchemaMigration = {
      id: randomUUID(),
      version,
      name,
      appliedAt: nowIso(),
      checksum: checksum ?? null
    };
    const { recordToRow } = await import("../sheets.mapper");
    const { SHEET_HEADERS } = await import("../sheets.config");
    await this.client.appendRow(
      SHEETS.schemaMigrations,
      recordToRow(SHEET_HEADERS[SHEETS.schemaMigrations], {
        Id: entity.id,
        Version: entity.version,
        Name: entity.name,
        AppliedAt: entity.appliedAt,
        Checksum: entity.checksum ?? ""
      })
    );
    return entity;
  }
}
