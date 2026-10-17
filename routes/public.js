/**
 * Public Marketplace API Router
 * Base Path: /api/public
 * 
 * Strict Security:
 * - Publicly accessible for buyers and marketplace visitors.
 * - Sanitized responses: no debtor identity, no bank internal refs, no exact street addresses prior to verified KYC.
 * - Only assets with status 'Live', 'Under Offer', or 'Sold' are returned.
 */

import express from 'express';
import { d1 } from '../db/d1-client.js';

const router = express.Router();

// Helper: Audit logging to Cloudflare D1
async function logPublicAudit(actionType, entityType, entityId, summary, req) {
  try {
    const id = 'log-pub-' + Math.random().toString(36).substring(2, 11);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    await d1.run(
      `INSERT INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      id, 'Public Visitor', 'Marketplace Buyer', 'Public', actionType, entityType, entityId, `${summary} [IP: ${ip}]`
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * GET /api/public/categories
 * Public asset categories with live counts
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await d1.all(`
      SELECT c.code, c.name, c.icon,
        (SELECT COUNT(*) FROM assets a WHERE a.category_code = c.code AND a.status IN ('Live', 'Under Offer')) as live_count
      FROM asset_categories c
      ORDER BY c.name ASC
    `);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/listings
 * Publicly searchable marketplace listings
 */
router.get('/listings', async (req, res) => {
  try {
    const { category, region, min_price, max_price, occupancy, q } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.public_ref,
        a.category_code,
        a.asset_type,
        a.title,
        a.description,
        a.region,
        a.district,
        a.town,
        a.public_location,
        a.reserve_price,
        a.minimum_offer,
        a.show_reserve_publicly,
        a.occupancy_status,
        a.land_guard_risk,
        a.status,
        a.beds,
        a.baths,
        a.year,
        a.mileage,
        a.fuel,
        (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count,
        (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as total_offers
      FROM assets a
      WHERE a.status IN ('Live', 'Under Offer', 'Sold')
    `;

    const params = [];

    if (category) {
      sql += ` AND a.category_code = ?`;
      params.push(category);
    }
    if (region) {
      sql += ` AND a.region = ?`;
      params.push(region);
    }
    if (occupancy) {
      sql += ` AND a.occupancy_status = ?`;
      params.push(occupancy);
    }
    if (min_price) {
      sql += ` AND a.reserve_price >= ?`;
      params.push(Number(min_price));
    }
    if (max_price) {
      sql += ` AND a.reserve_price <= ?`;
      params.push(Number(max_price));
    }
    if (q) {
      sql += ` AND (a.title LIKE ? OR a.town LIKE ? OR a.description LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY a.created_at DESC`;

    const rows = await d1.all(sql, params);

    // Sanitize prices if bank opted to hide reserve publicly
    const sanitized = rows.map(r => ({
      ...r,
      reserve_price: r.show_reserve_publicly ? r.reserve_price : null,
      price_display: r.show_reserve_publicly ? `GHS ${r.reserve_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Offers Invited'
    }));

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/listings/:id
 * Public detail view of a single listing (Sanitized: NO exact address, NO bank internal ID)
 */
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await d1.get(`
      SELECT 
        a.id,
        a.public_ref,
        a.category_code,
        a.asset_type,
        a.title,
        a.description,
        a.region,
        a.district,
        a.town,
        a.public_location,
        a.reserve_price,
        a.minimum_offer,
        a.show_reserve_publicly,
        a.occupancy_status,
        a.land_guard_risk,
        a.status,
        a.beds,
        a.baths,
        a.year,
        a.mileage,
        a.fuel,
        a.created_at
      FROM assets a
      WHERE (a.id = ? OR a.public_ref = ?) AND a.status IN ('Live', 'Under Offer', 'Sold')
    `, id, id);

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Listing not found or not currently available for public viewing' });
    }

    // Public images
    const images = await d1.all(`
      SELECT id, url, caption, is_primary, is_exterior
      FROM asset_images
      WHERE asset_id = ?
      ORDER BY sort_order ASC
    `, asset.id);

    // Redacted details for security
    const sanitized = {
      ...asset,
      reserve_price: asset.show_reserve_publicly ? asset.reserve_price : null,
      price_display: asset.show_reserve_publicly ? `GHS ${asset.reserve_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Offers Invited',
      images
    };

    res.json({ success: true, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/public/enquiries
 * Submit an enquiry on an asset (Automatically creates lead)
 */
router.post('/enquiries', async (req, res) => {
  try {
    const { asset_id, name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, phone, and message are required.' });
    }

    const enqId = 'enq-' + Math.random().toString(36).substring(2, 11);
    const leadId = 'lead-' + Math.random().toString(36).substring(2, 11);
    const leadRef = `SL-LEAD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    await d1.run(`
      INSERT INTO enquiries (id, asset_id, buyer_name, email, phone, message, status, lead_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'New', ?, datetime('now'))
    `, enqId, asset_id || null, name, email, phone, message, leadId);

    if (asset_id) {
      await d1.run(`
        INSERT INTO leads (id, lead_ref, asset_id, buyer_name, email, phone, stage, source, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'New', 'Marketplace Enquiry', ?, datetime('now'))
      `, leadId, leadRef, asset_id, name, email, phone, message);

      await d1.run(`
        INSERT INTO lead_activities (id, lead_id, activity_type, description, actor_name, created_at)
        VALUES (?, ?, 'Enquiry Received', ?, ?, datetime('now'))
      `, 'la-' + Math.random().toString(36).substring(2, 11), leadId, `Enquiry: ${message.substring(0, 100)}`, name);
    }

    await logPublicAudit('Enquiry Submitted', 'Enquiry', enqId, `Enquiry by ${name} (${email}) for asset ${asset_id || 'General'}`, req);

    res.json({ success: true, message: 'Enquiry submitted successfully. A Surge representative will contact you.', enquiry_id: enqId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/public/kyc
 * Prospective buyer submits KYC verification details
 */
router.post('/kyc', async (req, res) => {
  try {
    const { full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref } = req.body;
    if (!full_name || !email || !phone || !ghana_card_number) {
      return res.status(400).json({ success: false, error: 'Full name, email, phone, and Ghana Card number are mandatory.' });
    }

    let buyer = await d1.get(`SELECT id FROM buyers WHERE email = ? OR ghana_card_number = ?`, email, ghana_card_number);
    let buyerId = buyer?.id;

    if (!buyerId) {
      buyerId = 'byr-' + Math.random().toString(36).substring(2, 11);
      await d1.run(`
        INSERT INTO buyers (id, full_name, email, phone, ghana_card_number, kyc_status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Submitted', datetime('now'))
      `, buyerId, full_name, email, phone, ghana_card_number);
    }

    const kycId = 'kyc-' + Math.random().toString(36).substring(2, 11);
    await d1.run(`
      INSERT INTO kyc_applications (id, buyer_id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', datetime('now'))
    `, kycId, buyerId, full_name, email, phone, ghana_card_number, source_of_funds || null, related_asset_ref || null);

    await logPublicAudit('KYC Submitted', 'KYCApplication', kycId, `KYC application submitted by ${full_name} (${ghana_card_number})`, req);

    res.json({ success: true, message: 'KYC application received and queued for compliance verification.', kyc_id: kycId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/public/consents
 * Buyer signs NDA / Terms / Disclaimers
 */
router.post('/consents', async (req, res) => {
  try {
    const { email, consent_type, document_version } = req.body;
    if (!email || !consent_type) {
      return res.status(400).json({ success: false, error: 'Email and consent_type are required.' });
    }

    let buyer = await d1.get(`SELECT id FROM buyers WHERE email = ?`, email);
    if (!buyer) {
      const buyerId = 'byr-' + Math.random().toString(36).substring(2, 11);
      await d1.run(`
        INSERT INTO buyers (id, full_name, email, phone, kyc_status, created_at)
        VALUES (?, ?, ?, '', 'None', datetime('now'))
      `, buyerId, email.split('@')[0], email);
      buyer = { id: buyerId };
    }

    const consentId = 'cns-' + Math.random().toString(36).substring(2, 11);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    await d1.run(`
      INSERT INTO consents (id, buyer_id, consent_type, document_version, ip_address, accepted_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, consentId, buyer.id, consent_type, document_version || 'v1.0', ip);

    res.json({ success: true, message: `Consent '${consent_type}' recorded.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/public/offers
 * Buyer submits an offer on a listing
 */
router.post('/offers', async (req, res) => {
  try {
    const { asset_id, buyer_name, buyer_email, buyer_phone, amount, validity_date, conditions } = req.body;
    if (!asset_id || !buyer_name || !buyer_email || !amount) {
      return res.status(400).json({ success: false, error: 'Asset ID, buyer name, email, and amount are required.' });
    }

    const asset = await d1.get(`SELECT id, reserve_price, minimum_offer, status FROM assets WHERE id = ? OR public_ref = ?`, asset_id, asset_id);
    if (!asset || asset.status !== 'Live') {
      return res.status(400).json({ success: false, error: 'This asset is not currently accepting offers.' });
    }

    const offerAmount = Number(amount);
    const belowReserve = offerAmount < asset.reserve_price ? 1 : 0;
    const exceptionRequested = (belowReserve && asset.minimum_offer && offerAmount >= asset.minimum_offer) ? 1 : 0;

    let buyer = await d1.get(`SELECT id FROM buyers WHERE email = ?`, buyer_email);
    const buyerId = buyer ? buyer.id : 'byr-' + Math.random().toString(36).substring(2, 11);
    if (!buyer) {
      await d1.run(`
        INSERT INTO buyers (id, full_name, email, phone, kyc_status, created_at)
        VALUES (?, ?, ?, ?, 'Submitted', datetime('now'))
      `, buyerId, buyer_name, buyer_email, buyer_phone || '');
    }

    const offerId = 'off-' + Math.random().toString(36).substring(2, 11);
    const offerRef = `SS-OFF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await d1.run(`
      INSERT INTO offers (
        id, offer_ref, asset_id, buyer_id, buyer_name, amount, validity_date, conditions,
        status, below_reserve, exception_requested, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Under Bank Review', ?, ?, datetime('now'))
    `, offerId, offerRef, asset.id, buyerId, buyer_name, offerAmount, validity_date || '2026-11-30', conditions || 'Standard closing terms', belowReserve, exceptionRequested);

    await logPublicAudit('Offer Submitted', 'Offer', offerId, `Offer of GHS ${offerAmount.toLocaleString()} submitted by ${buyer_name} on ${asset.id}`, req);

    res.json({
      success: true,
      message: 'Offer submitted successfully and routed to bank and Surge review.',
      offer_ref: offerRef,
      below_reserve: !!belowReserve,
      exception_requested: !!exceptionRequested
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/public/viewings
 * Request viewing
 */
router.post('/viewings', async (req, res) => {
  try {
    const { asset_id, buyer_name, email, phone, viewing_date, time_slot } = req.body;
    if (!asset_id || !buyer_name || !email || !viewing_date) {
      return res.status(400).json({ success: false, error: 'Asset ID, buyer name, email, and preferred viewing date are required.' });
    }

    const asset = await d1.get(`SELECT id, occupancy_status FROM assets WHERE id = ? OR public_ref = ?`, asset_id, asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    const viewingId = 'vw-' + Math.random().toString(36).substring(2, 11);
    const isHostile = asset.occupancy_status === 'Occupied — Hostile';

    await d1.run(`
      INSERT INTO viewings (id, asset_id, buyer_name, viewing_date, time_slot, status, notes, address_disclosed, created_at)
      VALUES (?, ?, ?, ?, ?, 'Requested', ?, 0, datetime('now'))
    `, viewingId, asset.id, buyer_name, viewing_date, time_slot || 'Morning (10:00 - 12:00)', isHostile ? 'Property requires security override before inspection' : 'Standard requested viewing');

    await logPublicAudit('Viewing Requested', 'Viewing', viewingId, `Viewing requested for ${asset.id} on ${viewing_date} by ${buyer_name}`, req);

    res.json({ success: true, message: 'Viewing request received. Our sales team will confirm your appointment schedule.', viewing_id: viewingId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
