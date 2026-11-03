@echo off
echo ==============================================
echo   Starting SMART-CAMPUS-Complaint System
echo ==============================================

set "NODE_PATH=C:\Program Files\Unity\Hub\Editor\6000.6.6f1\Editor\Data\PlaybackEngines\WebGLSupport\BuildTools\Emscripten\node"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

echo Starting SMART-CAMPUS-Complaint Backend on port 5000...
start "SMART-CAMPUS-Complaint Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 >nul

echo Starting SMART-CAMPUS-Complaint Frontend on port 5173...
start "SMART-CAMPUS-Complaint Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers started!
echo Opening browser to http://localhost:5173 ...
timeout /t 2 >nul
start http://localhost:5173
echo ==============================================

