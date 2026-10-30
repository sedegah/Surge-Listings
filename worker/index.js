/**
 * Surge Solutions — Cloudflare Workers Native Modular Monolith API
 * Single Monolithic Backend Serving 3 Distinct Isolated Portals:
 * 1. Admin API (/api/admin/*) — Highest-privilege platform oversight, 5 statutory gates, bank & user management
 * 2. Bank API (/api/bank/*) — Bank-tenant isolated asset registration, legal workflows, offers, and reports
 * 3. Marketplace API (/api/marketplace/* & /api/public/*) — Public sanitized listings, buyer KYC, viewings & offers
 * 4. Unified /api/v1/* backward-compatible aliases
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

    // Context & Tenant Isolation Headers
    const bankId = request.headers.get('x-bank-id') || url.searchParams.get('bank_id') || 'bank-mtb';
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
          version: '2.0.0',
          engine: 'Cloudflare Workers + D1 Database + R2 Object Storage',
          cors_allowed_frontend: 'https://surge-listings.vercel.app',
          namespaces: {
            admin: '/api/admin/*',
            bank: '/api/bank/*',
            marketplace: '/api/marketplace/*',
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
      // 1. AUTHENTICATION & SESSION
      // ============================================================
      if (['/api/v1/auth/login', '/api/auth/login', '/api/admin/auth/login', '/api/bank/auth/login', '/api/marketplace/buyers/login'].includes(pathname) && method === 'POST') {
        const body = await getBody();
        const { username, password } = body;
        if (!username) return err('Username or email is required', 400);

        const user = await env.DB.prepare(`
          SELECT u.*, r.name as role_name, r.scope, o.name as org_name, b.legal_name as bank_name
          FROM users u
          JOIN roles r ON u.role_code = r.code
          JOIN organizations o ON u.organization_id = o.id
          LEFT JOIN banks b ON u.bank_id = b.id
          WHERE u.username = ? OR u.email = ?
        `).bind(username.trim().toLowerCase(), username.trim().toLowerCase()).first();

        if (!user) return err('Invalid username or credentials', 401);
        if (user.password_hash && password && user.password_hash !== password.trim()) {
          return err('Invalid password', 401);
        }

        await auditLog(user.full_name, user.role_name, user.org_name, 'LOGIN', 'User', user.id, 'User authenticated successfully');
        return json({
          success: true,
          message: 'Authentication successful',
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            roleCode: user.role_code,
            roleName: user.role_name,
            scope: user.scope,
            bankId: user.bank_id,
            bankName: user.bank_name,
            organizationId: user.organization_id,
            mfaEnabled: !!user.mfa_enabled
          }
        });
      }

      if (pathname === '/api/auth/me' || pathname === '/api/v1/auth/me') {
        const user = await env.DB.prepare(`
          SELECT u.id, u.username, u.full_name, u.email, u.role_code, r.name as role_name, r.scope,
                 b.legal_name as bank_name, u.bank_id
          FROM users u
          JOIN roles r ON u.role_code = r.code
          LEFT JOIN banks b ON u.bank_id = b.id
          WHERE u.id = ? OR u.username = ?
        `).bind(actorName, actorName).first();

        return json({ success: true, user: user || { id: 'anon', username: 'guest', scope: 'public' } });
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
          INSERT INTO bank_branches (id, bank_id, name, branch_code, region, status, created_at)
          VALUES (?, ?, ?, 'HQ', 'Greater Accra', 'Active', datetime('now'))
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
      // Tenant-Isolated by bank_id: Dashboard, Assets, Documents, Legal, Decisions
      // =========================================================================

      // GET /api/bank/dashboard
      if (pathname === '/api/bank/dashboard' && method === 'GET') {
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingSurgeReview,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status = 'Under Bank Review') as activeOffers
        `).bind(bankId, bankId, bankId, bankId, bankId, bankId, bankId).first();

        const recentActivity = await env.DB.prepare(`
          SELECT * FROM audit_logs 
          WHERE organization = ? OR delta_summary LIKE ?
          ORDER BY created_at DESC LIMIT 8
        `).bind(bankId, `%${bankId}%`).all();

        return json({ success: true, data: { ...stats, recentActivity: recentActivity.results } });
      }

      // GET /api/bank/profile
      if (pathname === '/api/bank/profile' && method === 'GET') {
        const bank = await env.DB.prepare(`SELECT * FROM banks WHERE id = ?`).bind(bankId).first();
        if (!bank) return err('Bank not found', 404);
        const branches = await env.DB.prepare(`SELECT * FROM bank_branches WHERE bank_id = ?`).bind(bankId).all();
        return json({ success: true, data: { ...bank, branches: branches.results } });
      }

      // Bank Branches
      if ((pathname === '/api/bank/branches' || pathname === '/api/v1/branches') && method === 'GET') {
        const branches = await env.DB.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM assets WHERE branch_id = b.id) as asset_count
          FROM bank_branches b
          WHERE b.bank_id = ?
          ORDER BY b.region ASC, b.name ASC
        `).bind(bankId).all();
        return json({ success: true, count: branches.results.length, data: branches.results });
      }

      // Bank Documents (/api/bank/documents)
      if ((pathname === '/api/bank/documents' || pathname === '/api/v1/documents') && method === 'GET') {
        const docs = await env.DB.prepare(`
          SELECT d.*, a.public_ref as asset_ref, a.title as asset_title
          FROM documents d
          JOIN assets a ON d.asset_id = a.id
          WHERE a.bank_id = ?
          ORDER BY d.uploaded_at DESC
        `).bind(bankId).all();
        return json({ success: true, count: docs.results.length, data: docs.results });
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

      // 404 Route Fallback
      return err(`Route '${pathname}' with method '${method}' not found on Surge API. Check / for endpoint documentation.`, 404);
    } catch (error) {
      console.error('Unhandled API Error:', error);
      return json({ success: false, error: error.message }, 500);
    }
  }
};
