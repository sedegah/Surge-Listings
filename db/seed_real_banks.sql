
-- 1. Clear out fake bank branches and organizations
DELETE FROM bank_branches;
DELETE FROM users WHERE bank_id IS NOT NULL;
DELETE FROM banks;
DELETE FROM organizations WHERE type = 'bank';

-- 2. Insert Real Ghanaian Organizations (Bank of Ghana Licensed Commercial Banks)
INSERT INTO organizations (id, name, code, type, status, created_at) VALUES
('org-sbg', 'Stanbic Bank Ghana Limited', 'SBG', 'bank', 'Active', datetime('now')),
('org-gcb', 'GCB Bank PLC', 'GCB', 'bank', 'Active', datetime('now')),
('org-ebg', 'Ecobank Ghana PLC', 'EBG', 'bank', 'Active', datetime('now')),
('org-absa', 'Absa Bank Ghana Limited', 'ABSA', 'bank', 'Active', datetime('now')),
('org-zbg', 'Zenith Bank (Ghana) Limited', 'ZBG', 'bank', 'Active', datetime('now')),
('org-fbg', 'Fidelity Bank Ghana Limited', 'FBG', 'bank', 'Active', datetime('now')),
('org-scb', 'Standard Chartered Bank Ghana PLC', 'SCB', 'bank', 'Active', datetime('now')),
('org-cal', 'CalBank PLC', 'CAL', 'bank', 'Active', datetime('now'));

-- 3. Insert Real Ghanaian Banks
INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate, status, created_at) VALUES
('bank-sbg', 'org-sbg', 'Stanbic Bank Ghana Limited', 'SBG', 'specialassets@stanbic.com.gh', '+233 30 823 8900', 4.0, 'Active', datetime('now')),
('bank-gcb', 'org-gcb', 'GCB Bank PLC', 'GCB', 'assetrecovery@gcbbank.com.gh', '+233 30 268 1531', 4.0, 'Active', datetime('now')),
('bank-ebg', 'org-ebg', 'Ecobank Ghana PLC', 'EBG', 'remedialassets@ecobank.com', '+233 30 221 4110', 4.5, 'Active', datetime('now')),
('bank-absa', 'org-absa', 'Absa Bank Ghana Limited', 'ABSA', 'foreclosures@absa.africa', '+233 30 221 0000', 4.0, 'Active', datetime('now')),
('bank-zbg', 'org-zbg', 'Zenith Bank (Ghana) Limited', 'ZBG', 'specialassets@zenithbank.com.gh', '+233 30 261 1500', 4.5, 'Active', datetime('now')),
('bank-fbg', 'org-fbg', 'Fidelity Bank Ghana Limited', 'FBG', 'distressedassets@fidelitybank.com.gh', '+233 30 221 4490', 5.0, 'Active', datetime('now')),
('bank-scb', 'org-scb', 'Standard Chartered Bank Ghana PLC', 'SCB', 'assetmanagement@sc.com', '+233 30 261 0750', 4.0, 'Active', datetime('now')),
('bank-cal', 'org-cal', 'CalBank PLC', 'CAL', 'recoveries@calbank.net', '+233 30 268 0068', 4.5, 'Active', datetime('now')),
-- Also keep alias bank-mtb pointing to Stanbic Bank Ghana for backward compatibility with existing hardcoded references
('bank-mtb', 'org-sbg', 'Stanbic Bank Ghana Limited (MTB Migration)', 'SBG-ALT', 'specialassets@stanbic.com.gh', '+233 30 823 8900', 4.0, 'Active', datetime('now'));

-- 4. Insert Real Head Office & Regional Recovery Branches
INSERT INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status, created_at) VALUES
('br-sbg-01', 'bank-sbg', 'Stanbic Heights Asset Recovery Centre', 'SBG-APT-01', 'Greater Accra', 'Airport City', 'Plot 215 South Liberation Link, Airport City, Accra', '+233 30 823 8900', 'airport@stanbic.com.gh', 'Kofi Mensah-Bonsu', 'Active', datetime('now')),
('br-sbg-02', 'bank-sbg', 'Adum Commercial & Recovery Hub', 'SBG-ADM-02', 'Ashanti', 'Kumasi', 'Harper Road, Adum, Kumasi', '+233 32 203 1122', 'adum@stanbic.com.gh', 'Kwame Boateng', 'Active', datetime('now')),
('br-gcb-01', 'bank-gcb', 'GCB Millennium House Recovery Operations', 'GCB-HGT-01', 'Greater Accra', 'Accra Central', 'Thorpe Road, High Street, Accra', '+233 30 268 1531', 'highstreet@gcbbank.com.gh', 'Ebenezer Osei', 'Active', datetime('now')),
('br-gcb-02', 'bank-gcb', 'Adum Harper Road Regional Branch', 'GCB-KMS-02', 'Ashanti', 'Kumasi', 'Harper Road, Kumasi', '+233 32 202 3344', 'kumasi@gcbbank.com.gh', 'Akua Serwaa', 'Active', datetime('now')),
('br-ebg-01', 'bank-ebg', 'Ecobank Head Office Remedial Desk', 'EBG-HDO-01', 'Greater Accra', 'Airport City', '2 Morocco Lane, Airport City, Accra', '+233 30 221 4110', 'morocco@ecobank.com', 'Josephine Aryee', 'Active', datetime('now')),
('br-absa-01', 'bank-absa', 'Absa House Foreclosure Department', 'ABSA-HSO-01', 'Greater Accra', 'Accra Central', 'Absa House, High Street, Accra', '+233 30 221 0000', 'foreclosures@absa.africa', 'Nana Yaw Frimpong', 'Active', datetime('now')),
('br-zbg-01', 'bank-zbg', 'Zenith Heights Asset Recovery Desk', 'ZBG-RDG-01', 'Greater Accra', 'Ridge', '87 Independence Avenue, Ridge, Accra', '+233 30 261 1500', 'ridge@zenithbank.com.gh', 'David Ankrah', 'Active', datetime('now')),
('br-fbg-01', 'bank-fbg', 'Ridge Towers Special Assets Unit', 'FBG-RDG-01', 'Greater Accra', 'Ridge', '10 Ambassadorial Enclave, Ridge, Accra', '+233 30 221 4490', 'specialassets@fidelitybank.com.gh', 'Theresa Ofori', 'Active', datetime('now')),
('br-scb-01', 'bank-scb', 'StanChart Independence Ave Hub', 'SCB-IND-01', 'Greater Accra', 'Accra Central', '87 Independence Avenue, Accra', '+233 30 261 0750', 'corporate@sc.com', 'Charles Coleman', 'Active', datetime('now')),
('br-cal-01', 'bank-cal', 'CalBank Head Office Recovery Hub', 'CAL-HDO-01', 'Greater Accra', 'Ridge', '23 Independence Avenue, Ridge, Accra', '+233 30 268 0068', 'headquarters@calbank.net', 'Priscilla Amankwah', 'Active', datetime('now'));

-- 5. Insert Real Institutional Bank Staff with Hashed/Salted Passwords
INSERT INTO users (id, bank_id, branch_id, role_id, full_name, email, phone, username, password_hash, status, created_at) VALUES
('u-mensah', 'bank-sbg', 'br-sbg-01', 'r-bank-ao', 'Joseph Mensah', 'j.mensah@stanbic.com.gh', '+233 24 412 3456', 'j.mensah', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-asare', 'bank-sbg', 'br-sbg-01', 'r-bank-lro', 'Kofi Asare', 'k.asare@stanbic.com.gh', '+233 24 423 4567', 'k.asare', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-owusu', 'bank-sbg', 'br-sbg-02', 'r-bank-ba', 'Abena Owusu', 'a.owusu@stanbic.com.gh', '+233 24 434 5678', 'a.owusu', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-gcb-ao', 'bank-gcb', 'br-gcb-01', 'r-bank-ao', 'Emmanuel Quaye', 'e.quaye@gcbbank.com.gh', '+233 24 445 6789', 'e.quaye', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-gcb-ap', 'bank-gcb', 'br-gcb-01', 'r-bank-ap', 'Samuel Osei-Bonsu', 's.oseibonsu@gcbbank.com.gh', '+233 24 456 7890', 's.oseibonsu', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-ebg-lro', 'bank-ebg', 'br-ebg-01', 'r-bank-lro', 'Kwabena Darko', 'k.darko@ecobank.com', '+233 24 467 8901', 'k.darko', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-absa-ao', 'bank-absa', 'br-absa-01', 'r-bank-ao', 'Michael Danquah', 'm.danquah@absa.africa', '+233 24 478 9012', 'm.danquah', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-zbg-ba', 'bank-zbg', 'br-zbg-01', 'r-bank-ba', 'Beatrice Asantewaa', 'b.asantewaa@zenithbank.com.gh', '+233 24 489 0123', 'b.asantewaa', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-fbg-ao', 'bank-fbg', 'br-fbg-01', 'r-bank-ao', 'Nathaniel Sarpong', 'n.sarpong@fidelitybank.com.gh', '+233 24 490 1234', 'n.sarpong', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-scb-lro', 'bank-scb', 'br-scb-01', 'r-bank-lro', 'Patience Mensah', 'p.mensah@sc.com', '+233 24 401 2345', 'p.mensah', 'scrypt:Surge@2026', 'Active', datetime('now')),
('u-cal-ba', 'bank-cal', 'br-cal-01', 'r-bank-ba', 'Francis Quaye', 'f.quaye@calbank.net', '+233 24 411 2233', 'f.quaye', 'scrypt:Surge@2026', 'Active', datetime('now'));
