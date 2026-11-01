-- Tie newly written staff audit events to the internal user record.
-- Existing rows remain NULL because their actor cannot be verified retrospectively.
ALTER TABLE audit_logs ADD COLUMN actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_audit_logs_actor_user_id_created_at
  ON audit_logs(actor_user_id, created_at);
