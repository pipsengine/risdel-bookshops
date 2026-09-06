/* Risdel Books Module 21 - future relational migration reference.
   Google Sheets GS-019 is the active provider. This script documents the target relational entities. */
CREATE SCHEMA finance;
-- Target entities: finance.ExpenseCategories, finance.Expenses, finance.ExpensePayments,
-- finance.PettyCashFunds, finance.PettyCashTransactions, finance.PettyCashReplenishments.
-- Preserve UUID identifiers from Google Sheets during migration.
