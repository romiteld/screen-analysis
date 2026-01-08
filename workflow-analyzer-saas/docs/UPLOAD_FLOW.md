# Video Upload Flow Documentation

## Overview

This document describes the complete video upload flow for the Workflow Analyzer SaaS application.

## Architecture

### Storage
- **Supabase Storage** is used for storing video files
- Two buckets are configured:
  - `videos` - For user video uploads (500MB limit, supports MP4, MOV, WebM, AVI)
  - `reports` - For generated analysis reports

### Database Tables
- **profiles** - User profiles linked to Supabase Auth
- **uploads** - Tracks upload records and payment status
- **analyses** - Tracks analysis jobs and results

### Security
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Storage paths are organized by user ID to ensure isolation

## Upload Flow

### 1. Payment Flow
1. User selects video length and initiates payment
2. Stripe payment intent is created
3. Upon successful payment, an upload record is created with status `paid`

### 2. Video Upload
1. User is redirected to `/dashboard/upload?upload_id={id}`
2. The `VideoUploader` component handles the file upload:
   - Drag-and-drop or click to select file
   - Client-side validation (file type and size)
   - Progress tracking using XMLHttpRequest
   - Upload to Supabase Storage via `/api/upload` endpoint

### 3. API Processing (`/api/upload`)
1. Validates authentication
2. Verifies upload record exists and is paid
3. Uploads file to Supabase Storage (`videos` bucket)
4. Updates upload record with storage path
5. Creates analysis record
6. Triggers Cloud Run service (if configured)

### 4. Analysis Processing
1. Analysis status is tracked in the database
2. Status progression: `pending` → `processing` → `completed`/`failed`
3. Frontend polls for status updates
4. Results stored in `analyses` table

## File Structure

```
/app
  /api
    /upload
      route.ts          # Upload API endpoint
  /components
    /upload
      VideoUploader.tsx # Upload component with drag-drop
  /dashboard
    /upload
      page.tsx         # Upload page

/lib
  /supabase
    client.ts          # Browser Supabase client
    server.ts          # Server Supabase client

/supabase
  /migrations
    001_initial_schema.sql    # Database schema
    002_storage_setup.sql     # Storage buckets and RLS

/types
  database.ts          # TypeScript types for database
```

## Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloud Run (optional)
CLOUD_RUN_SERVICE_URL=your-cloud-run-url
CLOUD_RUN_SERVICE_TOKEN=your-service-token
```

### Storage Bucket Configuration
- **videos bucket**:
  - File size limit: 500MB
  - Allowed MIME types: video/mp4, video/quicktime, video/webm, video/x-msvideo
  - Private bucket with RLS policies

### RLS Policies
- Users can upload/view/delete their own videos
- Videos are stored in user-specific folders: `{user_id}/{filename}`
- Service role has full access for backend operations

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`

3. Check Supabase configuration:
   ```bash
   npm run check:supabase
   ```

4. Apply migrations if needed through Supabase dashboard

## Testing the Upload Flow

1. Create a test user account
2. Complete a payment to get an upload ID
3. Navigate to the upload page
4. Upload a test video file
5. Monitor the upload progress
6. Check Supabase Storage for the uploaded file
7. Verify database records are updated correctly

## Error Handling

The upload flow includes comprehensive error handling:
- File validation errors (type, size)
- Network errors during upload
- Authentication errors
- Payment verification
- Storage errors
- Database update errors

All errors are displayed to the user with clear messages.

## Security Considerations

1. **Authentication**: All uploads require authenticated users
2. **Payment Verification**: Uploads only allowed after payment
3. **File Isolation**: Each user's files stored in separate folders
4. **RLS Policies**: Database and storage access restricted by user
5. **File Type Validation**: Only video files allowed
6. **Size Limits**: 500MB limit prevents abuse

## Monitoring

Monitor the following for a healthy upload system:
- Storage bucket usage
- Failed upload attempts
- Analysis job queue length
- Error logs in API routes