
-- Clean up all mock banks and dependent tables
DELETE FROM bank_agreements;
DELETE FROM commissions;
DELETE FROM invoices;
DELETE FROM bank_branches;
DELETE FROM users WHERE bank_id IS NOT NULL;
DELETE FROM assets;
DELETE FROM banks;
DELETE FROM organizations WHERE type = 'bank';
