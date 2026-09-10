@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 server\app.py --open
) else (
  python server\app.py --open
)
if errorlevel 1 (
  echo.
  echo Python 3.10 or later is required. See START_HERE.md.
  pause
)
