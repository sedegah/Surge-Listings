/**
 * Surge Solutions - Cloudflare Workers API
 * Centralized Authentication + Role-Based Authorization
 *
 * Auth Architecture:
 * - ONE central login: /api/auth/login
 * - Server-side sessions stored in D1 (sessions table)
 * - Session secret sent via the __Host-surge_session HttpOnly cookie
 * - bankId is NEVER trusted from the client - always derived from the authenticated session
 * - Every protected route is guarded server-side; the browser is never trusted
 *
 * Portals & Required Scopes:
 * - /api/admin/* -> scope: 'surge' (Surge Administrators only)
 * - /api/bank/*  -> scope: 'bank' or 'surge'
 * - /api/marketplace/* -> public (no auth required, except offer/KYC submission)
 *
 * Layout:
 * - src/config.js     session lifetime policy
 * - src/crypto.js     hashing, tokens, constant-time comparison
 * - src/http.js       CORS, cookies, JSON responses, body parsing, origin guard
 * - src/documents.js  R2 bucket routing and upload validation
 * - src/audit.js      audit logging and asset publish-readiness gates
 * - src/sessions.js   session resolution and auth guards
 * - src/context.js    per-request scope assembly
 * - src/routes/*      domain handlers, dispatched in a fixed order
 *
 * The central authorization gate below runs AFTER the public auth routes and
 * BEFORE every domain handler. Do not move it into a handler.
 */
import { createContext } from './src/context.js';
import { handleHealth } from './src/routes/health.js';
import { handleAuth } from './src/routes/auth.js';
import { handleAdmin } from './src/routes/admin.js';
import { handleBank } from './src/routes/bank.js';
import { handleMarketplace } from './src/routes/marketplace.js';
import { handleAssets } from './src/routes/assets.js';
import { handleEngagement } from './src/routes/engagement.js';
import { handleBranches } from './src/routes/branches.js';
import { handleRegions } from './src/routes/regions.js';
import { handleEncrypted } from './src/routes/encrypted.js';
import { handleBranchStats } from './src/routes/branch-stats.js';

const PUBLIC_ROUTES = [handleHealth, handleAuth];
const PROTECTED_ROUTES = [handleAdmin, handleBank, handleMarketplace, handleAssets, handleEngagement, handleBranches, handleRegions, handleEncrypted, handleBranchStats];

export default {
  async fetch(request, env, ctx) {
    const c = createContext(request, env, ctx);
    const {
      pathname, method, json, err, corsHeaders,
      enforceSameOriginMutation, requireAdminAuth, requireBankAuth
    } = c;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const originError = enforceSameOriginMutation();
      if (originError) return originError;

      for (const handler of PUBLIC_ROUTES) {
        const response = await handler(c);
        if (response) return response;
      }

      const isAdminAlias =
        pathname === '/api/v1/banks' ||
        /^\/api\/v1\/banks\/[a-zA-Z0-9_-]+$/.test(pathname) ||
        pathname === '/api/v1/users' ||
        /^\/api\/v1\/users\/[a-zA-Z0-9_-]+(?:\/reset-password)?$/.test(pathname) ||
        pathname === '/api/v1/kyc' ||
        /^\/api\/(v1|bank|admin)\/assets\/[a-zA-Z0-9_-]+\/(review|approve|request-changes|reject|publish|unpublish|hold|release-hold|readiness)$/.test(pathname);
      const isAssetApi = /^\/api\/(v1|bank|admin)\/assets(?:\/[a-zA-Z0-9_-]+)?$/.test(pathname);
      const isAssetSubmitAction = /^\/api\/v1\/assets\/[a-zA-Z0-9_-]+\/submit$/.test(pathname);
      const isBankDataAlias = [
        '/api/v1/branches',
        '/api/v1/leads',
        '/api/v1/enquiries',
        '/api/v1/viewings',
        '/api/v1/offers',
        '/api/v1/invoices',
        '/api/v1/audit-logs'
      ].includes(pathname);
      if (pathname === '/api/admin' || pathname.startsWith('/api/admin/') || isAdminAlias) {
        await requireAdminAuth();
      } else if (pathname.startsWith('/api/bank/') || isAssetApi || isAssetSubmitAction || (isBankDataAlias && method === 'GET')) {
        await requireBankAuth();
      }

      for (const handler of PROTECTED_ROUTES) {
        const response = await handler(c);
        if (response) return response;
      }

      return err(`Route '${pathname}' with method '${method}' not found on Surge API. Check / for endpoint documentation.`, 404);
    } catch (error) {
      // Auth guards throw Response objects directly - pass them through unchanged
      if (error instanceof Response) return error;
      console.error('Unhandled API Error:', error);
      return json({ success: false, error: error.message || 'An internal server error occurred.' }, 500);
    }
  }
};
