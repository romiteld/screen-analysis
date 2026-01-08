#!/bin/bash

# Deploy runner service to Google Cloud Run with environment variables

PROJECT_ID="aidemo-345702"
SERVICE_NAME="workflow-analyzer-runner"
REGION="us-east1"

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --source=. \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="SUPABASE_URL=https://vyoblfqlqcynccioizjp.supabase.co,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5b2JsZnFscWN5bmNjaW9pempwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAxMTQ4NywiZXhwIjoyMDY2NTg3NDg3fQ.BLwvn_IIDrB_GSfwjqAIbliIqB8jZ8lsoOZjD9kZmIA,GOOGLE_API_KEY=AIzaSyBSj_83jAHNuQR9YQvq4S4X98nTVRTlgkA,POLL_INTERVAL=10,WORKER_ID=cloud-run-worker-01,LOG_LEVEL=INFO" \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=5 \
  --min-instances=0

echo "Deployment complete. Service URL will be displayed above."