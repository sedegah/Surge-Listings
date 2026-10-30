
-- 1. Update existing organizations to real banks
UPDATE organizations SET name = 'Stanbic Bank Ghana Limited', code = 'SBG' WHERE id = 'org-mtb';
UPDATE banks SET legal_name = 'Stanbic Bank Ghana Limited', short_code = 'SBG', contact_email = 'specialassets@stanbic.com.gh', contact_phone = '+233 30 823 8900', default_commission_rate = 4.0 WHERE id = 'bank-mtb';

UPDATE organizations SET name = 'GCB Bank PLC', code = 'GCB' WHERE id = 'org-csb';
UPDATE banks SET legal_name = 'GCB Bank PLC', short_code = 'GCB', contact_email = 'assetrecovery@gcbbank.com.gh', contact_phone = '+233 30 268 1531', default_commission_rate = 4.0 WHERE id = 'bank-csb';

UPDATE organizations SET name = 'Ecobank Ghana PLC', code = 'EBG' WHERE id = 'org-scb';
UPDATE banks SET legal_name = 'Ecobank Ghana PLC', short_code = 'EBG', contact_email = 'remedialassets@ecobank.com', contact_phone = '+233 30 221 4110', default_commission_rate = 4.5 WHERE id = 'bank-scb';

UPDATE organizations SET name = 'Absa Bank Ghana Limited', code = 'ABSA' WHERE id = 'org-amb';
UPDATE banks SET legal_name = 'Absa Bank Ghana Limited', short_code = 'ABSA', contact_email = 'foreclosures@absa.africa', contact_phone = '+233 30 221 0000', default_commission_rate = 4.0 WHERE id = 'bank-amb';

-- 2. Insert additional real banks
INSERT OR IGNORE INTO organizations (id, name, code, type, status, created_at) VALUES
('org-zbg', 'Zenith Bank (Ghana) Limited', 'ZBG', 'bank', 'Active', datetime('now')),
('org-fbg', 'Fidelity Bank Ghana Limited', 'FBG', 'bank', 'Active', datetime('now')),
('org-scbg', 'Standard Chartered Bank Ghana PLC', 'SCBG', 'bank', 'Active', datetime('now')),
('org-cal', 'CalBank PLC', 'CAL', 'bank', 'Active', datetime('now'));

INSERT OR IGNORE INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status, created_at) VALUES
('bank-zbg', 'org-zbg', 'Zenith Bank (Ghana) Limited', 'ZBG', 'specialassets@zenithbank.com.gh', '+233 30 261 1500', 4.5, 'Active', datetime('now')),
('bank-fbg', 'org-fbg', 'Fidelity Bank Ghana Limited', 'FBG', 'distressedassets@fidelitybank.com.gh', '+233 30 221 4490', 5.0, 'Active', datetime('now')),
('bank-scbg', 'org-scbg', 'Standard Chartered Bank Ghana PLC', 'SCBG', 'assetmanagement@sc.com', '+233 30 261 0750', 4.0, 'Active', datetime('now')),
('bank-cal', 'org-cal', 'CalBank PLC', 'CAL', 'recoveries@calbank.net', '+233 30 268 0068', 4.5, 'Active', datetime('now'));

-- 3. Update branches to real branch names and locations
UPDATE bank_branches SET name = 'Stanbic Heights Asset Recovery Centre', branch_code = 'SBG-APT-01', region = 'Greater Accra', town = 'Airport City', address = 'Plot 215 South Liberation Link, Airport City, Accra', email = 'airport@stanbic.com.gh' WHERE id = 'br-mtb-01';
UPDATE bank_branches SET name = 'Stanbic Adum Commercial & Recovery Hub', branch_code = 'SBG-ADM-02', region = 'Ashanti', town = 'Kumasi', address = 'Harper Road, Adum, Kumasi', email = 'adum@stanbic.com.gh' WHERE id = 'br-mtb-02';
UPDATE bank_branches SET name = 'Stanbic Takoradi Harbour Hub', branch_code = 'SBG-TKD-03', region = 'Western', town = 'Takoradi', address = 'Market Circle Commercial Area', email = 'takoradi@stanbic.com.gh' WHERE id = 'br-mtb-03';
UPDATE bank_branches SET name = 'Stanbic Tema Industrial Branch', branch_code = 'SBG-TMA-04', region = 'Greater Accra', town = 'Tema', address = 'Community 1 Meridian Plaza', email = 'tema@stanbic.com.gh' WHERE id = 'br-mtb-04';

UPDATE bank_branches SET name = 'GCB Millennium House Recovery Operations', branch_code = 'GCB-HGT-01', region = 'Greater Accra', town = 'Accra Central', address = 'Thorpe Road, High Street, Accra', email = 'highstreet@gcbbank.com.gh' WHERE id = 'br-csb-01';
UPDATE bank_branches SET name = 'GCB Kumasi Harper Road Branch', branch_code = 'GCB-KMS-02', region = 'Ashanti', town = 'Kumasi', address = 'Harper Road, Adum, Kumasi', email = 'adum@gcbbank.com.gh' WHERE id = 'br-csb-02';

UPDATE bank_branches SET name = 'Ecobank Head Office Remedial Desk', branch_code = 'EBG-HDO-01', region = 'Greater Accra', town = 'Airport City', address = '2 Morocco Lane, Airport City, Accra', email = 'morocco@ecobank.com' WHERE id = 'br-scb-01';
UPDATE bank_branches SET name = 'Ecobank Kumasi Stadium Branch', branch_code = 'EBG-KMS-02', region = 'Ashanti', town = 'Kumasi', address = 'Asokwa Commercial Enclave', email = 'asokwa@ecobank.com' WHERE id = 'br-scb-02';

UPDATE bank_branches SET name = 'Absa House Foreclosure Department', branch_code = 'ABSA-HSO-01', region = 'Greater Accra', town = 'Accra Central', address = 'Absa House, High Street, Accra', email = 'foreclosures@absa.africa' WHERE id = 'br-amb-01';

-- 4. Update existing bank staff names and emails to real institutions
UPDATE users SET full_name = 'Joseph Mensah', email = 'j.mensah@stanbic.com.gh' WHERE id = 'u-mensah';
UPDATE users SET full_name = 'Kofi Asare', email = 'k.asare@stanbic.com.gh' WHERE id = 'u-asare';
UPDATE users SET full_name = 'Abena Owusu', email = 'a.owusu@stanbic.com.gh' WHERE id = 'u-owusu';
UPDATE users SET full_name = 'Emmanuel Quaye', email = 'e.quaye@gcbbank.com.gh' WHERE id = 'u-coastal-ao';

-- 5. Insert additional real recovery officers for the other banks
INSERT OR IGNORE INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code, mfa_enabled, status, password_hash, created_at) VALUES
('u-ebg-lro', 'org-scb', 'bank-scb', 'br-scb-01', 'k.darko', 'Kwabena Darko', 'k.darko@ecobank.com', 'LRO', 1, 'Active', 'scrypt:Surge@2026', datetime('now')),
('u-absa-ao', 'org-amb', 'bank-amb', 'br-amb-01', 'm.danquah', 'Michael Danquah', 'm.danquah@absa.africa', 'AO', 1, 'Active', 'scrypt:Surge@2026', datetime('now')),
('u-zbg-ba', 'org-zbg', 'bank-zbg', NULL, 'b.asantewaa', 'Beatrice Asantewaa', 'b.asantewaa@zenithbank.com.gh', 'BA', 1, 'Active', 'scrypt:Surge@2026', datetime('now')),
('u-fbg-ao', 'org-fbg', 'bank-fbg', NULL, 'n.sarpong', 'Nathaniel Sarpong', 'n.sarpong@fidelitybank.com.gh', 'AO', 1, 'Active', 'scrypt:Surge@2026', datetime('now')),
('u-scb-lro', 'org-scbg', 'bank-scbg', NULL, 'p.mensah', 'Patience Mensah', 'p.mensah@sc.com', 'LRO', 1, 'Active', 'scrypt:Surge@2026', datetime('now')),
('u-cal-ba', 'org-cal', 'bank-cal', NULL, 'f.quaye', 'Francis Quaye', 'f.quaye@calbank.net', 'BA', 1, 'Active', 'scrypt:Surge@2026', datetime('now'));
