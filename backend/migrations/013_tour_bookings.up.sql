CREATE TABLE IF NOT EXISTS tour_bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id     UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    message     TEXT,
    seats       INT NOT NULL DEFAULT 1,
    desired_date TEXT,                   -- free text, e.g. "июль 2026"
    status      TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_bookings_tour ON tour_bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_user ON tour_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_status ON tour_bookings(status);
