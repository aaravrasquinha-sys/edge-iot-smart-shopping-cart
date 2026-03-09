@echo off
echo Starting GrabCart Application...

echo Starting Flask backend...
start "Flask Backend" cmd /c "python appfinal.py"

timeout /t 3 /nobreak >nul

echo Starting React frontend...
start "React Frontend" cmd /c "npm run dev"

echo ==========================================
echo GrabCart is starting up...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
