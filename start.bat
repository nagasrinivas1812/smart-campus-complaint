@echo off
echo ==============================================
echo   Starting Smart Campus Complaint System
echo ==============================================

set "NODE_PATH=C:\Program Files\Unity\Hub\Editor\6000.6.6f1\Editor\Data\PlaybackEngines\WebGLSupport\BuildTools\Emscripten\node"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

echo Starting Backend Server on port 5000...
start "Smart Campus Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 >nul

echo Starting Frontend Dev Server on port 5173...
start "Smart Campus Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo ==============================================

