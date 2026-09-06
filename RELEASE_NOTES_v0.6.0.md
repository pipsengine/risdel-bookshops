# Risdel Bookshops v0.6.0 — Module 05

## Academic & Catalogue Master Data Expansion

This cumulative release extends v0.5.0 without rebuilding prior modules.

### Added
- Controlled curricula with authority and country metadata.
- Academic sessions with single-current-session governance.
- Session-linked terms and normalized class masters.
- Category parent/child hierarchy with cycle protection.
- Publisher imprint management.
- Product forms now select controlled class and curriculum IDs instead of relying on free-text values.
- Bulk catalogue CSV validation/import with 500-row safety limit, duplicate checks, reference validation, dry-run mode, import history and audit logging.
- Permission-controlled CSV catalogue export.
- Google Sheets schema migration `GS-003`, new worksheets and additive header upgrades.
- SQL Server migration `scripts/database/007_module05_academic_master.sql` retained for a future relational provider.

### Google Sheets upgrade
Run `npm run sheets:init` against the same existing private Risdel Bookshops spreadsheet. The initializer is idempotent and adds only missing tabs/columns/seeds. It does not recreate prior sheets.
