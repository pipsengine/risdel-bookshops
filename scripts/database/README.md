# Risdel Books database bootstrap & upgrades

## New installation through Module 01
1. Create `RisdelBooks_Dev` (or your environment-specific database) in SQL Server.
2. Create a least-privilege application login/user. Do not use `sa` for the web application.
3. Run the migrations in numeric order:
   - `001_foundation.sql`
   - `002_seed_foundation.sql`
   - `003_module01_auth_security.sql`
4. Copy `.env.example` to `.env.local` and enter database/security configuration.
5. Start the application and sign in using the bootstrap administrator. The first database-backed sign-in provisions the protected Super Administrator into `auth.Users` and requires a password change.

## Existing Module 00 database
Run only `003_module01_auth_security.sql` to upgrade the schema and seed the new permissions.

All migration scripts are designed to preserve the existing Module 00 data. Do not delete/recreate the database between modules.

4. `004_module02_organisation.sql` — adds company/branch/warehouse operating controls and organisation permissions.
