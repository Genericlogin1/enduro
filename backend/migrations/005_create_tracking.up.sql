CREATE TABLE IF NOT EXISTS track_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id    UUID        REFERENCES routes(id) ON DELETE SET NULL,
    name        TEXT        NOT NULL DEFAULT '',
    status      TEXT        NOT NULL DEFAULT 'active',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS track_points (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES track_sessions(id) ON DELETE CASCADE,
    lat         FLOAT       NOT NULL,
    lng         FLOAT       NOT NULL,
    altitude    FLOAT       NOT NULL DEFAULT 0,
    speed       FLOAT       NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_track_sessions_user_id  ON track_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_track_points_session_id ON track_points(session_id);
CREATE INDEX IF NOT EXISTS idx_track_points_recorded_at ON track_points(recorded_at);
