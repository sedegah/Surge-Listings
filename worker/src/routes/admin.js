// Admin portal: oversight, onboarding, 5-gate review, legal and title.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
import { BANK_ROLE, PROVISIONABLE_ROLES } from '../rbac.js';

export async function handleAdmin(c) {
  const {
    actorName, actorRole, auditLog, env, err, getActiveSession, getAssetReadiness, getBody, hashPassword, json, method, pathname, randomId, requireAdminAuth, requireBankAuth, url
  } = c;

  // =========================================================================
  // 2. ADMIN PORTAL API (/api/admin/*)
  // Highest-Privilege Platform Oversight, Partner Onboarding & 5-Gate Review
  // =========================================================================

  // GET /api/admin/dashboard
  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    const counts = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM assets) as totalAssets,
        (SELECT COUNT(*) FROM assets WHERE status = 'Live') as liveListings,
        (SELECT COUNT(*) FROM assets WHERE status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingReview,
        (SELECT COUNT(*) FROM assets WHERE legal_hold_active = 1) as legalHolds,
        (SELECT COUNT(*) FROM banks) as bankCount,
        (SELECT COUNT(*) FROM users) as userCount,
        (SELECT COUNT(*) FROM offers WHERE status = 'Under Bank Review') as activeOffers,
        (SELECT COALESCE(SUM(reserve_price), 0) FROM assets) as totalPortfolioValue
    `).first();
    const recentActivity = await env.DB.prepare(`
      SELECT a.id, a.actor_name, a.actor_role, a.organization, a.action_type, a.entity_type,
             a.entity_id, a.delta_summary, a.old_values, a.new_values, a.created_at,
             u.public_id AS actor_public_id
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.created_at DESC LIMIT 10
    `).all();
    return json({ success: true, data: { stats: counts, recentActivity: recentActivity.results } });
  }

  // Banks Management (/api/admin/banks, /api/v1/banks)
  if ((pathname === '/api/admin/banks' || pathname === '/api/v1/banks') && method === 'GET') {
    const banks = await env.DB.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM bank_branches WHERE bank_id = b.id) as branch_count,
        (SELECT COUNT(*) FROM assets WHERE bank_id = b.id) as asset_count,
        (SELECT COUNT(*) FROM users WHERE bank_id = b.id) as staff_count,
        (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = b.id) as total_portfolio_value
      FROM banks b
      ORDER BY b.legal_name ASC
    `).all();
    return json({ success: true, count: banks.results.length, data: banks.results });
  }

  if ((pathname === '/api/admin/banks' || pathname === '/api/v1/banks') && method === 'POST') {
    const body = await getBody();
    const { legal_name, short_code, contact_email, contact_phone, default_commission_rate, initial_branch } = body;
    if (typeof legal_name !== 'string' || typeof short_code !== 'string' || typeof contact_email !== 'string' ||
      !legal_name.trim() || !short_code.trim() || !contact_email.trim()) {
      return err('Legal name, short code, and contact email are required.', 400);
    }
    if (legal_name.length > 200 || contact_email.length > 254 || String(contact_phone || '').length > 40 || String(initial_branch || '').length > 200) {
      return err('One or more bank details are too long.', 400);
    }
    const commissionRate = default_commission_rate ? Number(default_commission_rate) : 4.0;
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return err('Commission rate must be between 0 and 100.', 400);
    }

    const cleanCode = short_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 2 || cleanCode.length > 12) return err('Short code must be 2 to 12 letters or digits.', 400);
    const orgId = 'org-' + cleanCode.toLowerCase();
    const bId = 'bank-' + cleanCode.toLowerCase();

    const existing = await env.DB.prepare(`SELECT id FROM banks WHERE id = ? OR short_code = ?`).bind(bId, cleanCode).first();
    if (existing) return err(`A bank with code '${cleanCode}' already exists.`, 400);

    await env.DB.prepare(`
      INSERT INTO organizations (id, name, code, type, status, created_at)
      VALUES (?, ?, ?, 'bank', 'Active', datetime('now'))
    `).bind(orgId, legal_name.trim(), cleanCode).run();

    await env.DB.prepare(`
      INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `).bind(
      bId, orgId, legal_name.trim(), cleanCode,
      contact_email.trim().toLowerCase(),
      contact_phone ? String(contact_phone).trim() : '+233 30 000 0000',
      commissionRate
    ).run();

    const branchId = 'br-' + cleanCode.toLowerCase() + '-hq';
    const branchName = initial_branch ? String(initial_branch).trim() : (cleanCode + ' Head Office - Accra');
    await env.DB.prepare(`
      INSERT INTO bank_branches (id, bank_id, name, branch_code, region, district, town, status, created_at)
      VALUES (?, ?, ?, 'HQ', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'Active', datetime('now'))
    `).bind(branchId, bId, branchName).run();

    await auditLog(actorName, actorRole, 'Surge Solutions', 'ADD_BANK', 'Bank', bId, `Registered partner bank: ${legal_name} (${cleanCode})`);
    const created = await env.DB.prepare(`SELECT * FROM banks WHERE id = ?`).bind(bId).first();
    return json({ success: true, message: 'Bank registered successfully.', data: created }, 201);
  }

  if ((pathname.match(/^\/api\/admin\/banks\/[a-zA-Z0-9_-]+$/) || pathname.match(/^\/api\/v1\/banks\/[a-zA-Z0-9_-]+$/)) && method === 'DELETE') {
    const id = pathname.split('/').pop();
    if (id === 'bank-surge') return err('Surge Partner Bank is the platform bank and cannot be removed.', 409);
    const bank = await env.DB.prepare(`SELECT legal_name FROM banks WHERE id = ?`).bind(id).first();
    if (!bank) return err('Bank not found', 404);
    const dependents = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM assets WHERE bank_id = ? OR owner_bank_id = ?) AS assets,
        (SELECT COUNT(*) FROM users u JOIN protected_user_accounts p ON p.user_id = u.id WHERE u.bank_id = ?) AS protected_users
    `).bind(id, id, id).first();
    if (dependents.assets > 0) return err('This bank still has assets on the platform. Remove or reassign them before removing the bank.', 409);
    if (dependents.protected_users > 0) return err('This bank has a protected owner account and cannot be removed.', 409);

    await env.DB.batch([
      env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'BANK_REMOVED' WHERE revoked = 0 AND user_id IN (SELECT id FROM users WHERE bank_id = ?)`).bind(id),
      env.DB.prepare(`DELETE FROM users WHERE bank_id = ?`).bind(id),
      env.DB.prepare(`DELETE FROM bank_branches WHERE bank_id = ?`).bind(id),
      env.DB.prepare(`DELETE FROM banks WHERE id = ?`).bind(id)
    ]);

    await auditLog(actorName, actorRole, 'Surge Solutions', 'DELETE_BANK', 'Bank', id, `Removed bank partner: ${bank.legal_name}`);
    return json({ success: true, message: `Bank ${bank.legal_name} removed.` });
  }

  // Users & Staff Management (/api/admin/users, /api/v1/users)
  if ((pathname === '/api/admin/users' || pathname === '/api/v1/users') && method === 'GET') {
    const filterBankId = url.searchParams.get('bank_id');
    const filterRole = url.searchParams.get('role');
    let sql = `
      SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
             u.status, u.locked_until, u.mfa_enabled, u.last_login, u.created_at,
             CASE WHEN u.password_hash IS NOT NULL AND length(u.password_hash) > 0 THEN 1 ELSE 0 END as has_password,
             EXISTS (SELECT 1 FROM protected_user_accounts pua WHERE pua.user_id = u.id) AS is_protected,
             r.name as role_name, r.scope, o.name as org_name,
             b.legal_name as bank_name, b.short_code as bank_code,
             br.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_code = r.code
      LEFT JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN banks b ON u.bank_id = b.id
      LEFT JOIN bank_branches br ON u.branch_id = br.id
      WHERE 1=1
    `;
    const params = [];
    if (filterBankId) {
      if (filterBankId === 'bank-surge') {
        sql += ` AND (u.bank_id = 'bank-surge' OR r.scope = 'surge' OR u.organization_id = 'org-surge')`;
      } else {
        sql += ` AND u.bank_id = ?`;
        params.push(filterBankId);
      }
    }
    if (filterRole) { sql += ` AND u.role_code = ?`; params.push(filterRole); }
    sql += ` ORDER BY u.created_at DESC, u.full_name ASC`;
    const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
    const users = await stmt.all();
    return json({ success: true, count: users.results.length, data: users.results });
  }

  if ((pathname === '/api/admin/users' || pathname === '/api/v1/users') && method === 'POST') {
    const body = await getBody();
    const { bank_id, branch_id, username, full_name, email, role_code, password, mfa_enabled } = body;
    if (typeof username !== 'string' || typeof full_name !== 'string' || typeof email !== 'string' || typeof role_code !== 'string' ||
      !username.trim() || !full_name.trim() || !email.trim() || !role_code.trim()) {
      return err('Username, full name, email, and role are required.', 400);
    }
    if (!/^[a-z0-9._-]{3,64}$/i.test(username.trim())) {
      return err('Username must be 3 to 64 letters, digits, dots, hyphens or underscores.', 400);
    }
    if (full_name.trim().length > 160) return err('Full name must be 160 characters or fewer.', 400);
    if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return err('Enter a valid email address.', 400);
    }
    if (typeof password !== 'string' || password.trim().length < 8 || password.length > 256) {
      return err('An initial password of 8 to 256 characters is required.', 400);
    }

    // Surge staff are provisioned as administrators; every bank account is a
    // Correspondence Officer. Legacy role codes from older clients map onto these.
    const requestedRole = await env.DB.prepare(`SELECT scope FROM roles WHERE code = ?`).bind(role_code.trim()).first();
    if (!requestedRole) return err('The selected role does not exist.', 400);
    const assignedRole = requestedRole.scope === 'surge' ? 'SA' : BANK_ROLE;
    if (!PROVISIONABLE_ROLES.has(assignedRole)) return err('The selected role cannot be provisioned.', 400);
    if (assignedRole === 'SA') {
      const surgeBank = await env.DB.prepare(`SELECT id FROM banks WHERE id = 'bank-surge'`).first();
      if (!surgeBank) return err('Surge Partner Bank is not configured. Apply the bank setup migration first.', 503);
    }

    const existing = await env.DB.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).bind(username.trim().toLowerCase(), email.trim().toLowerCase()).first();
    if (existing) return err('A user with this username or email already exists.', 400);

    const assignedBankId = assignedRole === 'SA' ? 'bank-surge' : String(bank_id || '').trim();
    const assignedBranchId = assignedRole === 'SA' ? null : String(branch_id || '').trim() || null;
    const bank = await env.DB.prepare(`SELECT organization_id, status FROM banks WHERE id = ?`).bind(assignedBankId).first();
    if (!bank) return err('Select the bank this Correspondence Officer belongs to.', 400);
    if (assignedBranchId) {
      const branch = await env.DB.prepare(`SELECT id FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(assignedBranchId, assignedBankId).first();
      if (!branch) return err('The selected branch does not belong to the selected bank.', 400);
    }
    const orgId = bank.organization_id || 'org-surge';

    const userId = 'u-' + randomId();
    const assignedPassword = await hashPassword(password.trim());

    await env.DB.prepare(`
      INSERT INTO users (id, public_id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `).bind(userId, randomId(), orgId, assignedBankId, assignedBranchId, username.trim().toLowerCase(), full_name.trim(), email.trim().toLowerCase(), assignedRole, assignedPassword, mfa_enabled !== undefined ? (mfa_enabled ? 1 : 0) : 1).run();

    await auditLog(actorName, actorRole, 'Surge Solutions', 'CREATE_USER', 'User', userId, `Created ${assignedRole} account ${full_name.trim()} (@${username.trim().toLowerCase()})`);
    const createdUser = await env.DB.prepare(`
      SELECT u.id, u.public_id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email,
             u.role_code, u.status, u.mfa_enabled, u.created_at, b.legal_name as bank_name
      FROM users u LEFT JOIN banks b ON u.bank_id = b.id WHERE u.id = ?
    `).bind(userId).first();
    return json({ success: true, message: 'Staff user created successfully.', data: createdUser }, 201);
  }

  const deleteUserMatch = pathname.match(/^\/api\/(admin|v1)\/users\/([a-zA-Z0-9_-]+)$/);
  if (deleteUserMatch && ['PUT', 'DELETE'].includes(method)) {
    const session = await requireAdminAuth();
    const userId = deleteUserMatch[2];
    const target = await env.DB.prepare(`
      SELECT u.id, u.public_id, u.username, u.full_name, u.role_code, u.status, r.scope
      FROM users u
      LEFT JOIN roles r ON r.code = u.role_code
      WHERE u.id = ?
    `).bind(userId).first();
    if (!target) return err('User not found.', 404);

    if (method === 'PUT') {
      const body = await getBody();
      const status = String(body.status || '');
      if (!['Active', 'Suspended'].includes(status)) {
        return err('User status must be Active or Suspended.', 400);
      }
      if (target.status === status) return json({ success: true, message: 'User status is unchanged.' });
      if (status === 'Suspended') {
        if (target.id === session.user_id) return err('You cannot suspend your own account.', 409);
        const protectedTarget = await env.DB.prepare(`SELECT 1 FROM protected_user_accounts WHERE user_id = ?`).bind(userId).first();
        if (protectedTarget) return err('This owner account is protected and cannot be suspended.', 409);
        if (target.role_code === 'SA') {
          const adminCount = await env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE role_code = 'SA' AND status = 'Active'`).first();
          if ((adminCount?.count || 0) <= 1) return err('The last active Surge Administrator cannot be suspended.', 409);
        }
      }

      const auditId = randomId();
      const auditSummary = `Changed staff account @${target.username} status from ${target.status} to ${status}.`;
      const results = await env.DB.batch([
        env.DB.prepare(`UPDATE users SET status = ? WHERE id = ?`).bind(status, userId),
        ...(status !== 'Active' ? [env.DB.prepare(`
          UPDATE sessions SET revoked = 1, revoke_reason = 'USER_SUSPENDED'
          WHERE user_id = ? AND revoked = 0
        `).bind(userId)] : []),
        env.DB.prepare(`
          INSERT INTO audit_logs (
            id, actor_user_id, actor_name, actor_role, organization, action_type,
            entity_type, entity_id, delta_summary, old_values, new_values, created_at
          ) VALUES (?, ?, ?, ?, ?, 'UPDATE_USER_STATUS', 'User', ?, ?, ?, ?, datetime('now'))
        `).bind(
          auditId,
          session.user_id,
          session.full_name,
          session.role_code,
          session.organization_name || session.bank_name || 'Surge Solutions',
          target.public_id || target.id,
          auditSummary,
          JSON.stringify({ status: target.status }),
          JSON.stringify({ status })
        )
      ]);
      if (!results[0]?.meta?.changes) return err('User status was not updated. Refresh and try again.', 409);
      return json({ success: true, message: `User @${target.username} is now ${status}.` });
    }

    const protectedAccount = await env.DB.prepare(`
      SELECT 1 AS protected FROM protected_user_accounts WHERE user_id = ?
    `).bind(userId).first();
    if (protectedAccount) return err('This owner account is protected and cannot be deleted.', 409);
    if (target.id === session.user_id) return err('You cannot delete your own account.', 409);

    if (target.role_code === 'SA' && target.status === 'Active') {
      const adminCount = await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role_code = 'SA' AND status = 'Active'
      `).first();
      if ((adminCount?.count || 0) <= 1) {
        return err('The last active Surge Administrator cannot be deleted.', 409);
      }
    }

    const auditId = randomId();
    const targetPublicId = target.public_id || target.id;
    const auditSummary = `Deleted staff account @${target.username} (${target.full_name}).`;
    const auditOldValues = JSON.stringify({
      username: target.username,
      fullName: target.full_name,
      roleCode: target.role_code,
      status: target.status
    });
    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE sessions
        SET revoked = 1, revoke_reason = 'USER_DELETED'
        WHERE user_id = ? AND revoked = 0
      `).bind(userId),
      env.DB.prepare(`
        INSERT INTO audit_logs (
          id, actor_user_id, actor_name, actor_role, organization, action_type,
          entity_type, entity_id, delta_summary, old_values, created_at
        )
        SELECT ?, ?, ?, ?, ?, 'DELETE_USER', 'User', ?, ?, ?, datetime('now')
        FROM users WHERE id = ?
      `).bind(
        auditId,
        session.user_id,
        session.full_name,
        session.role_code,
        session.organization_name || session.bank_name || 'Surge Solutions',
        targetPublicId,
        auditSummary,
        auditOldValues,
        userId
      ),
      env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId)
    ]);
    if (!results[2]?.meta?.changes) return err('User was not deleted. Refresh the staff list and try again.', 409);
    return json({ success: true, message: `Staff account @${target.username} was deleted.` });
  }

  // PUT /api/admin/users/:id/unlock - Admin unlock a locked account
  const unlockUserMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/unlock$/);
  if (unlockUserMatch && method === 'PUT') {
    const session = await requireAdminAuth();
    const targetId = unlockUserMatch[1];
    const target = await env.DB.prepare(`SELECT id, username, full_name, locked_until, status FROM users WHERE id = ?`).bind(targetId).first();
    if (!target) return err('User not found.', 404);
    await env.DB.batch([
      env.DB.prepare(`UPDATE users SET locked_until = NULL WHERE id = ?`).bind(targetId),
      env.DB.prepare(`DELETE FROM login_attempts WHERE username = ? AND success = 0 AND datetime(attempted_at) >= datetime('now', '-15 minutes')`).bind(target.username)
    ]);
    await auditLog(session.full_name, session.role_code, session.organization_name || 'Surge Solutions', 'UNLOCK_USER', 'User', target.full_name, 'Account unlocked by administrator');
    return json({ success: true, message: target.full_name + '\'s account has been unlocked.' });
  }


  // Password Reset
  if ((pathname.match(/^\/api\/admin\/users\/[a-zA-Z0-9_-]+\/reset-password$/) || pathname.match(/^\/api\/v1\/users\/[a-zA-Z0-9_-]+\/reset-password$/)) && method === 'POST') {
    const session = await requireAdminAuth();
    const parts = pathname.split('/');
    const id = parts[parts.length - 2];
    const body = await getBody();
    const { password } = body;
    if (typeof password !== 'string' || password.trim().length < 8 || password.length > 256) return err('Password must be 8 to 256 characters.', 400);

    const user = await env.DB.prepare(`SELECT id, username, full_name, public_id FROM users WHERE id = ?`).bind(id).first();
    if (!user) return err('User not found', 404);
    const protectedTarget = await env.DB.prepare(`SELECT 1 FROM protected_user_accounts WHERE user_id = ?`).bind(id).first();
    if (protectedTarget && user.id !== session.user_id) {
      return err('This owner account is protected. Only its owner can change its password.', 409);
    }

    await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(await hashPassword(password.trim()), id).run();
    await env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'PASSWORD_RESET' WHERE user_id = ? AND revoked = 0`).bind(id).run();
    await auditLog(actorName, actorRole, 'Surge Solutions', 'RESET_PASSWORD', 'User', user.public_id, `Password reset for user @${user.username}`);
    return json({ success: true, message: `Password reset successfully for @${user.username}.` });
  }

  // 5 Statutory Gates Readiness Assessment (/api/admin/assets/:id/readiness)
  const readinessMatch = pathname.match(/^\/api\/(admin|v1)\/assets\/([a-zA-Z0-9_-]+)\/readiness$/);
  if (readinessMatch && (method === 'GET' || method === 'POST')) {
    await requireAdminAuth();
    const id = readinessMatch[2];
    const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
    if (!asset) return err('Asset not found', 404);
    const readiness = await getAssetReadiness(asset);
    return json({
      success: true,
      asset_id: asset.id,
      public_ref: asset.public_ref,
      status: asset.status,
      legal_hold_active: !!asset.legal_hold_active,
      can_publish: readiness.allPass && asset.status === 'Approved',
      allPass: readiness.allPass,
      gates: readiness.gates
    });
  }

  // Legal & Title Queue (/api/admin/legal, /api/admin/titles, /api/admin/valuations)
  const legalInstrumentReviewMatch = pathname.match(/^\/api\/admin\/legal-instruments\/([a-zA-Z0-9_-]+)\/(verify|reject)$/);
  if (legalInstrumentReviewMatch && method === 'POST') {
    const session = await requireAdminAuth();
    const instrument = await env.DB.prepare(`
      SELECT li.*, ec.id AS enforcement_case_id, ec.asset_id, a.public_ref
      FROM legal_instruments li
      JOIN enforcement_cases ec ON ec.id = li.case_id
      JOIN assets a ON a.id = ec.asset_id
      WHERE li.id = ?
    `).bind(legalInstrumentReviewMatch[1]).first();
    if (!instrument) return err('Legal instrument not found.', 404);

    const action = legalInstrumentReviewMatch[2];
    const body = await getBody();
    const notes = String(body.notes || '').trim().slice(0, 2000);
    if (action === 'reject' && !notes) return err('A reason is required to reject a legal instrument.', 400);
    if (action === 'verify') {
      const document = await env.DB.prepare(`
        SELECT id FROM documents
        WHERE asset_id = ? AND category = 'Legal Instrument' AND title = ?
        ORDER BY uploaded_at DESC LIMIT 1
      `).bind(instrument.asset_id, `${instrument.instrument_type} ${instrument.instrument_ref}`).first();
      if (!document) return err('A supporting legal instrument document is required before verification.', 400);
    }

    const status = action === 'verify' ? 'Verified' : 'Rejected';
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE legal_instruments
        SET verification_status = ?, verified_by = ?, verified_at = ?, notes = ?
        WHERE id = ?
      `).bind(
        status,
        action === 'verify' ? session.full_name : null,
        action === 'verify' ? new Date().toISOString() : null,
        notes || null,
        instrument.id
      ),
      env.DB.prepare(`
        UPDATE enforcement_cases SET status = 'Pending Verification'
        WHERE id = ?
      `).bind(instrument.enforcement_case_id),
      ...(action === 'reject' ? [env.DB.prepare(`
        UPDATE assets SET status = 'Under Review', review_required = 1,
          review_required_reason = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Approved', 'Live')
      `).bind(`Legal instrument rejected: ${notes}`, instrument.asset_id)] : [])
    ]);
    await auditLog(
      session.full_name,
      session.role_code,
      session.organization_name || 'Surge Solutions',
      `${action.toUpperCase()}_LEGAL_INSTRUMENT`,
      'LegalInstrument',
      instrument.id,
      `${instrument.instrument_type} ${status.toLowerCase()} for ${instrument.public_ref}${notes ? `: ${notes}` : ''}`
    );
    return json({ success: true, status, message: `Legal instrument ${status.toLowerCase()}.` });
  }

  const legalClearanceMatch = pathname.match(/^\/api\/admin\/assets\/([a-zA-Z0-9_-]+)\/legal-clearance$/);
  if (legalClearanceMatch && method === 'POST') {
    const session = await requireAdminAuth();
    const assetRef = decodeURIComponent(legalClearanceMatch[1]);
    const asset = await env.DB.prepare(`
      SELECT id, public_ref, legal_hold_active FROM assets
      WHERE id = ? OR public_ref = ?
    `).bind(assetRef, assetRef).first();
    if (!asset) return err('Asset not found.', 404);
    if (asset.legal_hold_active) return err('Cannot issue clearance while a legal hold is active.', 409);

    const enforcement = await env.DB.prepare(`
      SELECT ec.id, ec.case_number, COUNT(li.id) AS instrument_count,
        SUM(CASE WHEN li.verification_status = 'Verified' AND EXISTS (
          SELECT 1 FROM documents d
          WHERE d.asset_id = ec.asset_id
            AND d.category = 'Legal Instrument'
            AND d.title = li.instrument_type || ' ' || li.instrument_ref
        ) THEN 1 ELSE 0 END) AS verified_instrument_count
      FROM enforcement_cases ec
      LEFT JOIN legal_instruments li ON li.case_id = ec.id
      WHERE ec.asset_id = ?
      GROUP BY ec.id
    `).bind(asset.id).first();
    if (!enforcement || !enforcement.instrument_count) {
      return err('At least one enforcement instrument is required before clearance.', 400);
    }
    if (enforcement.instrument_count !== enforcement.verified_instrument_count) {
      return err('Verify every enforcement instrument before issuing legal clearance.', 400);
    }

    const body = await getBody();
    const notes = String(body.notes || '').trim().slice(0, 2000);
    await env.DB.prepare(`
      UPDATE enforcement_cases SET status = 'Cleared', notes = ? WHERE id = ?
    `).bind(notes || null, enforcement.id).run();
    await env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(
      session.full_name,
      session.role_code,
      session.organization_name || 'Surge Solutions',
      'ISSUE_LEGAL_CLEARANCE',
      'EnforcementCase',
      asset.public_ref,
      `Legal clearance issued for ${asset.public_ref}${notes ? `: ${notes}` : ''}`
    );
    return json({ success: true, message: 'Legal clearance issued and saved.' });
  }

  const legalClearanceRevokeMatch = pathname.match(/^\/api\/admin\/assets\/([a-zA-Z0-9_-]+)\/legal-clearance\/revoke$/);
  if (legalClearanceRevokeMatch && method === 'POST') {
    const session = await requireAdminAuth();
    const assetRef = decodeURIComponent(legalClearanceRevokeMatch[1]);
    const asset = await env.DB.prepare(`
      SELECT id, public_ref FROM assets WHERE id = ? OR public_ref = ?
    `).bind(assetRef, assetRef).first();
    if (!asset) return err('Asset not found.', 404);
    const enforcement = await env.DB.prepare(`
      SELECT id, status FROM enforcement_cases WHERE asset_id = ?
    `).bind(asset.id).first();
    if (!enforcement || enforcement.status !== 'Cleared') {
      return err('This asset has no active legal clearance to revoke.', 409);
    }
    const body = await getBody();
    const notes = String(body.notes || '').trim().slice(0, 2000);
    if (!notes) return err('A reason is required to revoke legal clearance.', 400);
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE enforcement_cases SET status = 'Pending Verification', notes = ? WHERE id = ?
      `).bind(notes, enforcement.id),
      env.DB.prepare(`
        UPDATE assets SET status = 'Under Review', review_required = 1,
          review_required_reason = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Approved', 'Live')
      `).bind(`Legal clearance revoked: ${notes}`, asset.id)
    ]);
    await auditLog(
      session.full_name,
      session.role_code,
      session.organization_name || 'Surge Solutions',
      'REVOKE_LEGAL_CLEARANCE',
      'EnforcementCase',
      asset.public_ref,
      `Legal clearance revoked for ${asset.public_ref}: ${notes}`
    );
    return json({ success: true, message: 'Legal clearance revoked and saved.' });
  }

  const bankTitleMatch = pathname.match(/^\/api\/bank\/assets\/([a-zA-Z0-9_-]+)\/title$/);
  if (bankTitleMatch && method === 'POST') {
    const session = await requireBankAuth();
    const assetRef = decodeURIComponent(bankTitleMatch[1]);
    const asset = session.scope === 'surge'
      ? await env.DB.prepare(`
          SELECT id, public_ref, bank_id FROM assets
          WHERE id = ? OR public_ref = ?
        `).bind(assetRef, assetRef).first()
      : await env.DB.prepare(`
          SELECT id, public_ref, bank_id FROM assets
          WHERE (id = ? OR public_ref = ?) AND bank_id = ?
        `).bind(assetRef, assetRef, session.bank_id).first();
    if (!asset) return err('Asset not found or access denied.', 404);

    const body = await getBody();
    const certificateNumber = String(body.certificateNumber || '').trim().slice(0, 160);
    const titleType = String(body.titleType || '').trim();
    const registry = String(body.registry || '').trim().slice(0, 160);
    const registeredOwner = String(body.registeredOwner || '').trim().slice(0, 160);
    const perfectionStatus = String(body.perfectionStatus || '').trim();
    if (!certificateNumber) return err('Title number is required.', 400);
    if (!['Freehold', 'Leasehold', 'Registered'].includes(titleType)) return err('Select a valid title type.', 400);
    if (!registry) return err('Registry or issuing authority is required.', 400);
    if (!['Perfected', 'Unperfected', 'In Progress'].includes(perfectionStatus)) {
      return err('Select a valid perfection status.', 400);
    }

    let documentId = String(body.documentId || '').trim();
    if (documentId) {
      const doc = await env.DB.prepare(`
        SELECT id FROM documents
        WHERE id = ? AND asset_id = ? AND category = 'Title Deed'
      `).bind(documentId, asset.id).first();
      if (!doc) return err('The selected title deed does not belong to this asset.', 400);
    } else {
      const doc = await env.DB.prepare(`
        SELECT id FROM documents
        WHERE asset_id = ? AND category = 'Title Deed'
        ORDER BY uploaded_at DESC LIMIT 1
      `).bind(asset.id).first();
      documentId = doc?.id || '';
    }
    if (!documentId) return err('Upload a title deed before requesting verification.', 400);

    const titleRecordId = 'tr-' + crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO title_records (
          id, asset_id, certificate_number, title_type, registered_owner, registry,
          document_id, perfection_status, verification_status, verified_by, verified_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, NULL, NULL)
        ON CONFLICT(asset_id) DO UPDATE SET
          certificate_number = excluded.certificate_number,
          title_type = excluded.title_type,
          registered_owner = excluded.registered_owner,
          registry = excluded.registry,
          document_id = excluded.document_id,
          perfection_status = excluded.perfection_status,
          verification_status = 'Pending',
          verified_by = NULL,
          verified_at = NULL,
          notes = NULL
      `).bind(
        titleRecordId, asset.id, certificateNumber, titleType, registeredOwner,
        registry, documentId, perfectionStatus
      ),
      env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id)
    ]);
    await auditLog(session.full_name, session.role_code, session.bank_id || asset.bank_id, 'SUBMIT_TITLE', 'TitleRecord', asset.public_ref,
      `Title details submitted for ${asset.public_ref}`);
    return json({ success: true, message: 'Title details and deed submitted for verification.' }, 201);
  }

  const bankValuationMatch = pathname.match(/^\/api\/bank\/assets\/([a-zA-Z0-9_-]+)\/valuations$/);
  if (bankValuationMatch && method === 'POST') {
    const session = await requireBankAuth();
    const assetRef = decodeURIComponent(bankValuationMatch[1]);
    const asset = session.scope === 'surge'
      ? await env.DB.prepare(`
          SELECT id, public_ref, bank_id FROM assets
          WHERE id = ? OR public_ref = ?
        `).bind(assetRef, assetRef).first()
      : await env.DB.prepare(`
          SELECT id, public_ref, bank_id FROM assets
          WHERE (id = ? OR public_ref = ?) AND bank_id = ?
        `).bind(assetRef, assetRef, session.bank_id).first();
    if (!asset) return err('Asset not found or access denied.', 404);

    const body = await getBody();
    const marketValue = Number(body.marketValue);
    const forcedSaleValue = Number(body.forcedSaleValue);
    const valuationDate = String(body.valuationDate || '').trim();
    const validityDays = Number(body.validityDays);
    const valuerName = String(body.valuerName || '').trim().slice(0, 160);
    let documentId = String(body.documentId || '').trim();
    if (!Number.isFinite(marketValue) || marketValue <= 0 ||
      !Number.isFinite(forcedSaleValue) || forcedSaleValue <= 0) {
      return err('Enter valid market and forced-sale values greater than zero.', 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valuationDate) || !Number.isFinite(Date.parse(valuationDate))) {
      return err('Enter a valid valuation date.', 400);
    }
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 3650) {
      return err('Valuation validity must be between 1 and 3650 days.', 400);
    }
    if (!valuerName) return err('Valuer name is required.', 400);
    if (!documentId) {
      const latestDoc = await env.DB.prepare(`
        SELECT id FROM documents
        WHERE asset_id = ? AND (category = 'Valuation Report' OR category LIKE '%Valuation%')
        ORDER BY uploaded_at DESC LIMIT 1
      `).bind(asset.id).first();
      documentId = latestDoc?.id || '';
    }
    const document = documentId ? await env.DB.prepare(`
      SELECT id FROM documents
      WHERE id = ? AND asset_id = ? AND (category = 'Valuation Report' OR category LIKE '%Valuation%')
    `).bind(documentId, asset.id).first() : null;
    if (!document) return err('Upload a valuation report before submitting the valuation.', 400);

    const expiryDate = new Date(Date.parse(`${valuationDate}T00:00:00Z`) + validityDays * 86400000)
      .toISOString().slice(0, 10);
    const existingValuation = await env.DB.prepare(`
      SELECT id FROM valuations
      WHERE asset_id = ?
      ORDER BY valuation_date DESC, rowid DESC LIMIT 1
    `).bind(asset.id).first();
    const valuationId = existingValuation?.id || 'val-' + crypto.randomUUID();
    if (existingValuation) {
      await env.DB.batch([
        env.DB.prepare(`
          UPDATE valuations SET
            valuer_name = ?, market_value = ?, forced_sale_value = ?, valuation_date = ?,
            expiry_date = ?, validity_period_days = ?, status = 'Pending Review',
            review_required = 1, document_id = ?, notes = NULL
          WHERE id = ?
        `).bind(
          valuerName, marketValue, forcedSaleValue, valuationDate,
          expiryDate, validityDays, documentId, valuationId
        ),
        env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id)
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO valuations (
            id, asset_id, valuer_name, market_value, forced_sale_value, valuation_date,
            expiry_date, validity_period_days, status, review_required, document_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', 1, ?, NULL)
        `).bind(
          valuationId, asset.id, valuerName, marketValue, forcedSaleValue,
          valuationDate, expiryDate, validityDays, documentId
        ),
        env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id)
      ]);
    }
    await auditLog(session.full_name, session.role_code, session.bank_id || asset.bank_id, 'SUBMIT_VALUATION', 'Valuation', asset.public_ref,
      `Valuation submitted for ${asset.public_ref}`);
    return json({ success: true, id: valuationId, document_id: documentId, message: 'Valuation and supporting report submitted for review.' }, 201);
  }

  if (pathname === '/api/admin/legal' && method === 'GET') {
    const cases = await env.DB.prepare(`
      SELECT ec.*, a.public_ref, a.title as asset_title, b.legal_name as bank_name
      FROM enforcement_cases ec
      JOIN assets a ON ec.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      ORDER BY ec.status ASC
    `).all();
    return json({ success: true, count: cases.results.length, data: cases.results });
  }

  if (pathname === '/api/admin/titles' && method === 'GET') {
    const titles = await env.DB.prepare(`
      SELECT tr.*, a.public_ref, a.title as asset_title, b.legal_name as bank_name,
        d.title AS document_title, d.category AS document_category, d.file_size AS document_size
      FROM title_records tr
      JOIN assets a ON tr.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      LEFT JOIN documents d ON d.id = tr.document_id
      ORDER BY tr.verification_status ASC
    `).all();
    return json({ success: true, count: titles.results.length, data: titles.results });
  }

  if (pathname === '/api/admin/valuations' && method === 'GET') {
    const vals = await env.DB.prepare(`
      SELECT v.*, v.rowid AS record_order, a.public_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name,
        d.title AS document_title, d.category AS document_category, d.file_size AS document_size
      FROM valuations v
      JOIN assets a ON v.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      LEFT JOIN documents d ON d.id = v.document_id
      ORDER BY v.valuation_date DESC, v.rowid DESC
    `).all();
    return json({ success: true, count: vals.results.length, data: vals.results });
  }

  const titleReviewMatch = pathname.match(/^\/api\/admin\/titles\/([a-zA-Z0-9_-]+)\/(verify|reject|revoke)$/);
  if (titleReviewMatch && method === 'POST') {
    const title = await env.DB.prepare(`
      SELECT tr.*, a.public_ref FROM title_records tr
      JOIN assets a ON a.id = tr.asset_id WHERE tr.id = ?
    `).bind(titleReviewMatch[1]).first();
    if (!title) return err('Title record not found.', 404);
    const action = titleReviewMatch[2];
    const body = await getBody();
    const notes = String(body.notes || '').trim().slice(0, 2000);
    if (['reject', 'revoke'].includes(action) && !notes) return err('A reason is required to reject or revoke title verification.', 400);
    if (action === 'verify' && title.perfection_status !== 'Perfected') {
      return err('The bank must mark the title as Perfected before it can be verified.', 400);
    }
    if (action === 'verify') {
      const deed = await env.DB.prepare(`
        SELECT id FROM documents WHERE id = ? AND asset_id = ? AND category = 'Title Deed'
      `).bind(title.document_id, title.asset_id).first();
      if (!deed) return err('A linked title deed is required before verification.', 400);
    }
    const status = action === 'verify' ? 'Verified' : action === 'reject' ? 'Rejected' : 'Revoked';
    const verifiedBy = action === 'verify' ? getActiveSession()?.full_name || actorName : null;
    await env.DB.batch([
      env.DB.prepare(`
      UPDATE title_records
      SET verification_status = ?, verified_by = ?, verified_at = ?, notes = ?
      WHERE id = ?
      `).bind(status, verifiedBy, verifiedBy ? new Date().toISOString() : null, notes || null, title.id),
      ...(action !== 'verify' ? [env.DB.prepare(`
        UPDATE assets SET status = 'Under Review', review_required = 1,
          review_required_reason = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Approved', 'Live')
      `).bind(`Title verification ${status.toLowerCase()}: ${notes}`, title.asset_id)] : [])
    ]);
    await auditLog(actorName, actorRole, 'Surge Solutions', `${action.toUpperCase()}_TITLE`, 'TitleRecord',
      title.public_ref, `Title verification ${status.toLowerCase()}${notes ? `: ${notes}` : ''}`);
    return json({ success: true, status, message: `Title verification ${status.toLowerCase()}.` });
  }

  const valuationReviewMatch = pathname.match(/^\/api\/admin\/valuations\/([a-zA-Z0-9_-]+)\/(verify|reject|revoke)$/);
  if (valuationReviewMatch && method === 'POST') {
    const valuation = await env.DB.prepare(`
      SELECT v.*, a.public_ref FROM valuations v
      JOIN assets a ON a.id = v.asset_id WHERE v.id = ?
    `).bind(valuationReviewMatch[1]).first();
    if (!valuation) return err('Valuation record not found.', 404);
    const action = valuationReviewMatch[2];
    const body = await getBody();
    const notes = String(body.notes || '').trim().slice(0, 2000);
    if (['reject', 'revoke'].includes(action) && !notes) return err('A reason is required to reject or revoke valuation verification.', 400);
    const expired = Date.parse(`${valuation.expiry_date}T23:59:59Z`) < Date.now();
    if (action === 'verify' && expired) return err('This valuation has expired. Ask the bank to submit a current valuation.', 400);
    let resolvedDocumentId = valuation.document_id;
    if (action === 'verify') {
      if (!resolvedDocumentId) {
        const fallbackDoc = await env.DB.prepare(`
          SELECT id FROM documents WHERE asset_id = ? AND (category = 'Valuation Report' OR category LIKE '%Valuation%')
          ORDER BY uploaded_at DESC LIMIT 1
        `).bind(valuation.asset_id).first();
        resolvedDocumentId = fallbackDoc?.id || null;
        if (resolvedDocumentId) {
          await env.DB.prepare(`UPDATE valuations SET document_id = ? WHERE id = ?`).bind(resolvedDocumentId, valuation.id).run();
        }
      }
      const report = resolvedDocumentId ? await env.DB.prepare(`
        SELECT id FROM documents WHERE id = ? AND asset_id = ? AND (category = 'Valuation Report' OR category LIKE '%Valuation%')
      `).bind(resolvedDocumentId, valuation.asset_id).first() : null;
      if (!report) return err('A linked valuation report is required before verification.', 400);
    }
    const status = action === 'verify' ? 'Valid' : action === 'reject' ? 'Rejected' : 'Revoked';
    await env.DB.batch([
      env.DB.prepare(`
      UPDATE valuations SET status = ?, review_required = ?, notes = ? WHERE id = ?
      `).bind(status, action === 'verify' ? 0 : 1, notes || null, valuation.id),
      ...(action !== 'verify' ? [env.DB.prepare(`
        UPDATE assets SET status = 'Under Review', review_required = 1,
          review_required_reason = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Approved', 'Live')
      `).bind(`Valuation ${status.toLowerCase()}: ${notes}`, valuation.asset_id)] : []),
      env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(valuation.asset_id)
    ]);
    await auditLog(actorName, actorRole, 'Surge Solutions', `${action.toUpperCase()}_VALUATION`, 'Valuation',
      valuation.public_ref, `Valuation ${status.toLowerCase()}${notes ? `: ${notes}` : ''}`);
    return json({ success: true, status, message: `Valuation ${status.toLowerCase()}.` });
  }

  // Settings (/api/admin/settings)
  if (pathname === '/api/admin/settings') {
    if (method === 'GET') {
      const settings = await env.DB.prepare(`SELECT * FROM system_settings`).all();
      return json({ success: true, data: settings.results });
    }
    if (method === 'PUT') {
      const body = await getBody();
      if (!Array.isArray(body.settings) || body.settings.length > 50) return err('Provide a list of settings to update.', 400);
      const known = new Set(((await env.DB.prepare(`SELECT key FROM system_settings`).all()).results || []).map(row => row.key));
      for (const s of body.settings) {
        if (!s || typeof s.key !== 'string' || !known.has(s.key)) return err('Only existing settings can be updated.', 400);
        if (s.value === undefined || s.value === null || String(s.value).length > 500) return err(`The value for ${s.key} must be 500 characters or fewer.`, 400);
      }
      await env.DB.batch(body.settings.map(s =>
        env.DB.prepare(`UPDATE system_settings SET value = ? WHERE key = ?`).bind(String(s.value), s.key)));
      await auditLog(actorName, actorRole, 'Surge Solutions', 'UPDATE_SETTINGS', 'SystemSettings', 'global', `Settings updated: ${body.settings.map(s => s.key).join(', ')}`);
      return json({ success: true, message: 'Settings updated successfully.' });
    }
  }
}
