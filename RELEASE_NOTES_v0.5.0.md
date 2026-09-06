# Risdel Books v0.5.0 — Module 04 Product & Book Catalogue

Cumulative update on v0.4.1 Google Sheets provider.

## Added
- Unified Product master for books, stationery, educational materials and other merchandise.
- Specialised Book profile with ISBN-10/ISBN-13, publisher, edition, publication year, language, format, subject, academic level, curriculum and class.
- Authors, publishers, categories, subjects and academic levels master-data pages.
- Multi-author product relationships.
- Unique ISBN and barcode validation.
- Retail pricing and immutable price-history records.
- Reorder level, safety stock and inventory-tracking foundations.
- Product search/filtering, detail pages, activation/deactivation and audit logging.
- Catalogue permissions and live Catalogue sidebar route.
- Google Sheets schema expansion and seed master data.
- Preserved SQL Server Module 04 schema for future provider migration.

## Google Sheets schema
Run `npm run sheets:init` against the existing private Risdel Books spreadsheet. It is idempotent and adds the Catalogue_* worksheets without recreating existing data.
