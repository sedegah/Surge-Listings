ALTER TABLE title_records ADD COLUMN title_type TEXT;
ALTER TABLE title_records ADD COLUMN registered_owner TEXT;
ALTER TABLE title_records ADD COLUMN document_id TEXT REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE valuations ADD COLUMN document_id TEXT REFERENCES documents(id) ON DELETE SET NULL;
