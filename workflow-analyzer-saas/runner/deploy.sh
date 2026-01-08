#!/bin/bash

# Deployment script for the runner service
# This service processes video analysis jobs from the queue

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if .env file exists
if [ ! -f "../.env" ]; then
    print_error ".env file not found. Please create it from .env.example"
    exit 1
fi

# Load environment variables
set -a
source ../.env
set +a

# Set deployment variables
PROJECT_ID="${GCP_PROJECT_ID:-workflow-analyzer-prod}"
SERVICE_NAME="workflow-analyzer-runner"
REGION="${GCP_REGION:-us-central1}"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Validate required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$GOOGLE_API_KEY" ]; then
    print_error "Missing required environment variables. Please check your .env file"
    exit 1
fi

print_status "Starting deployment of $SERVICE_NAME to Cloud Run..."

# Build Docker image
print_status "Building Docker image..."
docker build -t $IMAGE_NAME -f Dockerfile ..

if [ $? -ne 0 ]; then
    print_error "Docker build failed"
    exit 1
fi

# Configure Docker to use gcloud as credential helper
print_status "Configuring Docker authentication..."
gcloud auth configure-docker

# Push image to Google Container Registry
print_status "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

if [ $? -ne 0 ]; then
    print_error "Failed to push Docker image"
    exit 1
fi

# Deploy to Cloud Run
print_status "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --no-allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 1 \
  --set-env-vars "\
SUPABASE_URL=$SUPABASE_URL,\
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,\
GOOGLE_API_KEY=$GOOGLE_API_KEY,\
WEBHOOK_URL=${NEXT_PUBLIC_APP_URL}/api/webhooks/analysis,\
POLL_INTERVAL=10,\
WORKER_ID=cloud-run-$(date +%s)" \
  --service-account "$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --project $PROJECT_ID

if [ $? -ne 0 ]; then
    print_error "Cloud Run deployment failed"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

print_status "Deployment complete!"
print_status "Service URL: $SERVICE_URL"

# Create or update service account if needed
print_status "Setting up service account permissions..."
gcloud iam service-accounts create $SERVICE_NAME \
  --display-name="Workflow Analyzer Runner Service" \
  --project $PROJECT_ID 2>/dev/null || print_warning "Service account already exists"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer" \
  --quiet

# Create Cloud Scheduler job to keep the service warm (optional)
print_status "Setting up Cloud Scheduler to prevent cold starts..."
gcloud scheduler jobs create http keep-runner-warm \
  --location $REGION \
  --schedule "*/5 * * * *" \
  --uri "$SERVICE_URL/health" \
  --http-method GET \
  --attempt-deadline 30s \
  --project $PROJECT_ID 2>/dev/null || print_warning "Scheduler job already exists"

print_status "Runner service deployed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Update CLOUD_RUN_SERVICE_URL in your .env file to: $SERVICE_URL"
print_status "2. Test the service by uploading a video through the web interface"
print_status "3. Monitor logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME' --limit 50"