/* Run after 001_foundation.sql. Idempotent foundation seed data. */
SET XACT_ABORT ON;BEGIN TRANSACTION;
DECLARE @CompanyId uniqueidentifier,@BranchId uniqueidentifier;
SELECT @CompanyId=Id FROM system.Companies WHERE Code='RISDEL';
IF @CompanyId IS NULL BEGIN SET @CompanyId=NEWID();INSERT system.Companies(Id,Code,Name,TradingName,Country,CurrencyCode,TimeZone) VALUES(@CompanyId,'RISDEL','Risdel Enterprise','Risdel Bookshops','Nigeria','NGN','Africa/Lagos');END;
SELECT @BranchId=Id FROM system.Branches WHERE CompanyId=@CompanyId AND Code='MAIN';
IF @BranchId IS NULL BEGIN SET @BranchId=NEWID();INSERT system.Branches(Id,CompanyId,Code,Name,BranchType,IsHeadOffice) VALUES(@BranchId,@CompanyId,'MAIN','Main Store','RETAIL',1);END;
IF NOT EXISTS(SELECT 1 FROM system.Warehouses WHERE BranchId=@BranchId AND Code='MAIN-STORE') INSERT system.Warehouses(BranchId,Code,Name,WarehouseType,AllowSales) VALUES(@BranchId,'MAIN-STORE','Main Store','STORE',1);
DECLARE @Roles TABLE(Code nvarchar(80),Name nvarchar(120));INSERT @Roles VALUES('SUPER_ADMIN','Super Administrator'),('MANAGING_DIRECTOR','Managing Director'),('OPERATIONS_MANAGER','Operations Manager'),('STORE_MANAGER','Store Manager'),('ACCOUNTANT','Accountant'),('PROCUREMENT_OFFICER','Procurement Officer'),('INVENTORY_OFFICER','Inventory Officer'),('INSTITUTIONAL_SALES','Institutional Sales Officer'),('SALES_SUPERVISOR','Sales Supervisor'),('CASHIER','Cashier'),('AUDITOR','Auditor / Read Only');
INSERT auth.Roles(Code,Name,IsSystem) SELECT r.Code,r.Name,1 FROM @Roles r WHERE NOT EXISTS(SELECT 1 FROM auth.Roles x WHERE x.Code=r.Code);
DECLARE @Perms TABLE(PermissionKey nvarchar(180),Module nvarchar(80),Name nvarchar(150));INSERT @Perms VALUES('dashboard.view','dashboard','View dashboard'),('admin.system.view','administration','View system information'),('admin.users.manage','administration','Manage users'),('admin.roles.manage','administration','Manage roles'),('admin.permissions.manage','administration','Manage permissions'),('audit.view','audit','View audit logs');
INSERT auth.Permissions(PermissionKey,Module,Name) SELECT p.PermissionKey,p.Module,p.Name FROM @Perms p WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions x WHERE x.PermissionKey=p.PermissionKey);
DECLARE @SuperRole uniqueidentifier=(SELECT Id FROM auth.Roles WHERE Code='SUPER_ADMIN');INSERT auth.RolePermissions(RoleId,PermissionId) SELECT @SuperRole,p.Id FROM auth.Permissions p WHERE NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=@SuperRole AND rp.PermissionId=p.Id);
IF NOT EXISTS(SELECT 1 FROM system.SystemSettings WHERE Category='General' AND SettingKey='Currency') INSERT system.SystemSettings(Category,SettingKey,SettingValue,Description) VALUES('General','Currency','NGN','Default business currency');
COMMIT TRANSACTION;
