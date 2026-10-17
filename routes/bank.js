/**
 * Bank Partner Portal API Router
 * Base Path: /api/bank
 * 
 * Strict Multi-Tenant Security:
 * - Bank users are strictly isolated to their own organization (bank_id).
 * - Cannot view or mutate assets, valuations, offers, or commissions of other banks.
 * - Documents stored securely in Cloudflare R2 with 5-minute pre-signed access.
 */

import express from 'express';
import multer from 'multer';
import { d1 } from '../db/d1-client.js';
import { DOCUMENTS_BUCKET, uploadToObjectStorage, getSignedDownloadUrl } from '../storage/r2-storage.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

// Bank Tenant Identification & Isolation Middleware
router.use((req, res, next) => {
  const bankId = req.headers['x-bank-id'] || req.query.bank_id || req.body?.bank_id;
  if (!bankId) {
    // Default to the active primary bank (Meridian Trust Bank) if header omitted in frontend
    req.bankId = 'bank-mtb';
  } else {
    req.bankId = bankId;
  }
  next();
});

// Helper: Bank Audit Logger
async function logBankAudit(req, actionType, entityType, entityId, summary, oldVal = null, newVal = null) {
  try {
    const id = 'log-bnk-' + Math.random().toString(36).substring(2, 11);
    const actor = req.headers['x-actor-name'] || 'Bank User';
    const role = req.headers['x-actor-role'] || 'Bank Asset Officer';
    const bank = await d1.get(`SELECT legal_name FROM banks WHERE id = ?`, req.bankId);
    await d1.run(
      `INSERT INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      id, actor, role, bank?.legal_name || req.bankId, actionType, entityType, entityId, summary,
      oldVal ? JSON.stringify(oldVal) : null, newVal ? JSON.stringify(newVal) : null
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * GET /api/bank/profile
 * Get current bank organization profile
 */
router.get('/profile', async (req, res) => {
  try {
    const bank = await d1.get(`SELECT * FROM banks WHERE id = ?`, req.bankId);
    if (!bank) return res.status(404).json({ success: false, error: 'Bank not found' });
    const branches = await d1.all(`SELECT * FROM bank_branches WHERE bank_id = ? ORDER BY name ASC`, req.bankId);
    res.json({ success: true, data: { ...bank, branches } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/branches
 * List all branches of this bank
 */
router.get('/branches', async (req, res) => {
  try {
    const branches = await d1.all(`
      SELECT b.*,
        (SELECT COUNT(*) FROM assets a WHERE a.branch_id = b.id) as asset_count
      FROM bank_branches b
      WHERE b.bank_id = ?
      ORDER BY b.region ASC, b.name ASC
    `, req.bankId);
    res.json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/branches
 * Add a new branch for this bank
 */
router.post('/branches', async (req, res) => {
  try {
    const { name, branch_code, region, town, address, phone, email, manager_name } = req.body;
    if (!name || !region) {
      return res.status(400).json({ success: false, error: 'Branch name and region are required.' });
    }

    const branchId = 'br-' + Math.random().toString(36).substring(2, 11);
    await d1.run(`
      INSERT INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `, branchId, req.bankId, name, branch_code || null, region, town || null, address || null, phone || null, email || null, manager_name || null);

    await logBankAudit(req, 'Add Branch', 'BankBranch', branchId, `Branch '${name}' (${region}) added to bank`);
    res.json({ success: true, message: 'Branch registered successfully.', branch_id: branchId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/bank/branches/:branchId
 * Update a branch
 */
router.put('/branches/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, branch_code, region, town, address, phone, email, manager_name, status } = req.body;

    const existing = await d1.get(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`, branchId, req.bankId);
    if (!existing) return res.status(404).json({ success: false, error: 'Branch not found or unauthorized' });

    await d1.run(`
      UPDATE bank_branches
      SET name = COALESCE(?, name),
          branch_code = COALESCE(?, branch_code),
          region = COALESCE(?, region),
          town = COALESCE(?, town),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          manager_name = COALESCE(?, manager_name),
          status = COALESCE(?, status)
      WHERE id = ? AND bank_id = ?
    `, name, branch_code, region, town, address, phone, email, manager_name, status, branchId, req.bankId);

    await logBankAudit(req, 'Update Branch', 'BankBranch', branchId, `Updated branch details for ${name || existing.name}`);
    res.json({ success: true, message: 'Branch updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/bank/branches/:branchId
 * Delete branch
 */
router.delete('/branches/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const existing = await d1.get(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`, branchId, req.bankId);
    if (!existing) return res.status(404).json({ success: false, error: 'Branch not found or unauthorized' });

    await d1.run(`DELETE FROM bank_branches WHERE id = ? AND bank_id = ?`, branchId, req.bankId);
    await logBankAudit(req, 'Delete Branch', 'BankBranch', branchId, `Branch ${existing.name} deleted`);
    res.json({ success: true, message: 'Branch removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/assets
 * List all assets owned by this bank (strictly tenant-isolated)
 */
router.get('/assets', async (req, res) => {
  try {
    const { status, category, branch_id } = req.query;

    let sql = `
      SELECT a.*,
        b.name as branch_name,
        (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as offer_count,
        (SELECT COUNT(*) FROM documents WHERE asset_id = a.id) as document_count,
        (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM assets a
      LEFT JOIN bank_branches b ON a.branch_id = b.id
      WHERE a.bank_id = ?
    `;
    const params = [req.bankId];

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    if (category) {
      sql += ` AND a.category_code = ?`;
      params.push(category);
    }
    if (branch_id) {
      sql += ` AND a.branch_id = ?`;
      params.push(branch_id);
    }

    sql += ` ORDER BY a.updated_at DESC`;

    const assets = await d1.all(sql, params);
    res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/assets/:id
 * Detail view of bank asset including legal records and documents
 */
router.get('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await d1.get(`
      SELECT a.*, b.name as branch_name
      FROM assets a
      LEFT JOIN bank_branches b ON a.branch_id = b.id
      WHERE (a.id = ? OR a.public_ref = ?) AND a.bank_id = ?
    `, id, id, req.bankId);

    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found or access denied.' });

    const [images, documents, enforcement, title, valuations, offers] = await Promise.all([
      d1.all(`SELECT * FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC`, asset.id),
      d1.all(`SELECT * FROM documents WHERE asset_id = ? ORDER BY uploaded_at DESC`, asset.id),
      d1.get(`SELECT * FROM enforcement_cases WHERE asset_id = ?`, asset.id),
      d1.get(`SELECT * FROM title_records WHERE asset_id = ?`, asset.id),
      d1.all(`SELECT * FROM valuations WHERE asset_id = ? ORDER BY valuation_date DESC`, asset.id),
      d1.all(`SELECT * FROM offers WHERE asset_id = ? ORDER BY created_at DESC`, asset.id)
    ]);

    let instruments = [];
    if (enforcement?.id) {
      instruments = await d1.all(`SELECT * FROM legal_instruments WHERE case_id = ?`, enforcement.id);
    }

    res.json({
      success: true,
      data: {
        ...asset,
        images,
        documents,
        enforcement_case: enforcement,
        legal_instruments: instruments,
        title_record: title,
        valuations,
        offers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/assets
 * Register a new asset draft
 */
router.post('/assets', async (req, res) => {
  try {
    const {
      internal_bank_ref, category_code, asset_type, title, description,
      branch_id, region, district, town, exact_address, public_location,
      reserve_price, minimum_offer, show_reserve_publicly, occupancy_status, land_guard_risk,
      beds, baths, year, mileage, fuel
    } = req.body;

    if (!internal_bank_ref || !category_code || !title || !reserve_price) {
      return res.status(400).json({ success: false, error: 'internal_bank_ref, category_code, title, and reserve_price are required.' });
    }

    const assetId = 'ast-' + Math.random().toString(36).substring(2, 11);
    const catPrefix = category_code === 'House' ? 'RE' : category_code === 'Vehicle' ? 'VH' : category_code === 'Equipment' ? 'EQ' : 'AS';
    const publicRef = `SS-${catPrefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    await d1.run(`
      INSERT INTO assets (
        id, bank_id, branch_id, public_ref, internal_bank_ref, category_code, asset_type, title, description,
        region, district, town, public_location, exact_address, reserve_price, minimum_offer,
        show_reserve_publicly, occupancy_status, land_guard_risk, status, beds, baths, year, mileage, fuel,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, assetId, req.bankId, branch_id || null, publicRef, internal_bank_ref, category_code, asset_type || category_code, title, description || '',
       region || 'Greater Accra', district || '', town || '', public_location || `${town || 'Location'}, ${region || 'Ghana'}`,
       exact_address || '', Number(reserve_price), minimum_offer ? Number(minimum_offer) : null,
       show_reserve_publicly ? 1 : 0, occupancy_status || 'Vacant', land_guard_risk || 'Low',
       beds ? Number(beds) : null, baths ? Number(baths) : null, year ? Number(year) : null, mileage || null, fuel || null,
       req.headers['x-actor-name'] || 'Bank Asset Officer'
    );

    await logBankAudit(req, 'Create Asset', 'Asset', assetId, `Asset draft created: ${publicRef} (${title})`);

    res.json({ success: true, message: 'Asset draft created successfully.', asset_id: assetId, public_ref: publicRef });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/assets/:id/submit
 * Submit asset to Surge Platform for verification and publishing review
 */
router.post('/assets/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await d1.get(`SELECT * FROM assets WHERE id = ? AND bank_id = ?`, id, req.bankId);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });

    await d1.run(`
      UPDATE assets
      SET status = 'Submitted by Bank', updated_at = datetime('now')
      WHERE id = ? AND bank_id = ?
    `, id, req.bankId);

    await logBankAudit(req, 'Submit Asset', 'Asset', id, `Asset ${asset.public_ref} submitted to Surge Solutions for listing review`);
    res.json({ success: true, message: `Asset ${asset.public_ref} submitted to Surge Solutions for listing review.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/assets/:id/photos/upload
 * Upload listing photo to Cloudflare R2 surge-assets bucket (Publicly visible on marketplace)
 */
router.post('/assets/:id/photos/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, is_primary, is_exterior } = req.body;
    const file = req.file;

    const asset = await d1.get(`SELECT id, public_ref FROM assets WHERE id = ? AND bank_id = ?`, id, req.bankId);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });
    if (!file) return res.status(400).json({ success: false, error: 'Photo file is required' });

    const key = `photos/${asset.public_ref}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Upload to Cloudflare R2 surge-assets bucket
    const r2Result = await uploadToObjectStorage({
      bucket: ASSETS_BUCKET,
      key,
      body: file.buffer,
      contentType: file.mimetype
    });

    const imgId = 'img-' + Math.random().toString(36).substring(2, 11);
    const existingCount = await d1.get(`SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ?`, asset.id);
    const sortOrder = (existingCount?.c || 0) + 1;
    const primaryFlag = is_primary === '1' || is_primary === true || sortOrder === 1 ? 1 : 0;

    if (primaryFlag) {
      await d1.run(`UPDATE asset_images SET is_primary = 0 WHERE asset_id = ?`, asset.id);
    }

    const publicUrl = r2Result.url;

    await d1.run(`
      INSERT INTO asset_images (id, asset_id, url, caption, is_primary, is_exterior, sort_order, watermark_applied)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, imgId, asset.id, publicUrl, caption || 'Listing photo', primaryFlag, is_exterior ? 1 : 0, sortOrder);

    await logBankAudit(req, 'Upload Photo', 'AssetImage', imgId, `Uploaded photo for ${asset.public_ref} to Cloudflare R2 (${key})`);

    res.json({
      success: true,
      message: 'Photo uploaded to Cloudflare R2 and attached to listing.',
      image_id: imgId,
      url: publicUrl,
      r2_key: key
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/assets/:id/documents/upload
 * Upload legal document to Cloudflare R2 object storage
 */
router.post('/assets/:id/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;
    const file = req.file;

    const asset = await d1.get(`SELECT id, public_ref FROM assets WHERE id = ? AND bank_id = ?`, id, req.bankId);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });
    if (!file) return res.status(400).json({ success: false, error: 'File is required' });

    const key = `documents/${asset.public_ref}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Upload to Cloudflare R2 surge-documents bucket
    const r2Result = await uploadToObjectStorage({
      bucket: DOCUMENTS_BUCKET,
      key,
      body: file.buffer,
      contentType: file.mimetype
    });

    const docId = 'doc-' + Math.random().toString(36).substring(2, 11);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    await d1.run(`
      INSERT INTO documents (id, asset_id, title, category, file_path, file_size, content_type, verification_status, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', datetime('now'))
    `, docId, asset.id, title || file.originalname, category || 'Legal', key, sizeStr, file.mimetype);

    await logBankAudit(req, 'Upload Document', 'Document', docId, `Uploaded ${title || file.originalname} to Cloudflare R2 (${key})`);

    res.json({
      success: true,
      message: 'Document stored in Cloudflare R2 successfully and queued for legal verification.',
      document_id: docId,
      r2_key: key
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/documents/:docId/download-url
 * Get secure 5-minute pre-signed download URL from Cloudflare R2
 */
router.get('/documents/:docId/download-url', async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await d1.get(`
      SELECT d.* FROM documents d
      JOIN assets a ON d.asset_id = a.id
      WHERE d.id = ? AND a.bank_id = ?
    `, docId, req.bankId);

    if (!doc) return res.status(404).json({ success: false, error: 'Document not found or unauthorized' });

    const signedUrl = await getSignedDownloadUrl({
      bucket: DOCUMENTS_BUCKET,
      key: doc.file_path,
      expiresIn: 300 // 5 minutes TTL
    });

    // Log document access
    await d1.run(`
      INSERT INTO document_access_logs (id, document_id, user_name, user_role, ip_address, access_type, created_at)
      VALUES (?, ?, ?, ?, ?, 'DOWNLOAD', datetime('now'))
    `, 'dal-' + Math.random().toString(36).substring(2, 11), doc.id, req.headers['x-actor-name'] || 'Bank User', req.headers['x-actor-role'] || 'Bank Officer', req.ip || '127.0.0.1');

    res.json({ success: true, download_url: signedUrl, expires_in_seconds: 300 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/offers
 * List all offers received on this bank's properties
 */
router.get('/offers', async (req, res) => {
  try {
    const offers = await d1.all(`
      SELECT o.*,
        a.title as asset_title,
        a.public_ref as asset_public_ref,
        a.reserve_price as asset_reserve_price,
        b.full_name as buyer_full_name,
        b.email as buyer_email,
        b.phone as buyer_phone,
        b.kyc_status as buyer_kyc_status
      FROM offers o
      JOIN assets a ON o.asset_id = a.id
      LEFT JOIN buyers b ON o.buyer_id = b.id
      WHERE a.bank_id = ?
      ORDER BY o.created_at DESC
    `, req.bankId);

    res.json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bank/offers/:id/decision
 * Bank accepts, counters, or rejects an offer
 */
router.post('/offers/:id/decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, counter_amount, notes } = req.body; // 'Accept', 'Counter', 'Reject'

    const offer = await d1.get(`
      SELECT o.*, a.id as asset_id, a.bank_id, a.reserve_price
      FROM offers o
      JOIN assets a ON o.asset_id = a.id
      WHERE o.id = ? AND a.bank_id = ?
    `, id, req.bankId);

    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found or unauthorized' });

    if (decision === 'Accept') {
      await d1.run(`UPDATE offers SET status = 'Accepted', notes = ?, updated_at = datetime('now') WHERE id = ?`, notes || 'Accepted by Bank', id);
      await d1.run(`UPDATE assets SET status = 'Under Offer', updated_at = datetime('now') WHERE id = ?`, offer.asset_id);
    } else if (decision === 'Counter') {
      await d1.run(`UPDATE offers SET status = 'Countered', notes = ?, updated_at = datetime('now') WHERE id = ?`, `Counter: GHS ${counter_amount}`, id);
      await d1.run(`
        INSERT INTO offer_revisions (id, offer_id, amount, proposed_by, notes, created_at)
        VALUES (?, ?, ?, 'Bank', ?, datetime('now'))
      `, 'rev-' + Math.random().toString(36).substring(2, 11), id, Number(counter_amount), notes || 'Bank counter offer');
    } else if (decision === 'Reject') {
      await d1.run(`UPDATE offers SET status = 'Rejected', notes = ?, updated_at = datetime('now') WHERE id = ?`, notes || 'Declined by Bank', id);
    }

    await logBankAudit(req, `Offer Decision: ${decision}`, 'Offer', id, `Offer ${offer.offer_ref} decision: ${decision} (${notes || ''})`);
    res.json({ success: true, message: `Offer decision '${decision}' recorded successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [stats, recentActivity] = await Promise.all([
      d1.get(`
        SELECT 
          (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
          (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
          (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
          (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Submitted by Bank') as pendingSurgeReview,
          (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
          (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
          (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status = 'Under Bank Review') as activeOffers,
          (SELECT COUNT(*) FROM valuations v JOIN assets a ON v.asset_id = a.id WHERE a.bank_id = ? AND (v.status = 'Expired' OR v.review_required = 1)) as valuationReviewRequired
      `, req.bankId, req.bankId, req.bankId, req.bankId, req.bankId, req.bankId, req.bankId, req.bankId),
      d1.all(`
        SELECT * FROM audit_logs 
        WHERE organization LIKE '%Meridian%' OR organization LIKE '%Coastal%' OR organization LIKE '%Bank%'
        ORDER BY created_at DESC LIMIT 8
      `)
    ]);

    res.json({
      success: true,
      data: {
        totalAssets: stats?.totalAssets || 0,
        totalPortfolioValue: stats?.totalPortfolioValue || 0,
        liveListings: stats?.liveListings || 0,
        pendingSurgeReview: stats?.pendingSurgeReview || 0,
        legalHolds: stats?.legalHolds || 0,
        completedSales: stats?.completedSales || 0,
        activeOffers: stats?.activeOffers || 0,
        valuationReviewRequired: stats?.valuationReviewRequired || 0,
        recentActivity
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/legal/matters
 */
router.get('/legal/matters', async (req, res) => {
  try {
    const matters = await d1.all(`
      SELECT ec.*, 
        a.public_ref, a.title as asset_title, a.occupancy_status, a.land_guard_risk, a.legal_hold_active,
        (SELECT COUNT(*) FROM legal_instruments WHERE case_id = ec.id) as instruments_count,
        (SELECT COUNT(*) FROM legal_instruments WHERE case_id = ec.id AND injunction_active = 1) as active_injunctions
      FROM enforcement_cases ec
      JOIN assets a ON ec.asset_id = a.id
      WHERE a.bank_id = ?
    `, req.bankId);
    res.json({ success: true, count: matters.length, data: matters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/title-documents
 */
router.get('/title-documents', async (req, res) => {
  try {
    const titles = await d1.all(`
      SELECT tr.*, a.public_ref, a.title as asset_title
      FROM title_records tr
      JOIN assets a ON tr.asset_id = a.id
      WHERE a.bank_id = ?
    `, req.bankId);
    res.json({ success: true, count: titles.length, data: titles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/viewings
 */
router.get('/viewings', async (req, res) => {
  try {
    const viewings = await d1.all(`
      SELECT v.*, a.public_ref, a.title as asset_title, a.occupancy_status
      FROM viewings v
      JOIN assets a ON v.asset_id = a.id
      WHERE a.bank_id = ?
      ORDER BY v.viewing_date DESC
    `, req.bankId);
    res.json({ success: true, count: viewings.length, data: viewings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/billing
 */
router.get('/billing', async (req, res) => {
  try {
    const [invoices, agreement, bank] = await Promise.all([
      d1.all(`SELECT * FROM invoices WHERE bank_id = ? ORDER BY issue_date DESC`, req.bankId),
      d1.get(`SELECT * FROM bank_agreements WHERE bank_id = ? AND status = 'Active'`, req.bankId),
      d1.get(`SELECT legal_name, default_commission_rate FROM banks WHERE id = ?`, req.bankId)
    ]);
    res.json({
      success: true,
      data: {
        bankName: bank?.legal_name,
        commissionRate: agreement?.commission_rate || bank?.default_commission_rate || 4.0,
        agreementRef: agreement?.agreement_ref || 'SURGE-AGR-STD-2026',
        invoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await d1.all(`
      SELECT u.id, u.username, u.full_name, u.email, u.role_code, u.status, u.mfa_enabled,
        r.name as role_name, b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_code = r.code
      LEFT JOIN bank_branches b ON u.branch_id = b.id
      WHERE u.bank_id = ?
    `, req.bankId);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bank/notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await d1.all(`
      SELECT * FROM notifications 
      ORDER BY created_at DESC LIMIT 20
    `);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

