// Enquiries, leads, viewings, offers, invoices and audit logs.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleEngagement(c) {
  const {
    actorName, actorRole, auditLog, env, err, getBody, json, method, pathname, request, requireAdminAuth, requireBankAuth, url
  } = c;

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
      const combinedNotes = `${phone ? 'Contact: ' + phone + ' · ' : ''}${email ? '(' + email + ') · ' : ''}${notes || ''}`;
      await env.DB.prepare(`
        INSERT INTO viewings (id, asset_id, buyer_name, viewing_date, time_slot, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, 'Requested', ?, datetime('now'))
      `).bind(viewingId, asset.id, name, date, timeSlot || 'Morning', combinedNotes).run();

      await auditLog(name, 'Public Buyer', 'Public', 'VIEWING_REQUEST', 'Viewing', viewingId, `Viewing requested for ${asset.public_ref}`);
      return json({ success: true, id: viewingId, message: 'Viewing appointment requested.' }, 201);
    }
  }

  // DELETE /api/v1/viewings/:id
  const deleteViewingMatch = pathname.match(/^\/api\/v1\/viewings\/([a-zA-Z0-9_-]+)$/);
  if (deleteViewingMatch && method === 'DELETE') {
    await requireBankAuth();
    const viewingId = decodeURIComponent(deleteViewingMatch[1]);
    await env.DB.prepare(`DELETE FROM viewings WHERE id = ? OR public_id = ?`).bind(viewingId, viewingId).run();
    return json({ success: true, message: 'Viewing request deleted.' });
  }

  // DELETE /api/v1/leads/:id
  const deleteLeadMatch = pathname.match(/^\/api\/v1\/leads\/([a-zA-Z0-9_-]+)$/);
  if (deleteLeadMatch && method === 'DELETE') {
    await requireBankAuth();
    const leadId = decodeURIComponent(deleteLeadMatch[1]);
    await env.DB.prepare(`DELETE FROM enquiries WHERE lead_id = ? OR id = ?`).bind(leadId, leadId).run();
    await env.DB.prepare(`DELETE FROM leads WHERE id = ? OR lead_ref = ?`).bind(leadId, leadId).run();
    return json({ success: true, message: 'Enquiry lead deleted.' });
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
          `Surge Solutions ${commRate}% Success Fee - Asset ${offer.asset_ref} (Accepted Offer ${offer.offer_ref} by ${offer.buyer_name})`,
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

  // Audit Logs - Track activity related to assets and documents
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
}
