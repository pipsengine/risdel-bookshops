/* Risdel Books v0.6.0 — Module 05: Academic & Catalogue Master Data
   Additive SQL Server migration retained for the future relational provider. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('catalogue.Curricula','U') IS NULL CREATE TABLE catalogue.Curricula(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_Curricula PRIMARY KEY DEFAULT NEWSEQUENTIALID(), Code nvarchar(40) NOT NULL UNIQUE, Name nvarchar(160) NOT NULL,
 Authority nvarchar(160) NULL, Country nvarchar(100) NULL, Description nvarchar(500) NULL, IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL
);
IF OBJECT_ID('catalogue.AcademicSessions','U') IS NULL CREATE TABLE catalogue.AcademicSessions(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_AcademicSessions PRIMARY KEY DEFAULT NEWSEQUENTIALID(), Code nvarchar(40) NOT NULL UNIQUE, Name nvarchar(160) NOT NULL,
 StartDate date NULL, EndDate date NULL, IsCurrent bit NOT NULL DEFAULT 0, Description nvarchar(500) NULL, IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL
);
IF OBJECT_ID('catalogue.Terms','U') IS NULL CREATE TABLE catalogue.Terms(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_Terms PRIMARY KEY DEFAULT NEWSEQUENTIALID(), SessionId uniqueidentifier NOT NULL, Code nvarchar(40) NOT NULL, Name nvarchar(120) NOT NULL,
 SortOrder int NOT NULL DEFAULT 1, StartDate date NULL, EndDate date NULL, Description nvarchar(500) NULL, IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL, UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL,
 CONSTRAINT FK_Terms_Session FOREIGN KEY(SessionId) REFERENCES catalogue.AcademicSessions(Id), CONSTRAINT UQ_Terms_SessionCode UNIQUE(SessionId,Code)
);
IF OBJECT_ID('catalogue.Classes','U') IS NULL CREATE TABLE catalogue.Classes(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_Classes PRIMARY KEY DEFAULT NEWSEQUENTIALID(), AcademicLevelId uniqueidentifier NOT NULL, Code nvarchar(40) NOT NULL UNIQUE, Name nvarchar(120) NOT NULL,
 SortOrder int NOT NULL DEFAULT 1, Description nvarchar(500) NULL, IsActive bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL, CONSTRAINT FK_Classes_AcademicLevel FOREIGN KEY(AcademicLevelId) REFERENCES catalogue.AcademicLevels(Id)
);
IF OBJECT_ID('catalogue.CategoryHierarchy','U') IS NULL CREATE TABLE catalogue.CategoryHierarchy(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_CategoryHierarchy PRIMARY KEY DEFAULT NEWSEQUENTIALID(), ParentCategoryId uniqueidentifier NOT NULL, ChildCategoryId uniqueidentifier NOT NULL,
 SortOrder int NOT NULL DEFAULT 0, IsActive bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL,
 CONSTRAINT FK_CategoryHierarchy_Parent FOREIGN KEY(ParentCategoryId) REFERENCES catalogue.Categories(Id), CONSTRAINT FK_CategoryHierarchy_Child FOREIGN KEY(ChildCategoryId) REFERENCES catalogue.Categories(Id)
);
IF OBJECT_ID('catalogue.PublisherImprints','U') IS NULL CREATE TABLE catalogue.PublisherImprints(
 Id uniqueidentifier NOT NULL CONSTRAINT PK_PublisherImprints PRIMARY KEY DEFAULT NEWSEQUENTIALID(), PublisherId uniqueidentifier NOT NULL, Code nvarchar(40) NOT NULL UNIQUE,
 Name nvarchar(160) NOT NULL, Description nvarchar(500) NULL, IsActive bit NOT NULL DEFAULT 1, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NULL,
 UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedBy uniqueidentifier NULL, CONSTRAINT FK_PublisherImprints_Publisher FOREIGN KEY(PublisherId) REFERENCES catalogue.Publishers(Id)
);
IF COL_LENGTH('catalogue.Books','CurriculumId') IS NULL ALTER TABLE catalogue.Books ADD CurriculumId uniqueidentifier NULL;
IF COL_LENGTH('catalogue.Books','ClassId') IS NULL ALTER TABLE catalogue.Books ADD ClassId uniqueidentifier NULL;
COMMIT TRANSACTION;
