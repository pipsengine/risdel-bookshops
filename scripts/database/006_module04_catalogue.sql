/* Risdel Books Module 04 - Product & Book Catalogue. Preserved for future SQL Server provider migration. */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name='catalogue') EXEC('CREATE SCHEMA catalogue');
GO
IF OBJECT_ID('catalogue.Products') IS NULL CREATE TABLE catalogue.Products(
 Id uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(), Code nvarchar(40) NOT NULL UNIQUE, Name nvarchar(250) NOT NULL, ProductType nvarchar(40) NOT NULL,
 CategoryId uniqueidentifier NULL, Description nvarchar(max) NULL, UnitOfMeasure nvarchar(40) NOT NULL DEFAULT 'Each', CostPrice decimal(19,4) NOT NULL DEFAULT 0,
 SellingPrice decimal(19,4) NOT NULL DEFAULT 0, TaxCode nvarchar(40) NULL, ReorderLevel decimal(19,4) NOT NULL DEFAULT 0, SafetyStock decimal(19,4) NOT NULL DEFAULT 0,
 TrackInventory bit NOT NULL DEFAULT 1, ImageUrl nvarchar(1000) NULL, Status nvarchar(30) NOT NULL DEFAULT 'ACTIVE', IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL);
GO
IF OBJECT_ID('catalogue.Books') IS NULL CREATE TABLE catalogue.Books(Id uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),ProductId uniqueidentifier NOT NULL UNIQUE,ISBN10 nvarchar(20) NULL,ISBN13 nvarchar(20) NULL,PublisherId uniqueidentifier NULL,Edition nvarchar(80) NULL,PublicationYear int NULL,Language nvarchar(80) NULL,Format nvarchar(80) NULL,PageCount int NULL,SubjectId uniqueidentifier NULL,AcademicLevelId uniqueidentifier NULL,Curriculum nvarchar(200) NULL,ClassLevel nvarchar(80) NULL,IsActive bit NOT NULL DEFAULT 1,CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),CONSTRAINT FK_Books_Product FOREIGN KEY(ProductId) REFERENCES catalogue.Products(Id));
GO
