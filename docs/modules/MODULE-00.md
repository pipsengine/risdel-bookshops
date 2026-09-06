# Module 00 â€” Foundation (+ data provider abstraction)
Version: 0.2.0

Implemented:
- Next.js/TypeScript application structure
- Professional Risdel Bookshops login and application shell
- Signed bootstrap/session security (HttpOnly cookies)
- Protected routes and security headers
- **Pluggable data provider architecture** (`src/data`)
- **Google Sheets provider** (active via `DATA_PROVIDER=google-sheets`)
- SQL Server provider surface preserved for future switch
- Repository contracts for identity, organisation, audit, notifications, dashboard
- Sheet initializer, migrations registry, and export/backup utilities
- SQL Server foundation scripts retained under `scripts/database/`
- Dashboard foundation and system information page
- Data provider diagnostics page
- IIS deployment blueprint

Next update: Module 01 will extend this repository with full user/role/permission administration UI, lockout flows, password reset/change UI, and richer session management â€” still against repository contracts, not Google Sheets APIs directly.
