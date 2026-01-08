import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, logWebhook, logAnalysis } from '@/lib/utils/logger'
import { errorResponse } from '@/lib/utils/api-helpers'

// Verify webhook signature if needed (depends on your Cloud Run setup)
const verifyWebhookSignature = (request: NextRequest): boolean => {
  // If you implement webhook signatures in Cloud Run, verify here
  const signature = request.headers.get('x-webhook-signature')
  const secret = process.env.CLOUD_RUN_WEBHOOK_SECRET
  
  if (!secret) {
    // No secret configured, skip verification
    return true
  }
  
  // Implement signature verification if needed
  // For now, we'll accept all requests from Cloud Run
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { analysis_id, status, result, error, frames_analyzed } = data

    if (!analysis_id) {
      return NextResponse.json(
        { error: 'Missing analysis_id' },
        { status: 400 }
      )
    }

    logWebhook('cloud-run-analysis', status, {
      analysis_id,
      frames_analyzed,
      has_error: !!error
    })

    const supabase = await createClient()

    // Update analysis record
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'processing') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.result_data = result
      updateData.frames_analyzed = frames_analyzed
    } else if (status === 'failed') {
      updateData.completed_at = new Date().toISOString()
      updateData.error_message = error || 'Unknown error'
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', analysis_id)
      .select()
      .single()

    if (analysisError) {
      console.error('Failed to update analysis:', analysisError)
      return NextResponse.json(
        { error: 'Failed to update analysis record' },
        { status: 500 }
      )
    }

    // Also update the related upload record
    if (analysis && analysis.upload_id) {
      const uploadUpdateData: any = {
        analysis_status: status,
        updated_at: new Date().toISOString()
      }

      if (status === 'processing') {
        uploadUpdateData.analysis_started_at = new Date().toISOString()
      } else if (status === 'completed') {
        uploadUpdateData.analysis_completed_at = new Date().toISOString()
      } else if (status === 'failed') {
        uploadUpdateData.analysis_completed_at = new Date().toISOString()
        uploadUpdateData.analysis_error = error || 'Analysis failed'
      }

      const { error: uploadError } = await supabase
        .from('uploads')
        .update(uploadUpdateData)
        .eq('id', analysis.upload_id)

      if (uploadError) {
        console.error('Failed to update upload record:', uploadError)
      }
    }

    // If analysis is completed, we might want to trigger report generation
    if (status === 'completed' && result) {
      // Log for now, you can add report generation logic here
      console.log('Analysis completed successfully, ready for report generation')
      
      // Optional: Send notification to user
      // You could implement email notification or real-time updates here
    }

    return NextResponse.json({ 
      received: true,
      analysis_id,
      status 
    })

  } catch (error) {
    console.error('Error processing analysis webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Health check endpoint for webhook
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: 'analysis-webhook'
  })
}