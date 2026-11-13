import * as crypto from './crypto.js';
import * as documents from './documents.js';
import { createHttp } from './http.js';
import { createAudit, getAssetReadiness } from './audit.js';
import { createSessions } from './sessions.js';
import { isSurgeAdmin } from './rbac.js';
import {
  SESSION_COOKIE, SESSION_TTL_HOURS, SESSION_ABSOLUTE_HOURS, REMEMBERED_ABSOLUTE_HOURS
} from './config.js';

export function createContext(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const method = request.method.toUpperCase();

  const state = { activeSession: null };
  const http = createHttp(request, env, method);
  const { auditLog } = createAudit(env, state);
  const sessions = createSessions({ request, env, ctx, http, state, auditLog });

  return {
    request, env, ctx, url, pathname, method,
    ...http,
    ...crypto,
    ...sessions,
    auditLog,
    getAssetReadiness: (asset) => getAssetReadiness(env, asset),
    bucketForStoredDocument: (name) => documents.bucketForStoredDocument(env, name),
    bucketNameForDocumentCategory: documents.bucketNameForDocumentCategory,
    extensionForMime: documents.extensionForMime,
    isValidFile: documents.isValidFile,
    SESSION_COOKIE, SESSION_TTL_HOURS, SESSION_ABSOLUTE_HOURS, REMEMBERED_ABSOLUTE_HOURS,
    isSurgeAdmin,
    get actorName() { return state.activeSession?.full_name || null; },
    get actorRole() { return state.activeSession?.role_code || null; }
  };
}
