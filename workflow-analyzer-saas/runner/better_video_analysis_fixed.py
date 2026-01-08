#!/usr/bin/env python3
# better_video_analysis.py
"""
Workflow‑aware video analysis via Google Gemini.
Fast slicing with ffmpeg, async uploads, robust retries.
"""

from __future__ import annotations
import argparse, asyncio, json, logging, os, subprocess, time
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

import cv2
import dotenv
import google.generativeai as genai
import tenacity
from rich.console import Console       # pretty progress
from rich.progress import Progress, TimeElapsedColumn, BarColumn

# ─────────────────────────────── Configuration ────────────────────────────────
dotenv.load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)
console = Console()

# -----------------------------------------------------------------------------#
@dataclass
class ModelCfg:
    name: str
    max_minutes: int
    description: str

MODELS = {
    "pro":  ModelCfg("gemini-2.5-pro", 120,
                     "Depth‑first analysis; best reasoning ($1.25/$10 per 1M tokens)"),
    "flash": ModelCfg("gemini-2.5-flash", 60,
                      "Fast & efficient, great for production (best value)"),
    "flash-lite": ModelCfg("gemini-2.5-flash-lite", 30,
                           "Lowest cost & latency, good for quick analysis"),
}

@dataclass
class Segment:
    idx: int
    src: Path
    start_s: int
    end_s: int
    path: Path                 # temporary slice

# ────────────────────────────── ffmpeg utilities ──────────────────────────────
def slice_with_ffmpeg(src: Path, start_s: int, end_s: int, compress=False) -> Path:
    out = src.with_suffix(f".seg{start_s}_{end_s}.mp4")
    if out.exists():
        return out
    
    if compress:
        # Compress video to reduce file size for faster uploads
        cmd = [
            "ffmpeg", "-loglevel", "error",
            "-ss", str(timedelta(seconds=start_s)),
            "-to", str(timedelta(seconds=end_s)),
            "-i", str(src),
            "-c:v", "libx264", "-preset", "fast", "-crf", "28",  # Compress video
            "-c:a", "aac", "-b:a", "128k",  # Compress audio
            "-movflags", "+faststart",  # Optimize for streaming
            str(out),
        ]
    else:
        # Original copy method (faster but larger files)
        cmd = [
            "ffmpeg", "-loglevel", "error",
            "-ss", str(timedelta(seconds=start_s)),
            "-to", str(timedelta(seconds=end_s)),
            "-i", str(src),
            "-c", "copy", "-avoid_negative_ts", "1",
            str(out),
        ]
    
    subprocess.run(cmd, check=True)
    return out

def get_file_size_mb(path: Path) -> float:
    """Get file size in MB"""
    return path.stat().st_size / (1024 * 1024)

# ───────────────────────────── Gemini helpers ────────────────────────────────
@tenacity.retry(
    wait=tenacity.wait_random_exponential(multiplier=2, max=30),
    stop=tenacity.stop_after_attempt(5),
    reraise=True,
)
def upload_file(path: Path):
    return genai.upload_file(path=str(path))

async def wait_for_file_active(file_obj, max_wait=300, check_interval=2):
    """
    Wait for uploaded file to become active
    Increased timeout to 300 seconds (5 minutes) for large files
    """
    start = time.time()
    file_name = file_obj.name
    
    while time.time() - start < max_wait:
        try:
            file = genai.get_file(file_name)
            if file.state.name == "ACTIVE":
                return file
            elif file.state.name == "FAILED":
                raise Exception(f"File upload failed for {file_name}")
            
            # Log progress every 10 seconds
            elapsed = time.time() - start
            if elapsed % 10 < check_interval:
                logging.info(f"Waiting for file {file_name} to become active... ({elapsed:.0f}s)")
                
        except Exception as e:
            if "not found" in str(e).lower():
                # File might not be ready yet, continue waiting
                pass
            else:
                raise
                
        await asyncio.sleep(check_interval)
    
    raise Exception(f"File {file_name} did not become active in {max_wait} seconds")

@tenacity.retry(
    wait=tenacity.wait_random_exponential(multiplier=2, max=30),
    stop=tenacity.stop_after_attempt(3),
    reraise=True,
)
async def generate_content_with_retry(model, file_obj, prompt):
    """Generate content with retry logic"""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, lambda: model.generate_content([file_obj, prompt]).text
    )

async def analyse_segment(model, seg: Segment, prompt: str, compress_large_files=True) -> dict:
    loop = asyncio.get_running_loop()
    
    # Check file size and compress if needed
    file_size_mb = get_file_size_mb(seg.path)
    logging.info(f"Segment {seg.idx} file size: {file_size_mb:.1f} MB")
    
    # If file is larger than 100MB, compress it
    if compress_large_files and file_size_mb > 100:
        logging.info(f"Compressing large segment {seg.idx} ({file_size_mb:.1f} MB)...")
        compressed_path = seg.path.with_suffix('.compressed.mp4')
        if not compressed_path.exists():
            compressed_path = await loop.run_in_executor(
                None, slice_with_ffmpeg, seg.src, seg.start_s, seg.end_s, True
            )
        seg.path = compressed_path
        new_size_mb = get_file_size_mb(seg.path)
        logging.info(f"Compressed to {new_size_mb:.1f} MB")
    
    # Upload file
    file_obj = await loop.run_in_executor(None, upload_file, seg.path)
    
    # Wait for file to become active with extended timeout
    active_file = await wait_for_file_active(file_obj, max_wait=300)
    
    try:
        # Generate content with retry
        content = await generate_content_with_retry(model, active_file, prompt)
    finally:
        # Clean up
        try:
            genai.delete_file(active_file.name)
        except:
            pass
    
    return {
        "segment": seg.idx,
        "range": f"{timedelta(seconds=seg.start_s)}–{timedelta(seconds=seg.end_s)}",
        "analysis": content,
    }

# ─────────────────────────────── Main analyser ────────────────────────────────
class VideoAnalyser:
    def __init__(self, model_key: str, segment_len: int, verbose: bool):
        self.cfg = MODELS[model_key]
        self.segment_len = segment_len * 60          # to seconds
        self.model = genai.GenerativeModel(self.cfg.name)
        logging.info("Using model %s (%s)", self.cfg.name, self.cfg.description)

    def split(self, video: Path) -> List[Segment]:
        cap = cv2.VideoCapture(str(video))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration_s = int(total_frames / fps)
        cap.release()

        segments: List[Segment] = []
        for i, start in enumerate(range(0, duration_s, self.segment_len), 1):
            end = min(start + self.segment_len, duration_s)
            seg_path = slice_with_ffmpeg(video, start, end)
            segments.append(Segment(i, video, start, end, seg_path))
        return segments

    async def run(self, video: Path, prompt: str) -> List[dict]:
        segments = self.split(video)
        
        # Process segments with limited concurrency to avoid overwhelming the API
        max_concurrent = 3  # Limit concurrent uploads
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_with_limit(seg):
            async with semaphore:
                return await analyse_segment(self.model, seg, prompt)
        
        tasks = [process_with_limit(s) for s in segments]
        results = []
        
        with Progress("[progress.description]{task.description}",
                      BarColumn(),
                      TimeElapsedColumn(),
                      console=console) as progress:
            t = progress.add_task(f"Analysing {video.name}", total=len(tasks))
            for coro in asyncio.as_completed(tasks):
                results.append(await coro)
                progress.update(t, advance=1)
        return results

# ──────────────────────────────── CLI entrypoint ─────────────────────────────―
def cli():
    ap = argparse.ArgumentParser(description="Executive workflow analyser")
    ap.add_argument("videos", nargs="+", type=Path)
    ap.add_argument("-m", "--model", default="pro", choices=MODELS.keys())
    ap.add_argument("-s", "--segment", type=int, default=10,
                    help="segment length in minutes")
    ap.add_argument("--prompt_file", type=Path, required=True,
                    help="txt/‑md prompt file to send for each segment")
    ap.add_argument("-o", "--outdir", type=Path, default=Path("./output"))
    ap.add_argument("--no-compress", action="store_true",
                    help="Disable automatic compression of large segments")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s | %(levelname)s | %(message)s")
    analyser = VideoAnalyser(args.model, args.segment, verbose=True)
    prompt = args.prompt_file.read_text()

    args.outdir.mkdir(exist_ok=True)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    for vid in args.videos:
        start = time.time()
        results = loop.run_until_complete(analyser.run(vid, prompt))
        out = args.outdir / f"{vid.stem}__{datetime.now():%Y%m%d%H%M}.json"
        out.write_text(json.dumps(results, indent=2))
        logging.info("Finished %s in %.1f s ↗ %s", vid.name, time.time()-start, out)

if __name__ == "__main__":
    cli()