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

    try {
      // Attempt to fetch the Loom page to extract metadata
      const response = await fetch(loomUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        throw new Error('Unable to access Loom video')
      }

      const html = await response.text()

      // Extract metadata from the page
      // Note: This is a basic extraction and may need updates if Loom changes their HTML structure
      const metadata: any = {
        videoId,
        source: 'loom'
      }

      // Try to extract title
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
      if (titleMatch) {
        metadata.title = titleMatch[1]
      }

      // Try to extract thumbnail
      const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      if (thumbnailMatch) {
        metadata.thumbnail = thumbnailMatch[1]
      }

      // Try to extract duration
      const durationMatch = html.match(/<meta property="video:duration" content="([^"]+)"/)
      if (durationMatch) {
        metadata.duration = parseInt(durationMatch[1])
      }

      // Try to extract description
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/)
      if (descriptionMatch) {
        metadata.description = descriptionMatch[1]
      }

      return NextResponse.json({
        success: true,
        metadata,
        embedUrl: `https://www.loom.com/embed/${videoId}`,
        downloadUrl: null // Loom doesn't provide direct download URLs
      })

    } catch (error) {
      console.error('Error fetching Loom metadata:', error)
      // Return basic metadata even if we can't fetch from the page
      return NextResponse.json({
        success: true,
        metadata: {
          videoId,
          source: 'loom',
          title: 'Loom Video',
          requiresManualDownload: true
        },
        embedUrl: `https://www.loom.com/embed/${videoId}`,
        downloadUrl: null
      })
    }

  } catch (error) {
    console.error('Loom metadata error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Loom metadata' },
      { status: 500 }
    )
  }
}