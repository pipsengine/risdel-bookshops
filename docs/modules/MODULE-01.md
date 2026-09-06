# Module 01 — Authentication, Users, Roles & Permissions
Version: 0.2.0

## Scope delivered
- Database-backed authentication and initial Super Administrator provisioning
- Secure scrypt password hashing and configurable lockout
- Forced password changes after account creation/reset
- User creation, profile/access editing, role reassignment, activation/deactivation and unlock
- Administrator password reset with session invalidation
- Roles, custom roles and granular permission assignment
- Server-side authorization helpers and role-aware navigation
- Login history, security dashboard and database session visibility
- Audit events for user, role, permission and password administration

## Database change
Apply `scripts/database/003_module01_auth_security.sql` after the Module 00 migrations.

The migration adds `auth.UserSessions`, `auth.PasswordHistory`, user-security fields and the Module 01 permission catalogue. It is additive and preserves the existing database.

## Acceptance coverage
- Invalid credentials rejected
- Inactive and locked accounts rejected
- Failed-login counter and lockout implemented
- Bootstrap administrator can provision the first SQL-backed Super Administrator
- New users receive a temporary password and forced password change
- User activation/deactivation audited
- Password reset invalidates stored sessions
- Role permission changes audited
- Server pages use permission checks rather than UI hiding alone
- Super Administrator cannot be normally deactivated
