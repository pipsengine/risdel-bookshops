"use server";
import { revalidatePath } from "next/cache";
import { getDataProvider } from "@/data";
import { requirePermission } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";

export type RoleState = { error?: string; success?: string };

export async function createRole(_: RoleState, formData: FormData): Promise<RoleState> {
  const actor = await requirePermission("admin.roles.manage");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const code = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (!name) return { error: "Role name is required." };
  try {
    const db = getDataProvider();
    const role = await db.roles.create({
      code,
      name,
      description: description || null,
      isSystem: false,
      isActive: true
    });
    await writeAudit({
      userId: actor.userId,
      action: "CREATE",
      module: "administration",
      entityType: "Role",
      entityId: role.id,
      description: `Created role ${name}`
    });
    revalidatePath("/administration/roles");
    return { success: "Role created." };
  } catch {
    return { error: "A role with this name/code may already exist." };
  }
}

export async function saveRolePermissions(formData: FormData) {
  const actor = await requirePermission("admin.roles.manage");
  const roleId = String(formData.get("roleId") || "");
  const permissionIds = formData.getAll("permissionId").map(String);
  const db = getDataProvider();
  const existing = await db.rolePermissions.findByRoleId(roleId);
  for (const grant of existing) {
    await db.rolePermissions.revoke(roleId, grant.permissionId);
  }
  for (const permissionId of permissionIds) {
    await db.rolePermissions.grant(roleId, permissionId);
  }
  await writeAudit({
    userId: actor.userId,
    action: "UPDATE_PERMISSIONS",
    module: "administration",
    entityType: "Role",
    entityId: roleId,
    description: `Updated role permissions (${permissionIds.length} granted)`
  });
  revalidatePath(`/administration/roles/${roleId}`);
  revalidatePath("/administration/roles");
}

export async function toggleRole(formData: FormData) {
  const actor = await requirePermission("admin.roles.manage");
  const roleId = String(formData.get("roleId") || "");
  const active = String(formData.get("active")) === "true";
  const db = getDataProvider();
  const role = await db.roles.findById(roleId);
  if (!role || role.code === "SUPER_ADMIN") return;
  await db.roles.update(roleId, { isActive: active });
  await writeAudit({
    userId: actor.userId,
    action: active ? "ACTIVATE" : "DEACTIVATE",
    module: "administration",
    entityType: "Role",
    entityId: roleId,
    description: `${active ? "Activated" : "Deactivated"} role`
  });
  revalidatePath("/administration/roles");
}
