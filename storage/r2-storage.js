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

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://065fc200f5c2cb1f51dd59426f19012c.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '102542168513d6f4cb3b2f365df898dd',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '03896f7463225de7048bc10cef01374f3729cbfb030e4a668b3478fe32679941'
  }
});

/**
 * Upload a file/buffer to Cloudflare R2
 */
export async function uploadToObjectStorage({ bucket = DOCUMENTS_BUCKET, key, body, contentType = 'application/octet-stream' }) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await r2Client.send(command);

    return {
      success: true,
      bucket,
      key,
      url: `${process.env.R2_ENDPOINT || 'https://065fc200f5c2cb1f51dd59426f19012c.r2.cloudflarestorage.com'}/${bucket}/${key}`
    };
  } catch (err) {
    console.error(`[R2 Upload Failed] Bucket: ${bucket}, Key: ${key}:`, err.message);
    throw err;
  }
}

/**
 * Generate a pre-signed secure download URL (Default 5 minutes = 300 seconds TTL per Surge spec)
 */
export async function getSignedDownloadUrl({ bucket = DOCUMENTS_BUCKET, key, expiresIn = 300 }) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (err) {
    console.error(`[R2 Presign Failed] Bucket: ${bucket}, Key: ${key}:`, err.message);
    throw err;
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromObjectStorage({ bucket = DOCUMENTS_BUCKET, key }) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await r2Client.send(command);
    return { success: true };
  } catch (err) {
    console.error(`[R2 Delete Failed] Bucket: ${bucket}, Key: ${key}:`, err.message);
    throw err;
  }
}

export default {
  ASSETS_BUCKET,
  DOCUMENTS_BUCKET,
  uploadToObjectStorage,
  getSignedDownloadUrl,
  deleteFromObjectStorage
};
