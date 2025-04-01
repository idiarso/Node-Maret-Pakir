@echo off
echo Starting NodeTSpark Arduino Client...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if required files exist
if not exist "package.json" (
    echo Error: package.json not found
    echo Please make sure you're in the correct directory
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check for environment variables
if not exist ".env" (
    echo Warning: .env file not found
    echo Creating default .env file...
    (
        echo SERVER_URL=http://localhost:3000
        echo ARDUINO_PORT=COM3
        echo DEBUG=true
        echo LOG_LEVEL=INFO
        echo GATE_OPEN_TIME=5
        echo BUZZER_VOLUME=128
        echo TEST_MODE=false
        echo DEBUG_MODE=false
        echo HEALTH_CHECK_INTERVAL=300000
        echo SCANNER_TIMEOUT=5000
        echo GATE_TIMEOUT=10000
        echo VOLTAGE_THRESHOLD=4.5
        echo AUTO_RETRY=true
        echo MAX_RETRIES=3
        echo LOG_ROTATION_SIZE=10485760
        echo LOG_ROTATION_COUNT=5
        echo ENABLE_CRASH_REPORTING=true
        echo CRASH_REPORT_URL=http://localhost:3000/api/crashes
    ) > .env
    echo Please update the .env file with your configuration
)

:: Load environment variables
for /f "tokens=*" %%a in (.env) do (
    set %%a
)

:: Check if Arduino port is specified
if "%ARDUINO_PORT%"=="" (
    echo Error: ARDUINO_PORT not specified in .env file
    echo Please specify the correct COM port for your Arduino
    pause
    exit /b 1
)

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Create crash reports directory if it doesn't exist
if not exist "logs\crashes" mkdir logs\crashes

:: Check for old log files and rotate if needed
if exist "logs\arduino_client.log" (
    for /f "tokens=*" %%a in ('dir /b /s /a-d "logs\arduino_client.log" ^| find /c /v ""') do (
        if %%a gtr %LOG_ROTATION_COUNT% (
            del "logs\arduino_client.log.%LOG_ROTATION_COUNT%"
            for /l %%i in (%LOG_ROTATION_COUNT%,-1,1) do (
                if exist "logs\arduino_client.log.%%i" (
                    ren "logs\arduino_client.log.%%i" "arduino_client.log.%%i+1"
                )
            )
            ren "logs\arduino_client.log" "arduino_client.log.1"
        )
    )
)

:: Start the Arduino client with environment variables
echo Starting Arduino client...
echo Port: %ARDUINO_PORT%
echo Server: %SERVER_URL%
echo Debug Mode: %DEBUG_MODE%
echo Test Mode: %TEST_MODE%
echo Health Check Interval: %HEALTH_CHECK_INTERVAL%ms
echo Scanner Timeout: %SCANNER_TIMEOUT%ms
echo Gate Timeout: %GATE_TIMEOUT%ms
echo Voltage Threshold: %VOLTAGE_THRESHOLD%V
echo Auto Retry: %AUTO_RETRY%
echo Max Retries: %MAX_RETRIES%
echo.

:: Start the client with environment variables
set NODE_ENV=development
node src/client/arduino_client.js > logs\arduino_client.log 2>&1

:: If the client crashes, handle crash reporting
if %errorlevel% neq 0 (
    echo.
    echo Error: Client crashed with exit code %errorlevel%
    echo Check logs\arduino_client.log for details
    
    :: Create crash report
    if "%ENABLE_CRASH_REPORTING%"=="true" (
        echo Creating crash report...
        set CRASH_TIME=%date% %time%
        echo Crash Report > logs\crashes\crash_%CRASH_TIME:.=%.txt
        echo Time: %CRASH_TIME% >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        echo Exit Code: %errorlevel% >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        echo Environment: >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        set >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        echo. >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        echo Last 100 lines of log: >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        tail -n 100 logs\arduino_client.log >> logs\crashes\crash_%CRASH_TIME:.=%.txt
        
        :: Send crash report to server if URL is specified
        if not "%CRASH_REPORT_URL%"=="" (
            echo Sending crash report to server...
            curl -X POST "%CRASH_REPORT_URL%" -H "Content-Type: application/json" -d "@logs\crashes\crash_%CRASH_TIME:.=%.txt"
        )
    )
    
    pause
) 