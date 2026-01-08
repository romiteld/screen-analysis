"""
Enhanced video analyzer with Gemini 2.0 Flash integration
Optimized for workflow analysis and screen recording processing
"""

import os
import json
import logging
import tempfile
from datetime import datetime
from typing import Dict, Any, List, Optional
import asyncio
from dataclasses import dataclass
import google.generativeai as genai
from supabase import create_client, Client
import cv2
import numpy as np
from PIL import Image
import io
import base64
import requests
import aiohttp
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FrameData:
    timestamp: float
    image: Image.Image
    frame_number: int


class VideoAnalyzer:
    def __init__(self):
        # Initialize Supabase client
        self.supabase: Client = create_client(
            os.environ.get("SUPABASE_URL"),
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        )
        
        # Initialize Gemini
        genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Webhook configuration
        self.webhook_url = os.environ.get("WEBHOOK_URL")
        self.webhook_secret = os.environ.get("WEBHOOK_SECRET")
        
    async def download_video(self, video_url: str) -> str:
        """Download video to temporary file"""
        try:
            # Parse URL to get filename
            parsed = urlparse(video_url)
            filename = os.path.basename(parsed.path) or "video.mp4"
            
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}")
            
            # Download video
            response = requests.get(video_url, stream=True)
            response.raise_for_status()
            
            for chunk in response.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            
            temp_file.close()
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Error downloading video: {str(e)}")
            raise
    
    def extract_frames(self, video_path: str, interval_seconds: int = 5, max_frames: int = 20) -> List[FrameData]:
        """Extract frames from video at specified intervals"""
        frames = []
        cap = None
        
        try:
            cap = cv2.VideoCapture(video_path)
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"Video info: FPS={fps}, Total frames={total_frames}, Duration={duration}s")
            
            # Calculate frame interval
            frame_interval = int(fps * interval_seconds)
            if frame_interval < 1:
                frame_interval = 1
            
            frame_count = 0
            extracted_count = 0
            
            while cap.isOpened() and extracted_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % frame_interval == 0:
                    # Convert BGR to RGB
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Convert to PIL Image
                    pil_image = Image.fromarray(rgb_frame)
                    
                    # Add to frames list
                    frames.append(FrameData(
                        timestamp=frame_count / fps,
                        image=pil_image,
                        frame_number=frame_count
                    ))
                    
                    extracted_count += 1
                    logger.info(f"Extracted frame {extracted_count} at {frame_count / fps:.2f}s")
                
                frame_count += 1
            
            logger.info(f"Extracted {len(frames)} frames from video")
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames: {str(e)}")
            raise
        finally:
            if cap:
                cap.release()
    
    def prepare_prompt_for_workflow(self, user_prompt: str) -> str:
        """Enhance prompt with workflow-specific instructions"""
        base_prompt = """You are analyzing a screen recording or workflow video. Please provide a detailed analysis focusing on:

1. **Workflow Steps**: Identify and list each distinct step or action taken in the video
2. **Tools/Applications**: Note which applications, tools, or interfaces are being used
3. **Key Actions**: Highlight important clicks, inputs, or interactions
4. **Process Flow**: Describe the overall flow and logic of the workflow
5. **Potential Issues**: Identify any errors, inefficiencies, or areas for improvement
6. **Time Analysis**: Note how long different steps take (based on frame timestamps)

User's specific request: {user_prompt}

Please structure your response with clear sections and bullet points for easy reading."""
        
        return base_prompt.format(user_prompt=user_prompt)
    
    async def analyze_frames(self, frames: List[FrameData], prompt: str) -> Dict[str, Any]:
        """Analyze frames using Gemini 2.0 Flash"""
        try:
            # Prepare enhanced prompt
            enhanced_prompt = self.prepare_prompt_for_workflow(prompt)
            
            # Prepare content for Gemini
            content = [enhanced_prompt]
            
            # Add frame information
            for i, frame_data in enumerate(frames):
                # Add timestamp context
                content.append(f"\n[Frame {i+1} - Time: {frame_data.timestamp:.2f}s]")
                content.append(frame_data.image)
            
            # Generate analysis
            logger.info(f"Sending {len(frames)} frames to Gemini for analysis")
            response = self.model.generate_content(content)
            
            # Extract structured data from response
            analysis_text = response.text
            
            # Create structured result
            result = {
                "analysis": analysis_text,
                "metadata": {
                    "frames_analyzed": len(frames),
                    "timestamps": [f.timestamp for f in frames],
                    "model": "gemini-2.5-flash",
                    "analysis_date": datetime.utcnow().isoformat()
                },
                "workflow_summary": self._extract_workflow_summary(analysis_text)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing frames: {str(e)}")
            raise
    
    def _extract_workflow_summary(self, analysis_text: str) -> Dict[str, Any]:
        """Extract key workflow information from analysis text"""
        # This is a simple extraction - could be enhanced with more NLP
        summary = {
            "total_steps": analysis_text.count("Step") + analysis_text.count("step"),
            "has_errors": "error" in analysis_text.lower() or "issue" in analysis_text.lower(),
            "tools_mentioned": [],
            "key_sections": []
        }
        
        # Extract section headers (lines that might be headers)
        lines = analysis_text.split('\n')
        for line in lines:
            if line.strip() and (line.startswith('#') or line.endswith(':') or line.isupper()):
                summary["key_sections"].append(line.strip())
        
        return summary
    
    async def send_webhook_notification(self, analysis_id: str, status: str, **kwargs):
        """Send webhook notification about analysis status"""
        if not self.webhook_url:
            logger.debug("No webhook URL configured, skipping notification")
            return
        
        try:
            payload = {
                "analysis_id": analysis_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Add additional data based on status
            if status == 'completed' and 'result' in kwargs:
                payload['result'] = kwargs['result']
                payload['frames_analyzed'] = kwargs.get('frames_analyzed', 0)
            elif status == 'failed' and 'error' in kwargs:
                payload['error'] = kwargs['error']
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Add webhook signature if secret is configured
            if self.webhook_secret:
                import hmac
                import hashlib
                payload_str = json.dumps(payload, sort_keys=True)
                signature = hmac.new(
                    self.webhook_secret.encode(),
                    payload_str.encode(),
                    hashlib.sha256
                ).hexdigest()
                headers['X-Webhook-Signature'] = signature
            
            # Send webhook
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status >= 400:
                        logger.warning(f"Webhook returned status {response.status}")
                    else:
                        logger.info(f"Webhook notification sent for {analysis_id}: {status}")
                        
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {str(e)}")
            # Don't raise - webhook failures shouldn't stop processing
    
    async def process_analysis(self, analysis_id: str, video_url: str, prompt: str):
        """Main processing pipeline"""
        video_path = None
        
        try:
            # Update status to processing
            await self.supabase.table('analyses').update({
                'status': 'processing',
                'started_at': datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
            
            # Send webhook notification if configured
            await self.send_webhook_notification(analysis_id, 'processing')
            
            # Download video
            logger.info(f"Downloading video from: {video_url}")
            video_path = await self.download_video(video_url)
            
            # Extract frames
            logger.info("Extracting frames from video")
            frames = self.extract_frames(video_path)
            
            if not frames:
                raise ValueError("No frames could be extracted from the video")
            
            # Analyze with Gemini
            logger.info(f"Analyzing {len(frames)} frames with Gemini")
            result = await self.analyze_frames(frames, prompt)
            
            # Store results
            await self.supabase.table('analyses').update({
                'status': 'completed',
                'completed_at': datetime.utcnow().isoformat(),
                'result_data': json.dumps(result),
                'frames_analyzed': result['metadata']['frames_analyzed']
            }).eq('id', analysis_id).execute()
            
            logger.info(f"Analysis {analysis_id} completed successfully")
            
            # Send webhook notification
            await self.send_webhook_notification(
                analysis_id, 
                'completed', 
                result=result, 
                frames_analyzed=result['metadata']['frames_analyzed']
            )
            
        except Exception as e:
            logger.error(f"Error processing analysis {analysis_id}: {str(e)}")
            await self.supabase.table('analyses').update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
            
            # Send webhook notification for failure
            await self.send_webhook_notification(
                analysis_id,
                'failed',
                error=str(e)
            )
            
        finally:
            # Cleanup temporary file
            if video_path and os.path.exists(video_path):
                try:
                    os.unlink(video_path)
                except:
                    pass


# Flask app integration
from flask import Flask, request, jsonify

app = Flask(__name__)
analyzer = VideoAnalyzer()


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'workflow-analyzer-runner'}), 200


@app.route('/analyze', methods=['POST'])
async def analyze_video():
    """Endpoint to trigger video analysis"""
    try:
        data = request.get_json()
        analysis_id = data.get('analysis_id')
        video_url = data.get('video_url')
        prompt = data.get('prompt', 'Analyze this workflow video and provide a detailed summary.')
        
        if not analysis_id or not video_url:
            return jsonify({'error': 'Missing required parameters: analysis_id and video_url'}), 400
        
        # Process asynchronously
        asyncio.create_task(analyzer.process_analysis(analysis_id, video_url, prompt))
        
        return jsonify({
            'status': 'accepted',
            'analysis_id': analysis_id,
            'message': 'Video analysis started'
        }), 202
        
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)