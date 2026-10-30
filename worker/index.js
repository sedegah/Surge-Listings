/**
 * Surge Solutions — Cloudflare Workers Native Edge API
 * Production D1 & R2 Backend adhering to Section 12 of sedegah.txt
 * 
 * Direct Bindings:
 * - env.DB: Cloudflare D1 Database (surge-solutions-db)
 * - env.ASSETS_BUCKET: Cloudflare R2 Bucket (surge-assets)
 * - env.DOCUMENTS_BUCKET: Cloudflare R2 Bucket (surge-documents)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Bank-ID, X-Actor-Name, X-Actor-Role, Authorization',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });
    const err = (message, status = 400) => new Response(JSON.stringify({ success: false, error: message }), { status, headers: corsHeaders });

    // Helper: Parse JSON body safely
    async function getBody() {
      try {
        return await request.json();
      } catch (e) {
        return {};
      }
    }

    // Helper: Audit Log
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
        console.warn('Audit log write error:', e);
      }
    }

    // Resolve tenant / user headers
    const bankId = request.headers.get('x-bank-id') || url.searchParams.get('bank_id') || 'bank-mtb';
    const actorName = request.headers.get('x-actor-name') || 'Authorized Officer';
    const actorRole = request.headers.get('x-actor-role') || 'Officer';

    try {
      // ============================================================
      // 1. HEALTH CHECK
      // ============================================================
      if (pathname === '/health' || pathname === '/api/health') {
        return json({ status: 'healthy', platform: 'Surge Solutions Enterprise Disposition', engine: 'Cloudflare Workers + D1 + R2' });
      }

      // ============================================================
      // 2. AUTHENTICATION & USERS (/api/v1/auth, /api/v1/users)
      // ============================================================
      if (pathname === '/api/v1/auth/login' && method === 'POST') {
        const body = await getBody();
        const { username, password } = body;
        const user = await env.DB.prepare(`
          SELECT u.*, r.name as role_name, r.scope, o.name as org_name, b.legal_name as bank_name
          FROM users u
          JOIN roles r ON u.role_code = r.code
          JOIN organizations o ON u.organization_id = o.id
          LEFT JOIN banks b ON u.bank_id = b.id
          WHERE u.username = ? OR u.email = ?
        `).bind(username, username).first();

        if (!user) return err('Invalid credentials', 401);
        await auditLog(user.full_name, user.role_name, user.org_name, 'LOGIN', 'User', user.id, 'User logged in successfully');
        return json({
          success: true,
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
            organizationId: user.organization_id
          }
        });
      }

      // ============================================================
      // 2. USERS & STAFF MANAGEMENT (/api/v1/users, /api/admin/users)
      // ============================================================
      if ((pathname === '/api/v1/users' || pathname === '/api/admin/users' || pathname === '/api/v1/users/' || pathname === '/api/admin/users/') && method === 'GET') {
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
        if (filterBankId) {
          sql += ` AND u.bank_id = ?`;
          params.push(filterBankId);
        }
        if (filterRole) {
          sql += ` AND u.role_code = ?`;
          params.push(filterRole);
        }
        sql += ` ORDER BY u.created_at DESC, u.full_name ASC`;
        const stmt = params.length ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const users = await stmt.all();
        return json({ success: true, count: users.results.length, data: users.results });
      }

      if ((pathname === '/api/v1/users' || pathname === '/api/admin/users') && method === 'POST') {
        const body = await getBody();
        const { bank_id, branch_id, username, full_name, email, role_code, password, mfa_enabled } = body;
        if (!username || !full_name || !email || !role_code) {
          return err('Username, full name, email, and role are required.', 400);
        }

        const existing = await env.DB.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).bind(username.trim().toLowerCase(), email.trim().toLowerCase()).first();
        if (existing) {
          return err('A user with this username or email already exists.', 400);
        }

        let orgId = 'org-surge';
        if (bank_id) {
          const bank = await env.DB.prepare(`SELECT organization_id, legal_name FROM banks WHERE id = ?`).bind(bank_id).first();
          if (bank) orgId = bank.organization_id;
        }

        const userId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const assignedPassword = password ? password.trim() : 'Surge@2026!';

        await env.DB.prepare(`
          INSERT INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, password_hash, mfa_enabled, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(
          userId,
          orgId,
          bank_id || null,
          branch_id || null,
          username.trim().toLowerCase(),
          full_name.trim(),
          email.trim().toLowerCase(),
          role_code,
          assignedPassword,
          mfa_enabled !== undefined ? (mfa_enabled ? 1 : 0) : 1
        ).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'CREATE_USER', 'User', userId, `Created staff member ${full_name} (${username}) with role ${role_code} for ${bank_id || 'Platform'}`);

        const createdUser = await env.DB.prepare(`
          SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
                 u.status, u.mfa_enabled, u.created_at, b.legal_name as bank_name
          FROM users u
          LEFT JOIN banks b ON u.bank_id = b.id
          WHERE u.id = ?
        `).bind(userId).first();

        return json({ success: true, message: 'Staff user created successfully.', data: createdUser }, 201);
      }

      // Password Reset for Staff User
      if ((pathname.match(/^\/api\/v1\/users\/[a-zA-Z0-9_-]+\/reset-password$/) || pathname.match(/^\/api\/admin\/users\/[a-zA-Z0-9_-]+\/reset-password$/)) && method === 'POST') {
        const parts = pathname.split('/');
        const id = parts[parts.length - 2];
        const body = await getBody();
        const { password } = body;
        if (!password || password.trim().length < 6) {
          return err('Password must be at least 6 characters.', 400);
        }

        const user = await env.DB.prepare(`SELECT username, full_name FROM users WHERE id = ?`).bind(id).first();
        if (!user) return err('User not found', 404);

        await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(password.trim(), id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RESET_PASSWORD', 'User', id, `Admin reset password for user ${user.username} (${user.full_name})`);

        return json({ success: true, message: `Password reset successfully for ${user.username}.` });
      }

      // Update Staff User (PUT)
      if ((pathname.match(/^\/api\/v1\/users\/[a-zA-Z0-9_-]+$/) || pathname.match(/^\/api\/admin\/users\/[a-zA-Z0-9_-]+$/)) && method === 'PUT') {
        const id = pathname.split('/').pop();
        const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
        if (!user) return err('User not found', 404);

        const body = await getBody();
        const { full_name, email, role_code, status, bank_id, branch_id } = body;

        await env.DB.prepare(`
          UPDATE users
          SET full_name = COALESCE(?, full_name),
              email = COALESCE(?, email),
              role_code = COALESCE(?, role_code),
              status = COALESCE(?, status),
              bank_id = COALESCE(?, bank_id),
              branch_id = COALESCE(?, branch_id)
          WHERE id = ?
        `).bind(
          full_name || null,
          email ? email.toLowerCase() : null,
          role_code || null,
          status || null,
          bank_id || null,
          branch_id || null,
          id
        ).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'UPDATE_USER', 'User', id, `Updated staff profile for ${user.username}`);
        return json({ success: true, message: 'User updated successfully.' });
      }

      // Delete Staff User
      if ((pathname.match(/^\/api\/v1\/users\/[a-zA-Z0-9_-]+$/) || pathname.match(/^\/api\/admin\/users\/[a-zA-Z0-9_-]+$/)) && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const user = await env.DB.prepare(`SELECT username, full_name FROM users WHERE id = ?`).bind(id).first();
        if (!user) return err('User not found', 404);

        await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'DELETE_USER', 'User', id, `Deleted user ${user.username} (${user.full_name})`);
        return json({ success: true, message: `User ${user.username} deleted successfully.` });
      }

      // ============================================================
      // 3. ORGANIZATIONS & BANKS (/api/v1/organizations, /api/v1/banks)
      // ============================================================
      if (pathname === '/api/v1/organizations' || pathname === '/api/v1/organizations/') {
        const orgs = await env.DB.prepare(`SELECT * FROM organizations ORDER BY name ASC`).all();
        return json({ success: true, count: orgs.results.length, data: orgs.results });
      }

      if ((pathname === '/api/v1/banks' || pathname === '/api/admin/banks') && method === 'GET') {
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

      if ((pathname === '/api/v1/banks' || pathname === '/api/admin/banks') && method === 'POST') {
        const body = await getBody();
        const { legal_name, short_code, contact_email, contact_phone, default_commission_rate, initial_branch } = body;
        if (!legal_name || !short_code || !contact_email) {
          return err('Legal name, short code, and contact email are required.', 400);
        }

        const cleanCode = short_code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const orgId = 'org-' + cleanCode.toLowerCase();
        const bankId = 'bank-' + cleanCode.toLowerCase();

        // Check if bank code already exists
        const existing = await env.DB.prepare(`SELECT id FROM banks WHERE id = ? OR short_code = ?`).bind(bankId, cleanCode).first();
        if (existing) {
          return err(`A bank with code '${cleanCode}' already exists.`, 400);
        }

        await env.DB.prepare(`
          INSERT INTO organizations (id, name, code, type, status, created_at)
          VALUES (?, ?, ?, 'bank', 'Active', datetime('now'))
        `).bind(orgId, legal_name.trim(), cleanCode).run();

        await env.DB.prepare(`
          INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
        `).bind(
          bankId,
          orgId,
          legal_name.trim(),
          cleanCode,
          contact_email.trim().toLowerCase(),
          contact_phone ? contact_phone.trim() : '+233 30 000 0000',
          default_commission_rate ? Number(default_commission_rate) : 4.0
        ).run();

        // Create default head office branch
        const branchId = 'br-' + cleanCode.toLowerCase() + '-hq';
        const branchName = initial_branch ? initial_branch.trim() : (cleanCode + ' Head Office - Accra');
        await env.DB.prepare(`
          INSERT INTO bank_branches (id, bank_id, name, branch_code, region, status, created_at)
          VALUES (?, ?, ?, 'HQ', 'Greater Accra', 'Active', datetime('now'))
        `).bind(branchId, bankId, branchName).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'ADD_BANK', 'Bank', bankId, `Registered partner bank: ${legal_name} (${cleanCode})`);

        const createdBank = await env.DB.prepare(`SELECT * FROM banks WHERE id = ?`).bind(bankId).first();
        return json({ success: true, message: 'Bank partner registered successfully.', data: createdBank }, 201);
      }

      if ((pathname.match(/^\/api\/v1\/banks\/[a-zA-Z0-9_-]+$/) || pathname.match(/^\/api\/admin\/banks\/[a-zA-Z0-9_-]+$/)) && method === 'PUT') {
        const id = pathname.split('/').pop();
        const bank = await env.DB.prepare(`SELECT * FROM banks WHERE id = ?`).bind(id).first();
        if (!bank) return err('Bank not found', 404);

        const body = await getBody();
        const { legal_name, contact_email, contact_phone, default_commission_rate, status } = body;

        await env.DB.prepare(`
          UPDATE banks
          SET legal_name = COALESCE(?, legal_name),
              contact_email = COALESCE(?, contact_email),
              contact_phone = COALESCE(?, contact_phone),
              default_commission_rate = COALESCE(?, default_commission_rate),
              status = COALESCE(?, status)
          WHERE id = ?
        `).bind(
          legal_name || null,
          contact_email ? contact_email.toLowerCase() : null,
          contact_phone || null,
          default_commission_rate !== undefined ? Number(default_commission_rate) : null,
          status || null,
          id
        ).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'UPDATE_BANK', 'Bank', id, `Updated bank details for ${legal_name || bank.legal_name}`);
        return json({ success: true, message: 'Bank partner updated successfully.' });
      }

      if ((pathname.match(/^\/api\/v1\/banks\/[a-zA-Z0-9_-]+$/) || pathname.match(/^\/api\/admin\/banks\/[a-zA-Z0-9_-]+$/)) && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const bank = await env.DB.prepare(`SELECT legal_name FROM banks WHERE id = ?`).bind(id).first();
        if (!bank) return err('Bank not found', 404);

        // Delete branches, users, and bank
        await env.DB.prepare(`DELETE FROM users WHERE bank_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM bank_branches WHERE bank_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM banks WHERE id = ?`).bind(id).run();

        await auditLog(actorName, actorRole, 'Surge Solutions', 'DELETE_BANK', 'Bank', id, `Removed bank partner: ${bank.legal_name}`);
        return json({ success: true, message: `Bank ${bank.legal_name} and associated staff removed.` });
      }

      if (pathname === '/api/v1/branches' || pathname === '/api/bank/branches') {
        const branches = await env.DB.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM assets WHERE branch_id = b.id) as asset_count
          FROM bank_branches b
          WHERE b.bank_id = ?
          ORDER BY b.region ASC, b.name ASC
        `).bind(bankId).all();
        return json({ success: true, count: branches.results.length, data: branches.results });
      }

      // ============================================================
      // 4. PUBLIC MARKETPLACE (/api/v1/marketplace, /api/public/listings)
      // ============================================================
      if (pathname === '/api/v1/marketplace' || pathname === '/api/public/listings') {
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

        if (category && category !== 'All Categories') {
          sql += ` AND a.category_code = ?`;
          params.push(category);
        }
        if (region && region !== 'All Regions') {
          sql += ` AND a.region = ?`;
          params.push(region);
        }
        if (minPrice) {
          sql += ` AND a.reserve_price >= ?`;
          params.push(Number(minPrice));
        }
        if (maxPrice) {
          sql += ` AND a.reserve_price <= ?`;
          params.push(Number(maxPrice));
        }
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

      if (pathname.startsWith('/api/v1/marketplace/') || pathname.startsWith('/api/public/listings/')) {
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

      if (pathname === '/api/public/categories' || pathname === '/api/v1/categories') {
        const categories = await env.DB.prepare(`
          SELECT c.code, c.name, c.icon,
            (SELECT COUNT(*) FROM assets a WHERE a.category_code = c.code AND a.status = 'Live' AND a.legal_hold_active = 0) as live_count
          FROM asset_categories c
          ORDER BY c.name ASC
        `).all();
        return json({ success: true, data: categories.results });
      }

      // ============================================================
      // 5. ASSET MANAGEMENT (/api/v1/assets, /api/bank/assets, /api/admin/assets)
      // ============================================================
      if (pathname === '/api/v1/assets' || pathname === '/api/v1/assets/') {
        if (method === 'GET') {
          const isSurgeAdmin = request.headers.get('x-actor-role') === 'Surge Admin' || url.searchParams.get('scope') === 'all';
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
      if (pathname.match(/^\/api\/v1\/assets\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
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
      if (pathname.match(/^\/api\/v1\/assets\/[a-zA-Z0-9_-]+$/) && method === 'PUT') {
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
            } else if (['reserve_price', 'minimum_offer', 'beds', 'baths', 'year', 'mileage'].includes(dbCol)) {
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
      if (pathname.match(/^\/api\/v1\/assets\/[a-zA-Z0-9_-]+$/) && method === 'DELETE') {
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
        const id = pathname.replace('/api/v1/assets/', '').replace('/submit', '');
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.legal_hold_active) return err('This action is unavailable because a legal hold is active on this asset.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Submitted by Bank', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Bank', 'SUBMIT', 'Asset', asset.public_ref, 'Asset submitted for Surge disposition review');
        return json({ success: true, message: 'Asset submitted for review. Surge disposition team notified.' });
      }

      if (pathname.includes('/approve') && method === 'POST') {
        const id = pathname.replace('/api/v1/assets/', '').replace('/approve', '');
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'APPROVE', 'Asset', asset.public_ref, 'Asset approved for disposition');
        return json({ success: true, message: 'Asset approved. Ready for marketplace publication.' });
      }

      if (pathname.includes('/reject') && method === 'POST') {
        const id = pathname.replace('/api/v1/assets/', '').replace('/reject', '');
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET status = 'Changes Required', review_required = 1, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(body.reason || 'Changes required', asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'REJECT', 'Asset', asset.public_ref, `Changes requested: ${body.reason || 'None specified'}`);
        return json({ success: true, message: 'Changes requested successfully.' });
      }

      if (pathname.includes('/publish') && method === 'POST') {
        const id = pathname.replace('/api/v1/assets/', '').replace('/publish', '');
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);
        if (asset.legal_hold_active) return err('This action is unavailable because a legal hold is active on this asset.', 400);
        if (asset.status !== 'Approved') return err('This asset must be approved before publication.', 400);

        await env.DB.prepare(`UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'PUBLISH', 'Asset', asset.public_ref, 'Asset published to Marketplace');
        return json({ success: true, message: 'Asset published to Marketplace.' });
      }

      if (pathname.includes('/hold') && method === 'POST') {
        const id = pathname.replace('/api/v1/assets/', '').replace('/hold', '');
        const body = await getBody();
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 1, legal_hold_reason = ?, status = 'Legal Hold', updated_at = datetime('now') WHERE id = ?`).bind(body.reason || 'Legal investigation pending', asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'LEGAL_HOLD', 'Asset', asset.public_ref, `Legal hold placed: ${body.reason || 'Legal notice'}`);
        return json({ success: true, message: 'Legal hold placed. Marketplace listing withdrawn.' });
      }

      if (pathname.includes('/release-hold') && method === 'POST') {
        const id = pathname.replace('/api/v1/assets/', '').replace('/release-hold', '');
        const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
        if (!asset) return err('Asset not found', 404);

        await env.DB.prepare(`UPDATE assets SET legal_hold_active = 0, legal_hold_reason = NULL, status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
        await auditLog(actorName, actorRole, 'Surge Solutions', 'RELEASE_HOLD', 'Asset', asset.public_ref, 'Legal hold cleared by authorized legal officer');
        return json({ success: true, message: 'Legal hold released successfully.' });
      }

      // ============================================================
      // 6. ENQUIRIES & LEADS (/api/v1/leads, /api/v1/enquiries)
      // ============================================================
      if (pathname === '/api/v1/leads' || pathname === '/api/v1/enquiries') {
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

      // ============================================================
      // 7. VIEWINGS (/api/v1/viewings)
      // ============================================================
      if (pathname === '/api/v1/viewings') {
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
          if (!name || !phone || !date) return err('Full name, phone, and preferred viewing date are required', 400);

          const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(assetId, assetId).first();
          if (!asset) return err('Asset not found', 404);

          const viewingId = 'vw-' + Date.now();
          await env.DB.prepare(`
            INSERT INTO viewings (id, asset_id, buyer_name, viewing_date, time_slot, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, 'Requested', ?, datetime('now'))
          `).bind(viewingId, asset.id, name, date, timeSlot || 'Morning', notes || '').run();

          await auditLog(name, 'Public Buyer', 'Public', 'VIEWING_REQUEST', 'Viewing', viewingId, `Viewing requested for ${asset.public_ref} on ${date}`);
          return json({ success: true, id: viewingId, message: 'Viewing appointment requested. Surge officer will confirm with you.' }, 201);
        }
      }

      // ============================================================
      // 8. OFFERS & SALES (/api/v1/offers, /api/v1/sales)
      // ============================================================
      if (pathname === '/api/v1/offers') {
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
          if (!name || !phone || !amount || !ghanaCard) {
            return err('Buyer name, phone, Ghana Card number, and offer amount are required', 400);
          }

          const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(assetId, assetId).first();
          if (!asset) return err('Asset not found', 404);
          if (asset.legal_hold_active) return err('This action is unavailable because a legal hold is active on this asset.', 400);

          const countRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM offers`).first();
          const offerRef = 'OF-2026-' + String((countRow ? countRow.c : 0) + 501).padStart(6, '0');
          const offerId = 'of-' + Date.now();
          const validityDate = new Date(Date.now() + (Number(validityDays) || 30) * 86400000).toISOString();

          await env.DB.prepare(`
            INSERT INTO offers (id, offer_ref, asset_id, buyer_name, amount, validity_date, conditions, status, below_reserve, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Under Bank Review', ?, ?, datetime('now'), datetime('now'))
          `).bind(
            offerId,
            offerRef,
            asset.id,
            name,
            Number(amount),
            validityDate,
            paymentMethod || 'Cash / Direct Bank Transfer',
            Number(amount) < asset.reserve_price ? 1 : 0,
            `Ghana Card: ${ghanaCard} · Contact: ${phone} (${email || 'No email'})`
          ).run();

          await auditLog(name, 'Public Buyer', 'Public', 'OFFER_SUBMISSION', 'Offer', offerRef, `Formal purchase offer of GHS ${Number(amount).toLocaleString()} submitted on ${asset.public_ref}`);
          return json({ success: true, reference: offerRef, message: 'Formal offer submitted. Recovery Bank notified.' }, 201);
        }
      }

      if (pathname.includes('/decide') && method === 'POST') {
        const offerId = pathname.split('/')[4];
        const body = await getBody();
        const { decision } = body; // 'Accepted', 'Rejected', 'Counter'

        const offer = await env.DB.prepare(`SELECT * FROM offers WHERE id = ? OR offer_ref = ?`).bind(offerId, offerId).first();
        if (!offer) return err('Offer not found', 404);

        await env.DB.prepare(`UPDATE offers SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(decision, offer.id).run();

        if (decision === 'Accepted') {
          await env.DB.prepare(`UPDATE assets SET status = 'Sold', updated_at = datetime('now') WHERE id = ?`).bind(offer.asset_id).run();
        }

        await auditLog(actorName, actorRole, 'Bank', 'OFFER_DECISION', 'Offer', offer.offer_ref, `Offer decision recorded: ${decision}`);
        return json({ success: true, message: decision === 'Accepted' ? 'Offer accepted. Sale processing can now begin.' : `Offer ${decision.toLowerCase()}.` });
      }

      if (pathname === '/api/v1/sales') {
        const sales = await env.DB.prepare(`
          SELECT a.id, a.public_ref, a.asset_type, a.public_location, a.reserve_price,
                 b.legal_name as bank_name, o.buyer_name, o.amount as sale_amount, o.updated_at as completed_at
          FROM assets a
          JOIN banks b ON a.bank_id = b.id
          LEFT JOIN offers o ON a.id = o.asset_id AND o.status = 'Accepted'
          WHERE a.status = 'Sold'
          ORDER BY a.updated_at DESC
        `).all();
        return json({ success: true, count: sales.results.length, data: sales.results });
      }

      // ============================================================
      // 9. INVOICES & PAYMENTS (/api/v1/invoices, /api/v1/payments)
      // ============================================================
      if (pathname === '/api/v1/invoices') {
        const invoices = await env.DB.prepare(`
          SELECT i.*, b.legal_name as bank_name, b.short_code as bank_code
          FROM invoices i
          JOIN banks b ON i.bank_id = b.id
          ORDER BY i.created_at DESC
        `).all();
        return json({ success: true, count: invoices.results.length, data: invoices.results });
      }

      // ============================================================
      // 10. AUDIT LOGS (/api/v1/audit-logs)
      // ============================================================
      if (pathname === '/api/v1/audit-logs') {
        const logs = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`).all();
        return json({ success: true, count: logs.results.length, data: logs.results });
      }

      // ============================================================
      // 11. REPORTS & DASHBOARD (/api/v1/reports, /api/bank/dashboard, /api/admin/dashboard)
      // ============================================================
      if (pathname === '/api/bank/dashboard') {
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Submitted by Bank') as pendingSurgeReview,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status = 'Under Bank Review') as activeOffers
        `).bind(bankId, bankId, bankId, bankId, bankId, bankId, bankId).first();

        const recentActivity = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8`).all();
        return json({ success: true, data: { ...stats, recentActivity: recentActivity.results } });
      }

      if (pathname === '/api/admin/dashboard' || pathname === '/api/v1/reports') {
        const counts = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets) as totalAssets,
            (SELECT COUNT(*) FROM assets WHERE status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE status = 'Submitted by Bank') as pendingReview,
            (SELECT COUNT(*) FROM assets WHERE legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM offers WHERE status = 'Under Bank Review') as activeOffers,
            (SELECT COUNT(*) FROM kyc_applications WHERE status = 'Pending Review') as pendingKYC,
            (SELECT COUNT(*) FROM legal_instruments WHERE injunction_active = 1) as activeInjunctions
        `).first();
        return json({ success: true, data: { stats: counts } });
      }

      return err('Endpoint not found', 404);
    } catch (error) {
      return json({ success: false, error: error.message }, 500);
    }
  }
};
