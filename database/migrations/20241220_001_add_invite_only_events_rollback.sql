-- Rollback Migration: Remove invite-only events feature
-- Created: 2024-12-20
-- Description: Removes invite-only visibility option and invite tokens table

-- Drop invite_tokens table and its indexes
DROP INDEX IF EXISTS idx_invite_tokens_expires_at;
DROP INDEX IF EXISTS idx_invite_tokens_token;
DROP INDEX IF EXISTS idx_invite_tokens_event_id;
DROP TABLE IF EXISTS invite_tokens;

-- Revert visibility enum to original values
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_visibility_check;

ALTER TABLE events 
ADD CONSTRAINT events_visibility_check 
CHECK (visibility IN ('public', 'private'));
