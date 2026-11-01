-- Minimal platform bootstrap data. No demo banks, users, assets, buyers, or transactions.
-- Existing databases are not modified or cleared by this seed.

INSERT OR IGNORE INTO organizations (id, name, code, type)
VALUES ('org-surge', 'Surge Solutions Platform Operator', 'SURGE', 'surge');

INSERT OR IGNORE INTO banks (
  id, organization_id, legal_name, short_code, contact_email, contact_phone,
  default_commission_rate
) VALUES (
  'bank-surge', 'org-surge', 'Surge Partner Bank', 'SURGE', '', '', 0.0
);

INSERT OR IGNORE INTO roles (id, name, code, scope, description) VALUES
('r-sa', 'Super Administrator', 'SA', 'surge', 'Platform operator administrator with global permissions'),
('r-pm', 'Property Manager', 'PM', 'surge', 'Surge property and listing manager'),
('r-lo', 'Legal Verification Officer', 'LO', 'surge', 'Surge legal, judgment and injunction reviewer'),
('r-sg', 'Sales Agent', 'SG', 'surge', 'Surge sales and buyer relationship agent'),
('r-sfo', 'Finance Officer (Surge)', 'SFO', 'surge', 'Surge billing, fees and commission reconciliation'),
('r-au', 'Auditor', 'AU', 'surge', 'Compliance and immutable audit log reviewer'),
('r-ba', 'Bank Administrator', 'BA', 'bank', 'Bank organization administrator'),
('r-ao', 'Asset Officer', 'AO', 'bank', 'Bank asset registration and management'),
('r-lro', 'Legal / Recovery Officer', 'LRO', 'bank', 'Bank recovery officer and legal matters coordinator'),
('r-ap', 'Approver', 'AP', 'bank', 'Bank executive with offer approval authority'),
('r-bfo', 'Finance Officer (Bank)', 'BFO', 'bank', 'Bank invoice and statements viewer'),
('r-vw', 'Viewer', 'VW', 'bank', 'Read-only bank portfolio observer');

INSERT OR IGNORE INTO asset_categories (code, name, icon) VALUES
('House', 'Residential House', 'home'),
('Apartment', 'Residential Apartment', 'home'),
('Vehicle', 'Motor Vehicle', 'truck'),
('Equipment', 'Industrial Equipment', 'tool'),
('Commercial', 'Commercial Property', 'briefcase'),
('Land', 'Demarcated Land', 'map');

INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
('land_search_validity_days', '180', 'Land search report validity period in days'),
('valuation_validity_days', '180', 'Valuation report validity period in days'),
('validity_warning_lead_days', '30', 'Days before expiry to flag Review Required'),
('watermark_text', 'SURGE SOLUTIONS GHANA — CONFIDENTIAL & VERIFIED', 'Watermark overlay on public listing images'),
('signed_url_ttl_minutes', '5', 'Pre-signed secure document URL time to live in minutes'),
('max_images_per_asset', '20', 'Maximum photo uploads permitted per asset');
