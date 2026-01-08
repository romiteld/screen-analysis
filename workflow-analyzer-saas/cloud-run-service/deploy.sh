#!/bin/bash

# Load environment variables
source .env

# Set variables
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="workflow-analyzer-runner"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building Docker image..."
docker build -t $IMAGE_NAME .

echo "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 10 \
  --set-env-vars "SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,GOOGLE_GEMINI_API_KEY=$GOOGLE_GEMINI_API_KEY,GCS_BUCKET_NAME=$GCS_BUCKET_NAME"

echo "Deployment complete!"