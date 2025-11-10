BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- =======================================
-- Tables
-- =======================================

-- Events
CREATE TABLE IF NOT EXISTS events (
    id              VARCHAR(8) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    time            TIME NOT NULL,
    location        VARCHAR(200) NOT NULL,
    location_type   VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (location_type IN ('none','text','maps')),
    location_url    VARCHAR(500),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('limited','unlimited')),
    attendee_limit  INTEGER CHECK (attendee_limit > 0),
    user_id         VARCHAR(100) NOT NULL,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private', 'invite-only')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RSVPs
CREATE TABLE IF NOT EXISTS rsvps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    user_id     VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Invite tokens
CREATE TABLE IF NOT EXISTS invite_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token       VARCHAR(32) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================
-- Indexes
-- =======================================
CREATE INDEX IF NOT EXISTS idx_events_user_id  ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date     ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_location_type ON events(location_type);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id  ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id   ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_event_id ON invite_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON invite_tokens(expires_at);


COMMIT;