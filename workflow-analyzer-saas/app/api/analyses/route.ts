import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, errorResponse, validateRequired } from '@/lib/utils/api-helpers'
import { logApiError, logInfo, logError } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Validate pagination
    const validatedLimit = Math.min(Math.max(limit, 1), 100)
    const validatedPage = Math.max(page, 1)
    const offset = (validatedPage - 1) * validatedLimit
    
    // Build query
    let query = supabase
      .from('analyses')
      .select(`
        *,
        uploads!inner(
          id,
          video_filename,
          seconds,
          amount,
          status as upload_status,
          created_at as upload_created_at
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
    
    // Apply filters
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status)
    }
    
    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'completed_at', 'status']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortAscending = sortOrder === 'asc'
    
    query = query.order(sortField, { ascending: sortAscending })
    
    // Apply pagination
    query = query.range(offset, offset + validatedLimit - 1)
    
    const { data: analyses, error, count } = await query
    
    if (error) {
      throw error
    }
    
    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / validatedLimit) : 0
    const hasNextPage = validatedPage < totalPages
    const hasPreviousPage = validatedPage > 1
    
    logInfo('Analyses fetched', {
      context: 'api',
      userId: user.id,
      metadata: {
        count: analyses?.length || 0,
        page: validatedPage,
        status
      }
    })
    
    return NextResponse.json({
      data: analyses || [],
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })
    
  } catch (error: any) {
    logApiError('/api/analyses', error, undefined, {
      method: 'GET'
    })
    
    if (error.name === 'AuthError') {
      return errorResponse(error.message, error.status)
    }
    
    return errorResponse('Failed to fetch analyses', 500)
  }
}

// Create a new analysis (typically triggered after upload)
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth()
    const data = await request.json()
    
    // Validate required fields
    validateRequired(data, ['upload_id'])
    
    // Verify the upload belongs to the user and is paid
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, status, video_storage_path')
      .eq('id', data.upload_id)
      .eq('user_id', user.id)
      .single()
    
    if (uploadError || !upload) {
      return errorResponse('Upload not found', 404)
    }
    
    if (upload.status !== 'paid') {
      return errorResponse('Upload payment required', 402)
    }
    
    if (!upload.video_storage_path) {
      return errorResponse('No video uploaded for this upload', 400)
    }
    
    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('analyses')
      .select('id')
      .eq('upload_id', data.upload_id)
      .single()
    
    if (existingAnalysis) {
      return errorResponse('Analysis already exists for this upload', 409)
    }
    
    // Create new analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        upload_id: data.upload_id,
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single()
    
    if (analysisError) {
      throw analysisError
    }
    
    // Get video URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(upload.video_storage_path)
    
    // Trigger Cloud Run service
    const cloudRunUrl = process.env.CLOUD_RUN_SERVICE_URL
    if (cloudRunUrl) {
      try {
        const response = await fetch(`${cloudRunUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLOUD_RUN_SERVICE_TOKEN || ''}`
          },
          body: JSON.stringify({
            analysis_id: analysis.id,
            video_url: publicUrl,
            prompt: data.prompt || 'Analyze this workflow video and provide detailed recommendations.'
          })
        })
        
        if (!response.ok) {
          logError('Failed to trigger Cloud Run service', new Error(await response.text()), {
            context: 'api',
            userId: user.id,
            metadata: { analysis_id: analysis.id }
          })
        }
      } catch (triggerError) {
        logError('Error triggering Cloud Run service', triggerError as Error, {
          context: 'api',
          userId: user.id,
          metadata: { analysis_id: analysis.id }
        })
      }
    }
    
    logInfo('Analysis created', {
      context: 'api',
      userId: user.id,
      metadata: {
        analysisId: analysis.id,
        uploadId: data.upload_id
      }
    })
    
    return NextResponse.json({
      data: analysis,
      message: 'Analysis created and processing started'
    }, { status: 201 })
    
  } catch (error: any) {
    logApiError('/api/analyses', error, undefined, {
      method: 'POST'
    })
    
    if (error.name === 'AuthError') {
      return errorResponse(error.message, error.status)
    }
    
    if (error.name === 'ValidationError') {
      return errorResponse(error.message, error.status, error.details)
    }
    
    return errorResponse('Failed to create analysis', 500)
  }
}