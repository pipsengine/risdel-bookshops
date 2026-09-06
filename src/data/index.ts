import type { DataProvider } from "@/data/contracts/repositories";
import type { DataProviderName } from "@/data/contracts/types";
import { ConfigurationError } from "@/lib/errors";

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
  let provider: DataProvider;

  if (name === "google-sheets") {
    // Lazy require keeps googleapis off the critical Next compile path until runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleSheetsProvider } = require("./providers/google-sheets/google-sheets.provider");
    provider = new GoogleSheetsProvider();
  } else if (name === "sql-server") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqlServerProvider } = require("./providers/sql-server/sql-server.provider");
    provider = new SqlServerProvider();
  } else {
    throw new ConfigurationError(
      "PostgreSQL provider is reserved for a future release. Use google-sheets or sql-server."
    );
  }
  cached = provider;
  return provider;
}

export function resetDataProvider(): void {
  cached = null;
}

export async function persistenceHealth() {
  return getDataProvider().health();
}
