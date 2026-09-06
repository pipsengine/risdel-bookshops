# Google Sheets schema

Primary workbook: **one spreadsheet** for the whole Risdel Bookshops application.

## Tabs (Module 00 foundation + identity/org/dashboard readiness)

| Tab | Purpose |
|-----|---------|
| `System_SchemaMigrations` | Applied sheet migration versions |
| `System_Companies` | Companies |
| `System_Branches` | Branches (`CompanyId` UUID FK) |
| `System_Warehouses` | Warehouses (`BranchId` UUID FK) |
| `System_Settings` | Key/value settings incl. `DATA_SCHEMA_VERSION` |
| `System_NumberSequences` | Controlled number sequences |
| `System_Notifications` | In-app notifications |
| `System_Documents` | Document **metadata only** |
| `Auth_Users` | Users (password **hashes** only) |
| `Auth_Roles` | Roles |
| `Auth_Permissions` | Permissions |
| `Auth_UserRoles` | User â†” Role |
| `Auth_RolePermissions` | Role â†” Permission |
| `Auth_UserSessions` | Optional session metadata |
| `Auth_PasswordHistory` | Password history hashes |
| `Audit_Logs` | Append-only audit |
| `Audit_LoginHistory` | Login attempts |
| `Dashboard_Metrics` | Dashboard metrics |
| `Dashboard_Alerts` | Dashboard alerts |
| `Dashboard_Preferences` | Per-user preferences |

## Standards

- Header row is frozen and authoritative (map by **header name**, not column index).
- Every record has an immutable UUID `Id`.
- Relationships use UUID foreign keys (`CompanyId`, `BranchId`, â€¦), never names.
- Timestamps are ISO 8601 UTC (`2026-09-06T10:30:45.123Z`).
- Soft delete via `IsActive` / `DeletedAt` / `DeletedBy` where applicable.
- Currency amounts are application-level decimals; sheet display formatting is not authoritative.
- Schema version setting: `System` / `DATA_SCHEMA_VERSION` (currently `1`).

## Future modules

Add new tabs to the **same** spreadsheet (e.g. `Catalogue_Products`). Do not create a new spreadsheet per module.

Registry lives in `src/data/providers/google-sheets/sheets.config.ts`.
