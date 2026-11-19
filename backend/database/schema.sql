
-- ==========================================
-- CLG CONNECT DATABASE
-- ==========================================

BEGIN;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER INTERESTS
CREATE TABLE IF NOT EXISTS user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    interest_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, interest_name)
);

-- PASSWORD RESET OTPs
CREATE TABLE IF NOT EXISTS password_reset_otps (
    user_id INTEGER PRIMARY KEY REFERENCES users(id)
        ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    created_by INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. COMMUNITY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS community_members (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (community_id, user_id)
);

-- 5. POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id)
        ON DELETE SET NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    image_url TEXT,
    post_type VARCHAR(20) DEFAULT 'text'
        CHECK (post_type IN ('text', 'image', 'video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id)
        ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

-- 8. SAVED POSTS TABLE
CREATE TABLE IF NOT EXISTS saved_posts (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

-- 9. POLLS TABLE
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    community_id INTEGER REFERENCES communities(id)
        ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    question TEXT NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. POLL OPTIONS TABLE
CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id)
        ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    UNIQUE (id, poll_id)
);

-- 11. POLL VOTES TABLE
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id)
        ON DELETE CASCADE,
    option_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (option_id, poll_id)
        REFERENCES poll_options(id, poll_id)
        ON DELETE CASCADE,

    UNIQUE (poll_id, user_id)
);

-- ==========================================
-- INDEXES FOR BETTER PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_posts_user
ON posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_community
ON posts(community_id);

CREATE INDEX IF NOT EXISTS idx_posts_created
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post
ON comments(post_id);

CREATE INDEX IF NOT EXISTS idx_members_user
ON community_members(user_id);

CREATE INDEX IF NOT EXISTS idx_polls_community
ON polls(community_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll
ON poll_votes(poll_id);

COMMIT;
