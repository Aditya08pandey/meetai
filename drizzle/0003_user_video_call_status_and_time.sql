-- Add status enum type
DO $$ BEGIN
    CREATE TYPE user_video_call_status AS ENUM ('upcoming', 'active', 'completed', 'processing', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status and scheduled_at columns
ALTER TABLE user_video_calls
    ADD COLUMN status user_video_call_status NOT NULL DEFAULT 'upcoming',
    ADD COLUMN scheduled_at timestamp,
    ADD COLUMN transcript_url text,
    ADD COLUMN recording_url text,
    ADD COLUMN summary text,
    ADD COLUMN started_at timestamp,
    ADD COLUMN ended_at timestamp; 