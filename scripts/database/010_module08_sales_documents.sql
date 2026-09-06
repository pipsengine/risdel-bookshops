/* Risdel Books Module 08 — Sales Orders, Quotations & Invoices
   Preserved relational migration reference for future SQL Server migration. */
IF SCHEMA_ID('sales') IS NULL EXEC('CREATE SCHEMA sales');
GO
IF OBJECT_ID('sales.Quotations','U') IS NULL CREATE TABLE sales.Quotations(
 Id uniqueidentifier NOT NULL PRIMARY KEY, QuotationNumber nvarchar(40) NOT NULL UNIQUE, Revision int NOT NULL DEFAULT 1,
 CustomerId uniqueidentifier NULL, BranchId uniqueidentifier NULL, Status nvarchar(24) NOT NULL, ValidUntil date NULL,
 Subtotal decimal(19,4) NOT NULL DEFAULT 0, DiscountTotal decimal(19,4) NOT NULL DEFAULT 0, TaxTotal decimal(19,4) NOT NULL DEFAULT 0,
 Total decimal(19,4) NOT NULL DEFAULT 0, Currency char(3) NOT NULL DEFAULT 'NGN', Notes nvarchar(max) NULL, Terms nvarchar(max) NULL,
 ConvertedOrderId uniqueidentifier NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
GO
IF OBJECT_ID('sales.QuotationLines','U') IS NULL CREATE TABLE sales.QuotationLines(
 Id uniqueidentifier NOT NULL PRIMARY KEY, QuotationId uniqueidentifier NOT NULL, ProductId uniqueidentifier NOT NULL, ProductName nvarchar(250) NULL,
 Quantity decimal(19,4) NOT NULL, UnitPrice decimal(19,4) NOT NULL, DiscountAmount decimal(19,4) NOT NULL DEFAULT 0, TaxAmount decimal(19,4) NOT NULL DEFAULT 0,
 LineTotal decimal(19,4) NOT NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), IsActive bit NOT NULL DEFAULT 1);
GO
IF OBJECT_ID('sales.Orders','U') IS NULL CREATE TABLE sales.Orders(
 Id uniqueidentifier NOT NULL PRIMARY KEY, OrderNumber nvarchar(40) NOT NULL UNIQUE, QuotationId uniqueidentifier NULL, CustomerId uniqueidentifier NULL,
 BranchId uniqueidentifier NULL, WarehouseId uniqueidentifier NULL, Status nvarchar(24) NOT NULL, OrderDate date NOT NULL, RequiredDate date NULL,
 Subtotal decimal(19,4) NOT NULL DEFAULT 0, DiscountTotal decimal(19,4) NOT NULL DEFAULT 0, TaxTotal decimal(19,4) NOT NULL DEFAULT 0,
 Total decimal(19,4) NOT NULL DEFAULT 0, AmountInvoiced decimal(19,4) NOT NULL DEFAULT 0, Currency char(3) NOT NULL DEFAULT 'NGN',
 PaymentTerms nvarchar(200) NULL, DeliveryStatus nvarchar(24) NULL, Notes nvarchar(max) NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
GO
IF OBJECT_ID('sales.OrderLines','U') IS NULL CREATE TABLE sales.OrderLines(
 Id uniqueidentifier NOT NULL PRIMARY KEY, OrderId uniqueidentifier NOT NULL, ProductId uniqueidentifier NOT NULL, ProductName nvarchar(250) NULL,
 Quantity decimal(19,4) NOT NULL, QuantityReserved decimal(19,4) NOT NULL DEFAULT 0, QuantityFulfilled decimal(19,4) NOT NULL DEFAULT 0, QuantityBackordered decimal(19,4) NOT NULL DEFAULT 0,
 UnitPrice decimal(19,4) NOT NULL, DiscountAmount decimal(19,4) NOT NULL DEFAULT 0, TaxAmount decimal(19,4) NOT NULL DEFAULT 0, LineTotal decimal(19,4) NOT NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), IsActive bit NOT NULL DEFAULT 1);
GO
IF OBJECT_ID('sales.Invoices','U') IS NULL CREATE TABLE sales.Invoices(
 Id uniqueidentifier NOT NULL PRIMARY KEY, InvoiceNumber nvarchar(40) NOT NULL UNIQUE, OrderId uniqueidentifier NULL, CustomerId uniqueidentifier NULL, BranchId uniqueidentifier NULL,
 InvoiceDate date NOT NULL, DueDate date NULL, Status nvarchar(24) NOT NULL, Subtotal decimal(19,4) NOT NULL DEFAULT 0, DiscountTotal decimal(19,4) NOT NULL DEFAULT 0,
 TaxTotal decimal(19,4) NOT NULL DEFAULT 0, Total decimal(19,4) NOT NULL DEFAULT 0, AmountPaid decimal(19,4) NOT NULL DEFAULT 0, BalanceDue decimal(19,4) NOT NULL DEFAULT 0,
 Currency char(3) NOT NULL DEFAULT 'NGN', PaymentTerms nvarchar(200) NULL, Notes nvarchar(max) NULL, CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1);
GO
