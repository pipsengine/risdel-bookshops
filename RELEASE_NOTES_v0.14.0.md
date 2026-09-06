# Risdel Bookshops v0.14.0 — Module 13 Purchasing & Procurement

Cumulative update on v0.13.0.

## Added
- Procurement overview and live KPIs.
- Manual purchase requests and reorder-to-request conversion.
- Draft → submitted → approved/rejected request lifecycle.
- Supplier selection and approved-request conversion to purchase orders.
- Purchase-order register, detail page, expected delivery and status controls.
- Procurement dashboard metrics and pending-approval alerts.
- RBAC for Procurement, Operations, Store, Inventory and Accounting roles.
- Google Sheets schema GS-011.
- Future SQL Server migration reference.

## Google Sheets added
- Procurement_PurchaseRequests
- Procurement_PurchaseRequestLines
- Procurement_PurchaseOrders
- Procurement_PurchaseOrderLines
- Procurement_Events

Goods receipt is intentionally left for Module 14 so receiving, shortages, over-delivery, inspection, supplier returns and three-way matching can be implemented with proper controls.
