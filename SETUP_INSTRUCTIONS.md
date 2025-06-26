# Setup Instructions for Screen Analysis Project on Windows

## Prerequisites to Install

### 1. Install Python
1. Go to https://www.python.org/downloads/
2. Download the latest Python 3.x version (click the big yellow button)
3. **IMPORTANT**: During installation, check the box that says "Add Python to PATH"
4. Click "Install Now"
5. To verify, open Command Prompt and type:
   ```
   python --version
   ```
   You should see something like "Python 3.x.x"

### 2. Install Git
1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Use all default settings (just keep clicking "Next")
4. To verify, in Command Prompt type:
   ```
   git --version
   ```

### 3. Install FFmpeg (required for video processing)
1. Go to https://www.gyan.dev/ffmpeg/builds/
2. Click on "release builds" link
3. Download "ffmpeg-release-essentials.zip"
4. Extract the ZIP file to C:\ffmpeg
5. Add FFmpeg to PATH:
   - Press Windows + X and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - In "System variables", find "Path" and click "Edit"
   - Click "New" and add: C:\ffmpeg\bin
   - Click OK on all windows
6. Close and reopen Command Prompt
7. Verify by typing:
   ```
   ffmpeg -version
   ```

## Project Setup

### 1. Clone the Repository
Open Command Prompt and run:
```
cd C:\
mkdir Projects
cd Projects
git clone https://github.com/romiteld/screen-analysis.git
cd screen-analysis
```

### 2. Create Virtual Environment
```
python -m venv venv
venv\Scripts\activate
```
You should see (venv) at the start of your command line.

### 3. Install Dependencies
```
pip install -r requirements.txt
```

### 4. Get Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 5. Create .env File
In Command Prompt (still in the project folder):
```
echo GOOGLE_API_KEY=paste_your_api_key_here > .env
```
Replace "paste_your_api_key_here" with your actual API key.

## Running the Program

### Basic Usage
To analyze a video file:
```
python better_video_analysis.py path\to\your\video.mp4 --prompt_file eva_prompt.txt
```

### Example with all options:
```
python better_video_analysis.py C:\Videos\meeting.mp4 --model flash --segment 5 --prompt_file eva_prompt.txt --outdir C:\analysis_results
```

### Options Explained:
- `--model`: Choose analysis model
  - `pro`: Most detailed analysis (up to 2 hours of video)
  - `flash`: Faster, good quality (up to 1 hour)
  - `flash-lite`: Fastest, basic analysis (up to 30 minutes)
- `--segment`: Split video into chunks of X minutes (default: 10)
- `--prompt_file`: Which analysis prompt to use
- `--outdir`: Where to save results (default: ./output)

## Available Prompts
The project includes several prompt files:
- `eva_prompt.txt` - Executive virtual assistant analysis
- `email_focus_prompt.txt` - Email-focused analysis
- `integration_prompt.txt` - Integration analysis
- `o3_pro_deep_research.txt` - Deep research analysis

## Troubleshooting

### "python is not recognized"
- Make sure you checked "Add Python to PATH" during installation
- Try `py` instead of `python`

### "pip is not recognized"
- Try: `python -m pip install -r requirements.txt`

### FFmpeg errors
- Make sure FFmpeg is in your PATH
- Try running `ffmpeg -version` to verify

### API Key errors
- Make sure your .env file has the correct format
- The line should be exactly: GOOGLE_API_KEY=your_actual_key_here

### To check if everything is working:
```
python debug_video.py
```

## Video Requirements
- Supported formats: MP4, AVI, MOV, MKV
- Place videos in the "videos" folder or specify full path
- Larger videos will be automatically split into segments

## Getting Help
If you encounter issues:
1. Make sure you're in the virtual environment (you see (venv))
2. Check that all prerequisites are installed
3. Look at the error message - it usually tells you what's wrong
