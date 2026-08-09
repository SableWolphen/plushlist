@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Close and reopen this window, then try again.
  pause
  exit /b 1
)

call npm.cmd ci
if errorlevel 1 goto :failed

if /i "%~1"=="--check" (
  call node scripts\run-zeus.js --help
  exit /b %errorlevel%
)

call npm.cmd run preview
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo PlushLife preview could not start. Leave this window open for troubleshooting.
pause
exit /b 1
