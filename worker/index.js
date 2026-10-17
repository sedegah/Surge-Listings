/**
 * Surge Solutions — Cloudflare Workers Native Edge API
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

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Bank-ID, X-Actor-Name, X-Actor-Role, Authorization',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. PUBLIC MARKETPLACE ENDPOINTS (/api/public)
      if (pathname === '/api/public/categories') {
        const categories = await env.DB.prepare(`
          SELECT c.code, c.name, c.icon,
            (SELECT COUNT(*) FROM assets a WHERE a.category_code = c.code AND a.status IN ('Live', 'Under Offer')) as live_count
          FROM asset_categories c
          ORDER BY c.name ASC
        `).all();
        return new Response(JSON.stringify({ success: true, data: categories.results }), { headers: corsHeaders });
      }

      if (pathname === '/api/public/listings') {
        const listings = await env.DB.prepare(`
          SELECT 
            a.id, a.public_ref, a.category_code, a.asset_type, a.title, a.description,
            a.region, a.district, a.town, a.public_location, a.reserve_price, a.minimum_offer,
            a.show_reserve_publicly, a.occupancy_status, a.land_guard_risk, a.status,
            a.beds, a.baths, a.year, a.mileage, a.fuel,
            (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image,
            (SELECT COUNT(*) FROM asset_images WHERE asset_id = a.id) as image_count
          FROM assets a
          WHERE a.status IN ('Live', 'Under Offer', 'Sold')
          ORDER BY a.created_at DESC
        `).all();

        const sanitized = listings.results.map(r => ({
          ...r,
          reserve_price: r.show_reserve_publicly ? r.reserve_price : null,
          price_display: r.show_reserve_publicly ? `GHS ${r.reserve_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Offers Invited'
        }));
        return new Response(JSON.stringify({ success: true, count: sanitized.length, data: sanitized }), { headers: corsHeaders });
      }

      if (pathname.startsWith('/api/public/listings/')) {
        const id = pathname.replace('/api/public/listings/', '');
        const asset = await env.DB.prepare(`
          SELECT a.id, a.public_ref, a.category_code, a.asset_type, a.title, a.description,
            a.region, a.district, a.town, a.public_location, a.reserve_price, a.minimum_offer,
            a.show_reserve_publicly, a.occupancy_status, a.land_guard_risk, a.status,
            a.beds, a.baths, a.year, a.mileage, a.fuel, a.created_at
          FROM assets a
          WHERE (a.id = ? OR a.public_ref = ?) AND a.status IN ('Live', 'Under Offer', 'Sold')
        `).bind(id, id).first();

        if (!asset) return new Response(JSON.stringify({ success: false, error: 'Listing not found' }), { status: 404, headers: corsHeaders });

        const images = await env.DB.prepare(`SELECT id, url, caption, is_primary, is_exterior FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC`).bind(asset.id).all();

        return new Response(JSON.stringify({
          success: true,
          data: {
            ...asset,
            reserve_price: asset.show_reserve_publicly ? asset.reserve_price : null,
            images: images.results
          }
        }), { headers: corsHeaders });
      }

      // 2. BANK PORTAL ENDPOINTS (/api/bank)
      const bankId = request.headers.get('x-bank-id') || url.searchParams.get('bank_id') || 'bank-mtb';

      if (pathname === '/api/bank/dashboard') {
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM assets WHERE bank_id = ?) as totalAssets,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = ?) as totalPortfolioValue,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Live') as liveListings,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Submitted by Bank') as pendingSurgeReview,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND legal_hold_active = 1) as legalHolds,
            (SELECT COUNT(*) FROM assets WHERE bank_id = ? AND status = 'Sold') as completedSales,
            (SELECT COUNT(*) FROM offers o JOIN assets a ON o.asset_id = a.id WHERE a.bank_id = ? AND o.status = 'Under Bank Review') as activeOffers,
            (SELECT COUNT(*) FROM valuations v JOIN assets a ON v.asset_id = a.id WHERE a.bank_id = ? AND (v.status = 'Expired' OR v.review_required = 1)) as valuationReviewRequired
        `).bind(bankId, bankId, bankId, bankId, bankId, bankId, bankId, bankId).first();

        const recentActivity = await env.DB.prepare(`
          SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8
        `).all();

        return new Response(JSON.stringify({
          success: true,
          data: { ...stats, recentActivity: recentActivity.results }
        }), { headers: corsHeaders });
      }

      if (pathname === '/api/bank/assets') {
        const assets = await env.DB.prepare(`
          SELECT a.*, b.name as branch_name,
            (SELECT COUNT(*) FROM offers WHERE asset_id = a.id) as offer_count,
            (SELECT url FROM asset_images WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_image
          FROM assets a
          LEFT JOIN bank_branches b ON a.branch_id = b.id
          WHERE a.bank_id = ?
          ORDER BY a.updated_at DESC
        `).bind(bankId).all();

        return new Response(JSON.stringify({ success: true, count: assets.results.length, data: assets.results }), { headers: corsHeaders });
      }

      if (pathname === '/api/bank/branches') {
        const branches = await env.DB.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM assets WHERE branch_id = b.id) as asset_count
          FROM bank_branches b
          WHERE b.bank_id = ?
          ORDER BY b.region ASC, b.name ASC
        `).bind(bankId).all();

        return new Response(JSON.stringify({ success: true, count: branches.results.length, data: branches.results }), { headers: corsHeaders });
      }

      // 3. SURGE ADMIN ENDPOINTS (/api/admin)
      if (pathname === '/api/admin/dashboard' || pathname === '/api/stats') {
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

        return new Response(JSON.stringify({ success: true, data: { stats: counts } }), { headers: corsHeaders });
      }

      if (pathname === '/api/admin/banks') {
        const banks = await env.DB.prepare(`
          SELECT b.*,
            (SELECT COUNT(*) FROM bank_branches WHERE bank_id = b.id) as branch_count,
            (SELECT COUNT(*) FROM assets WHERE bank_id = b.id) as asset_count,
            (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE bank_id = b.id) as total_portfolio_value
          FROM banks b
          ORDER BY b.legal_name ASC
        `).all();

        return new Response(JSON.stringify({ success: true, count: banks.results.length, data: banks.results }), { headers: corsHeaders });
      }

      if (pathname === '/api/admin/assets') {
        const assets = await env.DB.prepare(`
          SELECT a.*, b.legal_name as bank_name, b.short_code as bank_code, br.name as branch_name
          FROM assets a
          JOIN banks b ON a.bank_id = b.id
          LEFT JOIN bank_branches br ON a.branch_id = br.id
          ORDER BY a.updated_at DESC
        `).all();

        return new Response(JSON.stringify({ success: true, count: assets.results.length, data: assets.results }), { headers: corsHeaders });
      }

      // Default Health Check
      if (pathname === '/health' || pathname === '/api/health') {
        return new Response(JSON.stringify({ status: 'healthy', engine: 'Cloudflare Workers Native Edge' }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
