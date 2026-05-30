CREATE TABLE IF NOT EXISTS tours (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    cover_url     TEXT,
    region        TEXT,
    country       TEXT,
    start_date    DATE,
    end_date      DATE,
    price_usd     NUMERIC(10,2),
    currency      TEXT NOT NULL DEFAULT 'USD',
    spots_total   INT,
    spots_left    INT,
    difficulty    TEXT,
    route_id      UUID REFERENCES routes(id) ON DELETE SET NULL,
    contact_email TEXT,
    contact_phone TEXT,
    website_url   TEXT,
    status        TEXT NOT NULL DEFAULT 'published',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tour_registrations (
    tour_id    UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tour_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tours_organizer ON tours(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON tours(start_date);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);

-- Business accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type TEXT;
