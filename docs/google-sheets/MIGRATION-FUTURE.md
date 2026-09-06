# Future migration: Google Sheets → relational database

Google Sheets is an **interim provider**, not the long-term architecture.

## Target path

```text
Google Sheets
      ↓
Export / Provider Migration Tool  (npm run sheets:export)
      ↓
Relational Database (SQL Server / PostgreSQL)
      ↓
Repository Provider Switch  (DATA_PROVIDER=sql-server|postgresql)
```

## Critical rules

1. **Preserve UUIDs** — Sheet `Id` values become database primary keys so foreign keys stay valid.
2. **Business services and UI do not change** — only the provider implementation behind repository contracts.
3. **Do not invent a second domain model** for SQL vs Sheets.
4. Keep `scripts/database/` SQL migrations as the relational target reference.

## Suggested migration steps

1. Freeze writes (maintenance window) or run dual-read validation.
2. `npm run sheets:export` → JSON/CSV under `exports/<date>/`.
3. Transform export into SQL insert scripts / bulk load using the same UUIDs.
4. Implement SQL repository methods that satisfy `src/data/contracts`.
5. Set `DATA_PROVIDER=sql-server` (or `postgresql`) in the target environment.
6. Verify health, login, RBAC, organisation, dashboard, audit.
7. Keep Sheets export as rollback backup.

## Known Sheets limitations (why migrate)

- Weaker concurrency / no ACID transactions
- API quotas and latency
- No native foreign keys or indexes
- Limited large-scale querying and aggregates
- Row-oriented operational constraints

Mitigations today (cache, locks, uniqueness checks, optimistic `UpdatedAt`) are temporary — not a substitute for a relational engine.
