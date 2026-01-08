import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get videos older than 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Query uploads table for old videos
    const { data: oldUploads, error: queryError } = await supabaseClient
      .from('uploads')
      .select('id, video_storage_path, user_id')
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .not('video_storage_path', 'is', null)

    if (queryError) {
      throw queryError
    }

    console.log(`Found ${oldUploads?.length || 0} videos to delete`)

    const deletionResults = []

    // Delete each video
    for (const upload of oldUploads || []) {
      try {
        // Extract bucket and path from storage path
        const pathParts = upload.video_storage_path.split('/')
        const bucket = pathParts[0]
        const filePath = pathParts.slice(1).join('/')

        // Delete from storage
        const { error: deleteError } = await supabaseClient
          .storage
          .from(bucket)
          .remove([filePath])

        if (deleteError) {
          console.error(`Failed to delete ${upload.video_storage_path}:`, deleteError)
          deletionResults.push({
            id: upload.id,
            status: 'error',
            error: deleteError.message
          })
          continue
        }

        // Update the upload record to clear the storage path
        const { error: updateError } = await supabaseClient
          .from('uploads')
          .update({ 
            video_storage_path: null,
            video_deleted_at: new Date().toISOString()
          })
          .eq('id', upload.id)

        if (updateError) {
          console.error(`Failed to update upload record ${upload.id}:`, updateError)
          deletionResults.push({
            id: upload.id,
            status: 'error',
            error: updateError.message
          })
          continue
        }

        deletionResults.push({
          id: upload.id,
          status: 'success'
        })

        console.log(`Successfully deleted video for upload ${upload.id}`)

      } catch (error) {
        console.error(`Error processing upload ${upload.id}:`, error)
        deletionResults.push({
          id: upload.id,
          status: 'error',
          error: error.message
        })
      }
    }

    // Return summary
    const successCount = deletionResults.filter(r => r.status === 'success').length
    const errorCount = deletionResults.filter(r => r.status === 'error').length

    return new Response(
      JSON.stringify({
        message: `Processed ${oldUploads?.length || 0} videos`,
        deleted: successCount,
        errors: errorCount,
        details: deletionResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in auto-delete function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})