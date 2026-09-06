@echo off
:: Double-click to configure IIS (UAC elevation required)
cd /d "%~dp0"
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0scripts\setup-iis.ps1\"' -Wait"
echo.
echo Setup finished. Check backups\iis-setup.log if anything failed.
echo Keep Node running with start-prod.cmd (or the Windows service).
pause
