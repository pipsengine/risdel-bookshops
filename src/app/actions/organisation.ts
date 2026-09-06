"use server";
import { revalidatePath } from "next/cache";
import { getDataProvider } from "@/data";
import { requirePermission } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";
import { toPublicErrorMessage } from "@/lib/errors";

export type OrgActionState = { error?: string; success?: string };

const text = (fd: FormData, key: string) => String(fd.get(key) || "").trim();
const nullable = (v: string) => v || null;

export async function updateCompany(
  _: OrgActionState,
  fd: FormData
): Promise<OrgActionState> {
  const actor = await requirePermission("organisation.company.update");
  const id = text(fd, "id");
  const name = text(fd, "name");
  const tradingName = text(fd, "tradingName");
  const email = text(fd, "email");
  const phone = text(fd, "phone");
  if (!id || !name) return { error: "Company name is required." };
  try {
    const db = getDataProvider();
    await db.companies.update(id, {
      name,
      tradingName: nullable(tradingName),
      registrationNumber: nullable(text(fd, "registrationNumber")),
      taxNumber: nullable(text(fd, "taxNumber")),
      email: nullable(email),
      phone: nullable(phone),
      website: nullable(text(fd, "website")),
      addressLine1: nullable(text(fd, "addressLine1")),
      addressLine2: nullable(text(fd, "addressLine2")),
      city: nullable(text(fd, "city")),
      state: nullable(text(fd, "state")),
      postalCode: nullable(text(fd, "postalCode")),
      country: text(fd, "country") || "Nigeria",
      currencyCode: text(fd, "currencyCode") || "NGN",
      timeZone: text(fd, "timeZone") || "Africa/Lagos",
      businessType: nullable(text(fd, "businessType")),
      receiptFooter: nullable(text(fd, "receiptFooter")),
      updatedBy: actor.userId
    });
    await writeAudit({
      userId: actor.userId,
      action: "UPDATE",
      module: "organisation",
      entityType: "Company",
      entityId: id,
      description: "Updated company profile",
      newValues: { name, tradingName, email, phone }
    });
    revalidatePath("/administration/company");
    revalidatePath("/organisation");
    return { success: "Company profile updated successfully." };
  } catch (e) {
    return { error: toPublicErrorMessage(e) || "Unable to update company profile." };
  }
}

export async function createBranch(
  _: OrgActionState,
  fd: FormData
): Promise<OrgActionState> {
  const actor = await requirePermission("organisation.branches.create");
  const companyId = text(fd, "companyId");
  const code = text(fd, "code").toUpperCase();
  const name = text(fd, "name");
  if (!companyId || !code || !name) {
    return { error: "Company, branch code and branch name are required." };
  }
  try {
    const db = getDataProvider();
    const existing = await db.branches.findByCode(companyId, code);
    if (existing) return { error: "That branch code already exists for this company." };
    const isHeadOffice = text(fd, "isHeadOffice") === "on";
    const branch = await db.branches.create({
      companyId,
      code,
      name,
      branchType: nullable(text(fd, "branchType")),
      email: nullable(text(fd, "email")),
      phone: nullable(text(fd, "phone")),
      address: nullable(text(fd, "address")),
      city: nullable(text(fd, "city")),
      state: nullable(text(fd, "state")),
      postalCode: nullable(text(fd, "postalCode")),
      managerId: nullable(text(fd, "managerId")),
      openingDate: nullable(text(fd, "openingDate")),
      notes: nullable(text(fd, "notes")),
      isHeadOffice,
      isActive: true,
      createdBy: actor.userId
    });
    await writeAudit({
      userId: actor.userId,
      action: "CREATE",
      module: "organisation",
      entityType: "Branch",
      entityId: branch.id,
      description: `Created branch ${code} - ${name}`
    });
    revalidatePath("/administration/branches");
    revalidatePath("/organisation");
    return { success: "Branch created successfully." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to create branch." };
  }
}

export async function updateBranch(
  _: OrgActionState,
  fd: FormData
): Promise<OrgActionState> {
  const actor = await requirePermission("organisation.branches.update");
  const id = text(fd, "id");
  const name = text(fd, "name");
  if (!id || !name) return { error: "Branch name is required." };
  try {
    const db = getDataProvider();
    await db.branches.update(id, {
      name,
      branchType: nullable(text(fd, "branchType")),
      email: nullable(text(fd, "email")),
      phone: nullable(text(fd, "phone")),
      address: nullable(text(fd, "address")),
      city: nullable(text(fd, "city")),
      state: nullable(text(fd, "state")),
      postalCode: nullable(text(fd, "postalCode")),
      managerId: nullable(text(fd, "managerId")),
      openingDate: nullable(text(fd, "openingDate")),
      notes: nullable(text(fd, "notes")),
      updatedBy: actor.userId
    });
    await writeAudit({
      userId: actor.userId,
      action: "UPDATE",
      module: "organisation",
      entityType: "Branch",
      entityId: id,
      description: "Updated branch profile"
    });
    revalidatePath("/administration/branches");
    revalidatePath(`/administration/branches/${id}`);
    return { success: "Branch updated successfully." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to update branch." };
  }
}

export async function toggleBranch(fd: FormData) {
  const actor = await requirePermission("organisation.branches.update");
  const id = text(fd, "id");
  const active = text(fd, "active") === "true";
  if (!id) return;
  const db = getDataProvider();
  const branch = await db.branches.findById(id);
  if (!branch) return;
  if (!active && branch.isHeadOffice) {
    throw new Error(
      "The head-office branch cannot be deactivated. Assign another head office first."
    );
  }
  await db.branches.update(id, { isActive: active, updatedBy: actor.userId });
  await writeAudit({
    userId: actor.userId,
    action: active ? "ACTIVATE" : "DEACTIVATE",
    module: "organisation",
    entityType: "Branch",
    entityId: id,
    description: `${active ? "Activated" : "Deactivated"} branch`
  });
  revalidatePath("/administration/branches");
}

export async function setHeadOffice(fd: FormData) {
  const actor = await requirePermission("organisation.branches.update");
  const id = text(fd, "id");
  if (!id) return;
  const db = getDataProvider();
  const branch = await db.branches.findById(id);
  if (!branch) return;
  const siblings = await db.branches.findMany({ companyId: branch.companyId, pageSize: 200 });
  for (const other of siblings.items.filter((b) => b.id !== id && b.isHeadOffice)) {
    await db.branches.update(other.id, { isHeadOffice: false, updatedBy: actor.userId });
  }
  await db.branches.update(id, {
    isHeadOffice: true,
    isActive: true,
    updatedBy: actor.userId
  });
  await writeAudit({
    userId: actor.userId,
    action: "UPDATE",
    module: "organisation",
    entityType: "Branch",
    entityId: id,
    description: "Set branch as head office"
  });
  revalidatePath("/administration/branches");
  revalidatePath("/organisation");
}

export async function createWarehouse(
  _: OrgActionState,
  fd: FormData
): Promise<OrgActionState> {
  const actor = await requirePermission("organisation.warehouses.create");
  const branchId = text(fd, "branchId");
  const code = text(fd, "code").toUpperCase();
  const name = text(fd, "name");
  if (!branchId || !code || !name) {
    return { error: "Branch, warehouse code and warehouse name are required." };
  }
  try {
    const db = getDataProvider();
    const existing = await db.warehouses.findByCode(branchId, code);
    if (existing) return { error: "That warehouse code already exists for this branch." };
    const isDefault = text(fd, "isDefault") === "on";
    const warehouse = await db.warehouses.create({
      branchId,
      code,
      name,
      warehouseType: nullable(text(fd, "warehouseType")),
      address: nullable(text(fd, "address")),
      managerId: nullable(text(fd, "managerId")),
      allowSales: text(fd, "allowSales") === "on",
      allowNegativeStock: text(fd, "allowNegativeStock") === "on",
      isDefault,
      notes: nullable(text(fd, "notes")),
      isActive: true,
      createdBy: actor.userId
    });
    await writeAudit({
      userId: actor.userId,
      action: "CREATE",
      module: "organisation",
      entityType: "Warehouse",
      entityId: warehouse.id,
      description: `Created warehouse ${code} - ${name}`
    });
    revalidatePath("/administration/warehouses");
    revalidatePath("/organisation");
    return { success: "Warehouse created successfully." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to create warehouse." };
  }
}

export async function updateWarehouse(
  _: OrgActionState,
  fd: FormData
): Promise<OrgActionState> {
  const actor = await requirePermission("organisation.warehouses.update");
  const id = text(fd, "id");
  const name = text(fd, "name");
  if (!id || !name) return { error: "Warehouse name is required." };
  try {
    const db = getDataProvider();
    await db.warehouses.update(id, {
      name,
      warehouseType: nullable(text(fd, "warehouseType")),
      address: nullable(text(fd, "address")),
      managerId: nullable(text(fd, "managerId")),
      allowSales: text(fd, "allowSales") === "on",
      allowNegativeStock: text(fd, "allowNegativeStock") === "on",
      notes: nullable(text(fd, "notes")),
      updatedBy: actor.userId
    });
    await writeAudit({
      userId: actor.userId,
      action: "UPDATE",
      module: "organisation",
      entityType: "Warehouse",
      entityId: id,
      description: "Updated warehouse profile"
    });
    revalidatePath("/administration/warehouses");
    revalidatePath(`/administration/warehouses/${id}`);
    return { success: "Warehouse updated successfully." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to update warehouse." };
  }
}

export async function toggleWarehouse(fd: FormData) {
  const actor = await requirePermission("organisation.warehouses.update");
  const id = text(fd, "id");
  const active = text(fd, "active") === "true";
  if (!id) return;
  const db = getDataProvider();
  const warehouse = await db.warehouses.findById(id);
  if (!warehouse) return;
  if (!active && warehouse.isDefault) {
    throw new Error(
      "The default warehouse cannot be deactivated. Assign another default first."
    );
  }
  await db.warehouses.update(id, { isActive: active, updatedBy: actor.userId });
  await writeAudit({
    userId: actor.userId,
    action: active ? "ACTIVATE" : "DEACTIVATE",
    module: "organisation",
    entityType: "Warehouse",
    entityId: id,
    description: `${active ? "Activated" : "Deactivated"} warehouse`
  });
  revalidatePath("/administration/warehouses");
}

export async function setDefaultWarehouse(fd: FormData) {
  const actor = await requirePermission("organisation.warehouses.update");
  const id = text(fd, "id");
  if (!id) return;
  const db = getDataProvider();
  const warehouse = await db.warehouses.findById(id);
  if (!warehouse) return;
  const siblings = await db.warehouses.findMany({
    branchId: warehouse.branchId,
    pageSize: 200
  });
  for (const other of siblings.items.filter((w) => w.id !== id && w.isDefault)) {
    await db.warehouses.update(other.id, { isDefault: false, updatedBy: actor.userId });
  }
  await db.warehouses.update(id, {
    isDefault: true,
    isActive: true,
    updatedBy: actor.userId
  });
  await writeAudit({
    userId: actor.userId,
    action: "UPDATE",
    module: "organisation",
    entityType: "Warehouse",
    entityId: id,
    description: "Set warehouse as branch default"
  });
  revalidatePath("/administration/warehouses");
}
