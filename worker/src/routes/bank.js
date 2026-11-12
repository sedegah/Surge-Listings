// Bank portal: uploads, documents, photos and bank-scoped records.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleBank(c) {
  const {
    actorName, actorRole, auditLog, bucketForStoredDocument, bucketNameForDocumentCategory, corsHeaders, env, err, extensionForMime, isValidFile, json, method, pathname, request, requireAdminAuth, requireBankAuth, url
  } = c;

  // =========================================================================
  // 3. BANK PORTAL API (/api/bank/*)
  // ALL routes below require a valid bank session.
  // bankId is derived from the authenticated session ONLY - never from the client.
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

  // GET /api/bank/staff - List all staff for authenticated bank
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

  // GET /api/bank/invitations - List pending invitations
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
}
