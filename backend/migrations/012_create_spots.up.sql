CREATE TABLE IF NOT EXISTS spots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    kind        TEXT NOT NULL DEFAULT 'danger', -- danger | view | fuel | camp | tech | mud
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    country     TEXT,
    upvotes     INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spot_votes (
    spot_id     UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL DEFAULT 1, -- 1 or -1
    PRIMARY KEY (spot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(lat, lng);
CREATE INDEX IF NOT EXISTS idx_spots_kind ON spots(kind);
CREATE INDEX IF NOT EXISTS idx_spots_author ON spots(author_id);
