// Unified asset operations across /api/v1, /api/bank and /api/admin.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
import { BANK_EDITABLE_STATUSES } from '../rbac.js';

// Statuses Surge may set directly; Live is only reachable through the gated publish action.
const ASSET_STATUSES = new Set(['Draft', 'Submitted by Bank', 'Submitted', 'Under Review', 'Changes Required', 'Approved', 'Rejected', 'Legal Hold', 'Under Contract', 'Sold']);
const ASSET_TEXT_LIMITS = {
  categoryCode: 40, assetType: 120, title: 200, description: 10000, region: 120, district: 120,
  town: 120, publicLocation: 200, exactAddress: 500, internalBankRef: 120, occupancyStatus: 60,
  landGuardRisk: 40, fuel: 40, mileage: 40, ownerName: 160, ownerBankId: 80, branchId: 80, ownershipType: 20
};
const ASSET_NUMBER_FIELDS = ['reservePrice', 'minimumOffer', 'beds', 'baths', 'year'];
export async function handleAssets(c) {
  const {
    actorName, actorRole, auditLog, env, err, getAssetReadiness, getBody, json, method, pathname, request, requireAdminAuth, requireBankAuth
  } = c;

  // Returns an error message for the first invalid field, or null.
  async function validateAssetFields(body) {
    for (const [key, max] of Object.entries(ASSET_TEXT_LIMITS)) {
      if (body[key] === undefined || body[key] === null) continue;
      if (typeof body[key] !== 'string') return `${key} must be text.`;
      if (body[key].length > max) return `${key} must be ${max} characters or fewer.`;
    }
    for (const key of ASSET_NUMBER_FIELDS) {
      if (body[key] === undefined || body[key] === null || body[key] === '') continue;
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < 0 || value > 1e13) return `${key} must be a non-negative number.`;
    }
    if (body.categoryCode !== undefined) {
      const category = await env.DB.prepare(`SELECT code FROM asset_categories WHERE code = ?`).bind(String(body.categoryCode)).first();
      if (!category) return 'Select a valid asset category.';
    }
    return null;
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
      const invalid = await validateAssetFields(body);
      if (invalid) return err(invalid, 400);
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
      const id = 'a-' + crypto.randomUUID();
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
    if (session.scope !== 'surge') {
      if (body.status !== undefined) return err('Only Surge administrators can change an asset status.', 403);
      if (asset.legal_hold_active || !BANK_EDITABLE_STATUSES.has(asset.status)) {
        return err(`This asset is ${asset.status} and can only be changed by Surge Solutions.`, 409);
      }
    } else if (body.status !== undefined && !ASSET_STATUSES.has(body.status)) {
      return err('Select a valid asset status. Use the publish action to make an asset Live.', 400);
    }
    const invalid = await validateAssetFields(body);
    if (invalid) return err(invalid, 400);
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

    if (!isSurgeAdmin && (asset.legal_hold_active || !BANK_EDITABLE_STATUSES.has(asset.status))) {
      return err(`This asset is ${asset.status} and cannot be deleted directly by bank staff. Please submit a deletion request to Surge Admin.`, 409);
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
  const requestDeletionMatch = pathname.match(/^\/api\/(v1|bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/request-deletion$/);
  if (requestDeletionMatch && method === 'POST') {
    const session = await requireBankAuth();
    const id = requestDeletionMatch[2];
    const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
    if (!asset) return err('Asset not found', 404);
    if (session.scope !== 'surge' && asset.bank_id !== session.bank_id) {
      return err('Asset not found or access denied.', 404);
    }

    const body = await getBody();
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 1000) : 'Bank requested deletion of published listing.';

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
  const rejectDeletionMatch = pathname.match(/^\/api\/(admin|v1)\/assets\/([a-zA-Z0-9_-]+)\/reject-deletion-request$/);
  if (rejectDeletionMatch && method === 'POST') {
    await requireAdminAuth();
    const id = rejectDeletionMatch[2];
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
  const submitMatch = pathname.match(/^\/api\/(v1|bank)\/assets\/([a-zA-Z0-9_-]+)\/submit$/);
  if (submitMatch && method === 'POST') {
    const session = await requireBankAuth();
    const id = submitMatch[2];
    const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
    if (!asset) return err('Asset not found', 404);
    if (asset.bank_id !== session.bank_id && !(session.scope === 'surge' && asset.bank_id === 'bank-surge')) {
      return err('Asset not found or access denied.', 404);
    }
    if (asset.legal_hold_active) return err('Legal hold is active on this asset.', 400);
    if (!BANK_EDITABLE_STATUSES.has(asset.status)) {
      return err(`An asset that is ${asset.status} cannot be resubmitted.`, 409);
    }

    await env.DB.prepare(`UPDATE assets SET status = 'Submitted by Bank', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(session.full_name, session.role_code, session.bank_name || 'Bank', 'SUBMIT', 'Asset', asset.public_ref, 'Submitted for review', { status: asset.status }, { status: 'Submitted by Bank' });
    return json({ success: true, message: 'Asset submitted for Surge review.' });
  }

  const workflowMatch = pathname.match(/^\/api\/(v1|bank|admin)\/assets\/([a-zA-Z0-9_-]+)\/(review|approve|request-changes|reject|publish|unpublish|hold|release-hold)$/);
  if (!workflowMatch || method !== 'POST') return;
  const session = await requireAdminAuth();
  const reviewerName = session.full_name;
  const reviewerRole = session.role_code;
  const action = workflowMatch[3];
  const id = workflowMatch[2];
  const asset = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? OR public_ref = ?`).bind(id, id).first();
  if (!asset) return err('Asset not found', 404);

  if (action === 'review') {
    if (!['Submitted by Bank', 'Submitted', 'Under Review', 'Changes Required'].includes(asset.status)) {
      return err('Only submitted assets can enter review.', 400);
    }

    await env.DB.prepare(`UPDATE assets SET status = 'Under Review', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'START_REVIEW', 'Asset', asset.public_ref, 'Review started', { status: asset.status }, { status: 'Under Review' });
    return json({ success: true, message: 'Review started.' });
  }

  if (action === 'approve') {
    if (asset.status !== 'Under Review') return err('Only assets under review can be approved.', 400);
    const readiness = await getAssetReadiness(asset);
    if (!readiness.allPass) return err('Approval is blocked because one or more statutory readiness gates have not passed.', 400, { gates: readiness.gates });

    await env.DB.prepare(`UPDATE assets SET status = 'Approved', review_required = 0, review_required_reason = NULL, updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'APPROVE', 'Asset', asset.public_ref, 'Asset approved', { status: asset.status }, { status: 'Approved' });
    return json({ success: true, message: 'Asset approved.' });
  }

  if (action === 'request-changes') {
    const body = await getBody();
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 2000) : 'Changes required';
    if (asset.status !== 'Under Review') return err('Only assets under review can be returned for changes.', 400);

    await env.DB.prepare(`UPDATE assets SET status = 'Changes Required', review_required = 1, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'REQUEST_CHANGES', 'Asset', asset.public_ref, `Changes requested: ${reason}`, { status: asset.status }, { status: 'Changes Required', reason });
    return json({ success: true, message: 'Changes requested successfully.' });
  }

  if (action === 'reject') {
    const body = await getBody();
    if (asset.status !== 'Under Review') return err('Only assets under review can be rejected.', 400);

    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 2000) : 'Rejected by Surge review.';
    await env.DB.prepare(`UPDATE assets SET status = 'Rejected', review_required = 0, review_required_reason = ?, updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'REJECT', 'Asset', asset.public_ref, `Asset rejected: ${reason}`, { status: asset.status }, { status: 'Rejected', reason });
    return json({ success: true, message: 'Asset rejected.' });
  }

  if (action === 'publish') {
    if (!['Approved', 'Submitted', 'Submitted by Bank', 'Under Review'].includes(asset.status)) {
      return err('This asset cannot be published in its current state.', 400);
    }
    const readiness = await getAssetReadiness(asset);
    if (!readiness.allPass) return err('Publication is blocked because one or more statutory readiness gates have not passed.', 400, { gates: readiness.gates });

    await env.DB.prepare(`UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'PUBLISH', 'Asset', asset.public_ref, 'Published to Marketplace', { status: asset.status }, { status: 'Live' });
    return json({ success: true, message: 'Asset published to Marketplace.' });
  }

  if (action === 'unpublish') {
    if (asset.status !== 'Live') return err('Only published assets can be unpublished.', 400);

    await env.DB.prepare(`UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'UNPUBLISH', 'Asset', asset.public_ref, 'Unpublished from Marketplace');
    return json({ success: true, message: 'Asset unpublished.' });
  }

  if (action === 'hold') {
    const body = await getBody();
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';
    if (!reason) return err('A reason is required to place a legal hold.', 400);
    if (asset.legal_hold_active) return err('A legal hold is already active on this asset.', 400);

    await env.DB.prepare(`UPDATE assets SET legal_hold_active = 1, legal_hold_reason = ?, status = 'Legal Hold', updated_at = datetime('now') WHERE id = ?`).bind(reason, asset.id).run();
    await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'LEGAL_HOLD', 'Asset', asset.public_ref, `Legal hold imposed: ${reason}`, { status: asset.status, legal_hold_active: !!asset.legal_hold_active }, { status: 'Legal Hold', legal_hold_active: true, reason });
    return json({ success: true, message: 'Legal hold placed.' });
  }

  if (!asset.legal_hold_active) return err('No legal hold is active on this asset.', 400);
  await env.DB.prepare(`UPDATE assets SET legal_hold_active = 0, legal_hold_reason = NULL, status = 'Approved', updated_at = datetime('now') WHERE id = ?`).bind(asset.id).run();
  await auditLog(reviewerName, reviewerRole, 'Surge Solutions', 'RELEASE_HOLD', 'Asset', asset.public_ref, 'Legal hold released', { status: asset.status, legal_hold_active: true }, { status: 'Approved', legal_hold_active: false });
  return json({ success: true, message: 'Legal hold released.' });
}
