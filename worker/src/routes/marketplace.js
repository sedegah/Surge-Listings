// Public marketplace listings, categories and enquiries.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleMarketplace(c) {
  const {
    auditLog, corsHeaders, env, err, getBody, json, method, pathname, url
  } = c;

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
}
