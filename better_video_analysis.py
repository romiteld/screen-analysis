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
    "pro":  ModelCfg("gemini-2.5-flash-preview-05-20", 120,
                     "Depth‑first analysis; best reasoning"),
    "flash": ModelCfg("gemini-2.0-flash", 60,
                      "Latest stable flash model"),
    "flash-lite": ModelCfg("gemini-2.0-flash-lite", 30,
                           "Cost-efficient, low latency"),
}

@dataclass
class Segment:
    idx: int
    src: Path
    start_s: int
    end_s: int
    path: Path                 # temporary slice

# ────────────────────────────── ffmpeg utilities ──────────────────────────────
def slice_with_ffmpeg(src: Path, start_s: int, end_s: int) -> Path:
    out = src.with_suffix(f".seg{start_s}_{end_s}.mp4")
    if out.exists():
        return out
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

# ───────────────────────────── Gemini helpers ────────────────────────────────
@tenacity.retry(
    wait=tenacity.wait_random_exponential(multiplier=2, max=30),
    stop=tenacity.stop_after_attempt(5),
    reraise=True,
)
def upload_file(path: Path):
    return genai.upload_file(path=str(path))

async def wait_for_file_active(file_obj, max_wait=60):
    """Wait for uploaded file to become active"""
    start = time.time()
    while time.time() - start < max_wait:
        file = genai.get_file(file_obj.name)
        if file.state.name == "ACTIVE":
            return file
        await asyncio.sleep(1)
    raise Exception(f"File {file_obj.name} did not become active in {max_wait} seconds")

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

async def analyse_segment(model, seg: Segment, prompt: str) -> dict:
    loop = asyncio.get_running_loop()
    
    # Upload file
    file_obj = await loop.run_in_executor(None, upload_file, seg.path)
    
    # Wait for file to become active
    active_file = await wait_for_file_active(file_obj)
    
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
        tasks = [analyse_segment(self.model, s, prompt) for s in segments]
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