import { createPrivateKey } from "crypto";
import { ConfigurationError, ValidationError } from "@/lib/errors";

export function parseString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function parseNullableString(value: unknown): string | null {
  const s = parseString(value);
  return s.length ? s : null;
}

export function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return fallback;
  const s = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return fallback;
}

export function parseInteger(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const s = parseString(value);
  if (!s) return fallback;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parseDecimal(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = parseString(value).replace(/,/g, "");
  if (!s) return fallback;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

export function parseDateTime(value: unknown): string | null {
  const s = parseNullableString(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJson<T = unknown>(value: unknown): T | null {
  const s = parseNullableString(value);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function serializeJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function requireUuid(value: unknown, field = "Id"): string {
  const s = parseString(value);
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(s)) {
    throw new ValidationError(`Invalid UUID for ${field}.`);
  }
  return s;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function maskSpreadsheetId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  if (id.length <= 8) return "****";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

/** Normalise PEM from Vercel/dotenv (quotes, escaped newlines, base64, JSON). */
function normalizePrivateKeyPem(raw: string): string {
  let key = raw.trim();
  // Full service-account JSON pasted into the key field
  if (key.startsWith("{")) {
    try {
      const parsed = JSON.parse(key) as { private_key?: string };
      if (parsed.private_key) key = parsed.private_key;
    } catch {
      /* treat as PEM below */
    }
  }
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Single-line PEM pasted without newlines — rebuild standard PEM line breaks.
  if (!key.includes("\n") && /BEGIN [A-Z0-9 ]+PRIVATE KEY/.test(key)) {
    const match = key.match(
      /-----BEGIN ([A-Z0-9 ]+PRIVATE KEY)-----(.+?)-----END \1-----/
    );
    if (match) {
      const label = match[1];
      const body = match[2].replace(/\s+/g, "");
      const lines = body.match(/.{1,64}/g) || [];
      key = [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join(
        "\n"
      );
    }
  }

  if (!/BEGIN [A-Z0-9 ]*PRIVATE KEY/.test(key)) {
    throw new ConfigurationError(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid PEM key. On Vercel prefer GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 (see .env.example)."
    );
  }

  try {
    createPrivateKey(key);
  } catch {
    throw new ConfigurationError(
      "Google service-account private key could not be parsed. Re-paste GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 from .vercel-sheets-key.b64.txt and remove any broken GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY value."
    );
  }
  return key;
}

export function getGooglePrivateKey(): string {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as { private_key?: string; client_email?: string };
      if (!parsed.private_key) {
        throw new ConfigurationError(
          "GOOGLE_SERVICE_ACCOUNT_JSON is missing private_key."
        );
      }
      return normalizePrivateKeyPem(parsed.private_key);
    } catch (error) {
      if (error instanceof ConfigurationError) throw error;
      throw new ConfigurationError(
        "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }
  }

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64?.replace(
    /\s+/g,
    ""
  );
  if (b64) {
    try {
      return normalizePrivateKeyPem(Buffer.from(b64, "base64").toString("utf8"));
    } catch (error) {
      if (error instanceof ConfigurationError) throw error;
      throw new ConfigurationError(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 could not be decoded as a PEM private key."
      );
    }
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!raw) {
    throw new ConfigurationError(
      "Google Sheets is configured as the active data provider, but GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing."
    );
  }
  return normalizePrivateKeyPem(raw);
}

export function requireSheetsEnv(): {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
  cacheTtlSeconds: number;
} {
  const provider = (process.env.DATA_PROVIDER || "google-sheets").toLowerCase();
  if (provider !== "google-sheets") {
    throw new ConfigurationError(`Expected google-sheets provider, got ${provider}.`);
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();

  if (!spreadsheetId) {
    throw new ConfigurationError(
      "Google Sheets is configured as the active data provider, but GOOGLE_SHEETS_SPREADSHEET_ID is missing."
    );
  }
  if (!clientEmail) {
    throw new ConfigurationError(
      "Google Sheets is configured as the active data provider, but GOOGLE_SERVICE_ACCOUNT_EMAIL is missing."
    );
  }

  return {
    spreadsheetId,
    clientEmail,
    privateKey: getGooglePrivateKey(),
    cacheTtlSeconds: Number(process.env.GOOGLE_SHEETS_CACHE_TTL_SECONDS || 30)
  };
}

/** Map header row + values into a record keyed by header name. */
export function rowToRecord(headers: string[], values: unknown[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    const key = String(header || "").trim();
    if (!key) return;
    const cell = values[index];
    record[key] = cell === null || cell === undefined ? "" : String(cell);
  });
  return record;
}

export function recordToRow(headers: string[], record: Record<string, unknown>): string[] {
  return headers.map((header) => {
    const value = record[header];
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}
