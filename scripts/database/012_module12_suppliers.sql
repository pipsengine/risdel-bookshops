/* Risdel Books Module 12 - Supplier Management
   Future relational migration reference. Google Sheets is the active provider. */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name='supplier') EXEC('CREATE SCHEMA supplier');
GO
IF OBJECT_ID('supplier.Suppliers') IS NULL CREATE TABLE supplier.Suppliers(
 Id uniqueidentifier NOT NULL PRIMARY KEY, SupplierCode nvarchar(30) NOT NULL UNIQUE, SupplierType nvarchar(40) NOT NULL,
 Name nvarchar(200) NOT NULL, LegalName nvarchar(200) NULL, RegistrationNumber nvarchar(80) NULL, TaxNumber nvarchar(80) NULL,
 Phone nvarchar(50) NULL, Email nvarchar(200) NULL, Website nvarchar(300) NULL, PaymentTermsDays int NOT NULL DEFAULT 0,
 CreditLimit decimal(18,2) NOT NULL DEFAULT 0, CurrencyCode char(3) NOT NULL DEFAULT 'NGN', DefaultLeadTimeDays int NOT NULL DEFAULT 0,
 Rating decimal(4,2) NOT NULL DEFAULT 0, PerformanceStatus nvarchar(30) NOT NULL DEFAULT 'GOOD', AccountStatus nvarchar(30) NOT NULL DEFAULT 'ACTIVE',
 Preferred bit NOT NULL DEFAULT 0, Notes nvarchar(max) NULL, IsActive bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL, CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL);
GO
IF OBJECT_ID('supplier.SupplierProducts') IS NULL CREATE TABLE supplier.SupplierProducts(
 Id uniqueidentifier NOT NULL PRIMARY KEY, SupplierId uniqueidentifier NOT NULL, ProductId uniqueidentifier NOT NULL, SupplierSKU nvarchar(100) NULL,
 UnitCost decimal(18,2) NOT NULL DEFAULT 0, MinOrderQty decimal(18,3) NOT NULL DEFAULT 1, LeadTimeDays int NOT NULL DEFAULT 0,
 IsPreferred bit NOT NULL DEFAULT 0, LastQuotedAt datetime2 NULL, Notes nvarchar(max) NULL, IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL, CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NULL, UpdatedBy uniqueidentifier NULL);
GO
