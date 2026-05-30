CREATE TABLE IF NOT EXISTS reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    body          TEXT NOT NULL DEFAULT '',
    cover_url     TEXT,
    photo_urls    TEXT[]    NOT NULL DEFAULT '{}',
    track_id      UUID REFERENCES track_sessions(id) ON DELETE SET NULL,
    bike_id       UUID REFERENCES bikes(id) ON DELETE SET NULL,
    region        TEXT,
    riding_date   DATE,
    difficulty    TEXT,
    distance_km   FLOAT,
    duration_min  INT,
    likes_count   INT NOT NULL DEFAULT 0,
    views_count   INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_likes (
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_author ON reports(author_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
