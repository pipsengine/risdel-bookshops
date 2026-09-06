import { getDataProvider, persistenceHealth } from "@/data";
import type { Branch, Company, User, Warehouse } from "@/data/contracts/types";

async function providerReady() {
  const h = await persistenceHealth();
  return h.status === "Healthy" || h.status === "Degraded";
}

function companyView(c: Company) {
  return {
    Id: c.id,
    Code: c.code,
    Name: c.name,
    TradingName: c.tradingName,
    RegistrationNumber: c.registrationNumber,
    TaxNumber: c.taxNumber,
    Email: c.email,
    Phone: c.phone,
    Website: c.website,
    AddressLine1: c.addressLine1,
    AddressLine2: c.addressLine2,
    City: c.city,
    State: c.state,
    PostalCode: c.postalCode,
    Country: c.country,
    CurrencyCode: c.currencyCode,
    TimeZone: c.timeZone,
    BusinessType: c.businessType,
    ReceiptFooter: c.receiptFooter,
    LogoPath: c.logoPath,
    IsActive: c.isActive,
    CreatedAt: c.createdAt,
    CreatedBy: c.createdBy,
    UpdatedAt: c.updatedAt,
    UpdatedBy: c.updatedBy
  };
}

function branchView(
  b: Branch,
  companyName?: string | null,
  managerName?: string | null,
  warehouseCount = 0
) {
  return {
    Id: b.id,
    CompanyId: b.companyId,
    Code: b.code,
    Name: b.name,
    BranchType: b.branchType,
    Email: b.email,
    Phone: b.phone,
    Address: b.address,
    City: b.city,
    State: b.state,
    PostalCode: b.postalCode,
    ManagerId: b.managerId,
    OpeningDate: b.openingDate,
    Notes: b.notes,
    IsHeadOffice: b.isHeadOffice,
    IsActive: b.isActive,
    CreatedAt: b.createdAt,
    UpdatedAt: b.updatedAt,
    CompanyName: companyName ?? null,
    ManagerName: managerName ?? null,
    WarehouseCount: warehouseCount
  };
}

function warehouseView(
  w: Warehouse,
  branchName?: string | null,
  branchCode?: string | null,
  managerName?: string | null
) {
  return {
    Id: w.id,
    BranchId: w.branchId,
    Code: w.code,
    Name: w.name,
    WarehouseType: w.warehouseType,
    Address: w.address,
    ManagerId: w.managerId,
    AllowSales: w.allowSales,
    AllowNegativeStock: w.allowNegativeStock ?? false,
    IsDefault: w.isDefault,
    Notes: w.notes,
    IsActive: w.isActive,
    CreatedAt: w.createdAt,
    UpdatedAt: w.updatedAt,
    BranchName: branchName ?? null,
    BranchCode: branchCode ?? null,
    ManagerName: managerName ?? null
  };
}

export async function organisationSummary() {
  if (!(await providerReady())) {
    return { companies: 0, branches: 0, activeBranches: 0, warehouses: 0, activeWarehouses: 0 };
  }
  const db = getDataProvider();
  const [companies, branches, warehouses] = await Promise.all([
    db.companies.findMany({ pageSize: 200 }),
    db.branches.findMany({ pageSize: 500 }),
    db.warehouses.findMany({ pageSize: 500 })
  ]);
  return {
    companies: companies.total,
    branches: branches.total,
    activeBranches: branches.items.filter((b) => b.isActive).length,
    warehouses: warehouses.total,
    activeWarehouses: warehouses.items.filter((w) => w.isActive).length
  };
}

export async function getPrimaryCompany() {
  if (!(await providerReady())) return null;
  const db = getDataProvider();
  const companies = await db.companies.findMany({ pageSize: 50, sortBy: "createdAt", sortDir: "asc" });
  const first = companies.items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  return first ? companyView(first) : null;
}

export async function listBranches() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [branches, companies, users, warehouses] = await Promise.all([
    db.branches.findMany({ pageSize: 500 }),
    db.companies.findMany({ pageSize: 200 }),
    db.users.findMany({ pageSize: 500 }),
    db.warehouses.findMany({ pageSize: 500 })
  ]);
  const companyMap = new Map(companies.items.map((c) => [c.id, c.name]));
  const userMap = new Map(users.items.map((u: User) => [u.id, u.displayName]));
  return branches.items
    .map((b) =>
      branchView(
        b,
        companyMap.get(b.companyId),
        b.managerId ? userMap.get(b.managerId) : null,
        warehouses.items.filter((w) => w.branchId === b.id && w.isActive).length
      )
    )
    .sort((a, b) => Number(b.IsHeadOffice) - Number(a.IsHeadOffice) || a.Name.localeCompare(b.Name));
}

export async function getBranch(id: string) {
  if (!(await providerReady())) return null;
  const db = getDataProvider();
  const branch = await db.branches.findById(id);
  if (!branch) return null;
  const [company, manager] = await Promise.all([
    db.companies.findById(branch.companyId),
    branch.managerId ? db.users.findById(branch.managerId) : Promise.resolve(null)
  ]);
  return branchView(branch, company?.name, manager?.displayName);
}

export async function listWarehouses(branchId?: string) {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [warehouses, branches, users] = await Promise.all([
    db.warehouses.findMany({ pageSize: 500, branchId }),
    db.branches.findMany({ pageSize: 500 }),
    db.users.findMany({ pageSize: 500 })
  ]);
  const branchMap = new Map(branches.items.map((b) => [b.id, b]));
  const userMap = new Map(users.items.map((u) => [u.id, u.displayName]));
  return warehouses.items
    .map((w) => {
      const b = branchMap.get(w.branchId);
      return warehouseView(
        w,
        b?.name,
        b?.code,
        w.managerId ? userMap.get(w.managerId) : null
      );
    })
    .sort(
      (a, b) =>
        Number(branchMap.get(b.BranchId)?.isHeadOffice) -
          Number(branchMap.get(a.BranchId)?.isHeadOffice) ||
        String(a.BranchName).localeCompare(String(b.BranchName)) ||
        Number(b.IsDefault) - Number(a.IsDefault) ||
        a.Name.localeCompare(b.Name)
    );
}

export async function getWarehouse(id: string) {
  if (!(await providerReady())) return null;
  const db = getDataProvider();
  const warehouse = await db.warehouses.findById(id);
  if (!warehouse) return null;
  const [branch, manager] = await Promise.all([
    db.branches.findById(warehouse.branchId),
    warehouse.managerId ? db.users.findById(warehouse.managerId) : Promise.resolve(null)
  ]);
  return warehouseView(warehouse, branch?.name, branch?.code, manager?.displayName);
}

export async function organisationUsers() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const users = await db.users.findMany({ pageSize: 500, activeOnly: true });
  return users.items
    .map((u) => ({
      Id: u.id,
      DisplayName: u.displayName,
      Email: u.email,
      JobTitle: u.jobTitle
    }))
    .sort((a, b) => a.DisplayName.localeCompare(b.DisplayName));
}
