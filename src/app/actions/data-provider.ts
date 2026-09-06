"use server";

import { getDataProvider } from "@/data";
import { revalidatePath } from "next/cache";

export type DiagnosticsActionState = {
  ok?: boolean;
  message?: string;
  checkedAt?: string;
};

export async function testDataProviderConnection(
  _prev: DiagnosticsActionState
): Promise<DiagnosticsActionState> {
  try {
    const health = await getDataProvider().health();
    revalidatePath("/administration/data-provider");
    revalidatePath("/administration/system");
    return {
      ok: health.status === "Healthy" || health.status === "Degraded",
      message: health.detail,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Connection test failed",
      checkedAt: new Date().toISOString()
    };
  }
}

export async function validateDataProviderStructure(
  _prev: DiagnosticsActionState
): Promise<DiagnosticsActionState> {
  try {
    const diagnostics = await getDataProvider().diagnostics();
    revalidatePath("/administration/data-provider");
    const missing = diagnostics.requiredSheets.filter((s) => !s.present).map((s) => s.name);
    return {
      ok: missing.length === 0,
      message:
        missing.length === 0
          ? `All ${diagnostics.totalCount} required sheets are present.`
          : `Missing sheets: ${missing.join(", ")}`,
      checkedAt: diagnostics.lastCheckedAt
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Structure validation failed",
      checkedAt: new Date().toISOString()
    };
  }
}
