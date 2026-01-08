import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { loomUrl, videoId } = await request.json()

    if (!loomUrl || !videoId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Loom URL
    const loomUrlPattern = /^https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/
    if (!loomUrlPattern.test(loomUrl)) {
      return NextResponse.json(
        { error: 'Invalid Loom URL' },
        { status: 400 }
      )
    }

    // Since Loom doesn't have a public API, we'll need to handle this differently
    // Option 1: Direct user to download the video manually and then upload
    // Option 2: Use the Loom embed URL for preview
    // Option 3: Parse the Loom page to extract video information (not recommended)

    // For now, we'll store the Loom URL and metadata
    // The actual video download will need to be handled client-side
    // or through a more complex integration

    // Generate embed URL for Loom video
    const embedUrl = `https://www.loom.com/embed/${videoId}`
    
    // Get video metadata by checking if the URL is accessible
    const checkResponse = await fetch(loomUrl, { method: 'HEAD' })
    if (!checkResponse.ok) {
      return NextResponse.json(
        { error: 'Unable to access Loom video. Please check the URL and permissions.' },
        { status: 400 }
      )
    }

    // Return metadata for the client to handle
    return NextResponse.json({
      success: true,
      videoUrl: loomUrl,
      metadata: {
        videoId,
        embedUrl,
        source: 'loom',
        requiresManualDownload: true,
        instructions: 'Please download the video from Loom and upload it using the standard uploader.'
      }
    })

  } catch (error) {
    console.error('Loom import error:', error)
    return NextResponse.json(
      { error: 'Failed to process Loom video' },
      { status: 500 }
    )
  }
}