// Hashed endpoint routing.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleEncrypted(c) {
  const { encoder, err, getBody, json, method, pathname } = c;

  // =========================================================================
  // 9. ENCRYPTED / HASHED ENDPOINT ROUTING
  // Sensitive portal pages use SHA-256 hashed route tokens.
  // Frontend generates: hash = SHA256("portal:page:context")
  // Backend resolves the hash to the real internal handler.
  // =========================================================================

  // POST /api/enc/resolve - Resolve a hashed route token to its internal handler
  if (pathname === '/api/enc/resolve' && method === 'POST') {
    const body = await getBody();
    const { token, context } = body;
    if (!token) return err('Encrypted route token is required.', 400);

    // Verify the token against known route hashes
    const routeMap = {
      // Admin portal pages
      'admin:dashboard': '/api/admin/dashboard',
      'admin:banks': '/api/admin/banks',
      'admin:users': '/api/admin/users',
      'admin:assets': '/api/admin/assets',
      'admin:legal': '/api/admin/legal',
      'admin:titles': '/api/admin/titles',
      'admin:valuations': '/api/admin/valuations',
      'admin:settings': '/api/admin/settings',
      'admin:branches': '/api/admin/branches',
      'admin:audit': '/api/admin/audit-logs',
      // Bank portal pages
      'bank:dashboard': '/api/bank/dashboard',
      'bank:profile': '/api/bank/profile',
      'bank:assets': '/api/bank/assets',
      'bank:branches': '/api/bank/branches',
      'bank:documents': '/api/bank/documents',
      'bank:enquiries': '/api/bank/enquiries',
      'bank:viewings': '/api/bank/viewings',
      'bank:offers': '/api/bank/offers',
      // Marketplace pages
      'marketplace:listings': '/api/marketplace/assets',
      'marketplace:categories': '/api/marketplace/categories',
      'marketplace:detail': '/api/marketplace/assets',
    };

    // Hash the known routes and find match
    let resolvedRoute = null;
    let resolvedKey = null;

    for (const [key, route] of Object.entries(routeMap)) {
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === token) {
        resolvedRoute = route;
        resolvedKey = key;
        break;
      }
    }

    if (!resolvedRoute) return err('Invalid or expired encrypted route token.', 403);

    return json({ success: true, route: resolvedRoute, key: resolvedKey, context: context || null });
  }

  // GET /api/enc/tokens - Generate hashed tokens for all portal routes (admin use only)
  if (pathname === '/api/enc/tokens' && method === 'GET') {
    const routeKeys = [
      'admin:dashboard', 'admin:banks', 'admin:users', 'admin:assets',
      'admin:legal', 'admin:titles', 'admin:valuations', 'admin:settings',
      'admin:branches', 'admin:audit',
      'bank:dashboard', 'bank:profile', 'bank:assets', 'bank:branches',
      'bank:documents', 'bank:enquiries', 'bank:viewings', 'bank:offers',
      'marketplace:listings', 'marketplace:categories', 'marketplace:detail'
    ];

    const tokens = {};
    for (const key of routeKeys) {
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      tokens[key] = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return json({ success: true, data: tokens });
  }
}
