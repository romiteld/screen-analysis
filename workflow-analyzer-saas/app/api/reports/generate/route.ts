import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import PDFReport from '@/app/components/reports/PDFReport';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get analysis ID from request
    const { analysisId } = await request.json();
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    // Fetch analysis data with related upload info
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        uploads!inner (
          id,
          video_filename,
          user_id,
          created_at
        )
      `)
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysis) {
      console.error('Analysis fetch error:', analysisError);
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Verify user owns this analysis
    if (analysis.uploads.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if analysis is completed
    if (analysis.status !== 'completed') {
      return NextResponse.json({ error: 'Analysis not completed yet' }, { status: 400 });
    }

    // Parse the result data
    let resultData;
    try {
      resultData = typeof analysis.result_data === 'string' 
        ? JSON.parse(analysis.result_data) 
        : analysis.result_data;
    } catch (e) {
      console.error('Error parsing result data:', e);
      return NextResponse.json({ error: 'Invalid analysis data' }, { status: 500 });
    }

    // Prepare data for PDF generation
    const pdfData = {
      id: analysis.id,
      video_filename: analysis.uploads.video_filename || 'Unknown',
      created_at: analysis.created_at,
      analysis: resultData.analysis || '',
      metadata: resultData.metadata || {
        frames_analyzed: analysis.frames_analyzed || 0,
        timestamps: [],
        model: 'gemini-2.5-flash',
        analysis_date: analysis.completed_at || new Date().toISOString(),
      },
      workflow_summary: resultData.workflow_summary || {
        total_steps: 0,
        has_errors: false,
        tools_mentioned: [],
        key_sections: [],
      },
    };

    // Generate PDF
    const pdfElement = React.createElement(PDFReport, {
      analysisData: pdfData,
      companyName: 'Workflow Analyzer Pro'
    });
    // @ts-expect-error - PDFReport returns Document which is compatible with renderToBuffer
    const pdfBuffer = await renderToBuffer(pdfElement);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-analysis-${analysisId}-${timestamp}.pdf`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(`${user.id}/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload report' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(`${user.id}/${filename}`);

    // Update the upload record with report path
    await supabase
      .from('uploads')
      .update({ report_storage_path: `${user.id}/${filename}` })
      .eq('id', analysis.upload_id);

    return NextResponse.json({
      success: true,
      reportUrl: publicUrl,
      filename: filename,
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}