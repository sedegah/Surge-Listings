/**
 * Standard Cloudflare D1 Database Client for Surge Solutions
 * Queries Cloudflare D1 directly via Cloudflare's Global Edge REST API
 * Reads stay uncached so session revocation and newly-written records take effect immediately.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read environment credentials from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
if (!ACCOUNT_ID || !DATABASE_ID) {
  throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_D1_DATABASE_ID must be configured for the D1 client.');
}
const D1_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

if (!API_TOKEN) {
  throw new Error('CLOUDFLARE_API_TOKEN must be configured for the Vercel D1 API client.');
}

class CloudflareD1Client {
  constructor() {
    this.accountId = ACCOUNT_ID;
    this.databaseId = DATABASE_ID;
    this.endpoint = D1_ENDPOINT;
    this.headers = {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Execute raw SQL with parameter bindings on Cloudflare D1
   */
  async query(sql, params = []) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sql, params })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare D1 HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      if (!json.success) {
        const msg = json.errors?.map(e => e.message).join('; ') || 'D1 query failed';
        throw new Error(msg);
      }

      const firstResult = json.result?.[0] || {};
      const data = {
        results: firstResult.results || [],
        success: firstResult.success ?? true,
        meta: firstResult.meta || {}
      };

      return data;
    } catch (err) {
      console.error(`[Cloudflare D1 Error] SQL: "${sql}"`, err.message);
      throw err;
    }
  }

  /**
   * Return current rows from D1 without an instance-local stale cache.
   */
  async all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await this.query(sql, flatParams);
    return res.results || [];
  }

  /**
   * Return single matching row (cached reads enabled)
   */
  async get(sql, ...params) {
    const rows = await this.all(sql, ...params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE mutation.
   */
  async run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await this.query(sql, flatParams, false);
    return {
      changes: res.meta?.changes ?? 0,
      last_row_id: res.meta?.last_row_id ?? null,
      duration: res.meta?.duration ?? 0
    };
  }

  /**
   * Execute multiple statements in batch
   */
  async batch(statements) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(statements)
      });
      const json = await response.json();
      return json.result || [];
    } catch (err) {
      console.error('[Cloudflare D1 Batch Error]:', err.message);
      throw err;
    }
  }
}

export const d1 = new CloudflareD1Client();
export default d1;
