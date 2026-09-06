import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { loadEnvFiles } from "./load-env";
import { resetDataProvider, getDataProvider } from "../../src/data";
import {
  DATA_SCHEMA_VERSION,
  ensureGoogleSheetsStructure,
  resetGoogleSheetsClient
} from "../../src/data/providers/google-sheets/google-sheets.provider";

async function seedFoundation() {
  const db = getDataProvider();

  let company = await db.companies.findByCode("RISDEL");
  if (!company) {
    company = await db.companies.create({
      id: randomUUID(),
      code: "RISDEL",
      name: "Risdel Enterprise",
      tradingName: "Risdel Bookshops",
      country: "Nigeria",
      currencyCode: "NGN",
      timeZone: "Africa/Lagos",
      isActive: true
    });
    console.log("Seeded company RISDEL");
  }

  let branch = await db.branches.findByCode(company.id, "MAIN");
  if (!branch) {
    branch = await db.branches.create({
      id: randomUUID(),
      companyId: company.id,
      code: "MAIN",
      name: "Main Store",
      branchType: "RETAIL",
      isHeadOffice: true,
      isActive: true
    });
    console.log("Seeded branch MAIN");
  }

  let warehouse = await db.warehouses.findByCode(branch.id, "MAIN-STORE");
  if (!warehouse) {
    warehouse = await db.warehouses.create({
      id: randomUUID(),
      branchId: branch.id,
      code: "MAIN-STORE",
      name: "Main Warehouse",
      warehouseType: "STORE",
      allowSales: true,
      isDefault: true,
      isActive: true
    });
    console.log("Seeded warehouse MAIN-STORE");
  }

  const roles = [
    ["SUPER_ADMIN", "Super Administrator"],
    ["MANAGING_DIRECTOR", "Managing Director"],
    ["OPERATIONS_MANAGER", "Operations Manager"],
    ["STORE_MANAGER", "Store Manager"],
    ["ACCOUNTANT", "Accountant"],
    ["PROCUREMENT_OFFICER", "Procurement Officer"],
    ["INVENTORY_OFFICER", "Inventory Officer"],
    ["INSTITUTIONAL_SALES", "Institutional Sales Officer"],
    ["SALES_SUPERVISOR", "Sales Supervisor"],
    ["CASHIER", "Cashier"],
    ["AUDITOR", "Auditor / Read Only"]
  ] as const;

  for (const [code, name] of roles) {
    if (!(await db.roles.findByCode(code))) {
      await db.roles.create({ code, name, isSystem: true, isActive: true });
      console.log(`Seeded role ${code}`);
    }
  }

  const permissions = [
    ["dashboard.view", "dashboard", "View dashboard"],
    ["admin.system.view", "administration", "View system information"],
    ["admin.data-provider.view", "administration", "View data provider diagnostics"],
    ["admin.data-provider.manage", "administration", "Manage data provider diagnostics"],
    ["admin.users.manage", "administration", "Manage users"],
    ["admin.roles.manage", "administration", "Manage roles"],
    ["admin.permissions.manage", "administration", "Manage permissions"],
    ["audit.view", "audit", "View audit logs"]
  ] as const;

  for (const [permissionKey, module, name] of permissions) {
    if (!(await db.permissions.findByKey(permissionKey))) {
      await db.permissions.create({ permissionKey, module, name });
      console.log(`Seeded permission ${permissionKey}`);
    }
  }

  const superRole = await db.roles.findByCode("SUPER_ADMIN");
  if (superRole) {
    const allPerms = await db.permissions.findMany({ pageSize: 200 });
    for (const perm of allPerms.items) {
      await db.rolePermissions.grant(superRole.id, perm.id);
    }
  }

  if (!(await db.settings.get("General", "Currency"))) {
    await db.settings.set("General", "Currency", "NGN", {
      description: "Default business currency"
    });
  }
  await db.settings.set("System", "DATA_SCHEMA_VERSION", DATA_SCHEMA_VERSION, {
    description: "Google Sheets schema version"
  });

  if (!(await db.numberSequences.findByKey("SALES_ORDER"))) {
    await db.numberSequences.upsert({
      sequenceKey: "SALES_ORDER",
      prefix: "SO-",
      currentValue: 0,
      padding: 6,
      resetRule: "YEARLY",
      branchId: branch.id
    });
  }

  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@risdel.local").toLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe@123";
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator";
  let admin = await db.users.findByEmail(adminEmail);
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    admin = await db.users.create({
      email: adminEmail,
      displayName: adminName,
      passwordHash,
      mustChangePassword: true,
      failedLoginCount: 0,
      isActive: true
    });
    console.log(`Seeded admin user ${adminEmail}`);
  }
  if (superRole && admin) {
    await db.userRoles.assign(admin.id, superRole.id);
  }

  const metrics = await db.dashboard.listMetrics();
  if (metrics.length === 0) {
    // No fabricated business KPIs — foundation status only.
    console.log("Dashboard metrics left empty (no fabricated KPIs).");
  }

  return { company, branch, warehouse, admin };
}

async function main() {
  loadEnvFiles();
  process.env.DATA_PROVIDER = process.env.DATA_PROVIDER || "google-sheets";
  resetGoogleSheetsClient();
  resetDataProvider();

  console.log("Initialising Google Sheets structure…");
  const structure = await ensureGoogleSheetsStructure();
  console.log(`Created sheets: ${structure.created.length}`);
  structure.created.forEach((s) => console.log(`  + ${s}`));
  console.log(`Existing sheets: ${structure.existing.length}`);

  const db = getDataProvider();
  if (!(await db.schemaMigrations.has("001"))) {
    await db.schemaMigrations.record("001", "foundation");
  }
  if (!(await db.schemaMigrations.has("002"))) {
    await db.schemaMigrations.record("002", "identity");
  }
  if (!(await db.schemaMigrations.has("003"))) {
    await db.schemaMigrations.record("003", "organisation");
  }
  if (!(await db.schemaMigrations.has("004"))) {
    await db.schemaMigrations.record("004", "dashboard");
  }

  console.log("Seeding foundation data (idempotent)…");
  await seedFoundation();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
