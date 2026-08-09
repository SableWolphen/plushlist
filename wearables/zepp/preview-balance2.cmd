@echo off
setlocal
title PlushLife Balance 2 Preview
cd /d "%~dp0"

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Close and reopen this window, then try again.
  pause
  exit /b 1
)

if not exist "node_modules\@zeppos\zeus-cli\package.json" (
  echo Preparing the Zepp preview tools. This is only needed the first time...
  call npm.cmd ci
  if errorlevel 1 goto :failed
)

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
