// Central login, logout and session management.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
import { isSupportedRole } from '../rbac.js';

export async function handleAuth(c) {
  const {
    REMEMBERED_ABSOLUTE_HOURS, SESSION_ABSOLUTE_HOURS, SESSION_TTL_HOURS, auditLog, checkLoginRateLimit, clearSessionCookie, clearUserLock, corsHeaders, ctx, env, err, getBody, json, lockUserAccount, method, parseDeviceName, pathname, randomId, request, requireAuth, resolveSession, secureRandomHex, setSessionCookie, sha256Hex, verifyPassword
  } = c;

  // ============================================================
  // 1. CENTRALIZED AUTHENTICATION
  // POST /api/auth/login   - Central login for all portals
  // POST /api/auth/logout  - Revoke current session
  // GET  /api/auth/me      - Validate session + get profile
  // ============================================================

  if (['/api/auth/login', '/api/v1/auth/login', '/api/bank/auth/login', '/api/admin/auth/login'].includes(pathname) && method === 'POST') {
    const body = await getBody();
    const { username, password } = body;
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return err('Username and password are required.', 400);
    }
    if (username.trim().length > 254) return err('Username is too long.', 400);

    const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
    const uname = username.trim().toLowerCase();
    const passwordValue = password.trim();

    const user = await env.DB.prepare(`
      SELECT u.*, r.name as role_name, r.scope, o.name as org_name, o.public_id as organization_public_id,
             b.id as bank_id, b.public_id as bank_public_id, b.legal_name as bank_name,
             b.short_code as bank_code, b.status as bank_status
      FROM users u
      JOIN roles r ON u.role_code = r.code
      JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN banks b ON u.bank_id = b.id
      WHERE (u.username = ? OR u.email = ?) AND u.status = 'Active'
    `).bind(uname, uname).first();
    const lockoutUsername = String(user?.username || uname).trim().toLowerCase();

    const loginLimits = await checkLoginRateLimit(lockoutUsername, ipAddress);
    if (loginLimits.accountLocked || loginLimits.ipRateLimited) {
      const mins = loginLimits.lockMinutesLeft || 15;
      return new Response(JSON.stringify({
        success: false,
        error: 'This account has been temporarily locked after too many failed sign-in attempts. Try again in ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.',
        locked: true,
        lockMinutesLeft: mins
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const recordFailure = async (reason) => {
      await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, failure_reason, attempted_at) VALUES (?, ?, ?, 0, ?, datetime('now'))`)
        .bind(randomId(), lockoutUsername, ipAddress, reason).run();
    };

    // Unknown and unconfigured accounts must cost the same as a wrong
    // password, otherwise response time and body text enumerate usernames.
    const DECOY_HASH = 'pbkdf2-sha256$100000$Q/WVP0hAmZsTtDRiJHR5qQ==$KPAQjz3Y8r4JtLq3flNxQtlfIFiXgA905bhjhIELZ2w=';
    let validPassword = false;
    let failureReason = 'WRONG_PASSWORD';
    if (!user) {
      failureReason = 'USER_NOT_FOUND';
      await verifyPassword(passwordValue, DECOY_HASH);
    } else if (!user.password_hash) {
      failureReason = 'PASSWORD_NOT_CONFIGURED';
      await verifyPassword(passwordValue, DECOY_HASH);
    } else if (String(user.password_hash).startsWith('pbkdf2-sha256$')) {
      validPassword = await verifyPassword(passwordValue, user.password_hash);
    } else {
      failureReason = 'UNSUPPORTED_HASH';
      await verifyPassword(passwordValue, DECOY_HASH);
    }
    if (!validPassword) {
      await recordFailure(failureReason);
      const updatedLimits = await checkLoginRateLimit(lockoutUsername, ipAddress);
      if (updatedLimits.attemptsRemaining <= 0) {
        await lockUserAccount(lockoutUsername);
        return new Response(JSON.stringify({
          success: false,
          error: 'This account has been locked after too many failed sign-in attempts. Try again in 15 minutes.',
          locked: true, lockMinutesLeft: 15, attemptsRemaining: 0
        }), { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'The username or password is incorrect. ' + updatedLimits.attemptsRemaining + ' attempt' + (updatedLimits.attemptsRemaining === 1 ? '' : 's') + ' remaining.',
        attemptsRemaining: updatedLimits.attemptsRemaining
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!isSupportedRole(user.role_code, user.scope)) {
      return err('This account role is no longer supported. Ask a Surge administrator to update your account.', 403);
    }

    // Create session
    const sessionId = randomId();
    const sessionSecret = secureRandomHex(32);
    const secretHash = await sha256Hex(sessionSecret);
    const remembered = body.remember === true;
    const ttlDays = remembered ? 30 : SESSION_TTL_HOURS / 24;
    const absoluteHours = remembered ? REMEMBERED_ABSOLUTE_HOURS : SESSION_ABSOLUTE_HOURS;
    const idleExpiry = Date.now() + ttlDays * 24 * 3600 * 1000;
    const absoluteExpiry = Date.now() + absoluteHours * 3600 * 1000;
    const expiresAt = new Date(Math.min(idleExpiry, absoluteExpiry)).toISOString();
    const absoluteExpiresAt = new Date(absoluteExpiry).toISOString();
    const userAgent = (request.headers.get('User-Agent') || '').slice(0, 250);
    await env.DB.prepare(`
      INSERT INTO sessions (id, secret_hash, user_id, organization_id, bank_id, branch_id, role_code, scope,
        ip_address, last_ip, user_agent, device_name, remembered, created_at, expires_at, absolute_expires_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'))
    `).bind(sessionId, secretHash, user.id, user.organization_id, user.bank_id || null, user.branch_id || null,
      user.role_code, user.scope, ipAddress,
      ipAddress, userAgent, parseDeviceName(userAgent), remembered ? 1 : 0, expiresAt, absoluteExpiresAt).run();
    setSessionCookie(sessionSecret, remembered ? 30 * 24 * 3600 : SESSION_TTL_HOURS * 3600);

    // Record success, clear lockout & update last_login
    await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, attempted_at) VALUES (?, ?, ?, 1, datetime('now'))`)
      .bind(randomId(), uname, ipAddress).run();
    await clearUserLock(user.id);
    await env.DB.prepare(`UPDATE users SET last_login = datetime('now'), locked_until = NULL WHERE id = ?`).bind(user.id).run();
    await auditLog(user.full_name, user.role_code, user.org_name, 'LOGIN', 'User', user.public_id, `Signed in from ${ipAddress}`, null, null, user.id);

    ctx.waitUntil(Promise.all([
      env.DB.prepare(`DELETE FROM login_attempts WHERE datetime(attempted_at) < datetime('now', '-30 days')`).run(),
      env.DB.prepare(`DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now') OR datetime(absolute_expires_at) <= datetime('now')`).run()
    ]).catch(() => {}));

    const isSurge = user.scope === 'surge';
    return json({
      success: true,
      expiresAt,
      user: {
        id: user.public_id, username: user.username, fullName: user.full_name,
        email: user.email, roleCode: user.role_code, roleName: user.role_name,
        scope: user.scope,
        bankId: isSurge ? 'bank-surge' : user.bank_public_id,
        bankName: isSurge ? 'Surge Partner Bank' : user.bank_name,
        bankCode: isSurge ? 'SURGE' : user.bank_code,
        organizationId: user.organization_public_id,
        branchId: user.branch_id, mfaEnabled: !!user.mfa_enabled
      }
    });
  }

  // POST /api/auth/logout - Revoke session
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const session = await resolveSession();
    if (session) {
      await auditLog(session.full_name, session.role_code, session.bank_name, 'LOGOUT', 'User', session.user_public_id, 'Signed out.');
      await env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'USER_LOGOUT' WHERE id = ?`).bind(session.id).run();
    }
    clearSessionCookie();
    return json({ success: true, message: 'Signed out successfully.' });
  }

  if (pathname === '/api/auth/logout-all' && method === 'POST') {
    const session = await requireAuth();
    await env.DB.prepare(`
      UPDATE sessions SET revoked = 1, revoke_reason = 'USER_LOGOUT_ALL'
      WHERE user_id = ? AND revoked = 0
    `).bind(session.user_id).run();
    clearSessionCookie();
    await auditLog(session.full_name, session.role_code, session.bank_name, 'LOGOUT_ALL', 'User', session.user_id, 'All active sessions revoked.');
    return json({ success: true, message: 'All sessions have been signed out.' });
  }

  if (pathname === '/api/auth/sessions' && method === 'GET') {
    const session = await requireAuth();
    const result = await env.DB.prepare(`
      SELECT id, device_name, last_ip, created_at, last_active, expires_at,
             CASE WHEN id = ? THEN 1 ELSE 0 END AS current
      FROM sessions
      WHERE user_id = ? AND revoked = 0
        AND datetime(expires_at) > datetime('now')
        AND datetime(absolute_expires_at) > datetime('now')
      ORDER BY last_active DESC
    `).bind(session.id, session.user_id).all();
    return json({ success: true, sessions: result.results || [] });
  }

  const revokeSessionMatch = pathname.match(/^\/api\/auth\/sessions\/([0-9a-f-]{36})$/i);
  if (revokeSessionMatch && method === 'DELETE') {
    const session = await requireAuth();
    const revoked = await env.DB.prepare(`
      UPDATE sessions SET revoked = 1, revoke_reason = 'USER_REVOKED'
      WHERE id = ? AND user_id = ? AND revoked = 0
    `).bind(revokeSessionMatch[1], session.user_id).run();
    if (!revoked.meta?.changes) return err('Session not found or already revoked.', 404);
    if (revokeSessionMatch[1] === session.id) clearSessionCookie();
    await auditLog(session.full_name, session.role_code, session.bank_name, 'SESSION_REVOKED', 'Session', revokeSessionMatch[1], 'User revoked an active session.');
    return json({ success: true });
  }

  // GET /api/auth/me - Validate session and return user profile
  if ((pathname === '/api/auth/me' || pathname === '/api/v1/auth/me') && method === 'GET') {
    const session = await resolveSession();
    if (!session) return json({ success: true, authenticated: false, user: null });
    const branch = session.branch_id
      ? await env.DB.prepare('SELECT public_id FROM bank_branches WHERE id = ?').bind(session.branch_id).first()
      : null;
    const isSurge = session.scope === 'surge';
    return json({
      success: true, authenticated: true,
      user: {
        id: session.user_public_id, username: session.username, fullName: session.full_name,
        email: session.email, roleCode: session.role_code, scope: session.scope,
        bankId: isSurge ? 'bank-surge' : session.bank_public_id,
        bankName: isSurge ? 'Surge Partner Bank' : session.bank_name,
        bankCode: isSurge ? 'SURGE' : session.bank_code,
        branchId: branch?.public_id || null, organizationId: session.organization_public_id,
        organizationName: isSurge ? 'Surge Partner Bank' : session.organization_name
      }
    });
  }

  // Accounts are provisioned only by Surge administrators; invitation links were a
  // self-service path around that, so both endpoints are permanently retired.
  if ((pathname === '/api/auth/accept-invitation' || pathname === '/api/auth/invite') && method === 'POST') {
    return err('Invitations are no longer supported. Accounts are created by a Surge administrator.', 410);
  }
}
