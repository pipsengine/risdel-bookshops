# Start Risdel Bookshops production Node server (used by IIS reverse proxy).
# Usage: .\scripts\start-prod.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$standalone = Join-Path $root ".next\standalone"
$serverJs = Join-Path $standalone "server.js"
if (-not (Test-Path $serverJs)) {
  Write-Host "Standalone build missing. Running npm run build..."
  npm run build
}

# Ensure static assets are present beside standalone server
$staticSrc = Join-Path $root ".next\static"
$staticDst = Join-Path $standalone ".next\static"
New-Item -ItemType Directory -Force -Path (Join-Path $standalone ".next") | Out-Null
if (Test-Path $staticSrc) {
  if (Test-Path $staticDst) { Remove-Item $staticDst -Recurse -Force }
  Copy-Item $staticSrc $staticDst -Recurse -Force
}
if (Test-Path (Join-Path $root "public")) {
  Copy-Item (Join-Path $root "public") (Join-Path $standalone "public") -Recurse -Force
}

# Prefer production env for IIS-backed process
foreach ($name in @(".env.production.local", ".env.local", ".env")) {
  $src = Join-Path $root $name
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $standalone ".env") -Force
    Copy-Item $src (Join-Path $standalone ".env.local") -Force
    break
  }
}

$env:PORT = "3000"
$env:HOSTNAME = "127.0.0.1"
$env:NODE_PATH = Join-Path $root "node_modules"
Set-Location $standalone
Write-Host "Starting Risdel Bookshops (production) at http://127.0.0.1:3000"
Write-Host "IIS should reverse-proxy to this process. Stop with Ctrl+C"
node server.js
