CREATE TABLE IF NOT EXISTS routes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    difficulty  TEXT        NOT NULL DEFAULT 'Medium',
    country     TEXT        NOT NULL DEFAULT '',
    distance_km FLOAT       NOT NULL DEFAULT 0,
    geojson     JSONB       NOT NULL DEFAULT '{}',
    start_lat   FLOAT       NOT NULL DEFAULT 0,
    start_lng   FLOAT       NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_author_id  ON routes(author_id);
CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty);
CREATE INDEX IF NOT EXISTS idx_routes_country    ON routes(country);
