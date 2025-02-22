@echo off
echo Setting up AI Quiz Generator...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed! Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if virtual environment exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt
pip install google-generativeai

REM Initialize API key variable
set "FOUND_API_KEY="

REM Set default API key (this is a test key)
set "DEFAULT_API_KEY=AIzaSyAIwolxxrOG55S87m-t6OoKF4M-iWsMlNg"

REM Check in current directory .env file
echo Searching for API key...
if exist ".env" (
    findstr /C:"GEMINI_API_KEY=" .env >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=2 delims==" %%a in ('findstr /C:"GEMINI_API_KEY=" .env') do (
            if not "%%a"=="" set "FOUND_API_KEY=%%a"
        )
        if defined FOUND_API_KEY echo Found valid API key in .env file
    )
)

REM Check in user's home directory
if not defined FOUND_API_KEY (
    if exist "%USERPROFILE%\.env" (
        findstr /C:"GEMINI_API_KEY=" "%USERPROFILE%\.env" >nul 2>&1
        if !errorlevel! equ 0 (
            for /f "tokens=2 delims==" %%a in ('findstr /C:"GEMINI_API_KEY=" "%USERPROFILE%\.env"') do (
                if not "%%a"=="" set "FOUND_API_KEY=%%a"
            )
            if defined FOUND_API_KEY echo Found valid API key in user's home directory
        )
    )
)

REM Check system environment variables
if not defined FOUND_API_KEY (
    if defined GEMINI_API_KEY (
        if not "%GEMINI_API_KEY%"=="" (
            set "FOUND_API_KEY=%GEMINI_API_KEY%"
            echo Found valid API key in system environment variables
        )
    )
)

REM If no valid API key found, use the default one
if not defined FOUND_API_KEY (
    set "FOUND_API_KEY=%DEFAULT_API_KEY%"
    echo Using default API key
)

REM Save the API key to .env file
echo GEMINI_API_KEY=%FOUND_API_KEY%> .env
echo API key has been configured

REM Run the application and open browser
echo Starting the application...
start /b python main.py

REM Wait for the server to start (3 seconds)
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open the default browser
echo Opening browser...
start http://localhost:8000

REM Keep the window open and show server status
echo Server is running at http://localhost:8000
echo Press Ctrl+C to stop the server
cmd /k
