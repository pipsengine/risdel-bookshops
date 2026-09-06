# Risdel Bookshops v0.36.0 — Module 35
## E-Commerce, Online Orders & Customer Portal

Adds a public storefront and customer portal over the existing Risdel catalogue, pricing, CRM, inventory, sales, loyalty and fulfilment foundations.

### Added
- Public `/shop` catalogue with live availability and pricing
- Product details and anonymous cart
- Delivery / click-and-collect checkout
- CRM customer creation/linking
- Online order + internal Sales Order generation
- Warehouse stock reservation during checkout
- Provider-ready online/offline payment records
- Customer portal registration, login and order tracking
- Internal `/commerce` online-order control centre
- GS-033 Google Sheets schema and RBAC permissions
- Future relational migration `034_module35_ecommerce.sql`

### Payment safety
Online card/payment-gateway capture remains disabled until an approved payment provider is configured. Bank transfer, pay-on-collection and pay-on-delivery are seeded as current channels.
