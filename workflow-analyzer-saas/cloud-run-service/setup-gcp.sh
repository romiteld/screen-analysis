#!/bin/bash

# GCP Setup Script for Workflow Analyzer Cloud Run Service

echo "=== GCP Setup for Workflow Analyzer ==="
echo ""
echo "This script will help you set up the necessary GCP services."
echo ""

# Set project variables
PROJECT_ID="aidemo-345702"
REGION="us-central1"
SERVICE_NAME="workflow-analyzer-runner"

echo "Using project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Enable required APIs
echo "1. First, enable the required APIs by visiting these URLs:"
echo "   - Cloud Run: https://console.developers.google.com/apis/api/run.googleapis.com/overview?project=$PROJECT_ID"
echo "   - Cloud Build: https://console.developers.google.com/apis/api/cloudbuild.googleapis.com/overview?project=$PROJECT_ID"
echo "   - Container Registry: https://console.developers.google.com/apis/api/containerregistry.googleapis.com/overview?project=$PROJECT_ID"
echo ""
echo "2. Or run these commands if you have gcloud CLI installed:"
echo "   gcloud services enable run.googleapis.com --project=$PROJECT_ID"
echo "   gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID"
echo "   gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID"
echo ""

# Create environment file template
echo "3. Create a .env file with your credentials:"
cat > .env.example << EOF
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# GCS Bucket (optional, will be created if doesn't exist)
GCS_BUCKET_NAME=workflow-analyzer-videos

# GCP Project
PROJECT_ID=$PROJECT_ID
EOF

echo "   Created .env.example - rename to .env and fill in your values"
echo ""

# Build command
echo "4. Build and push the Docker image:"
echo "   docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME ."
echo "   docker push gcr.io/$PROJECT_ID/$SERVICE_NAME"
echo ""

# Deploy command
echo "5. Deploy to Cloud Run:"
echo "   gcloud run deploy $SERVICE_NAME \\"
echo "     --image gcr.io/$PROJECT_ID/$SERVICE_NAME \\"
echo "     --platform managed \\"
echo "     --region $REGION \\"
echo "     --allow-unauthenticated \\"
echo "     --memory 2Gi \\"
echo "     --cpu 2 \\"
echo "     --timeout 900 \\"
echo "     --concurrency 10 \\"
echo "     --set-env-vars SUPABASE_URL=\$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=\$SUPABASE_SERVICE_ROLE_KEY,GOOGLE_GEMINI_API_KEY=\$GOOGLE_GEMINI_API_KEY,GCS_BUCKET_NAME=\$GCS_BUCKET_NAME"
echo ""
echo "=== Setup Complete ==="