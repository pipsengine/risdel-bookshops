# Risdel Bookshops v0.13.0 — Module 12 Supplier Management

This cumulative release adds supplier directory and profiles, supplier types, contacts, addresses, payment/credit terms, default lead time, preferred suppliers, product-source mappings, supplier SKU/cost/MOQ/lead-time data, publisher relationships, performance reviews and scorecards, supplier document metadata, RBAC permissions, audit integration, and Google Sheets schema GS-010.

## New worksheets
- Supplier_Suppliers
- Supplier_Contacts
- Supplier_Addresses
- Supplier_Products
- Supplier_Publishers
- Supplier_PerformanceReviews
- Supplier_Documents

Run `npm run sheets:init` against the existing Risdel Bookshops spreadsheet. The initializer is additive and preserves previous module data.
