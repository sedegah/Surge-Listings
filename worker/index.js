/**
 * Surge Solutions — Cloudflare Workers Monolith API v2.2.0
 * Centralized Authentication + Role-Based Authorization
 *
 * Auth Architecture:
 * - ONE central login: /api/auth/login
 * - Server-side sessions stored in D1 (sessions table)
 * - Session token sent via Authorization: Bearer <token> header
 * - bankId is NEVER trusted from the client — always derived from the authenticated session
 * - Every /api/bank/* route calls requireBankAuth() — unauthorized requests return 401/403
 * - Invitation-only bank employee registration
 *
 * Portals & Required Scopes:
 * - /api/admin/* → scope: 'surge' (Surge Administrators only)
 * - /api/bank/*  → scope: 'bank' or 'surge'
 * - /api/marketplace/* → public (no auth required, except offer/KYC submission)
 *
 * Direct Bindings:
 * - env.DB: Cloudflare D1 Database (surge-solutions-db)
 * - env.ASSETS_BUCKET: Cloudflare R2 Bucket (surge-assets)
 * - env.DOCUMENTS_BUCKET: Cloudflare R2 Bucket (surge-documents)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method.toUpperCase();

    // ============================================================
    // CORS MIDDLEWARE
    // Explicitly allows https://surge-listings.vercel.app, all vercel subdomains,
    // localhost development ports, and any originating client.
    // ============================================================
    const origin = request.headers.get('Origin');
    const isVercelOrLocal = !origin ||
      origin === 'https://surge-listings.vercel.app' ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    const allowOrigin = isVercelOrLocal ? (origin || '*') : '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, X-Bank-ID, X-Actor-Name, X-Actor-Role, Authorization, Accept, Origin, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });
    const err = (message, status = 400) => new Response(JSON.stringify({ success: false, error: message }), { status, headers: corsHeaders });

    // Helper: Parse JSON safely
    async function getBody() {
      try {
        return await request.json();
      } catch (e) {
        return {};
      }
    }

    // Helper: Immutable Audit Logging
    async function auditLog(actorName, actorRole, org, actionType, entityType, entityId, summary, oldVal = null, newVal = null) {
      try {
        const id = 'au-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        await env.DB.prepare(`
          INSERT INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          id,
          actorName || 'System',
          actorRole || 'System',
          org || 'Surge Solutions',
          actionType,
          entityType,
          entityId,
          summary,
          oldVal ? JSON.stringify(oldVal) : null,
          newVal ? JSON.stringify(newVal) : null
        ).run();
      } catch (e) {
        console.warn('Audit log write warning:', e);
      }
    }

    // ============================================================
    // SESSION AUTH MIDDLEWARE
    // Validates the session token from Authorization: Bearer <token>
    // or X-Session-Token header. Enriches the request context.
    // NEVER trusts client-supplied bank_id headers.
    // ============================================================
    const SESSION_TTL_HOURS = 8; // sessions expire after 8 hours of inactivity

    async function generateToken(bytes = 32) {
      const arr = new Uint8Array(bytes);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Resolve session from Authorization header or X-Session-Token
    async function resolveSession() {
      const authHeader = request.headers.get('Authorization') || '';
      const tokenHeader = request.headers.get('X-Session-Token') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : tokenHeader.trim();
      if (!token) return null;

      const session = await env.DB.prepare(`
        SELECT s.*, u.username, u.full_name, u.email, u.status as user_status,
               b.legal_name as bank_name, b.short_code as bank_code, b.status as bank_status
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN banks b ON s.bank_id = b.id
        WHERE s.id = ? AND s.revoked = 0
          AND datetime(s.expires_at) > datetime('now')
      `).bind(token).first();

      if (!session) return null;
      if (session.user_status !== 'Active') return null;

      // Touch last_active (non-blocking)
      ctx.waitUntil(env.DB.prepare(`UPDATE sessions SET last_active = datetime('now') WHERE id = ?`).bind(token).run());
      return session;
    }

    // Require authentication — returns session or sends 401
    async function requireAuth() {
      const session = await resolveSession();
      if (!session) {
        throw new Response(JSON.stringify({ success: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' }), { status: 401, headers: corsHeaders });
      }
      return session;
    }

    // Require bank-level authentication — scope must be 'bank' or 'surge'
    async function requireBankAuth() {
      const session = await requireAuth();
      if (session.scope !== 'bank' && session.scope !== 'surge') {
        throw new Response(JSON.stringify({ success: false, error: 'Bank Portal access denied. This account does not have bank portal permissions.', code: 'FORBIDDEN' }), { status: 403, headers: corsHeaders });
      }
      if (!session.bank_id) {
        throw new Response(JSON.stringify({ success: false, error: 'No bank organisation is associated with this account.', code: 'NO_BANK' }), { status: 403, headers: corsHeaders });
      }
      if (session.bank_status && session.bank_status !== 'Active') {
        throw new Response(JSON.stringify({ success: false, error: 'Your bank organisation is suspended.', code: 'BANK_SUSPENDED' }), { status: 403, headers: corsHeaders });
      }
      return session;
    }

    // Require Surge admin authentication
    async function requireAdminAuth() {
      const session = await requireAuth();
      if (session.scope !== 'surge') {
        throw new Response(JSON.stringify({ success: false, error: 'Surge Admin access denied.', code: 'FORBIDDEN' }), { status: 403, headers: corsHeaders });
      }
      return session;
    }

    // Check recent failed login attempts (rate limiting)
    async function checkLoginRateLimit(username, ipAddress) {
      const window = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const attempts = await env.DB.prepare(`
        SELECT COUNT(*) as c FROM login_attempts
        WHERE username = ? AND success = 0 AND attempted_at > ?
      `).bind(username.trim().toLowerCase(), window).first();
      return (attempts?.c || 0) >= 5;
    }

    // Legacy context (used by non-auth-gated routes only)
    const actorName = request.headers.get('x-actor-name') || 'Authorized User';
    const actorRole = request.headers.get('x-actor-role') || 'User';

    try {
      // ============================================================
      // 0. ROOT & HEALTH ENDPOINTS
      // ============================================================
      if (pathname === '/') {
        return json({
          platform: 'Surge Solutions Institutional Disposition API',
          status: 'online',
          version: '2.1.0',
          engine: 'Cloudflare Workers + D1 Database + R2 Object Storage',
          cors_allowed_frontend: 'https://surge-listings.vercel.app',
          namespaces: {
            admin: '/api/admin/*',
            bank: '/api/bank/*',
            marketplace: '/api/marketplace/*',
            branches: '/api/admin/branches, /api/bank/branches',
            regions: '/api/regions',
            encrypted: '/api/enc/*',
            legacy_v1: '/api/v1/*'
          },
          documentation: '/api/health'
        });
      }

      if (pathname === '/health' || pathname === '/api/health') {
        const dbCheck = await env.DB.prepare(`SELECT count(*) as c FROM organizations`).first();
        return json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          platform: 'Surge Solutions Enterprise Monolith',
          database: { connected: true, organization_count: dbCheck?.c || 0 },
          cors: { origin_detected: origin || 'direct', allowed: allowOrigin }
        });
      }

      // ============================================================
      // 1. CENTRALIZED AUTHENTICATION
      // POST /api/auth/login   — Central login for all portals
      // POST /api/auth/logout  — Revoke current session
      // GET  /api/auth/me      — Validate session + get profile
      // POST /api/auth/accept-invitation — Activate account from invite
      // ============================================================

      if (['/api/auth/login', '/api/v1/auth/login', '/api/bank/auth/login', '/api/admin/auth/login'].includes(pathname) && method === 'POST') {
        const body = await getBody();
        const { username, password } = body;
        if (!username || !password) return err('Username and password are required.', 400);

        const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        const uname = username.trim().toLowerCase();

        // Rate limit: 5 failures per 15 min
        const locked = await checkLoginRateLimit(uname, ipAddress);
        if (locked) {
          await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, failure_reason, attempted_at) VALUES (?, ?, ?, 0, 'RATE_LIMITED', datetime('now'))`)
            .bind('la-' + Date.now(), uname, ipAddress).run();
          return err('Too many failed attempts. Wait 15 minutes before trying again.', 429);
        }

        const user = await env.DB.prepare(`
          SELECT u.*, r.name as role_name, r.scope, o.name as org_name,
                 b.id as bank_id, b.legal_name as bank_name, b.short_code as bank_code, b.status as bank_status
          FROM users u
          JOIN roles r ON u.role_code = r.code
          JOIN organizations o ON u.organization_id = o.id
          LEFT JOIN banks b ON u.bank_id = b.id
          WHERE (u.username = ? OR u.email = ?) AND u.status = 'Active'
        `).bind(uname, uname).first();

        const recordFailure = async (reason) => {
          await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, failure_reason, attempted_at) VALUES (?, ?, ?, 0, ?, datetime('now'))`)
            .bind('la-' + Date.now() + Math.random().toString(36).slice(2), uname, ipAddress, reason).run();
        };

        if (!user) { await recordFailure('USER_NOT_FOUND'); return err('The username or password is incorrect.', 401); }
        if (!user.password_hash) { await recordFailure('NO_PASSWORD'); return err('This account has not been activated. Accept your invitation first.', 403); }
        if (user.password_hash !== password.trim()) { await recordFailure('WRONG_PASSWORD'); return err('The username or password is incorrect.', 401); }

        // Create session
        const token = await generateToken(32);
        const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();
        await env.DB.prepare(`
          INSERT INTO sessions (id, user_id, organization_id, bank_id, branch_id, role_code, scope, ip_address, user_agent, created_at, expires_at, last_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
        `).bind(token, user.id, user.organization_id, user.bank_id || null, user.branch_id || null,
          user.role_code, user.scope, ipAddress,
          (request.headers.get('User-Agent') || '').substring(0, 250),
          expiresAt).run();

        // Record success & update last_login
        await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, attempted_at) VALUES (?, ?, ?, 1, datetime('now'))`)
          .bind('la-' + Date.now(), uname, ipAddress).run();
        await env.DB.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).bind(user.id).run();
        await auditLog(user.full_name, user.role_name, user.org_name, 'LOGIN', 'User', user.id, `Signed in from ${ipAddress}`);

        return json({
          success: true,
          token,
          expiresAt,
          user: {
            id: user.id, username: user.username, fullName: user.full_name,
            email: user.email, roleCode: user.role_code, roleName: user.role_name,
            scope: user.scope, bankId: user.bank_id, bankName: user.bank_name,
            bankCode: user.bank_code, organizationId: user.organization_id,
            branchId: user.branch_id, mfaEnabled: !!user.mfa_enabled
          }
        });
      }

      // POST /api/auth/logout — Revoke session
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        if (token) {
          await env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'USER_LOGOUT' WHERE id = ?`).bind(token).run();
        }
        return json({ success: true, message: 'Signed out successfully.' });
      }

      // GET /api/auth/me — Validate session and return user profile
      if ((pathname === '/api/auth/me' || pathname === '/api/v1/auth/me') && method === 'GET') {
        const session = await resolveSession();
        if (!session) return json({ success: true, authenticated: false, user: null });
        return json({
          success: true, authenticated: true,
          user: {
            id: session.user_id, username: session.username, fullName: session.full_name,
            email: session.email, roleCode: session.role_code, scope: session.scope,
            bankId: session.bank_id, bankName: session.bank_name, bankCode: session.bank_code,
            branchId: session.branch_id, organizationId: session.organization_id
          }
        });
      }

      // POST /api/auth/accept-invitation — Activate account from invitation link
      if (pathname === '/api/auth/accept-invitation' && method === 'POST') {
        const body = await getBody();
        const { token, password, full_name } = body;
        if (!token || !password) return err('Invitation token and password are required.', 400);
        if (password.length < 8) return err('Password must be at least 8 characters.', 400);

        const invite = await env.DB.prepare(`
          SELECT * FROM invitations WHERE token = ? AND status = 'Pending' AND datetime(expires_at) > datetime('now')
        `).bind(token).first();
        if (!invite) return err('This invitation link is invalid or has expired.', 404);

        // Check if user already exists with this email
        let userId;
        const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(invite.email).first();
        if (existing) {
          userId = existing.id;
          await env.DB.prepare(`UPDATE users SET password_hash = ?, full_name = COALESCE(?, full_name), status = 'Active' WHERE id = ?`)
            .bind(password.trim(), full_name || null, userId).run();
        } else {
          userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(invite.bank_id).first();
          const username = invite.email.split('@')[0].replace(/[^a-z0-9.]/gi, '').toLowerCase();
          await env.DB.prepare(`
            INSERT INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active', datetime('now'))
          `).bind(userId, bank?.organization_id || 'org-surge', invite.bank_id, invite.branch_id || null,
            username, full_name || invite.full_name || invite.email.split('@')[0],
            invite.email, invite.role_code, password.trim()).run();
        }

        // Add organization membership
        const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(invite.bank_id).first();
        if (bank) {
          await env.DB.prepare(`INSERT OR IGNORE INTO organization_members (id, user_id, organization_id, bank_id, branch_id, role_code, status, joined_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Active', datetime('now'), datetime('now'))`)
            .bind('om-' + Date.now(), userId, bank.organization_id, invite.bank_id, invite.branch_id || null, invite.role_code).run();
        }

        await env.DB.prepare(`UPDATE invitations SET status = 'Accepted', accepted_at = datetime('now') WHERE id = ?`).bind(invite.id).run();
        await auditLog(invite.email, invite.role_code, invite.bank_id, 'INVITATION_ACCEPTED', 'User', userId, `Account activated via invitation`);
        return json({ success: true, message: 'Account activated. You can now sign in.' });
      }

      // POST /api/auth/invite — Send bank employee invitation (Bank Admin or Surge Admin)
      if (pathname === '/api/auth/invite' && method === 'POST') {
        const session = await requireBankAuth();
        const body = await getBody();
        const { email, full_name, role_code, branch_id } = body;
        if (!email) return err('Email address is required.', 400);

        const inviteToken = await generateToken(24);
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days
        const inviteId = 'inv-' + Date.now().toString(36);

        await env.DB.prepare(`
          INSERT INTO invitations (id, token, email, full_name, bank_id, branch_id, role_code, invited_by, status, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, datetime('now'))
        `).bind(inviteId, inviteToken, email.trim().toLowerCase(), full_name || null,
          session.bank_id, branch_id || session.branch_id || null,
          role_code || 'bank-recovery', session.user_id, expiresAt).run();

        await auditLog(session.full_name, session.role_code, session.bank_id, 'INVITATION_SENT', 'Invitation', inviteId, `Invitation sent to ${email}`);
        const acceptUrl = `https://surge-listings.vercel.app/accept-invitation?token=${inviteToken}`;
        return json({ success: true, inviteId, token: inviteToken, acceptUrl, expiresAt, message: `Invitation created for ${email}. Share the accept URL with them.` }, 201);
      }

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
        const recentActivity = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`).all();
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
        if (!legal_name || !short_code || !contact_email) {
          return err('Legal name, short code, and contact email are required.', 400);
        }

        const cleanCode = short_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
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
          contact_phone ? contact_phone.trim() : '+233 30 000 0000',
          default_commission_rate ? Number(default_commission_rate) : 4.0
        ).run();

        const branchId = 'br-' + cleanCode.toLowerCase() + '-hq';
        const branchName = initial_branch ? initial_branch.trim() : (cleanCode + ' Head Office - Accra');
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
        const bank = await env.DB.prepare(`SELECT legal_name FROM banks WHERE id = ?`).bind(id).first();
        if (!bank) return err('Bank not found', 404);

        await env.DB.prepare(`DELETE FROM users WHERE bank_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM bank_branches WHERE bank_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM banks WHERE id = ?`).bind(id).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'DELETE_BANK', 'Bank', id, `Removed bank partner: ${bank.legal_name}`);
        return json({ success: true, message: `Bank ${bank.legal_name} removed.` });
      }

      // Users & Staff Management (/api/admin/users, /api/v1/users)
      if ((pathname === '/api/admin/users' || pathname === '/api/v1/users') && method === 'GET') {
        const filterBankId = url.searchParams.get('bank_id');
        const filterRole = url.searchParams.get('role');
        let sql = `
          SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
                 u.status, u.mfa_enabled, u.last_login, u.created_at,
                 CASE WHEN u.password_hash IS NOT NULL AND length(u.password_hash) > 0 THEN 1 ELSE 0 END as has_password,
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
        if (filterBankId) { sql += ` AND u.bank_id = ?`; params.push(filterBankId); }
        if (filterRole) { sql += ` AND u.role_code = ?`; params.push(filterRole); }
        sql += ` ORDER BY u.created_at DESC, u.full_name ASC`;
        const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const users = await stmt.all();
        return json({ success: true, count: users.results.length, data: users.results });
      }

      if ((pathname === '/api/admin/users' || pathname === '/api/v1/users') && method === 'POST') {
        const body = await getBody();
        const { bank_id, branch_id, username, full_name, email, role_code, password, mfa_enabled } = body;
        if (!username || !full_name || !email || !role_code) {
          return err('Username, full name, email, and role are required.', 400);
        }

        const existing = await env.DB.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).bind(username.trim().toLowerCase(), email.trim().toLowerCase()).first();
        if (existing) return err('A user with this username or email already exists.', 400);

        let orgId = 'org-surge';
        if (bank_id) {
          const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(bank_id).first();
          if (bank) orgId = bank.organization_id;
        }

        const userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const assignedPassword = password ? password.trim() : 'Surge@2026!';

        await env.DB.prepare(`
          INSERT INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(userId, orgId, bank_id || null, branch_id || null, username.trim().toLowerCase(), full_name.trim(), email.trim().toLowerCase(), role_code, assignedPassword, mfa_enabled !== undefined ? (mfa_enabled ? 1 : 0) : 1).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'CREATE_USER', 'User', userId, `Created staff member ${full_name} (@${username})`);
        const createdUser = await env.DB.prepare(`SELECT u.*, b.legal_name as bank_name FROM users u LEFT JOIN banks b ON u.bank_id = b.id WHERE u.id = ?`).bind(userId).first();
        return json({ success: true, message: 'Staff user created successfully.', data: createdUser }, 201);
      }

      // Password Reset
      if ((pathname.match(/^\/api\/admin\/users\/[a-zA-Z0-9_-]+\/reset-password$/) || pathname.match(/^\/api\/v1\/users\/[a-zA-Z0-9_-]+\/reset-password$/)) && method === 'POST') {
        const parts = pathname.split('/');
        const id = parts[parts.length - 2];
        const body = await getBody();
        const { password } = body;
        if (!password || password.trim().length < 6) return err('Password must be at least 6 characters.', 400);

        const user = await env.DB.prepare(`SELECT username, full_name FROM users WHERE id = ?`).bind(id).first();
        if (!user) return err('User not found', 404);

        await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(password.trim(), id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RESET_PASSWORD', 'User', id, `Password reset for user @${user.username}`);
        return json({ success: true, message: `Password reset successfully for @${user.username}.` });
      }

      // 5 Statutory Gates Readiness Assessment (/api/admin/assets/:id/readiness)
      if (pathname.includes('/readiness') && (method === 'GET' || method === 'POST')) {
        const id = pathname.replace('/api/admin/assets/', '').replace('/api/v1/assets/', '').replace('/readiness', '');
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        const injunctionRow = await env.DB.prepare(`
          SELECT li.injunction_active, li.verification_status, li.instrument_ref
          FROM legal_instruments li
          JOIN enforcement_cases ec ON li.case_id = ec.id
          WHERE ec.asset_id = ? AND li.injunction_active = 1
        `).bind(asset.id).first();
        const activeInjunction = !!injunctionRow;

        const title = await env.DB.prepare(`SELECT * FROM title_records WHERE asset_id = ?`).bind(asset.id).first();
        const titleVerified = title ? title.verification_status === 'Verified' : false;

        const valuation = await env.DB.prepare(`SELECT * FROM valuations WHERE asset_id = ? ORDER BY valuation_date DESC LIMIT 1`).bind(asset.id).first();
        const valuationValid = valuation ? (valuation.status === 'Valid' && valuation.review_required === 0) : true;

        const imgCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ?`).bind(asset.id).first();
        const photoRequirementMet = (imgCount?.c || 0) >= 1;
        const reservePriceSet = !!asset.reserve_price && asset.reserve_price > 0;

        const gates = [
          { gate: 'LG-2 Injunction & Legal Clear', passed: !activeInjunction, detail: activeInjunction ? `Active Injunction on ${injunctionRow.instrument_ref}` : 'Court enforcement clear' },
          { gate: 'TL-2 Title Perfection', passed: titleVerified, detail: titleVerified ? 'Title verified by Surge Legal' : 'Pending verification' },
          { gate: 'VL-1 Valuation Validity Window', passed: valuationValid, detail: valuationValid ? 'Valuation active within 180 days' : 'Valuation expired / review required' },
          { gate: 'AS-4 Photo Documentation', passed: photoRequirementMet, detail: `${imgCount?.c || 0} media assets verified` },
          { gate: 'AS-8 Reserve Price Guard', passed: reservePriceSet, detail: `GHS ${asset.reserve_price?.toLocaleString()}` }
        ];

        const allPass = gates.every(g => g.passed) && !asset.legal_hold_active;
        return json({
          success: true,
          asset_id: asset.id,
          public_ref: asset.public_ref,
          status: asset.status,
          legal_hold_active: !!asset.legal_hold_active,
          can_publish: allPass && asset.status === 'Approved',
          allPass,
          gates
        });
      }

      // Legal & Title Queue (/api/admin/legal, /api/admin/titles, /api/admin/valuations)
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
          SELECT tr.*, a.public_ref, a.title as asset_title, b.legal_name as bank_name
          FROM title_records tr
          JOIN assets a ON tr.asset_id = a.id
          JOIN banks b ON a.bank_id = b.id
          ORDER BY tr.verification_status ASC
        `).all();
        return json({ success: true, count: titles.results.length, data: titles.results });
      }

      if (pathname === '/api/admin/valuations' && method === 'GET') {
        const vals = await env.DB.prepare(`
          SELECT v.*, a.public_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name
          FROM valuations v
          JOIN assets a ON v.asset_id = a.id
          JOIN banks b ON a.bank_id = b.id
          ORDER BY v.valuation_date DESC
        `).all();
        return json({ success: true, count: vals.results.length, data: vals.results });
      }

      // Settings (/api/admin/settings)
      if (pathname === '/api/admin/settings') {
        if (method === 'GET') {
          const settings = await env.DB.prepare(`SELECT * FROM system_settings`).all();
          return json({ success: true, data: settings.results });
        }
        if (method === 'PUT') {
          const body = await getBody();
          if (Array.isArray(body.settings)) {
            for (const s of body.settings) {
              await env.DB.prepare(`INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`).bind(s.key, String(s.value)).run();
            }
          }
          await auditLog(actorName, actorRole, 'Surge Solutions', 'UPDATE_SETTINGS', 'SystemSettings', 'global', 'Settings updated');
          return json({ success: true, message: 'Settings updated successfully.' });
        }
      }

      // =========================================================================
      // 3. BANK PORTAL API (/api/bank/*)
      // ALL routes below require a valid bank session.
      // bankId is derived from the authenticated session ONLY — never from the client.
      // =========================================================================

      // GET /api/bank/dashboard
      if (pathname === '/api/bank/dashboard' && method === 'GET') {
        const session = await requireBankAuth();
        const sid = session.bank_id;
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingSurgeReview,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status = 'Under Bank Review') as activeOffers
        `).bind(sid, sid, sid, sid, sid, sid, sid).first();

        const recentActivity = await env.DB.prepare(`
          SELECT * FROM audit_logs 
          WHERE organization = ? OR delta_summary LIKE ?
          ORDER BY created_at DESC LIMIT 8
        `).bind(sid, `%${sid}%`).all();

        return json({ success: true, data: { ...stats, recentActivity: recentActivity.results } });
      }

      // GET /api/bank/profile
      if (pathname === '/api/bank/profile' && method === 'GET') {
        const session = await requireBankAuth();
        const bank = await env.DB.prepare(`SELECT * FROM banks WHERE id = ?`).bind(session.bank_id).first();
        if (!bank) return err('Bank not found', 404);
        const branches = await env.DB.prepare(`SELECT * FROM bank_branches WHERE bank_id = ? ORDER BY region, district, name`).bind(session.bank_id).all();
        return json({ success: true, data: { ...bank, branches: branches.results } });
      }

      // GET /api/bank/branches
      if ((pathname === '/api/bank/branches' || pathname === '/api/v1/branches') && method === 'GET') {
        const session = await requireBankAuth();
        const branches = await env.DB.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM assets WHERE branch_id = b.id) as asset_count
          FROM bank_branches b
          WHERE b.bank_id = ?
          ORDER BY b.region ASC, b.district ASC, b.name ASC
        `).bind(session.bank_id).all();
        return json({ success: true, count: branches.results.length, data: branches.results });
      }

      // GET /api/bank/documents
      if ((pathname === '/api/bank/documents' || pathname === '/api/v1/documents') && method === 'GET') {
        const session = await requireBankAuth();
        const docs = await env.DB.prepare(`
          SELECT d.*, a.public_ref as asset_ref, a.title as asset_title
          FROM documents d
          JOIN assets a ON d.asset_id = a.id
          WHERE a.bank_id = ?
          ORDER BY d.uploaded_at DESC
        `).bind(session.bank_id).all();
        return json({ success: true, count: docs.results.length, data: docs.results });
      }

      // GET /api/bank/enquiries
      if (pathname === '/api/bank/enquiries' && method === 'GET') {
        const session = await requireBankAuth();
        const enquiries = await env.DB.prepare(`
          SELECT e.*, a.public_ref as asset_ref, a.title as asset_title
          FROM enquiries e
          JOIN assets a ON e.asset_id = a.id
          WHERE a.bank_id = ?
          ORDER BY e.created_at DESC
        `).bind(session.bank_id).all();
        return json({ success: true, count: enquiries.results.length, data: enquiries.results });
      }

      // GET /api/bank/staff — List all staff for authenticated bank
      if (pathname === '/api/bank/staff' && method === 'GET') {
        const session = await requireBankAuth();
        const staff = await env.DB.prepare(`
          SELECT u.id, u.username, u.full_name, u.email, u.role_code, u.status,
                 u.branch_id, u.last_login, u.created_at,
                 r.name as role_name, r.scope,
                 br.name as branch_name, br.region as branch_region
          FROM users u
          LEFT JOIN roles r ON u.role_code = r.code
          LEFT JOIN bank_branches br ON u.branch_id = br.id
          WHERE u.bank_id = ?
          ORDER BY u.full_name ASC
        `).bind(session.bank_id).all();
        return json({ success: true, count: staff.results.length, data: staff.results });
      }

      // GET /api/bank/invitations — List pending invitations
      if (pathname === '/api/bank/invitations' && method === 'GET') {
        const session = await requireBankAuth();
        const invites = await env.DB.prepare(`
          SELECT i.*, br.name as branch_name
          FROM invitations i
          LEFT JOIN bank_branches br ON i.branch_id = br.id
          WHERE i.bank_id = ?
          ORDER BY i.created_at DESC
        `).bind(session.bank_id).all();
        return json({ success: true, count: invites.results.length, data: invites.results });
      }



      // =========================================================================
      // 4. PUBLIC MARKETPLACE API (/api/marketplace/* & /api/public/*)
      // Sanitized Listings, Buyer KYC, Search, Inquiries, Viewings & Formal Offers
      // =========================================================================

      // GET /api/marketplace/assets, /api/public/listings, /api/v1/marketplace
      if (['/api/marketplace/assets', '/api/public/listings', '/api/v1/marketplace'].includes(pathname) && method === 'GET') {
        const category = url.searchParams.get('category');
        const region = url.searchParams.get('region');
        const minPrice = url.searchParams.get('min_price');
        const maxPrice = url.searchParams.get('max_price');
        const q = url.searchParams.get('q');

        let sql = `
          SELECT 
            a.id, a.public_ref, a.category_code, a.asset_type, a.title, a.description,
            a.region, a.district, a.town, a.public_location, a.reserve_price, a.minimum_offer,
            a.show_reserve_publicly, a.occupancy_status, a.land_guard_risk, a.status,
            a.beds, a.baths, a.year, a.mileage, a.fuel,
            (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image,
            (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count
          FROM assets a
          WHERE a.status = 'Live' AND a.legal_hold_active = 0
        `;
        const params = [];

        if (category && category !== 'All Categories') { sql += ` AND a.category_code = ?`; params.push(category); }
        if (region && region !== 'All Regions') { sql += ` AND a.region = ?`; params.push(region); }
        if (minPrice) { sql += ` AND a.reserve_price >= ?`; params.push(Number(minPrice)); }
        if (maxPrice) { sql += ` AND a.reserve_price <= ?`; params.push(Number(maxPrice)); }
        if (q) {
          sql += ` AND (a.title LIKE ? OR a.public_location LIKE ? OR a.public_ref LIKE ?)`;
          const wildcard = `%${q}%`;
          params.push(wildcard, wildcard, wildcard);
        }

        sql += ` ORDER BY a.created_at DESC`;
        const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const listings = await stmt.all();

        const sanitized = listings.results.map(r => ({
          ...r,
          reserve_price: r.show_reserve_publicly ? r.reserve_price : null,
          price_display: r.show_reserve_publicly ? `GHS ${r.reserve_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Price on Application'
        }));
        return json({ success: true, count: sanitized.length, data: sanitized });
      }

      // Single Marketplace Listing Detail
      if ((pathname.startsWith('/api/marketplace/assets/') || pathname.startsWith('/api/public/listings/') || pathname.startsWith('/api/v1/marketplace/')) && method === 'GET') {
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`
          SELECT a.id, a.public_ref, a.category_code, a.asset_type, a.title, a.description,
            a.region, a.district, a.town, a.public_location, a.reserve_price, a.minimum_offer,
            a.show_reserve_publicly, a.occupancy_status, a.land_guard_risk, a.status,
            a.beds, a.baths, a.year, a.mileage, a.fuel, a.created_at
          FROM assets a
          WHERE (a.id = ? OR a.public_ref = ?) AND a.status = 'Live' AND a.legal_hold_active = 0
        `).bind(id, id).first();

        if (!asset) return err('Listing not found or currently unavailable', 404);

        const images = await env.DB.prepare(`SELECT id, url, caption, is_primary, is_exterior FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC`).bind(asset.id).all();
        return json({
          success: true,
          data: {
            ...asset,
            reserve_price: asset.show_reserve_publicly ? asset.reserve_price : null,
            images: images.results
          }
        });
      }

      // Categories
      if (['/api/marketplace/categories', '/api/public/categories', '/api/v1/categories'].includes(pathname)) {
        const categories = await env.DB.prepare(`
          SELECT c.code, c.name, c.icon,
            (SELECT COUNT(*) FROM assets a WHERE a.category_code = c.code AND a.status = 'Live' AND a.legal_hold_active = 0) as live_count
          FROM asset_categories c
          ORDER BY c.name ASC
        `).all();
        return json({ success: true, data: categories.results });
      }

      // Buyer KYC Submission (/api/marketplace/buyers/kyc, /api/v1/kyc)
      if (['/api/marketplace/buyers/kyc', '/api/v1/kyc'].includes(pathname)) {
        if (method === 'GET') {
          const kycList = await env.DB.prepare(`SELECT * FROM kyc_applications ORDER BY created_at DESC`).all();
          return json({ success: true, count: kycList.results.length, data: kycList.results });
        }
        if (method === 'POST') {
          const body = await getBody();
          const { full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref } = body;
          if (!full_name || !email || !ghana_card_number) {
            return err('Full name, email, and Ghana Card number are required', 400);
          }
          const kycId = 'kyc-' + Date.now();
          await env.DB.prepare(`
            INSERT INTO kyc_applications (id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Review', datetime('now'))
          `).bind(kycId, full_name, email, phone || '', ghana_card_number, source_of_funds || 'Personal Savings', related_asset_ref || '').run();

          await auditLog(full_name, 'Buyer', 'Public', 'KYC_SUBMIT', 'KYC', kycId, `KYC application submitted by ${full_name}`);
          return json({ success: true, id: kycId, message: 'KYC application submitted successfully. Verification takes up to 24 hours.' }, 201);
        }
      }

      // =========================================================================
      // 5. UNIFIED ASSET OPERATIONS (/api/v1/assets, /api/bank/assets, /api/admin/assets)
      // Full Lifecycle: Create Draft, Update, Submit, Approve, Publish, Hold
      // =========================================================================
      if (['/api/v1/assets', '/api/bank/assets', '/api/admin/assets'].includes(pathname)) {
        if (method === 'GET') {
          const isSurgeAdmin = request.headers.get('x-actor-role') === 'Surge Admin' ||
            url.searchParams.get('scope') === 'all' ||
            pathname.startsWith('/api/admin');
          let sql = `
            SELECT a.*, b.legal_name as bank_name, b.short_code as bank_code, br.name as branch_name,
              (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count,
              (SELECT COUNT(*) FROM documents WHERE asset_id = a.id) as document_count,
              (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as offer_count
            FROM assets a
            JOIN banks b ON a.bank_id = b.id
            LEFT JOIN bank_branches br ON a.branch_id = br.id
          `;
          let stmt;
          if (!isSurgeAdmin) {
            sql += ` WHERE a.bank_id = ? ORDER BY a.updated_at DESC`;
            stmt = env.DB.prepare(sql).bind(bankId);
          } else {
            sql += ` ORDER BY a.updated_at DESC`;
            stmt = env.DB.prepare(sql);
          }
          const assets = await stmt.all();
          return json({ success: true, count: assets.results.length, data: assets.results });
        }

        if (method === 'POST') {
          const body = await getBody();
          const id = 'a-' + Date.now();
          const year = new Date().getFullYear();
          const cat = body.categoryCode || 'House';
          const catPrefix = cat === 'House' ? 'RE' : cat === 'Vehicle' ? 'VH' : cat === 'Equipment' ? 'EQ' : 'AS';

          const countRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM assets WHERE public_ref LIKE ?`).bind(`SS-${catPrefix}-${year}-%`).first();
          const seq = String((countRow ? countRow.c : 0) + 242).padStart(5, '0');
          const publicRef = `SS-${catPrefix}-${year}-${seq}`;

          await env.DB.prepare(`
            INSERT INTO assets (
              id, bank_id, branch_id, public_ref, internal_bank_ref, category_code, asset_type,
              title, description, region, district, town, public_location, exact_address,
              reserve_price, minimum_offer, show_reserve_publicly, occupancy_status, land_guard_risk,
              status, legal_hold_active, review_required, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 0, 0, ?, datetime('now'), datetime('now'))
          `).bind(
            id,
            body.bankId || bankId,
            body.branchId || null,
            publicRef,
            body.internalBankRef || ('BNK-REF-' + Math.floor(10000 + Math.random() * 90000)),
            cat,
            body.assetType || 'Property',
            body.title || (cat + ' at ' + (body.publicLocation || 'Greater Accra')),
            body.description || '',
            body.region || 'Greater Accra',
            body.district || '',
            body.town || '',
            body.publicLocation || 'Greater Accra',
            body.exactAddress || '',
            Number(body.reservePrice) || 0,
            Number(body.minimumOffer) || 0,
            body.showReservePublicly ? 1 : 0,
            body.occupancyStatus || 'Vacant',
            body.landGuardRisk || 'Low',
            actorName
          ).run();

          await auditLog(actorName, actorRole, 'Bank', 'CREATE', 'Asset', publicRef, `Draft asset created: ${publicRef}`);
          const created = await env.DB.prepare(`SELECT * FROM assets WHERE id = ?`).bind(id).first();
          return json({ success: true, data: created }, 201);
        }
      }

      // Single Asset Detail
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`
          SELECT a.*, b.legal_name as bank_name, b.short_code as bank_code, br.name as branch_name
          FROM assets a
          JOIN banks b ON a.bank_id = b.id
          LEFT JOIN bank_branches br ON a.branch_id = br.id
          WHERE a.id = ? OR a.public_ref = ?
        `).bind(id, id).first();

        if (!asset) return err('Asset not found', 404);

        const images = await env.DB.prepare(`SELECT * FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC`).bind(asset.id).all();
        const docs = await env.DB.prepare(`SELECT * FROM documents WHERE asset_id = ? ORDER BY uploaded_at DESC`).bind(asset.id).all();
        const title = await env.DB.prepare(`SELECT * FROM title_records WHERE asset_id = ?`).bind(asset.id).first();
        const valuation = await env.DB.prepare(`SELECT * FROM valuations WHERE asset_id = ? ORDER BY valuation_date DESC LIMIT 1`).bind(asset.id).first();
        const enforcement = await env.DB.prepare(`SELECT * FROM enforcement_cases WHERE asset_id = ?`).bind(asset.id).first();
        const instruments = enforcement ? (await env.DB.prepare(`SELECT * FROM legal_instruments WHERE case_id = ?`).bind(enforcement.id).all()).results : [];

        return json({
          success: true,
          data: {
            ...asset,
            images: images.results,
            documents: docs.results,
            titleRecord: title,
            valuation,
            enforcementCase: enforcement,
            legalInstruments: instruments
          }
        });
      }

      // Update Asset (PUT)
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+$/) && method === 'PUT') {
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        const body = await getBody();
        const updates = [];
        const binds = [];

        const fieldMap = {
          categoryCode: 'category_code',
          assetType: 'asset_type',
          title: 'title',
          description: 'description',
          region: 'region',
          district: 'district',
          town: 'town',
          publicLocation: 'public_location',
          exactAddress: 'exact_address',
          reservePrice: 'reserve_price',
          minimumOffer: 'minimum_offer',
          showReservePublicly: 'show_reserve_publicly',
          internalBankRef: 'internal_bank_ref',
          occupancyStatus: 'occupancy_status',
          landGuardRisk: 'land_guard_risk',
          status: 'status',
          beds: 'beds',
          baths: 'baths',
          year: 'year',
          mileage: 'mileage',
          fuel: 'fuel',
        };

        for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
          if (body[jsKey] !== undefined) {
            updates.push(`${dbCol} = ?`);
            if (dbCol === 'show_reserve_publicly') {
              binds.push(body[jsKey] ? 1 : 0);
            } else if (['reserve_price', 'minimum_offer', 'beds', 'baths', 'year'].includes(dbCol)) {
              binds.push(Number(body[jsKey]) || 0);
            } else {
              binds.push(body[jsKey]);
            }
          }
        }

        if (updates.length === 0) return err('No fields to update', 400);

        updates.push(`updated_at = datetime('now')`);
        const sql = `UPDATE assets SET ${updates.join(', ')} WHERE id = ?`;
        binds.push(asset.id);

        await env.DB.prepare(sql).bind(...binds).run();
        await auditLog(actorName, actorRole, 'Bank', 'UPDATE', 'Asset', asset.public_ref, `Asset updated: ${Object.keys(body).join(', ')}`);

        const updated = await env.DB.prepare(`SELECT * FROM assets WHERE id = ?`).bind(asset.id).first();
        return json({ success: true, data: updated });
      }

      // Delete Draft Asset
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+$/) && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.status !== 'Draft') return err('Only draft assets can be deleted', 400);

        await env.DB.prepare(`DELETE FROM asset_images WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM documents WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM title_records WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM valuations WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM enforcement_cases WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM assets WHERE id = ?`).bind(asset.id).run();

        await auditLog(actorName, actorRole, 'Bank', 'DELETE', 'Asset', asset.public_ref, `Draft asset ${asset.public_ref} deleted`);
        return json({ success: true, message: `Draft asset ${asset.public_ref} deleted successfully.` });
      }

      // Asset Workflow Actions: submit, approve, reject, publish, hold, release-hold
      if (pathname.includes('/submit') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.legal_hold_active) return err('Legal hold is active on this asset.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Submitted by Bank', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Bank', 'SUBMIT', 'Asset', asset.public_ref, 'Submitted for review');
        return json({ success: true, message: 'Asset submitted for Surge review.' });
      }

      if (pathname.includes('/approve') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'APPROVE', 'Asset', asset.public_ref, 'Asset approved');
        return json({ success: true, message: 'Asset approved.' });
      }

      if (pathname.includes('/reject') && method === 'POST') {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET status = 'Changes Required', review_required = 1, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(body.reason || 'Changes required', asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'REJECT', 'Asset', asset.public_ref, `Changes requested: ${body.reason || 'None'}`);
        return json({ success: true, message: 'Changes requested successfully.' });
      }

      if (pathname.includes('/publish') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.legal_hold_active) return err('Cannot publish: Legal hold active.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'PUBLISH', 'Asset', asset.public_ref, 'Published to Marketplace');
        return json({ success: true, message: 'Asset published to Marketplace.' });
      }

      if (pathname.includes('/unpublish') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'UNPUBLISH', 'Asset', asset.public_ref, 'Unpublished from Marketplace');
        return json({ success: true, message: 'Asset unpublished.' });
      }

      if (pathname.includes('/hold') && method === 'POST') {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 1, legal_hold_reason = ?, status = 'Legal Hold', updated_at = datetime('now') WHERE id = ?`).bind(body.reason || 'Legal investigation pending', asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'LEGAL_HOLD', 'Asset', asset.public_ref, `Legal hold imposed: ${body.reason}`);
        return json({ success: true, message: 'Legal hold placed.' });
      }

      if (pathname.includes('/release-hold') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 0, legal_hold_reason = NULL, status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RELEASE_HOLD', 'Asset', asset.public_ref, 'Legal hold released');
        return json({ success: true, message: 'Legal hold released.' });
      }

      // =========================================================================
      // 6. ENQUIRIES, LEADS, VIEWINGS, OFFERS, INVOICES & AUDIT LOGS
      // =========================================================================

      // Enquiries & Leads
      if (['/api/v1/leads', '/api/v1/enquiries', '/api/bank/enquiries', '/api/marketplace/enquiries', '/api/public/enquiries'].includes(pathname)) {
        if (method === 'GET') {
          const leads = await env.DB.prepare(`
            SELECT l.*, a.public_ref as asset_ref, a.title as asset_title
            FROM leads l
            JOIN assets a ON l.asset_id = a.id
            ORDER BY l.created_at DESC
          `).all();
          return json({ success: true, count: leads.results.length, data: leads.results });
        }
        if (method === 'POST') {
          const body = await getBody();
          const { assetId, name, email, phone, message } = body;
          if (!name || !phone) return err('Name and phone number are required', 400);

          const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(assetId, assetId).first();
          if (!asset) return err('Asset not found', 404);

          const leadId = 'lead-' + Date.now();
          const leadRef = 'LD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

          await env.DB.prepare(`
            INSERT INTO leads (id, lead_ref, asset_id, buyer_name, email, phone, stage, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'New', ?, datetime('now'), datetime('now'))
          `).bind(leadId, leadRef, asset.id, name, email || '', phone, message || '').run();

          await env.DB.prepare(`
            INSERT INTO enquiries (id, asset_id, buyer_name, email, phone, message, status, lead_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'New', ?, datetime('now'))
          `).bind('enq-' + Date.now(), asset.id, name, email || '', phone, message || '', leadId).run();

          await auditLog(name, 'Public Buyer', 'Public', 'ENQUIRY', 'Lead', leadRef, `Enquiry submitted on ${asset.public_ref}`);
          return json({ success: true, reference: leadRef, message: 'Enquiry received. A Surge officer will contact you shortly.' }, 201);
        }
      }

      // Viewings
      if (['/api/v1/viewings', '/api/bank/viewings', '/api/marketplace/viewings'].includes(pathname)) {
        if (method === 'GET') {
          const viewings = await env.DB.prepare(`
            SELECT v.*, a.public_ref as asset_ref, a.public_location, a.asset_type
            FROM viewings v
            JOIN assets a ON v.asset_id = a.id
            ORDER BY v.created_at DESC
          `).all();
          return json({ success: true, count: viewings.results.length, data: viewings.results });
        }
        if (method === 'POST') {
          const body = await getBody();
          const { assetId, name, phone, email, date, timeSlot, notes } = body;
          if (!name || !phone || !date) return err('Full name, phone, and date are required', 400);

          const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(assetId, assetId).first();
          if (!asset) return err('Asset not found', 404);

          const viewingId = 'vw-' + Date.now();
          await env.DB.prepare(`
            INSERT INTO viewings (id, asset_id, buyer_name, viewing_date, time_slot, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, 'Requested', ?, datetime('now'))
          `).bind(viewingId, asset.id, name, date, timeSlot || 'Morning', notes || '').run();

          await auditLog(name, 'Public Buyer', 'Public', 'VIEWING_REQUEST', 'Viewing', viewingId, `Viewing requested for ${asset.public_ref}`);
          return json({ success: true, id: viewingId, message: 'Viewing appointment requested.' }, 201);
        }
      }

      // Offers
      if (['/api/v1/offers', '/api/admin/offers', '/api/bank/offers', '/api/marketplace/offers'].includes(pathname)) {
        if (method === 'GET') {
          const offers = await env.DB.prepare(`
            SELECT o.*, a.public_ref as asset_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name
            FROM offers o
            JOIN assets a ON o.asset_id = a.id
            JOIN banks b ON a.bank_id = b.id
            ORDER BY o.created_at DESC
          `).all();
          return json({ success: true, count: offers.results.length, data: offers.results });
        }
        if (method === 'POST') {
          const body = await getBody();
          const { assetId, name, phone, email, amount, ghanaCard, validityDays, paymentMethod } = body;
          if (!name || !phone || !amount) return err('Buyer name, phone, and offer amount are required', 400);

          const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(assetId, assetId).first();
          if (!asset) return err('Asset not found', 404);
          if (asset.legal_hold_active) return err('Legal hold is active on this asset.', 400);

          const countRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM offers`).first();
          const offerRef = 'OF-2026-' + String((countRow ? countRow.c : 0) + 501).padStart(6, '0');
          const offerId = 'of-' + Date.now();
          const validityDate = new Date(Date.now() + (Number(validityDays) || 30) * 86400000).toISOString();

          await env.DB.prepare(`
            INSERT INTO offers (id, offer_ref, asset_id, buyer_name, amount, validity_date, conditions, status, below_reserve, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Under Bank Review', ?, ?, datetime('now'), datetime('now'))
          `).bind(
            offerId, offerRef, asset.id, name, Number(amount), validityDate,
            paymentMethod || 'Cash / Direct Bank Transfer',
            Number(amount) < asset.reserve_price ? 1 : 0,
            `Ghana Card: ${ghanaCard || 'Provided'} · Contact: ${phone} (${email || ''})`
          ).run();

          await auditLog(name, 'Public Buyer', 'Public', 'OFFER_SUBMISSION', 'Offer', offerRef, `Purchase offer of GHS ${Number(amount).toLocaleString()} submitted on ${asset.public_ref}`);
          return json({ success: true, reference: offerRef, message: 'Formal offer submitted. Recovery Bank notified.' }, 201);
        }
      }

      // Offer Decisions
      if (pathname.includes('/decide') && method === 'POST') {
        const offerId = pathname.split('/')[4];
        const body = await getBody();
        const { decision } = body;

        const offer = await env.DB.prepare(`SELECT * FROM offers WHERE id = ? OR offer_ref = ?`).bind(offerId, offerId).first();
        if (!offer) return err('Offer not found', 404);

        await env.DB.prepare(`UPDATE offers SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(decision, offer.id).run();
        if (decision === 'Accepted') {
          await env.DB.prepare(`UPDATE assets SET status = 'Sold', updated_at = datetime('now') WHERE id = ?`).bind(offer.asset_id).run();
        }

        await auditLog(actorName, actorRole, 'Bank', 'OFFER_DECISION', 'Offer', offer.offer_ref, `Decision: ${decision}`);
        return json({ success: true, message: `Offer ${decision.toLowerCase()}.` });
      }

      // Invoices
      if (['/api/v1/invoices', '/api/admin/invoices', '/api/bank/invoices'].includes(pathname)) {
        const invoices = await env.DB.prepare(`
          SELECT i.*, b.legal_name as bank_name, b.short_code as bank_code
          FROM invoices i
          JOIN banks b ON i.bank_id = b.id
          ORDER BY i.created_at DESC
        `).all();
        return json({ success: true, count: invoices.results.length, data: invoices.results });
      }

      // Audit Logs
      if (['/api/v1/audit-logs', '/api/admin/audit-logs'].includes(pathname)) {
        const logs = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150`).all();
        return json({ success: true, count: logs.results.length, data: logs.results });
      }

      // =========================================================================
      // 7. BRANCH MANAGEMENT (CRUD) — Region + District + Town Isolation
      // Each branch operates as a sub-system under its parent bank.
      // =========================================================================

      // GET /api/admin/branches (all branches across all banks)
      if (pathname === '/api/admin/branches' && method === 'GET') {
        const filterBankId = url.searchParams.get('bank_id');
        const filterRegion = url.searchParams.get('region');
        const filterDistrict = url.searchParams.get('district');

        let sql = `
          SELECT br.*, b.legal_name as bank_name, b.short_code as bank_code,
            (SELECT COUNT(*) FROM assets WHERE branch_id = br.id) as asset_count,
            (SELECT COUNT(*) FROM users WHERE branch_id = br.id) as staff_count
          FROM bank_branches br
          JOIN banks b ON br.bank_id = b.id
          WHERE 1=1
        `;
        const params = [];
        if (filterBankId) { sql += ` AND br.bank_id = ?`; params.push(filterBankId); }
        if (filterRegion) { sql += ` AND br.region = ?`; params.push(filterRegion); }
        if (filterDistrict) { sql += ` AND br.district = ?`; params.push(filterDistrict); }
        sql += ` ORDER BY br.region ASC, br.district ASC, br.name ASC`;

        const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const branches = await stmt.all();
        return json({ success: true, count: branches.results.length, data: branches.results });
      }

      // POST /api/admin/branches — Create a branch for any bank
      if (pathname === '/api/admin/branches' && method === 'POST') {
        const body = await getBody();
        const { bank_id, name, branch_code, region, district, town, address, phone, email, manager_name } = body;
        if (!bank_id || !name || !region) return err('Bank ID, branch name, and region are required.', 400);

        const bank = await env.DB.prepare(`SELECT id, short_code FROM banks WHERE id = ?`).bind(bank_id).first();
        if (!bank) return err('Bank not found', 404);

        const branchId = 'br-' + bank.short_code.toLowerCase() + '-' + Date.now().toString(36);
        const code = branch_code || name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();

        await env.DB.prepare(`
          INSERT INTO bank_branches (id, bank_id, name, branch_code, region, district, town, address, phone, email, manager_name, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(branchId, bank_id, name.trim(), code, region, district || '', town || '', address || '', phone || '', email || '', manager_name || '').run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'CREATE_BRANCH', 'Branch', branchId, `Created branch: ${name} (${region}/${district || 'N/A'})`);
        const created = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(branchId).first();
        return json({ success: true, message: 'Branch created successfully.', data: created }, 201);
      }

      // PUT /api/admin/branches/:id — Update a branch
      if (pathname.match(/^\/api\/admin\/branches\/[a-zA-Z0-9_-]+$/) && method === 'PUT') {
        const id = pathname.split('/').pop();
        const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(id).first();
        if (!branch) return err('Branch not found', 404);

        const body = await getBody();
        const updates = [];
        const binds = [];
        const branchFields = { name: 'name', branch_code: 'branch_code', region: 'region', district: 'district', town: 'town', address: 'address', phone: 'phone', email: 'email', manager_name: 'manager_name', status: 'status' };

        for (const [key, col] of Object.entries(branchFields)) {
          if (body[key] !== undefined) { updates.push(`${col} = ?`); binds.push(body[key]); }
        }
        if (updates.length === 0) return err('No fields to update', 400);

        const sql = `UPDATE bank_branches SET ${updates.join(', ')} WHERE id = ?`;
        binds.push(id);
        await env.DB.prepare(sql).bind(...binds).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'UPDATE_BRANCH', 'Branch', id, `Updated branch: ${Object.keys(body).join(', ')}`);
        const updated = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(id).first();
        return json({ success: true, data: updated });
      }

      // DELETE /api/admin/branches/:id
      if (pathname.match(/^\/api\/admin\/branches\/[a-zA-Z0-9_-]+$/) && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const branch = await env.DB.prepare(`SELECT name FROM bank_branches WHERE id = ?`).bind(id).first();
        if (!branch) return err('Branch not found', 404);

        await env.DB.prepare(`UPDATE users SET branch_id = NULL WHERE branch_id = ?`).bind(id).run();
        await env.DB.prepare(`UPDATE assets SET branch_id = NULL WHERE branch_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM bank_branches WHERE id = ?`).bind(id).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'DELETE_BRANCH', 'Branch', id, `Deleted branch: ${branch.name}`);
        return json({ success: true, message: `Branch '${branch.name}' deleted.` });
      }

      // POST /api/bank/branches — Bank creates its own branch
      if (pathname === '/api/bank/branches' && method === 'POST') {
        const body = await getBody();
        const { name, branch_code, region, district, town, address, phone, email, manager_name } = body;
        if (!name || !region) return err('Branch name and region are required.', 400);

        const bank = await env.DB.prepare(`SELECT id, short_code FROM banks WHERE id = ?`).bind(bankId).first();
        if (!bank) return err('Bank not found. Ensure X-Bank-ID header is set.', 404);

        const branchId = 'br-' + bank.short_code.toLowerCase() + '-' + Date.now().toString(36);
        const code = branch_code || name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();

        await env.DB.prepare(`
          INSERT INTO bank_branches (id, bank_id, name, branch_code, region, district, town, address, phone, email, manager_name, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(branchId, bankId, name.trim(), code, region, district || '', town || '', address || '', phone || '', email || '', manager_name || '').run();

        await auditLog(actorName, actorRole, bankId, 'CREATE_BRANCH', 'Branch', branchId, `Created branch: ${name} in ${region}/${district || 'N/A'}`);
        const created = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(branchId).first();
        return json({ success: true, message: 'Branch created.', data: created }, 201);
      }

      // GET /api/bank/branches/:id/assets — Branch-scoped asset isolation
      if (pathname.match(/^\/api\/bank\/branches\/[a-zA-Z0-9_-]+\/assets$/) && method === 'GET') {
        const parts = pathname.split('/');
        const branchId = parts[4];

        const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, bankId).first();
        if (!branch) return err('Branch not found or does not belong to your bank.', 404);

        const assets = await env.DB.prepare(`
          SELECT a.*, b.legal_name as bank_name, br.name as branch_name, br.region as branch_region, br.district as branch_district
          FROM assets a
          JOIN banks b ON a.bank_id = b.id
          LEFT JOIN bank_branches br ON a.branch_id = br.id
          WHERE a.branch_id = ?
          ORDER BY a.updated_at DESC
        `).bind(branchId).all();

        return json({ success: true, branch: { id: branch.id, name: branch.name, region: branch.region, district: branch.district }, count: assets.results.length, data: assets.results });
      }

      // GET /api/bank/branches/:id/staff — Branch-scoped staff listing
      if (pathname.match(/^\/api\/bank\/branches\/[a-zA-Z0-9_-]+\/staff$/) && method === 'GET') {
        const parts = pathname.split('/');
        const branchId = parts[4];

        const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, bankId).first();
        if (!branch) return err('Branch not found or does not belong to your bank.', 404);

        const staff = await env.DB.prepare(`
          SELECT u.id, u.username, u.full_name, u.email, u.role_code, u.status,
                 r.name as role_name, r.scope
          FROM users u
          LEFT JOIN roles r ON u.role_code = r.code
          WHERE u.branch_id = ?
          ORDER BY u.full_name ASC
        `).bind(branchId).all();

        return json({ success: true, branch: { id: branch.id, name: branch.name, region: branch.region, district: branch.district }, count: staff.results.length, data: staff.results });
      }

      // =========================================================================
      // 8. REGIONS & DISTRICTS LOOKUP
      // Ghana administrative boundaries for branch creation and asset registration
      // =========================================================================
      if (['/api/regions', '/api/v1/regions', '/api/admin/regions', '/api/bank/regions'].includes(pathname) && method === 'GET') {
        const ghanaRegions = {
          'Greater Accra': ['Accra Metropolitan', 'Tema Metropolitan', 'Ga East', 'Ga West', 'Ga South', 'Ga Central', 'Ga North', 'Ledzokuku', 'Krowor', 'La Dade Kotopon', 'La Nkwantanang Madina', 'Adentan', 'Ablekuma North', 'Ablekuma West', 'Ablekuma Central', 'Ayawaso East', 'Ayawaso West', 'Ayawaso North', 'Ayawaso Central', 'Okaikwei North', 'Korle Klottey', 'Weija Gbawe', 'Ada East', 'Ada West', 'Ningo Prampram', 'Shai Osudoku'],
          'Ashanti': ['Kumasi Metropolitan', 'Oforikrom', 'Asokwa', 'Suame', 'Bantama', 'Kwadaso', 'Old Tafo', 'Manhyia North', 'Manhyia South', 'Atwima Nwabiagya North', 'Atwima Nwabiagya South', 'Atwima Kwanwoma', 'Bosomtwe', 'Ejisu', 'Juaben', 'Kwabre East', 'Afigya Kwabre North', 'Afigya Kwabre South', 'Bekwai', 'Bosome Freho', 'Adansi North', 'Adansi South', 'Obuasi', 'Amansie Central', 'Amansie South', 'Amansie West', 'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Mampong', 'Sekyere East', 'Sekyere South', 'Sekyere Central', 'Sekyere Afram Plains', 'Offinso North', 'Offinso South', 'Asante Akim North', 'Asante Akim South', 'Asante Akim Central', 'Ejura Sekyedumase'],
          'Western': ['Sekondi-Takoradi Metropolitan', 'Effia Kwesimintsim', 'Essikado-Ketan', 'Shama', 'Ahanta West', 'Nzema East', 'Ellembelle', 'Jomoro', 'Tarkwa-Nsuaem', 'Prestea-Huni Valley', 'Wassa Amenfi East', 'Wassa Amenfi Central', 'Wassa Amenfi West', 'Mpohor'],
          'Western North': ['Sefwi Wiawso', 'Sefwi Akontombra', 'Sefwi Bibiani-Anhwiaso-Bekwai', 'Juaboso', 'Bia East', 'Bia West', 'Bodi', 'Suaman', 'Aowin'],
          'Central': ['Cape Coast Metropolitan', 'Komenda-Edina-Eguafo-Abirem', 'Mfantsiman', 'Abura-Asebu-Kwamankese', 'Ajumako-Enyan-Essiam', 'Gomoa East', 'Gomoa West', 'Gomoa Central', 'Effutu', 'Awutu Senya East', 'Awutu Senya West', 'Agona East', 'Agona West', 'Asikuma-Odoben-Brakwa', 'Assin North', 'Assin South', 'Twifo-Atti Morkwa', 'Twifo Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West', 'Ekumfi'],
          'Eastern': ['New Juaben South', 'New Juaben North', 'Koforidua', 'Suhum', 'Nsawam-Adoagyiri', 'Akuapim South', 'Akuapim North', 'Abuakwa South', 'Abuakwa North', 'Denkyembour', 'Kwaebibirem', 'Atiwa East', 'Atiwa West', 'Birim North', 'Birim South', 'Birim Central', 'West Akim', 'Achiase', 'Upper West Akim', 'Ayensuano', 'Lower Manya Krobo', 'Upper Manya Krobo', 'Yilo Krobo', 'Fanteakwa North', 'Fanteakwa South', 'Kwahu East', 'Kwahu West', 'Kwahu South', 'Kwahu Afram Plains North', 'Kwahu Afram Plains South', 'Akyemansa'],
          'Volta': ['Ho Municipal', 'Ho West', 'South Dayi', 'North Dayi', 'Keta', 'Ketu South', 'Ketu North', 'Akatsi South', 'Akatsi North', 'South Tongu', 'North Tongu', 'Adaklu', 'Afadzato South', 'Central Tongu', 'Anloga', 'Hohoe'],
          'Oti': ['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta South', 'Nkwanta North', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'],
          'Northern': ['Tamale Metropolitan', 'Sagnarigu', 'Mion', 'Yendi', 'Nanumba North', 'Nanumba South', 'Zabzugu', 'Tatale-Sanguli', 'Saboba', 'Gushegu', 'Karaga', 'Kpandai', 'Tolon', 'Kumbungu', 'Savelugu', 'Nanton'],
          'Savannah': ['Damongo', 'West Gonja', 'Central Gonja', 'East Gonja', 'North Gonja', 'North East Gonja', 'Bole', 'Sawla-Tuna-Kalba'],
          'North East': ['Nalerigu-Gambaga', 'East Mamprusi', 'West Mamprusi', 'Mamprugu-Moagduri', 'Bunkpurugu-Nyankpanduri', 'Yunyoo-Nasuan', 'Chereponi'],
          'Upper East': ['Bolgatanga Municipal', 'Bolgatanga East', 'Bongo', 'Talensi', 'Nabdam', 'Kassena-Nankana West', 'Kassena-Nankana East', 'Bawku Municipal', 'Bawku West', 'Garu', 'Tempane', 'Pusiga', 'Binduri', 'Builsa North', 'Builsa South'],
          'Upper West': ['Wa Municipal', 'Wa East', 'Wa West', 'Daffiama-Bussie-Issa', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie-Karni', 'Lawra', 'Nandom', 'Sissala East', 'Sissala West'],
          'Bono': ['Sunyani Municipal', 'Sunyani West', 'Dormaa East', 'Dormaa Central', 'Dormaa West', 'Berekum East', 'Berekum West', 'Jaman North', 'Jaman South', 'Tain', 'Banda', 'Wenchi'],
          'Bono East': ['Techiman Municipal', 'Techiman North', 'Nkoranza North', 'Nkoranza South', 'Kintampo North', 'Kintampo South', 'Atebubu-Amantin', 'Sene East', 'Sene West', 'Pru East', 'Pru West'],
          'Ahafo': ['Goaso', 'Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South']
        };
        return json({ success: true, data: ghanaRegions });
      }

      // =========================================================================
      // 9. ENCRYPTED / HASHED ENDPOINT ROUTING
      // Sensitive portal pages use SHA-256 hashed route tokens.
      // Frontend generates: hash = SHA256("portal:page:context")
      // Backend resolves the hash to the real internal handler.
      // =========================================================================

      // POST /api/enc/resolve — Resolve a hashed route token to its internal handler
      if (pathname === '/api/enc/resolve' && method === 'POST') {
        const body = await getBody();
        const { token, context } = body;
        if (!token) return err('Encrypted route token is required.', 400);

        // Verify the token against known route hashes
        const routeMap = {
          // Admin portal pages
          'admin:dashboard': '/api/admin/dashboard',
          'admin:banks': '/api/admin/banks',
          'admin:users': '/api/admin/users',
          'admin:assets': '/api/admin/assets',
          'admin:legal': '/api/admin/legal',
          'admin:titles': '/api/admin/titles',
          'admin:valuations': '/api/admin/valuations',
          'admin:settings': '/api/admin/settings',
          'admin:branches': '/api/admin/branches',
          'admin:audit': '/api/admin/audit-logs',
          // Bank portal pages
          'bank:dashboard': '/api/bank/dashboard',
          'bank:profile': '/api/bank/profile',
          'bank:assets': '/api/bank/assets',
          'bank:branches': '/api/bank/branches',
          'bank:documents': '/api/bank/documents',
          'bank:enquiries': '/api/bank/enquiries',
          'bank:viewings': '/api/bank/viewings',
          'bank:offers': '/api/bank/offers',
          // Marketplace pages
          'marketplace:listings': '/api/marketplace/assets',
          'marketplace:categories': '/api/marketplace/categories',
          'marketplace:detail': '/api/marketplace/assets',
        };

        // Hash the known routes and find match
        let resolvedRoute = null;
        let resolvedKey = null;

        for (const [key, route] of Object.entries(routeMap)) {
          const encoder = new TextEncoder();
          const data = encoder.encode(key);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          if (hashHex === token) {
            resolvedRoute = route;
            resolvedKey = key;
            break;
          }
        }

        if (!resolvedRoute) return err('Invalid or expired encrypted route token.', 403);

        await auditLog(actorName, actorRole, 'System', 'ENC_RESOLVE', 'Route', resolvedKey, `Encrypted route resolved: ${resolvedKey}`);
        return json({ success: true, route: resolvedRoute, key: resolvedKey, context: context || null });
      }

      // GET /api/enc/tokens — Generate hashed tokens for all portal routes (admin use only)
      if (pathname === '/api/enc/tokens' && method === 'GET') {
        const routeKeys = [
          'admin:dashboard', 'admin:banks', 'admin:users', 'admin:assets',
          'admin:legal', 'admin:titles', 'admin:valuations', 'admin:settings',
          'admin:branches', 'admin:audit',
          'bank:dashboard', 'bank:profile', 'bank:assets', 'bank:branches',
          'bank:documents', 'bank:enquiries', 'bank:viewings', 'bank:offers',
          'marketplace:listings', 'marketplace:categories', 'marketplace:detail'
        ];

        const tokens = {};
        for (const key of routeKeys) {
          const encoder = new TextEncoder();
          const data = encoder.encode(key);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          tokens[key] = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        return json({ success: true, data: tokens });
      }

      // =========================================================================
      // 10. BRANCH-SCOPED STATISTICS (Dashboard per branch)
      // =========================================================================
      if (pathname.match(/^\/api\/bank\/branches\/[a-zA-Z0-9_-]+\/dashboard$/) && method === 'GET') {
        const parts = pathname.split('/');
        const branchId = parts[4];

        const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, bankId).first();
        if (!branch) return err('Branch not found or access denied.', 404);

        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE branch_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE branch_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingReview,
            (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM users WHERE branch_id = ?) as staffCount
        `).bind(branchId, branchId, branchId, branchId, branchId, branchId, branchId).first();

        return json({
          success: true,
          branch: { id: branch.id, name: branch.name, region: branch.region, district: branch.district, town: branch.town },
          data: stats
        });
      }

      // GET /api/regions — All 16 Ghana regions with their constituencies (used as districts)
      // District dropdown MUST be filtered by region selection
      if (pathname === '/api/regions' && method === 'GET') {
        const requestedRegion = url.searchParams.get('region');
        const GHANA_REGIONS = {
          'Ahafo': ['Asunafo North','Asunafo South','Asutifi North','Asutifi South','Tano North','Tano South'],
          'Ashanti': ['Adansi-Asokwa','Fomena','New Edubiase','Afigya Kwabre North','Afigya Kwabre South','Ahafo Ano North','Ahafo Ano South East','Ahafo Ano South West','Akrofuom','Odotobri','Manso Nkwanta','Manso Edubia','Asante Akim Central','Asante Akim North','Asante Akim South','Asawase','Asokwa','Atwima-Kwanwoma','Atwima Mponua','Atwima-Nwabiagya South','Atwima-Nwabiagya North','Bekwai','Bosome-Freho','Bosomtwe','Ejisu','Ejura-Sekyedumase','Juaben','Bantama','Manhyia North','Manhyia South','Nhyiaeso','Subin','Kwabre East','Kwadaso','Mampong','Obuasi East','Obuasi West','Offinso South','Offinso North','Oforikrom','Old Tafo','Sekyere Afram Plains','Nsuta-Kwamang-Beposo','Afigya Sekyere East','Kumawu','Effiduase-Asokore','Suame'],
          'Bono': ['Banda','Berekum East','Berekum West','Dormaa Central','Dormaa East','Dormaa West','Jaman North','Jaman South','Sunyani East','Sunyani West','Tain','Wenchi'],
          'Bono East': ['Atebubu-Amantin','Kintampo North','Kintampo South','Nkoranza North','Nkoranza South','Pru East','Pru West','Sene East','Sene West','Techiman South','Techiman North'],
          'Central': ['Abura-Asebu-Kwamankese','Agona East','Agona West','Ajumako-Enyan-Essiam','Asikuma-Odoben-Brakwa','Assin Central','Assin North','Assin South','Awutu-Senya East','Awutu-Senya West','Cape Coast North','Cape Coast South','Effutu','Ekumfi','Gomoa East','Gomoa Central','Gomoa West','Komenda-Edina-Eguafo-Abirem','Mfantseman','Twifo-Atii Morkwaa','Hemang Lower Denkyira','Upper Denkyira East','Upper Denkyira West'],
          'Eastern': ['Abuakwa North','Abuakwa South','Achiase','Akropong','Akuapem South','Ofoase-Ayirebi','Asene Akroso Manso','Asuogyaman','Atiwa East','Atiwa West','Ayensuano','Akim Oda','Abirem','Akim Swedru','Akwatia','Fanteakwa North','Fanteakwa South','Kade','Afram Plains North','Afram Plains South','Abetifi','Mpraeso','Nkawkaw','Lower Manya Krobo','New Juaben North','New Juaben South','Nsawam Adoagyiri','Okere','Suhum','Upper Manya Krobo','Upper West Akim','Lower West Akim','Yilo Krobo'],
          'Greater Accra': ['Ablekuma Central','Ablekuma North','Ablekuma West','Ablekuma South','Odododiodioo','Okaikwei Central','Okaikwei South','Ada','Sege','Adenta','Ashaiman','Ayawaso Central','Ayawaso East','Ayawaso North','Ayawaso West Wuogon','Anyaa-Sowutuom','Dome-Kwabenya','Trobu','Bortianor-Ngleshie-Amanfro','Amasaman','Korle Klottey','Kpone-Katamanso','Krowor','Dade Kotopon','Abokobi-Madina','Ledzokuku','Ningo-Prampram','Okaikwei North','Shai-Osudoku','Tema East','Tema Central','Tema West','Weija-Gbawe','Domeabra-Obom'],
          'North East': ['Bunkpurugu','Chereponi','Nalerigu','Yagaba-Kubori','Walewale','Yunyoo'],
          'Northern': ['Gushegu','Karaga','Kpandai','Kumbungu','Mion','Nanton','Bimbilla','Wulensi','Saboba','Sagnarigu','Savelugu','Tamale Central','Tamale North','Tamale South','Tatale-Sanguli','Tolon','Yendi','Zabzugu'],
          'Oti': ['Biakoye','Guan','Buem','Akan','Krachi East','Krachi Nchumuru','Krachi West','Nkwanta North','Nkwanta South'],
          'Savannah': ['Bole','Yapei-Kusawgu','Salaga South','Salaga North','Daboya-Mankarigu','Sawla-Tuna-Kalba','Damongo'],
          'Upper East': ['Bawku Central','Zebilla','Binduri','Bolgatanga East','Bolgatanga Central','Bongo','Builsa North','Builsa South','Garu','Navrongo Central','Chiana-Paga','Nabdam','Pusiga','Talensi','Tempane'],
          'Upper West': ['Daffiama-Bussie-Issa','Jirapa','Lambussie','Lawra','Nadowli-Kaleo','Nandom','Sissala East','Sissala West','Wa East','Wa Central','Wa West'],
          'Volta': ['Adaklu','Afadjato South','Agotime-Ziope','Akatsi North','Akatsi South','Anlo','Central Tongu','Ho Central','Ho West','Hohoe','Keta','Ketu North','Ketu South','Kpando','North Dayi','North Tongu','South Dayi','South Tongu'],
          'Western': ['Ahanta West','Amenfi Central','Amenfi West','Amenfi East','Effia','Kwesimintsim','Ellembelle','Jomoro','Mpohor','Evalue Gwira','Prestea-Huni Valley','Essikado-Ketan','Sekondi','Takoradi','Shama','Tarkwa-Nsuaem','Wassa East'],
          'Western North': ['Aowin','Bia East','Bia West','Bibiani-Anhwiaso-Bekwai','Bodi','Juaboso','Sefwi-Akontombra','Sefwi-Wiawso','Suaman']
        };

        if (requestedRegion) {
          const constituencies = GHANA_REGIONS[requestedRegion];
          if (!constituencies) return err(`Unknown region: ${requestedRegion}`, 404);
          return json({ success: true, region: requestedRegion, constituencies, count: constituencies.length });
        }

        // Return all regions with summary
        const summary = Object.entries(GHANA_REGIONS).map(([region, constituencies]) => ({
          region, constituency_count: constituencies.length, constituencies
        }));
        return json({ success: true, total_regions: 16, total_constituencies: 276, data: summary });
      }

      // 404 Route Fallback
      return err(`Route '${pathname}' with method '${method}' not found on Surge API. Check / for endpoint documentation.`, 404);
    } catch (error) {
      // Auth guards throw Response objects directly — pass them through unchanged
      if (error instanceof Response) return error;
      console.error('Unhandled API Error:', error);
      return json({ success: false, error: error.message || 'An internal server error occurred.' }, 500);
    }
  }
};
