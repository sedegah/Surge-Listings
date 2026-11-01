-- Remove hard-coded demonstration staff accounts while preserving audit history.
-- The remaining Surge Administrator account is intentionally retained.
INSERT OR IGNORE INTO audit_logs (
  id, actor_user_id, actor_name, actor_role, organization, action_type,
  entity_type, entity_id, delta_summary, old_values, created_at
)
SELECT
  'maintenance-delete-' || u.id, NULL, 'Database maintenance', 'MAINTENANCE',
  'Surge Solutions', 'DELETE_USER', 'User', COALESCE(u.public_id, u.id),
  'Removed hard-coded seed account @' || u.username || ' at the account owner''s request.',
  json_object(
    'username', u.username,
    'fullName', u.full_name,
    'roleCode', u.role_code,
    'status', u.status
  ),
  datetime('now')
FROM users u
WHERE (u.id = 'u-admin' AND u.username = 'admin')
   OR (u.id = 'u-tetteh' AND u.username = 'a.tetteh')
   OR (u.id = 'u-boateng' AND u.username = 'a.boateng')
   OR (u.id = 'u-addo' AND u.username = 'k.addo');

INSERT OR IGNORE INTO audit_logs (
  id, actor_user_id, actor_name, actor_role, organization, action_type,
  entity_type, entity_id, delta_summary, old_values, created_at
)
VALUES
  ('maintenance-delete-u-admin', NULL, 'Database maintenance', 'MAINTENANCE', 'Surge Solutions', 'DELETE_USER', 'User', 'u-admin', 'Removed hard-coded seed account @admin at the account owner''s request.', '{"username":"admin","fullName":"System Administrator","roleCode":"SA","status":"Active"}', datetime('now')),
  ('maintenance-delete-u-tetteh', NULL, 'Database maintenance', 'MAINTENANCE', 'Surge Solutions', 'DELETE_USER', 'User', 'u-tetteh', 'Removed hard-coded seed account @a.tetteh at the account owner''s request.', '{"username":"a.tetteh","fullName":"Akosua Tetteh","roleCode":"SG","status":"Active"}', datetime('now')),
  ('maintenance-delete-u-boateng', NULL, 'Database maintenance', 'MAINTENANCE', 'Surge Solutions', 'DELETE_USER', 'User', 'u-boateng', 'Removed hard-coded seed account @a.boateng at the account owner''s request.', '{"username":"a.boateng","fullName":"Ama Boateng","roleCode":"PM","status":"Active"}', datetime('now')),
  ('maintenance-delete-u-addo', NULL, 'Database maintenance', 'MAINTENANCE', 'Surge Solutions', 'DELETE_USER', 'User', 'u-addo', 'Removed hard-coded seed account @k.addo at the account owner''s request.', '{"username":"k.addo","fullName":"Kwame Addo","roleCode":"LO","status":"Active"}', datetime('now'));

UPDATE sessions
SET revoked = 1, revoke_reason = 'USER_DELETED'
WHERE user_id IN ('u-admin', 'u-tetteh', 'u-boateng', 'u-addo');

DELETE FROM password_resets
WHERE user_id IN ('u-admin', 'u-tetteh', 'u-boateng', 'u-addo');

DELETE FROM organization_members
WHERE user_id IN ('u-admin', 'u-tetteh', 'u-boateng', 'u-addo');

DELETE FROM users
WHERE (id = 'u-admin' AND username = 'admin')
   OR (id = 'u-tetteh' AND username = 'a.tetteh')
   OR (id = 'u-boateng' AND username = 'a.boateng')
   OR (id = 'u-addo' AND username = 'k.addo');
