@echo off
echo ========================================
echo Ethio-Maids Database Setup
echo ========================================
echo.

echo 🔍 Checking environment variables...
if "%VITE_SUPABASE_URL%"=="" (
    echo ❌ VITE_SUPABASE_URL is not set
    echo Please add it to your .env file
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_KEY%"=="" (
    echo ❌ SUPABASE_SERVICE_KEY is not set
    echo Please add it to your .env file
    pause
    exit /b 1
)

echo ✅ Environment variables are set
echo.

echo 🚀 Running database setup script...
node database/scripts/setup-database.js

echo.
echo Setup completed! Check the output above for any errors.
pause
