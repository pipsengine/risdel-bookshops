# Risdel Bookshops v0.7.0 — Module 06 Inventory Management

Module 06 extends the cumulative Risdel Bookshops Google Sheets codebase with warehouse-level inventory control.

## Added
- Stock overview by product and warehouse
- Opening stock posting with one-time product/warehouse protection
- Immutable stock movement ledger
- Dispatch / in-transit / receive warehouse transfers
- Increase/decrease stock adjustments with mandatory reasons
- Damaged-stock segregation
- Manual stock reservations and releases
- Inventory valuation using balance average cost
- Available-to-sell calculation
- Reorder planning using reorder level + safety stock
- Dashboard inventory metrics and low-stock alerts
- Inventory RBAC permissions
- Google Sheets schema `GS-004`
- Future relational migration `008_module06_inventory.sql`

## Google Sheets
Run `npm run sheets:init` against the same existing private Risdel Bookshops spreadsheet. The initializer adds Module 06 worksheets and permissions without deleting earlier data.
