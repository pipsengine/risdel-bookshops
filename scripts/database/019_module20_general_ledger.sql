-- Risdel Books Module 20: General Ledger & Automated Accounting Posting
-- Future relational migration reference. Google Sheets remains the active provider.
IF SCHEMA_ID('finance') IS NULL EXEC('CREATE SCHEMA finance');

IF OBJECT_ID('finance.PostingRules') IS NULL CREATE TABLE finance.PostingRules(
 Id uniqueidentifier NOT NULL PRIMARY KEY, RuleCode nvarchar(80) NOT NULL UNIQUE, SourceType nvarchar(80) NOT NULL, EventType nvarchar(80) NULL,
 DebitAccountCode nvarchar(30) NOT NULL, CreditAccountCode nvarchar(30) NOT NULL, AmountField nvarchar(80) NOT NULL, Description nvarchar(250) NULL, Priority int NOT NULL DEFAULT 100, IsActive bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime());
IF OBJECT_ID('finance.PostingRuns') IS NULL CREATE TABLE finance.PostingRuns(
 Id uniqueidentifier NOT NULL PRIMARY KEY, RunNumber nvarchar(80) NOT NULL UNIQUE, StartedAt datetime2 NOT NULL, CompletedAt datetime2 NULL, Status nvarchar(40) NOT NULL, SourcesScanned int NOT NULL DEFAULT 0, JournalsPosted int NOT NULL DEFAULT 0, Errors int NOT NULL DEFAULT 0, ErrorSummary nvarchar(max) NULL, RunBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('finance.LedgerEntries') IS NULL CREATE TABLE finance.LedgerEntries(
 Id uniqueidentifier NOT NULL PRIMARY KEY, JournalId uniqueidentifier NOT NULL, JournalLineId uniqueidentifier NOT NULL, AccountId uniqueidentifier NOT NULL, AccountCode nvarchar(30) NOT NULL, PostingDate date NOT NULL, ReferenceType nvarchar(80) NULL, ReferenceId nvarchar(100) NULL, BranchId uniqueidentifier NULL, CustomerId uniqueidentifier NULL, SupplierId uniqueidentifier NULL, Description nvarchar(500) NULL, Debit decimal(19,4) NOT NULL DEFAULT 0, Credit decimal(19,4) NOT NULL DEFAULT 0, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), IsActive bit NOT NULL DEFAULT 1);
