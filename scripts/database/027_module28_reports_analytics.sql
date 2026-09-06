-- Risdel Books Module 28 — Reports & Analytics
-- Future relational database migration reference.
IF SCHEMA_ID('reporting') IS NULL EXEC('CREATE SCHEMA reporting');
GO
IF OBJECT_ID('reporting.SavedViews') IS NULL
CREATE TABLE reporting.SavedViews(
 Id uniqueidentifier NOT NULL PRIMARY KEY,
 Name nvarchar(200) NOT NULL,
 ReportType nvarchar(80) NOT NULL,
 Filters nvarchar(max) NULL,
 OwnerUserId uniqueidentifier NULL,
 IsShared bit NOT NULL DEFAULT 0,
 CreatedAt datetime2 NOT NULL DEFAULT sysutcdatetime(),
 UpdatedAt datetime2 NULL,
 IsActive bit NOT NULL DEFAULT 1
);
GO
IF OBJECT_ID('reporting.Exports') IS NULL
CREATE TABLE reporting.Exports(
 Id uniqueidentifier NOT NULL PRIMARY KEY,
 ReportType nvarchar(80) NOT NULL,
 Format nvarchar(20) NOT NULL,
 Filters nvarchar(max) NULL,
 RowCount int NOT NULL DEFAULT 0,
 RequestedBy nvarchar(200) NULL,
 RequestedAt datetime2 NOT NULL DEFAULT sysutcdatetime(),
 Status nvarchar(40) NOT NULL,
 IsActive bit NOT NULL DEFAULT 1
);
GO
