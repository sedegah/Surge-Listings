-- Persist the staff member who uploaded a legal instrument and index login throttling queries.
ALTER TABLE legal_instruments
  ADD COLUMN uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_login_attempts_username_success_time
  ON login_attempts(username, success, attempted_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_success_time
  ON login_attempts(ip_address, success, attempted_at);
