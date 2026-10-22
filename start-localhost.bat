@echo off
title RVS Constructions - localhost
cd /d "%~dp0"
echo ==========================================================
echo   RVS Constructions website - local preview
echo ==========================================================
echo.

set "PYCMD="
py -3 --version >nul 2>nul && set "PYCMD=py -3"
if not defined PYCMD (
  python --version >nul 2>nul && set "PYCMD=python"
)

if defined PYCMD (
  echo Found Python. Starting server on http://localhost:8000 ...
  echo Keep this window OPEN while you view the site. Close it to stop.
  echo.
  start "" cmd /c "timeout /t 3 /nobreak >nul & start "" http://localhost:8000/index.html"
  %PYCMD% -m http.server 8000
  echo.
  echo The server stopped. If you saw an error above, take a screenshot and share it.
  pause
  goto :eof
)

node --version >nul 2>nul
if %errorlevel%==0 (
  echo Found Node.js. Starting server on http://localhost:8000 ...
  echo Keep this window OPEN while you view the site. Close it to stop.
  echo.
  start "" cmd /c "timeout /t 6 /nobreak >nul & start "" http://localhost:8000/index.html"
  npx --yes http-server -p 8000 -c-1 .
  pause
  goto :eof
)

echo Python and Node.js are not installed on this computer, so a localhost
echo server cannot start.
echo.
echo Opening the website directly in your browser instead...
start "" "%~dp0index.html"
echo.
echo To use localhost later, install Python from https://www.python.org/downloads/
echo (tick "Add python.exe to PATH" during install) and run this file again.
echo.
pause
