@echo off
echo ========================================
echo Installing dependencies...
echo ========================================
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Installation complete!
    echo ========================================
    echo.
    echo Starting development server...
    echo.
    call npm run dev
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo Please try running: npm install
    pause
)
