INSERT INTO banks (
  id, organization_id, legal_name, short_code, contact_email, contact_phone,
  default_commission_rate, status, created_at
) VALUES (
  'bank-surge', 'org-surge', 'Surge Partner Bank', 'SURGE', '', '', 0.0, 'Active', datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  organization_id = excluded.organization_id,
  legal_name = excluded.legal_name,
  short_code = excluded.short_code,
  status = 'Active';

UPDATE users
SET bank_id = 'bank-surge', branch_id = NULL
WHERE role_code IN (SELECT code FROM roles WHERE scope = 'surge');

UPDATE sessions
SET bank_id = 'bank-surge', branch_id = NULL
WHERE scope = 'surge';
