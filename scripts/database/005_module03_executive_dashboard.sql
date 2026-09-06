/* Risdel Books Module 03 - Executive Dashboard */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

/* Shared KPI publication layer. Future business modules publish their executive metrics here. */
IF OBJECT_ID('system.DashboardMetrics') IS NULL CREATE TABLE system.DashboardMetrics(
 Id uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 MetricKey nvarchar(120) NOT NULL,
 CompanyId uniqueidentifier NULL,
 BranchId uniqueidentifier NULL,
 NumericValue decimal(19,4) NULL,
 TextValue nvarchar(500) NULL,
 PeriodStart datetime2 NULL,
 PeriodEnd datetime2 NULL,
 IsCurrent bit NOT NULL CONSTRAINT DF_DashboardMetrics_IsCurrent DEFAULT 1,
 UpdatedAt datetime2 NOT NULL CONSTRAINT DF_DashboardMetrics_UpdatedAt DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_DashboardMetrics_Company FOREIGN KEY(CompanyId) REFERENCES system.Companies(Id),
 CONSTRAINT FK_DashboardMetrics_Branch FOREIGN KEY(BranchId) REFERENCES system.Branches(Id)
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_DashboardMetrics_Current') CREATE INDEX IX_DashboardMetrics_Current ON system.DashboardMetrics(MetricKey,BranchId,IsCurrent,UpdatedAt DESC);

IF OBJECT_ID('system.DashboardAlerts') IS NULL CREATE TABLE system.DashboardAlerts(
 Id uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 CompanyId uniqueidentifier NULL,
 BranchId uniqueidentifier NULL,
 AlertKey nvarchar(140) NULL,
 Severity nvarchar(20) NOT NULL CONSTRAINT DF_DashboardAlerts_Severity DEFAULT 'INFO',
 Title nvarchar(180) NOT NULL,
 Message nvarchar(500) NOT NULL,
 Link nvarchar(500) NULL,
 IsActive bit NOT NULL CONSTRAINT DF_DashboardAlerts_IsActive DEFAULT 1,
 CreatedAt datetime2 NOT NULL CONSTRAINT DF_DashboardAlerts_CreatedAt DEFAULT SYSUTCDATETIME(),
 ResolvedAt datetime2 NULL,
 CONSTRAINT FK_DashboardAlerts_Company FOREIGN KEY(CompanyId) REFERENCES system.Companies(Id),
 CONSTRAINT FK_DashboardAlerts_Branch FOREIGN KEY(BranchId) REFERENCES system.Branches(Id)
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_DashboardAlerts_Active') CREATE INDEX IX_DashboardAlerts_Active ON system.DashboardAlerts(IsActive,BranchId,Severity,CreatedAt DESC);

IF OBJECT_ID('system.DashboardPreferences') IS NULL CREATE TABLE system.DashboardPreferences(
 Id uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 UserId uniqueidentifier NOT NULL UNIQUE,
 DefaultBranchId uniqueidentifier NULL,
 CompactMode bit NOT NULL CONSTRAINT DF_DashboardPreferences_Compact DEFAULT 0,
 UpdatedAt datetime2 NOT NULL CONSTRAINT DF_DashboardPreferences_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_DashboardPreferences_User FOREIGN KEY(UserId) REFERENCES auth.Users(Id),
 CONSTRAINT FK_DashboardPreferences_Branch FOREIGN KEY(DefaultBranchId) REFERENCES system.Branches(Id)
);

DECLARE @Perms TABLE(PermissionKey nvarchar(180),Module nvarchar(80),Name nvarchar(150),Description nvarchar(500));
INSERT @Perms VALUES
('dashboard.executive.view','dashboard','View executive dashboard','View executive operational, security and business performance summaries.'),
('dashboard.security.view','dashboard','View dashboard security indicators','View identity and authentication exceptions on the executive dashboard.'),
('dashboard.financial.view','dashboard','View financial dashboard indicators','View sensitive revenue, margin, receivable and payable summary metrics when finance modules are installed.');
INSERT auth.Permissions(PermissionKey,Module,Name,Description)
SELECT p.PermissionKey,p.Module,p.Name,p.Description FROM @Perms p WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions x WHERE x.PermissionKey=p.PermissionKey);

DECLARE @Super uniqueidentifier=(SELECT Id FROM auth.Roles WHERE Code='SUPER_ADMIN');
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT @Super,p.Id FROM auth.Permissions p WHERE @Super IS NOT NULL AND p.Module='dashboard' AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=@Super AND rp.PermissionId=p.Id);

/* Management receives executive visibility; finance visibility remains deliberately narrower. */
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code IN('MANAGING_DIRECTOR','OPERATIONS_MANAGER','STORE_MANAGER') AND p.PermissionKey IN('dashboard.view','dashboard.executive.view','dashboard.security.view')
AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code IN('MANAGING_DIRECTOR','ACCOUNTANT') AND p.PermissionKey='dashboard.financial.view'
AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);

COMMIT TRANSACTION;
