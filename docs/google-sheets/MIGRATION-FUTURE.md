# Future Migration to a Relational Database

The application uses provider/repository boundaries so Google Sheets can be replaced later without redesigning the UI or business workflows.

Migration sequence:
1. Freeze or coordinate writes during cutover.
2. Run `npm run sheets:export`.
3. Create the target SQL Server/PostgreSQL schema.
4. Import entities in dependency order while preserving existing UUID `Id` values.
5. Validate record counts and relationships.
6. Change `DATA_PROVIDER=sql-server` (or a future PostgreSQL provider).
7. Run reconciliation and acceptance testing.

Do not generate new IDs during migration unless a documented mapping table is retained. Preserving IDs is what keeps UserRole, RolePermission, Company/Branch/Warehouse and future business relationships intact.
