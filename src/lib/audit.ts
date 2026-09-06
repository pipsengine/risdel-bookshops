import { getDataProvider } from "@/data";

export async function writeAudit(input: {
  userId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string;
  oldValues?: unknown;
  newValues?: unknown;
  branchId?: string | null;
}) {
  try {
    await getDataProvider().audit.append(input);
  } catch (error) {
    console.error("Audit write failed", error);
  }
}

export async function writeLoginHistory(
  email: string,
  success: boolean,
  userId?: string | null,
  reason?: string
) {
  try {
    await getDataProvider().loginHistory.append({
      userId: userId ?? null,
      email,
      wasSuccessful: success,
      failureReason: reason ?? null
    });
  } catch (error) {
    console.error("Login history write failed", error);
  }
}
