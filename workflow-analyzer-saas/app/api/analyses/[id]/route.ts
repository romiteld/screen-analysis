import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysisId = params.id

    // Fetch analysis with related upload data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        uploads!inner(
          id,
          video_filename,
          video_storage_path,
          seconds,
          amount,
          status,
          prompt,
          model,
          created_at
        )
      `)
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (analysisError) {
      console.error('Error fetching analysis:', analysisError)
      
      if (analysisError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch analysis' },
        { status: 500 }
      )
    }

    // Get video URL if available
    let videoUrl = null
    if (analysis.uploads.video_storage_path) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(analysis.uploads.video_storage_path)
      videoUrl = publicUrl
    }

    // Format response
    const response = {
      id: analysis.id,
      status: analysis.status,
      started_at: analysis.started_at,
      completed_at: analysis.completed_at,
      frames_analyzed: analysis.frames_analyzed,
      error_message: analysis.error_message,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at,
      result: analysis.result_data,
      upload: {
        id: analysis.uploads.id,
        video_filename: analysis.uploads.video_filename,
        video_url: videoUrl,
        seconds: analysis.uploads.seconds,
        amount: analysis.uploads.amount,
        status: analysis.uploads.status,
        prompt: analysis.uploads.prompt,
        model: analysis.uploads.model,
        created_at: analysis.uploads.created_at
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in analysis route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Update analysis (for admin/service use)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysisId = params.id
    const updates = await request.json()

    // Verify ownership
    const { data: existingAnalysis, error: checkError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingAnalysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Only allow certain fields to be updated by users
    const allowedUpdates: Record<string, any> = {}
    const allowedFields = ['status'] // Add more fields as needed
    
    for (const field of allowedFields) {
      if (field in updates) {
        allowedUpdates[field] = updates[field]
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    allowedUpdates.updated_at = new Date().toISOString()

    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('analyses')
      .update(allowedUpdates)
      .eq('id', analysisId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating analysis:', updateError)
      return NextResponse.json(
        { error: 'Failed to update analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedAnalysis)

  } catch (error) {
    console.error('Error in analysis PATCH route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Delete analysis (soft delete by updating status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysisId = params.id

    // Soft delete by updating status
    const { error: deleteError } = await supabase
      .from('analyses')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting analysis:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in analysis DELETE route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}