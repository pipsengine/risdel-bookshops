# Risdel Bookshops architecture
Risdel Bookshops is one evolving modular monolith: Next.js UI/server layer → application services → repositories → Microsoft SQL Server. Cross-cutting services (authentication, authorization, audit, notifications, documents, logging) are established once and reused by all modules. Business domains will be added under `src/features` without duplicating infrastructure.

## Domain roadmap
Foundation → Security → Organisation → Dashboard → Catalogue → Inventory → Sales/POS → CRM → Academic Sales → Suppliers → Procurement → Finance → Fulfilment → Reporting → Advanced Intelligence.

## Key rules
- Server-side authorization is mandatory; hiding a button is not security.
- Business values are configurable rather than hard-coded.
- Major records use UUID identifiers and timestamps.
- Every stock/financial transaction will preserve a reference and audit trail.
- Branch and warehouse context is embedded from the beginning.
