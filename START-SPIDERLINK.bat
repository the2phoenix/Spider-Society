@echo off
echo.
echo ========================================
echo   STARTING SPIDERLINK SERVER
echo ========================================
echo.
echo Server will start on http://localhost:3000
echo Please wait...
echo.

REM Start the server in the background
start /B npm start

REM Wait 5 seconds for the server to fully start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Now open the browser
echo.
echo Opening SpiderLink in your browser...
echo.
start http://localhost:3000/spiderlink.html

REM Keep the window open to show server logs
echo.
echo ========================================
echo   SPIDERLINK IS NOW RUNNING
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
pause >nul
