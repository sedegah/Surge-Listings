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
 * - env.ASSETS_BUCKET: public asset photos (surge-assets)
 * - env.DOCUMENTS_BUCKET: legacy/general documents (surge-documents)
 * - Dedicated bindings for title, land-search, valuation, legal, and KYC files
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method.toUpperCase();

    // ============================================================
    // CORS MIDDLEWARE
    // The browser uses the Vercel same-origin API rewrite. Direct API clients are
    // limited to explicitly configured application origins.
    // ============================================================
    const origin = request.headers.get('Origin');
    const allowedOrigins = new Set([
      'https://surge-listings.vercel.app',
      ...(env.APP_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
    ]);
    const allowOrigin = origin && allowedOrigins.has(origin) ? origin : '';

    const corsHeaders = {
      ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Credentials': 'true' } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Disposition, ETag',
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store, max-age=0',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    let responseCookie = null;
    const json = (data, status = 200) => {
      const headers = new Headers(corsHeaders);
      if (responseCookie) headers.set('Set-Cookie', responseCookie);
      return new Response(JSON.stringify(data), { status, headers });
    };
    const err = (message, status = 400, details = {}) => {
      const headers = new Headers(corsHeaders);
      if (responseCookie) headers.set('Set-Cookie', responseCookie);
      return new Response(JSON.stringify({ success: false, error: message, ...details }), { status, headers });
    };

    const SESSION_COOKIE = '__Host-surge_session';
    const SESSION_TTL_HOURS = 8;
    const encoder = new TextEncoder();

    function secureRandomHex(byteCount = 32) {
      const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function randomId() {
      return crypto.randomUUID();
    }

    async function sha256Hex(value) {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function setSessionCookie(secret, maxAge = SESSION_TTL_HOURS * 3600) {
      responseCookie = `${SESSION_COOKIE}=${secret}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
    }

    function clearSessionCookie() {
      responseCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
    }

    function readCookie(name) {
      const cookieHeader = request.headers.get('Cookie') || '';
      for (const part of cookieHeader.split(';')) {
        const separator = part.indexOf('=');
        if (separator > 0 && part.slice(0, separator).trim() === name) {
          return part.slice(separator + 1).trim();
        }
      }
      return '';
    }

    function equalSecret(left, right) {
      if (left.length !== right.length) return false;
      let difference = 0;
      for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
      }
      return difference === 0;
    }

    function decodeBase64(value) {
      return Uint8Array.from(atob(value), character => character.charCodeAt(0));
    }

    function encodeBase64(value) {
      return btoa(String.fromCharCode(...new Uint8Array(value)));
    }

    async function hashPassword(password) {
      const iterations = 100000;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
      return `pbkdf2-sha256$${iterations}$${encodeBase64(salt)}$${encodeBase64(bits)}`;
    }

    async function verifyPassword(password, storedHash) {
      const parts = String(storedHash || '').split('$');
      if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
      const iterations = Number(parts[1]);
      if (iterations !== 100000) return false;
      const salt = decodeBase64(parts[2]);
      const expected = decodeBase64(parts[3]);
      const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.length * 8));
      if (actual.length !== expected.length) return false;
      let difference = 0;
      for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
      return difference === 0;
    }

    function parseDeviceName(userAgent) {
      const agent = String(userAgent || '');
      const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Unknown browser';
      const platform = /Windows/.test(agent) ? 'Windows' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Mac OS/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : 'Unknown device';
      return `${browser} on ${platform}`;
    }

    function enforceSameOriginMutation() {
      if (env.ENVIRONMENT !== 'production' || ['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;
      const requestOrigin = request.headers.get('Origin');
      if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
        return err('Cross-origin request rejected.', 403);
      }
      return null;
    }

    function bucketNameForDocumentCategory(category) {
      const normalized = String(category || '').trim().toLowerCase();
      if (/\bkyc\b|\bidentity\b|\bghana card\b|\bproof of funds\b/.test(normalized)) return 'surge-kyc-documents';
      if (/land search|search report/.test(normalized)) return 'surge-land-searches';
      if (/valuation|valuer/.test(normalized)) return 'surge-valuation-reports';
      if (/legal|instrument|court|enforcement|judgment/.test(normalized)) return 'surge-legal-instruments';
      if (/title|deed|certificate|site plan/.test(normalized)) return 'surge-title-documents';
      return 'surge-documents';
    }

    function bucketForStoredDocument(name) {
      const bindings = {
        'surge-documents': env.DOCUMENTS_BUCKET,
        'surge-title-documents': env.TITLE_DOCUMENTS_BUCKET,
        'surge-land-searches': env.LAND_SEARCHES_BUCKET,
        'surge-valuation-reports': env.VALUATION_REPORTS_BUCKET,
        'surge-legal-instruments': env.LEGAL_INSTRUMENTS_BUCKET,
        'surge-kyc-documents': env.KYC_DOCUMENTS_BUCKET
      };
      return bindings[name] || null;
    }

    function extensionForMime(mimeType) {
      const normalized = String(mimeType || '').split(';')[0].trim().toLowerCase();
      return ({
        'application/pdf': 'pdf',
        'application/x-pdf': 'pdf',
        'application/acrobat': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/pjpeg': 'jpg',
        'image/jfif': 'jpg',
        'image/png': 'png',
        'image/x-png': 'png',
        'image/webp': 'webp',
        'image/x-webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif'
      })[normalized] || null;
    }

    async function isValidFile(file, imageOnly = false) {
      if (!file || typeof file.arrayBuffer !== 'function') return false;
      let mimeType = String(file.type || '').split(';')[0].trim().toLowerCase();
      const name = String(file.name || '').toLowerCase();

      // Normalize common MIME aliases
      if (mimeType === 'image/jpg' || mimeType === 'image/pjpeg' || mimeType === 'image/jfif' || mimeType === 'image/x-citrix-jpeg') {
        mimeType = 'image/jpeg';
      } else if (mimeType === 'image/x-png') {
        mimeType = 'image/png';
      } else if (mimeType === 'image/x-webp') {
        mimeType = 'image/webp';
      } else if (mimeType === 'application/x-pdf' || mimeType === 'application/acrobat') {
        mimeType = 'application/pdf';
      }

      // Read magic bytes for binary inspection
      let bytes = new Uint8Array(0);
      try {
        bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      } catch (e) {
        bytes = new Uint8Array(0);
      }
      const startsWith = (...values) => values.length <= bytes.length && values.every((value, index) => bytes[index] === value);

      const isJpeg = bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xD8;
      const isPng = startsWith(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
      const isPdf = startsWith(0x25, 0x50, 0x44, 0x46);
      const isWebp = bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
      const isDoc = startsWith(0x50, 0x4B, 0x03, 0x04) || startsWith(0xD0, 0xCF, 0x11, 0xE0);

      // Binary magic bytes take highest priority to overcome broken browser MIME types
      if (isJpeg) mimeType = 'image/jpeg';
      else if (isPng) mimeType = 'image/png';
      else if (isWebp) mimeType = 'image/webp';
      else if (isPdf && !imageOnly) mimeType = 'application/pdf';
      else if (isDoc && !imageOnly) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // Fallback: check file extension if MIME header is empty or generic
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (name.endsWith('.doc')) mimeType = 'application/msword';
        else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (name.endsWith('.png')) mimeType = 'image/png';
        else if (name.endsWith('.webp')) mimeType = 'image/webp';
      }

      if (imageOnly) {
        return isJpeg || isPng || isWebp || (mimeType.startsWith('image/') && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')));
      }

      const extension = extensionForMime(mimeType);
      return Boolean(extension) || isJpeg || isPng || isWebp || isPdf || isDoc;
    }

    // Helper: Parse JSON safely
    async function getBody() {
      try {
        return await request.json();
      } catch (e) {
        return {};
      }
    }

    let activeSession = null;

    // Helper: Immutable Audit Logging
    async function auditLog(actorName, actorRole, org, actionType, entityType, entityId, summary, oldVal = null, newVal = null, actorUserId = null) {
      const session = activeSession;
      const resolvedActorName = session?.full_name || actorName || 'System';
      const resolvedActorRole = session?.role_code || actorRole || 'Staff';
      const resolvedActorUserId = session?.user_id || actorUserId || null;

      const id = randomId();
      await env.DB.prepare(`
        INSERT INTO audit_logs (id, actor_user_id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        resolvedActorUserId,
        resolvedActorName,
        resolvedActorRole,
        session?.bank_name || org || 'Surge Solutions',
        actionType,
        entityType,
        entityId,
        summary,
        oldVal ? JSON.stringify(oldVal) : null,
        newVal ? JSON.stringify(newVal) : null
      ).run();
    }

    async function getAssetReadiness(asset) {
      const injunctionRow = await env.DB.prepare(`
        SELECT li.injunction_active, li.verification_status, li.instrument_ref
        FROM legal_instruments li
        JOIN enforcement_cases ec ON li.case_id = ec.id
        WHERE ec.asset_id = ? AND li.injunction_active = 1
      `).bind(asset.id).first();
      const activeInjunction = !!injunctionRow;

      const title = await env.DB.prepare(`
        SELECT tr.verification_status,
          EXISTS(SELECT 1 FROM documents d WHERE d.id = tr.document_id AND d.asset_id = tr.asset_id) AS has_document
        FROM title_records tr WHERE tr.asset_id = ?
      `).bind(asset.id).first();
      const titleVerified = title?.verification_status === 'Verified' && title.has_document === 1;

        const enforcement = await env.DB.prepare(`
          SELECT ec.status,
            COUNT(li.id) AS instrument_count,
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
        const instrumentsVerified = !!enforcement &&
          enforcement.instrument_count > 0 &&
          enforcement.instrument_count === enforcement.verified_instrument_count;
        const legalClearanceIssued = enforcement?.status === 'Cleared' && instrumentsVerified;

        const valuation = await env.DB.prepare(`
          SELECT v.status, v.review_required, v.expiry_date,
            EXISTS(SELECT 1 FROM documents d WHERE d.id = v.document_id AND d.asset_id = v.asset_id) AS has_document
        FROM valuations v WHERE asset_id = ?
        ORDER BY valuation_date DESC, rowid DESC LIMIT 1
      `).bind(asset.id).first();
      const valuationValid = !!valuation && (
        valuation.status === 'Valid' &&
        valuation.review_required === 0 &&
        valuation.has_document === 1 &&
        Date.parse(`${valuation.expiry_date}T23:59:59Z`) >= Date.now()
      );

      const imageCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ?`).bind(asset.id).first();
      const photoRequirementMet = (imageCount?.c || 0) >= 1;
      const reservePriceSet = !!asset.reserve_price && asset.reserve_price > 0;
      const gates = [
        {
          gate: 'LG-2 Injunction & Legal Clear',
          passed: !activeInjunction && legalClearanceIssued,
          detail: activeInjunction
            ? `Active Injunction on ${injunctionRow.instrument_ref}`
            : legalClearanceIssued
              ? 'All enforcement instruments verified and legal clearance issued'
              : 'Enforcement instruments and legal clearance are pending'
        },
        { gate: 'TL-2 Title Perfection', passed: titleVerified, detail: titleVerified ? 'Title and deed verified by Surge' : 'Title details and supporting deed pending verification' },
        { gate: 'VL-1 Valuation Validity Window', passed: valuationValid, detail: valuation ? `${valuation.status}${valuation.review_required ? ' — review required' : ''}; expires ${valuation.expiry_date}` : 'No valuation submitted' },
        { gate: 'AS-4 Photo Documentation', passed: photoRequirementMet, detail: `${imageCount?.c || 0} media assets verified` },
        { gate: 'AS-8 Reserve Price Guard', passed: reservePriceSet, detail: `GHS ${asset.reserve_price?.toLocaleString()}` }
      ];
      return { allPass: gates.every(gate => gate.passed) && !asset.legal_hold_active, gates };
    }

    // ============================================================
    // SESSION AUTH MIDDLEWARE
    // Validates the session token from Authorization: Bearer <token>
    // or X-Session-Token header. Enriches the request context.
    // NEVER trusts client-supplied bank_id headers.
    // ============================================================
    // New credentials use an opaque session ID plus a random secret stored only as a hash.
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
               u.public_id as user_public_id
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN banks b ON s.bank_id = b.id
        LEFT JOIN organizations o ON o.id = s.organization_id
        WHERE s.secret_hash = ? AND s.revoked = 0
          AND datetime(s.expires_at) > datetime('now')
        `).bind(secretHash).first();
      }

      if (!session && legacyToken) {
        session = await env.DB.prepare(`
          SELECT s.*, u.username, u.full_name, u.email, u.status as user_status,
                 b.legal_name as bank_name, b.short_code as bank_code, b.status as bank_status,
                 b.public_id as bank_public_id, o.public_id as organization_public_id, o.name as organization_name,
                 u.public_id as user_public_id
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          LEFT JOIN banks b ON s.bank_id = b.id
          LEFT JOIN organizations o ON o.id = s.organization_id
          WHERE s.id = ? AND s.revoked = 0
            AND datetime(s.expires_at) > datetime('now')
        `).bind(legacyToken).first();

        if (session?.user_status === 'Active' && !session.secret_hash) {
          const newSecret = secureRandomHex(32);
          const newSessionId = randomId();
          const secretHash = await sha256Hex(newSecret);
          const ipAddress = request.headers.get('CF-Connecting-IP') || '';
          const userAgent = (request.headers.get('User-Agent') || '').slice(0, 250);
          const remembered = session.remembered === 1;
          const ttlDays = remembered ? 30 : SESSION_TTL_HOURS / 24;
          const rotated = await env.DB.prepare(`
            UPDATE sessions
            SET id = ?, secret_hash = ?, last_active = datetime('now'),
                expires_at = datetime('now', ?), device_name = ?, last_ip = ?,
                user_agent = ?, remembered = ?
            WHERE id = ? AND secret_hash IS NULL AND revoked = 0
          `).bind(
            newSessionId, secretHash, `+${ttlDays} days`, parseDeviceName(userAgent),
            ipAddress, userAgent, remembered ? 1 : 0, legacyToken
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
      if (session.scope === 'surge') {
        session.bank_id = 'bank-surge';
        session.bank_name = 'Surge Partner Bank';
        session.bank_code = 'SURGE';
        session.bank_public_id = 'bank-surge';
      }
      activeSession = session;
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

    // Require authentication — returns session or sends 401
    async function requireAuth() {
      const session = await resolveSession();
      if (!session) {
        throw new Response(JSON.stringify({ success: false, error: 'Authentication required. Please sign in.', code: 'UNAUTHENTICATED' }), { status: 401, headers: corsHeaders });
      }
      return session;
    }

    // Require bank-level authentication — scope must be 'bank' or 'surge'
    // All staff of Surge are also staff of the Surge Partner Bank
    async function requireBankAuth() {
      const session = await requireAuth();
      if (session.scope === 'surge') {
        session.bank_id = 'bank-surge';
        session.bank_name = 'Surge Partner Bank';
        session.bank_code = 'SURGE';
        session.bank_public_id = 'bank-surge';
        return session;
      }
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

    // Lock an account after repeated failures and throttle abusive source IPs.
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

    // Legacy context (used by non-auth-gated routes only)
    const actorName = null;
    const actorRole = null;

    try {
      const originError = enforceSameOriginMutation();
      if (originError) return originError;

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

      if (pathname === '/api/version' && method === 'GET') {
        return json({
          version: env.CF_VERSION_METADATA?.id || env.DEPLOYMENT_VERSION || 'unknown',
          deployedAt: env.CF_VERSION_METADATA?.timestamp || null
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

        if (!user) { await recordFailure('USER_NOT_FOUND'); return err('The username or password is incorrect.', 401); }
        let validPassword = false;
        if (user.password_hash) {
          if (String(user.password_hash).startsWith('pbkdf2-sha256$')) {
            validPassword = await verifyPassword(passwordValue, user.password_hash);
          } else {
            validPassword = equalSecret(String(user.password_hash), passwordValue);
            if (validPassword) {
              const upgradedHash = await hashPassword(passwordValue);
              await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?`)
                .bind(upgradedHash, user.id, user.password_hash).run();
            }
          }
        } else {
          await recordFailure('PASSWORD_NOT_CONFIGURED');
          return err('This account is not configured for sign-in yet. Contact the system owner to reset its password.', 403);
        }
        if (!validPassword) {
          await recordFailure('WRONG_PASSWORD');
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

        // Create session
        const sessionId = randomId();
        const sessionSecret = secureRandomHex(32);
        const secretHash = await sha256Hex(sessionSecret);
        const remembered = body.remember === true;
        const ttlDays = remembered ? 30 : SESSION_TTL_HOURS / 24;
        const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000).toISOString();
        const userAgent = (request.headers.get('User-Agent') || '').slice(0, 250);
        await env.DB.prepare(`
          INSERT INTO sessions (id, secret_hash, user_id, organization_id, bank_id, branch_id, role_code, scope,
            ip_address, last_ip, user_agent, device_name, remembered, created_at, expires_at, last_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
        `).bind(sessionId, secretHash, user.id, user.organization_id, user.bank_id || null, user.branch_id || null,
          user.role_code, user.scope, ipAddress,
          ipAddress, userAgent, parseDeviceName(userAgent), remembered ? 1 : 0, expiresAt).run();
        setSessionCookie(sessionSecret, remembered ? 30 * 24 * 3600 : SESSION_TTL_HOURS * 3600);

        // Record success, clear lockout & update last_login
        await env.DB.prepare(`INSERT INTO login_attempts (id, username, ip_address, success, attempted_at) VALUES (?, ?, ?, 1, datetime('now'))`)
          .bind(randomId(), uname, ipAddress).run();
        await clearUserLock(user.id);
        await env.DB.prepare(`UPDATE users SET last_login = datetime('now'), locked_until = NULL WHERE id = ?`).bind(user.id).run();
        await auditLog(user.full_name, user.role_code, user.org_name, 'LOGIN', 'User', user.public_id, `Signed in from ${ipAddress}`, null, null, user.id);

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

      // POST /api/auth/logout — Revoke session
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
          WHERE user_id = ? AND revoked = 0 AND datetime(expires_at) > datetime('now')
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

      // GET /api/auth/me — Validate session and return user profile
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
            .bind(await hashPassword(password.trim()), full_name || null, userId).run();
          await env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'PASSWORD_RESET' WHERE user_id = ? AND revoked = 0`).bind(userId).run();
        } else {
          userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(invite.bank_id).first();
          const username = invite.email.split('@')[0].replace(/[^a-z0-9.]/gi, '').toLowerCase();
          await env.DB.prepare(`
            INSERT INTO users (id, public_id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active', datetime('now'))
          `).bind(userId, randomId(), bank?.organization_id || 'org-surge', invite.bank_id, invite.branch_id || null,
            username, full_name || invite.full_name || invite.email.split('@')[0],
            invite.email, invite.role_code, await hashPassword(password.trim())).run();
        }

        // Add organization membership
        const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(invite.bank_id).first();
        if (bank) {
          await env.DB.prepare(`INSERT OR IGNORE INTO organization_members (id, user_id, organization_id, bank_id, branch_id, role_code, status, joined_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Active', datetime('now'), datetime('now'))`)
            .bind('om-' + Date.now(), userId, bank.organization_id, invite.bank_id, invite.branch_id || null, invite.role_code).run();
        }

        await env.DB.prepare(`UPDATE invitations SET status = 'Accepted', accepted_at = datetime('now') WHERE id = ?`).bind(invite.id).run();
        await auditLog(invite.email, invite.role_code, invite.bank_id, 'INVITATION_ACCEPTED', 'User', userId, `Account activated via invitation`, null, null, userId);
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

      const isAdminAlias =
        pathname === '/api/v1/banks' ||
        /^\/api\/v1\/banks\/[a-zA-Z0-9_-]+$/.test(pathname) ||
        pathname === '/api/v1/users' ||
        /^\/api\/v1\/users\/[a-zA-Z0-9_-]+(?:\/reset-password)?$/.test(pathname) ||
        pathname === '/api/v1/kyc' ||
        /^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+\/(review|approve|request-changes|reject|publish|unpublish|hold|release-hold|readiness)$/.test(pathname);
      const isAssetApi = /^\/api\/(v1|bank|admin)\/assets(?:\/[a-zA-Z0-9_-]+)?$/.test(pathname);
      const isAssetSubmitAction = /^\/api\/v1\/assets\/[a-zA-Z0-9_-]+\/submit$/.test(pathname);
      const isBankDataAlias = [
        '/api/v1/branches',
        '/api/v1/leads',
        '/api/v1/enquiries',
        '/api/v1/viewings',
        '/api/v1/offers',
        '/api/v1/invoices',
        '/api/v1/audit-logs'
      ].includes(pathname);
      if (pathname === '/api/admin' || pathname.startsWith('/api/admin/') || isAdminAlias) {
        await requireAdminAuth();
      } else if (pathname.startsWith('/api/bank/') || isAssetApi || isAssetSubmitAction || (isBankDataAlias && method === 'GET')) {
        await requireBankAuth();
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
        if (!username || !full_name || !email || !role_code) {
          return err('Username, full name, email, and role are required.', 400);
        }
        if (!password || password.trim().length < 8) {
          return err('An initial password of at least 8 characters is required.', 400);
        }

        const role = await env.DB.prepare(`SELECT scope FROM roles WHERE code = ?`).bind(role_code).first();
        if (!role) return err('The selected role does not exist.', 400);
        if (role.scope === 'surge') {
          const surgeBank = await env.DB.prepare(`SELECT id FROM banks WHERE id = 'bank-surge'`).first();
          if (!surgeBank) return err('Surge Partner Bank is not configured. Apply the bank setup migration first.', 503);
        }

        const existing = await env.DB.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).bind(username.trim().toLowerCase(), email.trim().toLowerCase()).first();
        if (existing) return err('A user with this username or email already exists.', 400);

        let orgId = 'org-surge';
        const assignedBankId = role.scope === 'surge' ? 'bank-surge' : bank_id || null;
        const assignedBranchId = role.scope === 'surge' ? null : branch_id || null;
        if (assignedBankId) {
          const bank = await env.DB.prepare(`SELECT organization_id FROM banks WHERE id = ?`).bind(assignedBankId).first();
          if (bank) orgId = bank.organization_id;
        }

        const userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const assignedPassword = password ? await hashPassword(password.trim()) : null;

        await env.DB.prepare(`
          INSERT INTO users (id, public_id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(userId, randomId(), orgId, assignedBankId, assignedBranchId, username.trim().toLowerCase(), full_name.trim(), email.trim().toLowerCase(), role_code, assignedPassword, mfa_enabled !== undefined ? (mfa_enabled ? 1 : 0) : 1).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'CREATE_USER', 'User', userId, `Created staff member ${full_name} (@${username})`);
        const createdUser = await env.DB.prepare(`SELECT u.*, b.legal_name as bank_name FROM users u LEFT JOIN banks b ON u.bank_id = b.id WHERE u.id = ?`).bind(userId).first();
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
        const parts = pathname.split('/');
        const id = parts[parts.length - 2];
        const body = await getBody();
        const { password } = body;
        if (!password || password.trim().length < 8) return err('Password must be at least 8 characters.', 400);

        const user = await env.DB.prepare(`SELECT username, full_name, public_id FROM users WHERE id = ?`).bind(id).first();
        if (!user) return err('User not found', 404);

        await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(await hashPassword(password.trim()), id).run();
        await env.DB.prepare(`UPDATE sessions SET revoked = 1, revoke_reason = 'PASSWORD_RESET' WHERE user_id = ? AND revoked = 0`).bind(id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RESET_PASSWORD', 'User', user.public_id, `Password reset for user @${user.username}`);
        return json({ success: true, message: `Password reset successfully for @${user.username}.` });
      }

      // 5 Statutory Gates Readiness Assessment (/api/admin/assets/:id/readiness)
      if (pathname.includes('/readiness') && (method === 'GET' || method === 'POST')) {
        const id = pathname.replace('/api/admin/assets/', '').replace('/api/v1/assets/', '').replace('/readiness', '');
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
        const verifiedBy = action === 'verify' ? activeSession?.full_name || actorName : null;
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
        if (!sid) return err('No bank organisation is associated with this account.', 403);
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingSurgeReview,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status NOT IN ('Rejected by Surge', 'Rejected', 'Rescinded', 'Cancelled')) as activeOffers
        `).bind(sid, sid, sid, sid, sid, sid, sid).first();

        const recentActivity = await env.DB.prepare(`
          SELECT * FROM audit_logs
          WHERE entity_type = 'Asset'
            AND entity_id IN (SELECT public_ref FROM assets WHERE bank_id = ?)
          ORDER BY created_at DESC LIMIT 8
        `).bind(sid).all();

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
        if (!session.bank_id) return err('No bank organisation is associated with this account.', 403);
        const query = `
          SELECT b.*, (SELECT COUNT(*) FROM assets WHERE branch_id = b.id) as asset_count
          FROM bank_branches b
          WHERE b.bank_id = ?
          ORDER BY b.region ASC, b.district ASC, b.name ASC
        `;
        const branches = await env.DB.prepare(query).bind(session.bank_id).all();
        return json({ success: true, count: branches.results.length, data: branches.results });
      }

      const photoUploadMatch = pathname.match(/^\/api\/(bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/photos\/upload$/);
      const documentUploadMatch = pathname.match(/^\/api\/(bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/documents\/upload$/);
      if ((photoUploadMatch || documentUploadMatch) && method === 'POST') {
        const isAdminRoute = (photoUploadMatch || documentUploadMatch)[1] === 'admin';
        const session = isAdminRoute ? await requireAdminAuth() : await requireBankAuth();
        const assetRef = decodeURIComponent((photoUploadMatch || documentUploadMatch)[2]);
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

        const form = await request.formData();
        const file = form.get('file');
        if (!file || typeof file.arrayBuffer !== 'function') return err('A file is required.', 400);

        const isPhoto = Boolean(photoUploadMatch);
        const maxSize = isPhoto ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size < 1 || file.size > maxSize) {
          return err(`File size must be between 1 byte and ${isPhoto ? '10MB' : '25MB'}.`, 413);
        }
        if (!(await isValidFile(file, isPhoto))) {
          return err(isPhoto
            ? 'Use a valid JPEG, PNG, or WebP image.'
            : 'Use a valid PDF, DOCX, JPEG, PNG, or WebP document.', 415);
        }

        const category = String(form.get('category') || (isPhoto ? 'Asset Photo' : 'Other')).trim().slice(0, 80);
        const isLegalInstrument = !isPhoto && category.toLowerCase() === 'legal instrument';
        const instrumentTypeInput = String(form.get('instrument_type') || form.get('instrumentType') || '').trim().slice(0, 80);
        const instrumentRef = String(form.get('instrument_ref') || '').trim().slice(0, 130);
        const caseNumber = String(form.get('case_number') || form.get('caseNumber') || '').trim().slice(0, 160) || instrumentRef;
        const court = String(form.get('court') || '').trim().slice(0, 160) || 'Not provided';
        const supportedInstrumentTypes = [
          'Court Judgment',
          'Default Notice',
          'Memorandum of Agreement',
          'Settlement Agreement',
          'Affidavit of Service'
        ];
        const instrumentType = supportedInstrumentTypes.find(
          supportedType => supportedType.toLowerCase() === instrumentTypeInput.toLowerCase()
        ) || '';
        if (isLegalInstrument && !instrumentType) {
          return err('Select a supported legal instrument type.', 400);
        }
        if (isLegalInstrument && !instrumentRef) {
          return err('Instrument reference number is required.', 400);
        }
        if (isLegalInstrument && !caseNumber) {
          return err('Case number is required.', 400);
        }
        let mimeType = String(file.type || '').split(';')[0].trim().toLowerCase();
        if (mimeType === 'image/jpg' || mimeType === 'image/pjpeg' || mimeType === 'image/jfif' || mimeType === 'image/x-citrix-jpeg') {
          mimeType = 'image/jpeg';
        } else if (mimeType === 'image/x-png') {
          mimeType = 'image/png';
        } else if (mimeType === 'image/x-webp') {
          mimeType = 'image/webp';
        } else if (mimeType === 'application/x-pdf' || mimeType === 'application/acrobat') {
          mimeType = 'application/pdf';
        }

        const name = String(file.name || '').toLowerCase();
        let sniffBytes = new Uint8Array(0);
        try {
          sniffBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
        } catch (e) {}

        if (sniffBytes.length >= 2 && sniffBytes[0] === 0xFF && sniffBytes[1] === 0xD8) {
          mimeType = 'image/jpeg';
        } else if (sniffBytes.length >= 8 && sniffBytes[0] === 0x89 && sniffBytes[1] === 0x50 && sniffBytes[2] === 0x4E && sniffBytes[3] === 0x47) {
          mimeType = 'image/png';
        } else if (sniffBytes.length >= 12 && String.fromCharCode(...sniffBytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...sniffBytes.slice(8, 12)) === 'WEBP') {
          mimeType = 'image/webp';
        } else if (sniffBytes.length >= 4 && sniffBytes[0] === 0x25 && sniffBytes[1] === 0x50 && sniffBytes[2] === 0x44 && sniffBytes[3] === 0x46) {
          mimeType = 'application/pdf';
        } else if (!mimeType || mimeType === 'application/octet-stream') {
          if (name.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (name.endsWith('.doc')) mimeType = 'application/msword';
          else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';
          else if (name.endsWith('.png')) mimeType = 'image/png';
          else if (name.endsWith('.webp')) mimeType = 'image/webp';
        }
        if (mimeType === 'application/x-pdf') mimeType = 'application/pdf';
        const bucketName = isPhoto ? 'surge-assets' : bucketNameForDocumentCategory(category);
        const bucket = isPhoto ? env.ASSETS_BUCKET : bucketForStoredDocument(bucketName);
        if (!bucket) return err(`R2 storage binding is missing for ${bucketName}.`, 503);

        if (isPhoto) {
          const count = await env.DB.prepare(`SELECT COUNT(*) as count FROM asset_images WHERE asset_id = ?`)
            .bind(asset.id).first();
          const imageLimit = Number(env.MAX_IMAGES_PER_ASSET || 20);
          if ((count?.count || 0) >= imageLimit) return err(`This asset already has the maximum of ${imageLimit} photos.`, 409);
        }

        const objectKey = `${isPhoto ? 'assets' : 'documents'}/${asset.id}/${crypto.randomUUID()}.${extensionForMime(mimeType) || 'bin'}`;
        const sizeLabel = file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;
        await bucket.put(objectKey, await file.arrayBuffer(), {
          httpMetadata: { contentType: mimeType },
          customMetadata: {
            assetId: asset.id,
            assetRef: asset.public_ref,
            category: category.slice(0, 80),
            uploadedBy: session.user_id,
            uploadedByName: session.full_name || '',
            bankId: session.bank_id || asset.bank_id || '',
            ...(form.get('valuer_name') ? { valuerName: String(form.get('valuer_name')).slice(0, 160) } : {}),
            ...(form.get('valuation_date') ? { valuationDate: String(form.get('valuation_date')).slice(0, 50) } : {}),
            ...(form.get('market_value') ? { marketValue: String(form.get('market_value')).slice(0, 50) } : {}),
            ...(form.get('forced_sale_value') ? { forcedSaleValue: String(form.get('forced_sale_value')).slice(0, 50) } : {}),
            ...(form.get('title') ? { documentTitle: String(form.get('title')).slice(0, 160) } : {})
          }
        });

        let committedDocumentId = null;
        let committedInstrumentId = null;
        let enforcementCaseId = null;
        try {
          if (isPhoto) {
            const imageId = 'img-' + crypto.randomUUID();
            const existing = await env.DB.prepare(`SELECT COUNT(*) as count FROM asset_images WHERE asset_id = ?`)
              .bind(asset.id).first();
            const sortOrder = (existing?.count || 0) + 1;
            const primary = form.get('is_primary') === '1' || sortOrder === 1 ? 1 : 0;
            const isExterior = form.get('is_exterior') === '1' ? 1 : 0;
            const imageUrl = new URL(
              `/api/marketplace/assets/${encodeURIComponent(asset.public_ref)}/images/${imageId}`,
              url.origin
            ).href;
            await env.DB.batch([
              ...(primary ? [env.DB.prepare(`UPDATE asset_images SET is_primary = 0 WHERE asset_id = ?`).bind(asset.id)] : []),
              env.DB.prepare(`
                INSERT INTO asset_images (id, asset_id, url, object_key, storage_bucket, caption, is_primary, is_exterior, sort_order, watermark_applied)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
              `).bind(imageId, asset.id, imageUrl, objectKey, bucketName, String(form.get('caption') || category).slice(0, 160), primary, isExterior, sortOrder),
              env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id)
            ]);
            await auditLog(session.full_name, session.role_code, session.bank_id || asset.bank_id, 'UPLOAD_PHOTO', 'AssetImage', imageId, `Uploaded photo for ${asset.public_ref}`);
            return json({ success: true, image_id: imageId, url: imageUrl, message: 'Photo uploaded successfully.' }, 201);
          }

          const documentId = 'doc-' + crypto.randomUUID();
          const publicDocId = 'doc-pub-' + crypto.randomUUID();
          committedDocumentId = documentId;
          const title = isLegalInstrument
            ? `${instrumentType} ${instrumentRef}`.slice(0, 160)
            : String(form.get('title') || file.name || category).trim().slice(0, 160);
          if (isLegalInstrument) {
            const caseId = 'case-' + crypto.randomUUID();
            const instrumentId = 'li-' + crypto.randomUUID();
            enforcementCaseId = caseId;
            committedInstrumentId = instrumentId;
            await env.DB.batch([
              env.DB.prepare(`
                INSERT INTO enforcement_cases (id, asset_id, case_number, court, status)
                VALUES (?, ?, ?, ?, 'Pending Verification')
                ON CONFLICT(asset_id) DO UPDATE SET
                  case_number = excluded.case_number,
                  court = excluded.court,
                  status = 'Pending Verification'
              `).bind(caseId, asset.id, caseNumber, court),
              env.DB.prepare(`
                INSERT INTO documents (id, public_id, asset_id, title, category, file_path, file_size, content_type, storage_bucket, verification_status, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', datetime('now'))
              `).bind(documentId, publicDocId, asset.id, title, category, objectKey, sizeLabel, mimeType, bucketName),
              env.DB.prepare(`
                INSERT INTO legal_instruments (
                  id, case_id, instrument_type, instrument_ref, court, verification_status, uploaded_by, notes
                )
                SELECT ?, id, ?, ?, ?, 'Pending', ?, ?
                FROM enforcement_cases WHERE asset_id = ?
              `).bind(instrumentId, instrumentType, instrumentRef, court, session.user_id, `Document ${documentId}`, asset.id),
              env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id)
            ]);
            const instrument = await env.DB.prepare(`
              SELECT li.id, li.instrument_type, li.instrument_ref, li.verification_status,
                li.uploaded_by, uploader.full_name AS uploaded_by_name,
                uploader.public_id AS uploaded_by_public_id, li.court,
                MAX(d.uploaded_at) AS uploaded_at
              FROM legal_instruments li
              JOIN enforcement_cases ec ON ec.id = li.case_id
              LEFT JOIN documents d ON d.asset_id = ec.asset_id
                AND d.category = 'Legal Instrument'
                AND d.title = li.instrument_type || ' ' || li.instrument_ref
              LEFT JOIN users uploader ON uploader.id = li.uploaded_by
              WHERE li.id = ?
              GROUP BY li.id
            `).bind(instrumentId).first();
            await auditLog(session.full_name, session.role_code, session.bank_id || asset.bank_id, 'UPLOAD_DOCUMENT', 'LegalInstrument', instrumentId, `Uploaded ${instrumentType} ${instrumentRef} for ${asset.public_ref}`);
            return json({
              success: true,
              document_id: documentId,
              instrument,
              category,
              message: 'Legal instrument uploaded and attached to the asset.'
            }, 201);
          }

          const isValuationReport = /valuation/i.test(category);
          await env.DB.batch([
            env.DB.prepare(`
              INSERT INTO documents (id, public_id, asset_id, title, category, file_path, file_size, content_type, storage_bucket, verification_status, uploaded_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', datetime('now'))
            `).bind(documentId, publicDocId, asset.id, title, category, objectKey, sizeLabel, mimeType, bucketName),
            env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id),
            ...(isValuationReport ? [
              env.DB.prepare(`
                UPDATE valuations SET document_id = ?, review_required = 1
                WHERE asset_id = ? AND (document_id IS NULL OR document_id = '')
              `).bind(documentId, asset.id)
            ] : [])
          ]);
          await auditLog(session.full_name, session.role_code, session.bank_id || asset.bank_id, 'UPLOAD_DOCUMENT', 'Document', documentId, `Uploaded ${category} for ${asset.public_ref}`);
          return json({ success: true, document_id: documentId, category, message: 'Document uploaded and queued for review.' }, 201);
        } catch (storageCommitError) {
          if (committedInstrumentId) {
            await env.DB.prepare(`DELETE FROM legal_instruments WHERE id = ?`).bind(committedInstrumentId).run();
          }
          if (committedDocumentId) {
            await env.DB.prepare(`DELETE FROM documents WHERE id = ?`).bind(committedDocumentId).run();
          }
          if (enforcementCaseId) {
            await env.DB.prepare(`
              DELETE FROM enforcement_cases
              WHERE id = ? AND NOT EXISTS (
                SELECT 1 FROM legal_instruments WHERE case_id = ?
              )
            `).bind(enforcementCaseId, enforcementCaseId).run();
          }
          await bucket.delete(objectKey);
          throw storageCommitError;
        }
      }

      // List Asset Photos
      const photoListMatch = pathname.match(/^\/api\/(bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/photos$/);
      if (photoListMatch && method === 'GET') {
        const session = await requireBankAuth();
        const assetRef = decodeURIComponent(photoListMatch[2]);
        const asset = session.scope === 'surge'
          ? await env.DB.prepare(`SELECT id, public_ref, bank_id FROM assets WHERE id = ? OR public_ref = ?`).bind(assetRef, assetRef).first()
          : await env.DB.prepare(`SELECT id, public_ref, bank_id FROM assets WHERE (id = ? OR public_ref = ?) AND bank_id = ?`).bind(assetRef, assetRef, session.bank_id).first();
        if (!asset) return err('Asset not found or access denied.', 404);

        const images = await env.DB.prepare(`SELECT * FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC, id ASC`).bind(asset.id).all();
        return json({ success: true, count: images.results.length, data: images.results });
      }

      // Delete Asset Photo
      const photoDeleteMatch = pathname.match(/^\/api\/(bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/photos\/([a-zA-Z0-9_-]+)$/);
      if (photoDeleteMatch && method === 'DELETE') {
        const session = await requireBankAuth();
        const assetRef = decodeURIComponent(photoDeleteMatch[2]);
        const photoId = decodeURIComponent(photoDeleteMatch[3]);
        const asset = session.scope === 'surge'
          ? await env.DB.prepare(`SELECT id, public_ref, bank_id FROM assets WHERE id = ? OR public_ref = ?`).bind(assetRef, assetRef).first()
          : await env.DB.prepare(`SELECT id, public_ref, bank_id FROM assets WHERE (id = ? OR public_ref = ?) AND bank_id = ?`).bind(assetRef, assetRef, session.bank_id).first();
        if (!asset) return err('Asset not found or access denied.', 404);

        const img = await env.DB.prepare(`SELECT * FROM asset_images WHERE id = ? AND asset_id = ?`).bind(photoId, asset.id).first();
        if (!img) return err('Photo not found.', 404);

        if (img.object_key && env.ASSETS_BUCKET) {
          try { await env.ASSETS_BUCKET.delete(img.object_key); } catch (e) {}
        }

        await env.DB.prepare(`DELETE FROM asset_images WHERE id = ?`).bind(photoId).run();
        if (img.is_primary) {
          const nextImg = await env.DB.prepare(`SELECT id FROM asset_images WHERE asset_id = ? LIMIT 1`).bind(asset.id).first();
          if (nextImg) {
            await env.DB.prepare(`UPDATE asset_images SET is_primary = 1 WHERE id = ?`).bind(nextImg.id).run();
          }
        }
        await env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, session.bank_id || asset.bank_id, 'DELETE_PHOTO', 'AssetImage', photoId, `Deleted photo on ${asset.public_ref}`);
        return json({ success: true, message: 'Photo deleted successfully.' });
      }

      const documentDownloadMatch = pathname.match(/^\/api\/(bank|admin)\/documents\/([a-zA-Z0-9_-]+)\/download$/);
      if (documentDownloadMatch && method === 'GET') {
        const isAdmin = documentDownloadMatch[1] === 'admin';
        const session = isAdmin ? await requireAdminAuth() : await requireBankAuth();
        const documentId = decodeURIComponent(documentDownloadMatch[2]);
        const doc = await env.DB.prepare(`
          SELECT d.*, a.bank_id, a.public_ref
          FROM documents d JOIN assets a ON a.id = d.asset_id
          WHERE d.id = ?
        `).bind(documentId).first();
        if (!doc || (!isAdmin && session.scope !== 'surge' && doc.bank_id !== session.bank_id)) {
          return err('Document not found or access denied.', 404);
        }
        const bucketName = doc.storage_bucket || 'surge-documents';
        const bucket = bucketForStoredDocument(bucketName);
        if (!bucket) return err(`R2 storage binding is missing for ${bucketName}.`, 503);
        const storedObject = await bucket.get(doc.file_path);
        if (!storedObject) return err('Stored document not found.', 404);

        const viewRequested = new URL(request.url).searchParams.get('view') === '1';
        const contentType = String(doc.content_type || '').toLowerCase();
        const inlineContentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
        const canViewInline = viewRequested && inlineContentTypes.has(contentType);
        await env.DB.prepare(`
          INSERT INTO document_access_logs (id, document_id, user_name, user_role, ip_address, access_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          'dal-' + crypto.randomUUID(),
          doc.id,
          session.full_name || session.username,
          session.role_code,
          request.headers.get('CF-Connecting-IP') || '',
          canViewInline ? 'VIEW' : 'DOWNLOAD'
        ).run();

        const extension = extensionForMime(String(doc.content_type || '').toLowerCase());
        const baseFilename = String(doc.title || 'document').replace(/["\r\n]/g, '_').slice(0, 120);
        const filename = extension && !baseFilename.toLowerCase().endsWith(`.${extension}`)
          ? `${baseFilename}.${extension}`
          : baseFilename;
        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', canViewInline ? contentType : 'application/octet-stream');
        headers.set('Content-Disposition', `${canViewInline ? 'inline' : 'attachment'}; filename="${filename}"`);
        headers.set('Cache-Control', 'private, no-store, max-age=0');
        headers.set('X-Content-Type-Options', 'nosniff');
        return new Response(storedObject.body, { headers });
      }

      // GET /api/bank/documents
      if ((pathname === '/api/bank/documents' || pathname === '/api/v1/documents') && method === 'GET') {
        const session = await requireBankAuth();
        const docs = session.scope === 'surge'
          ? await env.DB.prepare(`
              SELECT d.*, a.public_ref as asset_ref, a.title as asset_title,
                EXISTS(
                  SELECT 1 FROM title_records tr
                  WHERE tr.document_id = d.id AND tr.verification_status = 'Verified'
                ) AS title_verified,
                EXISTS(
                  SELECT 1 FROM valuations v
                  WHERE v.document_id = d.id AND v.status = 'Valid' AND v.review_required = 0
                ) AS valuation_verified,
                EXISTS(
                  SELECT 1 FROM legal_instruments li
                  WHERE li.notes = 'Document ' || d.id AND li.verification_status = 'Verified'
                ) AS instrument_verified
              FROM documents d
              JOIN assets a ON d.asset_id = a.id
              ORDER BY d.uploaded_at DESC
            `).all()
          : await env.DB.prepare(`
              SELECT d.*, a.public_ref as asset_ref, a.title as asset_title,
                EXISTS(
                  SELECT 1 FROM title_records tr
                  WHERE tr.document_id = d.id AND tr.verification_status = 'Verified'
                ) AS title_verified,
                EXISTS(
                  SELECT 1 FROM valuations v
                  WHERE v.document_id = d.id AND v.status = 'Valid' AND v.review_required = 0
                ) AS valuation_verified,
                EXISTS(
                  SELECT 1 FROM legal_instruments li
                  WHERE li.notes = 'Document ' || d.id AND li.verification_status = 'Verified'
                ) AS instrument_verified
              FROM documents d
              JOIN assets a ON d.asset_id = a.id
              WHERE a.bank_id = ?
              ORDER BY d.uploaded_at DESC
            `).bind(session.bank_id).all();
        return json({ success: true, count: docs.results.length, data: docs.results });
      }

      const bankDocumentDeleteMatch = pathname.match(/^\/api\/bank\/documents\/([a-zA-Z0-9_-]+)$/);
      if (bankDocumentDeleteMatch && method === 'DELETE') {
        const session = await requireBankAuth();
        const documentId = decodeURIComponent(bankDocumentDeleteMatch[1]);
        const document = await env.DB.prepare(`
          SELECT d.*, a.public_ref, a.bank_id
          FROM documents d
          JOIN assets a ON a.id = d.asset_id
          WHERE d.id = ? AND a.bank_id = ?
        `).bind(documentId, session.bank_id).first();
        if (!document) return err('Document not found or access denied.', 404);

        const references = await env.DB.prepare(`
          SELECT
            EXISTS(
              SELECT 1 FROM title_records
              WHERE document_id = ? AND verification_status = 'Verified'
            ) AS title_verified,
            EXISTS(
              SELECT 1 FROM valuations
              WHERE document_id = ? AND status = 'Valid' AND review_required = 0
            ) AS valuation_verified,
            EXISTS(
              SELECT 1 FROM legal_instruments
              WHERE notes = ? AND verification_status = 'Verified'
            ) AS instrument_verified
        `).bind(document.id, document.id, `Document ${document.id}`).first();
        if (references?.title_verified || references?.valuation_verified || references?.instrument_verified) {
          return err('This document supports a completed verification. Revoke that verification before deleting the document.', 409);
        }

        const bucket = bucketForStoredDocument(document.storage_bucket || 'surge-documents');
        if (!bucket) return err(`R2 storage binding is missing for ${document.storage_bucket || 'surge-documents'}.`, 503);
        try {
          await bucket.delete(document.file_path);
        } catch (error) {
          console.error('Document object deletion failed:', error);
          return err('The stored document could not be deleted. No document records were changed.', 502);
        }

        const instrument = await env.DB.prepare(`
          SELECT case_id FROM legal_instruments WHERE notes = ? AND verification_status != 'Verified'
        `).bind(`Document ${document.id}`).first();
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE title_records
            SET document_id = NULL, verification_status = 'Pending', verified_by = NULL,
              verified_at = NULL, notes = 'Supporting document removed by bank.'
            WHERE document_id = ?
          `).bind(document.id),
          env.DB.prepare(`
            UPDATE valuations
            SET document_id = NULL, status = 'Pending Review', review_required = 1,
              notes = 'Supporting report removed by bank.'
            WHERE document_id = ?
          `).bind(document.id),
          ...(instrument ? [
            env.DB.prepare(`
              UPDATE enforcement_cases SET status = 'Pending Verification' WHERE id = ?
            `).bind(instrument.case_id),
            env.DB.prepare(`
              DELETE FROM legal_instruments WHERE notes = ? AND verification_status != 'Verified'
            `).bind(`Document ${document.id}`)
          ] : []),
          env.DB.prepare(`DELETE FROM documents WHERE id = ? AND asset_id = ?`)
            .bind(document.id, document.asset_id),
          env.DB.prepare(`UPDATE assets SET updated_at = datetime('now') WHERE id = ?`)
            .bind(document.asset_id)
        ]);
        await auditLog(
          session.full_name,
          session.role_code,
          session.bank_name || session.bank_id,
          'DELETE_DOCUMENT',
          'Document',
          document.id,
          `Deleted ${document.category} "${document.title}" from ${document.public_ref}`
        );
        return json({ success: true, message: 'Document deleted successfully.' });
      }

      if (pathname === '/api/admin/documents' && method === 'GET') {
        await requireAdminAuth();
        const docs = await env.DB.prepare(`
          SELECT d.*, a.public_ref as asset_ref, a.title as asset_title, b.legal_name as bank_name
          FROM documents d
          JOIN assets a ON a.id = d.asset_id
          JOIN banks b ON b.id = a.bank_id
          ORDER BY d.uploaded_at DESC
        `).all();
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

      const publicImageMatch = pathname.match(/^\/api\/marketplace\/assets\/([^/]+)\/images\/([a-zA-Z0-9_-]+)$/);
      if (publicImageMatch && method === 'GET') {
        const publicRef = decodeURIComponent(publicImageMatch[1]);
        const imageId = decodeURIComponent(publicImageMatch[2]);
        const image = await env.DB.prepare(`
          SELECT i.object_key
          FROM asset_images i
          JOIN assets a ON a.id = i.asset_id
          WHERE (a.public_ref = ? OR a.id = ?) AND i.id = ?
        `).bind(publicRef, publicRef, imageId).first();
        if (!image?.object_key) return err('Image not found or currently unavailable.', 404);
        const object = await env.ASSETS_BUCKET.get(image.object_key);
        if (!object) return err('Stored image not found.', 404);

        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Content-Disposition', 'inline');
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        headers.set('X-Content-Type-Options', 'nosniff');
        if (object.httpEtag) headers.set('ETag', object.httpEtag);
        return new Response(object.body, { headers });
      }

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
        const session = await requireBankAuth();
        const callerBankId = session.bank_id;
        const callerBranchId = session.branch_id;

        if (method === 'GET') {
          const canViewAllBanks = session.scope === 'surge' && pathname === '/api/admin/assets';
          if (!canViewAllBanks && !callerBankId) {
            return err('No bank organisation is associated with this account.', 403);
          }
          let sql = `
            SELECT a.*, b.legal_name as bank_name, b.short_code as bank_code, br.name as branch_name,
              owner_bank.legal_name as owner_bank_name,
              (SELECT case_number FROM enforcement_cases WHERE asset_id = a.id LIMIT 1) as enforcement_case_number,
              (SELECT status FROM enforcement_cases WHERE asset_id = a.id LIMIT 1) as enforcement_case_status,
              (SELECT MAX(li.injunction_active) FROM legal_instruments li JOIN enforcement_cases ec ON ec.id = li.case_id WHERE ec.asset_id = a.id) as active_injunction,
              (SELECT certificate_number FROM title_records WHERE asset_id = a.id LIMIT 1) as title_certificate_number,
              (SELECT title_type FROM title_records WHERE asset_id = a.id LIMIT 1) as title_type,
              (SELECT registered_owner FROM title_records WHERE asset_id = a.id LIMIT 1) as title_registered_owner,
              (SELECT registry FROM title_records WHERE asset_id = a.id LIMIT 1) as title_registry,
              (SELECT perfection_status FROM title_records WHERE asset_id = a.id LIMIT 1) as title_perfection_status,
              (SELECT verification_status FROM title_records WHERE asset_id = a.id LIMIT 1) as title_verification_status,
              (SELECT document_id FROM title_records WHERE asset_id = a.id LIMIT 1) as title_document_id,
              (SELECT id FROM documents WHERE asset_id = a.id AND category = 'Title Deed' ORDER BY uploaded_at DESC LIMIT 1) as latest_title_document_id,
              (SELECT market_value FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_market_value,
              (SELECT forced_sale_value FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_forced_sale_value,
              (SELECT valuation_date FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_date,
              (SELECT expiry_date FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_expiry_date,
              (SELECT validity_period_days FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_validity_period_days,
              (SELECT valuer_name FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_valuer_name,
              (SELECT status FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_status,
              (SELECT review_required FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_review_required,
              (SELECT document_id FROM valuations WHERE asset_id = a.id ORDER BY valuation_date DESC, rowid DESC LIMIT 1) as valuation_document_id,
              (SELECT id FROM documents WHERE asset_id = a.id AND category = 'Valuation Report' ORDER BY uploaded_at DESC LIMIT 1) as latest_valuation_document_id,
              (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count,
              (SELECT COUNT(*) FROM documents WHERE asset_id = a.id) as document_count,
              (SELECT COUNT(*) FROM offers WHERE asset_id = a.id AND (${canViewAllBanks ? '1=1' : "surge_verified = 1 AND status != 'Rejected by Surge'"})) as offer_count
            FROM assets a
            JOIN banks b ON a.bank_id = b.id
            LEFT JOIN bank_branches br ON a.branch_id = br.id
            LEFT JOIN banks owner_bank ON owner_bank.id = a.owner_bank_id
          `;
          let stmt;
          if (!canViewAllBanks) {
            if (callerBankId === 'bank-surge' || session.scope === 'surge') {
              sql += ` WHERE (a.bank_id = 'bank-surge' OR a.owner_bank_id = 'bank-surge' OR a.ownership_type = 'surge' OR b.short_code = 'SURGE' OR b.id = 'bank-surge') ORDER BY a.updated_at DESC`;
              stmt = env.DB.prepare(sql);
            } else {
              sql += ` WHERE a.bank_id = ? ORDER BY a.updated_at DESC`;
              stmt = env.DB.prepare(sql).bind(callerBankId);
            }
          } else {
            sql += ` ORDER BY a.updated_at DESC`;
            stmt = env.DB.prepare(sql);
          }
          const assets = await stmt.all();
          const instrumentsByAsset = new Map();
          if (assets.results.length) {
            let instrumentSql = `
              SELECT ec.asset_id, li.id, li.instrument_type, li.instrument_ref,
                li.verification_status, li.court, li.injunction_active,
                (SELECT d.id FROM documents d WHERE d.asset_id = ec.asset_id
                  AND d.category = 'Legal Instrument'
                  AND d.title = li.instrument_type || ' ' || li.instrument_ref
                  ORDER BY d.uploaded_at DESC LIMIT 1) AS document_id,
                li.uploaded_by, uploader.full_name AS uploaded_by_name,
                uploader.public_id AS uploaded_by_public_id,
                MAX(d.uploaded_at) AS uploaded_at
              FROM legal_instruments li
              JOIN enforcement_cases ec ON ec.id = li.case_id
              JOIN assets a ON a.id = ec.asset_id
              LEFT JOIN users uploader ON uploader.id = li.uploaded_by
              LEFT JOIN documents d ON d.asset_id = ec.asset_id
                AND d.category = 'Legal Instrument'
                AND d.title = li.instrument_type || ' ' || li.instrument_ref
            `;
            const instrumentStmt = canViewAllBanks
              ? env.DB.prepare(`${instrumentSql} GROUP BY li.id ORDER BY uploaded_at DESC`)
              : (callerBankId === 'bank-surge' || session.scope === 'surge')
                ? env.DB.prepare(`${instrumentSql} WHERE (a.bank_id = 'bank-surge' OR a.owner_bank_id = 'bank-surge' OR a.ownership_type = 'surge') GROUP BY li.id ORDER BY uploaded_at DESC`)
                : env.DB.prepare(`${instrumentSql} WHERE a.bank_id = ? GROUP BY li.id ORDER BY uploaded_at DESC`).bind(callerBankId);
            const instrumentRows = await instrumentStmt.all();
            for (const instrument of instrumentRows.results) {
              const assetInstruments = instrumentsByAsset.get(instrument.asset_id) || [];
              assetInstruments.push(instrument);
              instrumentsByAsset.set(instrument.asset_id, assetInstruments);
            }
          }
          return json({
            success: true,
            count: assets.results.length,
            data: assets.results.map(asset => ({
              ...asset,
              legal_instruments: instrumentsByAsset.get(asset.id) || []
            }))
          });
        }

        if (method === 'POST') {
          const body = await getBody();
          const actorName = session.full_name || session.username || 'Bank Officer';
          const actorRole = session.role_code || 'Staff';
          const assetBankId = session.scope === 'surge'
            ? 'bank-surge'
            : callerBankId;
          if (!assetBankId) return err('A bank must be selected before creating an asset.', 400);
          const assetBank = await env.DB.prepare(`SELECT id FROM banks WHERE id = ?`).bind(assetBankId).first();
          if (!assetBank) return err('The selected bank is not configured.', 400);
          const ownershipType = session.scope === 'surge' ? body.ownershipType : 'bank';
          if (!['bank', 'individual', 'surge'].includes(ownershipType)) {
            return err('Choose whether the asset belongs to a bank, an individual, or Surge Solutions.', 400);
          }
          const ownerBankId = session.scope !== 'surge'
            ? assetBankId
            : ownershipType === 'bank' ? body.ownerBankId : null;
          const ownerName = session.scope !== 'surge'
            ? null
            : ownershipType === 'individual' ? String(body.ownerName || '').trim()
              : ownershipType === 'surge' ? 'Surge Solutions' : null;
          if (ownershipType === 'bank') {
            if (!ownerBankId) return err('Select the bank that owns the asset.', 400);
            const ownerBank = await env.DB.prepare(`SELECT id FROM banks WHERE id = ?`).bind(ownerBankId).first();
            if (!ownerBank) return err('The selected owner bank does not exist.', 400);
          }
          if (ownershipType === 'individual' && !ownerName) {
            return err('Enter the individual owner’s name.', 400);
          }
          const branchId = body.branchId || (session.scope === 'surge' ? null : callerBranchId) || null;
          if (branchId) {
            const branch = await env.DB.prepare(`SELECT id FROM bank_branches WHERE id = ? AND bank_id = ?`)
              .bind(branchId, assetBankId).first();
            if (!branch) return err('The selected branch does not belong to the asset’s managing bank.', 400);
          }
          const id = 'a-' + Date.now();
          const year = new Date().getFullYear();
          const cat = body.categoryCode || 'House';
          const catPrefix = cat === 'House' ? 'RE' : cat === 'Vehicle' ? 'VH' : cat === 'Equipment' ? 'EQ' : 'AS';

          const countRow = await env.DB.prepare(`SELECT public_ref FROM assets WHERE public_ref LIKE ? ORDER BY public_ref DESC`).bind(`SS-${catPrefix}-${year}-%`).all();
          let maxSeq = 241;
          for (const row of (countRow?.results || [])) {
            const m = String(row.public_ref || '').match(/-(\d+)$/);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > maxSeq) maxSeq = num;
            }
          }
          let nextSeq = maxSeq + 1;
          let publicRef = `SS-${catPrefix}-${year}-${String(nextSeq).padStart(5, '0')}`;
          while (await env.DB.prepare('SELECT 1 FROM assets WHERE public_ref = ?').bind(publicRef).first()) {
            nextSeq++;
            publicRef = `SS-${catPrefix}-${year}-${String(nextSeq).padStart(5, '0')}`;
          }

          await env.DB.prepare(`
            INSERT INTO assets (
              id, bank_id, ownership_type, owner_bank_id, owner_name, branch_id, public_ref, internal_bank_ref, category_code, asset_type,
              title, description, region, district, town, public_location, exact_address,
              reserve_price, minimum_offer, show_reserve_publicly, occupancy_status, land_guard_risk,
              status, legal_hold_active, review_required, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 0, 0, ?, datetime('now'), datetime('now'))
          `).bind(
            id,
            assetBankId,
            ownershipType,
            ownerBankId,
            ownerName,
            branchId,
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
          const created = await env.DB.prepare(`
            SELECT a.*, b.legal_name as bank_name, owner_bank.legal_name as owner_bank_name
            FROM assets a
            JOIN banks b ON b.id = a.bank_id
            LEFT JOIN banks owner_bank ON owner_bank.id = a.owner_bank_id
            WHERE a.id = ?
          `).bind(id).first();
          return json({ success: true, data: created }, 201);
        }
      }

      // Single Asset Detail
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        const session = await requireBankAuth();
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`
          SELECT a.*, b.legal_name as bank_name, b.short_code as bank_code, br.name as branch_name,
                 owner_bank.legal_name as owner_bank_name
          FROM assets a
          JOIN banks b ON a.bank_id = b.id
          LEFT JOIN bank_branches br ON a.branch_id = br.id
          LEFT JOIN banks owner_bank ON owner_bank.id = a.owner_bank_id
          WHERE a.id = ? OR a.public_ref = ?
        `).bind(id, id).first();

        if (!asset) return err('Asset not found', 404);
        if (!(session.scope === 'surge' && pathname.startsWith('/api/admin/')) && asset.bank_id !== session.bank_id) {
          return err('Asset not found or access denied.', 404);
        }

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
        const session = await requireBankAuth();
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (!(session.scope === 'surge' && pathname.startsWith('/api/admin/')) && asset.bank_id !== session.bank_id) {
          return err('Asset not found or access denied.', 404);
        }

        const body = await getBody();
        if (session.scope !== 'surge' && body.status !== undefined) {
          return err('Only Surge administrators can change an asset status.', 403);
        }
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
        const fieldLabels = {
          categoryCode: 'Category', assetType: 'Property Type', title: 'Title',
          description: 'Description', region: 'Region', district: 'District', town: 'Town',
          publicLocation: 'Location', exactAddress: 'Exact Address', reservePrice: 'Reserve Price',
          minimumOffer: 'Minimum Offer', showReservePublicly: 'Public Pricing',
          occupancyStatus: 'Occupancy Status', landGuardRisk: 'Land Guard Risk',
          beds: 'Bedrooms', baths: 'Bathrooms', internalBankRef: 'Internal Reference',
          branchId: 'Branch Allocation', ownerBankId: 'Owning Bank', ownerName: 'Asset Owner'
        };
        const updatedFields = Object.keys(body).map(k => fieldLabels[k] || k);
        let updateSummary = 'Updated asset details';
        if (updatedFields.length <= 3) {
          updateSummary = `Updated ${updatedFields.join(', ')}`;
        } else if (body.reservePrice !== undefined || body.minimumOffer !== undefined) {
          updateSummary = 'Updated property details, location, and reserve pricing';
        } else {
          updateSummary = 'Updated property and location details';
        }
        await auditLog(actorName, actorRole, session.bank_name || 'Bank', 'UPDATE', 'Asset', asset.public_ref, updateSummary);

        const updated = await env.DB.prepare(`SELECT * FROM assets WHERE id = ?`).bind(asset.id).first();
        return json({ success: true, data: updated });
      }

      // Delete Asset
      // - Surge Admin can delete any asset (draft, published, or requested)
      // - Bank staff can delete unpublished assets (status !== 'Live')
      // - For published assets (status === 'Live'), bank staff must submit a deletion request to Surge Admin
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+$/) && method === 'DELETE') {
        const session = await requireBankAuth();
        const id = pathname.split('/').pop();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        const isSurgeAdmin = session.scope === 'surge';
        if (!isSurgeAdmin && asset.bank_id !== session.bank_id) {
          return err('Asset not found or access denied.', 404);
        }

        if (!isSurgeAdmin && asset.status === 'Live') {
          return err('Published assets cannot be deleted directly by bank staff. Please submit a deletion request to Surge Admin.', 400);
        }

        await env.DB.prepare(`DELETE FROM asset_images WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM documents WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM title_records WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM valuations WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM enforcement_cases WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM offers WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM viewings WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM leads WHERE asset_id = ?`).bind(asset.id).run();
        await env.DB.prepare(`DELETE FROM assets WHERE id = ?`).bind(asset.id).run();

        const actorTitle = isSurgeAdmin ? 'Surge Admin' : 'Bank Staff';
        await auditLog(actorName, actorRole, isSurgeAdmin ? 'Surge' : 'Bank', 'DELETE', 'Asset', asset.public_ref, `Asset ${asset.public_ref} (${asset.status}) deleted by ${actorTitle}`);
        return json({ success: true, message: `Asset ${asset.public_ref} deleted successfully.` });
      }

      // Bank Request Deletion for Published Asset
      if (pathname.match(/^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+\/request-deletion$/) && method === 'POST') {
        const session = await requireBankAuth();
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (session.scope !== 'surge' && asset.bank_id !== session.bank_id) {
          return err('Asset not found or access denied.', 404);
        }

        const body = await getBody();
        const reason = body?.reason || 'Bank requested deletion of published listing.';

        await env.DB.prepare(`
          UPDATE assets
          SET deletion_requested = 1,
              deletion_request_reason = ?,
              deletion_requested_by = ?,
              deletion_requested_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(reason, actorName, asset.id).run();

        await auditLog(actorName, actorRole, 'Bank', 'DELETION_REQUEST', 'Asset', asset.public_ref, `Bank requested deletion: ${reason}`);
        return json({ success: true, message: 'Deletion request submitted to Surge Admin for review.' });
      }

      // Surge Admin Reject / Dismiss Deletion Request
      if (pathname.match(/^\/api\/(admin|v1)\/assets\/[a-zA-Z0-9_-]+\/reject-deletion-request$/) && method === 'POST') {
        const session = await requireAdminAuth();
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`
          UPDATE assets
          SET deletion_requested = 0,
              deletion_request_reason = NULL,
              deletion_requested_by = NULL,
              deletion_requested_at = NULL,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(asset.id).run();

        await auditLog(actorName, actorRole, 'Surge', 'REJECT_DELETION_REQUEST', 'Asset', asset.public_ref, `Surge Admin dismissed bank deletion request`);
        return json({ success: true, message: 'Deletion request dismissed. Listing remains active.' });
      }

      // Asset Workflow Actions: submit, approve, reject, publish, hold, release-hold
      if (pathname.includes('/submit') && method === 'POST') {
        const session = await requireBankAuth();
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.bank_id !== session.bank_id && !(session.scope === 'surge' && asset.bank_id === 'bank-surge')) {
          return err('Asset not found or access denied.', 404);
        }
        if (asset.legal_hold_active) return err('Legal hold is active on this asset.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Submitted by Bank', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Bank', 'SUBMIT', 'Asset', asset.public_ref, 'Submitted for review');
        return json({ success: true, message: 'Asset submitted for Surge review.' });
      }

      if (pathname.includes('/review') && !pathname.includes('/readiness') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (!['Submitted by Bank', 'Submitted', 'Under Review', 'Changes Required'].includes(asset.status)) {
          return err('Only submitted assets can enter review.', 400);
        }

        await env.DB.prepare(`UPDATE assets SET status = 'Under Review', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'START_REVIEW', 'Asset', asset.public_ref, 'Review started', { status: asset.status }, { status: 'Under Review' });
        return json({ success: true, message: 'Review started.' });
      }

      if (pathname.includes('/approve') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.status !== 'Under Review') return err('Only assets under review can be approved.', 400);
        const readiness = await getAssetReadiness(asset);
        if (!readiness.allPass) return err('Approval is blocked because one or more statutory readiness gates have not passed.', 400, { gates: readiness.gates });

        await env.DB.prepare(`UPDATE assets SET status = 'Approved', review_required = 0, review_required_reason = NULL, updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'APPROVE', 'Asset', asset.public_ref, 'Asset approved', { status: asset.status }, { status: 'Approved' });
        return json({ success: true, message: 'Asset approved.' });
      }

      if (pathname.includes('/request-changes') && method === 'POST') {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'Changes required';
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.status !== 'Under Review') return err('Only assets under review can be returned for changes.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Changes Required', review_required = 1, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'REQUEST_CHANGES', 'Asset', asset.public_ref, `Changes requested: ${reason}`, { status: asset.status }, { status: 'Changes Required', reason });
        return json({ success: true, message: 'Changes requested successfully.' });
      }

      if (pathname.includes('/reject') && method === 'POST') {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.status !== 'Under Review') return err('Only assets under review can be rejected.', 400);

        const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'Rejected by Surge review.';
        await env.DB.prepare(`UPDATE assets SET status = 'Rejected', review_required = 0, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'REJECT', 'Asset', asset.public_ref, `Asset rejected: ${reason}`, { status: asset.status }, { status: 'Rejected', reason });
        return json({ success: true, message: 'Asset rejected.' });
      }

      if (pathname.endsWith('/publish') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (!['Approved', 'Submitted', 'Submitted by Bank', 'Under Review'].includes(asset.status)) {
          return err('This asset cannot be published in its current state.', 400);
        }
        const readiness = await getAssetReadiness(asset);
        if (!readiness.allPass) return err('Publication is blocked because one or more statutory readiness gates have not passed.', 400, { gates: readiness.gates });

        await env.DB.prepare(`UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'PUBLISH', 'Asset', asset.public_ref, 'Published to Marketplace', { status: asset.status }, { status: 'Live' });
        return json({ success: true, message: 'Asset published to Marketplace.' });
      }

      if (pathname.endsWith('/unpublish') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.status !== 'Live') return err('Only published assets can be unpublished.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'UNPUBLISH', 'Asset', asset.public_ref, 'Unpublished from Marketplace');
        return json({ success: true, message: 'Asset unpublished.' });
      }

      if (pathname.endsWith('/hold') && method === 'POST') {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        if (!reason) return err('A reason is required to place a legal hold.', 400);
        if (asset.legal_hold_active) return err('A legal hold is already active on this asset.', 400);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 1, legal_hold_reason = ?, status = 'Legal Hold', updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'LEGAL_HOLD', 'Asset', asset.public_ref, `Legal hold imposed: ${reason}`, { status: asset.status, legal_hold_active: !!asset.legal_hold_active }, { status: 'Legal Hold', legal_hold_active: true, reason });
        return json({ success: true, message: 'Legal hold placed.' });
      }

      if (pathname.includes('/release-hold') && method === 'POST') {
        const id = pathname.split('/')[4];
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (!asset.legal_hold_active) return err('No legal hold is active on this asset.', 400);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 0, legal_hold_reason = NULL, status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RELEASE_HOLD', 'Asset', asset.public_ref, 'Legal hold released', { status: asset.status, legal_hold_active: true }, { status: 'Approved', legal_hold_active: false });
        return json({ success: true, message: 'Legal hold released.' });
      }

      // =========================================================================
      // 6. ENQUIRIES, LEADS, VIEWINGS, OFFERS, INVOICES & AUDIT LOGS
      // =========================================================================

      // Enquiries & Leads
      if (['/api/v1/leads', '/api/v1/enquiries', '/api/bank/enquiries', '/api/marketplace/enquiries', '/api/public/enquiries'].includes(pathname)) {
        if (method === 'GET') {
          const session = await requireBankAuth();
          const canViewAllBanks = session.scope === 'surge' && url.searchParams.get('scope') === 'all';
          if (!canViewAllBanks && !session.bank_id) return err('No bank organisation is associated with this account.', 403);
          const query = `
            SELECT l.*, a.public_ref as asset_ref, a.title as asset_title
            FROM leads l
            JOIN assets a ON l.asset_id = a.id
            ${canViewAllBanks ? '' : 'WHERE a.bank_id = ?'}
            ORDER BY l.created_at DESC
          `;
          const leads = canViewAllBanks
            ? await env.DB.prepare(query).all()
            : await env.DB.prepare(query).bind(session.bank_id).all();
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
          const session = await requireBankAuth();
          const canViewAllBanks = session.scope === 'surge' && url.searchParams.get('scope') === 'all';
          if (!canViewAllBanks && !session.bank_id) return err('No bank organisation is associated with this account.', 403);
          const query = `
            SELECT v.*, a.public_ref as asset_ref, a.public_location, a.asset_type
            FROM viewings v
            JOIN assets a ON v.asset_id = a.id
            ${canViewAllBanks ? '' : 'WHERE a.bank_id = ?'}
            ORDER BY v.created_at DESC
          `;
          const viewings = canViewAllBanks
            ? await env.DB.prepare(query).all()
            : await env.DB.prepare(query).bind(session.bank_id).all();
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
          const session = await requireBankAuth();
          const canViewAllBanks = session.scope === 'surge' && url.searchParams.get('scope') === 'all';
          if (!canViewAllBanks && !session.bank_id) return err('No bank organisation is associated with this account.', 403);
          const query = canViewAllBanks ? `
            SELECT o.*, a.public_ref as asset_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name
            FROM offers o
            JOIN assets a ON o.asset_id = a.id
            JOIN banks b ON a.bank_id = b.id
            ORDER BY o.created_at DESC
          ` : `
            SELECT o.id, o.offer_ref, o.asset_id, o.buyer_name, o.amount, o.validity_date, o.conditions,
                   o.status, o.below_reserve, o.notes, o.surge_verified, o.surge_verified_at,
                   o.created_at, o.updated_at,
                   a.public_ref as asset_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name
            FROM offers o
            JOIN assets a ON o.asset_id = a.id
            JOIN banks b ON a.bank_id = b.id
            WHERE a.bank_id = ? AND o.status != 'Rejected by Surge'
            ORDER BY o.created_at DESC
          `;
          const offers = canViewAllBanks
            ? await env.DB.prepare(query).all()
            : await env.DB.prepare(query).bind(session.bank_id).all();
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
            INSERT INTO offers (id, offer_ref, asset_id, buyer_name, amount, validity_date, conditions, status, below_reserve, notes, surge_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Surge Verification', ?, ?, 0, datetime('now'), datetime('now'))
          `).bind(
            offerId, offerRef, asset.id, name, Number(amount), validityDate,
            paymentMethod || 'Cash / Direct Bank Transfer',
            Number(amount) < asset.reserve_price ? 1 : 0,
            `Ghana Card: ${ghanaCard || 'Provided'} · Contact: ${phone} (${email || ''})`
          ).run();

          await auditLog(name, 'Public Buyer', 'Public', 'OFFER_SUBMISSION', 'Offer', offerRef, `Purchase offer of GHS ${Number(amount).toLocaleString()} submitted on ${asset.public_ref} (awaiting Surge review)`);
          return json({ success: true, reference: offerRef, message: 'Formal offer submitted. Awaiting Surge Solutions verification before bank review.' }, 201);
        }
      }

      // Surge Admin Verify Offer for Bank Review
      if (pathname.match(/^\/api\/(admin|v1)\/offers\/[a-zA-Z0-9_-]+\/verify$/) && method === 'POST') {
        const session = await requireAdminAuth();
        const offerId = pathname.split('/')[4];
        const offer = await env.DB.prepare(`SELECT o.*, a.public_ref as asset_ref, a.bank_id FROM offers o JOIN assets a ON o.asset_id = a.id WHERE o.id = ? OR o.offer_ref = ?`).bind(offerId, offerId).first();
        if (!offer) return err('Offer not found', 404);

        await env.DB.prepare(`
          UPDATE offers
          SET status = 'Under Bank Review',
              surge_verified = 1,
              surge_verified_by = ?,
              surge_verified_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(actorName, offer.id).run();

        await auditLog(actorName, actorRole, 'Surge', 'OFFER_VERIFY', 'Offer', offer.offer_ref, `Offer verified by Surge Admin and released to Recovery Bank for review`);
        return json({ success: true, message: `Offer ${offer.offer_ref} verified and released to the partner bank for review.` });
      }

      // Surge Admin Reject Offer
      if (pathname.match(/^\/api\/(admin|v1)\/offers\/[a-zA-Z0-9_-]+\/reject$/) && method === 'POST') {
        const session = await requireAdminAuth();
        const offerId = pathname.split('/')[4];
        const body = await getBody();
        const reason = body?.reason || 'Offer rejected during Surge qualification.';

        const offer = await env.DB.prepare(`SELECT o.*, a.public_ref as asset_ref FROM offers o JOIN assets a ON o.asset_id = a.id WHERE o.id = ? OR o.offer_ref = ?`).bind(offerId, offerId).first();
        if (!offer) return err('Offer not found', 404);

        await env.DB.prepare(`
          UPDATE offers
          SET status = 'Rejected by Surge',
              rejection_reason = ?,
              surge_verified = 0,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(reason, offer.id).run();

        await auditLog(actorName, actorRole, 'Surge', 'OFFER_REJECT', 'Offer', offer.offer_ref, `Offer rejected by Surge Admin: ${reason}`);
        return json({ success: true, message: `Offer ${offer.offer_ref} rejected.` });
      }

      // Offer Decisions & Rescission (Bank accepts, declines, or rescinds verified offers)
      if ((pathname.includes('/decide') || pathname.endsWith('/rescind')) && method === 'POST') {
        const session = await requireBankAuth();
        const offerId = pathname.split('/')[4];
        const body = await getBody();
        const decision = pathname.endsWith('/rescind') ? 'Rescinded' : (body?.decision || 'Rescinded');
        const reason = body?.reason || '';

        const offer = await env.DB.prepare(`SELECT o.*, a.public_ref as asset_ref, a.bank_id, a.status as asset_status FROM offers o JOIN assets a ON o.asset_id = a.id WHERE o.id = ? OR o.offer_ref = ?`).bind(offerId, offerId).first();
        if (!offer) return err('Offer not found', 404);

        if (session.scope !== 'surge' && offer.bank_id !== session.bank_id) {
          return err('Access denied to this offer.', 403);
        }
        if (session.scope !== 'surge' && !offer.surge_verified) {
          return err('This offer has not yet been reviewed and verified by Surge Admin.', 400);
        }

        if (decision === 'Rescinded') {
          await env.DB.prepare(`UPDATE offers SET status = 'Rescinded', updated_at = datetime('now') WHERE id = ?`).bind(offer.id).run();
          // If asset was marked 'Sold', restore it back to 'Live'
          if (offer.asset_status === 'Sold') {
            await env.DB.prepare(`UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?`).bind(offer.asset_id).run();
          }
          // Cancel any commission invoice generated for this offer
          await env.DB.prepare(`UPDATE invoices SET status = 'Cancelled' WHERE commission_id = ? AND status = 'Issued'`).bind(offer.id).run();

          await auditLog(actorName, actorRole, session.scope === 'surge' ? 'Surge' : 'Bank', 'OFFER_RESCIND', 'Offer', offer.offer_ref, `Offer acceptance rescinded by Bank${reason ? `: ${reason}` : ''}. Asset restored to Live. Billing invoice cancelled.`);
          return json({ success: true, message: `Offer ${offer.offer_ref} rescinded. Asset listing restored to Live status.` });
        }

        await env.DB.prepare(`UPDATE offers SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(decision, offer.id).run();
        if (decision === 'Accepted') {
          await env.DB.prepare(`UPDATE assets SET status = 'Sold', updated_at = datetime('now') WHERE id = ?`).bind(offer.asset_id).run();

          // Generate Success Fee & Transaction Billing Invoice for Reports & Billing
          const commRate = Number(env.DEFAULT_COMMISSION_RATE || 4.0);
          const commAmount = Math.round(Number(offer.amount) * (commRate / 100));
          const invCountRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM invoices`).first();
          const invNumber = 'INV-2026-' + String((invCountRow ? invCountRow.c : 0) + 101).padStart(5, '0');
          const invId = 'inv-' + Date.now();
          const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
          const issueDate = new Date().toISOString().split('T')[0];

          // Check if invoice already exists for this offer to prevent duplicates
          const existingInv = await env.DB.prepare(`SELECT id FROM invoices WHERE commission_id = ?`).bind(offer.id).first();
          if (!existingInv) {
            await env.DB.prepare(`
              INSERT INTO invoices (id, invoice_number, commission_id, bank_id, amount, description, issue_date, due_date, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Issued', datetime('now'))
            `).bind(
              invId, invNumber, offer.id, offer.bank_id, commAmount,
              `Surge Solutions ${commRate}% Success Fee — Asset ${offer.asset_ref} (Accepted Offer ${offer.offer_ref} by ${offer.buyer_name})`,
              issueDate, dueDate
            ).run();

            await auditLog(actorName, actorRole, session.scope === 'surge' ? 'Surge' : 'Bank', 'INVOICE_GENERATED', 'Invoice', invNumber, `Commission invoice ${invNumber} of GHS ${commAmount.toLocaleString()} generated for ${offer.asset_ref}`);
          }
        }

        await auditLog(actorName, actorRole, session.scope === 'surge' ? 'Surge' : 'Bank', 'OFFER_DECISION', 'Offer', offer.offer_ref, `Decision: ${decision}`);
        return json({ success: true, message: `Offer ${decision.toLowerCase()}. Reports & Billing updated with transaction success fee.` });
      }

      // Invoices
      if (['/api/v1/invoices', '/api/admin/invoices', '/api/bank/invoices'].includes(pathname)) {
        const session = await requireBankAuth();
        const canViewAllBanks = session.scope === 'surge' && url.searchParams.get('scope') === 'all';
        if (!canViewAllBanks && !session.bank_id) return err('No bank organisation is associated with this account.', 403);
        const query = `
          SELECT i.*, b.legal_name as bank_name, b.short_code as bank_code
          FROM invoices i
          JOIN banks b ON i.bank_id = b.id
          ${canViewAllBanks ? '' : 'WHERE i.bank_id = ?'}
          ORDER BY i.created_at DESC
        `;
        const invoices = canViewAllBanks
          ? await env.DB.prepare(query).all()
          : await env.DB.prepare(query).bind(session.bank_id).all();
        return json({ success: true, count: invoices.results.length, data: invoices.results });
      }

      // Audit Logs — Track activity related to assets and documents
      // Bank audit logs are isolated to that bank and its assets; hash codes are stripped
      if (['/api/v1/audit-logs', '/api/admin/audit-logs', '/api/bank/audit-logs'].includes(pathname)) {
        const session = pathname === '/api/admin/audit-logs'
          ? await requireAdminAuth()
          : await requireBankAuth();

        const canViewAllBanks = session.scope === 'surge' && (pathname === '/api/admin/audit-logs' || url.searchParams.get('scope') === 'all');
        const targetBankId = url.searchParams.get('bank_id') || session.bank_id || 'bank-surge';

        let logs;
        if (canViewAllBanks) {
          logs = await env.DB.prepare(`
            SELECT a.id, a.actor_name, a.actor_role, a.organization, a.action_type, a.entity_type,
                   a.entity_id, a.delta_summary, a.old_values, a.new_values, a.created_at,
                   u.public_id AS actor_public_id
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.actor_user_id
            WHERE a.entity_type IN ('Asset', 'Document', 'TitleRecord', 'Valuation', 'LegalInstrument', 'AssetImage', 'Offer', 'Invoice', 'EnforcementCase')
            ORDER BY a.created_at DESC LIMIT 150
          `).all();
        } else {
          // ISOLATED strictly to that bank and its assets
          logs = await env.DB.prepare(`
            SELECT a.id, a.actor_name, a.actor_role, a.organization, a.action_type, a.entity_type,
                   a.entity_id, a.delta_summary, a.old_values, a.new_values, a.created_at,
                   u.public_id AS actor_public_id
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.actor_user_id
            LEFT JOIN assets ast ON (a.entity_id = ast.id OR a.entity_id = ast.public_ref)
            WHERE a.entity_type IN ('Asset', 'Document', 'TitleRecord', 'Valuation', 'LegalInstrument', 'AssetImage', 'Offer', 'Invoice', 'EnforcementCase', 'User', 'Session', 'Branch')
              AND (
                ast.bank_id = ?
                OR u.bank_id = ?
                OR a.organization = ?
                OR a.organization = (SELECT legal_name FROM banks WHERE id = ?)
                OR a.organization = (SELECT short_code FROM banks WHERE id = ?)
                OR a.entity_id IN (SELECT public_ref FROM assets WHERE bank_id = ?)
                OR a.entity_id IN (SELECT id FROM assets WHERE bank_id = ?)
                OR a.entity_id IN (SELECT offer_ref FROM offers o JOIN assets oa ON o.asset_id = oa.id WHERE oa.bank_id = ?)
                OR a.entity_id IN (SELECT invoice_number FROM invoices WHERE bank_id = ?)
                OR EXISTS (SELECT 1 FROM assets b_ast WHERE b_ast.bank_id = ? AND (a.delta_summary LIKE '%' || b_ast.public_ref || '%' OR a.entity_id = b_ast.public_ref))
              )
            ORDER BY a.created_at DESC LIMIT 150
          `).bind(targetBankId, targetBankId, targetBankId, targetBankId, targetBankId, targetBankId, targetBankId, targetBankId, targetBankId, targetBankId).all();
        }

        // Do not show hash codes of logs: sanitize hash codes and internal IDs from results
        const sanitized = logs.results.map(row => {
          let cleanDetail = row.delta_summary || '';
          if (cleanDetail) {
            cleanDetail = cleanDetail
              .replace(/\b[0-9a-fA-F]{24,64}\b/g, '')
              .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '')
              .replace(/\b(u|doc|val|li|img|sess|asset|bank|branch)-[a-zA-Z0-9_-]{8,}\b/g, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
          }

          let cleanEntityRef = row.entity_id || '';
          if (/^[0-9a-fA-F-]{16,}$/.test(cleanEntityRef) || /^(doc|val|li|img|lead|inv)-/i.test(cleanEntityRef)) {
            cleanEntityRef = row.entity_type || 'Record';
          }

          return {
            ...row,
            entity_id: cleanEntityRef,
            delta_summary: cleanDetail,
            actor_public_id: null
          };
        });

        return json({ success: true, count: sanitized.length, data: sanitized });
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

        const session = await resolveSession();
        const bankId = session?.bank_id || request.headers.get('x-bank-id') || body.bank_id;
        if (!bankId) return err('Bank ID is required. Sign in with a bank account or pass X-Bank-ID.', 400);

        const bank = await env.DB.prepare(`SELECT id, short_code FROM banks WHERE id = ?`).bind(bankId).first();
        if (!bank) return err('Bank not found.', 404);

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
        const session = await resolveSession();
        const bankId = session?.bank_id || request.headers.get('x-bank-id');

        let branch;
        if (bankId) {
          branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, bankId).first();
        } else {
          branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(branchId).first();
        }
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
        const session = await resolveSession();
        const bankId = session?.bank_id || request.headers.get('x-bank-id');

        let branch;
        if (bankId) {
          branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, bankId).first();
        } else {
          branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ?`).bind(branchId).first();
        }
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
        const session = await requireBankAuth();
        const branchId = pathname.split('/')[4];
        const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, session.bank_id).first();
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
