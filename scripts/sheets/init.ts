import { randomUUID } from "crypto";
import { loadEnvFiles } from "./load-env";
import { resetDataProvider, getDataProvider } from "../../src/data";
import {
  DATA_SCHEMA_VERSION,
  ensureGoogleSheetsStructure,
  resetGoogleSheetsClient
} from "../../src/data/providers/google-sheets/google-sheets.provider";
import { hashPassword } from "../../src/lib/password";

const PERMISSIONS = [
  // Foundation
  ["dashboard.view", "dashboard", "View dashboard"],
  ["admin.system.view", "administration", "View system information"],
  ["admin.data-provider.view", "administration", "View data provider diagnostics"],
  ["admin.data-provider.manage", "administration", "Manage data provider diagnostics"],
  ["admin.users.manage", "administration", "Manage users"],
  ["admin.roles.manage", "administration", "Manage roles"],
  ["admin.permissions.manage", "administration", "Manage permissions"],
  ["audit.view", "audit", "View audit logs"],
  // Module 01 — auth/security
  ["security.overview.view", "security", "View security overview"],
  ["security.login_history.view", "security", "View login history"],
  ["security.sessions.view", "security", "View sessions"],
  ["security.password.reset", "security", "Reset user passwords"],
  ["admin.users.view", "administration", "View users"],
  ["admin.users.create", "administration", "Create users"],
  ["admin.users.update", "administration", "Update users"],
  ["admin.users.activate", "administration", "Activate or deactivate users"],
  ["admin.roles.view", "administration", "View roles"],
  ["admin.roles.create", "administration", "Create roles"],
  ["admin.roles.update", "administration", "Update roles"],
  ["admin.permissions.assign", "administration", "Assign permissions"],
  ["profile.view", "profile", "View own profile"],
  ["profile.password.change", "profile", "Change own password"],
  // Module 02 — organisation
  ["organisation.overview.view", "organisation", "View organisation overview"],
  ["organisation.company.view", "organisation", "View company profile"],
  ["organisation.company.update", "organisation", "Update company profile"],
  ["organisation.branches.view", "organisation", "View branches"],
  ["organisation.branches.create", "organisation", "Create branches"],
  ["organisation.branches.update", "organisation", "Update branches"],
  ["organisation.warehouses.view", "organisation", "View warehouses"],
  ["organisation.warehouses.create", "organisation", "Create warehouses"],
  ["organisation.warehouses.update", "organisation", "Update warehouses"],
  // Module 03 — executive dashboard
  ["dashboard.executive.view", "dashboard", "View executive dashboard"],
  ["dashboard.security.view", "dashboard", "View dashboard security indicators"],
  ["dashboard.financial.view", "dashboard", "View financial dashboard indicators"]
] as const;

const ROLE_GRANTS: Record<string, string[]> = {
  MANAGING_DIRECTOR: [
    "dashboard.view",
    "dashboard.executive.view",
    "dashboard.security.view",
    "dashboard.financial.view",
    "admin.users.view",
    "admin.roles.view",
    "security.overview.view",
    "security.login_history.view",
    "security.sessions.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.company.update",
    "organisation.branches.view",
    "organisation.branches.create",
    "organisation.branches.update",
    "organisation.warehouses.view",
    "organisation.warehouses.create",
    "organisation.warehouses.update",
    "profile.view",
    "profile.password.change"
  ],
  OPERATIONS_MANAGER: [
    "dashboard.view",
    "dashboard.executive.view",
    "dashboard.security.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.company.update",
    "organisation.branches.view",
    "organisation.branches.create",
    "organisation.branches.update",
    "organisation.warehouses.view",
    "organisation.warehouses.create",
    "organisation.warehouses.update",
    "profile.view",
    "profile.password.change"
  ],
  STORE_MANAGER: [
    "dashboard.view",
    "dashboard.executive.view",
    "dashboard.security.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.branches.view",
    "organisation.warehouses.view",
    "organisation.warehouses.create",
    "organisation.warehouses.update",
    "profile.view",
    "profile.password.change"
  ],
  ACCOUNTANT: [
    "dashboard.view",
    "dashboard.financial.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.branches.view",
    "organisation.warehouses.view",
    "profile.view",
    "profile.password.change"
  ],
  AUDITOR: [
    "dashboard.view",
    "audit.view",
    "security.login_history.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.branches.view",
    "organisation.warehouses.view",
    "profile.view",
    "profile.password.change"
  ],
  INVENTORY_OFFICER: [
    "dashboard.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.branches.view",
    "organisation.warehouses.view",
    "profile.view",
    "profile.password.change"
  ],
  PROCUREMENT_OFFICER: [
    "dashboard.view",
    "organisation.overview.view",
    "organisation.company.view",
    "organisation.branches.view",
    "organisation.warehouses.view",
    "profile.view",
    "profile.password.change"
  ]
};

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

  for (const [permissionKey, module, name] of PERMISSIONS) {
    if (!(await db.permissions.findByKey(permissionKey))) {
      await db.permissions.create({ permissionKey, module, name });
      console.log(`Seeded permission ${permissionKey}`);
    }
  }

  // Baseline grants for all non-super roles
  const allRoles = await db.roles.findMany({ pageSize: 50 });
  const allPerms = await db.permissions.findMany({ pageSize: 200 });
  const permByKey = new Map(allPerms.items.map((p) => [p.permissionKey, p.id]));

  for (const role of allRoles.items) {
    if (role.code === "SUPER_ADMIN") continue;
    const keys = new Set([
      "dashboard.view",
      "profile.view",
      "profile.password.change",
      ...(ROLE_GRANTS[role.code] || [])
    ]);
    for (const key of keys) {
      const permissionId = permByKey.get(key);
      if (permissionId) await db.rolePermissions.grant(role.id, permissionId);
    }
  }

  const superRole = await db.roles.findByCode("SUPER_ADMIN");
  if (superRole) {
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
    const passwordHash = await hashPassword(adminPassword);
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
  if (!(await db.schemaMigrations.has("005"))) {
    await db.schemaMigrations.record("005", "module03-schema-v2-columns");
  }

  console.log("Seeding foundation data (idempotent)…");
  await seedFoundation();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
