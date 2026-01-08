#!/usr/bin/env python3
"""
Google Cloud Run runner service for video processing.
Watches Supabase for new jobs and processes them using the video analysis script.
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Any

import dotenv
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential, 
    retry_if_exception_type,
    before_log,
    after_log
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
dotenv.load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# Service configuration
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '10'))  # seconds
WORKER_ID = os.getenv('WORKER_ID', f'worker-{os.getpid()}')
ANALYSIS_SCRIPT_PATH = Path('/app/better_video_analysis_fixed.py')

# Initialize Supabase client with service role key
options = ClientOptions(auto_refresh_token=False)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options)


class JobProcessor:
    """Processes video analysis jobs from Supabase."""
    
    def __init__(self):
        self.running = True
        self.current_job_id = None
        
    async def run(self):
        """Main runner loop."""
        logger.info(f"Starting runner service (Worker ID: {WORKER_ID})")
        
        while self.running:
            try:
                # Get next pending job
                job = await self._get_next_job()
                
                if job:
                    await self._process_job(job)
                else:
                    # No jobs available, wait before polling again
                    await asyncio.sleep(POLL_INTERVAL)
                    
            except Exception as e:
                logger.error(f"Error in main loop: {str(e)}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(POLL_INTERVAL)
    
    async def _get_next_job(self) -> Optional[Dict[str, Any]]:
        """Get the next pending job from the queue."""
        try:
            # Atomic update to claim a job
            response = supabase.rpc('claim_next_job', {
                'worker_id': WORKER_ID
            }).execute()
            
            if response.data and len(response.data) > 0:
                job = response.data[0]
                logger.info(f"Claimed job {job['id']} for user {job['user_id']}")
                return job
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting next job: {str(e)}")
            return None
    
    async def _process_job(self, job: Dict[str, Any]):
        """Process a single job."""
        job_id = job['id']
        self.current_job_id = job_id
        
        try:
            logger.info(f"Starting processing job {job_id}")
            
            # Update job status to processing
            await self._update_job_status(job_id, 'processing', {
                'started_at': datetime.utcnow().isoformat(),
                'worker_id': WORKER_ID
            })
            
            # Create temp directory for this job
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Download video from storage
                video_path = await self._download_video(job, temp_path)
                
                # Download prompt file
                prompt_path = await self._download_prompt(job, temp_path)
                
                # Run analysis
                output_dir = temp_path / 'output'
                output_dir.mkdir(exist_ok=True)
                
                analysis_result = await self._run_analysis(
                    video_path, 
                    prompt_path, 
                    output_dir,
                    job.get('model', 'pro'),
                    job.get('segment_length', 10)
                )
                
                # Upload results
                result_urls = await self._upload_results(job, output_dir)
                
                # Extract frame count from analysis results
                frames_analyzed = 0
                try:
                    json_files = list(output_dir.glob('*.json'))
                    if json_files:
                        with open(json_files[0], 'r') as f:
                            analysis_data = json.load(f)
                            # Count frames from segments
                            if 'segments' in analysis_data:
                                frames_analyzed = len(analysis_data['segments'])
                            elif 'frames_analyzed' in analysis_data:
                                frames_analyzed = analysis_data['frames_analyzed']
                except Exception as e:
                    logger.warning(f"Could not extract frame count: {str(e)}")
                
                # Update job as completed
                await self._update_job_status(job_id, 'completed', {
                    'completed_at': datetime.utcnow().isoformat(),
                    'result_json_url': result_urls.get('json'),
                    'result_pdf_url': result_urls.get('pdf'),
                    'processing_time': analysis_result.get('processing_time'),
                    'frames_analyzed': frames_analyzed
                })
                
                logger.info(f"Successfully completed job {job_id} (analyzed {frames_analyzed} frames)")
                
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Categorize error for better handling
            error_category = self._categorize_error(e)
            
            # Update job as failed with categorized error
            await self._update_job_status(job_id, 'failed', {
                'failed_at': datetime.utcnow().isoformat(),
                'error': str(e),
                'error_category': error_category,
                'error_trace': traceback.format_exc()[:1000]  # Limit trace length
            })
            
            # For critical errors, send alert
            if error_category in ['quota_exceeded', 'api_key_invalid', 'storage_error']:
                await self._send_critical_error_alert(job_id, error_category, str(e))
        
        finally:
            self.current_job_id = None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def _download_video(self, job: Dict[str, Any], temp_path: Path) -> Path:
        """Download video from Supabase storage with retry logic."""
        try:
            video_url = job['video_url']
            video_filename = job['video_filename']
            
            # Extract bucket and path from URL
            # Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            url_parts = video_url.split('/storage/v1/object/public/')
            if len(url_parts) != 2:
                raise ValueError(f"Invalid video URL format: {video_url}")
            
            bucket_and_path = url_parts[1]
            bucket = bucket_and_path.split('/')[0]
            file_path = '/'.join(bucket_and_path.split('/')[1:])
            
            logger.info(f"Downloading video from bucket '{bucket}', path '{file_path}'")
            
            # Download file with timeout
            try:
                video_data = supabase.storage.from_(bucket).download(file_path)
            except Exception as e:
                # Wrap common network errors for retry
                if "timeout" in str(e).lower() or "connection" in str(e).lower():
                    raise ConnectionError(f"Network error downloading video: {str(e)}")
                raise
            
            # Validate download
            if not video_data or len(video_data) == 0:
                raise ValueError("Downloaded video is empty")
            
            # Save to temp directory
            video_path = temp_path / video_filename
            video_path.write_bytes(video_data)
            
            # Verify file was written correctly
            if not video_path.exists() or video_path.stat().st_size == 0:
                raise IOError(f"Failed to write video file to {video_path}")
            
            logger.info(f"Downloaded video to {video_path} ({len(video_data)} bytes)")
            return video_path
            
        except Exception as e:
            logger.error(f"Error downloading video: {str(e)}")
            raise
    
    async def _download_prompt(self, job: Dict[str, Any], temp_path: Path) -> Path:
        """Download or create prompt file."""
        try:
            prompt_text = job.get('prompt_text', '')
            
            if not prompt_text:
                # Use default prompt
                prompt_text = """Analyze this video segment and identify:
1. Key workflow steps and processes shown
2. Tools, software, or equipment being used
3. Time spent on each activity
4. Any inefficiencies or bottlenecks observed
5. Suggestions for workflow optimization

Please be specific and detailed in your analysis."""
            
            prompt_path = temp_path / 'prompt.txt'
            prompt_path.write_text(prompt_text)
            
            logger.info(f"Created prompt file at {prompt_path}")
            return prompt_path
            
        except Exception as e:
            logger.error(f"Error creating prompt file: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=10, max=60),
        retry=retry_if_exception_type((RuntimeError, asyncio.TimeoutError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def _run_analysis(self, video_path: Path, prompt_path: Path, 
                          output_dir: Path, model: str, segment_length: int) -> Dict[str, Any]:
        """Run the video analysis script with retry and timeout handling."""
        try:
            start_time = time.time()
            
            # Prepare command
            cmd = [
                'python3',
                str(ANALYSIS_SCRIPT_PATH),
                str(video_path),
                '-m', model,
                '-s', str(segment_length),
                '--prompt_file', str(prompt_path),
                '-o', str(output_dir)
            ]
            
            logger.info(f"Running analysis command: {' '.join(cmd)}")
            
            # Run analysis script with timeout (1 hour max)
            try:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={**os.environ, 'GOOGLE_API_KEY': GOOGLE_API_KEY}
                )
                
                # Wait for completion with timeout
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=3600  # 1 hour timeout
                )
                
            except asyncio.TimeoutError:
                logger.error("Analysis script timed out after 1 hour")
                if process:
                    process.kill()
                    await process.wait()
                raise asyncio.TimeoutError("Analysis exceeded 1 hour time limit")
            
            # Check return code
            if process.returncode != 0:
                error_msg = stderr.decode()
                
                # Check for specific error types
                if "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                    # API quota errors should retry with backoff
                    raise RuntimeError(f"API quota/rate limit error: {error_msg}")
                elif "gemini" in error_msg.lower() and "api" in error_msg.lower():
                    # Gemini API errors might be transient
                    raise RuntimeError(f"Gemini API error (retrying): {error_msg}")
                else:
                    # Other errors shouldn't retry
                    raise ValueError(f"Analysis script failed: {error_msg}")
            
            processing_time = time.time() - start_time
            
            # Verify output was created
            json_files = list(output_dir.glob('*.json'))
            if not json_files:
                raise ValueError("Analysis completed but no output JSON was generated")
            
            logger.info(f"Analysis completed in {processing_time:.2f} seconds")
            logger.info(f"Script output: {stdout.decode()[:500]}...")  # Log first 500 chars
            
            return {
                'processing_time': processing_time,
                'stdout': stdout.decode(),
                'stderr': stderr.decode()
            }
            
        except Exception as e:
            logger.error(f"Error running analysis: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, IOError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def _upload_results(self, job: Dict[str, Any], output_dir: Path) -> Dict[str, str]:
        """Upload analysis results to Supabase storage with retry logic."""
        try:
            result_urls = {}
            user_id = job['user_id']
            job_id = job['id']
            
            # Find the JSON output file
            json_files = list(output_dir.glob('*.json'))
            if not json_files:
                raise FileNotFoundError("No JSON output file found")
            
            json_file = json_files[0]
            
            # Upload JSON file with retry-friendly error handling
            json_path = f"{user_id}/{job_id}/analysis_result.json"
            try:
                with open(json_file, 'rb') as f:
                    json_data = f.read()
                    
                # Validate JSON before upload
                json.loads(json_data.decode('utf-8'))
                
                # Upload with error wrapping
                try:
                    supabase.storage.from_('results').upload(
                        json_path,
                        json_data,
                        file_options={"content-type": "application/json"}
                    )
                except Exception as e:
                    if "timeout" in str(e).lower() or "connection" in str(e).lower():
                        raise ConnectionError(f"Network error uploading JSON: {str(e)}")
                    raise
                    
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in output file: {str(e)}")
            
            result_urls['json'] = f"{SUPABASE_URL}/storage/v1/object/public/results/{json_path}"
            logger.info(f"Uploaded JSON results to {json_path}")
            
            # Generate and upload PDF report
            pdf_path = await self._generate_pdf_report(job, json_file, output_dir)
            if pdf_path and pdf_path.exists():
                pdf_storage_path = f"{user_id}/{job_id}/analysis_report.pdf"
                try:
                    with open(pdf_path, 'rb') as f:
                        pdf_data = f.read()
                        
                    # Validate PDF has content
                    if len(pdf_data) == 0:
                        raise ValueError("Generated PDF is empty")
                    
                    # Upload with error wrapping
                    try:
                        supabase.storage.from_('results').upload(
                            pdf_storage_path,
                            pdf_data,
                            file_options={"content-type": "application/pdf"}
                        )
                    except Exception as e:
                        if "timeout" in str(e).lower() or "connection" in str(e).lower():
                            raise ConnectionError(f"Network error uploading PDF: {str(e)}")
                        raise
                        
                except IOError as e:
                    logger.error(f"Error reading PDF file: {str(e)}")
                    # PDF is optional, don't fail the job
                    
                result_urls['pdf'] = f"{SUPABASE_URL}/storage/v1/object/public/results/{pdf_storage_path}"
                logger.info(f"Uploaded PDF report to {pdf_storage_path}")
            
            return result_urls
            
        except Exception as e:
            logger.error(f"Error uploading results: {str(e)}")
            raise
    
    async def _generate_pdf_report(self, job: Dict[str, Any], json_file: Path, 
                                  output_dir: Path) -> Optional[Path]:
        """Generate PDF report from JSON analysis results."""
        try:
            # Import our enhanced PDF generator
            from pdf_generator import WorkflowPDFGenerator
            
            # Load analysis results
            with open(json_file, 'r') as f:
                results = json.load(f)
            
            # Create PDF using our enhanced generator
            pdf_path = output_dir / 'analysis_report.pdf'
            generator = WorkflowPDFGenerator()
            
            video_filename = job.get('video_filename', 'Video Analysis')
            generator.generate_report(
                analysis_data=results,
                output_path=pdf_path,
                video_filename=video_filename,
                company_name="Workflow Analyzer Pro"
            )
            
            logger.info(f"Generated PDF report at {pdf_path}")
            return pdf_path
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            # PDF generation is optional, don't fail the job
            return None
    
    async def _update_job_status(self, job_id: str, status: str, metadata: Dict[str, Any]):
        """Update job status in database and send webhook notification."""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat(),
                **metadata
            }
            
            response = supabase.table('jobs').update(update_data).eq('id', job_id).execute()
            
            logger.info(f"Updated job {job_id} status to {status}")
            
            # Send webhook notification to Next.js app
            await self._send_webhook_notification(job_id, status, metadata)
            
        except Exception as e:
            logger.error(f"Error updating job status: {str(e)}")
            raise
    
    async def _send_webhook_notification(self, job_id: str, status: str, metadata: Dict[str, Any]):
        """Send webhook notification to the Next.js application."""
        try:
            webhook_url = os.getenv('WEBHOOK_URL')
            if not webhook_url:
                logger.warning("No WEBHOOK_URL configured, skipping webhook notification")
                return
            
            # Prepare webhook payload
            payload = {
                'analysis_id': job_id,
                'status': status,
                'frames_analyzed': metadata.get('frames_analyzed', 0),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Add result data for completed jobs
            if status == 'completed':
                payload['result'] = {
                    'json_url': metadata.get('result_json_url'),
                    'pdf_url': metadata.get('result_pdf_url'),
                    'processing_time': metadata.get('processing_time')
                }
            elif status == 'failed':
                payload['error'] = metadata.get('error', 'Unknown error')
            
            # Send webhook with timeout
            import aiohttp
            async with aiohttp.ClientSession() as session:
                try:
                    async with session.post(
                        webhook_url, 
                        json=payload,
                        headers={
                            'Content-Type': 'application/json',
                            'X-Webhook-Source': 'cloud-run-runner'
                        },
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        if response.status == 200:
                            logger.info(f"Successfully sent webhook for job {job_id}")
                        else:
                            logger.warning(f"Webhook returned status {response.status}: {await response.text()}")
                except asyncio.TimeoutError:
                    logger.warning("Webhook notification timed out")
                except Exception as e:
                    logger.warning(f"Failed to send webhook: {str(e)}")
                    # Don't fail the job update if webhook fails
                    
        except Exception as e:
            logger.error(f"Error in webhook notification: {str(e)}")
            # Don't fail the job update if webhook setup fails
    
    def _categorize_error(self, error: Exception) -> str:
        """Categorize error for better handling and alerting."""
        error_msg = str(error).lower()
        
        if "quota" in error_msg or "rate limit" in error_msg:
            return "quota_exceeded"
        elif "api key" in error_msg or "authentication" in error_msg:
            return "api_key_invalid"
        elif "storage" in error_msg or "bucket" in error_msg:
            return "storage_error"
        elif "timeout" in error_msg:
            return "timeout"
        elif "network" in error_msg or "connection" in error_msg:
            return "network_error"
        elif "memory" in error_msg or "resource" in error_msg:
            return "resource_error"
        elif "ffmpeg" in error_msg or "video" in error_msg:
            return "video_processing_error"
        else:
            return "unknown_error"
    
    async def _send_critical_error_alert(self, job_id: str, error_category: str, error_message: str):
        """Send alert for critical errors that need immediate attention."""
        try:
            # Log critical error with special formatting
            logger.critical(f"""
CRITICAL ERROR ALERT
===================
Job ID: {job_id}
Category: {error_category}
Worker: {WORKER_ID}
Time: {datetime.utcnow().isoformat()}

Error Message:
{error_message}

Action Required:
- Check API quotas and keys
- Verify storage permissions
- Review service configuration
===================
            """)
            
            # If webhook URL is configured, send alert there too
            webhook_url = os.getenv('WEBHOOK_URL')
            if webhook_url:
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    try:
                        alert_payload = {
                            'type': 'critical_error',
                            'job_id': job_id,
                            'error_category': error_category,
                            'error_message': error_message,
                            'worker_id': WORKER_ID,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                        await session.post(
                            webhook_url.replace('/analysis', '/alerts'),  # Use alerts endpoint
                            json=alert_payload,
                            headers={'Content-Type': 'application/json'},
                            timeout=aiohttp.ClientTimeout(total=5)
                        )
                    except Exception as e:
                        logger.error(f"Failed to send critical error alert: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Error in critical error alert: {str(e)}")
    
    def stop(self):
        """Stop the runner service."""
        logger.info("Stopping runner service...")
        self.running = False


async def health_check_handler():
    """Simple HTTP health check handler for Cloud Run."""
    from aiohttp import web
    
    async def health(request):
        return web.json_response({
            'status': 'healthy',
            'service': 'workflow-analyzer-runner',
            'worker_id': WORKER_ID,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    app = web.Application()
    app.router.add_get('/health', health)
    app.router.add_get('/', health)
    
    # Use PORT env var from Cloud Run
    port = int(os.getenv('PORT', '8080'))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    
    logger.info(f"Health check endpoint started on port {port}")
    return runner


async def main():
    """Main entry point."""
    processor = JobProcessor()
    
    # Handle graceful shutdown
    import signal
    
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}, shutting down...")
        processor.stop()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start health check endpoint
    health_runner = await health_check_handler()
    
    try:
        # Run the processor
        await processor.run()
    finally:
        # Cleanup health check
        await health_runner.cleanup()


if __name__ == '__main__':
    asyncio.run(main())