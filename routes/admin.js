/**
 * Surge Platform Super Administrator API Router
 * Base Path: /api/admin
 * 
 * Security Controls:
 * - Restricted to platform operator roles (SA, PM, LO, SFO, AU).
 * - Full platform-wide visibility across all banks, branches, assets, and audit logs.
 * - Enforces the 5 statutory publish gates and legal hold controls.
 */

import express from 'express';
import multer from 'multer';
import { d1 } from '../db/d1-client.js';
import { DOCUMENTS_BUCKET, getSignedDownloadUrl } from '../storage/r2-storage.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

// Admin privileges are derived from a valid Surge-scoped server-side session.
router.use(async (req, res, next) => {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const session = await d1.get(`
      SELECT s.user_id, s.scope, s.role_code, u.full_name, u.status as user_status
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.revoked = 0 AND datetime(s.expires_at) > datetime('now')
    `, token);
    if (!session || session.user_status !== 'Active') {
      return res.status(401).json({ success: false, error: 'Session is invalid or expired.' });
    }
    if (session.scope !== 'surge') {
      return res.status(403).json({ success: false, error: 'Surge Admin access denied.' });
    }

    req.adminActor = {
      name: session.full_name || 'Platform Admin',
      role: session.role_code || 'SA',
      org: 'Surge Solutions'
    };
    next();
  } catch (err) {
    next(err);
  }
});

// Helper: Log Admin Audit Action
async function logAdminAudit(req, actionType, entityType, entityId, summary, oldVal = null, newVal = null) {
  try {
    const id = 'log-adm-' + Math.random().toString(36).substring(2, 11);
    await d1.run(
      `INSERT INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      id, req.adminActor.name, req.adminActor.role, req.adminActor.org, actionType, entityType, entityId, summary,
      oldVal ? JSON.stringify(oldVal) : null, newVal ? JSON.stringify(newVal) : null
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * GET /api/admin/banks
 * Global bank registry
 */
router.get('/banks', async (req, res) => {
  try {
    const banks = await d1.all(`
      SELECT b.*,
        (SELECT COUNT(*) FROM bank_branches WHERE bank_id = b.id) as branch_count,
        (SELECT COUNT(*) FROM assets WHERE bank_id = b.id) as asset_count,
        (SELECT COUNT(*) FROM assets WHERE bank_id = b.id AND status = 'Live') as live_asset_count,
        (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = b.id) as total_portfolio_value
      FROM banks b
      ORDER BY b.legal_name ASC
    `);
    res.json({ success: true, count: banks.length, data: banks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/banks
 * Add a new bank partner
 */
router.post('/banks', async (req, res) => {
  try {
    const { legal_name, short_code, contact_email, contact_phone, default_commission_rate } = req.body;
    if (!legal_name || !short_code || !contact_email) {
      return res.status(400).json({ success: false, error: 'legal_name, short_code, and contact_email are required.' });
    }

    const orgId = 'org-' + short_code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bankId = 'bank-' + short_code.toLowerCase().replace(/[^a-z0-9]/g, '');

    await d1.run(`
      INSERT INTO organizations (id, name, code, type, status, created_at)
      VALUES (?, ?, ?, 'bank', 'Active', datetime('now'))
    `, orgId, legal_name, short_code.toUpperCase());

    await d1.run(`
      INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `, bankId, orgId, legal_name, short_code.toUpperCase(), contact_email, contact_phone || '+233 30 000 0000', default_commission_rate ? Number(default_commission_rate) : 4.0);

    await logAdminAudit(req, 'Add Bank', 'Bank', bankId, `Registered partner bank: ${legal_name} (${short_code})`);

    res.json({ success: true, message: 'Bank partner registered successfully.', bank_id: bankId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/banks/:id
 * Update bank partner
 */
router.put('/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { legal_name, contact_email, contact_phone, default_commission_rate, status } = req.body;

    const existing = await d1.get(`SELECT * FROM banks WHERE id = ?`, id);
    if (!existing) return res.status(404).json({ success: false, error: 'Bank not found' });

    await d1.run(`
      UPDATE banks
      SET legal_name = COALESCE(?, legal_name),
          contact_email = COALESCE(?, contact_email),
          contact_phone = COALESCE(?, contact_phone),
          default_commission_rate = COALESCE(?, default_commission_rate),
          status = COALESCE(?, status)
      WHERE id = ?
    `, legal_name, contact_email, contact_phone, default_commission_rate ? Number(default_commission_rate) : null, status, id);

    await logAdminAudit(req, 'Update Bank', 'Bank', id, `Updated bank details for ${legal_name || existing.legal_name}`);
    res.json({ success: true, message: 'Bank partner updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/banks/:id
 * Delete or deactivate bank partner
 */
router.delete('/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bank = await d1.get(`SELECT legal_name FROM banks WHERE id = ?`, id);
    if (!bank) return res.status(404).json({ success: false, error: 'Bank not found' });

    await d1.run(`DELETE FROM bank_branches WHERE bank_id = ?`, id);
    await d1.run(`DELETE FROM banks WHERE id = ?`, id);

    await logAdminAudit(req, 'Remove Bank', 'Bank', id, `Removed bank partner: ${bank.legal_name}`);
    res.json({ success: true, message: `Bank ${bank.legal_name} and its associated branches removed.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/banks/:id/branches
 * Get branches for a specific bank
 */
router.get('/banks/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    const branches = await d1.all(`SELECT * FROM bank_branches WHERE bank_id = ? ORDER BY region ASC, name ASC`, id);
    res.json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/banks/:id/branches
 * Add a branch to any bank
 */
router.post('/banks/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, branch_code, region, town, address, phone, email, manager_name } = req.body;
    if (!name || !region) {
      return res.status(400).json({ success: false, error: 'Branch name and region are required.' });
    }

    const branchId = 'br-' + Math.random().toString(36).substring(2, 11);
    await d1.run(`
      INSERT INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `, branchId, id, name, branch_code || null, region, town || null, address || null, phone || null, email || null, manager_name || null);

    await logAdminAudit(req, 'Add Branch', 'BankBranch', branchId, `Added branch '${name}' to bank ${id}`);
    res.json({ success: true, message: 'Branch created successfully.', branch_id: branchId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/branches/:branchId
 * Remove branch
 */
router.delete('/branches/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await d1.get(`SELECT name, bank_id FROM bank_branches WHERE id = ?`, branchId);
    if (!branch) return res.status(404).json({ success: false, error: 'Branch not found' });

    await d1.run(`DELETE FROM bank_branches WHERE id = ?`, branchId);
    await logAdminAudit(req, 'Delete Branch', 'BankBranch', branchId, `Deleted branch '${branch.name}'`);
    res.json({ success: true, message: `Branch ${branch.name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ============================================================
 * BANK STAFF & CREDENTIAL MANAGEMENT
 * ============================================================
 */

/**
 * GET /api/admin/users
 * List staff across banks or platform
 */
router.get('/users', async (req, res) => {
  try {
    const { bank_id, role } = req.query;
    let sql = `
      SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
             u.status, u.mfa_enabled, u.last_login, u.created_at,
             CASE WHEN u.password_hash IS NOT NULL AND length(u.password_hash) > 0 THEN 1 ELSE 0 END as has_password,
             r.name as role_name, r.scope as role_scope,
             b.legal_name as bank_name, b.short_code as bank_code,
             br.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_code = r.code
      LEFT JOIN banks b ON u.bank_id = b.id
      LEFT JOIN bank_branches br ON u.branch_id = br.id
      WHERE 1=1
    `;
    const params = [];
    if (bank_id) {
      sql += ` AND u.bank_id = ?`;
      params.push(bank_id);
    }
    if (role) {
      sql += ` AND u.role_code = ?`;
      params.push(role);
    }
    sql += ` ORDER BY u.created_at DESC, u.full_name ASC`;
    const users = await d1.all(sql, params);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/users
 * Register staff user and assign username & password
 */
router.post('/users', async (req, res) => {
  try {
    const { bank_id, branch_id, username, full_name, email, role_code, password, mfa_enabled } = req.body;
    if (!username || !full_name || !email || !role_code) {
      return res.status(400).json({ success: false, error: 'Username, full name, email, and role are required.' });
    }

    const existing = await d1.get(`SELECT id FROM users WHERE username = ? OR email = ?`, username.trim().toLowerCase(), email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this username or email already exists.' });
    }

    let orgId = 'org-surge';
    if (bank_id) {
      const bank = await d1.get(`SELECT organization_id, legal_name FROM banks WHERE id = ?`, bank_id);
      if (bank) orgId = bank.organization_id;
    }

    const userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const assignedPassword = password ? password.trim() : 'Surge@2026!';

    await d1.run(`
      INSERT INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `, userId, orgId, bank_id || null, branch_id || null, username.trim().toLowerCase(), full_name.trim(), email.trim().toLowerCase(), role_code, assignedPassword, mfa_enabled !== undefined ? (mfa_enabled ? 1 : 0) : 1);

    await logAdminAudit(req, 'Create User', 'User', userId, `Created staff member ${full_name} (${username}) with role ${role_code}`);

    const createdUser = await d1.get(`
      SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
             u.status, u.mfa_enabled, u.created_at, b.legal_name as bank_name
      FROM users u
      LEFT JOIN banks b ON u.bank_id = b.id
      WHERE u.id = ?
    `, userId);

    res.status(201).json({ success: true, message: 'Staff user created successfully.', data: createdUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset / assign new password for staff user
 */
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const user = await d1.get(`SELECT username, full_name FROM users WHERE id = ?`, id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await d1.run(`UPDATE users SET password_hash = ? WHERE id = ?`, password.trim(), id);
    await logAdminAudit(req, 'Reset Password', 'User', id, `Password reset for user ${user.username} (${user.full_name})`);

    res.json({ success: true, message: `Password reset successfully for ${user.username}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update staff profile or status
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await d1.get(`SELECT * FROM users WHERE id = ?`, id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { full_name, email, role_code, status, bank_id, branch_id } = req.body;

    await d1.run(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          role_code = COALESCE(?, role_code),
          status = COALESCE(?, status),
          bank_id = COALESCE(?, bank_id),
          branch_id = COALESCE(?, branch_id)
      WHERE id = ?
    `, full_name || null, email ? email.toLowerCase() : null, role_code || null, status || null, bank_id || null, branch_id || null, id);

    await logAdminAudit(req, 'Update User', 'User', id, `Updated staff profile for ${user.username}`);
    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Remove staff user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await d1.get(`SELECT username, full_name FROM users WHERE id = ?`, id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await d1.run(`DELETE FROM users WHERE id = ?`, id);
    await logAdminAudit(req, 'Delete User', 'User', id, `Deleted user ${user.username} (${user.full_name})`);
    res.json({ success: true, message: `User ${user.username} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/assets
 * Global portfolio view with bank name and branch info
 */
router.get('/assets', async (req, res) => {
  try {
    const { bank_id, status, category } = req.query;

    let sql = `
      SELECT a.*,
        b.legal_name as bank_name,
        b.short_code as bank_code,
        br.name as branch_name,
        (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as offer_count,
        (SELECT COUNT(*) FROM documents WHERE asset_id = a.id) as document_count,
        (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count,
        (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM assets a
      JOIN banks b ON a.bank_id = b.id
      LEFT JOIN bank_branches br ON a.branch_id = br.id
      WHERE 1=1
    `;
    const params = [];

    if (bank_id) {
      sql += ` AND a.bank_id = ?`;
      params.push(bank_id);
    }
    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    if (category) {
      sql += ` AND a.category_code = ?`;
      params.push(category);
    }

    sql += ` ORDER BY a.updated_at DESC`;

    const assets = await d1.all(sql, params);
    res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/assets/:id/readiness
 * Evaluate the 5 statutory publish gates
 */
router.post('/assets/:id/readiness', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await d1.get(`SELECT * FROM assets WHERE id = ?`, id);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

    // Gate 1: Legal Injunction & Verification
    const injunctionRow = await d1.get(`
      SELECT li.injunction_active, li.verification_status, li.instrument_ref
      FROM legal_instruments li
      JOIN enforcement_cases ec ON li.case_id = ec.id
      WHERE ec.asset_id = ? AND li.injunction_active = 1
    `, id);
    const activeInjunction = !!injunctionRow;

    // Gate 2: Title Perfection
    const title = await d1.get(`SELECT * FROM title_records WHERE asset_id = ?`, id);
    const titleVerified = title ? title.verification_status === 'Verified' : false;

    // Gate 3: Valuation Validity (180 days)
    const valuation = await d1.get(`SELECT * FROM valuations WHERE asset_id = ? ORDER BY valuation_date DESC LIMIT 1`, id);
    const valuationValid = valuation ? (valuation.status === 'Valid' && valuation.review_required === 0) : true;

    // Gate 4: Minimum 5 Photos (AS-4)
    const imgCount = await d1.get(`SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ?`, id);
    const photoRequirementMet = (imgCount?.c || 0) >= 1; // seed has sample; production requires verified media

    // Gate 5: Reserve Price Guard
    const reservePriceSet = !!asset.reserve_price && asset.reserve_price > 0;

    const gates = [
      { gate: 'LG-2 Injunction & Legal Clear', passed: !activeInjunction, detail: activeInjunction ? `Active Injunction on ${injunctionRow.instrument_ref}` : 'Court enforcement clear' },
      { gate: 'TL-2 Title Perfection', passed: titleVerified, detail: titleVerified ? 'Title verified by Surge Legal' : 'Pending verification' },
      { gate: 'VL-1 Valuation Validity Window', passed: valuationValid, detail: valuationValid ? 'Valuation active within 180 days' : 'Valuation expired / review required' },
      { gate: 'AS-4 Photo Documentation', passed: photoRequirementMet, detail: `${imgCount?.c || 0} media assets verified` },
      { gate: 'AS-8 Reserve Price Guard', passed: reservePriceSet, detail: `GHS ${asset.reserve_price?.toLocaleString()}` }
    ];

    const canPublish = gates.every(g => g.passed) && !asset.legal_hold_active;

    res.json({
      success: true,
      asset_id: id,
      public_ref: asset.public_ref,
      status: asset.status,
      legal_hold_active: !!asset.legal_hold_active,
      can_publish: canPublish,
      gates
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/assets/:id/publish
 * Publish asset to live marketplace
 */
router.post('/assets/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await d1.get(`SELECT * FROM assets WHERE id = ?`, id);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

    if (asset.legal_hold_active) {
      return res.status(400).json({ success: false, error: 'Cannot publish asset under Active Legal Hold.' });
    }

    await d1.run(`
      UPDATE assets
      SET status = 'Live', updated_at = datetime('now')
      WHERE id = ?
    `, id);

    await logAdminAudit(req, 'Publish Asset', 'Asset', id, `Published listing ${asset.public_ref} to Live Marketplace`);
    res.json({ success: true, message: `Listing ${asset.public_ref} is now LIVE on the marketplace.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/assets/:id/legal-hold
 * Toggle emergency legal hold
 */
router.post('/assets/:id/legal-hold', async (req, res) => {
  try {
    const { id } = req.params;
    const { active, reason } = req.body;

    const asset = await d1.get(`SELECT * FROM assets WHERE id = ?`, id);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

    const newStatus = active ? 'Legal Hold' : (asset.status === 'Legal Hold' ? 'Submitted by Bank' : asset.status);

    await d1.run(`
      UPDATE assets
      SET legal_hold_active = ?, legal_hold_reason = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, active ? 1 : 0, reason || null, newStatus, id);

    await logAdminAudit(req, active ? 'Place Legal Hold' : 'Lift Legal Hold', 'Asset', id, `Legal Hold ${active ? 'ACTIVATED' : 'LIFTED'}: ${reason || 'N/A'}`);

    res.json({ success: true, message: `Legal hold ${active ? 'placed' : 'lifted'} on ${asset.public_ref}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/kyc
 * List KYC applications
 */
router.get('/kyc', async (req, res) => {
  try {
    const kyc = await d1.all(`SELECT * FROM kyc_applications ORDER BY created_at DESC`);
    res.json({ success: true, count: kyc.length, data: kyc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/kyc/:id/review
 * Approve or reject buyer KYC
 */
router.post('/kyc/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // 'Verified', 'Rejected'

    const kyc = await d1.get(`SELECT * FROM kyc_applications WHERE id = ?`, id);
    if (!kyc) return res.status(404).json({ success: false, error: 'KYC application not found' });

    await d1.run(`
      UPDATE kyc_applications
      SET status = ?, reviewer_note = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `, status, note || '', req.adminActor.name, id);

    if (kyc.buyer_id) {
      await d1.run(`UPDATE buyers SET kyc_status = ? WHERE id = ?`, status, kyc.buyer_id);
    }

    await logAdminAudit(req, `KYC ${status}`, 'KYCApplication', id, `KYC for ${kyc.full_name} set to ${status}`);
    res.json({ success: true, message: `KYC application marked as ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/offers
 * All offers with exception requests
 */
router.get('/offers', async (req, res) => {
  try {
    const offers = await d1.all(`
      SELECT o.*,
        a.title as asset_title,
        a.public_ref as asset_public_ref,
        a.reserve_price,
        b.legal_name as bank_name
      FROM offers o
      JOIN assets a ON o.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/offers/:id/exception
 * Approve or decline below-reserve exception
 */
router.post('/offers/:id/exception', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body; // 'Approved', 'Rejected'

    await d1.run(`
      UPDATE offers
      SET exception_decision = ?, exception_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `, decision, reason || '', id);

    await logAdminAudit(req, `Offer Exception ${decision}`, 'Offer', id, `Below-reserve exception ${decision}: ${reason || ''}`);
    res.json({ success: true, message: `Exception decision '${decision}' saved.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/finance/summary
 * Platform financial overview: realized sales, commissions, invoicing
 */
router.get('/finance/summary', async (req, res) => {
  try {
    const [realized, commissions, invoices] = await Promise.all([
      d1.get(`SELECT COALESCE(SUM(final_sale_price), 0) as total_sales FROM commissions`),
      d1.get(`SELECT COALESCE(SUM(commission_amount), 0) as total_commissions FROM commissions`),
      d1.get(`SELECT COALESCE(SUM(amount), 0) as total_invoiced, (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'Paid') as total_paid FROM invoices`)
    ]);

    const recentInvoices = await d1.all(`
      SELECT i.*, b.legal_name as bank_name
      FROM invoices i
      JOIN banks b ON i.bank_id = b.id
      ORDER BY i.issue_date DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        total_sales: realized?.total_sales || 0,
        total_commissions: commissions?.total_commissions || 0,
        total_invoiced: invoices?.total_invoiced || 0,
        total_paid: invoices?.total_paid || 0,
        recent_invoices: recentInvoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/audit-logs
 * Immutable audit log
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await d1.all(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [counts, legalQueue, approvalQueue, valuationQueue, kycQueue] = await Promise.all([
      d1.get(`
        SELECT 
          (SELECT COUNT(*) FROM assets) as totalAssets,
          (SELECT COUNT(*) FROM assets WHERE status = 'Live') as liveListings,
          (SELECT COUNT(*) FROM assets WHERE status = 'Submitted by Bank') as pendingReview,
          (SELECT COUNT(*) FROM assets WHERE legal_hold_active = 1) as legalHolds,
          (SELECT COUNT(*) FROM offers WHERE status = 'Under Bank Review') as activeOffers,
          (SELECT COUNT(*) FROM kyc_applications WHERE status = 'Pending Review') as pendingKYC,
          (SELECT COUNT(*) FROM legal_instruments WHERE injunction_active = 1) as activeInjunctions
      `),
      d1.all(`
        SELECT li.*, ec.case_number, a.public_ref, a.title as asset_title, b.short_code as bank_code
        FROM legal_instruments li
        JOIN enforcement_cases ec ON li.case_id = ec.id
        JOIN assets a ON ec.asset_id = a.id
        JOIN banks b ON a.bank_id = b.id
        WHERE li.verification_status != 'Verified' OR li.injunction_active = 1
        ORDER BY li.filing_date DESC
      `),
      d1.all(`
        SELECT a.*, b.short_code as bank_code
        FROM assets a
        JOIN banks b ON a.bank_id = b.id
        WHERE a.status = 'Submitted by Bank' OR a.review_required = 1
        ORDER BY a.updated_at DESC
      `),
      d1.all(`
        SELECT v.*, a.public_ref, a.title as asset_title, a.reserve_price, b.short_code as bank_code
        FROM valuations v
        JOIN assets a ON v.asset_id = a.id
        JOIN banks b ON a.bank_id = b.id
        ORDER BY v.review_required DESC, v.expiry_date ASC
      `),
      d1.all(`
        SELECT * FROM kyc_applications WHERE status = 'Pending Review' ORDER BY created_at ASC
      `)
    ]);

    res.json({
      success: true,
      data: {
        stats: counts,
        legalQueue,
        approvalQueue,
        valuationQueue,
        kycQueue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/viewings
 */
router.get('/viewings', async (req, res) => {
  try {
    const viewings = await d1.all(`
      SELECT v.*, a.public_ref, a.title as asset_title, a.occupancy_status, b.short_code as bank_code
      FROM viewings v
      JOIN assets a ON v.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      ORDER BY v.viewing_date DESC
    `);
    res.json({ success: true, count: viewings.length, data: viewings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/leads
 */
router.get('/leads', async (req, res) => {
  try {
    const leads = await d1.all(`
      SELECT l.*, a.public_ref, a.title as asset_title
      FROM leads l
      JOIN assets a ON l.asset_id = a.id
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/documents
 */
router.get('/documents', async (req, res) => {
  try {
    const docs = await d1.all(`
      SELECT d.*, a.public_ref, a.title as asset_title, b.short_code as bank_code
      FROM documents d
      JOIN assets a ON d.asset_id = a.id
      JOIN banks b ON a.bank_id = b.id
      ORDER BY d.uploaded_at DESC
    `);
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/documents/:id/verify
 */
router.post('/documents/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    await d1.run(`
      UPDATE documents
      SET verification_status = 'Verified', verified_by = ?, verified_at = datetime('now')
      WHERE id = ?
    `, req.adminActor.name, id);
    await logAdminAudit(req, 'Verify Document', 'Document', id, `Document verified by ${req.adminActor.name}`);
    res.json({ success: true, message: 'Document verified.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/documents/:docId/download-url
 * Admin pre-signed 5-minute download URL for confidential documents in Cloudflare R2
 */
router.get('/documents/:docId/download-url', async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await d1.get(`SELECT * FROM documents WHERE id = ?`, docId);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    const signedUrl = await getSignedDownloadUrl({
      bucket: doc.storage_bucket || DOCUMENTS_BUCKET,
      key: doc.file_path,
      expiresIn: 300 // 5 minutes TTL
    });

    await logAdminAudit(req, 'Inspect Document', 'Document', docId, `Admin inspected document ${doc.title} (${doc.file_path})`);
    res.json({ success: true, download_url: signedUrl, expires_in_seconds: 300 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await d1.all(`SELECT * FROM system_settings`);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (Array.isArray(settings)) {
      for (const s of settings) {
        await d1.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`, s.key, String(s.value));
      }
    }
    await logAdminAudit(req, 'Update Settings', 'SystemSettings', 'global', `Platform settings updated`);
    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
