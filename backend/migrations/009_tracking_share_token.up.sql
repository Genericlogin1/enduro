ALTER TABLE track_sessions ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT;
CREATE INDEX IF NOT EXISTS idx_track_sessions_share_token ON track_sessions(share_token);
