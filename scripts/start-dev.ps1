# Start Risdel Books in development mode (terminal).
# Usage: .\scripts\start-dev.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Created .env.local from .env.example — update secrets before use."
}

Write-Host "Starting Risdel Books (dev) at http://localhost:3000"
Write-Host "Stop with Ctrl+C"
npm run dev
