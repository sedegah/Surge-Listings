-- Clear all mock data for a clean fresh start
PRAGMA foreign_keys = OFF;

DELETE FROM offer_revisions;
DELETE FROM commissions;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM offers;
DELETE FROM viewings;
DELETE FROM lead_activities;
DELETE FROM enquiries;
DELETE FROM leads;
DELETE FROM buyer_access_grants;
DELETE FROM consents;
DELETE FROM kyc_applications;
DELETE FROM buyers;
DELETE FROM document_access_logs;
DELETE FROM documents;
DELETE FROM asset_images;
DELETE FROM legal_instruments;
DELETE FROM enforcement_cases;
DELETE FROM title_records;
DELETE FROM land_searches;
DELETE FROM valuations;
DELETE FROM assets;
DELETE FROM audit_logs;
DELETE FROM notifications;

PRAGMA foreign_keys = ON;
