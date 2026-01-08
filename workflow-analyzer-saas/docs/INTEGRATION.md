# Workflow Analyzer SaaS - Backend Integration Guide

## Overview

This document describes the backend integration between the frontend application, Supabase, Stripe, and Cloud Run services.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  API Routes  │────▶│  Supabase   │
│  (Next.js)  │     │  (Next.js)   │     │ (Database)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────┐
                    │    Stripe    │     │ Cloud Run   │
                    │  (Payments)  │     │ (Analysis)  │
                    └──────────────┘     └─────────────┘
```

## Key Components

### 1. API Routes

All API routes are protected with Supabase authentication (except webhooks).

#### Main Routes:
- `/api/upload` - Handle video uploads
- `/api/analyses` - Manage analyses (list, create)
- `/api/analyses/[id]` - Get specific analysis details
- `/api/checkout` - Create Stripe checkout sessions
- `/api/webhooks/stripe` - Handle Stripe payment events
- `/api/webhooks/analysis` - Handle Cloud Run analysis updates
- `/api/health` - Application health check

### 2. Authentication Flow

1. User authenticates via Supabase Auth
2. Frontend includes auth token in API requests
3. API routes verify token using `createClient` from Supabase
4. User context is available throughout the request

### 3. Payment Flow

1. User selects video duration
2. Frontend calls `/api/checkout` to create Stripe session
3. User completes payment on Stripe
4. Stripe webhook updates upload status to "paid"
5. User can now upload their video

### 4. Video Analysis Flow

1. User uploads video to `/api/upload`
2. Video stored in Supabase Storage
3. Analysis record created in database
4. Cloud Run service triggered with analysis ID
5. Cloud Run processes video asynchronously
6. Status updates sent via webhook to `/api/webhooks/analysis`
7. Frontend polls `/api/analyses/[id]` for results

### 5. Error Handling

All API routes use centralized error handling:

```typescript
import { logError, errorResponse } from '@/lib/utils/api-helpers'

try {
  // API logic
} catch (error) {
  logError('Context', error)
  return errorResponse('User-friendly message', statusCode)
}
```

### 6. Logging

Structured logging is implemented across all services:

```typescript
import { logInfo, logError, logWebhook } from '@/lib/utils/logger'

// Log API events
logInfo('Analysis created', { userId, analysisId })

// Log webhooks
logWebhook('stripe', 'payment.succeeded', { metadata })

// Log errors with context
logError('Failed to process', error, { context: 'api' })
```

## Environment Variables

Required environment variables for backend services:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloud Run
CLOUD_RUN_SERVICE_URL=
CLOUD_RUN_SERVICE_TOKEN=
CLOUD_RUN_WEBHOOK_SECRET=

# Service Auth
SERVICE_SECRET_TOKEN=
```

## Database Schema

### Key Tables:
- `profiles` - User profiles with Stripe customer IDs
- `uploads` - Payment and video upload records
- `analyses` - Video analysis jobs and results

### Row Level Security (RLS):
- Users can only access their own data
- Service role has full access for webhooks

## Webhook Security

### Stripe Webhooks
- Signature verification using `stripe.webhooks.constructEvent`
- Endpoint: `/api/webhooks/stripe`
- Events handled: `checkout.session.completed`, `payment_intent.succeeded`, etc.

### Cloud Run Webhooks
- Optional HMAC signature verification
- Endpoint: `/api/webhooks/analysis`
- Updates analysis status and results

## Monitoring

### Health Check Endpoint
- URL: `/api/health`
- Checks: Database, Storage, Stripe, Cloud Run
- Returns detailed service status

### Logging
- Structured JSON logs
- Error tracking with stack traces
- Request/response logging for debugging

## Rate Limiting

API endpoints are rate limited:
- 60 requests per minute per IP
- Headers indicate limit status
- 429 response when exceeded

## Best Practices

1. **Always use typed responses**
   ```typescript
   return NextResponse.json<ApiResponse>({ data, error })
   ```

2. **Validate input data**
   ```typescript
   validateRequired(data, ['required_field'])
   ```

3. **Handle errors gracefully**
   - Log errors with context
   - Return user-friendly messages
   - Don't expose internal details

4. **Use transactions for related operations**
   - Ensure data consistency
   - Rollback on failures

5. **Monitor webhook deliveries**
   - Log all webhook events
   - Implement retry logic if needed
   - Alert on repeated failures

## Troubleshooting

### Common Issues:

1. **Authentication Errors**
   - Check Supabase auth token
   - Verify RLS policies
   - Check service role key for webhooks

2. **Payment Issues**
   - Verify Stripe webhook signature
   - Check webhook endpoint in Stripe dashboard
   - Ensure upload records are created

3. **Analysis Not Starting**
   - Check Cloud Run service URL
   - Verify service authentication
   - Check video upload success

4. **Webhook Failures**
   - Check webhook signatures
   - Verify endpoint URLs
   - Monitor Cloud Run logs

## Development Tips

1. Use the health check endpoint to verify service connectivity
2. Monitor Supabase logs for RLS policy violations
3. Use Stripe CLI for local webhook testing
4. Check Cloud Run logs for analysis errors
5. Implement proper error boundaries in frontend

## Security Considerations

1. Never expose service role keys
2. Validate all user input
3. Use HTTPS for all communications
4. Implement proper CORS policies
5. Regularly rotate API keys
6. Monitor for suspicious activity