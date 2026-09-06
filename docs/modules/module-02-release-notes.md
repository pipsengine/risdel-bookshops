# Risdel Books v0.3.0 — Module 02 Release Notes

Module 02 is an additive update to v0.2.0.

## Added
- Organisation overview
- Company profile maintenance
- Branch create/list/detail/update/status/head-office management
- Warehouse create/list/detail/update/status/default-location management
- Branch and warehouse manager assignment
- Warehouse direct-sales and negative-stock controls
- Organisation RBAC permissions
- Organisation audit events
- SQL Server migration 004

## Upgrade sequence
Existing installations should keep all prior data and run only `scripts/database/004_module02_organisation.sql` after the Module 01 migrations.

## Next module
Module 03 — Executive Dashboard.
