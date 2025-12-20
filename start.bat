@echo off
echo Starting TenantGuard System...
echo.

echo [1/4] Initializing Database...
cd backend
call npm run init-db
if %errorlevel% neq 0 (
    echo Database initialization failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Starting Backend Server...
start "TenantGuard Backend" cmd /k "npm start"

echo.
echo [3/4] Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo [4/4] Starting Frontend...
cd ..\frontend
start "TenantGuard Frontend" cmd /k "npm start"

echo.
echo ========================================
echo TenantGuard System Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Demo Credentials:
echo Admin: demo@tenantguard.com / demo123
echo User:  test@tenantguard.com / test123
echo.
echo Press any key to exit...
pause > nul