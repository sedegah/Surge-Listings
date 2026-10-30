INSERT INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, status)
VALUES ('u-sedegah', 'org-surge', NULL, NULL, 'k.sedegah', 'Kimathi Sedegah', 'k.sedegah@surgesolutions.com.gh', 'SA', '090806', 'Active')
ON CONFLICT(username) DO UPDATE SET password_hash = '090806', role_code = 'SA', status = 'Active';
