CREATE TABLE IF NOT EXISTS group_rides (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    description     TEXT        NOT NULL DEFAULT '',
    location        TEXT        NOT NULL DEFAULT '',
    ride_date       TIMESTAMPTZ NOT NULL,
    route_id        UUID        REFERENCES routes(id) ON DELETE SET NULL,
    max_participants INT,
    status          TEXT        NOT NULL DEFAULT 'upcoming',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_ride_participants (
    ride_id     UUID        NOT NULL REFERENCES group_rides(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ride_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_rides_organizer ON group_rides(organizer_id);
CREATE INDEX IF NOT EXISTS idx_group_rides_status    ON group_rides(status);
CREATE INDEX IF NOT EXISTS idx_group_rides_date      ON group_rides(ride_date);
