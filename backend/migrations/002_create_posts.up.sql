CREATE TABLE IF NOT EXISTS posts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL DEFAULT '',
    location    TEXT,
    media_urls  TEXT[]      NOT NULL DEFAULT '{}',
    likes_count INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id  ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
