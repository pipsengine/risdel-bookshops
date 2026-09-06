/* Risdel Books Module 15 - Customer Returns & Refunds
   Relational migration reference preserved for future SQL Server migration. */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name='sales') EXEC('CREATE SCHEMA sales');
IF OBJECT_ID('sales.CustomerReturns') IS NULL CREATE TABLE sales.CustomerReturns(
 Id uniqueidentifier NOT NULL PRIMARY KEY, ReturnNumber nvarchar(40) NOT NULL UNIQUE,
 SourceType nvarchar(20) NOT NULL, SourceId uniqueidentifier NOT NULL, SourceNumber nvarchar(50) NULL,
 CustomerId uniqueidentifier NULL, WarehouseId uniqueidentifier NULL, ReturnDate date NOT NULL,
 Reason nvarchar(500) NOT NULL, ResolutionType nvarchar(30) NOT NULL, RefundMethod nvarchar(30) NULL,
 TotalRefund decimal(18,2) NOT NULL DEFAULT 0, TotalCredit decimal(18,2) NOT NULL DEFAULT 0,
 Status nvarchar(30) NOT NULL, ApprovalRequired bit NOT NULL DEFAULT 0, ApprovedAt datetime2 NULL, ApprovedBy uniqueidentifier NULL,
 RejectionReason nvarchar(500) NULL, Notes nvarchar(max) NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('sales.CustomerReturnLines') IS NULL CREATE TABLE sales.CustomerReturnLines(
 Id uniqueidentifier NOT NULL PRIMARY KEY, CustomerReturnId uniqueidentifier NOT NULL, SourceType nvarchar(20) NOT NULL, SourceLineId uniqueidentifier NOT NULL,
 ProductId uniqueidentifier NOT NULL, QuantitySold decimal(18,4) NOT NULL, QuantityReturned decimal(18,4) NOT NULL,
 UnitPrice decimal(18,2) NOT NULL, RefundAmount decimal(18,2) NOT NULL, Condition nvarchar(30) NOT NULL, Disposition nvarchar(30) NOT NULL,
 Status nvarchar(30) NOT NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), CreatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT FK_CustomerReturnLines_Return FOREIGN KEY(CustomerReturnId) REFERENCES sales.CustomerReturns(Id));
IF OBJECT_ID('sales.Refunds') IS NULL CREATE TABLE sales.Refunds(Id uniqueidentifier NOT NULL PRIMARY KEY,RefundNumber nvarchar(40) NOT NULL UNIQUE,CustomerReturnId uniqueidentifier NOT NULL,CustomerId uniqueidentifier NULL,Amount decimal(18,2) NOT NULL,RefundMethod nvarchar(30) NOT NULL,PaymentReference nvarchar(100) NULL,Status nvarchar(30) NOT NULL,ProcessedAt datetime2 NULL,ProcessedBy uniqueidentifier NULL,CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(),CreatedBy uniqueidentifier NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('sales.CustomerCredits') IS NULL CREATE TABLE sales.CustomerCredits(Id uniqueidentifier NOT NULL PRIMARY KEY,CreditNumber nvarchar(40) NOT NULL UNIQUE,CustomerReturnId uniqueidentifier NOT NULL,CustomerId uniqueidentifier NULL,Amount decimal(18,2) NOT NULL,BalanceRemaining decimal(18,2) NOT NULL,CurrencyCode char(3) NOT NULL DEFAULT 'NGN',Status nvarchar(30) NOT NULL,IssuedAt datetime2 NOT NULL,ExpiresAt datetime2 NULL,CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(),CreatedBy uniqueidentifier NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('sales.Exchanges') IS NULL CREATE TABLE sales.Exchanges(Id uniqueidentifier NOT NULL PRIMARY KEY,ExchangeNumber nvarchar(40) NOT NULL UNIQUE,CustomerReturnId uniqueidentifier NOT NULL,CustomerId uniqueidentifier NULL,OriginalValue decimal(18,2) NOT NULL,ReplacementSaleId uniqueidentifier NULL,ReplacementValue decimal(18,2) NOT NULL DEFAULT 0,DifferenceAmount decimal(18,2) NOT NULL DEFAULT 0,Status nvarchar(30) NOT NULL,CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(),CreatedBy uniqueidentifier NULL,UpdatedAt datetime2 NULL,IsActive bit NOT NULL DEFAULT 1);
