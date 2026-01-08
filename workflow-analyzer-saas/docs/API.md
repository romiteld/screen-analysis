# Workflow Analyzer SaaS API Documentation

## Overview

This document describes the API endpoints available in the Workflow Analyzer SaaS application.

## Authentication

Most API endpoints require authentication via Supabase Auth. Include the authentication token in the Authorization header:

```
Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN
```

## Base URL

```
https://your-domain.com/api
```

## Endpoints

### Health Check

#### GET /api/health

Check the health status of the application and its dependencies.

**Query Parameters:**
- `simple` (optional): Set to `true` for a simple health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "api": { "status": "up" },
    "database": { "status": "up", "responseTime": 15 },
    "storage": { "status": "up", "responseTime": 23 },
    "stripe": { "status": "up", "responseTime": 150 },
    "cloudRun": { "status": "up", "responseTime": 200 }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Upload Management

#### POST /api/upload

Upload a video file for analysis.

**Request:** Form Data
- `file`: Video file (MP4, MOV, WebM, or AVI)
- `uploadId`: ID of the upload record

**Response:**
```json
{
  "success": true,
  "uploadId": "uuid",
  "analysisId": "uuid",
  "url": "https://storage.url/video.mp4",
  "message": "Upload successful. Analysis will begin shortly."
}
```

### Analysis Management

#### GET /api/analyses

List all analyses for the authenticated user.

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 10, max: 100): Items per page
- `status`: Filter by status (pending, processing, completed, failed)
- `sortBy`: Sort field (created_at, updated_at, completed_at, status)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "completed",
      "started_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:10:00Z",
      "frames_analyzed": 120,
      "uploads": {
        "id": "uuid",
        "video_filename": "workflow.mp4",
        "seconds": 300,
        "amount": 1.50
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### POST /api/analyses

Create a new analysis for an uploaded video.

**Request Body:**
```json
{
  "upload_id": "uuid",
  "prompt": "Custom analysis prompt (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "upload_id": "uuid",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Analysis created and processing started"
}
```

#### GET /api/analyses/{id}

Get details of a specific analysis.

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "started_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:10:00Z",
  "frames_analyzed": 120,
  "result": {
    "summary": "Analysis summary...",
    "recommendations": ["..."],
    "timeline": [...]
  },
  "upload": {
    "id": "uuid",
    "video_filename": "workflow.mp4",
    "video_url": "https://storage.url/video.mp4",
    "seconds": 300,
    "amount": 1.50
  }
}
```

#### PATCH /api/analyses/{id}

Update an analysis (limited fields).

**Request Body:**
```json
{
  "status": "cancelled"
}
```

#### DELETE /api/analyses/{id}

Soft delete an analysis.

### Payment Integration

#### POST /api/checkout

Create a Stripe checkout session.

**Request Body:**
```json
{
  "seconds": 300,
  "uploadId": "uuid (optional)"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### Reports

#### POST /api/reports/generate

Generate a PDF report for an analysis.

**Request Body:**
```json
{
  "analysisId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "reportUrl": "https://storage.url/report.pdf"
}
```

### Webhooks

#### POST /api/webhooks/stripe

Stripe webhook endpoint for payment events.

**Headers:**
- `stripe-signature`: Stripe webhook signature

#### POST /api/webhooks/analysis

Cloud Run webhook endpoint for analysis status updates.

**Request Body:**
```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "result": {...},
  "frames_analyzed": 120
}
```

### Integrations

#### POST /api/integrations/loom/metadata

Fetch Loom video metadata.

**Request Body:**
```json
{
  "loomUrl": "https://www.loom.com/share/..."
}
```

#### POST /api/integrations/loom/import

Import a Loom video for analysis.

**Request Body:**
```json
{
  "videoId": "loom-video-id",
  "title": "Video Title",
  "duration": 300,
  "thumbnailUrl": "https://..."
}
```

## Error Responses

All endpoints use consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    "field": "Additional error details"
  }
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error
- 503: Service Unavailable

## Rate Limiting

API endpoints are rate limited to 60 requests per minute per IP address.

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait (on 429 responses)