/**
 * Cloudflare R2 Object Storage Service
 * S3-compatible object storage for assets, photos, and confidential documents
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export const ASSETS_BUCKET = process.env.R2_ASSETS_BUCKET || 'surge-assets';
export const DOCUMENTS_BUCKET = process.env.R2_DOCUMENTS_BUCKET || 'surge-documents';

export const TITLE_DOCUMENTS_BUCKET = process.env.R2_TITLE_DOCUMENTS_BUCKET || 'surge-title-documents';
export const LAND_SEARCHES_BUCKET = process.env.R2_LAND_SEARCHES_BUCKET || 'surge-land-searches';
export const VALUATION_REPORTS_BUCKET = process.env.R2_VALUATION_REPORTS_BUCKET || 'surge-valuation-reports';
export const LEGAL_INSTRUMENTS_BUCKET = process.env.R2_LEGAL_INSTRUMENTS_BUCKET || 'surge-legal-instruments';
export const KYC_DOCUMENTS_BUCKET = process.env.R2_KYC_DOCUMENTS_BUCKET || 'surge-kyc-documents';

const configuredBuckets = new Set([
  ASSETS_BUCKET,
  DOCUMENTS_BUCKET,
  TITLE_DOCUMENTS_BUCKET,
  LAND_SEARCHES_BUCKET,
  VALUATION_REPORTS_BUCKET,
  LEGAL_INSTRUMENTS_BUCKET,
  KYC_DOCUMENTS_BUCKET
]);

export function getDocumentBucket(category) {
  const normalized = String(category || '').trim().toLowerCase();
  if (/\bkyc\b|\bidentity\b|\bghana card\b|\bproof of funds\b/.test(normalized)) return KYC_DOCUMENTS_BUCKET;
  if (/land search|search report/.test(normalized)) return LAND_SEARCHES_BUCKET;
  if (/valuation|valuer/.test(normalized)) return VALUATION_REPORTS_BUCKET;
  if (/legal|instrument|court|enforcement|judgment/.test(normalized)) return LEGAL_INSTRUMENTS_BUCKET;
  if (/title|deed|certificate|site plan/.test(normalized)) return TITLE_DOCUMENTS_BUCKET;
  return DOCUMENTS_BUCKET;
}

let r2Client;

function getR2Client(bucket) {
  if (!configuredBuckets.has(bucket)) {
    throw new Error('The requested R2 bucket is not configured for this application.');
  }
  if (r2Client) return r2Client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ENDPOINT (or CLOUDFLARE_ACCOUNT_ID), R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be configured.');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });
  return r2Client;
}

/**
 * Upload a file/buffer to Cloudflare R2
 */
export async function uploadToObjectStorage({ bucket = DOCUMENTS_BUCKET, key, body, contentType = 'application/octet-stream' }) {
  try {
    const client = getR2Client(bucket);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await client.send(command);

    return {
      success: true,
      bucket,
      key
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Generate a pre-signed secure download URL (Default 5 minutes = 300 seconds TTL per Surge spec)
 */
export async function getSignedDownloadUrl({ bucket = DOCUMENTS_BUCKET, key, expiresIn = 300 }) {
  try {
    const client = getR2Client(bucket);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (err) {
    throw err;
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromObjectStorage({ bucket = DOCUMENTS_BUCKET, key }) {
  try {
    const client = getR2Client(bucket);
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await client.send(command);
    return { success: true };
  } catch (err) {
    throw err;
  }
}

export default {
  ASSETS_BUCKET,
  DOCUMENTS_BUCKET,
  TITLE_DOCUMENTS_BUCKET,
  LAND_SEARCHES_BUCKET,
  VALUATION_REPORTS_BUCKET,
  LEGAL_INSTRUMENTS_BUCKET,
  KYC_DOCUMENTS_BUCKET,
  uploadToObjectStorage,
  getSignedDownloadUrl,
  deleteFromObjectStorage
};
