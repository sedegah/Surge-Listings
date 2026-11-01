-- Add bucket metadata so private uploads can be resolved from their dedicated R2 bucket.
ALTER TABLE asset_images ADD COLUMN object_key TEXT;
ALTER TABLE asset_images ADD COLUMN storage_bucket TEXT;
ALTER TABLE documents ADD COLUMN storage_bucket TEXT;

-- Existing objects remain in the original buckets.
UPDATE asset_images
SET storage_bucket = 'surge-assets'
WHERE storage_bucket IS NULL;

UPDATE documents
SET storage_bucket = 'surge-documents'
WHERE storage_bucket IS NULL;
