@echo off
echo Testing start_arduino.bat script...

:: Test Node.js installation check
echo Testing Node.js installation check...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    exit /b 1
)

:: Test package.json existence
echo Testing package.json existence...
if not exist package.json (
    echo Error: package.json not found
    exit /b 1
)

:: Test node_modules existence
echo Testing node_modules existence...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

:: Test .env file
echo Testing .env file...
if not exist .env (
    echo Creating default .env file...
    (
        echo SERVER_URL=http://localhost:3000
        echo ARDUINO_PORT=COM3
        echo DEBUG=false
        echo LOG_LEVEL=info
        echo SCANNER_TIMEOUT=5000
        echo GATE_TIMEOUT=3000
        echo VOLTAGE_THRESHOLD=3.3
        echo AUTO_RETRY=true
        echo MAX_RETRIES=3
        echo LOG_ROTATION_SIZE=10485760
        echo LOG_ROTATION_COUNT=5
        echo ENABLE_CRASH_REPORTING=true
        echo CRASH_REPORT_URL=http://localhost:3000/api/crashes
    ) > .env
)

:: Test logs directory
echo Testing logs directory...
if not exist logs (
    echo Creating logs directory...
    mkdir logs
)

:: Test crashes directory
echo Testing crashes directory...
if not exist logs\crashes (
    echo Creating crashes directory...
    mkdir logs\crashes
)

:: Test log rotation
echo Testing log rotation...
if exist logs\arduino_client.log (
    for %%I in (logs\arduino_client.log) do if %%~zI gtr 10485760 (
        echo Rotating log file...
        move /y logs\arduino_client.log logs\arduino_client.log.1
    )
)

:: Test environment variables
echo Testing environment variables...
setlocal enabledelayedexpansion
for /f "tokens=*" %%a in (.env) do (
    set "%%a"
)
if not defined SERVER_URL (
    echo Error: SERVER_URL not set
    exit /b 1
)
if not defined ARDUINO_PORT (
    echo Error: ARDUINO_PORT not set
    exit /b 1
)
endlocal

:: Test client startup
echo Testing client startup...
node src/client/arduino_client.js
if %errorlevel% neq 0 (
    echo Error: Client failed to start
    exit /b 1
)

echo All tests passed successfully!
exit /b 0 