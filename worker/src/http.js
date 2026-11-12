import { SESSION_COOKIE, SESSION_TTL_HOURS } from './config.js';

// Request-scoped HTTP helpers. responseCookie is deliberately private to this
// closure: setSessionCookie/clearSessionCookie write it, json/err read it, and no
// route touches it directly.
export function createHttp(request, env, method) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = new Set([
    'https://surge-listings.vercel.app',
    ...(env.APP_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
  ]);
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : '';

  const corsHeaders = {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Credentials': 'true' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'Content-Disposition, ETag',
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store, max-age=0',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff'
  };

  let responseCookie = null;
  const json = (data, status = 200) => {
    const headers = new Headers(corsHeaders);
    if (responseCookie) headers.set('Set-Cookie', responseCookie);
    return new Response(JSON.stringify(data), { status, headers });
  };
  const err = (message, status = 400, details = {}) => {
    const headers = new Headers(corsHeaders);
    if (responseCookie) headers.set('Set-Cookie', responseCookie);
    return new Response(JSON.stringify({ success: false, error: message, ...details }), { status, headers });
  };

  function setSessionCookie(secret, maxAge = SESSION_TTL_HOURS * 3600) {
    responseCookie = `${SESSION_COOKIE}=${secret}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  }

  function clearSessionCookie() {
    responseCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  }

  function readCookie(name) {
    const cookieHeader = request.headers.get('Cookie') || '';
    for (const part of cookieHeader.split(';')) {
      const separator = part.indexOf('=');
      if (separator > 0 && part.slice(0, separator).trim() === name) {
        return part.slice(separator + 1).trim();
      }
    }
    return '';
  }

  function enforceSameOriginMutation() {
    if (env.ENVIRONMENT !== 'production' || ['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;
    const requestOrigin = request.headers.get('Origin');
    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return err('Cross-origin request rejected.', 403);
    }
    return null;
  }

  async function getBody() {
    try {
      return await request.json();
    } catch (e) {
      return {};
    }
  }

  return {
    origin, allowOrigin, allowedOrigins, corsHeaders,
    json, err, setSessionCookie, clearSessionCookie, readCookie,
    enforceSameOriginMutation, getBody
  };
}
