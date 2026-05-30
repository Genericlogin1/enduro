CREATE TABLE IF NOT EXISTS bikes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make       VARCHAR(100) NOT NULL,
    model      VARCHAR(100) NOT NULL,
    year       SMALLINT    NOT NULL DEFAULT 0,
    engine_cc  SMALLINT    NOT NULL DEFAULT 0,
    notes      TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON bikes(user_id);
