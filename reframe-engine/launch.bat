@echo off
title Reframe Engine Launcher
echo Starting Reframe Engine...
echo.

:: Start backend in a new window
start "" "Backend Server" cmd /k "cd /d "%~dp0" && npm start"

:: Wait a moment for backend to start
timeout /t 3 >nul

:: Start frontend in a new window
start "" "Frontend UI" cmd /k "cd /d "%~dp0\src\client" && npm run dev"

echo.
echo Both backend and frontend are starting...
echo Backend: http://localhost:4200
echo Frontend: http://localhost:5173
echo.
echo Close this window to stop both applications (you may need to close the backend/frontend windows separately)
pause