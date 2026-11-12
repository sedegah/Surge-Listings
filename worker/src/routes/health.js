// Root, health and version endpoints (public).
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleHealth(c) {
  const { allowOrigin, env, json, method, origin, pathname } = c;

  // ============================================================
  // 0. ROOT & HEALTH ENDPOINTS
  // ============================================================
  if (pathname === '/') {
    return json({
      platform: 'Surge Solutions Institutional Disposition API',
      status: 'online',
      version: '2.1.0',
      engine: 'Cloudflare Workers + D1 Database + R2 Object Storage',
      cors_allowed_frontend: 'https://surge-listings.vercel.app',
      namespaces: {
        admin: '/api/admin/*',
        bank: '/api/bank/*',
        marketplace: '/api/marketplace/*',
        branches: '/api/admin/branches, /api/bank/branches',
        regions: '/api/regions',
        encrypted: '/api/enc/*',
        legacy_v1: '/api/v1/*'
      },
      documentation: '/api/health'
    });
  }

  if (pathname === '/health' || pathname === '/api/health') {
    const dbCheck = await env.DB.prepare(`SELECT count(*) as c FROM organizations`).first();
    return json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      platform: 'Surge Solutions Enterprise Monolith',
      database: { connected: true, organization_count: dbCheck?.c || 0 },
      cors: { origin_detected: origin || 'direct', allowed: allowOrigin }
    });
  }

  if (pathname === '/api/version' && method === 'GET') {
    return json({
      version: env.CF_VERSION_METADATA?.id || env.DEPLOYMENT_VERSION || 'unknown',
      deployedAt: env.CF_VERSION_METADATA?.timestamp || null
    });
  }
}
