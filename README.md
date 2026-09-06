# Risdel Bookshops
Business management platform for **Risdel Enterprise**.

This repository follows an incremental-module model: every new module updates this same codebase and persistence architecture. Module 00 is the production foundation; future ZIP releases contain the complete application state, not isolated modules.

## Module 00 included
- Next.js + React + TypeScript
- Pluggable data providers (`DATA_PROVIDER`)
- **Google Sheets** as the active interim persistence provider
- Microsoft SQL Server scripts + provider surface preserved for future migration
- Professional responsive login and application shell
- Bootstrap + Sheets-backed authentication/session security
- Persistence health checks and data-provider diagnostics
- Company/branch/warehouse/RBAC/audit data models via repository contracts
- Environment configuration and IIS deployment documentation

## First run
```bash
cp .env.example .env.local
npm install
```

### Google Sheets (default provider)
1. Follow `docs/google-sheets/SETUP.md` (Cloud project, service account, share spreadsheet).
2. Fill `GOOGLE_SHEETS_*` values in `.env.local`.
3. Initialise tabs + seed:

```bash
npm run sheets:init
npm run dev
```

Open `http://localhost:3000`.

### Terminal shortcuts
- Development: `.\start-dev.cmd` â†’ `http://localhost:3000`
- Production (IIS backend): `.\start-prod.cmd` â†’ `http://127.0.0.1:3000`

### IIS
1. Keep production Node running (`.\start-prod.cmd` or Windows service).
2. Run `.\setup-iis.cmd` once as Administrator.
3. Open `http://localhost` (IIS reverse-proxies to Node on port 3000).

See `docs/deployment/IIS.md` for full details.

Default development credentials (from `.env.example` / seed):
- Email: `admin@risdel.local`
- Password: `ChangeMe@123`

**Change these immediately and never use the defaults in a production environment.**

## Data providers
| Value | Status |
|-------|--------|
| `google-sheets` | Active interim store |
| `sql-server` | Preserved / future |
| `postgresql` | Reserved |

Business modules must not inspect `DATA_PROVIDER`. Use `getDataProvider()` repositories only.

## SQL Server (optional / future)
`scripts/database/` remains the relational schema reference. When `DATA_PROVIDER=sql-server`, SQL health is used; domain SQL repositories will be completed in later modules.

## Commands
- `npm run dev` â€” local development
- `npm run typecheck` â€” TypeScript checks
- `npm run build` â€” production build
- `npm start` â€” start production server after build
- `npm run sheets:init` â€” create sheets, headers, seed (idempotent)
- `npm run sheets:migrate` â€” apply sheet migration versions
- `npm run sheets:export` â€” JSON/CSV backup under `exports/`

## Repository map
- `src/app` â€” routes and server actions
- `src/components` â€” shared interface components
- `src/config` â€” central application configuration
- `src/data` â€” repository contracts + providers
- `src/services` â€” business services
- `src/lib` â€” infrastructure helpers
- `scripts/database` â€” versioned SQL scripts (preserved)
- `scripts/sheets` â€” Google Sheets init / migrate / export
- `docs` â€” architecture, security, Google Sheets, deployment
- `data/uploads` â€” local development attachment storage

See `docs/modules/MODULE-00.md` and `docs/google-sheets/` for details.
