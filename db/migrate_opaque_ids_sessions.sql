-- Add public opaque identifiers without changing any internal primary or foreign keys.
-- Backfills use SQLite's cryptographic randomblob() rather than deriving IDs from row data.
ALTER TABLE organizations ADD COLUMN public_id TEXT;
ALTER TABLE banks ADD COLUMN public_id TEXT;
ALTER TABLE bank_branches ADD COLUMN public_id TEXT;
ALTER TABLE users ADD COLUMN public_id TEXT;
ALTER TABLE assets ADD COLUMN public_id TEXT;
ALTER TABLE asset_images ADD COLUMN public_id TEXT;
ALTER TABLE enforcement_cases ADD COLUMN public_id TEXT;
ALTER TABLE legal_instruments ADD COLUMN public_id TEXT;
ALTER TABLE title_records ADD COLUMN public_id TEXT;
ALTER TABLE land_searches ADD COLUMN public_id TEXT;
ALTER TABLE valuations ADD COLUMN public_id TEXT;
ALTER TABLE documents ADD COLUMN public_id TEXT;
ALTER TABLE buyers ADD COLUMN public_id TEXT;
ALTER TABLE kyc_applications ADD COLUMN public_id TEXT;
ALTER TABLE enquiries ADD COLUMN public_id TEXT;
ALTER TABLE leads ADD COLUMN public_id TEXT;
ALTER TABLE viewings ADD COLUMN public_id TEXT;
ALTER TABLE offers ADD COLUMN public_id TEXT;
ALTER TABLE invoices ADD COLUMN public_id TEXT;

UPDATE organizations SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE banks SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE bank_branches SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE users SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE assets SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE asset_images SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE enforcement_cases SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE legal_instruments SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE title_records SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE land_searches SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE valuations SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE documents SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE buyers SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE kyc_applications SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE enquiries SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE leads SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE viewings SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE offers SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;
UPDATE invoices SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL;

CREATE UNIQUE INDEX idx_organizations_public_id ON organizations(public_id);
CREATE UNIQUE INDEX idx_banks_public_id ON banks(public_id);
CREATE UNIQUE INDEX idx_bank_branches_public_id ON bank_branches(public_id);
CREATE UNIQUE INDEX idx_users_public_id ON users(public_id);
CREATE UNIQUE INDEX idx_assets_public_id ON assets(public_id);
CREATE UNIQUE INDEX idx_asset_images_public_id ON asset_images(public_id);
CREATE UNIQUE INDEX idx_enforcement_cases_public_id ON enforcement_cases(public_id);
CREATE UNIQUE INDEX idx_legal_instruments_public_id ON legal_instruments(public_id);
CREATE UNIQUE INDEX idx_title_records_public_id ON title_records(public_id);
CREATE UNIQUE INDEX idx_land_searches_public_id ON land_searches(public_id);
CREATE UNIQUE INDEX idx_valuations_public_id ON valuations(public_id);
CREATE UNIQUE INDEX idx_documents_public_id ON documents(public_id);
CREATE UNIQUE INDEX idx_buyers_public_id ON buyers(public_id);
CREATE UNIQUE INDEX idx_kyc_applications_public_id ON kyc_applications(public_id);
CREATE UNIQUE INDEX idx_enquiries_public_id ON enquiries(public_id);
CREATE UNIQUE INDEX idx_leads_public_id ON leads(public_id);
CREATE UNIQUE INDEX idx_viewings_public_id ON viewings(public_id);
CREATE UNIQUE INDEX idx_offers_public_id ON offers(public_id);
CREATE UNIQUE INDEX idx_invoices_public_id ON invoices(public_id);

-- New session rows store only a hash of the cookie secret. Legacy rows remain
-- identifiable by secret_hash IS NULL and are rotated on the next authenticated request.
ALTER TABLE sessions ADD COLUMN secret_hash TEXT;
ALTER TABLE sessions ADD COLUMN device_name TEXT;
ALTER TABLE sessions ADD COLUMN last_ip TEXT;
ALTER TABLE sessions ADD COLUMN suspicious_activity_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sessions ADD COLUMN remembered INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX idx_sessions_secret_hash ON sessions(secret_hash);
CREATE INDEX idx_sessions_user_active ON sessions(user_id, revoked, expires_at);

CREATE TABLE IF NOT EXISTS upload_idempotency (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, idempotency_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
