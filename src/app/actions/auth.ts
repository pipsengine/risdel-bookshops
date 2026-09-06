"use server";
import { redirect } from "next/navigation";
import { authenticate, clearSession, getSession } from "@/lib/auth";
import { getDataProvider } from "@/data";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { error: "Enter your email and password." };
  const result = await authenticate(email, password, remember);
  if (!result.ok) return { error: result.error };
  redirect(result.mustChangePassword ? "/security/change-password" : "/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export type PasswordState = { error?: string; success?: string };

export async function changePassword(
  _: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await getSession();
  if (!session) return { error: "Your session has expired. Sign in again." };
  if (!session.userId || session.source !== "database") {
    return {
      error: "A provider-backed account is required before this password can be changed."
    };
  }
  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  if (next !== confirm) return { error: "The new passwords do not match." };
  const errors = validatePasswordPolicy(next);
  if (errors.length) return { error: `Password must contain ${errors.join(", ")}.` };

  const db = getDataProvider();
  const user = await db.users.findById(session.userId);
  if (!user) return { error: "Account not found." };
  if (!(await verifyPassword(current, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  if (user.passwordHash) await db.passwordHistory.add(user.id, user.passwordHash);
  const hash = await hashPassword(next);
  await db.users.update(user.id, {
    passwordHash: hash,
    mustChangePassword: false,
    updatedBy: user.id
  });
  await db.userSessions.revokeAllForUser(user.id);
  await writeAudit({
    userId: session.userId,
    action: "PASSWORD_CHANGE",
    module: "security",
    entityType: "User",
    entityId: session.userId,
    description: "User changed account password"
  });
  await clearSession();
  redirect("/login?passwordChanged=1");
}
