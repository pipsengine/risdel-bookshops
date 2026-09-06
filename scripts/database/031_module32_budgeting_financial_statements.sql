/* Risdel Books Module 32 - Budgeting, Financial Statements & Management Accounts
   Future relational-provider reference. Apply only when SQL Server provider is active. */
IF SCHEMA_ID('finance') IS NULL EXEC('CREATE SCHEMA finance');
IF OBJECT_ID('finance.Budgets') IS NULL CREATE TABLE finance.Budgets(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BudgetCode nvarchar(50) NOT NULL UNIQUE, Name nvarchar(200) NOT NULL,
 FiscalYear int NOT NULL, BranchId uniqueidentifier NULL, Status nvarchar(30) NOT NULL, Version int NOT NULL DEFAULT 1,
 Description nvarchar(1000) NULL, CreatedAt datetime2 NOT NULL, CreatedBy uniqueidentifier NULL,
 ApprovedAt datetime2 NULL, ApprovedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('finance.BudgetLines') IS NULL CREATE TABLE finance.BudgetLines(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BudgetId uniqueidentifier NOT NULL, AccountId uniqueidentifier NOT NULL,
 PeriodCode nvarchar(20) NOT NULL, Amount decimal(19,4) NOT NULL, Notes nvarchar(500) NULL,
 CreatedAt datetime2 NOT NULL, CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT UQ_finance_BudgetLines UNIQUE(BudgetId,AccountId,PeriodCode));
IF OBJECT_ID('finance.StatementMappings') IS NULL CREATE TABLE finance.StatementMappings(
 Id uniqueidentifier NOT NULL PRIMARY KEY, StatementType nvarchar(40) NOT NULL, SectionCode nvarchar(60) NOT NULL,
 SectionName nvarchar(150) NOT NULL, AccountId uniqueidentifier NOT NULL, Sign decimal(9,2) NOT NULL DEFAULT 1,
 SortOrder int NOT NULL DEFAULT 100, CreatedAt datetime2 NOT NULL, CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('finance.ManagementAccounts') IS NULL CREATE TABLE finance.ManagementAccounts(
 Id uniqueidentifier NOT NULL PRIMARY KEY, PackNumber nvarchar(50) NOT NULL UNIQUE, Name nvarchar(200) NOT NULL,
 PeriodId uniqueidentifier NULL, PeriodStart date NOT NULL, PeriodEnd date NOT NULL, ComparativeStart date NULL, ComparativeEnd date NULL,
 Status nvarchar(30) NOT NULL, Revenue decimal(19,4) NOT NULL DEFAULT 0, CostOfGoodsSold decimal(19,4) NOT NULL DEFAULT 0,
 GrossProfit decimal(19,4) NOT NULL DEFAULT 0, OperatingExpenses decimal(19,4) NOT NULL DEFAULT 0, NetProfit decimal(19,4) NOT NULL DEFAULT 0,
 Assets decimal(19,4) NOT NULL DEFAULT 0, Liabilities decimal(19,4) NOT NULL DEFAULT 0, Equity decimal(19,4) NOT NULL DEFAULT 0,
 CashBalance decimal(19,4) NOT NULL DEFAULT 0, Receivables decimal(19,4) NOT NULL DEFAULT 0, Payables decimal(19,4) NOT NULL DEFAULT 0,
 GeneratedAt datetime2 NOT NULL, GeneratedBy uniqueidentifier NULL, ApprovedAt datetime2 NULL, ApprovedBy uniqueidentifier NULL,
 Notes nvarchar(max) NULL, CreatedAt datetime2 NOT NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('finance.ManagementAccountLines') IS NULL CREATE TABLE finance.ManagementAccountLines(
 Id uniqueidentifier NOT NULL PRIMARY KEY, ManagementAccountId uniqueidentifier NOT NULL, ReportSection nvarchar(50) NOT NULL,
 LineCode nvarchar(60) NOT NULL, LineName nvarchar(200) NOT NULL, CurrentAmount decimal(19,4) NOT NULL DEFAULT 0,
 ComparativeAmount decimal(19,4) NOT NULL DEFAULT 0, BudgetAmount decimal(19,4) NOT NULL DEFAULT 0,
 VarianceAmount decimal(19,4) NOT NULL DEFAULT 0, VariancePercent decimal(19,4) NOT NULL DEFAULT 0,
 SortOrder int NOT NULL DEFAULT 100, CreatedAt datetime2 NOT NULL, IsActive bit NOT NULL DEFAULT 1);
