@echo off
echo Setting up Screen Analysis Project...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: FFmpeg is not installed or not in PATH
    echo Video processing will not work without FFmpeg
    echo Please follow the FFmpeg installation instructions in SETUP_INSTRUCTIONS.md
    echo.
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment and install dependencies
echo.
echo Installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Check if .env file exists
if not exist .env (
    echo.
    echo ============================================
    echo IMPORTANT: You need to create a .env file
    echo ============================================
    echo 1. Get your API key from https://makersuite.google.com/app/apikey
    echo 2. Create a file named .env in this folder
    echo 3. Add this line to the file: GOOGLE_API_KEY=your_api_key_here
    echo.
)

echo.
echo Setup complete!
echo.
echo To run the program:
echo 1. Run: venv\Scripts\activate
echo 2. Run: python better_video_analysis.py your_video.mp4 --prompt_file eva_prompt.txt
echo.
echo See SETUP_INSTRUCTIONS.md for detailed usage instructions
pause
