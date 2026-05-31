CREATE TABLE IF NOT EXISTS route_ratings (
    route_id   UUID        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (route_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_route_ratings_route ON route_ratings(route_id);
