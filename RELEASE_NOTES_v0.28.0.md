# Risdel Bookshops v0.28.0 — Module 27 Advanced Catalogue & Inventory Import

Module 27 upgrades the existing catalogue import into a controlled onboarding centre for Excel/CSV catalogue, taxonomy and opening-stock files.

## Highlights
- Direct `.xlsx`, `.xls` and `.csv` upload.
- Native support for `Risdel_Bookshop_Nigeria_Inventory_Master.xlsx`.
- Workbook sheets: `01_Catalogue_Upload`, `02_Opening_Stock`, `03_Category_Taxonomy`, `06_Risdel_Reference_Codes`.
- Dry-run validation before posting.
- Duplicate product code, ISBN and barcode protection.
- Normalises workbook `BOOKS` product type to Risdel `BOOK`.
- Automatically creates missing controlled master records where safe.
- Creates hierarchical catalogue categories from the taxonomy worksheet.
- Posts opening stock to the existing inventory ledger and balance snapshot.
- Supports the template `MAIN-WH` alias by resolving it to the configured default warehouse.
- Batch history, row-level validation errors, audit trail and controlled rollback.
- Bundles the Nigeria Inventory Master template under `/templates/`.
- Google Sheets schema GS-025.

## Upgrade
Run `npm install`, then `npm run sheets:init`, then `npm run dev` using the same private Risdel Bookshops spreadsheet.
