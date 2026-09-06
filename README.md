# Risdel Books
Business management platform for **Risdel Enterprise**.

This repository follows an incremental-module model: every new module updates this same codebase and database architecture. Module 00 is the production foundation; future ZIP releases contain the complete application state, not isolated modules.

## Module 00 included
- Next.js + React + TypeScript
- Microsoft SQL Server foundation
- professional responsive login and application shell
- bootstrap authentication/session security
- SQL Server health check
- company/branch/warehouse foundation
- RBAC data model
- notifications/documents/audit schemas
- environment configuration
- IIS deployment documentation

## First run
```bash
cp .env.example .env.local
npm install
npm run dev
```
Open `http://localhost:3000`.

Default development bootstrap credentials (from `.env.example`):
- Email: `admin@risdel.local`
- Password: `ChangeMe@123`

**Change these immediately and never use the defaults in a production environment.**

## SQL Server
Create `RisdelBooks_Dev`, then run:
1. `scripts/database/001_foundation.sql`
2. `scripts/database/002_seed_foundation.sql`

Configure `.env.local` with a dedicated least-privilege SQL user. The application intentionally does not use `sa`.

## Commands
- `npm run dev` — local development
- `npm run typecheck` — TypeScript checks
- `npm run build` — production build
- `npm start` — start production server after build

## Repository map
- `src/app` — routes and server actions
- `src/components` — shared interface components
- `src/config` — central application configuration
- `src/lib` — infrastructure helpers
- `scripts/database` — versioned SQL scripts
- `docs` — architecture, security, deployment and module documentation
- `data/uploads` — local development attachment storage

See `docs/modules/MODULE-00.md` for the release scope.
