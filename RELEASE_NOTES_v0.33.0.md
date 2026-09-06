# Risdel Bookshops v0.33.0 — Module 32

## Budgeting, Financial Statements & Management Accounts

Cumulative update on v0.32.0.

### Added
- Account/period based budgets with approval state.
- Budget versus actual analysis sourced from posted General Ledger journals.
- Management Profit & Loss with comparative-period metrics.
- Statement of Financial Position generated from ledger account classifications.
- Management-account pack generation and approval.
- Snapshot lines for current, comparative, budget and variance amounts.
- Finance RBAC for budget, statement and management-account functions.
- Google Sheets schema GS-030.
- SQL Server future-provider reference migration 031.

### Google Sheets additions
- Finance_Budgets
- Finance_BudgetLines
- Finance_StatementMappings
- Finance_ManagementAccounts
- Finance_ManagementAccountLines

### Important accounting note
Financial statements are management reports derived from posted ledger entries. Period-end accruals, depreciation, tax adjustments, inventory accounting review and external-accountant/statutory review may still be required before statutory use.
