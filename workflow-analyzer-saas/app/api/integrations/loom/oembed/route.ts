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

    const { loomUrl } = await request.json()

    if (!loomUrl) {
      return NextResponse.json(
        { error: 'Missing Loom URL' },
        { status: 400 }
      )
    }

    try {
      // Use Loom's oEmbed endpoint to get video metadata
      const oembedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(loomUrl)}&format=json`
      
      const response = await fetch(oembedUrl)
      
      if (!response.ok) {
        throw new Error('Unable to fetch Loom video metadata')
      }

      const oembedData = await response.json()

      // Extract video ID from the embed HTML
      const videoIdMatch = oembedData.html?.match(/embed\/([a-zA-Z0-9]+)/)
      const videoId = videoIdMatch ? videoIdMatch[1] : null

      // Parse and return the metadata
      const metadata = {
        title: oembedData.title || 'Untitled Loom Video',
        thumbnail: oembedData.thumbnail_url,
        width: oembedData.width,
        height: oembedData.height,
        author: oembedData.author_name,
        authorUrl: oembedData.author_url,
        provider: oembedData.provider_name,
        embedHtml: oembedData.html,
        videoId,
        source: 'loom'
      }

      return NextResponse.json({
        success: true,
        metadata,
        oembedData
      })

    } catch (error) {
      console.error('Error fetching Loom oEmbed data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch video metadata from Loom' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Loom oEmbed error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}