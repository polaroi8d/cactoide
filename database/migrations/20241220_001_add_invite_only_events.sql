-- Migration: Add invite-only events feature
-- Created: 2024-12-20
-- Description: Adds invite-only visibility option and invite tokens table

-- Add 'invite-only' to the visibility enum
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_visibility_check;

ALTER TABLE events 
ADD CONSTRAINT events_visibility_check 
CHECK (visibility IN ('public', 'private', 'invite-only'));

-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token       VARCHAR(32) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for invite_tokens table
CREATE INDEX IF NOT EXISTS idx_invite_tokens_event_id ON invite_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON invite_tokens(expires_at);
