# Risdel Bookshops v0.9.0 — Module 08 Sales Orders, Quotations & Invoices

## Added
- Customer quotation register and professional quotation builder.
- Quotation lifecycle: Draft, Sent, Accepted, Rejected, Expired and Cancelled.
- Conversion from quotation to warehouse-backed sales order.
- Automatic order stock allocation, reservation and backorder calculation.
- Sales order register and detailed fulfilment progress.
- Invoice generation from sales orders.
- Invoice payment recording with payment-method reference rules.
- Outstanding balance and overdue invoice monitoring.
- Order fulfilment that consumes inventory reservations and posts inventory ledger movements.
- Printable invoice layout.
- Executive dashboard publication for open orders, receivables and overdue invoices.
- Additive Google Sheets schema GS-006.
- SQL Server future-migration reference migration 010.

## Google Sheets added
- Sales_Quotations
- Sales_QuotationLines
- Sales_Orders
- Sales_OrderLines
- Sales_Invoices
- Sales_InvoiceLines
- Sales_InvoicePayments
- Sales_Fulfilments
- Sales_FulfilmentLines

Run `npm run sheets:init` against the existing Risdel Bookshops spreadsheet. The initializer is additive and must not be run against a new spreadsheet for each module.
