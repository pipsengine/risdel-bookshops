# Risdel Bookshops architecture

Risdel Bookshops is one evolving modular monolith:

```text
Next.js UI / Server Actions
        â†“
Business services
        â†“
Repository interfaces  (src/data/contracts)
        â†“
Data provider factory  (src/data)
   â”Œâ”€â”€â”€â”€â”´â”€â”€â”€â”€â”
   â–¼         â–¼
Google Sheets   SQL Server (preserved / future)
(active now)
```

Cross-cutting services (authentication, authorization, audit, notifications, documents, logging) are established once and reused by all modules. Business domains will be added under `src/features` without duplicating infrastructure.

## Domain roadmap

Foundation â†’ Security â†’ Organisation â†’ Dashboard â†’ Catalogue â†’ Inventory â†’ Sales/POS â†’ CRM â†’ Academic Sales â†’ Suppliers â†’ Procurement â†’ Finance â†’ Fulfilment â†’ Reporting â†’ Advanced Intelligence.

## Key rules

- Server-side authorization is mandatory; hiding a button is not security.
- Business values are configurable rather than hard-coded.
- Major records use UUID identifiers and timestamps.
- Every stock/financial transaction will preserve a reference and audit trail.
- Branch and warehouse context is embedded from the beginning.
- Persistence technology is selected only via `DATA_PROVIDER` â€” never from UI/business modules.
- Google Sheets is an interim provider; see `docs/google-sheets/MIGRATION-FUTURE.md`.
