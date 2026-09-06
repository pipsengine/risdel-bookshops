/* Risdel Books Module 27 — Advanced Catalogue & Inventory Import
   Future relational migration reference. Google Sheets remains the active provider. */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name='catalogue') EXEC('CREATE SCHEMA catalogue');
GO
IF OBJECT_ID('catalogue.ImportBatches') IS NULL CREATE TABLE catalogue.ImportBatches(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BatchNumber nvarchar(40) NOT NULL UNIQUE, FileName nvarchar(260) NOT NULL,
 FileType nvarchar(20) NULL, ImportMode nvarchar(50) NULL, DryRun bit NOT NULL DEFAULT 1,
 CatalogueRows int NOT NULL DEFAULT 0, StockRows int NOT NULL DEFAULT 0, CategoryRows int NOT NULL DEFAULT 0,
 CreatedProducts int NOT NULL DEFAULT 0, CreatedCategories int NOT NULL DEFAULT 0, PostedStockLines int NOT NULL DEFAULT 0,
 SkippedRows int NOT NULL DEFAULT 0, ErrorRows int NOT NULL DEFAULT 0, Status nvarchar(40) NOT NULL,
 StartedAt datetime2 NOT NULL, CompletedAt datetime2 NULL, CreatedBy uniqueidentifier NULL, Notes nvarchar(max) NULL, IsActive bit NOT NULL DEFAULT 1
);
GO
IF OBJECT_ID('catalogue.ImportErrors') IS NULL CREATE TABLE catalogue.ImportErrors(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BatchId uniqueidentifier NOT NULL, SheetName nvarchar(120) NULL, RowNumber int NULL,
 EntityType nvarchar(50) NULL, EntityKey nvarchar(120) NULL, Severity nvarchar(20) NOT NULL, ErrorCode nvarchar(50) NULL,
 Message nvarchar(1000) NOT NULL, RawData nvarchar(max) NULL, CreatedAt datetime2 NOT NULL, IsResolved bit NOT NULL DEFAULT 0,
 ResolvedAt datetime2 NULL, ResolvedBy uniqueidentifier NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT FK_ImportErrors_Batch FOREIGN KEY(BatchId) REFERENCES catalogue.ImportBatches(Id)
);
GO
IF OBJECT_ID('catalogue.ImportRollbacks') IS NULL CREATE TABLE catalogue.ImportRollbacks(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BatchId uniqueidentifier NOT NULL, RollbackNumber nvarchar(40) NOT NULL,
 Reason nvarchar(1000) NOT NULL, ProductsDeactivated int NOT NULL DEFAULT 0, StockReversed int NOT NULL DEFAULT 0,
 CategoriesDeactivated int NOT NULL DEFAULT 0, Status nvarchar(40) NOT NULL, CreatedAt datetime2 NOT NULL,
 CreatedBy uniqueidentifier NULL, CompletedAt datetime2 NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT FK_ImportRollbacks_Batch FOREIGN KEY(BatchId) REFERENCES catalogue.ImportBatches(Id)
);
GO

IF OBJECT_ID('catalogue.ImportBatchItems') IS NULL CREATE TABLE catalogue.ImportBatchItems(
 Id uniqueidentifier NOT NULL PRIMARY KEY, BatchId uniqueidentifier NOT NULL, ItemType nvarchar(40) NOT NULL, EntityId uniqueidentifier NULL,
 EntityCode nvarchar(120) NULL, WarehouseId uniqueidentifier NULL, Quantity decimal(18,4) NOT NULL DEFAULT 0, CreatedAt datetime2 NOT NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT FK_ImportBatchItems_Batch FOREIGN KEY(BatchId) REFERENCES catalogue.ImportBatches(Id)
);
GO
