/* Risdel Books Module 02 - Company, Branch & Warehouse Setup */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

/* Extend organisation masters without replacing Module 00 data. */
IF COL_LENGTH('system.Companies','Website') IS NULL ALTER TABLE system.Companies ADD Website nvarchar(250) NULL;
IF COL_LENGTH('system.Companies','PostalCode') IS NULL ALTER TABLE system.Companies ADD PostalCode nvarchar(30) NULL;
IF COL_LENGTH('system.Companies','BusinessType') IS NULL ALTER TABLE system.Companies ADD BusinessType nvarchar(100) NULL;
IF COL_LENGTH('system.Companies','DefaultTaxCode') IS NULL ALTER TABLE system.Companies ADD DefaultTaxCode nvarchar(30) NULL;
IF COL_LENGTH('system.Companies','ReceiptFooter') IS NULL ALTER TABLE system.Companies ADD ReceiptFooter nvarchar(500) NULL;
IF COL_LENGTH('system.Companies','UpdatedBy') IS NULL ALTER TABLE system.Companies ADD UpdatedBy uniqueidentifier NULL;

IF COL_LENGTH('system.Branches','ManagerId') IS NULL ALTER TABLE system.Branches ADD ManagerId uniqueidentifier NULL;
IF COL_LENGTH('system.Branches','PostalCode') IS NULL ALTER TABLE system.Branches ADD PostalCode nvarchar(30) NULL;
IF COL_LENGTH('system.Branches','OpeningDate') IS NULL ALTER TABLE system.Branches ADD OpeningDate date NULL;
IF COL_LENGTH('system.Branches','Notes') IS NULL ALTER TABLE system.Branches ADD Notes nvarchar(1000) NULL;
IF COL_LENGTH('system.Branches','UpdatedBy') IS NULL ALTER TABLE system.Branches ADD UpdatedBy uniqueidentifier NULL;

IF COL_LENGTH('system.Warehouses','ManagerId') IS NULL ALTER TABLE system.Warehouses ADD ManagerId uniqueidentifier NULL;
IF COL_LENGTH('system.Warehouses','IsDefault') IS NULL ALTER TABLE system.Warehouses ADD IsDefault bit NOT NULL CONSTRAINT DF_Warehouses_IsDefault DEFAULT 0;
IF COL_LENGTH('system.Warehouses','AllowNegativeStock') IS NULL ALTER TABLE system.Warehouses ADD AllowNegativeStock bit NOT NULL CONSTRAINT DF_Warehouses_AllowNegative DEFAULT 0;
IF COL_LENGTH('system.Warehouses','Notes') IS NULL ALTER TABLE system.Warehouses ADD Notes nvarchar(1000) NULL;
IF COL_LENGTH('system.Warehouses','UpdatedBy') IS NULL ALTER TABLE system.Warehouses ADD UpdatedBy uniqueidentifier NULL;

IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_Branches_Manager')
 ALTER TABLE system.Branches ADD CONSTRAINT FK_Branches_Manager FOREIGN KEY(ManagerId) REFERENCES auth.Users(Id);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_Warehouses_Manager')
 ALTER TABLE system.Warehouses ADD CONSTRAINT FK_Warehouses_Manager FOREIGN KEY(ManagerId) REFERENCES auth.Users(Id);

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_Branches_Company_Active') CREATE INDEX IX_Branches_Company_Active ON system.Branches(CompanyId,IsActive,Name);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_Warehouses_Branch_Active') CREATE INDEX IX_Warehouses_Branch_Active ON system.Warehouses(BranchId,IsActive,Name);

DECLARE @Perms TABLE(PermissionKey nvarchar(180),Module nvarchar(80),Name nvarchar(150),Description nvarchar(500));
INSERT @Perms VALUES
('organisation.overview.view','organisation','View organisation overview','View company, branch and warehouse operating structure.'),
('organisation.company.view','organisation','View company profile','View Risdel Enterprise profile and statutory information.'),
('organisation.company.update','organisation','Update company profile','Edit company identity, contact and default business settings.'),
('organisation.branches.view','organisation','View branches','View branch directory and operating status.'),
('organisation.branches.create','organisation','Create branches','Create a new branch or operating location.'),
('organisation.branches.update','organisation','Update branches','Edit branch details and status.'),
('organisation.warehouses.view','organisation','View warehouses','View warehouse and stock-location directory.'),
('organisation.warehouses.create','organisation','Create warehouses','Create warehouses and stock locations.'),
('organisation.warehouses.update','organisation','Update warehouses','Edit warehouse operating controls and status.');
INSERT auth.Permissions(PermissionKey,Module,Name,Description)
SELECT p.PermissionKey,p.Module,p.Name,p.Description FROM @Perms p WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions x WHERE x.PermissionKey=p.PermissionKey);

DECLARE @Super uniqueidentifier=(SELECT Id FROM auth.Roles WHERE Code='SUPER_ADMIN');
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT @Super,p.Id FROM auth.Permissions p WHERE @Super IS NOT NULL AND p.Module='organisation' AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=@Super AND rp.PermissionId=p.Id);

/* Sensible management defaults, still editable from the Module 01 permission matrix. */
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code IN('MANAGING_DIRECTOR','OPERATIONS_MANAGER') AND p.Module='organisation'
AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code='STORE_MANAGER' AND p.PermissionKey IN('organisation.overview.view','organisation.company.view','organisation.branches.view','organisation.warehouses.view','organisation.warehouses.create','organisation.warehouses.update')
AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code IN('INVENTORY_OFFICER','PROCUREMENT_OFFICER','AUDITOR') AND p.PermissionKey IN('organisation.overview.view','organisation.company.view','organisation.branches.view','organisation.warehouses.view')
AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);

/* Ensure the seeded location has one default warehouse. */
UPDATE w SET IsDefault=1 FROM system.Warehouses w
JOIN system.Branches b ON b.Id=w.BranchId
WHERE b.IsHeadOffice=1 AND w.Id=(SELECT TOP 1 w2.Id FROM system.Warehouses w2 WHERE w2.BranchId=b.Id ORDER BY w2.CreatedAt,w2.Name);

COMMIT TRANSACTION;
