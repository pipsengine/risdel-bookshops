# Module 03 — Executive Dashboard

Release: `v0.4.0`

The executive dashboard is the management landing page for Risdel Books. It deliberately separates **verified live values** from future-module placeholders; production revenue, inventory and finance values are never generated from demonstration data.

## Current live sources

- `system.Branches` and `system.Warehouses` — operating footprint and stock-location controls.
- `auth.Users`, `auth.Roles` — identity/access health.
- `audit.LoginHistory`, `audit.AuditLogs` — security exceptions and recent controlled activity.
- SQL Server health — platform readiness.

## KPI publication contract

Later modules publish current executive values to `system.DashboardMetrics` using these reserved keys:

- `sales.revenue.today`
- `sales.revenue.month`
- `sales.gross_profit.month`
- `sales.transactions.today`
- `inventory.value`
- `inventory.low_stock`
- `finance.receivables`
- `finance.payables`
- `procurement.po.open`

Metrics can be company-wide (`BranchId IS NULL`) or branch-specific. Later modules may extend this registry without changing the dashboard shell.

## Alert publication contract

`system.DashboardAlerts` is the cross-module management-exception channel. Modules may publish `INFO`, `WARNING`, or `CRITICAL` alerts with an optional deep link. Resolved alerts should be set inactive and timestamped rather than deleted.

## Access model

- `dashboard.view` — access to the dashboard route.
- `dashboard.executive.view` — executive dashboard permission for management roles.
- `dashboard.security.view` — identity/security exception visibility.
- `dashboard.financial.view` — sensitive financial KPI visibility.

Super Administrator inherits all dashboard permissions. Permissions remain editable through the Module 01 role matrix.
