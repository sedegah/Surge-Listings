// Role model: every Surge staff role is a full platform administrator; banks have a
// single role, the Correspondence Officer, confined to its own bank's rows.
export const SURGE_ADMIN_ROLES = new Set(['SA', 'PM', 'LO', 'SG', 'SFO', 'AU']);
export const BANK_ROLE = 'CO';
export const PROVISIONABLE_ROLES = new Set(['SA', BANK_ROLE]);

export function isSurgeAdmin(session) {
  return session?.scope === 'surge' && SURGE_ADMIN_ROLES.has(session.role_code);
}

export function isBankOfficer(session) {
  return session?.scope === 'bank' && session.role_code === BANK_ROLE;
}

export function isSupportedRole(roleCode, scope) {
  return scope === 'surge' ? SURGE_ADMIN_ROLES.has(roleCode) : roleCode === BANK_ROLE;
}

// Statuses a bank may still edit, submit or delete; anything later belongs to Surge.
export const BANK_EDITABLE_STATUSES = new Set(['Draft', 'Submitted by Bank', 'Submitted', 'Changes Required', 'Rejected']);
