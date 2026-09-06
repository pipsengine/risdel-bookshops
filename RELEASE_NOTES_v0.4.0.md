# Risdel Bookshops v0.4.0 — Module 03 Executive Dashboard

This is a cumulative release built directly on v0.3.0.

## Added
- Production executive dashboard replacing the Module 02 implementation-progress placeholder.
- Branch-aware operating scope selector.
- Live organisation footprint KPIs.
- Live user/role/security indicators and management exceptions.
- Recent audit activity feed.
- Permission-aware financial and executive visibility.
- Future-module readiness indicators for Catalogue, Inventory, Sales, Procurement and Finance.
- `system.DashboardMetrics` cross-module KPI publication table.
- `system.DashboardAlerts` management-exception publication table.
- `system.DashboardPreferences` user preference foundation.
- Module 03 dashboard permissions and sensible role defaults.
- Dashboard integration contract documentation.

## Database upgrade
Run `scripts/database/005_module03_executive_dashboard.sql` against the existing v0.3.0 database. Do not recreate the database.

## Validation note
The repository structure, JSON metadata, whitespace/diff checks, migration presence and TypeScript syntax path were reviewed. A complete Next.js production build still requires `npm install`; this isolated build environment does not contain the project dependency cache and cannot download packages from the npm registry.
