import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function initializeDatabaseInstance() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  
  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'surge-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return new DatabaseSync(path.join(tmpDir, 'surge.db'));
    } catch (err) {
      console.warn('Failed to initialize SQLite on /tmp disk, falling back to :memory:', err.message);
      return new DatabaseSync(':memory:');
    }
  }

  const localDbDir = path.join(__dirname, '..', 'data');
  try {
    if (!fs.existsSync(localDbDir)) {
      fs.mkdirSync(localDbDir, { recursive: true });
    }
    return new DatabaseSync(path.join(localDbDir, 'surge.db'));
  } catch (err) {
    console.warn('Local data dir unwritable, falling back to tmp:', err.message);
    const fallbackDir = path.join(os.tmpdir(), 'surge-data');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return new DatabaseSync(path.join(fallbackDir, 'surge.db'));
    } catch {
      return new DatabaseSync(':memory:');
    }
  }
}

export const db = initializeDatabaseInstance();

// Enable foreign keys and WAL mode if applicable
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, -- 'surge', 'bank'
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      default_commission_rate REAL NOT NULL DEFAULT 4.0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS bank_branches (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      name TEXT NOT NULL,
      branch_code TEXT,
      region TEXT NOT NULL,
      town TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      manager_name TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL, -- 'surge', 'bank'
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      module TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_code TEXT NOT NULL,
      permission_code TEXT NOT NULL,
      PRIMARY KEY (role_code, permission_code)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      bank_id TEXT,
      username TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role_code TEXT NOT NULL,
      mfa_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Active',
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS asset_categories (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      public_ref TEXT NOT NULL UNIQUE,
      internal_bank_ref TEXT NOT NULL,
      category_code TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      region TEXT NOT NULL,
      district TEXT NOT NULL,
      town TEXT NOT NULL,
      public_location TEXT NOT NULL,
      exact_address TEXT NOT NULL,
      reserve_price REAL NOT NULL,
      minimum_offer REAL,
      show_reserve_publicly INTEGER NOT NULL DEFAULT 1,
      occupancy_status TEXT NOT NULL, -- 'Vacant', 'Occupied — Cooperative', 'Occupied — Hostile'
      land_guard_risk TEXT NOT NULL DEFAULT 'Low', -- 'Low', 'Medium', 'High'
      status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted by Bank', 'Surge Review', 'Approved', 'Live', 'Legal Hold', 'Changes Required', 'Sold', 'Withdrawn'
      legal_hold_active INTEGER NOT NULL DEFAULT 0,
      legal_hold_reason TEXT,
      review_required INTEGER NOT NULL DEFAULT 0,
      review_required_reason TEXT,
      beds INTEGER,
      baths INTEGER,
      year INTEGER,
      mileage TEXT,
      fuel TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bank_id) REFERENCES banks(id),
      FOREIGN KEY (category_code) REFERENCES asset_categories(code)
    );

    CREATE TABLE IF NOT EXISTS asset_images (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      is_exterior INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      watermark_applied INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enforcement_cases (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL UNIQUE,
      case_number TEXT NOT NULL,
      court TEXT NOT NULL,
      judge TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Verification',
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS legal_instruments (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      instrument_type TEXT NOT NULL, -- 'Default Notice', 'Affidavit of Service', 'Judgment', 'Memorandum', 'Statutory Notice'
      instrument_ref TEXT NOT NULL,
      filing_date TEXT,
      judgment_date TEXT,
      court TEXT,
      injunction_active INTEGER NOT NULL DEFAULT 0,
      verification_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Verified', 'Rejected'
      verified_by TEXT,
      verified_at TEXT,
      notes TEXT,
      FOREIGN KEY (case_id) REFERENCES enforcement_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS title_records (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL UNIQUE,
      certificate_number TEXT NOT NULL,
      registry TEXT NOT NULL,
      parcel_number TEXT,
      perfection_status TEXT NOT NULL DEFAULT 'Perfected',
      verification_status TEXT NOT NULL DEFAULT 'Verified',
      verified_by TEXT,
      verified_at TEXT,
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS land_searches (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      search_reference TEXT NOT NULL,
      search_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      validity_period_days INTEGER NOT NULL DEFAULT 180,
      status TEXT NOT NULL DEFAULT 'Valid', -- 'Valid', 'Expired', 'Review Required'
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS valuations (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      valuer_name TEXT NOT NULL,
      market_value REAL NOT NULL,
      forced_sale_value REAL NOT NULL,
      valuation_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      validity_period_days INTEGER NOT NULL DEFAULT 180,
      status TEXT NOT NULL DEFAULT 'Valid', -- 'Valid', 'Expired', 'Review Required'
      review_required INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Legal', 'Title', 'Valuation', 'Identity', 'Other'
      file_path TEXT NOT NULL,
      file_size TEXT NOT NULL,
      content_type TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'Verified',
      verified_by TEXT,
      verified_at TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_access_logs (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      ip_address TEXT,
      access_type TEXT NOT NULL DEFAULT 'VIEW',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buyers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      ghana_card_number TEXT,
      address TEXT,
      kyc_status TEXT NOT NULL DEFAULT 'Verified', -- 'None', 'Submitted', 'Verified', 'Rejected'
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kyc_applications (
      id TEXT PRIMARY KEY,
      buyer_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      ghana_card_number TEXT NOT NULL,
      id_card_front TEXT,
      id_card_back TEXT,
      proof_of_funds TEXT,
      source_of_funds TEXT,
      related_asset_ref TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Review', -- 'Pending Review', 'Verified', 'Rejected'
      reviewer_note TEXT,
      internal_note TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      consent_type TEXT NOT NULL, -- 'NDA', 'Buyer Disclaimer', 'Data Protection', 'Terms', 'Intermediary Disclosure'
      document_version TEXT NOT NULL DEFAULT 'v1.0',
      accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT NOT NULL DEFAULT '127.0.0.1'
    );

    CREATE TABLE IF NOT EXISTS buyer_access_grants (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Revoked', 'Expired'
      revoked_reason TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      buyer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Promoted', 'Spam'
      lead_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_ref TEXT NOT NULL UNIQUE,
      asset_id TEXT NOT NULL,
      buyer_id TEXT,
      buyer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'KYC Requested', 'KYC Verified', 'Viewing', 'Interested', 'Offer', 'Negotiation', 'Sale'
      assigned_agent_id TEXT,
      assigned_agent_name TEXT,
      source TEXT NOT NULL DEFAULT 'Marketplace Enquiry',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS lead_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS viewings (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      buyer_id TEXT,
      buyer_name TEXT NOT NULL,
      agent_id TEXT,
      agent_name TEXT,
      viewing_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No-show'
      high_risk_override INTEGER NOT NULL DEFAULT 0,
      override_reason TEXT,
      override_by TEXT,
      notes TEXT,
      address_disclosed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      offer_ref TEXT NOT NULL UNIQUE,
      asset_id TEXT NOT NULL,
      buyer_id TEXT,
      buyer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      validity_date TEXT NOT NULL,
      conditions TEXT,
      status TEXT NOT NULL DEFAULT 'Under Bank Review', -- 'Submitted', 'Surge Review', 'Forwarded to Bank', 'Under Bank Review', 'Accepted', 'Rejected', 'Countered', 'Withdrawn'
      below_reserve INTEGER NOT NULL DEFAULT 0,
      exception_requested INTEGER NOT NULL DEFAULT 0,
      exception_decision TEXT,
      exception_reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS offer_revisions (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      proposed_by TEXT NOT NULL, -- 'Buyer', 'Bank'
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fee_type TEXT NOT NULL, -- 'percentage', 'flat'
      applies_to TEXT NOT NULL, -- 'bank', 'buyer', 'global'
      rate_or_amount REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS bank_agreements (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      agreement_ref TEXT NOT NULL,
      commission_rate REAL NOT NULL DEFAULT 4.0,
      effective_date TEXT NOT NULL,
      expiry_date TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      FOREIGN KEY (bank_id) REFERENCES banks(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      bank_id TEXT NOT NULL,
      final_sale_price REAL NOT NULL,
      commission_rate REAL NOT NULL,
      commission_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Invoice',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (offer_id) REFERENCES offers(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (bank_id) REFERENCES banks(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      commission_id TEXT,
      bank_id TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Issued', -- 'Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bank_id) REFERENCES banks(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      reference TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'System',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      organization TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      delta_summary TEXT,
      old_values TEXT,
      new_values TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );
  `);

  seedData();
  seedBankBranches();
}

function seedData() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM organizations').get();
  if (countRow.count > 0) return;

  // 1. Organizations & Banks
  const orgSurge = { id: 'org-surge', name: 'Surge Solutions Platform Operator', code: 'SURGE', type: 'surge' };
  const orgMeridian = { id: 'org-mtb', name: 'Meridian Trust Bank Ltd', code: 'MTB', type: 'bank' };
  const orgCoastal = { id: 'org-csb', name: 'Coastal Savings Bank', code: 'CSB', type: 'bank' };
  const orgSouthern = { id: 'org-scb', name: 'Southern Commercial Bank', code: 'SCB', type: 'bank' };
  const orgApex = { id: 'org-amb', name: 'Apex Merchant Bank', code: 'AMB', type: 'bank' };

  for (const org of [orgSurge, orgMeridian, orgCoastal, orgSouthern, orgApex]) {
    db.prepare('INSERT INTO organizations (id, name, code, type) VALUES (?, ?, ?, ?)').run(org.id, org.name, org.code, org.type);
  }

  const bankMeridian = { id: 'bank-mtb', organization_id: 'org-mtb', legal_name: 'Meridian Trust Bank Limited', short_code: 'MTB', contact_email: 'recoveries@meridiantrust.com.gh', contact_phone: '+233 30 223 8810', default_commission_rate: 4.0 };
  const bankCoastal = { id: 'bank-csb', organization_id: 'org-csb', legal_name: 'Coastal Savings Bank Ghana', short_code: 'CSB', contact_email: 'specialassets@coastalsavings.com.gh', contact_phone: '+233 31 202 4491', default_commission_rate: 4.5 };
  const bankSouthern = { id: 'bank-scb', organization_id: 'org-scb', legal_name: 'Southern Commercial Bank PLC', short_code: 'SCB', contact_email: 'repossessed@southerncomm.com.gh', contact_phone: '+233 33 213 1900', default_commission_rate: 4.0 };
  const bankApex = { id: 'bank-amb', organization_id: 'org-amb', legal_name: 'Apex Merchant Bank Ltd', short_code: 'AMB', contact_email: 'distressed@apexmerchant.gh', contact_phone: '+233 30 266 5100', default_commission_rate: 5.0 };

  for (const b of [bankMeridian, bankCoastal, bankSouthern, bankApex]) {
    db.prepare('INSERT INTO banks (id, organization_id, legal_name, short_code, contact_email, contact_phone, default_commission_rate) VALUES (?, ?, ?, ?, ?, ?, ?)').run(b.id, b.organization_id, b.legal_name, b.short_code, b.contact_email, b.contact_phone, b.default_commission_rate);
  }

  // 2. Roles
  const roles = [
    { id: 'r-sa', name: 'Super Administrator', code: 'SA', scope: 'surge', description: 'Platform operator administrator with global permissions' },
    { id: 'r-pm', name: 'Property Manager', code: 'PM', scope: 'surge', description: 'Surge property and listing manager' },
    { id: 'r-lo', name: 'Legal Verification Officer', code: 'LO', scope: 'surge', description: 'Surge legal, judgment and injunction reviewer' },
    { id: 'r-sg', name: 'Sales Agent', code: 'SG', scope: 'surge', description: 'Surge sales and buyer relationship agent' },
    { id: 'r-sfo', name: 'Finance Officer (Surge)', code: 'SFO', scope: 'surge', description: 'Surge billing, fees and commission reconciliation' },
    { id: 'r-au', name: 'Auditor', code: 'AU', scope: 'surge', description: 'Compliance and immutable audit log reviewer' },
    { id: 'r-ba', name: 'Bank Administrator', code: 'BA', scope: 'bank', description: 'Bank organization administrator' },
    { id: 'r-ao', name: 'Asset Officer', code: 'AO', scope: 'bank', description: 'Bank asset registration and management' },
    { id: 'r-lro', name: 'Legal / Recovery Officer', code: 'LRO', scope: 'bank', description: 'Bank recovery officer and legal matters coordinator' },
    { id: 'r-ap', name: 'Approver', code: 'AP', scope: 'bank', description: 'Bank executive with offer approval authority' },
    { id: 'r-bfo', name: 'Finance Officer (Bank)', code: 'BFO', scope: 'bank', description: 'Bank invoice and statements viewer' },
    { id: 'r-vw', name: 'Viewer', code: 'VW', scope: 'bank', description: 'Read-only bank portfolio observer' }
  ];
  for (const r of roles) {
    db.prepare('INSERT INTO roles (id, name, code, scope, description) VALUES (?, ?, ?, ?, ?)').run(r.id, r.name, r.code, r.scope, r.description);
  }

  // 3. Asset Categories
  const categories = [
    { code: 'House', name: 'Residential House', icon: 'home' },
    { code: 'Vehicle', name: 'Motor Vehicle', icon: 'truck' },
    { code: 'Equipment', name: 'Industrial Equipment', icon: 'tool' },
    { code: 'Commercial', name: 'Commercial Property', icon: 'briefcase' },
    { code: 'Land', name: 'Demarcated Land', icon: 'map' }
  ];
  for (const c of categories) {
    db.prepare('INSERT INTO asset_categories (code, name, icon) VALUES (?, ?, ?)').run(c.code, c.name, c.icon);
  }

  // 5. Assets (Full specifications from document)
  const assets = [
    {
      id: 'ast-001',
      bank_id: 'bank-mtb',
      public_ref: 'SS-RE-2026-00241',
      internal_bank_ref: 'BNK-LN-88213',
      category_code: 'House',
      asset_type: '4-bedroom detached house',
      title: 'Tema Community 25, 4-Bedroom Detached House with Compound',
      description: 'Spacious 4-bedroom executive detached house with two master en-suite bedrooms, fitted kitchen, paved compound, security fencing, borehole water backup, and dedicated electric transformer.',
      region: 'Greater Accra',
      district: 'Tema West',
      town: 'Community 25',
      public_location: 'Tema, Greater Accra (approximate)',
      exact_address: 'Plot 14, 2nd Crescent, Community 25, Tema',
      reserve_price: 950000.00,
      minimum_offer: 900000.00,
      show_reserve_publicly: 1,
      occupancy_status: 'Occupied — Hostile',
      land_guard_risk: 'High',
      status: 'Submitted by Bank',
      legal_hold_active: 0,
      legal_hold_reason: null,
      review_required: 1,
      review_required_reason: 'Valuation report is outside validity window; title and land search pending re-confirmation.',
      beds: 4,
      baths: 3,
      year: 2019,
      mileage: null,
      fuel: null,
      created_by: null
    },
    {
      id: 'ast-002',
      bank_id: 'bank-mtb',
      public_ref: 'SS-VH-2026-00187',
      internal_bank_ref: 'BNK-LN-79104',
      category_code: 'Vehicle',
      asset_type: 'Double Cabin Pickup',
      title: 'Toyota Hilux 2.4 GD-6 Double Cab 4x4 (2021)',
      description: 'Factory-maintained Toyota Hilux Double Cabin 4x4, 6-speed manual, diesel engine, heavy-duty canopy, bull bar, tow hitch, pristine interior, clear court-ordered release.',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      town: 'Adum',
      public_location: 'Kumasi, Ashanti (approximate)',
      exact_address: 'Prempeh II Yard, Adum, Kumasi',
      reserve_price: 185000.00,
      minimum_offer: 175000.00,
      show_reserve_publicly: 1,
      occupancy_status: 'Vacant',
      land_guard_risk: 'Low',
      status: 'Live',
      legal_hold_active: 0,
      legal_hold_reason: null,
      review_required: 0,
      review_required_reason: null,
      beds: null,
      baths: null,
      year: 2021,
      mileage: '48,200 km',
      fuel: 'Diesel',
      created_by: null
    },
    {
      id: 'ast-003',
      bank_id: 'bank-csb',
      public_ref: 'SS-RE-2026-00239',
      internal_bank_ref: 'CSB-AST-4410',
      category_code: 'House',
      asset_type: '4-bedroom residential house',
      title: 'Beach Road, Sekondi-Takoradi, 4-Bedroom House with Compound',
      description: 'Substantial residential property located in Beach Road close, Takoradi. Features 4 bedrooms, detached boys quarters, expansive landscaped garden and garage.',
      region: 'Western',
      district: 'Sekondi Takoradi Metropolitan',
      town: 'Takoradi Beach Road',
      public_location: 'Takoradi, Western Region (approximate)',
      exact_address: 'Beach Road Close, Plot 8, Takoradi',
      reserve_price: 1240000.00,
      minimum_offer: 1180000.00,
      show_reserve_publicly: 1,
      occupancy_status: 'Occupied — Cooperative',
      land_guard_risk: 'Low',
      status: 'Live',
      legal_hold_active: 0,
      legal_hold_reason: null,
      review_required: 1,
      review_required_reason: 'Valuation report expired on 30 Sep 2026; updated valuation scheduled.',
      beds: 4,
      baths: 3,
      year: 2017,
      mileage: null,
      fuel: null,
      created_by: 'e.quaye'
    },
    {
      id: 'ast-004',
      bank_id: 'bank-mtb',
      public_ref: 'SS-RE-2026-00236',
      internal_bank_ref: 'BNK-LN-82001',
      category_code: 'House',
      asset_type: '3-bedroom bungalow',
      title: 'Cantonments, Accra, 3-Bedroom Executive Bungalow',
      description: 'Single-storey executive bungalow situated in prime Cantonments. Enclosed perimeter wall with electric fencing, well-kept lawn, 2-room staff quarters.',
      region: 'Greater Accra',
      district: 'La Dade Kotopon',
      town: 'Cantonments',
      public_location: 'Cantonments, Accra (approximate)',
      exact_address: '12 Rangoon Link, Cantonments, Accra',
      reserve_price: 720000.00,
      minimum_offer: 680000.00,
      show_reserve_publicly: 1,
      occupancy_status: 'Vacant',
      land_guard_risk: 'Low',
      status: 'Legal Hold',
      legal_hold_active: 1,
      legal_hold_reason: 'Hold placed due to pending family caveat and cross-examination hearing in High Court.',
      review_required: 0,
      review_required_reason: null,
      beds: 3,
      baths: 2,
      year: 2015,
      mileage: null,
      fuel: null,
      created_by: null
    },
    {
      id: 'ast-005',
      bank_id: 'bank-csb',
      public_ref: 'SS-EQ-2026-00094',
      internal_bank_ref: 'CSB-EQ-1120',
      category_code: 'Equipment',
      asset_type: 'Hydraulic Excavator',
      title: 'Caterpillar 320D Tracked Hydraulic Excavator',
      description: 'Heavy construction hydraulic excavator, Caterpillar C6.4 Acert engine, standard reach boom, 1.2 m3 heavy duty bucket. Fully inspected and stored in secure bonded yard.',
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      town: 'Heavy Industrial Area',
      public_location: 'Tema Heavy Industrial, Greater Accra',
      exact_address: 'Tema Free Zones Enclave Yard 4B',
      reserve_price: 96500.00,
      minimum_offer: 90000.00,
      show_reserve_publicly: 1,
      occupancy_status: 'Vacant',
      land_guard_risk: 'Low',
      status: 'Live',
      legal_hold_active: 0,
      legal_hold_reason: null,
      review_required: 0,
      review_required_reason: null,
      beds: null,
      baths: null,
      year: 2018,
      mileage: '6,420 operating hours',
      fuel: 'Diesel',
      created_by: 'e.quaye'
    },
    {
      id: 'ast-006',
      bank_id: 'bank-scb',
      public_ref: 'SS-VH-2026-00171',
      internal_bank_ref: 'SCB-LN-5092',
      category_code: 'Vehicle',
      asset_type: 'Commercial Bus / Van',
      title: 'Mercedes-Benz Sprinter 316 CDI 19-Seater (2020)',
      description: 'Commercial 19-seater passenger Sprinter van, high roof, OM651 engine, dual rear air conditioning, comprehensive registration history available.',
      region: 'Central',
      district: 'Cape Coast Metropolitan',
      town: 'Cape Coast',
      public_location: 'Cape Coast, Central Region',
      exact_address: 'Industrial Road Yard, Cape Coast',
      reserve_price: 210000.00,
      minimum_offer: 195000.00,
      show_reserve_publicly: 0,
      occupancy_status: 'Vacant',
      land_guard_risk: 'Low',
      status: 'Changes Required',
      legal_hold_active: 0,
      legal_hold_reason: null,
      review_required: 1,
      review_required_reason: 'Updated roadworthiness certificate and chassis clearance requested by Surge Reviewer.',
      beds: null,
      baths: null,
      year: 2020,
      mileage: '84,100 km',
      fuel: 'Diesel',
      created_by: 'e.quaye'
    }
  ];

  for (const a of assets) {
    db.prepare(`
      INSERT INTO assets (
        id, bank_id, public_ref, internal_bank_ref, category_code, asset_type, title, description,
        region, district, town, public_location, exact_address, reserve_price, minimum_offer,
        show_reserve_publicly, occupancy_status, land_guard_risk, status, legal_hold_active,
        legal_hold_reason, review_required, review_required_reason, beds, baths, year, mileage, fuel, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      a.id, a.bank_id, a.public_ref, a.internal_bank_ref, a.category_code, a.asset_type, a.title, a.description,
      a.region, a.district, a.town, a.public_location, a.exact_address, a.reserve_price, a.minimum_offer,
      a.show_reserve_publicly, a.occupancy_status, a.land_guard_risk, a.status, a.legal_hold_active,
      a.legal_hold_reason, a.review_required, a.review_required_reason, a.beds, a.baths, a.year, a.mileage, a.fuel, a.created_by
    );
  }

  // 6. Enforcement Cases & Instruments (Includes Injunction on ast-001)
  db.prepare(`
    INSERT INTO enforcement_cases (id, asset_id, case_number, court, judge, status, notes)
    VALUES ('ec-001', 'ast-001', 'Suit No. CM/0418/2026', 'High Court (Commercial Division), Accra', 'His Lordship Justice K. Boateng', 'Verified', 'Judgment entered in default of appearance. Notice of enforcement served.')
  `).run();

  const instruments = [
    { id: 'inst-01', case_id: 'ec-001', type: 'Default Notice', ref: 'DN-2026-0182', filing: '2026-08-14', judg: null, court: 'High Court Accra', injunction: 0, status: 'Verified', by: null, at: null },
    { id: 'inst-02', case_id: 'ec-001', type: 'Affidavit of Service', ref: 'AS-2026-0311', filing: '2026-08-28', judg: null, court: 'High Court Accra', injunction: 0, status: 'Verified', by: null, at: null },
    { id: 'inst-03', case_id: 'ec-001', type: 'Judgment', ref: 'J-2026-0418', filing: '2026-09-15', judg: '2026-10-04', court: 'High Court Accra Commercial Div', injunction: 1, status: 'Verified', by: null, at: null },
    { id: 'inst-04', case_id: 'ec-001', type: 'Statutory Notice', ref: 'SN-2026-0094', filing: '2026-10-05', judg: null, court: 'High Court Accra', injunction: 0, status: 'Pending', by: null, at: null }
  ];
  for (const inst of instruments) {
    db.prepare(`
      INSERT INTO legal_instruments (id, case_id, instrument_type, instrument_ref, filing_date, judgment_date, court, injunction_active, verification_status, verified_by, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(inst.id, inst.case_id, inst.type, inst.ref, inst.filing, inst.judg, inst.court, inst.injunction, inst.status, inst.by, inst.at);
  }

  // 7. Title Records
  db.prepare(`
    INSERT INTO title_records (id, asset_id, certificate_number, registry, parcel_number, perfection_status, verification_status, verified_by, verified_at, notes)
    VALUES ('tit-001', 'ast-001', 'GA/TM/2019/8821', 'Lands Commission Tema Registry', 'Parcel 411, Block 3, Section 25', 'Perfected', 'Pending', null, null, 'Official cadastral plan search requested.')
  `).run();

  // 8. Land Searches & Valuations
  db.prepare(`
    INSERT INTO land_searches (id, asset_id, search_reference, search_date, expiry_date, validity_period_days, status, notes)
    VALUES ('ls-001', 'ast-001', 'LC-SRCH-2026-8841', '2026-04-12', '2026-10-09', 180, 'Expired', 'Land search validity expired on 09 Oct 2026. Refresh required before publish readiness (TL-2).')
  `).run();

  db.prepare(`
    INSERT INTO valuations (id, asset_id, valuer_name, market_value, forced_sale_value, valuation_date, expiry_date, validity_period_days, status, review_required, notes)
    VALUES ('val-001', 'ast-001', 'Consolidated Property Valuers Ltd (GhIS certified)', 1150000.00, 920000.00, '2026-03-31', '2026-09-30', 180, 'Expired', 1, 'Valuation report valid to 30 Sep 2026 and now outside validity window (VL-1).')
  `).run();

  // 9. Documents
  const docs = [
    { id: 'doc-001', asset_id: 'ast-001', title: 'Default Notice & Proof of Service', cat: 'Legal', path: '/docs/default_notice_ast001.pdf', size: '2.4 MB', type: 'application/pdf', status: 'Verified', by: null },
    { id: 'doc-002', asset_id: 'ast-001', title: 'High Court Judgment CM/0418/2026', cat: 'Legal', path: '/docs/judgment_cm0418.pdf', size: '4.1 MB', type: 'application/pdf', status: 'Verified', by: null },
    { id: 'doc-003', asset_id: 'ast-001', title: 'Land Title Certificate GA/TM/2019/8821', cat: 'Title', path: '/docs/land_title_8821.pdf', size: '1.8 MB', type: 'application/pdf', status: 'Pending', by: null },
    { id: 'doc-004', asset_id: 'ast-001', title: 'Valuation Report — Tema Comm 25 House', cat: 'Valuation', path: '/docs/valuation_report_comm25.pdf', size: '6.7 MB', type: 'application/pdf', status: 'Verified', by: null }
  ];
  for (const d of docs) {
    db.prepare(`
      INSERT INTO documents (id, asset_id, title, category, file_path, file_size, content_type, verification_status, verified_by, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(d.id, d.asset_id, d.title, d.cat, d.path, d.size, d.type, d.status, d.by);
  }

  // 10. Buyers & KYC
  const buyers = [
    { id: 'byr-001', name: 'Dr. Kwabena Frimpong', email: 'k.frimpong@apexmed.com.gh', phone: '+233 24 419 8832', ghana_card: 'GHA-718291044-8', address: '14 Ridge Road, Roman Ridge, Accra', kyc: 'Verified' },
    { id: 'byr-002', name: 'Nana Ama Serwaa', email: 'naserwaa@translogistics.gh', phone: '+233 20 812 4001', ghana_card: 'GHA-829103819-2', address: 'Plot 5, Asokwa Residential, Kumasi', kyc: 'Verified' },
    { id: 'byr-003', name: 'Kojo Antwi-Boasiako', email: 'kojo.antwi@ecowaspower.org', phone: '+233 55 930 1192', ghana_card: 'GHA-629100482-1', address: 'Airport Hills, Cantonments, Accra', kyc: 'Pending Review' }
  ];
  for (const b of buyers) {
    db.prepare(`
      INSERT INTO buyers (id, full_name, email, phone, ghana_card_number, address, kyc_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(b.id, b.name, b.email, b.phone, b.ghana_card, b.address, b.kyc);
  }

  // KYC Applications
  db.prepare(`
    INSERT INTO kyc_applications (id, buyer_id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status, reviewer_note, internal_note, reviewed_by, reviewed_at)
    VALUES ('kyc-001', 'byr-001', 'Dr. Kwabena Frimpong', 'k.frimpong@apexmed.com.gh', '+233 24 419 8832', 'GHA-718291044-8', 'Medical Practice & Commercial Real Estate', 'SS-RE-2026-00241', 'Verified', 'Ghana Card verified. Source of funds verified with bank reference letter.', 'Cleared for high-value asset bidding.', NULL, NULL)
  `).run();

  db.prepare(`
    INSERT INTO kyc_applications (id, buyer_id, full_name, email, phone, ghana_card_number, source_of_funds, related_asset_ref, status, reviewer_note, internal_note, reviewed_by, reviewed_at)
    VALUES ('kyc-002', 'byr-003', 'Kojo Antwi-Boasiako', 'kojo.antwi@ecowaspower.org', '+233 55 930 1192', 'GHA-629100482-1', 'Employment & Consultancy income', 'SS-RE-2026-00236', 'Pending Review', null, 'Proof of address document pending clarity.', null, null)
  `).run();

  // Consents & Buyer Access Grants
  db.prepare(`
    INSERT INTO consents (id, buyer_id, consent_type, document_version, ip_address)
    VALUES ('cns-001', 'byr-001', 'NDA', 'v1.0', '154.160.22.84')
  `).run();
  db.prepare(`
    INSERT INTO consents (id, buyer_id, consent_type, document_version, ip_address)
    VALUES ('cns-002', 'byr-001', 'Data Protection', 'v1.0', '154.160.22.84')
  `).run();

  db.prepare(`
    INSERT INTO buyer_access_grants (id, buyer_id, asset_id, expires_at, status)
    VALUES ('grt-001', 'byr-001', 'ast-001', '2026-11-15', 'Active')
  `).run();

  // 11. Leads & Activities
  db.prepare(`
    INSERT INTO leads (id, lead_ref, asset_id, buyer_id, buyer_name, email, phone, stage, assigned_agent_id, assigned_agent_name, source, notes)
    VALUES ('lead-001', 'SL-LEAD-2026-000042', 'ast-001', 'byr-001', 'Dr. Kwabena Frimpong', 'k.frimpong@apexmed.com.gh', '+233 24 419 8832', 'Viewing', NULL, NULL, 'Marketplace Enquiry', 'Buyer requested viewing appointment for Community 25 property.')
  `).run();

  db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, description, actor_name)
    VALUES ('la-001', 'lead-001', 'Enquiry Received', 'Marketplace enquiry submitted regarding Tema Comm 25 house', 'Dr. Kwabena Frimpong')
  `).run();
  // 12. Viewings (Occupied - Hostile requiring Override)
  db.prepare(`
    INSERT INTO viewings (id, asset_id, buyer_id, buyer_name, agent_id, agent_name, viewing_date, time_slot, status, high_risk_override, override_reason, override_by, notes, address_disclosed)
    VALUES ('vw-001', 'ast-001', 'byr-001', 'Dr. Kwabena Frimpong', NULL, NULL, '2026-10-21', '14:00 - 15:30', 'Confirmed', 1, 'Accompanied by armed court bailiff and bank security detail per High-Risk Occupancy protocol.', NULL, 'Exterior and compound inspection only. Occupant notified.', 1)
  `).run();

  // 13. Offers & Decisions
  const offers = [
    {
      id: 'off-001',
      offer_ref: 'SS-OFF-2026-0081',
      asset_id: 'ast-001',
      buyer_id: 'byr-001',
      buyer_name: 'Dr. Kwabena Frimpong',
      amount: 920000.00,
      validity: '2026-11-05',
      conditions: 'Subject to vacant possession confirmation and clean title delivery within 60 days.',
      status: 'Under Bank Review',
      below_reserve: 1,
      exception_requested: 1,
      exception_decision: 'Pending',
      exception_reason: 'Offer of GHS 920,000 is below reserve of GHS 950,000 but exceeds minimum offer threshold of GHS 900,000.'
    },
    {
      id: 'off-002',
      offer_ref: 'SS-OFF-2026-0079',
      asset_id: 'ast-002',
      buyer_id: 'byr-002',
      buyer_name: 'Nana Ama Serwaa',
      amount: 180000.00,
      validity: '2026-10-30',
      conditions: 'Full cash payment within 14 days upon inspection of DVLA logbook.',
      status: 'Under Bank Review',
      below_reserve: 1,
      exception_requested: 1,
      exception_decision: 'Pending',
      exception_reason: 'Offer is GHS 180,000 (reserve GHS 185,000, min offer GHS 175,000).'
    },
    {
      id: 'off-003',
      offer_ref: 'SS-OFF-2026-0075',
      asset_id: 'ast-003',
      buyer_id: 'byr-001',
      buyer_name: 'Dr. Kwabena Frimpong',
      amount: 1250000.00,
      validity: '2026-11-12',
      conditions: 'Payment in 2 installments: 70% upon agreement, 30% on completion.',
      status: 'Accepted',
      below_reserve: 0,
      exception_requested: 0,
      exception_decision: null,
      exception_reason: null
    }
  ];

  for (const o of offers) {
    db.prepare(`
      INSERT INTO offers (
        id, offer_ref, asset_id, buyer_id, buyer_name, amount, validity_date, conditions,
        status, below_reserve, exception_requested, exception_decision, exception_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      o.id, o.offer_ref, o.asset_id, o.buyer_id, o.buyer_name, o.amount, o.validity, o.conditions,
      o.status, o.below_reserve, o.exception_requested, o.exception_decision, o.exception_reason
    );
  }

  // 14. Fees, Bank Agreements & Commission Calculations
  db.prepare(`
    INSERT INTO fees (id, name, fee_type, applies_to, rate_or_amount, is_active, description)
    VALUES ('fee-001', 'Default Platform Commission', 'percentage', 'bank', 4.0, 1, 'Standard commission on realized gross asset disposal price')
  `).run();

  db.prepare(`
    INSERT INTO bank_agreements (id, bank_id, agreement_ref, commission_rate, effective_date, status)
    VALUES ('agr-mtb', 'bank-mtb', 'SURGE-AGR-MTB-2026', 4.0, '2026-01-01', 'Active')
  `).run();
  db.prepare(`
    INSERT INTO bank_agreements (id, bank_id, agreement_ref, commission_rate, effective_date, status)
    VALUES ('agr-csb', 'bank-csb', 'SURGE-AGR-CSB-2026', 4.5, '2026-01-01', 'Active')
  `).run();

  // Commission for off-003: 1,250,000 * 4.5% = 56,250.00
  db.prepare(`
    INSERT INTO commissions (id, offer_id, asset_id, bank_id, final_sale_price, commission_rate, commission_amount, status)
    VALUES ('com-001', 'off-003', 'ast-003', 'bank-csb', 1250000.00, 4.5, 56250.00, 'Invoiced')
  `).run();

  db.prepare(`
    INSERT INTO invoices (id, invoice_number, commission_id, bank_id, amount, description, issue_date, due_date, status)
    VALUES ('inv-001', 'INV-2026-000014', 'com-001', 'bank-csb', 56250.00, 'Success commission for disposal of SS-RE-2026-00239 (4.5% of GHS 1,250,000.00)', '2026-10-15', '2026-11-14', 'Issued')
  `).run();

  db.prepare(`
    INSERT INTO invoices (id, invoice_number, commission_id, bank_id, amount, description, issue_date, due_date, status)
    VALUES ('inv-002', 'INV-2026-000011', null, 'bank-mtb', 12400.00, 'Quarterly document verification & valuation management fees', '2026-10-01', '2026-10-31', 'Issued')
  `).run();

  // 14. System Settings
  const settings = [
    { key: 'land_search_validity_days', value: '180', description: 'Land search report validity period in days' },
    { key: 'valuation_validity_days', value: '180', description: 'Valuation report validity period in days' },
    { key: 'validity_warning_lead_days', value: '30', description: 'Days before expiry to flag Review Required' },
    { key: 'default_commission_rate', value: '4.0', description: 'Default platform commission rate (%)' },
    { key: 'watermark_text', value: 'SURGE SOLUTIONS GHANA — CONFIDENTIAL & VERIFIED', description: 'Watermark overlay on public listing images' },
    { key: 'signed_url_ttl_minutes', value: '5', description: 'Pre-signed secure document URL time to live in minutes' },
    { key: 'max_images_per_asset', value: '20', description: 'Maximum photo uploads permitted per asset' }
  ];
  for (const s of settings) {
    db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(s.key, s.value, s.description);
  }
}

function seedBankBranches() {
  const branchCount = db.prepare('SELECT COUNT(*) as count FROM bank_branches').get();
  if (branchCount.count > 0) return;

  const seedBranches = [
    // Meridian Trust Bank
    { id: 'br-mtb-01', bank_id: 'bank-mtb', name: 'Ridge Head Office Branch', branch_code: 'MTB-RDG-01', region: 'Greater Accra', town: 'Accra', address: '14 Independence Avenue, Ridge', phone: '+233 30 223 8810', email: 'ridge@meridiantrust.com.gh', manager_name: 'Samuel Osei-Bonsu' },
    { id: 'br-mtb-02', bank_id: 'bank-mtb', name: 'Tema Commercial Hub', branch_code: 'MTB-TMA-02', region: 'Greater Accra', town: 'Tema', address: 'Community 1 Meridian Plaza', phone: '+233 30 320 1144', email: 'tema@meridiantrust.com.gh', manager_name: 'Evelyn Addo' },
    { id: 'br-mtb-03', bank_id: 'bank-mtb', name: 'Kumasi Harper Road Branch', branch_code: 'MTB-KMS-03', region: 'Ashanti', town: 'Kumasi', address: 'Harper Road, Adum', phone: '+233 32 203 9912', email: 'adum@meridiantrust.com.gh', manager_name: 'Kwame Agyapong' },
    { id: 'br-mtb-04', bank_id: 'bank-mtb', name: 'Takoradi Harbour Branch', branch_code: 'MTB-TKD-04', region: 'Western', town: 'Takoradi', address: 'Market Circle Commercial Area', phone: '+233 31 202 7701', email: 'takoradi@meridiantrust.com.gh', manager_name: 'Patience Mensah' },

    // Coastal Savings Bank
    { id: 'br-csb-01', bank_id: 'bank-csb', name: 'Cape Coast Commercial Street', branch_code: 'CSB-CPC-01', region: 'Central', town: 'Cape Coast', address: 'Commercial Street, Kingsway', phone: '+233 33 213 2200', email: 'capecoast@coastalsavings.com.gh', manager_name: 'Francis Quaye' },
    { id: 'br-csb-02', bank_id: 'bank-csb', name: 'Sekondi High Street Branch', branch_code: 'CSB-SKD-02', region: 'Western', town: 'Sekondi', address: 'High Street Near District Court', phone: '+233 31 204 8831', email: 'sekondi@coastalsavings.com.gh', manager_name: 'Grace Appiah' },

    // Southern Commercial Bank
    { id: 'br-scb-01', bank_id: 'bank-scb', name: 'Airport City Corporate Branch', branch_code: 'SCB-APT-01', region: 'Greater Accra', town: 'Accra', address: 'One Airport Square, 4th Floor', phone: '+233 30 277 4450', email: 'airport@southerncomm.com.gh', manager_name: 'Michael Danquah' },
    { id: 'br-scb-02', bank_id: 'bank-scb', name: 'Koforidua Central Branch', branch_code: 'SCB-KFD-02', region: 'Eastern', town: 'Koforidua', address: 'Central Market Road', phone: '+233 34 202 1199', email: 'koforidua@southerncomm.com.gh', manager_name: 'Beatrice Asantewaa' },

    // Apex Merchant Bank
    { id: 'br-amb-01', bank_id: 'bank-amb', name: 'West Ridge Premier Banking', branch_code: 'AMB-WST-01', region: 'Greater Accra', town: 'Accra', address: 'Ambassadorial Enclave, West Ridge', phone: '+233 30 266 5100', email: 'premier@apexmerchant.gh', manager_name: 'Nathaniel Sarpong' }
  ];

  for (const br of seedBranches) {
    db.prepare(`
      INSERT INTO bank_branches (id, bank_id, name, branch_code, region, town, address, phone, email, manager_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(br.id, br.bank_id, br.name, br.branch_code, br.region, br.town, br.address, br.phone, br.email, br.manager_name);
  }
}
