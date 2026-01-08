# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SaaS application for analyzing workflow screen recordings using AI. Users upload screen recordings, pay based on video length via Stripe, and receive detailed PDF reports with automation recommendations powered by Google Gemini AI. Includes n8n workflow generation to automatically convert discovered workflows into executable automation agents.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Auth & Database**: Supabase (PostgreSQL with Row Level Security)
- **Payments**: Stripe Checkout with webhook integration
- **Video Processing**: Google Cloud Run containerized Python service
- **AI Analysis**: Google Gemini 2.5 Flash/Pro models
- **Storage**: Supabase Storage (videos bucket: 500MB limit; reports bucket)
- **Workflow Automation**: n8n workflow generation and auto-import

## Development Commands

```bash
# Frontend (Next.js)
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run check:supabase  # Verify Supabase configuration

# Runner Service (Python) - from /runner directory
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python runner_service.py  # Start job processor
```

## Architecture

### Data Flow
```
User Payment → Stripe Webhook → Upload Record Created
     ↓
Video Upload → Supabase Storage → Analysis Record Created
     ↓
Cloud Run Polls → Downloads Video → Gemini Analysis → PDF Report
     ↓
Webhook Notification → Frontend Polls → User Downloads Report
     ↓
n8n Generator → Workflow JSON → Auto-import to n8n → Executable Agents
```

### Key Directories
- `/app/api/` - API routes (checkout, upload, analyses, webhooks)
- `/app/dashboard/` - Protected user pages (upload, analysis results)
- `/app/(marketing)/` - Public landing pages
- `/lib/supabase/` - Client (browser), server, and middleware Supabase configs
- `/lib/stripe/` - Stripe configuration and price calculation
- `/runner/` - Python Cloud Run service for video processing
- `../` (parent) - n8n workflow generator, importer, and agent templates

### Database Tables (Supabase)
- `profiles` - User profiles with Stripe customer IDs
- `uploads` - Video uploads with payment status and storage paths
- `analyses` - Processing jobs with status and results

### Storage Buckets
- `videos` - User video uploads (RLS by user_id folder)
- `reports` - Generated PDF analysis reports

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUD_RUN_SERVICE_URL=
GOOGLE_API_KEY=
```

## Key Implementation Details

### Price Calculation (`/lib/stripe/config.ts`)
- Base: $1.00 (0-5 minutes)
- Additional: $0.15 per minute after 5 minutes

### Authentication
- Supabase Auth with middleware session refresh (`/middleware.ts`)
- Server components use `createClient()` from `/lib/supabase/server.ts`
- Browser components use `/lib/supabase/client.ts`

### Analysis Flow
1. `POST /api/checkout` creates Stripe session with video duration
2. Stripe webhook (`/api/webhooks/stripe`) creates upload record with `status='paid'`
3. User uploads video via `POST /api/upload` → stored in Supabase Storage
4. Upload creates analysis record with `status='pending'`
5. Runner service (`/runner/runner_service.py`) polls for pending jobs using `claim_next_job` RPC
6. Runner downloads video, runs Gemini analysis, generates PDF
7. Results uploaded to storage, webhook sent to `/api/webhooks/analysis`

### Gemini Models
| Model | Name | Max Duration | Use Case |
|-------|------|--------------|----------|
| `pro` | gemini-2.5-pro | 120 min | Best for coding & agentic tasks |
| `flash` | gemini-2.5-flash | 60 min | Large-scale processing |
| `flash-lite` | gemini-2.5-flash-lite | 30 min | Fast, low-cost |
| `flash-preview` | gemini-2.5-flash-preview-09-2025 | 60 min | Improved agentic tool use |
| `audio` | gemini-2.5-flash-native-audio-preview | 30 min | Voice workflows |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health check with dependency status |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/upload` | POST | Upload video (requires paid upload record) |
| `/api/analyses` | GET/POST | List user analyses / Create new analysis |
| `/api/analyses/[id]` | GET/PATCH/DELETE | Manage specific analysis |
| `/api/webhooks/stripe` | POST | Stripe payment webhook |
| `/api/webhooks/analysis` | POST | Cloud Run status updates |

## n8n Workflow Automation

Located in parent directory (`../`), these Python modules convert video analysis results into n8n workflows:

### Files
- `n8n_workflow_generator.py` - Converts discovered workflows to n8n JSON format
- `n8n_importer.py` - Auto-imports workflows to n8n Cloud or self-hosted instances
- `n8n_agent_templates.py` - Pre-built AI agent templates

### Agent Templates
| Template | Description |
|----------|-------------|
| `EMAIL_TRIAGE` | Categorizes, prioritizes, and routes emails |
| `CRM_DATA_SYNC` | Syncs data between CRM systems |
| `CALENDAR_ASSISTANT` | Manages scheduling and appointments |
| `DOCUMENT_PROCESSOR` | Processes and extracts document data |
| `COMMUNICATION_ROUTER` | Routes messages across channels |
| `REPORT_GENERATOR` | Generates automated reports |
| `LEAD_QUALIFIER` | Qualifies and scores leads |
| `TASK_MANAGER` | Manages task creation and assignment |
| `MULTI_AGENT_ORCHESTRATOR` | Coordinates multiple agents |

### n8n Environment Variables
```env
N8N_API_URL=https://your-n8n-instance.com/api/v1
N8N_API_KEY=your-api-key
```

### Usage
```python
from n8n_workflow_generator import WorkflowGenerator
from n8n_importer import N8NClient

# Generate workflow from analysis
generator = WorkflowGenerator()
workflow = generator.from_analysis(analysis_results)

# Import to n8n
client = N8NClient()
result = client.import_workflow(workflow)
```

## Cloud Run Deployment

```bash
cd runner
docker build -t gcr.io/PROJECT_ID/workflow-analyzer-runner .
docker push gcr.io/PROJECT_ID/workflow-analyzer-runner
gcloud run deploy workflow-analyzer-runner \
  --image gcr.io/PROJECT_ID/workflow-analyzer-runner \
  --memory 2Gi --cpu 2 --timeout 900
```

## Database Migrations

Apply via Supabase CLI or dashboard. Migration files in `/supabase/migrations/`:
- `001_initial_schema.sql` - Tables and RLS policies
- `002_storage_setup.sql` - Storage buckets configuration

## Testing Webhooks Locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
