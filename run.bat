@echo off
REM Simple runner for Screen Analysis

REM Check if virtual environment exists
if not exist venv (
    echo Virtual environment not found. Running setup first...
    call setup.bat
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if user provided a video file
if "%~1"=="" (
    echo.
    echo Usage: run.bat path\to\your\video.mp4
    echo.
    echo Example: run.bat C:\Videos\meeting.mp4
    echo.
    echo Available options:
    echo   --model pro    : Detailed analysis (default)
    echo   --model flash  : Faster analysis
    echo   --model flash-lite : Fastest analysis
    echo   --segment 5    : Split into 5-minute segments
    echo   --prompt_file  : Choose different analysis prompt
    echo.
    pause
    exit /b 1
)

REM Run the analysis with default settings
echo Running analysis on %1...
python better_video_analysis.py %* --prompt_file eva_prompt.txt

echo.
echo Analysis complete! Check the output folder for results.
pause
