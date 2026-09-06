# Risdel Bookshops v0.32.0 — Module 31 Tax, Fiscal Controls & Nigeria Compliance

## Added
- Tax & Compliance workspace under Finance.
- Effective-dated tax code registry.
- Nigeria 2026 seed defaults: standard VAT 7.5% and zero-rated educational books/materials.
- Customer and supplier tax profiles with TIN/VAT identifiers, exemptions and WHT applicability.
- VAT working return register and WHT transaction/remittance foundations.
- Fiscalization readiness/settings and fiscal-document register.
- Product tax classification controls using existing Catalogue_Products.TaxCode.
- Additive tax fields for sales/POS and supplier invoice line schemas.
- GS-029 Google Sheets schema upgrade and future SQL migration reference.
- Granular tax RBAC permissions and audit logging.

## Important controls
- WHT automatic deduction is disabled by default; WHT must be explicitly configured by supplier/payment category.
- Fiscalization is disabled until a compliant provider/process is configured.
- Product tax classification remains explicit. Uncertain non-book products are not silently assigned VAT.
- Tax working reports are preparation tools and require accounting review before statutory filing.
