@echo off
setlocal
cd /d "%~dp0"
set "GAME_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "GAME_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Project dependencies are missing. See README.md for installation steps.
  pause
  exit /b 1
)
echo Arianna - bedroom cleanup prototype
echo Open the Local URL printed below in your browser.
echo For iPhone testing, open the Network URL on the same Wi-Fi.
echo Press Ctrl+C to stop the server.
"%GAME_NODE%" "node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5173
pause
