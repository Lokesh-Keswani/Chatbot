@echo off
echo ========================================
echo    AI Chatbot Setup and Launch
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found! Starting server...
echo.
echo ========================================
echo    Server Information
echo ========================================
echo URL: http://localhost:8000
echo Demo Account: demo@example.com / demo123
echo.
echo IMPORTANT: Make sure to configure your Gemini API key in config.js
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

pause 