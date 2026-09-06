# Risdel Books v0.4.1 — Google Sheets Data Provider

This is a cumulative infrastructure update to v0.4.0, not a new application.

## Added
- Google Sheets as default server-side persistence provider.
- Service-account authentication through environment secrets.
- Provider abstraction and SQL Server fallback preservation.
- Google-backed authentication, sessions, password changes, RBAC, users and roles.
- Google-backed company, branch and warehouse management.
- Google-backed dashboard metrics, alerts, audits and login history.
- Private spreadsheet health checks and Administration → Data Provider diagnostics.
- Idempotent `npm run sheets:init` initializer.
- JSON backup/export via `npm run sheets:export`.
- Schema/version tracking and future migration documentation.

## Important
Run `npm run sheets:init` after configuring `.env.local`. Do not manually create worksheet tabs.
