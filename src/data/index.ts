import type { DataProvider } from "@/data/contracts/repositories";
import type { DataProviderName } from "@/data/contracts/types";
import { ConfigurationError } from "@/lib/errors";
import { GoogleSheetsProvider } from "@/data/providers/google-sheets/google-sheets.provider";
import { SqlServerProvider } from "@/data/providers/sql-server/sql-server.provider";

let cached: DataProvider | null = null;

export function getConfiguredProviderName(): DataProviderName {
  const raw = (process.env.DATA_PROVIDER || "google-sheets").trim().toLowerCase();
  if (raw === "google-sheets" || raw === "sql-server" || raw === "postgresql") {
    return raw;
  }
  throw new ConfigurationError(
    `Unsupported DATA_PROVIDER "${raw}". Use google-sheets, sql-server, or postgresql.`
  );
}

export function getDataProvider(): DataProvider {
  if (cached) return cached;
  const name = getConfiguredProviderName();
  if (name === "google-sheets") {
    cached = new GoogleSheetsProvider();
  } else if (name === "sql-server") {
    cached = new SqlServerProvider();
  } else {
    throw new ConfigurationError(
      "PostgreSQL provider is reserved for a future release. Use google-sheets or sql-server."
    );
  }
  return cached;
}

export function resetDataProvider(): void {
  cached = null;
}

export async function persistenceHealth() {
  return getDataProvider().health();
}
