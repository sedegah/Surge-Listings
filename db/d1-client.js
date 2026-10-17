/**
 * Standard Cloudflare D1 Database Client for Surge Solutions
 * Queries Cloudflare D1 directly via Cloudflare's Global Edge REST API
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

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '065fc200f5c2cb1f51dd59426f19012c';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'cfat_zNFQXeeqYlA8FvBG7WCtYHyt6kMEOfBiatoarFEt72686eb1';
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '62b0bf0f-803b-4a09-8cbb-78f948bb6d02';
const D1_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

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
      return {
        results: firstResult.results || [],
        success: firstResult.success ?? true,
        meta: firstResult.meta || {}
      };
    } catch (err) {
      console.error(`[Cloudflare D1 Error] SQL: "${sql}"`, err.message);
      throw err;
    }
  }

  /**
   * Return all matching rows
   */
  async all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await this.query(sql, flatParams);
    return res.results || [];
  }

  /**
   * Return single matching row
   */
  async get(sql, ...params) {
    const rows = await this.all(sql, ...params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute INSERT, UPDATE, DELETE mutation
   */
  async run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await this.query(sql, flatParams);
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
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(statements)
    });
    const json = await response.json();
    return json.result || [];
  }
}

export const d1 = new CloudflareD1Client();
export default d1;
