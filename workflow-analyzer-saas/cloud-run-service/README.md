# Cloud Run Service Deployment Guide

This service handles video analysis using Google Gemini 2.5 Flash API.

## Prerequisites

1. Enable required APIs in GCP Console:
   - Cloud Run API
   - Cloud Build API
   - Container Registry API

2. Install Google Cloud SDK:
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

3. Authenticate with GCP:
   ```bash
   gcloud auth login
   gcloud config set project aidemo-345702
   ```

## Environment Variables

Create a `.env` file with:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
GCS_BUCKET_NAME=workflow-analyzer-videos
```

## Manual Deployment Steps

1. **Build the Docker image locally:**
   ```bash
   docker build -t gcr.io/aidemo-345702/workflow-analyzer-runner .
   ```

2. **Configure Docker for GCR:**
   ```bash
   gcloud auth configure-docker
   ```

3. **Push the image to Google Container Registry:**
   ```bash
   docker push gcr.io/aidemo-345702/workflow-analyzer-runner
   ```

4. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy workflow-analyzer-runner \
     --image gcr.io/aidemo-345702/workflow-analyzer-runner \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 900 \
     --concurrency 10 \
     --set-env-vars "SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY},GCS_BUCKET_NAME=${GCS_BUCKET_NAME}"
   ```

## Alternative: Using Cloud Build

You can also use the provided `cloudbuild.yaml`:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _SUPABASE_URL="${SUPABASE_URL}",_SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}",_GOOGLE_GEMINI_API_KEY="${GOOGLE_GEMINI_API_KEY}",_GCS_BUCKET_NAME="${GCS_BUCKET_NAME}"
```

## Testing the Service

Once deployed, you can test the health endpoint:
```bash
curl https://workflow-analyzer-runner-[HASH]-uc.a.run.app/health
```

To trigger an analysis:
```bash
curl -X POST https://workflow-analyzer-runner-[HASH]-uc.a.run.app/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_id": "test-123",
    "video_url": "https://example.com/video.mp4",
    "prompt": "Analyze this workflow video"
  }'
```

## Service Endpoints

- `GET /health` - Health check
- `POST /analyze` - Trigger video analysis
  - Required fields: `analysis_id`, `video_url`, `prompt`

## Architecture

The service:
1. Receives analysis requests via HTTP POST
2. Downloads and extracts frames from videos
3. Analyzes frames using Gemini 2.5 Flash
4. Stores results in Supabase
5. Updates analysis status throughout the process