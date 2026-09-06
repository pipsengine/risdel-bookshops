import { NextResponse } from "next/server";
import { appConfig } from "@/config/app";
import { getConfiguredProviderName, persistenceHealth } from "@/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const persistence = await persistenceHealth();
  const httpStatus = persistence.status === "Unavailable" ? 503 : 200;
  return NextResponse.json(
    {
      status: httpStatus === 200 ? (persistence.status === "Healthy" ? "healthy" : "degraded") : "unavailable",
      application: appConfig.name,
      version: appConfig.version,
      dataProvider: getConfiguredProviderName(),
      persistence: persistence.status,
      detail: persistence.detail,
      spreadsheetId: persistence.spreadsheetIdMasked,
      lastSuccessfulReadAt: persistence.lastSuccessfulReadAt,
      requiredSheets: persistence.requiredSheets,
      timestamp: new Date().toISOString()
    },
    { status: httpStatus }
  );
}
