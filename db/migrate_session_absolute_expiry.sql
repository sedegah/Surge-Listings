-- Absolute (non-sliding) session lifetime.
--
-- sessions.expires_at is an idle timeout: resolveSession() pushes it forward on
-- every authenticated request, so a session that stays active never expires.
-- absolute_expires_at is set once at sign-in and never extended, capping the
-- total lifetime of a credential even if it is stolen and replayed.
--
-- Backfill uses created_at + 7 days (the longest cap any session can have), so
-- no previously expired session can become valid again.

ALTER TABLE sessions ADD COLUMN absolute_expires_at TEXT;

UPDATE sessions
SET absolute_expires_at = datetime(created_at, '+7 days')
WHERE absolute_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_absolute_expiry
  ON sessions(absolute_expires_at);