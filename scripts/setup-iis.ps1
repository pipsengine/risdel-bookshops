# Configure IIS site + reverse proxy for Risdel Bookshops.
# Run elevated (Administrator):
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-iis.ps1
param(
  [string]$SiteName = "RisdelBooks",
  [int]$Port = 80,
  [int]$NodePort = 3000,
  [string]$AppPoolName = "RisdelBooksAppPool"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$logFile = Join-Path $root "backups\iis-setup.log"
New-Item -ItemType Directory -Force -Path (Join-Path $root "backups") | Out-Null
function Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logFile -Value $line
  Write-Host $line
}

try {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )
  if (-not $isAdmin) { throw "This script must be run as Administrator." }

  Log "Starting IIS setup for $SiteName -> 127.0.0.1:$NodePort"

  $sitePath = Join-Path $root "deploy\iis"
  $webConfig = Join-Path $sitePath "web.config"
  New-Item -ItemType Directory -Force -Path $sitePath | Out-Null

  @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="RisdelBooksReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:$NodePort/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
    <security>
      <requestFiltering allowDoubleEscaping="true" />
    </security>
  </system.webServer>
</configuration>
"@ | Set-Content -Path $webConfig -Encoding UTF8
  Log "Wrote $webConfig"

  # Ensure ARR module is registered if files exist but module is missing
  $arrDll = "C:\Program Files\IIS\Application Request Routing\requestRouter.dll"
  $arrInetsrv = Join-Path $env:SystemRoot "System32\inetsrv\requestRouter.dll"
  if ((Test-Path $arrDll) -and -not (Test-Path $arrInetsrv)) {
    Log "ARR files found but not registered in inetsrv. Attempting registration..."
    & "$env:SystemRoot\System32\inetsrv\appcmd.exe" install module /name:ApplicationRequestRouting /image:"$arrDll" 2>&1 | ForEach-Object { Log $_ }
  }

  Import-Module WebAdministration -ErrorAction Stop
  Log "WebAdministration module loaded"

  try {
    Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "True"
    Log "ARR proxy enabled"
  } catch {
    Log "WARNING: Could not enable ARR proxy: $($_.Exception.Message)"
    Log "Install/repair Application Request Routing, then enable Proxy in IIS Manager."
  }

  if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    New-WebAppPool -Name $AppPoolName | Out-Null
    Log "Created app pool $AppPoolName"
  } else {
    Log "App pool $AppPoolName already exists"
  }
  Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
  try { Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name startMode -Value "AlwaysRunning" } catch { Log "WARNING: startMode: $($_.Exception.Message)" }

  $existing = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
  if ($existing) {
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $sitePath
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPoolName
    # Ensure dedicated port binding (avoid fighting Default Web Site on :80)
    $hasPort = $false
    Get-WebBinding -Name $SiteName -ErrorAction SilentlyContinue | ForEach-Object {
      if ($_.bindingInformation -match ":$Port:") { $hasPort = $true }
    }
    if (-not $hasPort) {
      New-WebBinding -Name $SiteName -Protocol http -Port $Port -IPAddress "*" -ErrorAction SilentlyContinue
      Log "Ensured binding on port $Port"
    }
    Log "Updated site $SiteName"
  } else {
    New-Website -Name $SiteName -Port $Port -PhysicalPath $sitePath -ApplicationPool $AppPoolName | Out-Null
    Log "Created site $SiteName on port $Port"
  }

  Start-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
  try {
    Start-Website -Name $SiteName
    Log "Site started"
  } catch {
    Log "WARNING starting site: $($_.Exception.Message)"
    # Port conflict often means another site owns the port
    Log "If port $Port is in use, re-run with -Port <freePort>"
  }

  Log "SUCCESS. Browse http://localhost:$Port (Node must be running on $NodePort)"
  exit 0
} catch {
  Log "ERROR: $($_.Exception.Message)"
  Log $_.ScriptStackTrace
  exit 1
}
