import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadId = formData.get('uploadId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadId) {
      return NextResponse.json({ error: 'No upload ID provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, WebM, and AVI files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 500MB limit.' },
        { status: 400 }
      )
    }

    // Verify the upload record exists and belongs to the user
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 })
    }

    // Check if upload is paid
    if (upload.status !== 'paid') {
      return NextResponse.json({ error: 'Payment required before upload' }, { status: 402 })
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    // Update upload record with storage path
    const { error: updateError } = await supabase
      .from('uploads')
      .update({
        video_storage_path: filePath,
        video_filename: file.name,
        analysis_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file
      await supabase.storage.from('videos').remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to update upload record' },
        { status: 500 }
      )
    }

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        upload_id: uploadId,
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Analysis creation error:', analysisError)
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      )
    }

    // Trigger Cloud Run service
    try {
      const cloudRunUrl = process.env.CLOUD_RUN_SERVICE_URL
      if (cloudRunUrl) {
        const response = await fetch(`${cloudRunUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLOUD_RUN_SERVICE_TOKEN || ''}`
          },
          body: JSON.stringify({
            analysis_id: analysis.id,
            video_url: publicUrl,
            prompt: upload.prompt || 'Analyze this workflow video and provide detailed recommendations for automation.'
          })
        })

        if (!response.ok) {
          console.error('Cloud Run trigger failed:', await response.text())
          // Don't fail the upload, just log the error
        }
      } else {
        console.warn('CLOUD_RUN_SERVICE_URL not configured')
      }
    } catch (triggerError) {
      console.error('Failed to trigger Cloud Run service:', triggerError)
      // Don't fail the upload, the job can be picked up by a polling service
    }

    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      analysisId: analysis.id,
      url: publicUrl,
      message: 'Upload successful. Analysis will begin shortly.'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    )
  }
}