import {
  SESSION_COOKIE, SESSION_TTL_HOURS, SESSION_ABSOLUTE_HOURS, REMEMBERED_ABSOLUTE_HOURS
} from './config.js';
import { secureRandomHex, randomId, sha256Hex, parseDeviceName } from './crypto.js';
import { isSurgeAdmin, isBankOfficer, isSupportedRole } from './rbac.js';

// Session resolution and the auth guards. Guards throw Response objects, which the
// dispatcher passes through unchanged.
export function createSessions({ request, env, ctx, http, state, auditLog }) {
  const { setSessionCookie, readCookie, corsHeaders } = http;

  async function resolveSession() {
    const authHeader = request.headers.get('Authorization') || '';
    const legacyToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    let cookieSecret = readCookie(SESSION_COOKIE);
    let session = null;

    if (cookieSecret) {
      const secretHash = await sha256Hex(cookieSecret);
      session = await env.DB.prepare(`
      SELECT s.*, u.username, u.full_name, u.email, u.status as user_status,
             b.legal_name as bank_name, b.short_code as bank_code, b.status as bank_status,
             b.public_id as bank_public_id, o.public_id as organization_public_id, o.name as organization_name,
             u.public_id as user_public_id, u.role_code AS user_role_code, u.bank_id AS user_bank_id, r.scope AS user_scope
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON r.code = u.role_code
      LEFT JOIN banks b ON s.bank_id = b.id
      LEFT JOIN organizations o ON o.id = s.organization_id
      WHERE s.secret_hash = ? AND s.revoked = 0
        AND datetime(s.expires_at) > datetime('now')
        AND datetime(s.absolute_expires_at) > datetime('now')
      `).bind(secretHash).first();
    }

    if (!session && legacyToken) {
      session = await env.DB.prepare(`
        SELECT s.*, u.username, u.full_name, u.email, u.status as user_status,
               b.legal_name as bank_name, b.short_code as bank_code, b.status as bank_status,
               b.public_id as bank_public_id, o.public_id as organization_public_id, o.name as organization_name,
               u.public_id as user_public_id, u.role_code AS user_role_code, u.bank_id AS user_bank_id, r.scope AS user_scope
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN roles r ON r.code = u.role_code
        LEFT JOIN banks b ON s.bank_id = b.id
        LEFT JOIN organizations o ON o.id = s.organization_id
        WHERE s.id = ? AND s.secret_hash IS NULL AND s.revoked = 0
          AND datetime(s.expires_at) > datetime('now')
          AND datetime(s.absolute_expires_at) > datetime('now')
      `).bind(legacyToken).first();

      if (session?.user_status === 'Active' && !session.secret_hash) {
        const newSecret = secureRandomHex(32);
        const newSessionId = randomId();
        const secretHash = await sha256Hex(newSecret);
        const ipAddress = request.headers.get('CF-Connecting-IP') || '';
        const userAgent = (request.headers.get('User-Agent') || '').slice(0, 250);
        const remembered = session.remembered === 1;
        const ttlDays = remembered ? 30 : SESSION_TTL_HOURS / 24;
        const absoluteHours = remembered ? REMEMBERED_ABSOLUTE_HOURS : SESSION_ABSOLUTE_HOURS;
        const rotated = await env.DB.prepare(`
          UPDATE sessions
          SET id = ?, secret_hash = ?, last_active = datetime('now'),
              expires_at = datetime('now', ?), absolute_expires_at = datetime('now', ?),
              device_name = ?, last_ip = ?, user_agent = ?, remembered = ?
          WHERE id = ? AND secret_hash IS NULL AND revoked = 0
        `).bind(
          newSessionId, secretHash, `+${ttlDays} days`, `+${absoluteHours} hours`,
          parseDeviceName(userAgent), ipAddress, userAgent, remembered ? 1 : 0, legacyToken
        ).run();
        if (!rotated.meta?.changes) return null;
        session.id = newSessionId;
        session.secret_hash = secretHash;
        session.last_ip = ipAddress;
        cookieSecret = newSecret;
        setSessionCookie(newSecret, remembered ? 30 * 24 * 3600 : SESSION_TTL_HOURS * 3600);
        await auditLog(session.full_name, session.role_code, session.bank_name, 'SESSION_ROTATED', 'Session', newSessionId, 'Legacy bearer session rotated to a secure HttpOnly cookie.');
      }
    }

    if (!session) return null;
    if (session.user_status !== 'Active') return null;
    // A session carries the role and bank captured at sign-in; an administrator
    // changing either must take effect immediately, not when the session expires.
    if (session.role_code !== session.user_role_code ||
      session.scope !== session.user_scope ||
      (session.bank_id ?? null) !== (session.user_bank_id ?? null) ||
      !isSupportedRole(session.role_code, session.scope)) {
      ctx.waitUntil(env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'ROLE_CHANGED' WHERE id = ? AND revoked = 0`).bind(session.id).run());
      return null;
    }
    if (session.scope === 'surge') {
      session.bank_id = 'bank-surge';
      session.bank_name = 'Surge Partner Bank';
      session.bank_code = 'SURGE';
      session.bank_public_id = 'bank-surge';
    }
    state.activeSession = session;
    const currentIp = request.headers.get('CF-Connecting-IP') || '';
    if (session.secret_hash && cookieSecret) {
      const suspicious = Boolean(session.last_ip && currentIp && session.last_ip !== currentIp);
      const ttlDays = session.remembered === 1 ? 30 : SESSION_TTL_HOURS / 24;
      ctx.waitUntil(env.DB.prepare(`
        UPDATE sessions
        SET last_active = datetime('now'), expires_at = datetime('now', ?),
            last_ip = ?, suspicious_activity_count = suspicious_activity_count + ?
        WHERE id = ? AND revoked = 0
      `).bind(`+${ttlDays} days`, currentIp, suspicious ? 1 : 0, session.id).run());
      setSessionCookie(cookieSecret, session.remembered === 1 ? 30 * 24 * 3600 : SESSION_TTL_HOURS * 3600);
    }
    return session;
  }

  async function requireAuth() {
    const session = await resolveSession();
    if (!session) {
      throw new Response(JSON.stringify({ success: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' }), { status: 401, headers: corsHeaders });
    }
    return session;
  }

  function forbidden(message) {
    return new Response(JSON.stringify({ success: false, error: message, code: 'FORBIDDEN' }), { status: 403, headers: corsHeaders });
  }

  async function requireBankAuth() {
    const session = await requireAuth();
    if (isSurgeAdmin(session)) return session;
    if (!isBankOfficer(session)) {
      throw forbidden('Bank Portal access denied. This account does not have bank portal permissions.');
    }
    if (!session.bank_id) {
      throw new Response(JSON.stringify({ success: false, error: 'No bank organisation is associated with this account.', code: 'NO_BANK' }), { status: 403, headers: corsHeaders });
    }
    if (session.bank_status && session.bank_status !== 'Active') {
      throw new Response(JSON.stringify({ success: false, error: 'Your bank organisation is suspended.', code: 'BANK_SUSPENDED' }), { status: 403, headers: corsHeaders });
    }
    return session;
  }

  async function requireAdminAuth() {
    const session = await requireAuth();
    if (!isSurgeAdmin(session)) throw forbidden('Surge Admin access denied.');
    return session;
  }

  async function checkLoginRateLimit(username, ipAddress) {
    const [accountAttempts, ipAttempts, userRow] = await Promise.all([
      env.DB.prepare(`
      SELECT COUNT(*) as c FROM login_attempts
      WHERE username = ? AND success = 0
        AND datetime(attempted_at) >= datetime('now', '-15 minutes')
    `).bind(username).first(),
      env.DB.prepare(`
      SELECT COUNT(*) as c FROM login_attempts
      WHERE ip_address = ? AND success = 0
        AND datetime(attempted_at) >= datetime('now', '-15 minutes')
    `).bind(ipAddress).first(),
      env.DB.prepare(`
      SELECT locked_until FROM users WHERE (username = ? OR email = ?)
    `).bind(username, username).first()
    ]);
    const failCount = Number(accountAttempts?.c || 0);
    const maxAttempts = 5;
    let hardLocked = false;
    let lockMinutesLeft = 0;
    if (userRow?.locked_until) {
      const lockEnd = new Date(userRow.locked_until + (userRow.locked_until.endsWith('Z') ? '' : 'Z'));
      const now = new Date();
      if (lockEnd > now) {
        hardLocked = true;
        lockMinutesLeft = Math.ceil((lockEnd - now) / 60000);
      }
    }
    return {
      accountLocked: hardLocked || failCount >= maxAttempts,
      ipRateLimited: Number(ipAttempts?.c || 0) >= 20,
      failCount,
      attemptsRemaining: Math.max(0, maxAttempts - failCount),
      lockMinutesLeft: hardLocked ? lockMinutesLeft : (failCount >= maxAttempts ? 15 : 0)
    };
  }

  async function lockUserAccount(username) {
    try {
      await env.DB.prepare(`
        UPDATE users SET locked_until = datetime('now', '+15 minutes')
        WHERE (username = ? OR email = ?) AND (locked_until IS NULL OR datetime(locked_until) <= datetime('now'))
      `).bind(username, username).run();
    } catch (e) {}
  }

  async function clearUserLock(userId) {
    try {
      await env.DB.prepare(`UPDATE users SET locked_until = NULL WHERE id = ?`).bind(userId).run();
    } catch (e) {}
  }

  return {
    resolveSession, requireAuth, requireBankAuth, requireAdminAuth,
    checkLoginRateLimit, lockUserAccount, clearUserLock,
    getActiveSession: () => state.activeSession
  };
}
