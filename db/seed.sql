-- Surge Solutions Initial Production Seed Data for Cloudflare D1
-- ===============================================================

-- 1. Organizations
INSERT OR IGNORE INTO organizations (id, name, code, type) VALUES
('org-surge', 'Surge Solutions Platform Operator', 'SURGE', 'surge'),
('org-mtb', 'Meridian Trust Bank Ltd', 'MTB', 'bank'),
('org-csb', 'Coastal Savings Bank', 'CSB', 'bank'),
('org-scb', 'Southern Commercial Bank', 'SCB', 'bank'),
('org-amb', 'Apex Merchant Bank', 'AMB', 'bank');

-- 2. Banks
INSERT OR IGNORE INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate) VALUES
('bank-mtb', 'org-mtb', 'Meridian Trust Bank Limited', 'MTB', 'recoveries@meridiantrust.com.gh', '+233 30 223 8810', 4.0),
('bank-csb', 'org-csb', 'Coastal Savings Bank Ghana', 'CSB', 'specialassets@coastalsavings.com.gh', '+233 31 202 4491', 4.5),
('bank-scb', 'org-scb', 'Southern Commercial Bank PLC', 'SCB', 'repossessed@southerncomm.com.gh', '+233 33 213 1900', 4.0),
('bank-amb', 'org-amb', 'Apex Merchant Bank Ltd', 'AMB', 'distressed@apexmerchant.gh', '+233 30 266 5100', 5.0),
('bank-surge', 'org-surge', 'Surge Partner Bank', 'SURGE', '', '', 0.0);

-- 3. Bank Branches
INSERT OR IGNORE INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status) VALUES
('br-mtb-01', 'bank-mtb', 'Ridge Head Office Branch', 'MTB-RDG-01', 'Greater Accra', 'Accra', '14 Independence Avenue, Ridge', '+233 30 223 8810', 'ridge@meridiantrust.com.gh', 'Samuel Osei-Bonsu', 'Active'),
('br-mtb-02', 'bank-mtb', 'Tema Commercial Hub', 'MTB-TMA-02', 'Greater Accra', 'Tema', 'Community 1 Meridian Plaza', '+233 30 320 1144', 'tema@meridiantrust.com.gh', 'Evelyn Addo', 'Active'),
('br-mtb-03', 'bank-mtb', 'Kumasi Harper Road Branch', 'MTB-KMS-03', 'Ashanti', 'Kumasi', 'Harper Road, Adum', '+233 32 203 9912', 'adum@meridiantrust.com.gh', 'Kwame Agyapong', 'Active'),
('br-mtb-04', 'bank-mtb', 'Takoradi Harbour Branch', 'MTB-TKD-04', 'Western', 'Takoradi', 'Market Circle Commercial Area', '+233 31 202 7701', 'takoradi@meridiantrust.com.gh', 'Patience Mensah', 'Active'),
('br-csb-01', 'bank-csb', 'Cape Coast Commercial Street', 'CSB-CPC-01', 'Central', 'Cape Coast', 'Commercial Street, Kingsway', '+233 33 213 2200', 'capecoast@coastalsavings.com.gh', 'Francis Quaye', 'Active'),
('br-csb-02', 'bank-csb', 'Sekondi High Street Branch', 'CSB-SKD-02', 'Western', 'Sekondi', 'High Street Near District Court', '+233 31 204 8831', 'sekondi@coastalsavings.com.gh', 'Grace Appiah', 'Active'),
('br-scb-01', 'bank-scb', 'Airport City Corporate Branch', 'SCB-APT-01', 'Greater Accra', 'Accra', 'One Airport Square, 4th Floor', '+233 30 277 4450', 'airport@southerncomm.com.gh', 'Michael Danquah', 'Active'),
('br-scb-02', 'bank-scb', 'Koforidua Central Branch', 'SCB-KFD-02', 'Eastern', 'Koforidua', 'Central Market Road', '+233 34 202 1199', 'koforidua@southerncomm.com.gh', 'Beatrice Asantewaa', 'Active'),
('br-amb-01', 'bank-amb', 'West Ridge Premier Banking', 'AMB-WST-01', 'Greater Accra', 'Accra', 'Ambassadorial Enclave, West Ridge', '+233 30 266 5100', 'premier@apexmerchant.gh', 'Nathaniel Sarpong', 'Active');

-- 4. Roles
INSERT OR IGNORE INTO roles (id, name, code, scope, description) VALUES
('r-sa', 'Super Administrator', 'SA', 'surge', 'Platform operator administrator with global permissions'),
('r-pm', 'Property Manager', 'PM', 'surge', 'Surge property and listing manager'),
('r-lo', 'Legal Verification Officer', 'LO', 'surge', 'Surge legal, judgment and injunction reviewer'),
('r-sg', 'Sales Agent', 'SG', 'surge', 'Surge sales and buyer relationship agent'),
('r-sfo', 'Finance Officer (Surge)', 'SFO', 'surge', 'Surge billing, fees and commission reconciliation'),
('r-au', 'Auditor', 'AU', 'surge', 'Compliance and immutable audit log reviewer'),
('r-ba', 'Bank Administrator', 'BA', 'bank', 'Bank organization administrator'),
('r-ao', 'Asset Officer', 'AO', 'bank', 'Bank asset registration and management'),
('r-lro', 'Legal / Recovery Officer', 'LRO', 'bank', 'Bank recovery officer and legal matters coordinator'),
('r-ap', 'Approver', 'AP', 'bank', 'Bank executive with offer approval authority'),
('r-bfo', 'Finance Officer (Bank)', 'BFO', 'bank', 'Bank invoice and statements viewer'),
('r-vw', 'Viewer', 'VW', 'bank', 'Read-only bank portfolio observer');

-- 5. Users
INSERT OR IGNORE INTO users (id, organization_id, bank_id, branch_id, username, full_name, email, role_code) VALUES
('u-admin', 'org-surge', NULL, NULL, 'admin', 'System Administrator', 'admin@surgesolutions.com.gh', 'SA'),
('u-boateng', 'org-surge', NULL, NULL, 'a.boateng', 'Ama Boateng', 'a.boateng@surgesolutions.com.gh', 'PM'),
('u-addo', 'org-surge', NULL, NULL, 'k.addo', 'Kwame Addo', 'k.addo@surgesolutions.com.gh', 'LO'),
('u-tetteh', 'org-surge', NULL, NULL, 'a.tetteh', 'Akosua Tetteh', 'a.tetteh@surgesolutions.com.gh', 'SG'),
('u-mensah', 'org-mtb', 'bank-mtb', 'br-mtb-01', 'j.mensah', 'Joseph Mensah', 'j.mensah@meridiantrust.com.gh', 'LRO'),
('u-asare', 'org-mtb', 'bank-mtb', 'br-mtb-02', 'k.asare', 'Kofi Asare', 'k.asare@meridiantrust.com.gh', 'AO'),
('u-owusu', 'org-mtb', 'bank-mtb', 'br-mtb-01', 'a.owusu', 'Abena Owusu', 'a.owusu@meridiantrust.com.gh', 'AP'),
('u-coastal-ao', 'org-csb', 'bank-csb', 'br-csb-01', 'e.quaye', 'Emmanuel Quaye', 'e.quaye@coastalsavings.com.gh', 'AO');

UPDATE users
SET bank_id = 'bank-surge', branch_id = NULL
WHERE role_code IN (SELECT code FROM roles WHERE scope = 'surge');

-- 6. Asset Categories
INSERT OR IGNORE INTO asset_categories (code, name, icon) VALUES
('House', 'Residential House', 'home'),
('Vehicle', 'Motor Vehicle', 'truck'),
('Equipment', 'Industrial Equipment', 'tool'),
('Commercial', 'Commercial Property', 'briefcase'),
('Land', 'Demarcated Land', 'map');

-- 7. Assets
INSERT OR IGNORE INTO assets (
  id, bank_id, branch_id, public_ref, internal_bank_ref, category_code, asset_type, title, description,
  region, district, town, public_location, exact_address, reserve_price, minimum_offer,
  show_reserve_publicly, occupancy_status, land_guard_risk, status, legal_hold_active,
  legal_hold_reason, review_required, review_required_reason, beds, baths, year, mileage, fuel, created_by
) VALUES
('ast-001', 'bank-mtb', 'br-mtb-02', 'SS-RE-2026-00241', 'BNK-LN-88213', 'House', '4-bedroom detached house',
 'Tema Community 25, 4-Bedroom Detached House with Compound',
 'Spacious 4-bedroom executive detached house with two master en-suite bedrooms, fitted kitchen, paved compound, security fencing, borehole water backup, and dedicated electric transformer.',
 'Greater Accra', 'Tema West', 'Community 25', 'Tema, Greater Accra (approximate)', 'Plot 14, 2nd Crescent, Community 25, Tema',
 950000.00, 900000.00, 1, 'Occupied — Hostile', 'High', 'Submitted by Bank', 0, NULL, 1,
 'Valuation report is outside validity window; title and land search pending re-confirmation.', 4, 3, 2019, NULL, NULL, 'k.asare'),

('ast-002', 'bank-mtb', 'br-mtb-03', 'SS-VH-2026-00187', 'BNK-LN-79104', 'Vehicle', 'Double Cabin Pickup',
 'Toyota Hilux 2.4 GD-6 Double Cab 4x4 (2021)',
 'Factory-maintained Toyota Hilux Double Cabin 4x4, 6-speed manual, diesel engine, heavy-duty canopy, bull bar, tow hitch, pristine interior, clear court-ordered release.',
 'Ashanti', 'Kumasi Metropolitan', 'Adum', 'Kumasi, Ashanti (approximate)', 'Prempeh II Yard, Adum, Kumasi',
 185000.00, 175000.00, 1, 'Vacant', 'Low', 'Live', 0, NULL, 0, NULL, NULL, NULL, 2021, '48,200 km', 'Diesel', 'k.asare'),

('ast-003', 'bank-csb', 'br-csb-02', 'SS-RE-2026-00239', 'CSB-AST-4410', 'House', '4-bedroom residential house',
 'Beach Road, Sekondi-Takoradi, 4-Bedroom House with Compound',
 'Substantial residential property located in Beach Road close, Takoradi. Features 4 bedrooms, detached boys quarters, expansive landscaped garden and garage.',
 'Western', 'Sekondi Takoradi Metropolitan', 'Takoradi Beach Road', 'Takoradi, Western Region (approximate)', 'Beach Road Close, Plot 8, Takoradi',
 1240000.00, 1180000.00, 1, 'Occupied — Cooperative', 'Low', 'Live', 0, NULL, 1,
 'Valuation report expired on 30 Sep 2026; updated valuation scheduled.', 4, 3, 2017, NULL, NULL, 'e.quaye'),

('ast-004', 'bank-mtb', 'br-mtb-01', 'SS-RE-2026-00236', 'BNK-LN-82001', 'House', '3-bedroom bungalow',
 'Cantonments, Accra, 3-Bedroom Executive Bungalow',
 'Single-storey executive bungalow situated in prime Cantonments. Enclosed perimeter wall with electric fencing, well-kept lawn, 2-room staff quarters.',
 'Greater Accra', 'La Dade Kotopon', 'Cantonments', 'Cantonments, Accra (approximate)', '12 Rangoon Link, Cantonments, Accra',
 720000.00, 680000.00, 1, 'Vacant', 'Low', 'Legal Hold', 1,
 'Hold placed due to pending family caveat and cross-examination hearing in High Court.', 0, NULL, 3, 2, 2015, NULL, NULL, 'k.asare'),

('ast-005', 'bank-csb', 'br-csb-01', 'SS-EQ-2026-00094', 'CSB-EQ-1120', 'Equipment', 'Hydraulic Excavator',
 'Caterpillar 320D Tracked Hydraulic Excavator',
 'Heavy construction hydraulic excavator, Caterpillar C6.4 Acert engine, standard reach boom, 1.2 m3 heavy duty bucket. Fully inspected and stored in secure bonded yard.',
 'Greater Accra', 'Tema Metropolitan', 'Heavy Industrial Area', 'Tema Heavy Industrial, Greater Accra', 'Tema Free Zones Enclave Yard 4B',
 96500.00, 90000.00, 1, 'Vacant', 'Low', 'Live', 0, NULL, 0, NULL, NULL, NULL, 2018, '6,420 operating hours', 'Diesel', 'e.quaye'),

('ast-006', 'bank-scb', 'br-scb-01', 'SS-VH-2026-00171', 'SCB-LN-5092', 'Vehicle', 'Commercial Bus / Van',
 'Mercedes-Benz Sprinter 316 CDI 19-Seater (2020)',
 'Commercial 19-seater passenger Sprinter van, high roof, OM651 engine, dual rear air conditioning, comprehensive registration history available.',
 'Central', 'Cape Coast Metropolitan', 'Cape Coast', 'Cape Coast, Central Region', 'Industrial Road Yard, Cape Coast',
 210000.00, 195000.00, 0, 'Vacant', 'Low', 'Changes Required', 0, NULL, 1,
 'Updated roadworthiness certificate and chassis clearance requested by Surge Reviewer.', NULL, NULL, 2020, '84,100 km', 'Diesel', 'e.quaye');

-- 8. Asset Images
INSERT OR IGNORE INTO asset_images (id, asset_id, url, caption, is_primary, is_exterior, sort_order) VALUES
('img-001', 'ast-001', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 'Front Elevation & Gate', 1, 1, 1),
('img-002', 'ast-001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 'Compound and Car Porch', 0, 1, 2),
('img-003', 'ast-002', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'Toyota Hilux Exterior Front-Quarter', 1, 1, 1),
('img-004', 'ast-003', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 'Beach Road Main House', 1, 1, 1),
('img-005', 'ast-004', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80', 'Cantonments Front Entrance', 1, 1, 1),
('img-006', 'ast-005', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80', 'Caterpillar 320D Profile', 1, 1, 1),
('img-007', 'ast-006', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 'Mercedes-Benz Sprinter Front', 1, 1, 1);

-- 9. Enforcement Cases & Instruments
INSERT OR IGNORE INTO enforcement_cases (id, asset_id, case_number, court, judge, status, notes) VALUES
('ec-001', 'ast-001', 'Suit No. CM/0418/2026', 'High Court (Commercial Division), Accra', 'His Lordship Justice K. Boateng', 'Verified', 'Judgment entered in default of appearance. Notice of enforcement served.');

INSERT OR IGNORE INTO legal_instruments (id, case_id, instrument_type, instrument_ref, filing_date, judgment_date, court, injunction_active, verification_status, verified_by, verified_at) VALUES
('inst-01', 'ec-001', 'Default Notice', 'DN-2026-0182', '2026-08-14', NULL, 'High Court Accra', 0, 'Verified', 'j.mensah', '2026-10-02'),
('inst-02', 'ec-001', 'Affidavit of Service', 'AS-2026-0311', '2026-08-28', NULL, 'High Court Accra', 0, 'Verified', 'j.mensah', '2026-10-02'),
('inst-03', 'ec-001', 'Judgment', 'J-2026-0418', '2026-09-15', '2026-10-04', 'High Court Accra Commercial Div', 1, 'Verified', 'j.mensah', '2026-10-04'),
('inst-04', 'ec-001', 'Statutory Notice', 'SN-2026-0094', '2026-10-05', NULL, 'High Court Accra', 0, 'Pending', NULL, NULL);

-- 10. Title Records, Land Searches & Valuations
INSERT OR IGNORE INTO title_records (id, asset_id, certificate_number, registry, parcel_number, perfection_status, verification_status, notes) VALUES
('tit-001', 'ast-001', 'GA/TM/2019/8821', 'Lands Commission Tema Registry', 'Parcel 411, Block 3, Section 25', 'Perfected', 'Pending', 'Official cadastral plan search requested.');

INSERT OR IGNORE INTO land_searches (id, asset_id, search_reference, search_date, expiry_date, validity_period_days, status, notes) VALUES
('ls-001', 'ast-001', 'LC-SRCH-2026-8841', '2026-04-12', '2026-10-09', 180, 'Expired', 'Land search validity expired on 09 Oct 2026. Refresh required before publish readiness (TL-2).');

INSERT OR IGNORE INTO valuations (id, asset_id, valuer_name, market_value, forced_sale_value, valuation_date, expiry_date, validity_period_days, status, review_required, notes) VALUES
('val-001', 'ast-001', 'Consolidated Property Valuers Ltd (GhIS certified)', 1150000.00, 920000.00, '2026-03-31', '2026-09-30', 180, 'Expired', 1, 'Valuation report valid to 30 Sep 2026 and now outside validity window (VL-1).');

-- 11. Documents
INSERT OR IGNORE INTO documents (id, asset_id, title, category, file_path, file_size, content_type, verification_status, verified_by) VALUES
('doc-001', 'ast-001', 'Default Notice & Proof of Service', 'Legal', '/docs/default_notice_ast001.pdf', '2.4 MB', 'application/pdf', 'Verified', 'j.mensah'),
('doc-002', 'ast-001', 'High Court Judgment CM/0418/2026', 'Legal', '/docs/judgment_cm0418.pdf', '4.1 MB', 'application/pdf', 'Verified', 'j.mensah'),
('doc-003', 'ast-001', 'Land Title Certificate GA/TM/2019/8821', 'Title', '/docs/land_title_8821.pdf', '1.8 MB', 'application/pdf', 'Pending', NULL),
('doc-004', 'ast-001', 'Valuation Report — Tema Comm 25 House', 'Valuation', '/docs/valuation_report_comm25.pdf', '6.7 MB', 'application/pdf', 'Verified', 'j.mensah');

-- 12. Buyers & KYC Applications
INSERT OR IGNORE INTO buyers (id, full_name, email, phone, ghana_card_number, address, kyc_status) VALUES
('byr-001', 'Dr. Kwabena Frimpong', 'k.frimpong@apexmed.com.gh', '+233 24 419 8832', 'GHA-718291044-8', '14 Ridge Road, Roman Ridge, Accra', 'Verified'),
('byr-002', 'Nana Ama Serwaa', 'naserwaa@translogistics.gh', '+233 20 812 4001', 'GHA-829103819-2', 'Plot 5, Asokwa Residential, Kumasi', 'Verified'),
('byr-003', 'Kojo Antwi-Boasiako', 'kojo.antwi@ecowaspower.org', '+233 55 930 1192', 'GHA-629100482-1', 'Airport Hills, Cantonments, Accra', 'Pending Review');

INSERT OR IGNORE INTO kyc_applications (id, buyer_id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status, reviewer_note, internal_note, reviewed_by, reviewed_at) VALUES
('kyc-001', 'byr-001', 'Dr. Kwabena Frimpong', 'k.frimpong@apexmed.com.gh', '+233 24 419 8832', 'GHA-718291044-8', 'Medical Practice & Commercial Real Estate', 'SS-RE-2026-00241', 'Verified', 'Ghana Card verified. Source of funds verified with bank reference letter.', 'Cleared for high-value asset bidding.', 'a.boateng', '2026-10-10'),
('kyc-002', 'byr-003', 'Kojo Antwi-Boasiako', 'kojo.antwi@ecowaspower.org', '+233 55 930 1192', 'GHA-629100482-1', 'Employment & Consultancy income', 'SS-RE-2026-00236', 'Pending Review', NULL, 'Proof of address document pending clarity.', NULL, NULL);

-- 13. Consents & Buyer Access Grants
INSERT OR IGNORE INTO consents (id, buyer_id, consent_type, document_version, ip_address) VALUES
('cns-001', 'byr-001', 'NDA', 'v1.0', '154.160.22.84'),
('cns-002', 'byr-001', 'Data Protection', 'v1.0', '154.160.22.84');

INSERT OR IGNORE INTO buyer_access_grants (id, buyer_id, asset_id, expires_at, status) VALUES
('grt-001', 'byr-001', 'ast-001', '2026-11-15', 'Active');

-- 14. Leads & Activities
INSERT OR IGNORE INTO leads (id, lead_ref, asset_id, buyer_id, buyer_name, email, phone, stage, assigned_agent_id, assigned_agent_name, source, notes) VALUES
('lead-001', 'SL-LEAD-2026-000042', 'ast-001', 'byr-001', 'Dr. Kwabena Frimpong', 'k.frimpong@apexmed.com.gh', '+233 24 419 8832', 'Viewing', 'u-tetteh', 'Akosua Tetteh', 'Marketplace Enquiry', 'Buyer requested viewing appointment for Community 25 property.');

INSERT OR IGNORE INTO lead_activities (id, lead_id, activity_type, description, actor_name) VALUES
('la-001', 'lead-001', 'Enquiry Received', 'Marketplace enquiry submitted regarding Tema Comm 25 house', 'Dr. Kwabena Frimpong'),
('la-002', 'lead-001', 'KYC Verified', 'Buyer identity and source of funds verified; Access Grant issued', 'Ama Boateng');

-- 15. Viewings
INSERT OR IGNORE INTO viewings (id, asset_id, buyer_id, buyer_name, agent_id, agent_name, viewing_date, time_slot, status, high_risk_override, override_reason, override_by, notes, address_disclosed) VALUES
('vw-001', 'ast-001', 'byr-001', 'Dr. Kwabena Frimpong', 'u-tetteh', 'Akosua Tetteh', '2026-10-21', '14:00 - 15:30', 'Confirmed', 1, 'Accompanied by armed court bailiff and bank security detail per High-Risk Occupancy protocol.', 'Ama Boateng', 'Exterior and compound inspection only. Occupant notified.', 1);

-- 16. Offers
INSERT OR IGNORE INTO offers (
  id, offer_ref, asset_id, buyer_id, buyer_name, amount, validity_date, conditions,
  status, below_reserve, exception_requested, exception_decision, exception_reason
) VALUES
('off-001', 'SS-OFF-2026-0081', 'ast-001', 'byr-001', 'Dr. Kwabena Frimpong', 920000.00, '2026-11-05', 'Subject to vacant possession confirmation and clean title delivery within 60 days.', 'Under Bank Review', 1, 1, 'Pending', 'Offer of GHS 920,000 is below reserve of GHS 950,000 but exceeds minimum offer threshold of GHS 900,000.'),
('off-002', 'SS-OFF-2026-0079', 'ast-002', 'byr-002', 'Nana Ama Serwaa', 180000.00, '2026-10-30', 'Full cash payment within 14 days upon inspection of DVLA logbook.', 'Under Bank Review', 1, 1, 'Pending', 'Offer is GHS 180,000 (reserve GHS 185,000, min offer GHS 175,000).'),
('off-003', 'SS-OFF-2026-0075', 'ast-003', 'byr-001', 'Dr. Kwabena Frimpong', 1250000.00, '2026-11-12', 'Payment in 2 installments: 70% upon agreement, 30% on completion.', 'Accepted', 0, 0, NULL, NULL);

-- 17. Fees, Agreements, Commissions & Invoices
INSERT OR IGNORE INTO fees (id, name, fee_type, applies_to, rate_or_amount, is_active, description) VALUES
('fee-001', 'Default Platform Commission', 'percentage', 'bank', 4.0, 1, 'Standard commission on realized gross asset disposal price');

INSERT OR IGNORE INTO bank_agreements (id, bank_id, agreement_ref, commission_rate, effective_date, status) VALUES
('agr-mtb', 'bank-mtb', 'SURGE-AGR-MTB-2026', 4.0, '2026-01-01', 'Active'),
('agr-csb', 'bank-csb', 'SURGE-AGR-CSB-2026', 4.5, '2026-01-01', 'Active');

INSERT OR IGNORE INTO commissions (id, offer_id, asset_id, bank_id, final_sale_price, commission_rate, commission_amount, status) VALUES
('com-001', 'off-003', 'ast-003', 'bank-csb', 1250000.00, 4.5, 56250.00, 'Invoiced');

INSERT OR IGNORE INTO invoices (id, invoice_number, commission_id, bank_id, amount, description, issue_date, due_date, status) VALUES
('inv-001', 'INV-2026-000014', 'com-001', 'bank-csb', 56250.00, 'Success commission for disposal of SS-RE-2026-00239 (4.5% of GHS 1,250,000.00)', '2026-10-15', '2026-11-14', 'Issued'),
('inv-002', 'INV-2026-000011', NULL, 'bank-mtb', 12400.00, 'Quarterly document verification & valuation management fees', '2026-10-01', '2026-10-31', 'Issued');

-- 18. Audit Logs
INSERT OR IGNORE INTO audit_logs (id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at) VALUES
('log-001', 'j.mensah', 'Legal / Recovery Officer', 'Meridian Trust Bank', 'Update Occupancy', 'Asset', 'SS-RE-2026-00241', 'Occupancy Status: Vacant -> Occupied — Hostile', 'Vacant', 'Occupied — Hostile', '2026-10-17 14:22:00'),
('log-002', 'a.boateng', 'Property Manager', 'Surge Solutions', 'Place Legal Hold', 'Asset', 'SS-RE-2026-00236', 'Legal Hold: Active. Reason: Family caveat and pending cross-examination', 'Inactive', 'Active', '2026-10-16 10:04:00'),
('log-003', 'k.asare', 'Asset Officer', 'Meridian Trust Bank', 'Submit for Review', 'Asset', 'SS-RE-2026-00241', 'Lifecycle: Draft -> Submitted by Bank', 'Draft', 'Submitted by Bank', '2026-10-15 16:47:00'),
('log-004', 'k.asare', 'Asset Officer', 'Meridian Trust Bank', 'Change Reserve Price', 'Asset', 'SS-RE-2026-00241', 'Reserve: GHS 980,000.00 -> GHS 950,000.00', '980,000.00', '950,000.00', '2026-10-15 16:41:00'),
('log-005', 'k.addo', 'Legal Verification Officer', 'Surge Solutions', 'Verify Judgment', 'Instrument', 'J-2026-0418', 'Verified: High Court Judgment CM/0418/2026 with injunction active flag', 'Pending', 'Verified', '2026-10-14 11:30:00');

-- 19. System Settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
('land_search_validity_days', '180', 'Land search report validity period in days'),
('valuation_validity_days', '180', 'Valuation report validity period in days'),
('validity_warning_lead_days', '30', 'Days before expiry to flag Review Required'),
('default_commission_rate', '4.0', 'Default platform commission rate (%)'),
('watermark_text', 'SURGE SOLUTIONS GHANA — CONFIDENTIAL & VERIFIED', 'Watermark overlay on public listing images'),
('signed_url_ttl_minutes', '5', 'Pre-signed secure document URL time to live in minutes'),
('max_images_per_asset', '20', 'Maximum photo uploads permitted per asset');
