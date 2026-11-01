CREATE TABLE IF NOT EXISTS protected_user_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  protected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO protected_user_accounts (user_id)
SELECT id
FROM users
WHERE (lower(username) = 'k.sedegah' AND lower(email) = 'k.sedegah@surgesolutions.com.gh')
   OR (lower(username) = 's.k.sedegah' AND lower(email) = 'seday74+1@gmail.com');

CREATE TRIGGER IF NOT EXISTS prevent_protected_user_deletion
BEFORE DELETE ON users
WHEN EXISTS (
  SELECT 1 FROM protected_user_accounts WHERE user_id = OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'Protected owner accounts cannot be deleted.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_protected_user_id_change
BEFORE UPDATE OF id ON users
WHEN EXISTS (
  SELECT 1 FROM protected_user_accounts WHERE user_id = OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'Protected owner account IDs cannot be changed.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_protected_account_registry_update
BEFORE UPDATE ON protected_user_accounts
BEGIN
  SELECT RAISE(ABORT, 'Protected account registry cannot be changed.');
END;

CREATE TRIGGER IF NOT EXISTS prevent_protected_account_registry_deletion
BEFORE DELETE ON protected_user_accounts
BEGIN
  SELECT RAISE(ABORT, 'Protected account registry cannot be changed.');
END;
