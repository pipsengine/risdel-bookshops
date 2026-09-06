"use server";
import { revalidatePath } from "next/cache";
import { getDataProvider } from "@/data";
import { requirePermission } from "@/lib/authz";
import { generateTemporaryPassword, hashPassword, validatePasswordPolicy } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { toPublicErrorMessage } from "@/lib/errors";

export type ActionState = { error?: string; success?: string; temporaryPassword?: string };

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("admin.users.manage");
  const name = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") || "");
  let password = String(formData.get("temporaryPassword") || "");
  if (!name || !email || !roleId) return { error: "Name, email and role are required." };
  if (!password) password = generateTemporaryPassword();
  const policy = validatePasswordPolicy(password);
  if (policy.length) return { error: `Temporary password must contain ${policy.join(", ")}.` };
  try {
    const db = getDataProvider();
    const exists = await db.users.findByEmail(email);
    if (exists) return { error: "A user with this email already exists." };
    const hash = await hashPassword(password);
    const user = await db.users.create({
      email,
      displayName: name,
      passwordHash: hash,
      mustChangePassword: true,
      failedLoginCount: 0,
      isActive: true,
      createdBy: actor.userId
    });
    await db.userRoles.assign(user.id, roleId, actor.userId);
    await writeAudit({
      userId: actor.userId,
      action: "CREATE",
      module: "administration",
      entityType: "User",
      entityId: user.id,
      description: `Created user ${email}`,
      newValues: { name, email, roleId }
    });
    revalidatePath("/administration/users");
    return {
      success:
        "User created successfully. Share the temporary password securely; it will not be shown again.",
      temporaryPassword: password
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create user." };
  }
}

export async function toggleUser(formData: FormData) {
  const actor = await requirePermission("admin.users.manage");
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active")) === "true";
  if (!id || id === actor.userId) return;
  const db = getDataProvider();
  await db.users.update(id, { isActive: active, updatedBy: actor.userId });
  if (!active) await db.userSessions.revokeAllForUser(id);
  await writeAudit({
    userId: actor.userId,
    action: active ? "ACTIVATE" : "DEACTIVATE",
    module: "administration",
    entityType: "User",
    entityId: id,
    description: `${active ? "Activated" : "Deactivated"} user account`
  });
  revalidatePath("/administration/users");
}

export async function unlockUser(formData: FormData) {
  const actor = await requirePermission("admin.users.manage");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = getDataProvider();
  await db.users.update(id, {
    failedLoginCount: 0,
    lockedUntil: null,
    updatedBy: actor.userId
  });
  await writeAudit({
    userId: actor.userId,
    action: "UNLOCK",
    module: "security",
    entityType: "User",
    entityId: id,
    description: "Unlocked user account"
  });
  revalidatePath("/administration/users");
}

export async function resetUserPassword(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requirePermission("admin.users.manage");
  const id = String(formData.get("userId") || "");
  let password = String(formData.get("temporaryPassword") || "");
  if (!id) return { error: "User is required." };
  if (!password) password = generateTemporaryPassword();
  const policy = validatePasswordPolicy(password);
  if (policy.length) return { error: `Temporary password must contain ${policy.join(", ")}.` };
  try {
    const db = getDataProvider();
    const user = await db.users.findById(id);
    if (!user) return { error: "User not found." };
    if (user.passwordHash) await db.passwordHistory.add(id, user.passwordHash);
    const hash = await hashPassword(password);
    await db.users.update(id, {
      passwordHash: hash,
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedBy: actor.userId
    });
    await db.userSessions.revokeAllForUser(id);
    await writeAudit({
      userId: actor.userId,
      action: "PASSWORD_RESET",
      module: "security",
      entityType: "User",
      entityId: id,
      description: "Administrator reset user password"
    });
    return {
      success: "Password reset. The user must change it on next sign in.",
      temporaryPassword: password
    };
  } catch (error) {
    return { error: toPublicErrorMessage(error) };
  }
}

export async function updateUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("admin.users.manage");
  const id = String(formData.get("userId") || "");
  const name = String(formData.get("displayName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const jobTitle = String(formData.get("jobTitle") || "").trim();
  const roleId = String(formData.get("roleId") || "");
  if (!id || !name || !roleId) return { error: "Name and role are required." };
  try {
    const db = getDataProvider();
    await db.users.update(id, {
      displayName: name,
      phone: phone || null,
      jobTitle: jobTitle || null,
      updatedBy: actor.userId
    });
    const currentRoles = await db.userRoles.findByUserId(id);
    for (const ur of currentRoles) {
      await db.userRoles.revoke(id, ur.roleId);
    }
    await db.userRoles.assign(id, roleId, actor.userId);
    await writeAudit({
      userId: actor.userId,
      action: "UPDATE",
      module: "administration",
      entityType: "User",
      entityId: id,
      description: "Updated user profile and role",
      newValues: { name, phone, jobTitle, roleId }
    });
    revalidatePath(`/administration/users/${id}`);
    revalidatePath("/administration/users");
    return { success: "User details updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update user." };
  }
}
