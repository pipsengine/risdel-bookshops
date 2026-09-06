/* Risdel Books Module 01 - Authentication, Users, Roles & Permissions */
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('auth.UserSessions') IS NULL CREATE TABLE auth.UserSessions(
 Id uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 UserId uniqueidentifier NOT NULL,
 TokenHash nvarchar(128) NOT NULL,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
 LastSeenAt datetime2 NULL,
 ExpiresAt datetime2 NOT NULL,
 RevokedAt datetime2 NULL,
 CONSTRAINT FK_UserSessions_User FOREIGN KEY(UserId) REFERENCES auth.Users(Id)
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_UserSessions_User_Expires') CREATE INDEX IX_UserSessions_User_Expires ON auth.UserSessions(UserId,ExpiresAt);
IF OBJECT_ID('auth.PasswordHistory') IS NULL CREATE TABLE auth.PasswordHistory(
 Id uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
 UserId uniqueidentifier NOT NULL,
 PasswordHash nvarchar(500) NOT NULL,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_PasswordHistory_User FOREIGN KEY(UserId) REFERENCES auth.Users(Id)
);
IF COL_LENGTH('auth.Users','Phone') IS NULL ALTER TABLE auth.Users ADD Phone nvarchar(50) NULL;
IF COL_LENGTH('auth.Users','JobTitle') IS NULL ALTER TABLE auth.Users ADD JobTitle nvarchar(120) NULL;
IF COL_LENGTH('auth.Users','LastPasswordChangedAt') IS NULL ALTER TABLE auth.Users ADD LastPasswordChangedAt datetime2 NULL;
IF COL_LENGTH('auth.Users','PasswordExpiresAt') IS NULL ALTER TABLE auth.Users ADD PasswordExpiresAt datetime2 NULL;
IF COL_LENGTH('auth.Users','UpdatedBy') IS NULL ALTER TABLE auth.Users ADD UpdatedBy uniqueidentifier NULL;

DECLARE @Perms TABLE(PermissionKey nvarchar(180),Module nvarchar(80),Name nvarchar(150),Description nvarchar(500));
INSERT @Perms VALUES
('security.overview.view','security','View security overview','View authentication and access-control health.'),
('security.login_history.view','security','View login history','Review successful and failed login attempts.'),
('security.sessions.view','security','View sessions','Review active and historical sessions.'),
('security.password.reset','security','Reset user passwords','Issue temporary passwords and require a password change.'),
('admin.users.view','administration','View users','View the user directory.'),
('admin.users.create','administration','Create users','Create new Risdel Books accounts.'),
('admin.users.update','administration','Update users','Edit account details and role assignment.'),
('admin.users.activate','administration','Activate or deactivate users','Control whether an account can sign in.'),
('admin.roles.view','administration','View roles','View system and custom roles.'),
('admin.roles.create','administration','Create roles','Create custom security roles.'),
('admin.roles.update','administration','Update roles','Change custom role status and details.'),
('admin.permissions.assign','administration','Assign permissions','Grant or remove permissions from roles.'),
('profile.view','profile','View own profile','View signed-in account information.'),
('profile.password.change','profile','Change own password','Change own account password.');
INSERT auth.Permissions(PermissionKey,Module,Name,Description)
SELECT p.PermissionKey,p.Module,p.Name,p.Description FROM @Perms p WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions x WHERE x.PermissionKey=p.PermissionKey);
DECLARE @Super uniqueidentifier=(SELECT Id FROM auth.Roles WHERE Code='SUPER_ADMIN');
INSERT auth.RolePermissions(RoleId,PermissionId) SELECT @Super,p.Id FROM auth.Permissions p WHERE @Super IS NOT NULL AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=@Super AND rp.PermissionId=p.Id);
-- Practical default access for management roles. Fine-tune from Administration > Roles.
DECLARE @ManagerCodes TABLE(Code nvarchar(80));INSERT @ManagerCodes VALUES('MANAGING_DIRECTOR'),('OPERATIONS_MANAGER'),('STORE_MANAGER');
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p JOIN @ManagerCodes m ON m.Code=r.Code
WHERE p.PermissionKey IN('dashboard.view','admin.users.view','admin.roles.view','security.overview.view','security.login_history.view','security.sessions.view','profile.view','profile.password.change') AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code='AUDITOR' AND p.PermissionKey IN('dashboard.view','audit.view','security.login_history.view','profile.view','profile.password.change') AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
INSERT auth.RolePermissions(RoleId,PermissionId)
SELECT r.Id,p.Id FROM auth.Roles r CROSS JOIN auth.Permissions p
WHERE r.Code NOT IN('SUPER_ADMIN') AND p.PermissionKey IN('dashboard.view','profile.view','profile.password.change') AND NOT EXISTS(SELECT 1 FROM auth.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);
COMMIT TRANSACTION;
