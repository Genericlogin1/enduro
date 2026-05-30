CREATE TABLE IF NOT EXISTS follows (
    follower_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
