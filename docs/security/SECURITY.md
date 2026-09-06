# Security baseline
- HTTPS in production.
- Signed HttpOnly SameSite session cookie; production cookie is Secure.
- Externalised secrets in environment variables.
- SQL application user must use least privilege; never use `sa` from the application.
- Security headers are configured in Next.js.
- Database queries must remain parameterized.
- File uploads must be restricted by MIME, extension, size and storage path in later document module work.
- Module 01 will replace bootstrap environment credentials with database users, password hashing, lockout, password history and full RBAC enforcement.
- Rotate `AUTH_SECRET` and bootstrap credentials before any production exposure.
