# Module 02 — Company, Branch & Warehouse Setup

Module 02 extends the existing v0.2.0 repository. It does not recreate the application or database.

## Pages
- `/organisation` — organisation overview
- `/administration/company` — company profile and defaults
- `/administration/branches` — branch directory and branch creation
- `/administration/branches/[id]` — branch maintenance and warehouse context
- `/administration/warehouses` — stock-location directory and creation
- `/administration/warehouses/[id]` — warehouse controls and maintenance

## Controls
- Head office is unique per company.
- Default warehouse is unique per branch.
- Head office cannot be deactivated until another branch becomes head office.
- Default warehouse cannot be deactivated until another warehouse becomes default.
- Branch and warehouse codes are immutable through normal UI after creation.
- Negative stock is disabled by default.
- All writes use permission checks and audit events.

## Database Upgrade
Run `scripts/database/004_module02_organisation.sql` after the Module 01 database migration.
