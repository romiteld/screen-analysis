-- Function to atomically claim the next available job
-- This prevents race conditions when multiple workers are running

CREATE OR REPLACE FUNCTION claim_next_job(worker_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    video_url TEXT,
    video_filename TEXT,
    prompt_text TEXT,
    model TEXT,
    segment_length INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE jobs
    SET 
        status = 'processing',
        updated_at = NOW(),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{worker_id}',
            to_jsonb(worker_id)
        )
    WHERE id = (
        SELECT id 
        FROM jobs 
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING 
        jobs.id,
        jobs.user_id,
        jobs.video_url,
        jobs.video_filename,
        jobs.prompt_text,
        jobs.model,
        jobs.segment_length,
        jobs.status,
        jobs.created_at,
        jobs.updated_at;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION claim_next_job(TEXT) TO service_role;

-- Optional: Function to reset stuck jobs
CREATE OR REPLACE FUNCTION reset_stuck_jobs(timeout_minutes INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE jobs
    SET 
        status = 'pending',
        updated_at = NOW(),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{reset_reason}',
            '"timeout"'
        )
    WHERE 
        status = 'processing' 
        AND updated_at < NOW() - INTERVAL '1 minute' * timeout_minutes;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION reset_stuck_jobs(INTEGER) TO service_role;