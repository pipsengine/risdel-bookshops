# IIS deployment blueprint
Risdel Bookshops builds with Next.js `output: standalone` and runs as a managed Node.js process behind IIS.

## Server prerequisites
- Windows Server with IIS
- URL Rewrite + Application Request Routing (ARR)
- Node.js 22 LTS-compatible runtime
- SQL Server connectivity
- Valid TLS certificate

## Release flow
1. Copy release source/artifact to a versioned deployment directory.
2. Create production `.env` outside source control.
3. `npm ci` then `npm run build` in the build environment.
4. Run the standalone server as a Windows managed service (NSSM, WinSW, or organisation-approved service wrapper).
5. Bind IIS HTTPS site and reverse proxy to `http://127.0.0.1:3000`.
6. Redirect HTTP to HTTPS.
7. Verify `/api/health`, login, storage and SQL connectivity.
8. Keep previous release directory for rollback.

## Production controls
Do not expose Node directly to the public internet. Do not store production passwords in source control. Back up SQL Server independently and test restores periodically.
