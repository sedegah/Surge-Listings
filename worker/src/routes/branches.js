// Branch CRUD with region, district and town isolation.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleBranches(c) {
  const {
    actorName, actorRole, auditLog, env, err, getBody, json, method, pathname, request, resolveSession, url
  } = c;

  // =========================================================================
  // 7. BRANCH MANAGEMENT (CRUD) - Region + District + Town Isolation
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

  // POST /api/admin/branches - Create a branch for any bank
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

  // PUT /api/admin/branches/:id - Update a branch
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

  // POST /api/bank/branches - Bank creates its own branch
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

  // GET /api/bank/branches/:id/assets - Branch-scoped asset isolation
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

  // GET /api/bank/branches/:id/staff - Branch-scoped staff listing
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
}
