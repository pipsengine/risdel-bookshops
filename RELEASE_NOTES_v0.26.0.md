# Risdel Bookshops v0.26.0 — Module 25 Approval Workflow Engine

This cumulative release introduces a central Approval Centre without replacing the business source records that already govern purchasing, finance, returns, supplier invoices, stocktaking and petty cash.

## Added
- Unified Approval Centre and pending work queue.
- Workflow definitions and configurable first-step permission routing.
- Approval request, step and event history records.
- SLA/due-date and overdue visibility.
- Approval delegation records.
- Automatic synchronization of existing pending purchase requests, expenses, customer returns, supplier invoices, stocktakes and petty-cash replenishments.
- Source-permission enforcement before centralized decisions are executed.
- Approval decisions call the existing source-module business logic where available, preserving stock, AP, return and finance side effects.
- Default workflow definitions and RBAC seeds.
- Google Sheets schema GS-023.
- SQL Server future migration reference.
