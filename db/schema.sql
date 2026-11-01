-- Surge Solutions Cloudflare D1 Database Schema & Seed Data
-- ========================================================

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'surge', 'bank'
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Banks
CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  organization_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  default_commission_rate REAL NOT NULL DEFAULT 4.0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- 3. Bank Branches
CREATE TABLE IF NOT EXISTS bank_branches (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  bank_id TEXT NOT NULL,
  name TEXT NOT NULL,
  branch_code TEXT,
  region TEXT NOT NULL,
  district TEXT,
  town TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 4. Roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL, -- 'surge', 'bank'
  description TEXT
);

-- 5. Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL
);

-- 6. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (role_code, permission_code)
);

-- 7. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  organization_id TEXT NOT NULL,
  bank_id TEXT,
  branch_id TEXT,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_code TEXT NOT NULL,
  password_hash TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Active',
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
);

-- 9. Assets
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  bank_id TEXT NOT NULL,
  ownership_type TEXT NOT NULL DEFAULT 'bank' CHECK (ownership_type IN ('bank', 'individual', 'surge')),
  owner_bank_id TEXT,
  owner_name TEXT,
  branch_id TEXT,
  public_ref TEXT NOT NULL UNIQUE,
  internal_bank_ref TEXT NOT NULL,
  category_code TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  town TEXT NOT NULL,
  public_location TEXT NOT NULL,
  exact_address TEXT NOT NULL,
  reserve_price REAL NOT NULL,
  minimum_offer REAL,
  show_reserve_publicly INTEGER NOT NULL DEFAULT 1,
  occupancy_status TEXT NOT NULL, -- 'Vacant', 'Occupied — Cooperative', 'Occupied — Hostile'
  land_guard_risk TEXT NOT NULL DEFAULT 'Low', -- 'Low', 'Medium', 'High'
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted by Bank', 'Surge Review', 'Approved', 'Live', 'Legal Hold', 'Changes Required', 'Sold', 'Withdrawn'
  legal_hold_active INTEGER NOT NULL DEFAULT 0,
  legal_hold_reason TEXT,
  review_required INTEGER NOT NULL DEFAULT 0,
  review_required_reason TEXT,
  beds INTEGER,
  baths INTEGER,
  year INTEGER,
  mileage TEXT,
  fuel TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (owner_bank_id) REFERENCES banks(id),
  FOREIGN KEY (category_code) REFERENCES asset_categories(code)
);

-- 10. Asset Images
CREATE TABLE IF NOT EXISTS asset_images (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL,
  url TEXT NOT NULL,
  object_key TEXT,
  storage_bucket TEXT,
  caption TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_exterior INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  watermark_applied INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 11. Enforcement Cases
CREATE TABLE IF NOT EXISTS enforcement_cases (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL UNIQUE,
  case_number TEXT NOT NULL,
  court TEXT NOT NULL,
  judge TEXT,
  status TEXT NOT NULL DEFAULT 'Pending Verification',
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 12. Legal Instruments
CREATE TABLE IF NOT EXISTS legal_instruments (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  case_id TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  instrument_ref TEXT NOT NULL,
  filing_date TEXT,
  judgment_date TEXT,
  court TEXT,
  injunction_active INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  verified_by TEXT,
  verified_at TEXT,
  notes TEXT,
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id) ON DELETE CASCADE
);

-- 13. Title Records
CREATE TABLE IF NOT EXISTS title_records (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL UNIQUE,
  certificate_number TEXT NOT NULL,
  registry TEXT NOT NULL,
  parcel_number TEXT,
  perfection_status TEXT NOT NULL DEFAULT 'Perfected',
  verification_status TEXT NOT NULL DEFAULT 'Verified',
  verified_by TEXT,
  verified_at TEXT,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 14. Land Searches
CREATE TABLE IF NOT EXISTS land_searches (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL,
  search_reference TEXT NOT NULL,
  search_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  validity_period_days INTEGER NOT NULL DEFAULT 180,
  status TEXT NOT NULL DEFAULT 'Valid',
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 15. Valuations
CREATE TABLE IF NOT EXISTS valuations (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL,
  valuer_name TEXT NOT NULL,
  market_value REAL NOT NULL,
  forced_sale_value REAL NOT NULL,
  valuation_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  validity_period_days INTEGER NOT NULL DEFAULT 180,
  status TEXT NOT NULL DEFAULT 'Valid',
  review_required INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 16. Documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_bucket TEXT,
  verification_status TEXT NOT NULL DEFAULT 'Verified',
  verified_by TEXT,
  verified_at TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 17. Document Access Logs
CREATE TABLE IF NOT EXISTS document_access_logs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  ip_address TEXT,
  access_type TEXT NOT NULL DEFAULT 'VIEW',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ghana_card_number TEXT,
  address TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'Verified',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. KYC Applications
CREATE TABLE IF NOT EXISTS kyc_applications (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  buyer_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ghana_card_number TEXT NOT NULL,
  id_card_front TEXT,
  id_card_back TEXT,
  proof_of_funds TEXT,
  source_of_funds TEXT,
  related_asset_ref TEXT,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  reviewer_note TEXT,
  internal_note TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. Consents
CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  document_version TEXT NOT NULL DEFAULT 'v1.0',
  accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT NOT NULL DEFAULT '127.0.0.1'
);

-- 21. Buyer Access Grants
CREATE TABLE IF NOT EXISTS buyer_access_grants (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  revoked_reason TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 22. Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT,
  buyer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  lead_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 23. Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  lead_ref TEXT NOT NULL UNIQUE,
  asset_id TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'New',
  assigned_agent_id TEXT,
  assigned_agent_name TEXT,
  source TEXT NOT NULL DEFAULT 'Marketplace Enquiry',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 24. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- 25. Viewings
CREATE TABLE IF NOT EXISTS viewings (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  asset_id TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT NOT NULL,
  agent_id TEXT,
  agent_name TEXT,
  viewing_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  high_risk_override INTEGER NOT NULL DEFAULT 0,
  override_reason TEXT,
  override_by TEXT,
  notes TEXT,
  address_disclosed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 26. Offers
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  offer_ref TEXT NOT NULL UNIQUE,
  asset_id TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT NOT NULL,
  amount REAL NOT NULL,
  validity_date TEXT NOT NULL,
  conditions TEXT,
  status TEXT NOT NULL DEFAULT 'Under Bank Review',
  below_reserve INTEGER NOT NULL DEFAULT 0,
  exception_requested INTEGER NOT NULL DEFAULT 0,
  exception_decision TEXT,
  exception_reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 27. Offer Revisions
CREATE TABLE IF NOT EXISTS offer_revisions (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  amount REAL NOT NULL,
  proposed_by TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

-- 28. Fees
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  applies_to TEXT NOT NULL,
  rate_or_amount REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  description TEXT
);

-- 29. Bank Agreements
CREATE TABLE IF NOT EXISTS bank_agreements (
  id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL,
  agreement_ref TEXT NOT NULL,
  commission_rate REAL NOT NULL DEFAULT 4.0,
  effective_date TEXT NOT NULL,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  FOREIGN KEY (bank_id) REFERENCES banks(id)
);

-- 30. Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  bank_id TEXT NOT NULL,
  final_sale_price REAL NOT NULL,
  commission_rate REAL NOT NULL,
  commission_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Invoice',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (offer_id) REFERENCES offers(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (bank_id) REFERENCES banks(id)
);

-- 31. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  invoice_number TEXT NOT NULL UNIQUE,
  commission_id TEXT,
  bank_id TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Issued',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bank_id) REFERENCES banks(id)
);

-- 32. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  reference TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 33. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_role TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'System',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 34. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  organization TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  delta_summary TEXT,
  old_values TEXT,
  new_values TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 35. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

-- ============================================================
-- AUTH EXTENSION TABLES (Centralized Authentication & RBAC)
-- ============================================================

-- 36. Sessions — Secure server-side session store
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                       -- session token (random 64-char hex)
  secret_hash TEXT UNIQUE,
  device_name TEXT,
  last_ip TEXT,
  suspicious_activity_count INTEGER NOT NULL DEFAULT 0,
  remembered INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  bank_id TEXT,
  branch_id TEXT,
  role_code TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'bank',        -- 'surge', 'bank', 'public'
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_active TEXT NOT NULL DEFAULT (datetime('now')),
  revoked INTEGER NOT NULL DEFAULT 0,
  revoke_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 37. Invitations — Invitation-only bank employee registration
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,                -- secure random token sent in email link
  email TEXT NOT NULL,
  full_name TEXT,
  bank_id TEXT NOT NULL,
  branch_id TEXT,
  role_code TEXT NOT NULL DEFAULT 'bank-recovery',
  invited_by TEXT NOT NULL,                  -- user_id of the inviter
  status TEXT NOT NULL DEFAULT 'Pending',    -- 'Pending', 'Accepted', 'Expired', 'Cancelled'
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 38. Login Attempts — Security monitoring and rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 39. Password Resets — Reset tokens (admin-issued)
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 40. Organization Members — Links users to organizations with RBAC roles
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  bank_id TEXT,
  branch_id TEXT,
  role_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',    -- 'Active', 'Suspended', 'Revoked'
  invited_by TEXT,
  joined_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, organization_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
