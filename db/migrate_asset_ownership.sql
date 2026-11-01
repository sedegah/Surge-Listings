-- Run once on an existing database; this preserves every current asset.
ALTER TABLE assets
  ADD COLUMN ownership_type TEXT NOT NULL DEFAULT 'bank'
  CHECK (ownership_type IN ('bank', 'individual', 'surge'));

ALTER TABLE assets ADD COLUMN owner_bank_id TEXT REFERENCES banks(id);
ALTER TABLE assets ADD COLUMN owner_name TEXT;

UPDATE assets
SET owner_bank_id = bank_id
WHERE ownership_type = 'bank';

INSERT OR IGNORE INTO asset_categories (code, name, icon)
VALUES ('Apartment', 'Residential Apartment', 'home');
