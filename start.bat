:: File: start.bat (Windows)
@echo off
echo ========================================================
echo Starting CIVIX Smart Waste Management Platform
echo ========================================================

echo Starting FastAPI Backend Server...
start "Civix FastAPI Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe run.py"

echo Starting React Frontend Dev Server...
start "Civix React Frontend" cmd /k "cd /d %~dp0frontend\app && npm run dev"

echo.
echo ========================================================
echo FastAPI Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)
echo React Frontend:   http://localhost:3000 (or http://localhost:5173)
echo ========================================================
echo.