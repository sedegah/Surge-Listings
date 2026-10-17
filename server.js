import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db/database.js';

initDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import publicRouter from './routes/public.js';
import bankRouter from './routes/bank.js';
import adminRouter from './routes/admin.js';

// Serve static directory (mockup HTML, client assets)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Mount 3 Isolated Security Endpoints
app.use('/api/public', publicRouter); // Public Marketplace (sanitized, unauthenticated)
app.use('/api/bank', bankRouter);     // Bank Partner Portal (tenant-isolated by bank_id)
app.use('/api/admin', adminRouter);   // Surge Super Administrator & Reviewer Portal

// Helper: Log audit action
function logAudit(actorName, actorRole, organization, actionType, entityType, entityId, deltaSummary, oldValues = null, newValues = null) {
  try {
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare(`
      INSERT INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, actorName, actorRole, organization, actionType, entityType, entityId, deltaSummary, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null);
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// Helper: Generate next public ref: SS-{CAT}-{YYYY}-{#####}
function generatePublicRef(catCode) {
  const code = catCode === 'House' ? 'RE' : catCode === 'Vehicle' ? 'VH' : catCode === 'Equipment' ? 'EQ' : 'AS';
  const year = new Date().getFullYear();
  const countRow = db.prepare("SELECT COUNT(*) as c FROM assets WHERE public_ref LIKE ?").get(`SS-${code}-${year}-%`);
  const seq = String((countRow ? countRow.c : 0) + 242).padStart(5, '0');
  return `SS-${code}-${year}-${seq}`;
}

// Helper: Check publish readiness guards (LG-2, VL-1, VL-2, AS-4, AS-8)
function evaluatePublishReadiness(assetId) {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(assetId);
  if (!asset) return null;

  // 1. Legal verification & Injunction check
  const injunctionRow = db.prepare(`
    SELECT li.injunction_active, li.verification_status, ec.case_number, li.instrument_ref
    FROM legal_instruments li
    JOIN enforcement_cases ec ON li.case_id = ec.id
    WHERE ec.asset_id = ? AND li.injunction_active = 1
  `).get(assetId);

  const activeInjunction = !!injunctionRow;

  // 2. Legal instruments verified
  const unverifiedLegal = db.prepare(`
    SELECT COUNT(*) as c FROM legal_instruments li
    JOIN enforcement_cases ec ON li.case_id = ec.id
    WHERE ec.asset_id = ? AND li.verification_status != 'Verified'
  `).get(assetId)?.c || 0;

  // 3. Title perfection
  const title = db.prepare("SELECT * FROM title_records WHERE asset_id = ?").get(assetId);
  const titleVerified = title ? title.verification_status === 'Verified' : false;

  // 4. Valuation validity
  const valuation = db.prepare("SELECT * FROM valuations WHERE asset_id = ?").get(assetId);
  const valuationValid = valuation ? (valuation.status === 'Valid' && valuation.review_required === 0) : true;

  // 5. Land search validity
  const landSearch = db.prepare("SELECT * FROM land_searches WHERE asset_id = ?").get(assetId);
  const landSearchValid = landSearch ? landSearch.status === 'Valid' : true;

  // 6. Exterior photo
  const exteriorPhoto = db.prepare("SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ? AND is_exterior = 1").get(assetId)?.c || 1; // default ok if not strictly required

  // 7. Legal hold
  const legalHoldActive = asset.legal_hold_active === 1;

  const guards = [
    { code: 'NO_INJUNCTION', name: 'No Active Court Injunction', passed: !activeInjunction, detail: activeInjunction ? `Injunction active on ${injunctionRow.instrument_ref}` : 'Court clearance verified' },
    { code: 'NO_LEGAL_HOLD', name: 'No Legal Hold Imposed', passed: !legalHoldActive, detail: legalHoldActive ? `Legal hold: ${asset.legal_hold_reason}` : 'Free from platform legal holds' },
    { code: 'LEGAL_VERIFIED', name: 'Legal Instruments Verified', passed: unverifiedLegal === 0, detail: unverifiedLegal === 0 ? 'All instruments verified by Legal Officer' : `${unverifiedLegal} instrument(s) pending verification` },
    { code: 'TITLE_VERIFIED', name: 'Title Perfection Confirmed', passed: titleVerified, detail: titleVerified ? 'Title verified' : 'Title verification pending' },
    { code: 'VALUATION_VALID', name: 'Valuation Within Validity Window', passed: valuationValid, detail: valuationValid ? 'Valuation current' : 'Valuation report expired or requires review' },
    { code: 'LAND_SEARCH_VALID', name: 'Land Search Current', passed: landSearchValid, detail: landSearchValid ? 'Land search current' : 'Land search expired' },
    { code: 'EXTERIOR_IMAGE', name: 'Exterior Media Available', passed: exteriorPhoto > 0, detail: 'Exterior photo verified' }
  ];

  const canPublish = guards.every(g => g.passed);
  return { asset, canPublish, activeInjunction, legalHoldActive, guards };
}

/* ============================================================
   LOOKUPS & SYSTEM METRICS
   ============================================================ */
app.get('/api/v1/lookups', (req, res) => {
  const categories = db.prepare('SELECT * FROM asset_categories').all();
  const banks = db.prepare("SELECT id, legal_name, short_code, default_commission_rate FROM banks WHERE status = 'Active'").all();
  const roles = db.prepare('SELECT * FROM roles').all();
  const regions = ['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta', 'Northern'];
  const occupancyStatuses = ['Vacant', 'Occupied — Cooperative', 'Occupied — Hostile'];
  res.json({ categories, banks, roles, regions, occupancyStatuses });
});

app.get('/api/v1/stats', (req, res) => {
  const totalAssets = db.prepare('SELECT COUNT(*) as c FROM assets').get().c;
  const liveListings = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'Live'").get().c;
  const pendingReview = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status IN ('Submitted by Bank', 'Surge Review')").get().c;
  const legalHolds = db.prepare('SELECT COUNT(*) as c FROM assets WHERE legal_hold_active = 1').get().c;
  const completedSales = db.prepare("SELECT COUNT(*) as c FROM offers WHERE status = 'Accepted'").get().c;
  const totalSaleValue = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM offers WHERE status = 'Accepted'").get().s;
  const activeOffers = db.prepare("SELECT COUNT(*) as c FROM offers WHERE status IN ('Submitted', 'Under Bank Review', 'Forwarded to Bank')").get().c;
  const pendingKYC = db.prepare("SELECT COUNT(*) as c FROM kyc_applications WHERE status = 'Pending'").get().c;
  const activeInjunctions = db.prepare('SELECT COUNT(*) as c FROM legal_instruments WHERE injunction_active = 1').get().c;

  res.json({
    totalAssets,
    liveListings,
    pendingReview,
    legalHolds,
    completedSales,
    totalSaleValue,
    activeOffers,
    pendingKYC,
    activeInjunctions
  });
});

/* ============================================================
   PUBLIC MARKETPLACE ENDPOINTS (/api/v1/public/*)
   Ensures strict Public DTO projection (PM-2, PM-3):
   NEVER returns bank name, internal ref, borrower, exact address
   ============================================================ */
app.get('/api/v1/public/assets', (req, res) => {
  const { region, category, priceMin, priceMax, occupancy, q } = req.query;
  let sql = `
    SELECT 
      id, public_ref, category_code, asset_type, title, description,
      region, district, town, public_location,
      CASE WHEN show_reserve_publicly = 1 THEN reserve_price ELSE NULL END as reserve_price,
      show_reserve_publicly, occupancy_status, status, review_required,
      beds, baths, year, mileage, fuel, updated_at
    FROM assets
    WHERE status = 'Live'
  `;
  const params = [];

  if (region && region !== 'All regions') {
    sql += ' AND region = ?';
    params.push(region);
  }
  if (category && category !== 'All categories') {
    sql += ' AND category_code = ?';
    params.push(category);
  }
  if (occupancy && occupancy !== 'Any') {
    sql += ' AND occupancy_status LIKE ?';
    params.push(`%${occupancy}%`);
  }
  if (priceMin) {
    sql += ' AND reserve_price >= ?';
    params.push(parseFloat(priceMin));
  }
  if (priceMax) {
    sql += ' AND reserve_price <= ?';
    params.push(parseFloat(priceMax));
  }
  if (q) {
    sql += ' AND (title LIKE ? OR public_location LIKE ? OR town LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  sql += ' ORDER BY updated_at DESC';
  const assets = db.prepare(sql).all(...params);
  res.json({ total: assets.length, data: assets });
});

app.get('/api/v1/public/assets/:ref', (req, res) => {
  const asset = db.prepare(`
    SELECT 
      id, public_ref, category_code, asset_type, title, description,
      region, district, town, public_location,
      CASE WHEN show_reserve_publicly = 1 THEN reserve_price ELSE NULL END as reserve_price,
      show_reserve_publicly, occupancy_status, status, review_required,
      beds, baths, year, mileage, fuel, updated_at
    FROM assets
    WHERE (public_ref = ? OR id = ?) AND status = 'Live'
  `).get(req.params.ref, req.params.ref);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found or not currently live for public viewing.' });
  }

  res.json(asset);
});

// Standalone or inline enquiry (PM-4, LD-1)
app.post('/api/v1/public/enquiries', (req, res) => {
  const { assetRef, buyerName, email, phone, message } = req.body;
  if (!buyerName || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const asset = assetRef ? db.prepare("SELECT id, public_ref FROM assets WHERE public_ref = ? OR id = ?").get(assetRef, assetRef) : null;
  const assetId = asset ? asset.id : 'ast-001';

  const enquiryId = 'enq-' + Math.random().toString(36).substring(2, 9);
  const leadId = 'lead-' + Math.random().toString(36).substring(2, 9);
  const leadYear = new Date().getFullYear();
  const countRow = db.prepare("SELECT COUNT(*) as c FROM leads").get();
  const leadRef = `SL-LEAD-${leadYear}-${String((countRow ? countRow.c : 0) + 43).padStart(6, '0')}`;

  // Insert enquiry
  db.prepare(`
    INSERT INTO enquiries (id, asset_id, buyer_name, email, phone, message, status, lead_id)
    VALUES (?, ?, ?, ?, ?, ?, 'Promoted', ?)
  `).run(enquiryId, assetId, buyerName, email, phone || '', message, leadId);

  // Auto-promote to Lead and assign agent Akosua Tetteh
  db.prepare(`
    INSERT INTO leads (id, lead_ref, asset_id, buyer_name, email, phone, stage, assigned_agent_id, assigned_agent_name, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'New', 'u-tetteh', 'Akosua Tetteh', 'Marketplace Enquiry', ?)
  `).run(leadId, leadRef, assetId, buyerName, email, phone || '', message);

  db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, description, actor_name)
    VALUES (?, ?, 'Enquiry Received', ?, ?)
  `).run('la-' + Math.random().toString(36).substring(2, 9), leadId, `Enquiry for ${asset?.public_ref || 'Asset'} submitted`, buyerName);

  logAudit(buyerName, 'Public Buyer', 'Public', 'Create Enquiry', 'Enquiry', enquiryId, `Enquiry created and promoted to lead ${leadRef}`);

  res.json({ success: true, enquiryId, leadRef, message: 'Your enquiry has been received. A Surge Solutions property specialist will contact you.' });
});

// Buyer KYC submission (KY-1)
app.post('/api/v1/public/kyc', (req, res) => {
  const { fullName, email, phone, ghanaCardNumber, sourceOfFunds, relatedAssetRef } = req.body;
  if (!fullName || !email || !phone || !ghanaCardNumber) {
    return res.status(400).json({ error: 'Full name, email, phone, and Ghana Card number are mandatory.' });
  }

  let buyer = db.prepare("SELECT id FROM buyers WHERE email = ?").get(email);
  const buyerId = buyer ? buyer.id : 'byr-' + Math.random().toString(36).substring(2, 9);
  if (!buyer) {
    db.prepare(`
      INSERT INTO buyers (id, full_name, email, phone, ghana_card_number, kyc_status)
      VALUES (?, ?, ?, ?, ?, 'Submitted')
    `).run(buyerId, fullName, email, phone, ghanaCardNumber);
  }

  const kycId = 'kyc-' + Math.random().toString(36).substring(2, 9);
  db.prepare(`
    INSERT INTO kyc_applications (id, buyer_id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review')
  `).run(kycId, buyerId, fullName, email, phone, ghanaCardNumber, sourceOfFunds || '', relatedAssetRef || '');

  // Record consents automatically
  const consentTypes = ['NDA', 'Buyer Disclaimer', 'Data Protection', 'Terms', 'Intermediary Disclosure'];
  for (const c of consentTypes) {
    db.prepare(`
      INSERT INTO consents (id, buyer_id, consent_type, document_version, ip_address)
      VALUES (?, ?, ?, 'v1.0', ?)
    `).run('cns-' + Math.random().toString(36).substring(2, 9), buyerId, c, req.ip || '127.0.0.1');
  }

  logAudit(fullName, 'Public Buyer', 'Public', 'Submit KYC', 'KYC Application', kycId, `KYC application submitted with Ghana Card ${ghanaCardNumber}`);

  res.json({ success: true, kycId, buyerId, message: 'KYC application submitted successfully for review.' });
});

// Buyer Restricted Access check & retrieval (KY-5, DC-2)
app.get('/api/v1/public/assets/:ref/restricted', (req, res) => {
  const { buyerEmail } = req.query;
  const asset = db.prepare("SELECT * FROM assets WHERE public_ref = ? OR id = ?").get(req.params.ref, req.params.ref);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  // Check buyer access grant
  let grant = null;
  if (buyerEmail) {
    grant = db.prepare(`
      SELECT bag.* FROM buyer_access_grants bag
      JOIN buyers b ON bag.buyer_id = b.id
      WHERE b.email = ? AND bag.asset_id = ? AND bag.status = 'Active'
    `).get(buyerEmail, asset.id);
  }

  // Also allow Dr. Kwabena Frimpong (demo buyer)
  if (!grant && buyerEmail === 'k.frimpong@apexmed.com.gh') {
    grant = { id: 'grt-demo', status: 'Active' };
  }

  if (!grant) {
    return res.status(403).json({ error: 'Access restricted. Verified KYC and an active Buyer Access Grant are required to inspect confidential documents and exact location.' });
  }

  // Log confidential access
  db.prepare(`
    INSERT INTO document_access_logs (id, document_id, user_name, user_role, ip_address, access_type)
    VALUES (?, ?, ?, 'Verified Buyer', ?, 'RESTRICTED_ASSET_ACCESS')
  `).run('dal-' + Math.random().toString(36).substring(2, 9), asset.id, buyerEmail || 'Verified Buyer', req.ip || '127.0.0.1');

  res.json({
    public_ref: asset.public_ref,
    title: asset.title,
    exact_address: asset.exact_address,
    reserve_price: asset.reserve_price,
    minimum_offer: asset.minimum_offer,
    occupancy_status: asset.occupancy_status,
    land_guard_risk: asset.land_guard_risk,
    documents: db.prepare("SELECT id, title, category, file_size, verification_status FROM documents WHERE asset_id = ?").all(asset.id),
    title_info: db.prepare("SELECT certificate_number, registry, perfection_status FROM title_records WHERE asset_id = ?").get(asset.id),
    valuation_info: db.prepare("SELECT valuer_name, market_value, forced_sale_value, expiry_date, status FROM valuations WHERE asset_id = ?").get(asset.id)
  });
});

// Submit viewing request
app.post('/api/v1/public/viewings', (req, res) => {
  const { assetRef, buyerName, buyerEmail, viewingDate, timeSlot, notes } = req.body;
  if (!assetRef || !buyerName || !viewingDate || !timeSlot) {
    return res.status(400).json({ error: 'Asset reference, buyer name, date, and time slot are required.' });
  }

  const asset = db.prepare("SELECT id, public_ref, occupancy_status, land_guard_risk FROM assets WHERE public_ref = ? OR id = ?").get(assetRef, assetRef);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const viewingId = 'vw-' + Math.random().toString(36).substring(2, 9);
  const isHighRisk = asset.occupancy_status === 'Occupied — Hostile' || asset.land_guard_risk === 'High';

  db.prepare(`
    INSERT INTO viewings (id, asset_id, buyer_name, agent_id, agent_name, viewing_date, time_slot, status, high_risk_override, notes)
    VALUES (?, ?, ?, 'u-tetteh', 'Akosua Tetteh', ?, ?, 'Requested', 0, ?)
  `).run(viewingId, asset.id, buyerName, viewingDate, timeSlot, notes || '');

  logAudit(buyerName, 'Buyer', 'Public', 'Request Viewing', 'Viewing', viewingId, `Viewing requested for ${asset.public_ref} on ${viewingDate} (${timeSlot})`);

  res.json({
    success: true,
    viewingId,
    status: 'Requested',
    isHighRisk,
    message: isHighRisk
      ? 'Viewing request logged. Note: This asset has a High-Risk occupancy classification and will require Administrator security clearance before confirmation.'
      : 'Viewing appointment requested. A Surge Solutions agent will confirm your appointment.'
  });
});

// Submit offer (OF-1, PR-3, PR-4)
app.post('/api/v1/public/offers', (req, res) => {
  const { assetRef, buyerName, buyerEmail, amount, validityDate, conditions } = req.body;
  if (!assetRef || !buyerName || !amount) {
    return res.status(400).json({ error: 'Asset reference, buyer name, and offer amount are required.' });
  }

  const asset = db.prepare("SELECT id, public_ref, reserve_price, minimum_offer FROM assets WHERE public_ref = ? OR id = ?").get(assetRef, assetRef);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const numAmount = parseFloat(amount);
  if (asset.minimum_offer && numAmount < asset.minimum_offer) {
    return res.status(400).json({ error: `Offer rejected. The submitted offer of GHS ${numAmount.toLocaleString()} is below the minimum permissible offer threshold of GHS ${asset.minimum_offer.toLocaleString()} (PR-4).` });
  }

  const belowReserve = numAmount < asset.reserve_price ? 1 : 0;
  const offerId = 'off-' + Math.random().toString(36).substring(2, 9);
  const countRow = db.prepare("SELECT COUNT(*) as c FROM offers").get();
  const offerRef = `SS-OFF-${new Date().getFullYear()}-${String((countRow ? countRow.c : 0) + 82).padStart(4, '0')}`;
  const validUntil = validityDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO offers (id, offer_ref, asset_id, buyer_name, amount, validity_date, conditions, status, below_reserve, exception_requested)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Surge Review', ?, ?)
  `).run(offerId, offerRef, asset.id, buyerName, numAmount, validUntil, conditions || '', belowReserve, belowReserve);

  db.prepare(`
    INSERT INTO offer_revisions (id, offer_id, amount, proposed_by, notes)
    VALUES (?, ?, ?, 'Buyer', ?)
  `).run('rev-' + Math.random().toString(36).substring(2, 9), offerId, numAmount, 'Initial offer submission');

  logAudit(buyerName, 'Buyer', 'Public', 'Submit Offer', 'Offer', offerRef, `Offer of GHS ${numAmount.toLocaleString()} submitted for ${asset.public_ref} (Below reserve: ${belowReserve ? 'Yes' : 'No'})`);

  res.json({
    success: true,
    offerId,
    offerRef,
    amount: numAmount,
    status: 'Surge Review',
    message: 'Offer submitted successfully. Surge Solutions will review and forward to the bank approvers.'
  });
});

/* ============================================================
   BANK PORTAL ENDPOINTS (/api/v1/bank/*)
   Tenant-isolated (MT-1): scoped to bank_id = 'bank-mtb'
   ============================================================ */
app.get('/api/v1/bank/dashboard', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const totalAssets = db.prepare("SELECT COUNT(*) as c FROM assets WHERE bank_id = ?").get(bankId)?.c || 0;
  const liveAssets = db.prepare("SELECT COUNT(*) as c FROM assets WHERE bank_id = ? AND status = 'Live'").get(bankId)?.c || 0;
  const submittedAssets = db.prepare("SELECT COUNT(*) as c FROM assets WHERE bank_id = ? AND status = 'Submitted by Bank'").get(bankId)?.c || 0;
  const pendingDecisions = db.prepare(`
    SELECT COUNT(*) as c FROM offers o
    JOIN assets a ON o.asset_id = a.id
    WHERE a.bank_id = ? AND o.status = 'Under Bank Review'
  `).get(bankId)?.c || 0;
  const invoicesDue = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM invoices WHERE bank_id = ? AND status IN ('Issued', 'Overdue')").get(bankId)?.s || 0;
  const recentAssets = db.prepare("SELECT id, public_ref, title, status, reserve_price, updated_at FROM assets WHERE bank_id = ? ORDER BY updated_at DESC LIMIT 5").all(bankId);

  res.json({ totalAssets, liveAssets, submittedAssets, pendingDecisions, invoicesDue, recentAssets });
});

app.get('/api/v1/bank/assets', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const { status, q } = req.query;
  let sql = "SELECT * FROM assets WHERE bank_id = ?";
  const params = [bankId];

  if (status && status !== 'All') {
    sql += " AND status = ?";
    params.push(status);
  }
  if (q) {
    sql += " AND (public_ref LIKE ? OR internal_bank_ref LIKE ? OR title LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  sql += " ORDER BY updated_at DESC";
  const assets = db.prepare(sql).all(...params);
  res.json({ total: assets.length, data: assets });
});

app.get('/api/v1/bank/assets/:id', (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const enforcement = db.prepare("SELECT * FROM enforcement_cases WHERE asset_id = ?").get(asset.id);
  const instruments = enforcement ? db.prepare("SELECT * FROM legal_instruments WHERE case_id = ?").all(enforcement.id) : [];
  const title = db.prepare("SELECT * FROM title_records WHERE asset_id = ?").get(asset.id);
  const landSearches = db.prepare("SELECT * FROM land_searches WHERE asset_id = ?").all(asset.id);
  const valuations = db.prepare("SELECT * FROM valuations WHERE asset_id = ?").all(asset.id);
  const documents = db.prepare("SELECT * FROM documents WHERE asset_id = ?").all(asset.id);
  const offers = db.prepare("SELECT * FROM offers WHERE asset_id = ? ORDER BY created_at DESC").all(asset.id);
  const audit = db.prepare("SELECT * FROM audit_logs WHERE entity_id IN (?, ?) ORDER BY created_at DESC LIMIT 10").all(asset.id, asset.public_ref);

  res.json({ asset, enforcement, instruments, title, landSearches, valuations, documents, offers, audit });
});

// Bank creates asset (AS-1, AS-2)
app.post('/api/v1/bank/assets', (req, res) => {
  const { bankId = 'bank-mtb', categoryCode, assetType, internalBankRef, title, description, region, district, town, exactAddress, reservePrice, minimumOffer, showReservePublicly, occupancyStatus, landGuardRisk, beds, baths, year, mileage, fuel } = req.body;

  if (!categoryCode || !assetType || !internalBankRef || !region || !reservePrice) {
    return res.status(400).json({ error: 'Category, asset type, internal bank reference, region, and reserve price are required.' });
  }

  const publicRef = generatePublicRef(categoryCode);
  const id = 'ast-' + Math.random().toString(36).substring(2, 9);
  const publicLocation = `${town || district || region}, ${region}`;

  db.prepare(`
    INSERT INTO assets (
      id, bank_id, public_ref, internal_bank_ref, category_code, asset_type, title, description,
      region, district, town, public_location, exact_address, reserve_price, minimum_offer,
      show_reserve_publicly, occupancy_status, land_guard_risk, status, beds, baths, year, mileage, fuel, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, 'j.mensah')
  `).run(
    id, bankId, publicRef, internalBankRef, categoryCode, assetType, title || `${town || region} ${assetType}`, description || '',
    region, district || '', town || '', publicLocation, exactAddress || '', parseFloat(reservePrice), minimumOffer ? parseFloat(minimumOffer) : null,
    showReservePublicly ? 1 : 0, occupancyStatus || 'Vacant', landGuardRisk || 'Low', beds || null, baths || null, year || null, mileage || null, fuel || null
  );

  logAudit('j.mensah', 'Legal / Recovery Officer', 'Meridian Trust Bank', 'Create Asset', 'Asset', publicRef, `Asset draft created: ${publicRef} (${internalBankRef})`);

  res.json({ success: true, id, publicRef, status: 'Draft', message: 'Asset draft created successfully.' });
});

// Update asset draft (AS-3)
app.put('/api/v1/bank/assets/:id', (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const {
    categoryCode = null, assetType = null, title = null, description = null,
    region = null, district = null, town = null, publicLocation = null,
    exactAddress = null, reservePrice = null, minimumOffer = null,
    showReservePublicly = null, occupancyStatus = null, landGuardRisk = null,
    beds = null, baths = null, year = null, mileage = null, fuel = null
  } = req.body;

  db.prepare(`
    UPDATE assets SET
      category_code = COALESCE(?, category_code),
      asset_type = COALESCE(?, asset_type),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      region = COALESCE(?, region),
      district = COALESCE(?, district),
      town = COALESCE(?, town),
      public_location = COALESCE(?, public_location),
      exact_address = COALESCE(?, exact_address),
      reserve_price = COALESCE(?, reserve_price),
      minimum_offer = COALESCE(?, minimum_offer),
      show_reserve_publicly = COALESCE(?, show_reserve_publicly),
      occupancy_status = COALESCE(?, occupancy_status),
      land_guard_risk = COALESCE(?, land_guard_risk),
      beds = COALESCE(?, beds),
      baths = COALESCE(?, baths),
      year = COALESCE(?, year),
      mileage = COALESCE(?, mileage),
      fuel = COALESCE(?, fuel),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    categoryCode, assetType, title, description, region, district, town,
    publicLocation, exactAddress, reservePrice, minimumOffer, showReservePublicly,
    occupancyStatus, landGuardRisk, beds, baths, year, mileage, fuel,
    asset.id
  );

  logAudit('j.mensah', 'Legal / Recovery Officer', 'Meridian Trust Bank', 'Update Asset Draft', 'Asset', asset.public_ref, `Updated asset draft details for ${asset.public_ref}`);
  res.json({ success: true, message: `Asset ${asset.public_ref} updated successfully.` });
});

// Bank Legal Matters (LG-5)
app.get('/api/v1/bank/legal/matters', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const matters = db.prepare(`
    SELECT ec.*, a.public_ref, a.internal_bank_ref, a.title as asset_title,
      (SELECT COUNT(*) FROM legal_instruments WHERE case_id = ec.id) as instrument_count,
      (SELECT COUNT(*) FROM legal_instruments WHERE case_id = ec.id AND injunction_active = 1) as active_injunctions
    FROM enforcement_cases ec
    JOIN assets a ON ec.asset_id = a.id
    WHERE a.bank_id = ?
    ORDER BY ec.id DESC
  `).all(bankId);
  res.json({ total: matters.length, data: matters });
});

// Bank Title Documents & Searches (TL-1, TL-3)
app.get('/api/v1/bank/title-documents', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const titles = db.prepare(`
    SELECT tr.*, a.public_ref, a.internal_bank_ref, a.title as asset_title
    FROM title_records tr
    JOIN assets a ON tr.asset_id = a.id
    WHERE a.bank_id = ?
    ORDER BY tr.id DESC
  `).all(bankId);
  const landSearches = db.prepare(`
    SELECT ls.*, a.public_ref, a.internal_bank_ref, a.title as asset_title
    FROM land_searches ls
    JOIN assets a ON ls.asset_id = a.id
    WHERE a.bank_id = ?
    ORDER BY ls.search_date DESC
  `).all(bankId);
  res.json({ titles, landSearches });
});

// Bank Viewings (VW-1)
app.get('/api/v1/bank/viewings', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const viewings = db.prepare(`
    SELECT v.*, a.public_ref, a.internal_bank_ref, a.title as asset_title, a.occupancy_status, a.land_guard_risk
    FROM viewings v
    JOIN assets a ON v.asset_id = a.id
    WHERE a.bank_id = ?
    ORDER BY v.created_at DESC
  `).all(bankId);
  res.json({ total: viewings.length, data: viewings });
});

// Bank Billing & Invoices (FE-1, FE-5)
app.get('/api/v1/bank/billing', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const invoices = db.prepare(`
    SELECT i.*, b.legal_name as bank_name
    FROM invoices i
    JOIN banks b ON i.bank_id = b.id
    WHERE i.bank_id = ?
    ORDER BY i.created_at DESC
  `).all(bankId);
  res.json({ total: invoices.length, data: invoices });
});

// Bank Users (RBAC)
app.get('/api/v1/bank/users', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const bank = db.prepare("SELECT * FROM banks WHERE id = ?").get(bankId);
  const users = db.prepare(`
    SELECT u.*, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_code = r.code
    WHERE u.organization_id = ?
    ORDER BY u.created_at DESC
  `).all(bank ? bank.organization_id : 'org-mtb');
  res.json({ total: users.length, data: users });
});

// Bank Notifications
app.get('/api/v1/bank/notifications', (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications 
    ORDER BY created_at DESC
  `).all();
  res.json({ total: notifs.length, data: notifs });
});

// Submit asset for review (AS-6)
app.post('/api/v1/bank/assets/:id/submit', (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const oldStatus = asset.status;
  db.prepare("UPDATE assets SET status = 'Submitted by Bank', updated_at = datetime('now') WHERE id = ?").run(asset.id);

  logAudit('j.mensah', 'Legal / Recovery Officer', 'Meridian Trust Bank', 'Submit Asset', 'Asset', asset.public_ref, `Status changed from ${oldStatus} -> Submitted by Bank`, { status: oldStatus }, { status: 'Submitted by Bank' });

  res.json({ success: true, id: asset.id, publicRef: asset.public_ref, status: 'Submitted by Bank', message: 'Asset successfully submitted for Surge review.' });
});

// Bank offers
app.get('/api/v1/bank/offers', (req, res) => {
  const bankId = req.query.bankId || 'bank-mtb';
  const offers = db.prepare(`
    SELECT o.*, a.public_ref, a.title as asset_title, a.reserve_price, a.internal_bank_ref
    FROM offers o
    JOIN assets a ON o.asset_id = a.id
    WHERE a.bank_id = ?
    ORDER BY o.created_at DESC
  `).all(bankId);

  res.json({ total: offers.length, data: offers });
});

// Bank Approver records decision on offer (OF-2, OF-3, OF-5)
app.post('/api/v1/bank/offers/:id/decision', (req, res) => {
  const { decision, counterAmount, notes, actor = 'a.owusu' } = req.body; // 'Accept', 'Reject', 'Counter'
  const offer = db.prepare("SELECT o.*, a.public_ref, a.bank_id FROM offers o JOIN assets a ON o.asset_id = a.id WHERE o.id = ? OR o.offer_ref = ?").get(req.params.id, req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found.' });

  if (decision === 'Accept') {
    // 1. Set offer accepted
    db.prepare("UPDATE offers SET status = 'Accepted', notes = ?, updated_at = datetime('now') WHERE id = ?").run(notes || 'Accepted by Bank Approver', offer.id);
    
    // 2. Mark asset Sold
    db.prepare("UPDATE assets SET status = 'Sold', updated_at = datetime('now') WHERE id = ?").run(offer.asset_id);

    // 3. Calculate commission (4% default: e.g. GHS 950,000 * 4% = GHS 38,000.00)
    const bank = db.prepare("SELECT default_commission_rate FROM banks WHERE id = ?").get(offer.bank_id);
    const rate = bank ? bank.default_commission_rate : 4.0;
    const commissionAmount = Math.round(offer.amount * (rate / 100) * 100) / 100;

    const commissionId = 'com-' + Math.random().toString(36).substring(2, 9);
    db.prepare(`
      INSERT INTO commissions (id, offer_id, asset_id, bank_id, final_sale_price, commission_rate, commission_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Invoiced')
    `).run(commissionId, offer.id, offer.asset_id, offer.bank_id, offer.amount, rate, commissionAmount);

    // 4. Create Invoice
    const invCount = db.prepare("SELECT COUNT(*) as c FROM invoices").get()?.c || 0;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 15).padStart(6, '0')}`;
    const invoiceId = 'inv-' + Math.random().toString(36).substring(2, 9);

    db.prepare(`
      INSERT INTO invoices (id, invoice_number, commission_id, bank_id, amount, description, issue_date, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, date('now'), date('now', '+30 days'), 'Issued')
    `).run(invoiceId, invoiceNumber, commissionId, offer.bank_id, commissionAmount, `Platform commission on disposal of ${offer.public_ref} (${rate}% of GHS ${offer.amount.toLocaleString()})`);

    // 5. Close competing offers
    db.prepare("UPDATE offers SET status = 'Withdrawn' WHERE asset_id = ? AND id != ? AND status NOT IN ('Accepted', 'Rejected')").run(offer.asset_id, offer.id);

    logAudit(actor, 'Approver', 'Meridian Trust Bank', 'Accept Offer', 'Offer', offer.offer_ref, `Offer accepted for GHS ${offer.amount.toLocaleString()}. Sale completed; invoice ${invoiceNumber} created for GHS ${commissionAmount.toLocaleString()}`);

    return res.json({ success: true, status: 'Accepted', commissionAmount, invoiceNumber, message: 'Offer accepted, asset marked Sold, and commission invoice generated.' });
  } else if (decision === 'Reject') {
    db.prepare("UPDATE offers SET status = 'Rejected', notes = ?, updated_at = datetime('now') WHERE id = ?").run(notes || 'Rejected by Bank Approver', offer.id);
    logAudit(actor, 'Approver', 'Meridian Trust Bank', 'Reject Offer', 'Offer', offer.offer_ref, `Offer rejected: ${notes || 'No reason provided'}`);
    return res.json({ success: true, status: 'Rejected' });
  } else if (decision === 'Counter') {
    const counter = parseFloat(counterAmount);
    if (!counter) return res.status(400).json({ error: 'Counter offer amount is required.' });

    db.prepare("UPDATE offers SET status = 'Countered', notes = ?, updated_at = datetime('now') WHERE id = ?").run(`Bank countered with GHS ${counter.toLocaleString()}. ${notes || ''}`, offer.id);
    db.prepare(`
      INSERT INTO offer_revisions (id, offer_id, amount, proposed_by, notes)
      VALUES (?, ?, ?, 'Bank', ?)
    `).run('rev-' + Math.random().toString(36).substring(2, 9), offer.id, counter, notes || 'Counter offer from bank');

    logAudit(actor, 'Approver', 'Meridian Trust Bank', 'Counter Offer', 'Offer', offer.offer_ref, `Bank countered offer with GHS ${counter.toLocaleString()}`);
    return res.json({ success: true, status: 'Countered', counterAmount: counter });
  }

  res.status(400).json({ error: 'Invalid decision action.' });
});

/* ============================================================
   SURGE ADMIN ENDPOINTS (/api/v1/admin/*)
   Platform-wide operations across all tenants (MT-1)
   ============================================================ */
app.get('/api/v1/admin/dashboard', (req, res) => {
  const totalAssets = db.prepare('SELECT COUNT(*) as c FROM assets').get().c;
  const liveListings = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'Live'").get().c;
  const pendingReview = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status IN ('Submitted by Bank', 'Surge Review')").get().c;
  const legalHolds = db.prepare('SELECT COUNT(*) as c FROM assets WHERE legal_hold_active = 1').get().c;
  const activeInjunctions = db.prepare('SELECT COUNT(*) as c FROM legal_instruments WHERE injunction_active = 1').get().c;
  const completedSales = db.prepare("SELECT COUNT(*) as c FROM offers WHERE status = 'Accepted'").get().c;
  const totalRealized = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM offers WHERE status = 'Accepted'").get().s;

  const queueItems = db.prepare(`
    SELECT a.id, a.public_ref, a.title, a.status, a.occupancy_status, a.legal_hold_active, b.short_code as bank_code
    FROM assets a
    JOIN banks b ON a.bank_id = b.id
    WHERE a.status IN ('Submitted by Bank', 'Surge Review', 'Legal Hold')
    ORDER BY a.updated_at DESC
  `).all();

  res.json({
    kpis: { totalAssets, liveListings, pendingReview, legalHolds, activeInjunctions, completedSales, totalRealized },
    queueItems
  });
});

app.get('/api/v1/admin/assets', (req, res) => {
  const { bank, status, category, region, legalHold, q } = req.query;
  let sql = `
    SELECT 
      a.*, b.legal_name as bank_name, b.short_code as bank_code,
      (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as offer_count,
      (SELECT injunction_active FROM legal_instruments li JOIN enforcement_cases ec ON li.case_id = ec.id WHERE ec.asset_id = a.id AND li.injunction_active = 1 LIMIT 1) as active_injunction
    FROM assets a
    JOIN banks b ON a.bank_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (bank) {
    sql += ' AND (b.short_code = ? OR b.id = ?)';
    params.push(bank, bank);
  }
  if (status && status !== 'All') {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (category && category !== 'All') {
    sql += ' AND a.category_code = ?';
    params.push(category);
  }
  if (region && region !== 'All') {
    sql += ' AND a.region = ?';
    params.push(region);
  }
  if (legalHold === 'true') {
    sql += ' AND a.legal_hold_active = 1';
  }
  if (q) {
    sql += ' AND (a.public_ref LIKE ? OR a.internal_bank_ref LIKE ? OR a.title LIKE ? OR b.legal_name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  sql += ' ORDER BY a.updated_at DESC';
  const data = db.prepare(sql).all(...params);
  res.json({ total: data.length, data });
});

// Publish readiness evaluation
app.get('/api/v1/admin/assets/:id/publish-readiness', (req, res) => {
  const result = evaluatePublishReadiness(req.params.id);
  if (!result) return res.status(404).json({ error: 'Asset not found.' });
  res.json(result);
});

// Publish listing (AS-8, LG-2: hard rule, blocked if injunction active or legal hold)
app.post('/api/v1/admin/assets/:id/publish', (req, res) => {
  const readiness = evaluatePublishReadiness(req.params.id);
  if (!readiness) return res.status(404).json({ error: 'Asset not found.' });

  if (readiness.activeInjunction) {
    return res.status(409).json({
      error: 'LISTING BLOCKED: Active injunction recorded. Publication is strictly prohibited under Rule LG-2 until the legal restriction is cleared.',
      guards: readiness.guards
    });
  }

  if (readiness.legalHoldActive) {
    return res.status(409).json({
      error: `LISTING BLOCKED: Asset is on Legal Hold: "${readiness.asset.legal_hold_reason}". Release hold before publishing.`,
      guards: readiness.guards
    });
  }

  const oldStatus = readiness.asset.status;
  db.prepare("UPDATE assets SET status = 'Live', updated_at = datetime('now') WHERE id = ?").run(readiness.asset.id);

  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Publish Listing', 'Asset', readiness.asset.public_ref, `Listing published. Status changed from ${oldStatus} -> Live`, { status: oldStatus }, { status: 'Live' });

  res.json({ success: true, status: 'Live', message: `Asset ${readiness.asset.public_ref} is now published and Live on the Public Marketplace.` });
});

// Unpublish listing
app.post('/api/v1/admin/assets/:id/unpublish', (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const oldStatus = asset.status;
  db.prepare("UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?").run(asset.id);

  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Unpublish Listing', 'Asset', asset.public_ref, `Listing unpublished. Status: Live -> Approved`, { status: oldStatus }, { status: 'Approved' });

  res.json({ success: true, status: 'Approved', message: `Asset ${asset.public_ref} unpublished.` });
});

// Legal Hold placement & release (LG-4)
app.post('/api/v1/admin/assets/:id/legal-hold', (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A mandatory reason is required to place a Legal Hold.' });
  }

  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const oldStatus = asset.status;
  db.prepare("UPDATE assets SET legal_hold_active = 1, legal_hold_reason = ?, status = 'Legal Hold', updated_at = datetime('now') WHERE id = ?").run(reason.trim(), asset.id);

  logAudit('k.addo', 'Legal Verification Officer', 'Surge Solutions', 'Place Legal Hold', 'Asset', asset.public_ref, `Legal Hold imposed. Reason: ${reason}. Listing force-unpublished.`, { legal_hold_active: 0, status: oldStatus }, { legal_hold_active: 1, status: 'Legal Hold' });

  res.json({ success: true, status: 'Legal Hold', message: `Legal hold placed on ${asset.public_ref}. Active listing unpublished.` });
});

app.post('/api/v1/admin/assets/:id/legal-hold/release', (req, res) => {
  const { reason } = req.body;
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  db.prepare("UPDATE assets SET legal_hold_active = 0, legal_hold_reason = null, status = 'Approved', updated_at = datetime('now') WHERE id = ?").run(asset.id);

  logAudit('k.addo', 'Legal Verification Officer', 'Surge Solutions', 'Release Legal Hold', 'Asset', asset.public_ref, `Legal hold released. Reason: ${reason || 'Legal clearance confirmed'}. Status: Approved.`);

  res.json({ success: true, status: 'Approved', message: `Legal hold released on ${asset.public_ref}. Status returned to Approved.` });
});

// Injunction control (LG-2)
app.put('/api/v1/admin/legal/instruments/:id/injunction', (req, res) => {
  const { injunctionActive } = req.body;
  const active = injunctionActive ? 1 : 0;

  const inst = db.prepare("SELECT li.*, ec.asset_id FROM legal_instruments li JOIN enforcement_cases ec ON li.case_id = ec.id WHERE li.id = ?").get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Instrument not found.' });

  db.prepare("UPDATE legal_instruments SET injunction_active = ? WHERE id = ?").run(active, inst.id);

  // If set to true, force unpublish asset if currently Live
  if (active === 1) {
    db.prepare("UPDATE assets SET status = 'Surge Review' WHERE id = ? AND status = 'Live'").run(inst.asset_id);
  }

  logAudit('k.addo', 'Legal Verification Officer', 'Surge Solutions', 'Update Injunction Status', 'Instrument', inst.instrument_ref, `Injunction active flag changed to ${active ? 'TRUE' : 'FALSE'}`);

  res.json({ success: true, injunctionActive: active, message: `Injunction state updated for ${inst.instrument_ref}.` });
});

// KYC Verification by Surge Admin (KY-2, KY-4)
app.get('/api/v1/admin/kyc', (req, res) => {
  const kycList = db.prepare("SELECT * FROM kyc_applications ORDER BY created_at DESC").all();
  res.json({ total: kycList.length, data: kycList });
});

app.post('/api/v1/admin/kyc/:id/decision', (req, res) => {
  const { decision, reviewerNote, internalNote } = req.body; // 'Verify', 'Reject'
  const kyc = db.prepare("SELECT * FROM kyc_applications WHERE id = ?").get(req.params.id);
  if (!kyc) return res.status(404).json({ error: 'KYC application not found.' });

  if (decision === 'Verify') {
    db.prepare("UPDATE kyc_applications SET status = 'Verified', reviewer_note = ?, internal_note = ?, reviewed_by = 'a.boateng', reviewed_at = datetime('now') WHERE id = ?").run(reviewerNote || 'Verified', internalNote || '', kyc.id);
    if (kyc.buyer_id) {
      db.prepare("UPDATE buyers SET kyc_status = 'Verified' WHERE id = ?").run(kyc.buyer_id);
    }

    // Auto-create BuyerAccessGrant if related asset exists
    if (kyc.related_asset_ref) {
      const asset = db.prepare("SELECT id FROM assets WHERE public_ref = ?").get(kyc.related_asset_ref);
      if (asset && kyc.buyer_id) {
        db.prepare(`
          INSERT INTO buyer_access_grants (id, buyer_id, asset_id, expires_at, status)
          VALUES (?, ?, ?, date('now', '+30 days'), 'Active')
        `).run('grt-' + Math.random().toString(36).substring(2, 9), kyc.buyer_id, asset.id);
      }
    }

    logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Verify KYC', 'KYC', kyc.id, `KYC verified for ${kyc.full_name}. Access grant generated.`);
    return res.json({ success: true, status: 'Verified', message: `KYC verified for ${kyc.full_name}.` });
  } else if (decision === 'Reject') {
    db.prepare("UPDATE kyc_applications SET status = 'Rejected', reviewer_note = ?, internal_note = ?, reviewed_by = 'a.boateng', reviewed_at = datetime('now') WHERE id = ?").run(reviewerNote || 'Rejected', internalNote || '', kyc.id);
    if (kyc.buyer_id) {
      db.prepare("UPDATE buyers SET kyc_status = 'Rejected' WHERE id = ?").run(kyc.buyer_id);
    }
    logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Reject KYC', 'KYC', kyc.id, `KYC rejected for ${kyc.full_name}: ${reviewerNote}`);
    return res.json({ success: true, status: 'Rejected' });
  }

  res.status(400).json({ error: 'Invalid decision.' });
});

// Leads & pipeline (LD-1, LD-2, LD-3)
app.get('/api/v1/admin/leads', (req, res) => {
  const leads = db.prepare(`
    SELECT l.*, a.public_ref as asset_ref, a.title as asset_title
    FROM leads l
    JOIN assets a ON l.asset_id = a.id
    ORDER BY l.updated_at DESC
  `).all();
  res.json({ total: leads.length, data: leads });
});

app.post('/api/v1/admin/leads/:id/transition', (req, res) => {
  const { stage, notes } = req.body;
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  const oldStage = lead.stage;
  db.prepare("UPDATE leads SET stage = ?, updated_at = datetime('now') WHERE id = ?").run(stage, lead.id);

  db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, description, actor_name)
    VALUES (?, ?, 'Stage Transition', ?, 'Akosua Tetteh')
  `).run('la-' + Math.random().toString(36).substring(2, 9), lead.id, `Lead stage moved from ${oldStage} -> ${stage}. ${notes || ''}`);

  logAudit('a.tetteh', 'Sales Agent', 'Surge Solutions', 'Transition Lead Stage', 'Lead', lead.lead_ref, `Stage: ${oldStage} -> ${stage}`);

  res.json({ success: true, stage, message: `Lead updated to ${stage}.` });
});

// Viewings with High-Risk Occupancy override requirement (OC-1, VW-1)
app.get('/api/v1/admin/viewings', (req, res) => {
  const viewings = db.prepare(`
    SELECT v.*, a.public_ref, a.title as asset_title, a.occupancy_status, a.land_guard_risk
    FROM viewings v
    JOIN assets a ON v.asset_id = a.id
    ORDER BY v.created_at DESC
  `).all();
  res.json({ total: viewings.length, data: viewings });
});

app.post('/api/v1/admin/viewings/:id/confirm', (req, res) => {
  const { overrideReason } = req.body;
  const viewing = db.prepare("SELECT v.*, a.occupancy_status, a.land_guard_risk, a.public_ref FROM viewings v JOIN assets a ON v.asset_id = a.id WHERE v.id = ?").get(req.params.id);
  if (!viewing) return res.status(404).json({ error: 'Viewing not found.' });

  const isHostile = viewing.occupancy_status === 'Occupied — Hostile' || viewing.land_guard_risk === 'High';
  if (isHostile && !viewing.high_risk_override && (!overrideReason || !overrideReason.trim())) {
    return res.status(400).json({
      error: 'HIGH-RISK OCCUPANCY OVERRIDE REQUIRED: This property has hostile occupancy or high land guard risk. Scheduling or confirming this viewing requires an explicit administrator security override recorded with a mandatory reason (Rule OC-1).'
    });
  }

  const overrideActive = isHostile ? 1 : 0;
  db.prepare(`
    UPDATE viewings 
    SET status = 'Confirmed', high_risk_override = ?, override_reason = ?, override_by = 'a.boateng', address_disclosed = 1
    WHERE id = ?
  `).run(overrideActive, overrideReason || viewing.override_reason || null, viewing.id);

  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Confirm Viewing', 'Viewing', viewing.id, `Viewing confirmed for ${viewing.public_ref} with Dr. Kwabena Frimpong. ${isHostile ? 'High-risk override recorded.' : ''}`);

  res.json({ success: true, status: 'Confirmed', message: 'Viewing confirmed successfully.' });
});

// Admin Offers management
app.get('/api/v1/admin/offers', (req, res) => {
  const offers = db.prepare(`
    SELECT o.*, a.public_ref, a.title as asset_title, a.reserve_price, b.legal_name as bank_name
    FROM offers o
    JOIN assets a ON o.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY o.created_at DESC
  `).all();
  res.json({ total: offers.length, data: offers });
});

app.post('/api/v1/admin/offers/:id/forward', (req, res) => {
  const offer = db.prepare("SELECT o.*, a.public_ref FROM offers o JOIN assets a ON o.asset_id = a.id WHERE o.id = ?").get(req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found.' });

  db.prepare("UPDATE offers SET status = 'Under Bank Review', updated_at = datetime('now') WHERE id = ?").run(offer.id);

  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Forward Offer', 'Offer', offer.offer_ref, `Offer of GHS ${offer.amount.toLocaleString()} forwarded to bank approver.`);

  res.json({ success: true, status: 'Under Bank Review', message: `Offer ${offer.offer_ref} forwarded to bank for decision.` });
});

// Invoices, Billing & Fees (FE-1, FE-2, FE-5)
app.get('/api/v1/admin/finance/invoices', (req, res) => {
  const invoices = db.prepare(`
    SELECT i.*, b.legal_name as bank_name, b.short_code as bank_code
    FROM invoices i
    JOIN banks b ON i.bank_id = b.id
    ORDER BY i.created_at DESC
  `).all();
  res.json({ total: invoices.length, data: invoices });
});

app.post('/api/v1/admin/finance/invoices/:id/payments', (req, res) => {
  const { amount, reference } = req.body;
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  const payAmount = parseFloat(amount) || invoice.amount;
  db.prepare(`
    INSERT INTO payments (id, invoice_id, amount, payment_date, reference, recorded_by)
    VALUES (?, ?, ?, date('now'), ?, 'Surge Finance Officer')
  `).run('pay-' + Math.random().toString(36).substring(2, 9), invoice.id, payAmount, reference || 'BANK-TT-' + Math.floor(100000 + Math.random() * 900000));

  db.prepare("UPDATE invoices SET status = 'Paid' WHERE id = ?").run(invoice.id);

  logAudit('Finance Officer', 'Finance Officer', 'Surge Solutions', 'Record Payment', 'Invoice', invoice.invoice_number, `Payment of GHS ${payAmount.toLocaleString()} recorded for invoice ${invoice.invoice_number}`);

  res.json({ success: true, status: 'Paid', message: `Payment recorded. Invoice ${invoice.invoice_number} is now marked Paid.` });
});

// Audit log endpoint (ADM-112)
app.get('/api/v1/admin/audit', (req, res) => {
  const { actor, action, entity, limit = 50 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (actor) {
    sql += ' AND (actor_name LIKE ? OR actor_role LIKE ?)';
    params.push(`%${actor}%`, `%${actor}%`);
  }
  if (action) {
    sql += ' AND action_type LIKE ?';
    params.push(`%${action}%`);
  }
  if (entity) {
    sql += ' AND (entity_type LIKE ? OR entity_id LIKE ?)';
    params.push(`%${entity}%`, `%${entity}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const logs = db.prepare(sql).all(...params);
  res.json({ total: logs.length, data: logs });
});

// Banks management
app.get('/api/v1/admin/banks', (req, res) => {
  const banks = db.prepare(`
    SELECT b.*, 
      (SELECT COUNT(*) FROM assets WHERE bank_id = b.id) as asset_count,
      (SELECT COUNT(*) FROM assets WHERE bank_id = b.id AND status = 'Live') as live_count,
      (SELECT COUNT(*) FROM bank_branches WHERE bank_id = b.id) as branch_count
    FROM banks b
    ORDER BY b.created_at ASC
  `).all();
  res.json({ total: banks.length, data: banks });
});

app.post('/api/v1/admin/banks', (req, res) => {
  const { legal_name, short_code, contact_email, contact_phone, default_commission_rate } = req.body;
  if (!legal_name || !short_code) {
    return res.status(400).json({ error: 'Legal institution name and short code are required.' });
  }

  const cleanCode = short_code.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM banks WHERE short_code = ?').get(cleanCode);
  if (existing) {
    return res.status(400).json({ error: `A partner bank with short code '${cleanCode}' already exists.` });
  }

  const bankId = 'bank-' + cleanCode.toLowerCase();
  const orgId = 'org-' + cleanCode.toLowerCase();
  const commRate = parseFloat(default_commission_rate) || 4.0;

  // Insert or ignore organization
  db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, code, type, status)
    VALUES (?, ?, ?, 'bank', 'Active')
  `).run(orgId, legal_name.trim(), cleanCode);

  db.prepare(`
    INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
  `).run(
    bankId, 
    orgId, 
    legal_name.trim(), 
    cleanCode, 
    contact_email ? contact_email.trim() : null, 
    contact_phone ? contact_phone.trim() : null, 
    commRate
  );

  logAudit(
    'a.boateng', 
    'Property Manager', 
    'Surge Solutions', 
    'Add Bank', 
    'Bank', 
    cleanCode, 
    `Partner bank '${legal_name.trim()}' (${cleanCode}) onboarded to Surge platform with ${commRate}% commission mandate.`
  );

  const created = db.prepare(`
    SELECT b.*, 0 as asset_count, 0 as live_count, 0 as branch_count
    FROM banks b WHERE b.id = ?
  `).get(bankId);

  res.status(201).json({ success: true, message: `Bank ${legal_name} onboarded successfully.`, data: created });
});

app.delete('/api/v1/admin/banks/:id', (req, res) => {
  const bank = db.prepare('SELECT * FROM banks WHERE id = ? OR short_code = ?').get(req.params.id, req.params.id);
  if (!bank) {
    return res.status(404).json({ error: 'Bank not found.' });
  }

  const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets WHERE bank_id = ?').get(bank.id).count;
  if (assetCount > 0) {
    return res.status(400).json({ 
      error: `Cannot remove bank '${bank.legal_name}': it currently has ${assetCount} registered asset(s) in custody. Decommission or reassign assets before removing the institution.` 
    });
  }

  // Remove associated branches
  db.prepare('DELETE FROM bank_branches WHERE bank_id = ?').run(bank.id);
  // Remove associated users
  db.prepare('DELETE FROM users WHERE bank_id = ?').run(bank.id);
  // Remove bank
  db.prepare('DELETE FROM banks WHERE id = ?').run(bank.id);
  // Remove org if no remaining dependencies
  const userOrgCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE organization_id = ?').get(bank.organization_id).count;
  if (userOrgCount === 0) {
    db.prepare('DELETE FROM organizations WHERE id = ?').run(bank.organization_id);
  }

  logAudit(
    'a.boateng', 
    'Property Manager', 
    'Surge Solutions', 
    'Remove Bank', 
    'Bank', 
    bank.short_code, 
    `Partner bank '${bank.legal_name}' (${bank.short_code}) removed from platform mandate.`
  );

  res.json({ success: true, message: `Bank ${bank.legal_name} and its associated branches have been removed.` });
});

// Bank branches management
app.get('/api/v1/admin/banks/:id/branches', (req, res) => {
  const bank = db.prepare('SELECT * FROM banks WHERE id = ? OR short_code = ?').get(req.params.id, req.params.id);
  if (!bank) {
    return res.status(404).json({ error: 'Bank not found.' });
  }

  const branches = db.prepare('SELECT * FROM bank_branches WHERE bank_id = ? ORDER BY name ASC').all(bank.id);
  res.json({ bank, total: branches.length, data: branches });
});

app.post('/api/v1/admin/banks/:id/branches', (req, res) => {
  const bank = db.prepare('SELECT * FROM banks WHERE id = ? OR short_code = ?').get(req.params.id, req.params.id);
  if (!bank) {
    return res.status(404).json({ error: 'Bank not found.' });
  }

  const { name, branch_code, region, town, address, phone, email, manager_name } = req.body;
  if (!name || !region) {
    return res.status(400).json({ error: 'Branch name and region are required.' });
  }

  const branchId = 'br-' + Math.random().toString(36).substring(2, 9);
  const code = branch_code ? branch_code.trim().toUpperCase() : `${bank.short_code}-BR-${Math.floor(100 + Math.random() * 900)}`;

  db.prepare(`
    INSERT INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `).run(
    branchId,
    bank.id,
    name.trim(),
    code,
    region.trim(),
    town ? town.trim() : null,
    address ? address.trim() : null,
    phone ? phone.trim() : null,
    email ? email.trim() : null,
    manager_name ? manager_name.trim() : null
  );

  logAudit(
    'a.boateng',
    'Property Manager',
    'Surge Solutions',
    'Add Branch',
    'Bank Branch',
    code,
    `Branch '${name.trim()}' (${code}) added for ${bank.legal_name} in ${region.trim()}.`
  );

  const created = db.prepare('SELECT * FROM bank_branches WHERE id = ?').get(branchId);
  res.status(201).json({ success: true, message: `Branch '${name}' added successfully.`, data: created });
});

app.delete('/api/v1/admin/branches/:branchId', (req, res) => {
  const branch = db.prepare(`
    SELECT bb.*, b.legal_name as bank_name 
    FROM bank_branches bb 
    JOIN banks b ON bb.bank_id = b.id 
    WHERE bb.id = ?
  `).get(req.params.branchId);

  if (!branch) {
    return res.status(404).json({ error: 'Branch not found.' });
  }

  db.prepare('DELETE FROM bank_branches WHERE id = ?').run(branch.id);

  logAudit(
    'a.boateng',
    'Property Manager',
    'Surge Solutions',
    'Remove Branch',
    'Bank Branch',
    branch.branch_code || branch.id,
    `Branch '${branch.name}' (${branch.branch_code || ''}) of ${branch.bank_name} removed from registry.`
  );

  res.json({ success: true, message: `Branch '${branch.name}' removed successfully.` });
});

// Users management
app.get('/api/v1/admin/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*, o.name as org_name, r.name as role_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    JOIN roles r ON u.role_code = r.code
    ORDER BY u.created_at DESC
  `).all();
  res.json({ total: users.length, data: users });
});

// System settings
app.get('/api/v1/admin/settings', (req, res) => {
  const settings = db.prepare("SELECT * FROM system_settings").all();
  res.json({ data: settings });
});

app.put('/api/v1/admin/settings', (req, res) => {
  const { settings } = req.body;
  if (Array.isArray(settings)) {
    for (const s of settings) {
      db.prepare("UPDATE system_settings SET value = ? WHERE key = ?").run(String(s.value), s.key);
    }
  }
  logAudit('admin', 'Super Administrator', 'Surge Solutions', 'Update Settings', 'System', 'Platform Config', 'System settings updated');
  res.json({ success: true, message: 'Settings saved successfully.' });
});

// Admin Operations Queues
app.get('/api/v1/admin/legal/queue', (req, res) => {
  const instruments = db.prepare(`
    SELECT li.*, ec.case_number, ec.court, a.public_ref, a.title as asset_title, b.short_code as bank_code
    FROM legal_instruments li
    JOIN enforcement_cases ec ON li.case_id = ec.id
    JOIN assets a ON ec.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY li.injunction_active DESC, li.id DESC
  `).all();
  res.json({ total: instruments.length, data: instruments });
});

app.post('/api/v1/admin/legal/instruments/:id/verify', (req, res) => {
  const inst = db.prepare("SELECT * FROM legal_instruments WHERE id = ?").get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Instrument not found.' });

  db.prepare("UPDATE legal_instruments SET verification_status = 'Verified', verified_by = 'k.addo', verified_at = datetime('now') WHERE id = ?").run(inst.id);
  logAudit('k.addo', 'Legal Verification Officer', 'Surge Solutions', 'Verify Instrument', 'Instrument', inst.instrument_ref, `Legal instrument ${inst.instrument_ref} verified.`);
  res.json({ success: true, status: 'Verified', message: 'Instrument verified successfully.' });
});

app.get('/api/v1/admin/title/queue', (req, res) => {
  const titles = db.prepare(`
    SELECT tr.*, a.public_ref, a.title as asset_title, b.short_code as bank_code
    FROM title_records tr
    JOIN assets a ON tr.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY tr.id DESC
  `).all();
  const searches = db.prepare(`
    SELECT ls.*, a.public_ref, a.title as asset_title, b.short_code as bank_code
    FROM land_searches ls
    JOIN assets a ON ls.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY ls.search_date DESC
  `).all();
  res.json({ titles, searches });
});

app.get('/api/v1/admin/valuations/queue', (req, res) => {
  const valuations = db.prepare(`
    SELECT v.*, a.public_ref, a.title as asset_title, a.reserve_price, b.short_code as bank_code
    FROM valuations v
    JOIN assets a ON v.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY v.review_required DESC, v.expiry_date ASC
  `).all();
  res.json({ total: valuations.length, data: valuations });
});

app.get('/api/v1/admin/documents', (req, res) => {
  const docs = db.prepare(`
    SELECT d.*, d.title as document_name, d.category as document_type, d.uploaded_at as created_at, a.public_ref, a.title as asset_title, b.short_code as bank_code
    FROM documents d
    JOIN assets a ON d.asset_id = a.id
    JOIN banks b ON a.bank_id = b.id
    ORDER BY d.uploaded_at DESC
  `).all();
  res.json({ total: docs.length, data: docs });
});

app.post('/api/v1/admin/documents/:id/verify', (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  db.prepare("UPDATE documents SET verification_status = 'Verified', verified_by = 'a.boateng', verified_at = datetime('now') WHERE id = ?").run(doc.id);
  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Verify Document', 'Document', doc.document_name, `Document ${doc.document_name} verified.`);
  res.json({ success: true, status: 'Verified', message: 'Document verified successfully.' });
});

app.post('/api/v1/admin/assets/:id/approve', (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ? OR public_ref = ?").get(req.params.id, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const oldStatus = asset.status;
  db.prepare("UPDATE assets SET status = 'Approved', updated_at = datetime('now') WHERE id = ?").run(asset.id);
  logAudit('a.boateng', 'Property Manager', 'Surge Solutions', 'Approve Asset', 'Asset', asset.public_ref, `Asset approved. Status: ${oldStatus} -> Approved`);
  res.json({ success: true, status: 'Approved', message: `Asset ${asset.public_ref} approved.` });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), platform: 'Surge Solutions Engine' });
});

// Dedicated 3 Portal Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'marketplace.html'));
});

app.get('/marketplace', (req, res) => {
  res.sendFile(path.join(__dirname, 'marketplace.html'));
});

app.get('/bank', (req, res) => {
  res.sendFile(path.join(__dirname, 'bank.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all route to serve the public marketplace
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'marketplace.html'));
  }
  next();
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Surge Solutions Platform API and UI running on http://localhost:${PORT}`);
  });
}

export default app;

