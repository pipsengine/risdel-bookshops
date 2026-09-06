# IIS deployment blueprint
Risdel Books builds with Next.js `output: standalone` and runs as a managed Node.js process behind IIS.

## Server prerequisites
- Windows with IIS enabled
- [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
- [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing) — enable **Proxy** in IIS Manager → server node → Application Request Routing Cache → Server Proxy Settings
- Node.js 22+ (this machine currently uses the installed Node runtime)
- SQL Server connectivity
- Valid TLS certificate (production)

## Local / same-machine setup

### 1. Terminal (development)
```powershell
cd "C:\Projects Development\risdel-books"
.\start-dev.cmd
```
Open `http://localhost:3000`.

### 2. Production Node process (IIS backend)
```powershell
cd "C:\Projects Development\risdel-books"
npm run build
.\start-prod.cmd
```
This listens on `http://127.0.0.1:3000`.

### 3. IIS reverse proxy (Administrator PowerShell)
```powershell
cd "C:\Projects Development\risdel-books"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-iis.ps1
```
Or double-click `setup-iis.cmd` and accept the UAC prompt.

Default IIS URL after first successful setup on this machine: `http://localhost` (site **RisdelBooks** on port 80).
To avoid conflicting with Default Web Site, re-run with a dedicated port:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-iis.ps1 -Port 3080
```
Node backend must stay running on `http://127.0.0.1:3000`.

### 4. Optional: Windows service for the Node backend
Install [NSSM](https://nssm.cc/download), then:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-service.ps1 -NssmPath "C:\path\to\nssm.exe"
```

## Release flow
1. Copy release source/artifact to a versioned deployment directory.
2. Create production `.env` outside source control.
3. `npm ci` then `npm run build` in the build environment.
4. Run the standalone server as a Windows managed service (`scripts\install-windows-service.ps1` or WinSW).
5. Bind IIS HTTPS site and reverse proxy to `http://127.0.0.1:3000` (`scripts\setup-iis.ps1`).
6. Redirect HTTP to HTTPS.
7. Verify `/api/health`, login, storage and SQL connectivity.
8. Keep previous release directory for rollback.

## Production controls
Do not expose Node directly to the public internet. Do not store production passwords in source control. Back up SQL Server independently and test restores periodically.
Do not run `start-dev` and `start-prod` on port 3000 at the same time.
