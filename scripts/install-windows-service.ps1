# Install Risdel Books Node process as a Windows service via NSSM (for IIS backend).
# Prerequisites: download NSSM and place nssm.exe on PATH, or pass -NssmPath.
# Run elevated:
#   powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-service.ps1
param(
  [string]$ServiceName = "RisdelBooks",
  [string]$NssmPath = ""
)

$ErrorActionPreference = "Stop"
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
  throw "This script must be run as Administrator."
}

$root = Split-Path $PSScriptRoot -Parent
$standalone = Join-Path $root ".next\standalone"
$serverJs = Join-Path $standalone "server.js"
if (-not (Test-Path $serverJs)) {
  throw "Missing $serverJs. Run npm run build first, then .\scripts\start-prod.ps1 once to stage assets."
}

$nssm = $NssmPath
if (-not $nssm) {
  $cmd = Get-Command nssm -ErrorAction SilentlyContinue
  if ($cmd) { $nssm = $cmd.Source }
}
if (-not $nssm) {
  $candidates = @(
    "C:\Tools\nssm\nssm.exe",
    "C:\Program Files\nssm\nssm.exe",
    Join-Path $root "tools\nssm\nssm.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { $nssm = $c; break }
  }
}
if (-not $nssm -or -not (Test-Path $nssm)) {
  throw @"
NSSM not found. Download from https://nssm.cc/download
Extract win64\nssm.exe and re-run with:
  .\scripts\install-windows-service.ps1 -NssmPath 'C:\path\to\nssm.exe'
"@
}

$node = (Get-Command node).Source
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  & $nssm stop $ServiceName
  & $nssm remove $ServiceName confirm
}

& $nssm install $ServiceName $node $serverJs
& $nssm set $ServiceName AppDirectory $standalone
& $nssm set $ServiceName AppEnvironmentExtra "PORT=3000" "HOSTNAME=127.0.0.1" "NODE_ENV=production"
& $nssm set $ServiceName DisplayName "Risdel Books"
& $nssm set $ServiceName Description "Risdel Books Next.js standalone server (IIS reverse-proxy backend)"
& $nssm set $ServiceName Start SERVICE_AUTO_START
& $nssm set $ServiceName AppStdout (Join-Path $root "backups\risdel-books-service.out.log")
& $nssm set $ServiceName AppStderr (Join-Path $root "backups\risdel-books-service.err.log")
& $nssm set $ServiceName AppRotateFiles 1
& $nssm start $ServiceName

Write-Host "Windows service '$ServiceName' installed and started."
Write-Host "IIS can now proxy to http://127.0.0.1:3000"
