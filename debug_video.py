import cv2
from pathlib import Path
import sys
import os

# Force UTF-8 encoding for output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

if len(sys.argv) < 2:
    print("Usage: python debug_video.py <video_path>")
    sys.exit(1)

video_path = Path(sys.argv[1])
print(f"\nChecking video: {video_path}")
print(f"File exists: {video_path.exists()}")

if video_path.exists():
    print(f"File size: {video_path.stat().st_size / (1024*1024):.1f} MB")
    
    cap = cv2.VideoCapture(str(video_path))
    if cap.isOpened():
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        
        print(f"\nVideo properties:")
        print(f"FPS: {fps}")
        print(f"Frame count: {frame_count}")
        print(f"Resolution: {width}x{height}")
        
        if fps > 0 and frame_count > 0:
            duration_seconds = frame_count / fps
            duration_minutes = duration_seconds / 60
            print(f"Duration: {duration_seconds:.1f} seconds ({duration_minutes:.1f} minutes)")
        else:
            print("Could not calculate duration (FPS or frame count is 0)")
            
        cap.release()
    else:
        print("ERROR: Could not open video file with OpenCV")
        print("This might be a codec issue.")
else:
    print(f"ERROR: File not found")
    
# Also try with ffprobe
print("\nTrying with ffprobe...")
try:
    import subprocess
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 
        'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1',
        str(video_path)
    ], capture_output=True, text=True)
    
    if result.stdout:
        duration = float(result.stdout.strip())
        print(f"FFprobe duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
except Exception as e:
    print(f"FFprobe error: {e}")
