import { randomUUID } from "crypto";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { ListQuery, PaginatedResult } from "@/data/contracts/types";
import { getGoogleSheetsClient, GoogleSheetsClient } from "../google-sheets.client";
import { recordToRow, normalizeSearch, nowIso, parseBoolean } from "../sheets.mapper";
import type { SheetName } from "../sheets.config";
import { SHEET_HEADERS } from "../sheets.config";

export type SheetRow = {
  rowNumber: number;
  values: string[];
  record: Record<string, string>;
};

export function paginate<T>(
  items: T[],
  query?: ListQuery
): PaginatedResult<T> {
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, query?.pageSize ?? 50));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize
  };
}

export function sortByField<T>(
  items: T[],
  sortBy?: string,
  sortDir: "asc" | "desc" = "asc"
): T[] {
  if (!sortBy) return items;
  const dir = sortDir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = String((a as Record<string, unknown>)[sortBy] ?? "").toLowerCase();
    const bv = String((b as Record<string, unknown>)[sortBy] ?? "").toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export abstract class SheetEntityRepository<T extends { id: string }> {
  protected constructor(
    protected readonly sheetName: SheetName,
    protected readonly client: GoogleSheetsClient = getGoogleSheetsClient()
  ) {}

  protected headers(): string[] {
    return SHEET_HEADERS[this.sheetName];
  }

  protected async loadRows(bypassCache = false): Promise<SheetRow[]> {
    const { rows } = await this.client.getSheetRows(this.sheetName, bypassCache);
    return rows;
  }

  protected abstract fromRecord(record: Record<string, string>): T | null;
  protected abstract toRecord(entity: T): Record<string, unknown>;

  protected mapRows(rows: SheetRow[]): T[] {
    const out: T[] = [];
    for (const row of rows) {
      try {
        const entity = this.fromRecord(row.record);
        if (entity) out.push(entity);
      } catch (error) {
        console.warn(`[sheets] Skipping malformed row in ${this.sheetName}#${row.rowNumber}`, {
          message: error instanceof Error ? error.message : "unknown"
        });
      }
    }
    return out;
  }

  async findById(id: string): Promise<T | null> {
    const rows = await this.loadRows();
    const match = rows.find((r) => r.record.Id === id);
    if (!match) return null;
    return this.fromRecord(match.record);
  }

  async exists(id: string): Promise<boolean> {
    return Boolean(await this.findById(id));
  }

  async findAll(): Promise<T[]> {
    return this.mapRows(await this.loadRows());
  }

  protected async findRowById(id: string, bypassCache = false): Promise<SheetRow | null> {
    const rows = await this.loadRows(bypassCache);
    return rows.find((r) => r.record.Id === id) ?? null;
  }

  protected async appendEntity(entity: T): Promise<T> {
    const record = this.toRecord(entity);
    await this.client.appendRow(this.sheetName, recordToRow(this.headers(), record));
    return entity;
  }

  protected async updateEntity(id: string, patch: Partial<T>, expectedUpdatedAt?: string | null): Promise<T> {
    const row = await this.findRowById(id, true);
    if (!row) throw new NotFoundError(`Record ${id} not found in ${this.sheetName}.`);

    const current = this.fromRecord(row.record);
    if (!current) throw new ValidationError(`Malformed record ${id} in ${this.sheetName}.`);

    if (expectedUpdatedAt && "updatedAt" in current) {
      const currentUpdated = (current as { updatedAt?: string | null }).updatedAt;
      if (currentUpdated && currentUpdated !== expectedUpdatedAt) {
        throw new ConflictError("Record was modified by another process. Refresh and try again.");
      }
    }

    const next = { ...current, ...patch, id } as T;
    if ("updatedAt" in next) {
      (next as { updatedAt?: string }).updatedAt = nowIso();
    }
    await this.client.updateRow(this.sheetName, row.rowNumber, recordToRow(this.headers(), this.toRecord(next)));
    return next;
  }

  protected newId(id?: string): string {
    return id || randomUUID();
  }

  protected assertUnique(
    items: T[],
    predicate: (item: T) => boolean,
    message: string
  ): void {
    if (items.some(predicate)) throw new ConflictError(message);
  }

  protected filterActive<TEntity extends { isActive?: boolean }>(
    items: TEntity[],
    activeOnly?: boolean
  ): TEntity[] {
    if (!activeOnly) return items;
    return items.filter((i) => i.isActive !== false);
  }

  protected searchFilter<TEntity>(
    items: TEntity[],
    search: string | undefined,
    fields: (keyof TEntity)[]
  ): TEntity[] {
    if (!search?.trim()) return items;
    const q = normalizeSearch(search);
    return items.filter((item) =>
      fields.some((field) => normalizeSearch(String(item[field] ?? "")).includes(q))
    );
  }
}

export function isActiveFlag(record: Record<string, string>): boolean {
  if (record.DeletedAt) return false;
  return parseBoolean(record.IsActive, true);
}
