# Google Sheets Schema

Google Sheets is treated as a persistence provider, not as the application architecture. Every entity has an immutable UUID `Id`; worksheet row numbers are never foreign keys. Relationships use UUID fields such as `CompanyId`, `BranchId`, `UserId`, `RoleId` and `PermissionId`.

Current worksheets cover Modules 00–03:
- System_SchemaMigrations
- System_Companies, System_Branches, System_Warehouses
- System_Settings, System_NumberSequences
- Auth_Users, Auth_Roles, Auth_Permissions, Auth_UserRoles, Auth_RolePermissions
- Auth_UserSessions, Auth_PasswordHistory
- Audit_Logs, Audit_LoginHistory
- System_Notifications, System_Documents
- Dashboard_Metrics, Dashboard_Alerts, Dashboard_Preferences

Values are parsed and validated in the server-side provider. Dates are stored as ISO 8601. Passwords are stored only as salted scrypt hashes.
