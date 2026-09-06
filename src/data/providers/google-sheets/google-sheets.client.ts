import { ConfigurationError, IntegrationError } from "@/lib/errors";
import { requireSheetsEnv } from "./sheets.mapper";
import { SheetsCache } from "./sheets.cache";

type SheetsApi = {
  spreadsheets: {
    get: (args: Record<string, unknown>) => Promise<{ data: any }>;
    batchUpdate: (args: Record<string, unknown>) => Promise<{ data: any }>;
    values: {
      get: (args: Record<string, unknown>) => Promise<{ data: any }>;
      batchGet: (args: Record<string, unknown>) => Promise<{ data: any }>;
      update: (args: Record<string, unknown>) => Promise<{ data: any }>;
      append: (args: Record<string, unknown>) => Promise<{ data: any }>;
    };
  };
};

type LogEvent =
  | "Read"
  | "Write"
  | "BatchUpdate"
  | "Retry"
  | "Failure"
  | "CacheHit"
  | "CacheMiss";

function logProvider(event: LogEvent, message: string, meta?: Record<string, unknown>) {
  const safe = { ...meta };
  delete safe.privateKey;
  delete safe.credentials;
  delete safe.password;
  delete safe.passwordHash;
  console.info(`[sheets:${event}] ${message}`, safe ?? {});
}

function isRetryable(error: unknown): boolean {
  const anyErr = error as { code?: number; response?: { status?: number } };
  const status = anyErr?.code ?? anyErr?.response?.status;
  return status === 429 || (typeof status === "number" && status >= 500);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export class GoogleSheetsClient {
  private sheets: SheetsApi | null = null;
  readonly cache: SheetsCache;
  readonly spreadsheetId: string;
  private lastSuccessfulReadAt?: string;

  constructor() {
    const env = requireSheetsEnv();
    this.spreadsheetId = env.spreadsheetId;
    this.cache = new SheetsCache(env.cacheTtlSeconds);
  }

  getLastSuccessfulReadAt(): string | undefined {
    return this.lastSuccessfulReadAt;
  }

  private async api(): Promise<SheetsApi> {
    if (this.sheets) return this.sheets;
    const env = requireSheetsEnv();
    try {
      const { google } = await import("googleapis");
      const auth = new google.auth.JWT({
        email: env.clientEmail,
        key: env.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
      this.sheets = google.sheets({ version: "v4", auth }) as unknown as SheetsApi;
      return this.sheets;
    } catch (error) {
      throw new IntegrationError("Google authorization failure.", {
        reason: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    const max = 4;
    while (true) {
      try {
        return await fn();
      } catch (error) {
        attempt += 1;
        if (!isRetryable(error) || attempt >= max) {
          const anyErr = error as {
            code?: number | string;
            message?: string;
            errors?: Array<{ message?: string }>;
            response?: { data?: { error?: { message?: string; status?: string } } };
          };
          const message =
            anyErr?.response?.data?.error?.message ||
            anyErr?.message ||
            (error instanceof Error ? error.message : "unknown");
          logProvider("Failure", label, { attempt, message });
          const full = [message, ...(anyErr?.errors || []).map((e) => e.message)]
            .filter(Boolean)
            .join(" ");
          if (/has not been used|is disabled|Enable it by visiting/i.test(full)) {
            throw new IntegrationError(
              "Google Sheets API is disabled for this Google Cloud project. Enable it at https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=368034434543 then retry npm run sheets:init."
            );
          }
          if (
            Number(anyErr?.code) === 403 ||
            /auth|permission|credential|forbidden/i.test(full)
          ) {
            throw new IntegrationError(
              "Google Sheets authorization failed. Confirm the spreadsheet is shared with the service account email (Editor) and credentials are valid."
            );
          }
          throw new IntegrationError(`Google Sheets operation failed: ${label}.`);
        }
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        logProvider("Retry", label, { attempt, delay });
        await sleep(delay);
      }
    }
  }

  async getSpreadsheetMeta() {
    const api = await this.api();
    return this.withRetry("getSpreadsheetMeta", async () => {
      const res = await api.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: "spreadsheetId,properties.title,sheets.properties"
      });
      this.lastSuccessfulReadAt = new Date().toISOString();
      logProvider("Read", "spreadsheet meta");
      return res.data;
    });
  }

  async listSheetTitles(): Promise<string[]> {
    const meta = await this.getSpreadsheetMeta();
    const sheets = (meta.sheets || []) as Array<{ properties?: { title?: string } }>;
    return sheets
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));
  }

  async ensureSheet(title: string, headers: string[]): Promise<"created" | "exists"> {
    const titles = await this.listSheetTitles();
    if (titles.includes(title)) {
      await this.ensureHeaders(title, headers);
      return "exists";
    }
    const api = await this.api();
    await this.withRetry("createSheet", async () => {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title } } }]
        }
      });
    });
    logProvider("BatchUpdate", `created sheet ${title}`);
    await this.writeHeaders(title, headers);
    await this.freezeHeader(title);
    this.cache.invalidate(`rows:${title}`);
    return "created";
  }

  private async writeHeaders(title: string, headers: string[]) {
    const api = await this.api();
    await this.withRetry("writeHeaders", async () => {
      await api.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
      });
    });
    logProvider("Write", `headers ${title}`);
  }

  private async ensureHeaders(title: string, headers: string[]) {
    const existing = await this.readRange(`${title}!1:1`);
    const row = existing[0] || [];
    if (row.length === 0) {
      await this.writeHeaders(title, headers);
      await this.freezeHeader(title);
    }
  }

  private async freezeHeader(title: string) {
    const meta = await this.getSpreadsheetMeta();
    const sheets = (meta.sheets || []) as Array<{ properties?: { title?: string; sheetId?: number } }>;
    const sheet = sheets.find((s) => s.properties?.title === title);
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) return;
    const api = await this.api();
    await this.withRetry("freezeHeader", async () => {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  gridProperties: { frozenRowCount: 1 }
                },
                fields: "gridProperties.frozenRowCount"
              }
            }
          ]
        }
      });
    });
  }

  async readRange(range: string): Promise<string[][]> {
    const api = await this.api();
    return this.withRetry(`read:${range}`, async () => {
      const res = await api.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
        majorDimension: "ROWS"
      });
      this.lastSuccessfulReadAt = new Date().toISOString();
      logProvider("Read", range);
      return (res.data.values || []) as string[][];
    });
  }

  async batchGet(ranges: string[]): Promise<Record<string, string[][]>> {
    if (!ranges.length) return {};
    const api = await this.api();
    return this.withRetry("batchGet", async () => {
      const res = await api.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges
      });
      this.lastSuccessfulReadAt = new Date().toISOString();
      logProvider("Read", "batchGet", { count: ranges.length });
      const out: Record<string, string[][]> = {};
      for (const vr of res.data.valueRanges || []) {
        if (vr.range) out[vr.range] = (vr.values || []) as string[][];
      }
      return out;
    });
  }

  async appendRow(sheetName: string, values: string[]) {
    const api = await this.api();
    await this.withRetry(`append:${sheetName}`, async () => {
      await api.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [values] }
      });
    });
    this.cache.invalidate(`rows:${sheetName}`);
    logProvider("Write", `append ${sheetName}`);
  }

  async updateRow(sheetName: string, rowNumber: number, values: string[]) {
    if (rowNumber < 2) {
      throw new ConfigurationError("Cannot overwrite header row.");
    }
    const api = await this.api();
    const range = `${sheetName}!A${rowNumber}`;
    await this.withRetry(`update:${range}`, async () => {
      await api.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [values] }
      });
    });
    this.cache.invalidate(`rows:${sheetName}`);
    logProvider("Write", `update ${range}`);
  }

  async getSheetRows(sheetName: string, bypassCache = false): Promise<{ headers: string[]; rows: { rowNumber: number; values: string[]; record: Record<string, string> }[] }> {
    const cacheKey = `rows:${sheetName}`;
    if (!bypassCache) {
      const cached = this.cache.get<ReturnType<GoogleSheetsClient["getSheetRows"]> extends Promise<infer R> ? R : never>(cacheKey);
      if (cached) {
        logProvider("CacheHit", sheetName);
        return cached;
      }
      logProvider("CacheMiss", sheetName);
    }

    const values = await this.readRange(`${sheetName}!A:ZZ`);
    const headers = (values[0] || []).map((h) => String(h || "").trim());
    const { rowToRecord } = await import("./sheets.mapper");
    const rows = values.slice(1).map((vals, index) => ({
      rowNumber: index + 2,
      values: vals.map((v) => (v === null || v === undefined ? "" : String(v))),
      record: rowToRecord(headers, vals)
    })).filter((r) => Object.values(r.record).some((v) => v.trim().length > 0));

    const result = { headers, rows };
    this.cache.set(cacheKey, result);
    return result;
  }
}

let singleton: GoogleSheetsClient | null = null;

export function getGoogleSheetsClient(): GoogleSheetsClient {
  if (!singleton) singleton = new GoogleSheetsClient();
  return singleton;
}

export function resetGoogleSheetsClient(): void {
  singleton = null;
}
