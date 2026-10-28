/**
 * Surge Solutions — Enterprise Asset Disposition Platform Engine
 * Unified Interactive Controller & Shared Data Store
 * Derived from Surge Solutions — Complete Interactive Mockup.html
 */

// ============================================================
// SHARED DATA STORE
// ============================================================
const Store = {
  assets: [], auditLog: [], leads: [], offers: [], viewings: [], invoices: [],

  init() { this.seed(); },

  seed() {
    const now = new Date();
    const d = (daysAgo) => { const dt = new Date(now); dt.setDate(dt.getDate() - daysAgo); return dt.toISOString(); };
    const future = (days) => { const dt = new Date(now); dt.setDate(dt.getDate() + days); return dt.toISOString(); };

    this.assets = [
      { id: 'a1', ref: 'SS-RE-2026-00241', bankId: 'bank1', bankName: 'Meridian Trust Bank',
        category: 'House', assetType: '4 bedroom detached', region: 'Greater Accra', district: 'Tema West',
        town: 'Community 25', publicLocation: 'Tema, Greater Accra', exactAddress: 'Plot 14, Block C, Community 25, Tema',
        description: 'Spacious 4-bedroom detached house with a large garden, 2-car garage, and servant quarters. Located in a quiet residential area.',
        reserve: 950000, minOffer: 900000, showReserve: true,
        status: 'Live', publicationStatus: 'Published', legalStatus: 'Cleared',
        valuationAmount: 980000, valuationDate: d(30), valuationExpiry: future(335),
        landSearchValid: true, landSearchExpiry: future(180), injunctionActive: false, legalHold: false,
        exteriorImage: true, titleVerified: true,
        enforcementBasis: 'Court Judgment', caseRef: 'BNK-LN-88213',
        borrowerRef: 'John Doe (borrower)', loanAmount: 1200000,
        images: 4, documents: 5,
        createdAt: d(60), updatedAt: d(2), createdBy: 'K. Asante',
        legalSubstate: { enforcementRecorded: true, instrumentsVerified: true, injunctionClear: true, clearanceIssued: true },
        legalNotes: [{ when: d(50), who: 'S. Adjei', decision: 'verified', note: 'Court judgment verified — enforceable' }],
        instruments: [
          { id: 'i1', type: 'Court Judgment', ref: 'JUD-2025-0142', status: 'Verified', uploadedBy: 'K. Asante', uploadedAt: d(55) },
          { id: 'i2', type: 'Default Notice', ref: 'DN-2025-0088', status: 'Verified', uploadedBy: 'K. Asante', uploadedAt: d(55) },
        ],
        activity: [
          { when: d(60), who: 'K. Asante', what: 'Asset created as Draft' },
          { when: d(58), who: 'K. Asante', what: 'Submitted for review' },
          { when: d(50), who: 'S. Adjei', what: 'Legal verification completed' },
          { when: d(45), who: 'A. Boateng', what: 'Title and valuation verified' },
          { when: d(40), who: 'A. Boateng', what: 'Listing approved' },
          { when: d(38), who: 'A. Boateng', what: 'Published to Marketplace' },
        ],
      },
      { id: 'a2', ref: 'SS-RE-2026-00242', bankId: 'bank1', bankName: 'Meridian Trust Bank',
        category: 'Apartment', assetType: '2 bedroom flat', region: 'Greater Accra', district: 'Accra Metropolitan',
        town: 'East Legon', publicLocation: 'East Legon, Accra', exactAddress: 'Flat 3B, Palm Court, East Legon',
        description: 'Modern 2-bedroom apartment in a gated complex with pool and gym access.',
        reserve: 420000, minOffer: 380000, showReserve: false,
        status: 'Submitted', publicationStatus: 'Unpublished', legalStatus: 'Pending',
        valuationAmount: 450000, valuationDate: d(10), valuationExpiry: future(355),
        landSearchValid: true, landSearchExpiry: future(180), injunctionActive: false, legalHold: false,
        exteriorImage: true, titleVerified: false,
        enforcementBasis: 'Memorandum of Agreement', caseRef: 'BNK-LN-88214',
        borrowerRef: 'Jane Smith (borrower)', loanAmount: 500000,
        images: 2, documents: 3,
        createdAt: d(5), updatedAt: d(1), createdBy: 'J. Mensah',
        legalSubstate: { enforcementRecorded: true, instrumentsVerified: false, injunctionClear: true, clearanceIssued: false },
        legalNotes: [],
        instruments: [
          { id: 'i1', type: 'Memorandum of Agreement', ref: 'MOA-2025-0044', status: 'Pending', uploadedBy: 'J. Mensah', uploadedAt: d(4) },
        ],
        activity: [
          { when: d(5), who: 'J. Mensah', what: 'Asset created as Draft' },
          { when: d(1), who: 'J. Mensah', what: 'Submitted for review' },
        ],
      },
      { id: 'a3', ref: 'SS-RE-2026-00243', bankId: 'bank1', bankName: 'Meridian Trust Bank',
        category: 'House', assetType: '3 bedroom semi-detached', region: 'Ashanti', district: 'Kumasi Metropolitan',
        town: 'Asokwa', publicLocation: 'Kumasi, Ashanti', exactAddress: 'House 22, Asokwa Extension, Kumasi',
        description: 'Well-maintained 3-bedroom semi-detached home with a spacious compound.',
        reserve: 680000, minOffer: 620000, showReserve: true,
        status: 'Legal Hold', publicationStatus: 'Suspended', legalStatus: 'On Hold',
        valuationAmount: 700000, valuationDate: d(20), valuationExpiry: future(345),
        landSearchValid: true, landSearchExpiry: future(180), injunctionActive: true, legalHold: true, legalHoldReason: 'Injunction filed by third party',
        exteriorImage: true, titleVerified: true,
        enforcementBasis: 'Court Judgment', caseRef: 'BNK-LN-88215',
        borrowerRef: 'Kofi Anane (borrower)', loanAmount: 750000,
        images: 3, documents: 6,
        createdAt: d(30), updatedAt: d(3), createdBy: 'K. Asante',
        legalSubstate: { enforcementRecorded: true, instrumentsVerified: true, injunctionClear: false, clearanceIssued: false },
        legalNotes: [],
        instruments: [
          { id: 'i1', type: 'Court Judgment', ref: 'JUD-2025-0155', status: 'Verified', uploadedBy: 'K. Asante', uploadedAt: d(28) },
        ],
        activity: [
          { when: d(30), who: 'K. Asante', what: 'Asset created as Draft' },
          { when: d(25), who: 'K. Asante', what: 'Submitted for review' },
          { when: d(20), who: 'S. Adjei', what: 'Legal verification completed' },
          { when: d(15), who: 'A. Boateng', what: 'Published to Marketplace' },
          { when: d(3), who: 'S. Adjei', what: 'Legal hold placed: Injunction filed by third party' },
        ],
      },
      { id: 'a4', ref: 'SS-RE-2026-00244', bankId: 'bank1', bankName: 'Meridian Trust Bank',
        category: 'Commercial', assetType: 'Retail shop', region: 'Greater Accra', district: 'Accra Metropolitan',
        town: 'Osu', publicLocation: 'Osu, Accra', exactAddress: 'Shop 7, Oxford Street, Osu',
        description: 'Prime retail space on Oxford Street with high foot traffic.',
        reserve: 1500000, minOffer: 1400000, showReserve: true,
        status: 'Approved', publicationStatus: 'Pending Approval', legalStatus: 'Cleared',
        valuationAmount: 1600000, valuationDate: d(15), valuationExpiry: future(350),
        landSearchValid: true, landSearchExpiry: future(180), injunctionActive: false, legalHold: false,
        exteriorImage: false, titleVerified: true,
        enforcementBasis: 'Settlement Agreement', caseRef: 'BNK-LN-88216',
        borrowerRef: 'Ama Serwaa (borrower)', loanAmount: 1800000,
        images: 1, documents: 4,
        createdAt: d(40), updatedAt: d(1), createdBy: 'K. Asante',
        legalSubstate: { enforcementRecorded: true, instrumentsVerified: true, injunctionClear: true, clearanceIssued: true },
        legalNotes: [],
        instruments: [
          { id: 'i1', type: 'Settlement Agreement', ref: 'STL-2025-0033', status: 'Verified', uploadedBy: 'K. Asante', uploadedAt: d(38) },
        ],
        activity: [
          { when: d(40), who: 'K. Asante', what: 'Asset created as Draft' },
          { when: d(35), who: 'K. Asante', what: 'Submitted for review' },
          { when: d(28), who: 'S. Adjei', what: 'Legal verification completed' },
          { when: d(1), who: 'A. Boateng', what: 'Approved — awaiting exterior image for publication' },
        ],
      },
      { id: 'a5', ref: 'SS-RE-2026-00245', bankId: 'bank1', bankName: 'Meridian Trust Bank',
        category: 'House', assetType: '5 bedroom detached', region: 'Central', district: 'Cape Coast Metropolitan',
        town: 'Pedu', publicLocation: 'Cape Coast, Central', exactAddress: 'House 8, Pedu Estate, Cape Coast',
        description: 'Luxurious 5-bedroom detached house with ocean view.',
        reserve: 2200000, minOffer: 2000000, showReserve: false,
        status: 'Draft', publicationStatus: 'Unpublished', legalStatus: 'Not Started',
        valuationAmount: 2400000, valuationDate: d(2), valuationExpiry: future(363),
        landSearchValid: false, landSearchExpiry: null, injunctionActive: false, legalHold: false,
        exteriorImage: false, titleVerified: false,
        enforcementBasis: '', caseRef: 'BNK-LN-88217',
        borrowerRef: '', loanAmount: 2500000,
        images: 0, documents: 1,
        createdAt: d(2), updatedAt: d(2), createdBy: 'J. Mensah',
        legalSubstate: { enforcementRecorded: false, instrumentsVerified: false, injunctionClear: true, clearanceIssued: false },
        legalNotes: [],
        instruments: [],
        activity: [{ when: d(2), who: 'J. Mensah', what: 'Asset created as Draft' }],
      },
    ];

    this.leads = [
      { id: 'l1', ref: 'SL-LEAD-2026-000101', assetId: 'a1', assetRef: 'SS-RE-2026-00241', name: 'Kwame Nkrumah', phone: '+233 24 555 0101', email: 'kwame.n@email.com', status: 'KYC Verified', source: 'Public Enquiry', assignedTo: 'A. Boateng', createdAt: d(10) },
      { id: 'l2', ref: 'SL-LEAD-2026-000102', assetId: 'a1', assetRef: 'SS-RE-2026-00241', name: 'Akosua Agyeman', phone: '+233 20 555 0102', email: 'akosua.a@email.com', status: 'Contacted', source: 'Public Enquiry', assignedTo: 'A. Boateng', createdAt: d(7) },
    ];

    this.offers = [
      { id: 'o1', ref: 'OFF-2026-000501', assetId: 'a1', assetRef: 'SS-RE-2026-00241', buyer: 'Kwame Nkrumah', amount: 950000, status: 'Under Review', belowReserve: false, date: d(5), validity: future(25), notes: 'Cash purchase, ready to complete in 30 days.' },
      { id: 'o2', ref: 'OFF-2026-000502', assetId: 'a1', assetRef: 'SS-RE-2026-00241', buyer: 'Akosua Agyeman', amount: 880000, status: 'Submitted', belowReserve: true, date: d(3), validity: future(27), notes: 'Mortgage pre-approved.' },
    ];

    this.invoices = [
      { id: 'inv1', ref: 'INV-2026-000201', bankId: 'bank1', bankName: 'Meridian Trust Bank', assetRef: 'SS-RE-2025-00189', description: 'Commission — 4% of GHS 950,000.00', amount: 38000, status: 'Paid', issuedAt: d(45), paidAt: d(30) },
      { id: 'inv2', ref: 'INV-2026-000202', bankId: 'bank1', bankName: 'Meridian Trust Bank', assetRef: 'SS-RE-2025-00192', description: 'Commission — 4% of GHS 720,000.00', amount: 28800, status: 'Issued', issuedAt: d(12), paidAt: null },
    ];

    this.auditLog = [
      { id: 'au1', when: d(38), who: 'A. Boateng', action: 'PUBLISH', entity: 'Asset', entityRef: 'SS-RE-2026-00241', oldValue: 'Approved', newValue: 'Live', detail: 'Listing published' },
      { id: 'au2', when: d(3), who: 'S. Adjei', action: 'LEGAL_HOLD', entity: 'Asset', entityRef: 'SS-RE-2026-00243', oldValue: 'Live', newValue: 'Legal Hold', detail: 'Injunction filed by third party' },
      { id: 'au3', when: d(1), who: 'A. Boateng', action: 'APPROVE', entity: 'Asset', entityRef: 'SS-RE-2026-00244', oldValue: 'Under Review', newValue: 'Approved', detail: 'Approved pending exterior image' },
    ];
  },

  getAsset(id) { return this.assets.find(a => a.id === id); },
  getAssetByRef(ref) { return this.assets.find(a => a.ref === ref); },
  getPublicAssets() { return this.assets.filter(a => a.publicationStatus === 'Published' && a.status === 'Live'); },
  getBankAssets() { return this.assets.filter(a => a.bankId === 'bank1'); },

  updateAsset(id, changes, actor, detail) {
    const asset = this.getAsset(id);
    if (!asset) return null;
    const oldStatus = asset.status;
    Object.assign(asset, changes);
    asset.updatedAt = new Date().toISOString();
    if (changes.status && changes.status !== oldStatus) {
      this.addAudit(actor, 'STATUS_CHANGE', 'Asset', asset.ref, oldStatus, changes.status, detail || '');
    } else {
      this.addAudit(actor, 'UPDATE', 'Asset', asset.ref, null, null, detail || 'Asset updated');
    }
    return asset;
  },

  addAudit(who, action, entity, entityRef, oldValue, newValue, detail) {
    this.auditLog.unshift({
      id: 'au' + Date.now() + Math.random().toString(36).slice(2, 6),
      when: new Date().toISOString(), who, action, entity, entityRef, oldValue, newValue, detail
    });
  },

  addActivity(assetId, who, what) {
    const asset = this.getAsset(assetId);
    if (asset) asset.activity.push({ when: new Date().toISOString(), who, what });
  },

  checkPublishReadiness(asset) {
    const checks = [
      {
        key: 'legal', label: 'Legal and enforcement verified', pass: asset.legalStatus === 'Cleared',
        fixRole: 'legal-officer',
        diagnostics: [
          { label: 'Enforcement basis recorded', pass: !!asset.enforcementBasis, fixWho: 'Bank uploads instrument' },
          { label: 'Legal instruments verified by Surge', pass: !!asset.legalSubstate?.instrumentsVerified, fixWho: 'Surge Legal Verification Officer' },
          { label: 'No active injunction', pass: !asset.injunctionActive, fixWho: 'Surge Legal Officer' },
          { label: 'Legal clearance issued', pass: !!asset.legalSubstate?.clearanceIssued, fixWho: 'Surge Legal Verification Officer' },
        ],
      },
      {
        key: 'title', label: 'Title information verified', pass: !!asset.titleVerified,
        fixRole: 'title-officer',
        diagnostics: [
          { label: 'Title details captured', pass: !!asset.titleDetails, fixWho: 'Bank provides title information' },
          { label: 'Title verified by Surge', pass: !!asset.titleVerified, fixWho: 'Surge Property Manager' },
        ],
      },
      {
        key: 'valuation', label: 'Current valuation on file', pass: !!asset.valuationAmount && new Date(asset.valuationExpiry) > new Date(),
        fixRole: 'valuation-officer',
        diagnostics: [
          { label: 'Valuation amount recorded', pass: !!asset.valuationAmount, fixWho: 'Bank uploads valuation report' },
          { label: 'Valuation not expired', pass: new Date(asset.valuationExpiry) > new Date(), fixWho: 'Bank re-upload new valuation' },
        ],
      },
      {
        key: 'landSearch', label: 'Valid land search', pass: !!asset.landSearchValid,
        fixRole: 'title-officer',
        diagnostics: [
          { label: 'Land search completed', pass: !!asset.landSearchValid, fixWho: 'Surge Property Manager' },
        ],
      },
      {
        key: 'exterior', label: 'At least one exterior image', pass: !!asset.exteriorImage,
        fixRole: 'bank',
        diagnostics: [
          { label: 'Exterior photo uploaded', pass: !!asset.exteriorImage, fixWho: 'Bank uploads exterior photo' },
        ],
      },
      {
        key: 'injunction', label: 'No active injunction', pass: !asset.injunctionActive,
        fixRole: 'legal-officer',
        diagnostics: [
          { label: 'Injunction cleared', pass: !asset.injunctionActive, fixWho: 'Surge Legal Officer' },
        ],
      },
      {
        key: 'hold', label: 'No active legal hold', pass: !asset.legalHold,
        fixRole: 'legal-officer',
        diagnostics: [
          { label: 'Legal hold not active', pass: !asset.legalHold, fixWho: 'Surge Legal Officer releases hold' },
        ],
      },
      {
        key: 'description', label: 'Public description complete', pass: !!asset.description && asset.description.length > 20,
        fixRole: 'bank',
        diagnostics: [
          { label: 'Description ≥ 20 characters', pass: !!asset.description && asset.description.length > 20, fixWho: 'Bank edits description' },
        ],
      },
      {
        key: 'price', label: 'Sale terms confirmed', pass: asset.reserve > 0,
        fixRole: 'bank',
        diagnostics: [
          { label: 'Reserve price set', pass: asset.reserve > 0, fixWho: 'Bank enters reserve price' },
        ],
      },
    ];
    const allPass = checks.every(c => c.pass && (!c.diagnostics || c.diagnostics.every(d => d.pass)));
    return { checks, allPass };
  },
};

// ============================================================
// UI UTILITIES
// ============================================================
const UI = {
  toast(msg, type = 'success', duration = 3500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'surge-toast show ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration);
  },
  modal(title, bodyHtml, footerHtml, wide) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml || '<button class="btn" onclick="UI.closeModal()">Close</button>';
    document.getElementById('modal-window').className = 'surge-modal-window' + (wide ? ' wide' : '');
    document.getElementById('modal-backdrop').classList.add('open');
  },
  closeModal() { document.getElementById('modal-backdrop').classList.remove('open'); },
  fmtMoney(n) { return 'GHS ' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
  fmtDate(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); },
  fmtDateShort(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }); },
  badge(status) {
    const map = {
      'Live': 'live', 'Published': 'live', 'Verified': 'ok', 'Cleared': 'ok',
      'Draft': 'draft', 'Submitted': 'pending', 'Under Review': 'pending', 'Pending Approval': 'pending',
      'Legal Hold': 'hold', 'Suspended': 'hold', 'Rejected': 'rejected', 'Withdrawn': 'rejected',
      'Approved': 'info', 'Changes Required': 'warn', 'Sold': 'sale', 'Completed': 'sale', 'Sale': 'sale',
      'KYC Verified': 'ok', 'Contacted': 'info', 'New': 'draft', 'Unpublished': 'draft',
      'Paid': 'ok', 'Issued': 'pending', 'Overdue': 'alert', 'Pending': 'pending',
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
  },
  readinessIcon(pass) {
    return pass
      ? '<span class="check pass"><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg></span>'
      : '<span class="check fail"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></span>';
  },
  clock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const tick = () => { el.textContent = 'Africa/Accra · ' + new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); };
    tick(); setInterval(tick, 1000);
  },
};

// ============================================================
// BANK PORTAL
// ============================================================
const BankPortal = {
  currentView: 'assets', selectedAssetId: null, detailTab: 'overview',
  subPage: null,

  init() {
    document.querySelectorAll('#bank-nav .navitem').forEach(el => {
      el.addEventListener('click', () => this.nav(el.dataset.view));
    });
    this.render();
  },

  nav(view) {
    document.querySelectorAll('#bank-nav .navitem').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    this.currentView = view;
    this.selectedAssetId = null;
    this.detailTab = 'overview';
    this.subPage = null;
    this.render();
  },

  render() {
    this.renderDoctabs();
    const el = document.getElementById('bank-work');
    if (this.subPage) { el.innerHTML = this.renderSubPage(); return; }
    switch (this.currentView) {
      case 'dashboard': el.innerHTML = this.renderDashboard(); break;
      case 'assets': el.innerHTML = this.selectedAssetId ? this.renderAssetDetail(this.selectedAssetId) : this.renderAssetList(); break;
      case 'legal': el.innerHTML = this.renderLegalView(); break;
      case 'documents': el.innerHTML = this.renderDocumentsView(); break;
      case 'offers': el.innerHTML = this.renderOffersView(); break;
      case 'reports': el.innerHTML = this.renderReportsView(); break;
      case 'notifications': el.innerHTML = this.renderNotificationsView(); break;
      default: el.innerHTML = this.renderAssetList();
    }
  },

  renderDoctabs() {
    const el = document.getElementById('bank-doctabs');
    if (this.selectedAssetId) {
      const a = Store.getAsset(this.selectedAssetId);
      el.innerHTML = `
        <div class="dtab" onclick="BankPortal.nav('assets')">Assets</div>
        <div class="dtab active">${a.ref}${this.subPage ? ' — ' + this.getSubPageTitle() : ''}<span class="x" onclick="event.stopPropagation();BankPortal.closeAsset()">×</span></div>
      `;
    } else {
      el.innerHTML = `<div class="dtab active">Assets</div>`;
    }
  },

  getSubPageTitle() {
    return { 'edit-basics': 'Edit Basics', 'edit-legal': 'Edit Legal', 'edit-docs': 'Manage Documents',
      'edit-media': 'Manage Media', 'edit-title': 'Edit Title', 'edit-valuation': 'Edit Valuation' }[this.subPage] || '';
  },

  renderDashboard() {
    const assets = Store.getBankAssets();
    const live = assets.filter(a => a.status === 'Live').length;
    const pending = assets.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length;
    const holds = assets.filter(a => a.legalHold).length;
    const activeOffers = Store.offers.filter(o => ['Submitted', 'Under Review'].includes(o.status)).length;
    return `
      <div class="page-head">
        <h1>Dashboard</h1>
        <span class="crumb">Meridian Trust Bank · ${assets.length} assets</span>
        <span class="spacer"></span>
        <span class="badge info">Tenant: Meridian Trust Bank</span>
      </div>
      <div class="kpis">
        <div class="kpi" onclick="BankPortal.nav('assets')"><div class="k">Total Assets</div><div class="v">${assets.length}</div><div class="d">All bank-owned records</div></div>
        <div class="kpi ok" onclick="BankPortal.nav('assets')"><div class="k">Live Listings</div><div class="v">${live}</div><div class="d">Published to Marketplace</div></div>
        <div class="kpi warn" onclick="BankPortal.nav('assets')"><div class="k">Pending Review</div><div class="v">${pending}</div><div class="d">Awaiting Surge review</div></div>
        <div class="kpi alert" onclick="BankPortal.nav('legal')"><div class="k">Legal Holds</div><div class="v">${holds}</div><div class="d">Blocked from publication</div></div>
        <div class="kpi" onclick="BankPortal.nav('offers')"><div class="k">Active Offers</div><div class="v">${activeOffers}</div><div class="d">Awaiting decision</div></div>
      </div>
      <div class="gridwrap">
        <div class="gridtoolbar"><strong style="font-size:12.5px">Recent Activity</strong></div>
        <div style="padding:10px 14px">
          <ul class="timeline">
            ${Store.auditLog.filter(a => assets.some(x => x.ref === a.entityRef)).slice(0, 6).map(a => `
              <li><span class="dot ${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span>
                <div class="tl-when">${UI.fmtDate(a.when)}</div>
                <div class="tl-what">${a.detail || a.action}</div>
                <div class="tl-who">${a.who}</div>
              </li>
            `).join('') || '<li style="color:var(--text-2)">No recent activity</li>'}
          </ul>
        </div>
      </div>
    `;
  },

  renderAssetList() {
    const assets = Store.getBankAssets();
    return `
      <div class="page-head">
        <h1>My Assets</h1>
        <span class="crumb">Meridian Trust Bank · ${assets.length} records</span>
        <span class="spacer"></span>
        <button class="btn primary" onclick="BankPortal.newAsset()"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New Asset</button>
      </div>
      <div class="gridwrap">
        <div class="gridtoolbar">
          <div class="searchbox">
            <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input placeholder="Search by reference, location..." oninput="BankPortal.filterAssets(this.value)">
          </div>
          <span class="help">Click a row to open the asset record</span>
        </div>
        <table class="grid">
          <thead><tr>
            <th>Reference</th><th>Category</th><th>Location</th><th class="num">Reserve (GHS)</th><th>Status</th><th>Publication</th><th>Updated</th>
          </tr></thead>
          <tbody>
            ${assets.map(a => `
              <tr onclick="BankPortal.openAsset('${a.id}')">
                <td class="ref">${a.ref}</td>
                <td>${a.category}<span class="sub">${a.assetType}</span></td>
                <td>${a.publicLocation}</td>
                <td class="num">${a.showReserve ? UI.fmtMoney(a.reserve) : 'POA'}</td>
                <td>${UI.badge(a.status)}${a.legalHold ? ' <span class="badge hold">HOLD</span>' : ''}</td>
                <td>${UI.badge(a.publicationStatus)}</td>
                <td>${UI.fmtDateShort(a.updatedAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  filterAssets(q) {
    document.querySelectorAll('#bank-work table.grid tbody tr').forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
    });
  },

  openAsset(id) { this.selectedAssetId = id; this.currentView = 'assets'; this.detailTab = 'overview'; this.subPage = null; this.render(); },
  closeAsset() { this.selectedAssetId = null; this.subPage = null; this.render(); },
  setTab(t) { this.detailTab = t; this.render(); },

  openSubPage(name) { this.subPage = name; this.render(); },
  closeSubPage() { this.subPage = null; this.render(); },

  renderAssetDetail(id) {
    const a = Store.getAsset(id);
    if (!a) return '<div class="empty-state"><p>Asset not found.</p></div>';
    const readiness = Store.checkPublishReadiness(a);
    const canEdit = ['Draft', 'Changes Required', 'Submitted'].includes(a.status);
    const tab = this.detailTab;

    let tabContent = '';
    if (tab === 'overview') tabContent = this.renderOverviewTab(a);
    else if (tab === 'readiness') tabContent = this.renderReadinessTab(a, readiness);
    else if (tab === 'activity') tabContent = this.renderActivityTab(a);
    else if (tab === 'legal') tabContent = this.renderLegalTab(a);
    else if (tab === 'documents') tabContent = this.renderDocumentsTab(a);
    else if (tab === 'media') tabContent = this.renderMediaTab(a);

    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeAsset()">← Back to Assets</button>
        <h1>${a.ref}</h1>
        ${UI.badge(a.status)} ${UI.badge(a.publicationStatus)}
        <span class="spacer"></span>
        <span class="crumb">Created ${UI.fmtDateShort(a.createdAt)} by ${a.createdBy}</span>
      </div>

      ${a.legalHold ? `<div class="banner red"><svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 018 0v3"/></svg><div><b>LEGAL HOLD ACTIVE.</b> Reason: ${a.legalHoldReason || 'See audit log'}. Contact Surge legal.</div></div>` : ''}

      <div class="detailhead">
        <span class="ref">${a.ref}</span>
        <span class="title">${a.category} — ${a.assetType}</span>
        <span class="spacer"></span>
        <span class="badge info">${a.region}</span>
      </div>
      <div class="detailbody">
        <div class="tabs-inner">
          <div class="tab-inner ${tab === 'overview' ? 'active' : ''}" onclick="BankPortal.setTab('overview')">Overview</div>
          <div class="tab-inner ${tab === 'readiness' ? 'active' : ''}" onclick="BankPortal.setTab('readiness')">Readiness <span class="pill ${readiness.allPass ? 'ok' : 'alert'}">${readiness.checks.filter(c => c.pass).length}/${readiness.checks.length}</span></div>
          <div class="tab-inner ${tab === 'legal' ? 'active' : ''}" onclick="BankPortal.setTab('legal')">Legal</div>
          <div class="tab-inner ${tab === 'documents' ? 'active' : ''}" onclick="BankPortal.setTab('documents')">Documents</div>
          <div class="tab-inner ${tab === 'media' ? 'active' : ''}" onclick="BankPortal.setTab('media')">Media</div>
          <div class="tab-inner ${tab === 'activity' ? 'active' : ''}" onclick="BankPortal.setTab('activity')">Activity <span class="pill">${a.activity.length}</span></div>
        </div>
        ${tabContent}
        <div class="form-actions" style="margin-top:14px;padding-top:14px;border-top:1px solid #E0E0E0">
          ${canEdit ? `<button class="btn primary" onclick="BankPortal.submitForReview()">Submit for Review</button>` : ''}
          ${a.status === 'Changes Required' ? `<button class="btn primary" onclick="BankPortal.resubmitAsset()">Resubmit</button>` : ''}
          <button class="btn" onclick="BankPortal.closeAsset()">Close</button>
        </div>
      </div>
    `;
  },

  renderOverviewTab(a) {
    return `
      <div class="grid2">
        <div class="group">
          <div class="caption">Identification <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-basics')">Edit</button></div>
          <div class="body">
            <div class="field"><span class="lbl">Public Reference</span><div class="ctl"><input value="${a.ref}" readonly></div></div>
            <div class="field"><span class="lbl">Category</span><div class="ctl"><input value="${a.category}" readonly></div></div>
            <div class="field"><span class="lbl">Asset Type</span><div class="ctl"><input value="${a.assetType}" readonly></div></div>
            <div class="field"><span class="lbl">Internal Bank Ref <span class="restricted-tag">Restricted</span></span><div class="ctl"><input value="${a.caseRef}" readonly></div></div>
          </div>
        </div>
        <div class="group">
          <div class="caption">Location</div>
          <div class="body">
            <div class="field"><span class="lbl">Region</span><div class="ctl"><input value="${a.region}" readonly></div></div>
            <div class="field"><span class="lbl">District</span><div class="ctl"><input value="${a.district}" readonly></div></div>
            <div class="field"><span class="lbl">Public Location</span><div class="ctl"><input value="${a.publicLocation}" readonly></div></div>
            <div class="field"><span class="lbl">Exact Address <span class="restricted-tag">Restricted</span></span><div class="ctl"><input value="${a.exactAddress}" readonly></div></div>
          </div>
        </div>
      </div>
      <div class="grid2">
        <div class="group">
          <div class="caption">Pricing <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-basics')">Edit</button></div>
          <div class="body">
            <div class="field"><span class="lbl">Reserve Price (GHS)</span><div class="ctl"><input class="money" value="${Number(a.reserve).toLocaleString('en-GH', { minimumFractionDigits: 2 })}" readonly></div></div>
            <div class="field"><span class="lbl">Minimum Offer (GHS)</span><div class="ctl"><input class="money" value="${Number(a.minOffer).toLocaleString('en-GH', { minimumFractionDigits: 2 })}" readonly></div></div>
            <div class="field"><span class="lbl">Show Reserve Publicly</span><div class="ctl"><input value="${a.showReserve ? 'Yes' : 'No — Price on Application'}" readonly></div></div>
          </div>
        </div>
        <div class="group">
          <div class="caption">Valuation <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-valuation')">Edit</button></div>
          <div class="body">
            <div class="field"><span class="lbl">Valuation Amount</span><div class="ctl"><input class="money" value="${a.valuationAmount ? UI.fmtMoney(a.valuationAmount) : 'Not recorded'}" readonly></div></div>
            <div class="field"><span class="lbl">Valuation Date</span><div class="ctl"><input value="${a.valuationDate ? UI.fmtDateShort(a.valuationDate) : '—'}" readonly></div></div>
            <div class="field"><span class="lbl">Expiry Status</span><div class="ctl"><input value="${a.valuationExpiry && new Date(a.valuationExpiry) > new Date() ? 'Valid' : 'REVIEW REQUIRED'}" readonly style="color:${a.valuationExpiry && new Date(a.valuationExpiry) > new Date() ? 'var(--success)' : 'var(--danger)'};font-weight:600"></div></div>
          </div>
        </div>
      </div>
    `;
  },

  renderReadinessTab(a, readiness) {
    return `
      <div class="banner info">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg>
        <div>Each gate must pass before publishing. Where a fix is your responsibility, a button will take you to the correction page. Where it is a Surge responsibility, you can request action.</div>
      </div>
      <div class="group">
        <div class="caption">Publication Readiness Checklist</div>
        <div class="body">
          ${readiness.checks.map(c => this.renderGateItem(c, a)).join('')}
        </div>
      </div>
    `;
  },

  renderGateItem(c, a) {
    const isBankFix = ['exterior', 'description', 'price', 'valuation'].includes(c.key);
    const isSurgeFix = ['legal', 'title', 'landSearch', 'injunction', 'hold'].includes(c.key);
    const fixButton = this.getFixButton(c, a, isBankFix, isSurgeFix);

    return `
      <div class="gate-item">
        <div class="gate-header">
          ${UI.readinessIcon(c.pass)}
          <span class="item-label" style="font-weight:600;flex:1">${c.label}</span>
          <span class="item-status" style="color:${c.pass ? 'var(--success)' : 'var(--danger)'}">${c.pass ? 'PASS' : 'FAIL'}</span>
        </div>
        ${!c.pass && c.diagnostics ? `
          <div class="gate-sub">
            <div style="font-size:11.5px;color:var(--text-2);margin-bottom:4px;font-weight:600">What's blocking this gate:</div>
            ${c.diagnostics.map(d => `
              <div class="gate-sub-row">
                ${UI.readinessIcon(d.pass)}
                <span style="flex:1;color:${d.pass ? 'var(--text)' : 'var(--danger)'}">${d.label}</span>
                ${!d.pass ? `<span style="font-size:11px;color:var(--text-2);font-style:italic">${d.fixWho}</span>` : ''}
              </div>
            `).join('')}
          </div>
          ${fixButton ? `<div class="gate-action">${fixButton}</div>` : ''}
        ` : ''}
      </div>
    `;
  },

  getFixButton(c, a, isBankFix, isSurgeFix) {
    if (c.key === 'exterior') return `<button class="btn small primary" onclick="BankPortal.openSubPage('edit-media')">Upload Exterior Photo</button>`;
    if (c.key === 'description') return `<button class="btn small primary" onclick="BankPortal.openSubPage('edit-basics')">Edit Description</button>`;
    if (c.key === 'price') return `<button class="btn small primary" onclick="BankPortal.openSubPage('edit-basics')">Set Reserve Price</button>`;
    if (c.key === 'valuation') return `<button class="btn small primary" onclick="BankPortal.openSubPage('edit-valuation')">Update Valuation</button>`;
    if (c.key === 'title') return `
      <button class="btn small primary" onclick="BankPortal.openSubPage('edit-title')">Provide Title Info</button>
      <button class="btn small" onclick="BankPortal.requestVerification('${a.id}','Title')">Request Surge Verification</button>
    `;
    if (c.key === 'landSearch') return `<button class="btn small" onclick="BankPortal.requestVerification('${a.id}','Land Search')">Request Land Search</button>`;
    if (c.key === 'legal' || c.key === 'injunction' || c.key === 'hold') return `<button class="btn small" onclick="BankPortal.openSubPage('edit-legal')">Upload Legal Documents</button> <button class="btn small" onclick="BankPortal.requestVerification('${a.id}','Legal')">Request Legal Review</button>`;
    return '';
  },

  renderActivityTab(a) {
    return `
      <div class="group"><div class="caption">Activity Timeline</div><div class="body">
        <ul class="timeline">
          ${a.activity.slice().reverse().map(act => `
            <li><span class="dot ${act.what.includes('Legal hold') ? 'red' : act.what.includes('Published') ? 'green' : ''}"></span>
              <div class="tl-when">${UI.fmtDate(act.when)}</div>
              <div class="tl-what">${act.what}</div>
              <div class="tl-who">${act.who}</div>
            </li>
          `).join('')}
        </ul>
      </div></div>
    `;
  },

  renderLegalTab(a) {
    return `
      <div class="group">
        <div class="caption">Enforcement &amp; Legal <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-legal')">Upload Legal Documents</button></div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Enforcement Basis</span><span class="kv-v">${a.enforcementBasis || '<span style="color:var(--danger)">Not set</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Case Reference</span><span class="kv-v">${a.caseRef}</span></div>
          <div class="kv-row"><span class="kv-k">Legal Status</span><span class="kv-v">${UI.badge(a.legalStatus)}</span></div>
          <div class="kv-row"><span class="kv-k">Injunction</span><span class="kv-v">${a.injunctionActive ? UI.badge('Active') : '<span class="badge ok">None</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Legal Hold</span><span class="kv-v">${a.legalHold ? `<span class="badge hold">Active — ${a.legalHoldReason}</span>` : '<span class="badge ok">None</span>'}</span></div>
        </div>
      </div>
      <div class="group">
        <div class="caption">Uploaded Instruments <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-legal')">+ Add Instrument</button></div>
        <div class="body">
          ${(a.instruments || []).map(i => `
            <div class="instrument-row">
              <span class="inst-type">${i.type}</span>
              <span class="inst-ref">${i.ref}</span>
              <span class="inst-status">${UI.badge(i.status)}</span>
              <span style="font-size:11px;color:var(--text-2)">Uploaded ${UI.fmtDateShort(i.uploadedAt)}</span>
            </div>
          `).join('') || '<p style="color:var(--text-2);margin:0">No instruments uploaded yet. Click "+ Add Instrument" to upload.</p>'}
        </div>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Legal verification is performed by Surge. You can upload instruments and request review. Only Surge Legal can issue clearance.</div></div>
    `;
  },

  renderDocumentsTab(a) {
    return `
      <div class="group">
        <div class="caption">Title &amp; Supporting Documents <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-docs')">+ Upload Document</button></div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Total Documents</span><span class="kv-v">${a.documents} files</span></div>
          <div class="kv-row"><span class="kv-k">Title Verified</span><span class="kv-v">${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</span></div>
          <div class="kv-row"><span class="kv-k">Land Search</span><span class="kv-v">${a.landSearchValid ? UI.badge('Valid') : UI.badge('Pending')}</span></div>
        </div>
      </div>
    `;
  },

  renderMediaTab(a) {
    return `
      <div class="group">
        <div class="caption">Media <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-media')">+ Upload Photo</button></div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Total Photos</span><span class="kv-v">${a.images}</span></div>
          <div class="kv-row"><span class="kv-k">Exterior Photo</span><span class="kv-v">${a.exteriorImage ? UI.badge('Uploaded') : '<span class="badge alert">Missing — required to publish</span>'}</span></div>
          ${!a.exteriorImage ? `<div class="banner amber" style="margin-top:12px;margin-bottom:0"><svg class="ico" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/></svg><div><b>Exterior photo required.</b> At least one exterior photo is mandatory for publication (AS-4).</div></div>` : ''}
        </div>
      </div>
    `;
  },

  // ============================================================
  // SUB-PAGES (correction pages)
  // ============================================================
  renderSubPage() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return '<div class="empty-state"><p>No asset selected.</p></div>';
    switch (this.subPage) {
      case 'edit-basics': return this.renderEditBasics(a);
      case 'edit-legal': return this.renderEditLegal(a);
      case 'edit-docs': return this.renderEditDocs(a);
      case 'edit-media': return this.renderEditMedia(a);
      case 'edit-title': return this.renderEditTitle(a);
      case 'edit-valuation': return this.renderEditValuation(a);
      default: return this.renderAssetDetail(a.id);
    }
  },

  renderEditBasics(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Edit Asset Basics</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Changes are saved immediately and recorded in the audit log. Required fields must be filled before submission.</div></div>
      <div class="group">
        <div class="caption">Identification</div>
        <div class="body">
          <div class="field"><span class="lbl">Category <span class="req">*</span></span><div class="ctl">
            <select id="edit-category">
              <option ${a.category === 'House' ? 'selected' : ''}>House</option>
              <option ${a.category === 'Apartment' ? 'selected' : ''}>Apartment</option>
              <option ${a.category === 'Commercial' ? 'selected' : ''}>Commercial</option>
              <option ${a.category === 'Land' ? 'selected' : ''}>Land</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Asset Type <span class="req">*</span></span><div class="ctl"><input id="edit-assetType" value="${a.assetType || ''}" placeholder="e.g. 4 bedroom detached"></div></div>
          <div class="field"><span class="lbl">Description <span class="req">*</span></span><div class="ctl">
            <textarea id="edit-description" placeholder="Describe the property (min 20 characters)">${a.description || ''}</textarea>
            <span class="help">Minimum 20 characters. This appears publicly.</span>
          </div></div>
        </div>
      </div>
      <div class="group">
        <div class="caption">Location</div>
        <div class="body">
          <div class="field"><span class="lbl">Region <span class="req">*</span></span><div class="ctl">
            <select id="edit-region">
              ${['Greater Accra','Ashanti','Central','Western','Eastern','Northern','Volta'].map(r => `<option ${a.region === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div></div>
          <div class="field"><span class="lbl">District</span><div class="ctl"><input id="edit-district" value="${a.district || ''}"></div></div>
          <div class="field"><span class="lbl">Public Location <span class="req">*</span></span><div class="ctl"><input id="edit-publicLocation" value="${a.publicLocation || ''}" placeholder="e.g. Tema, Greater Accra"></div></div>
          <div class="field"><span class="lbl">Exact Address <span class="restricted-tag">Restricted</span></span><div class="ctl"><input id="edit-exactAddress" value="${a.exactAddress || ''}"></div></div>
        </div>
      </div>
      <div class="group">
        <div class="caption">Pricing</div>
        <div class="body">
          <div class="field"><span class="lbl">Reserve Price (GHS) <span class="req">*</span></span><div class="ctl">
            <input id="edit-reserve" class="money" type="number" value="${a.reserve}" min="0">
            <span class="help">Must be greater than 0 to publish.</span>
          </div></div>
          <div class="field"><span class="lbl">Minimum Offer (GHS)</span><div class="ctl"><input id="edit-minOffer" class="money" type="number" value="${a.minOffer}" min="0"></div></div>
          <div class="field"><span class="lbl">Show Reserve Publicly</span><div class="ctl">
            <select id="edit-showReserve">
              <option value="true" ${a.showReserve ? 'selected' : ''}>Yes — show reserve</option>
              <option value="false" ${!a.showReserve ? 'selected' : ''}>No — Price on Application</option>
            </select>
          </div></div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Cancel</button>
        <button class="btn primary" onclick="BankPortal.saveBasics()">Save Changes</button>
      </div>
    `;
  },

  saveBasics() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const category = document.getElementById('edit-category').value;
    const assetType = document.getElementById('edit-assetType').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const region = document.getElementById('edit-region').value;
    const district = document.getElementById('edit-district').value.trim();
    const publicLocation = document.getElementById('edit-publicLocation').value.trim();
    const exactAddress = document.getElementById('edit-exactAddress').value.trim();
    const reserve = Number(document.getElementById('edit-reserve').value);
    const minOffer = Number(document.getElementById('edit-minOffer').value);
    const showReserve = document.getElementById('edit-showReserve').value === 'true';

    // Validation
    const errors = [];
    if (!assetType) errors.push('Asset Type is required');
    if (description.length < 20) errors.push('Description must be at least 20 characters');
    if (!publicLocation) errors.push('Public Location is required');
    if (reserve <= 0) errors.push('Reserve Price must be greater than 0');
    if (minOffer > reserve && minOffer > 0) errors.push('Minimum Offer cannot exceed Reserve Price');

    if (errors.length) {
      UI.toast('Validation error: ' + errors[0], 'error');
      return;
    }

    Store.updateAsset(this.selectedAssetId, {
      category, assetType, description, region, district, publicLocation, exactAddress,
      reserve, minOffer, showReserve
    }, 'J. Mensah', 'Updated asset basics, description and pricing');

    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Updated basic details and pricing');
    UI.toast('Changes saved successfully. Readiness re-checked.', 'success');
    this.closeSubPage();
  },

  renderEditLegal(a) {
    const instruments = a.instruments || [];
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Legal &amp; Enforcement Documents</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Upload the enforcement instrument that supports this asset. This might be a Court Judgment, Default Notice, Memorandum of Agreement, or Settlement Agreement. Surge Legal will verify each instrument.</div></div>
      <div class="group">
        <div class="caption">Enforcement Basis</div>
        <div class="body">
          <div class="field"><span class="lbl">Basis Type <span class="req">*</span></span><div class="ctl">
            <select id="edit-enforcementBasis">
              <option value="">— Select —</option>
              <option ${a.enforcementBasis === 'Court Judgment' ? 'selected' : ''}>Court Judgment</option>
              <option ${a.enforcementBasis === 'Memorandum of Agreement' ? 'selected' : ''}>Memorandum of Agreement</option>
              <option ${a.enforcementBasis === 'Settlement Agreement' ? 'selected' : ''}>Settlement Agreement</option>
              <option ${a.enforcementBasis === 'Default Notice' ? 'selected' : ''}>Default Notice</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Case Reference</span><div class="ctl"><input id="edit-caseRef" value="${a.caseRef || ''}"></div></div>
        </div>
      </div>
      <div class="group">
        <div class="caption">Existing Instruments</div>
        <div class="body">
          ${instruments.length ? instruments.map(i => `
            <div class="instrument-row">
              <span class="inst-type">${i.type}</span>
              <span class="inst-ref">${i.ref}</span>
              <span class="inst-status">${UI.badge(i.status)}</span>
              <span style="font-size:11px;color:var(--text-2)">${i.uploadedBy} · ${UI.fmtDateShort(i.uploadedAt)}</span>
            </div>
          `).join('') : '<p style="color:var(--text-2);margin:0">No instruments uploaded yet.</p>'}
        </div>
      </div>
      <div class="group">
        <div class="caption">Upload New Instrument</div>
        <div class="body">
          <div class="field"><span class="lbl">Instrument Type <span class="req">*</span></span><div class="ctl">
            <select id="new-inst-type">
              <option>Court Judgment</option>
              <option>Default Notice</option>
              <option>Memorandum of Agreement</option>
              <option>Settlement Agreement</option>
              <option>Affidavit of Service</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Reference Number <span class="req">*</span></span><div class="ctl"><input id="new-inst-ref" placeholder="e.g. JUD-2025-0201"></div></div>
          <div class="upload-zone" style="margin-top:12px" onclick="UI.toast('File picker opened. In real app, this uploads to R2.','success')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div>Click to attach the instrument file (PDF)</div>
            <div style="font-size:11px;margin-top:4px">This uploads to private R2 storage</div>
          </div>
          <button class="btn primary" style="margin-top:12px" onclick="BankPortal.addInstrument()">+ Add Instrument to Record</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Cancel</button>
        <button class="btn primary" onclick="BankPortal.saveLegal()">Save &amp; Request Legal Review</button>
      </div>
    `;
  },

  addInstrument() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('new-inst-type').value;
    const ref = document.getElementById('new-inst-ref').value.trim();
    if (!ref) return UI.toast('Instrument reference number is required', 'error');
    a.instruments = a.instruments || [];
    a.instruments.push({
      id: 'i' + Date.now(), type, ref, status: 'Pending',
      uploadedBy: 'J. Mensah', uploadedAt: new Date().toISOString()
    });
    a.documents = (a.documents || 0) + 1;
    Store.addAudit('J. Mensah', 'UPLOAD_INSTRUMENT', 'Asset', a.ref, null, null, 'Uploaded ' + type + ' ' + ref);
    UI.toast('Instrument added to record. Click "Save & Request Legal Review" to notify Surge.', 'success');
    this.render();
  },

  saveLegal() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const enforcementBasis = document.getElementById('edit-enforcementBasis').value;
    const caseRef = document.getElementById('edit-caseRef').value.trim();
    if (!enforcementBasis) return UI.toast('Enforcement Basis is required', 'error');
    if (!a.instruments || a.instruments.length === 0) return UI.toast('Upload at least one instrument before requesting legal review', 'error');

    a.legalSubstate = a.legalSubstate || {};
    a.legalSubstate.enforcementRecorded = true;
    Store.updateAsset(this.selectedAssetId, { enforcementBasis, caseRef, legalStatus: 'Pending' }, 'J. Mensah', 'Enforcement basis and instruments submitted for legal review');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Submitted enforcement documents — awaiting Surge legal verification');
    UI.toast('Legal documents submitted. Surge Legal will review within 2 business days.', 'success');
    this.closeSubPage();
  },

  renderEditDocs(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Manage Title &amp; Documents</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="group">
        <div class="caption">Upload Document</div>
        <div class="body">
          <div class="field"><span class="lbl">Document Type <span class="req">*</span></span><div class="ctl">
            <select id="doc-type">
              <option>Title Deed</option>
              <option>Land Certificate</option>
              <option>Land Search Report</option>
              <option>Valuation Report</option>
              <option>Site Plan</option>
              <option>Other</option>
            </select>
          </div></div>
          <div class="upload-zone" onclick="UI.toast('File picker opened','success')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div>Click to upload (PDF, DOCX, JPG · max 20MB)</div>
          </div>
          <button class="btn primary" style="margin-top:12px" onclick="BankPortal.addDocument()">+ Add Document</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Close</button>
      </div>
    `;
  },

  addDocument() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('doc-type').value;
    a.documents = (a.documents || 0) + 1;
    Store.addAudit('J. Mensah', 'UPLOAD_DOCUMENT', 'Asset', a.ref, null, null, 'Uploaded document: ' + type);
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Uploaded document: ' + type);
    UI.toast('Document uploaded successfully', 'success');
    this.render();
  },

  renderEditMedia(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Manage Media</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      ${!a.exteriorImage ? `<div class="banner amber"><svg class="ico" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/></svg><div><b>Exterior photo required for publication.</b> Upload at least one photo showing the exterior of the property.</div></div>` : ''}
      <div class="group">
        <div class="caption">Upload Photo</div>
        <div class="body">
          <div class="field"><span class="lbl">Photo Type <span class="req">*</span></span><div class="ctl">
            <select id="media-type">
              <option value="exterior">Exterior (required)</option>
              <option value="interior">Interior</option>
              <option value="aerial">Aerial</option>
              <option value="siteplan">Site Plan</option>
            </select>
          </div></div>
          <div class="upload-zone" onclick="UI.toast('File picker opened. Photo will be watermarked automatically.','success')">
            <svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <div>Click to upload photo (JPG, PNG · max 10MB)</div>
            <div style="font-size:11px;margin-top:4px">A watermarked derivative is generated automatically (AS-5)</div>
          </div>
          <button class="btn primary" style="margin-top:12px" onclick="BankPortal.uploadPhoto()">+ Upload Photo</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Close</button>
      </div>
    `;
  },

  uploadPhoto() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('media-type').value;
    a.images = (a.images || 0) + 1;
    if (type === 'exterior') a.exteriorImage = true;
    Store.addAudit('J. Mensah', 'UPLOAD_PHOTO', 'Asset', a.ref, null, null, 'Uploaded ' + type + ' photo');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Uploaded ' + type + ' photo');
    UI.toast('Photo uploaded. Watermark derivative generated.', 'success');
    this.render();
  },

  renderEditTitle(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Title Information</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Provide title particulars. Surge Property Manager will verify these against the uploaded title deed.</div></div>
      <div class="group">
        <div class="caption">Title Particulars</div>
        <div class="body">
          <div class="field"><span class="lbl">Title Number <span class="req">*</span></span><div class="ctl"><input id="title-number" value="${a.titleNumber || ''}" placeholder="e.g. TD-2024-01234"></div></div>
          <div class="field"><span class="lbl">Title Type</span><div class="ctl">
            <select id="title-type">
              <option ${a.titleType === 'Freehold' ? 'selected' : ''}>Freehold</option>
              <option ${a.titleType === 'Leasehold' ? 'selected' : ''}>Leasehold</option>
              <option ${a.titleType === 'Registered' ? 'selected' : ''}>Registered</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Registered Owner</span><div class="ctl"><input id="title-owner" value="${a.titleOwner || ''}" placeholder="Per title deed"></div></div>
          <div class="field"><span class="lbl">Perfection Status</span><div class="ctl">
            <select id="title-perfection">
              <option ${a.titlePerfection === 'Perfected' ? 'selected' : ''}>Perfected</option>
              <option ${a.titlePerfection === 'Unperfected' ? 'selected' : ''}>Unperfected</option>
              <option ${a.titlePerfection === 'In Progress' ? 'selected' : ''}>In Progress</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Title Document</span><div class="ctl">
            <div class="upload-zone" onclick="UI.toast('Title document picker opened','success')">
              <div>Click to upload Title Deed</div>
            </div>
          </div></div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Cancel</button>
        <button class="btn primary" onclick="BankPortal.saveTitle()">Save &amp; Request Verification</button>
      </div>
    `;
  },

  saveTitle() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const titleNumber = document.getElementById('title-number').value.trim();
    if (!titleNumber) return UI.toast('Title number is required', 'error');
    Store.updateAsset(this.selectedAssetId, {
      titleNumber,
      titleType: document.getElementById('title-type').value,
      titleOwner: document.getElementById('title-owner').value.trim(),
      titlePerfection: document.getElementById('title-perfection').value,
      titleDetails: true,
    }, 'J. Mensah', 'Title information submitted');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Title information submitted — awaiting Surge verification');
    UI.toast('Title information saved. Surge Property Manager will verify.', 'success');
    this.closeSubPage();
  },

  renderEditValuation(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Valuation Details</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="group">
        <div class="caption">Valuation Record</div>
        <div class="body">
          <div class="field"><span class="lbl">Valuation Amount (GHS) <span class="req">*</span></span><div class="ctl"><input id="val-amount" class="money" type="number" value="${a.valuationAmount || ''}" min="0"></div></div>
          <div class="field"><span class="lbl">Valuation Date <span class="req">*</span></span><div class="ctl"><input id="val-date" type="date" value="${a.valuationDate ? a.valuationDate.split('T')[0] : ''}"></div></div>
          <div class="field"><span class="lbl">Validity (days)</span><div class="ctl"><input id="val-validity" type="number" value="365" min="1"><span class="help">Standard: 365 days. Set per your policy.</span></div></div>
          <div class="field"><span class="lbl">Valuer Name</span><div class="ctl"><input id="val-valuer" value="${a.valuerName || ''}" placeholder="Licensed valuer firm"></div></div>
          <div class="upload-zone" style="margin-top:12px" onclick="UI.toast('Valuation report picker opened','success')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div>Click to attach Valuation Report (PDF)</div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Cancel</button>
        <button class="btn primary" onclick="BankPortal.saveValuation()">Save Valuation</button>
      </div>
    `;
  },

  saveValuation() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const amount = Number(document.getElementById('val-amount').value);
    const dateStr = document.getElementById('val-date').value;
    const validityDays = Number(document.getElementById('val-validity').value) || 365;
    const valuerName = document.getElementById('val-valuer').value.trim();
    if (!amount || amount <= 0) return UI.toast('Valuation amount is required', 'error');
    if (!dateStr) return UI.toast('Valuation date is required', 'error');
    const valDate = new Date(dateStr);
    const expiry = new Date(valDate);
    expiry.setDate(expiry.getDate() + validityDays);
    Store.updateAsset(this.selectedAssetId, {
      valuationAmount: amount,
      valuationDate: valDate.toISOString(),
      valuationExpiry: expiry.toISOString(),
      valuerName,
    }, 'J. Mensah', 'Valuation updated');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Valuation updated: ' + UI.fmtMoney(amount) + ' valid to ' + UI.fmtDateShort(expiry.toISOString()));
    UI.toast('Valuation saved successfully', 'success');
    this.closeSubPage();
  },

  requestVerification(assetId, kind) {
    const a = Store.getAsset(assetId);
    Store.addAudit('J. Mensah', 'REQUEST_VERIFICATION', 'Asset', a.ref, null, null, 'Requested ' + kind + ' verification from Surge');
    Store.addActivity(assetId, 'J. Mensah', 'Requested ' + kind + ' verification from Surge');
    UI.toast(kind + ' verification request sent to Surge. Expect response within 2 business days.', 'success');
    this.render();
  },

  renderLegalView() {
    const assets = Store.getBankAssets();
    return `
      <div class="page-head"><h1>Legal &amp; Enforcement</h1><span class="crumb">${assets.length} assets</span></div>
      <div class="gridwrap">
        <table class="grid">
          <thead><tr><th>Reference</th><th>Enforcement Basis</th><th>Instruments</th><th>Legal Status</th><th>Action</th></tr></thead>
          <tbody>
            ${assets.map(a => `
              <tr onclick="BankPortal.openAsset('${a.id}')">
                <td class="ref">${a.ref}</td>
                <td>${a.enforcementBasis || '<span style="color:var(--text-2)">Not set</span>'}</td>
                <td>${(a.instruments || []).length} uploaded</td>
                <td>${UI.badge(a.legalStatus)}</td>
                <td><button class="btn small" onclick="event.stopPropagation();BankPortal.openAsset('${a.id}');BankPortal.openSubPage('edit-legal')">Edit Legal</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDocumentsView() {
    const assets = Store.getBankAssets();
    return `<div class="page-head"><h1>Title &amp; Documents</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Asset</th><th>Docs</th><th>Title Verified</th><th>Land Search</th><th>Action</th></tr></thead><tbody>${assets.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.documents} files</td><td>${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</td><td>${a.landSearchValid ? UI.badge('Valid') : UI.badge('Pending')}</td><td><button class="btn small" onclick="BankPortal.openAsset('${a.id}');BankPortal.openSubPage('edit-docs')">Upload</button></td></tr>`).join('')}</tbody></table></div>`;
  },

  renderOffersView() {
    return `<div class="page-head"><h1>Offers &amp; Decisions</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Offer Ref</th><th>Asset</th><th>Buyer</th><th class="num">Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${Store.offers.map(o => `<tr><td class="ref">${o.ref}</td><td class="ref">${o.assetRef}</td><td>${o.buyer}</td><td class="num">${UI.fmtMoney(o.amount)}</td><td>${UI.badge(o.status)}</td><td>${o.status === 'Under Review' ? `<button class="btn small primary" onclick="BankPortal.decideOffer('${o.id}','Accepted')">Accept</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  },

  renderReportsView() {
    const assets = Store.getBankAssets();
    return `
      <div class="page-head"><h1>Reports &amp; Billing</h1></div>
      <div class="kpis">
        <div class="kpi"><div class="k">Total</div><div class="v">${assets.length}</div></div>
        <div class="kpi ok"><div class="k">Live</div><div class="v">${assets.filter(a => a.status === 'Live').length}</div></div>
        <div class="kpi warn"><div class="k">Pending</div><div class="v">${assets.filter(a => ['Submitted','Under Review'].includes(a.status)).length}</div></div>
        <div class="kpi"><div class="k">Offers</div><div class="v">${Store.offers.length}</div></div>
        <div class="kpi alert"><div class="k">Holds</div><div class="v">${assets.filter(a => a.legalHold).length}</div></div>
      </div>
      <div class="group"><div class="caption">Monthly Report</div><div class="body">
        <button class="btn" onclick="UI.toast('PDF export queued','success')">Export PDF</button>
        <button class="btn" onclick="UI.toast('Excel export queued','success')">Export Excel</button>
      </div></div>
      <div class="group"><div class="caption">Billing &amp; Invoices</div><div class="body">
        <table class="grid">
          <thead><tr><th>Invoice</th><th>Description</th><th class="num">Amount</th><th>Status</th></tr></thead>
          <tbody>${Store.invoices.map(i => `<tr><td class="ref">${i.ref}</td><td>${i.description}</td><td class="num">${UI.fmtMoney(i.amount)}</td><td>${UI.badge(i.status)}</td></tr>`).join('')}</tbody>
        </table>
      </div></div>
    `;
  },

  renderNotificationsView() {
    return `<div class="page-head"><h1>Notifications</h1></div><div class="gridwrap"><div style="padding:10px 14px">${Store.auditLog.filter(a => Store.getBankAssets().some(x => x.ref === a.entityRef)).slice(0, 10).map(n => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(n.when)}</div><div class="ae-what"><b>${n.action}</b> on ${n.entityRef} — ${n.detail || ''}</div></div>`).join('')}</div></div>`;
  },

  newAsset() {
    const id = 'a' + Date.now();
    const ref = 'SS-RE-2026-' + String(Store.assets.length + 241).padStart(5, '0');
    Store.assets.unshift({
      id, ref, bankId: 'bank1', bankName: 'Meridian Trust Bank',
      category: 'House', assetType: '', region: 'Greater Accra', district: '',
      town: '', publicLocation: '', exactAddress: '',
      description: '', reserve: 0, minOffer: 0, showReserve: false,
      status: 'Draft', publicationStatus: 'Unpublished', legalStatus: 'Not Started',
      valuationAmount: 0, valuationDate: null, valuationExpiry: null,
      landSearchValid: false, injunctionActive: false, legalHold: false,
      exteriorImage: false, titleVerified: false, titleDetails: false,
      enforcementBasis: '', caseRef: 'BNK-LN-' + Math.floor(10000 + Math.random() * 90000),
      borrowerRef: '', loanAmount: 0,
      images: 0, documents: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'J. Mensah',
      legalSubstate: { enforcementRecorded: false, instrumentsVerified: false, injunctionClear: true, clearanceIssued: false },
      legalNotes: [], instruments: [],
      activity: [{ when: new Date().toISOString(), who: 'J. Mensah', what: 'Asset created as Draft' }],
    });
    Store.addAudit('J. Mensah', 'CREATE', 'Asset', ref, null, 'Draft', 'Asset record created');
    UI.toast('Draft asset created: ' + ref, 'success');
    this.openAsset(id);
  },

  saveCurrent() { if (!this.selectedAssetId) return UI.toast('Open an asset first', 'warn'); UI.toast('Asset saved', 'success'); },
  submitCurrent() { this.submitForReview(); },

  submitForReview() {
    if (!this.selectedAssetId) return UI.toast('Open an asset first', 'warn');
    const a = Store.getAsset(this.selectedAssetId);
    if (a.legalHold) return UI.toast('Cannot submit: legal hold active', 'error');
    const r = Store.checkPublishReadiness(a);
    const criticalMissing = r.checks.filter(c => !c.pass && ['price','description'].includes(c.key));
    if (criticalMissing.length) return UI.toast('Submission blocked: ' + criticalMissing.map(c => c.label).join(', '), 'error');
    Store.updateAsset(this.selectedAssetId, { status: 'Submitted' }, 'J. Mensah', 'Submitted for Surge review');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Submitted for review');
    UI.toast('Submitted for review. Surge will review within 2 business days.', 'success');
    this.render();
  },

  resubmitAsset() {
    if (!this.selectedAssetId) return;
    Store.updateAsset(this.selectedAssetId, { status: 'Submitted' }, 'J. Mensah', 'Resubmitted');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Resubmitted');
    UI.toast('Resubmitted', 'success');
    this.render();
  },

  decideOffer(offerId, decision) {
    const offer = Store.offers.find(o => o.id === offerId);
    if (!offer) return;
    offer.status = decision;
    Store.addAudit('E. Owusu', 'OFFER_' + decision.toUpperCase(), 'Offer', offer.ref, 'Under Review', decision, 'Bank decision');
    if (decision === 'Accepted') {
      const asset = Store.getAssetByRef(offer.assetRef);
      if (asset) {
        Store.updateAsset(asset.id, { status: 'Sale', publicationStatus: 'Withdrawn' }, 'E. Owusu', 'Offer accepted');
        UI.toast('Offer accepted. Asset moved to Sale.', 'success');
      }
    } else UI.toast('Offer ' + decision.toLowerCase(), 'success');
    this.render();
  },
};

// ============================================================
// ADMIN PORTAL
// ============================================================
const AdminPortal = {
  currentView: 'assets', selectedAssetId: null, detailTab: 'overview', subPage: null,

  init() {
    document.querySelectorAll('#admin-nav .navitem').forEach(el => {
      el.addEventListener('click', () => this.nav(el.dataset.view));
    });
    this.render();
  },

  nav(view) {
    document.querySelectorAll('#admin-nav .navitem').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    this.currentView = view; this.selectedAssetId = null; this.detailTab = 'overview'; this.subPage = null;
    this.render();
  },

  render() {
    this.renderDoctabs();
    const el = document.getElementById('admin-work');
    if (this.subPage) { el.innerHTML = this.renderSubPage(); return; }
    switch (this.currentView) {
      case 'dashboard': el.innerHTML = this.renderDashboard(); break;
      case 'assets': el.innerHTML = this.selectedAssetId ? this.renderAssetDetail(this.selectedAssetId) : this.renderAssetList(); break;
      case 'review': el.innerHTML = this.renderReviewQueue(); break;
      case 'legal': el.innerHTML = this.renderLegalQueue(); break;
      case 'title': el.innerHTML = this.renderTitleQueue(); break;
      case 'offers': el.innerHTML = this.renderOffersView(); break;
      case 'audit': el.innerHTML = this.renderAuditView(); break;
      default: el.innerHTML = this.renderAssetList();
    }
  },

  renderDoctabs() {
    const el = document.getElementById('admin-doctabs');
    if (this.selectedAssetId) {
      const a = Store.getAsset(this.selectedAssetId);
      el.innerHTML = `<div class="dtab" onclick="AdminPortal.nav('assets')">Assets</div><div class="dtab active">${a.ref}<span class="x" onclick="event.stopPropagation();AdminPortal.closeAsset()">×</span></div>`;
    } else el.innerHTML = `<div class="dtab active">Assets</div>`;
  },

  renderDashboard() {
    const all = Store.assets;
    const legalQueueCount = all.filter(a => a.status === 'Submitted' && !a.legalSubstate?.clearanceIssued).length;
    return `
      <div class="page-head"><h1>Admin Dashboard</h1><span class="crumb">Surge Solutions · ${all.length} assets</span></div>
      <div class="kpis">
        <div class="kpi" onclick="AdminPortal.nav('assets')"><div class="k">Assets</div><div class="v">${all.length}</div></div>
        <div class="kpi ok" onclick="AdminPortal.nav('assets')"><div class="k">Live</div><div class="v">${all.filter(a => a.status === 'Live').length}</div></div>
        <div class="kpi warn" onclick="AdminPortal.nav('review')"><div class="k">Review</div><div class="v">${all.filter(a => ['Submitted','Under Review'].includes(a.status)).length}</div></div>
        <div class="kpi warn" onclick="AdminPortal.nav('legal')"><div class="k">Legal Pending</div><div class="v">${legalQueueCount}</div></div>
        <div class="kpi alert" onclick="AdminPortal.nav('assets')"><div class="k">Holds</div><div class="v">${all.filter(a => a.legalHold).length}</div></div>
      </div>
      <div class="gridwrap"><div class="gridtoolbar"><strong style="font-size:12.5px">Recent Activity</strong></div><div style="padding:10px 14px"><ul class="timeline">${Store.auditLog.slice(0, 8).map(a => `<li><span class="dot ${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span><div class="tl-when">${UI.fmtDate(a.when)}</div><div class="tl-what"><b>${a.action}</b> ${a.entityRef} — ${a.detail || ''}</div><div class="tl-who">${a.who}</div></li>`).join('')}</ul></div></div>
    `;
  },

  renderAssetList() {
    return `<div class="page-head"><h1>All Assets</h1><span class="crumb">${Store.assets.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Category</th><th>Status</th><th>Legal</th><th>Readiness</th></tr></thead><tbody>${Store.assets.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${a.category}</td><td>${UI.badge(a.status)}</td><td>${UI.badge(a.legalStatus)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td></tr>`; }).join('')}</tbody></table></div>`;
  },

  openAsset(id) { this.selectedAssetId = id; this.currentView = 'assets'; this.detailTab = 'overview'; this.subPage = null; this.render(); },
  closeAsset() { this.selectedAssetId = null; this.subPage = null; this.render(); },
  setTab(t) { this.detailTab = t; this.render(); },
  openSubPage(name) { this.subPage = name; this.render(); },
  closeSubPage() { this.subPage = null; this.render(); },

  renderAssetDetail(id) {
    const a = Store.getAsset(id);
    if (!a) return '<div class="empty-state"><p>Asset not found</p></div>';
    const readiness = Store.checkPublishReadiness(a);
    const canPublish = readiness.allPass && a.status === 'Approved';
    const isLive = a.status === 'Live';
    const tab = this.detailTab;
    
    let tabContent = '';
    if (tab === 'overview') tabContent = this.renderOverviewTab(a, readiness);
    else if (tab === 'readiness') tabContent = this.renderReadinessTab(a, readiness);
    else if (tab === 'activity') tabContent = this.renderActivityTab(a);
    else if (tab === 'audit') tabContent = this.renderAuditTab(a);

    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeAsset()">← Back</button>
        <h1>${a.ref}</h1>
        ${UI.badge(a.status)} ${UI.badge(a.publicationStatus)}
        <span class="spacer"></span>
        <span class="crumb">${a.bankName}</span>
      </div>
      ${a.legalHold ? `<div class="banner red"><svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 018 0v3"/></svg><div><b>LEGAL HOLD.</b> ${a.legalHoldReason}</div></div>` : ''}
      <div class="detailhead">
        <span class="ref">${a.ref}</span>
        <span class="title">${a.category} — ${a.assetType}</span>
        <span class="spacer"></span>
        <span class="badge ${readiness.allPass ? 'ok' : 'warn'}">${readiness.checks.filter(c => c.pass).length}/${readiness.checks.length} gates</span>
      </div>
      <div class="detailbody">
        <div class="tabs-inner">
          <div class="tab-inner ${tab === 'overview' ? 'active' : ''}" onclick="AdminPortal.setTab('overview')">Overview</div>
          <div class="tab-inner ${tab === 'readiness' ? 'active' : ''}" onclick="AdminPortal.setTab('readiness')">Readiness <span class="pill ${readiness.allPass ? 'ok' : 'alert'}">${readiness.checks.filter(c => c.pass).length}/${readiness.checks.length}</span></div>
          <div class="tab-inner ${tab === 'activity' ? 'active' : ''}" onclick="AdminPortal.setTab('activity')">Activity</div>
          <div class="tab-inner ${tab === 'audit' ? 'active' : ''}" onclick="AdminPortal.setTab('audit')">Audit</div>
        </div>
        ${tabContent}
        
        <div class="group" style="margin-top:20px">
          <div class="caption">Review &amp; Publication Actions</div>
          <div class="body">
            <div class="form-actions" style="justify-content:flex-start;gap:10px">
              
              ${a.status === 'Submitted' ? `
                <button class="btn primary" onclick="AdminPortal.startReview()">Begin Review</button>
              ` : ''}
              
              ${a.status === 'Under Review' ? `
                <button class="btn primary" onclick="AdminPortal.approveAsset()" ${!readiness.allPass ? 'disabled title="Gates failing"' : ''}>Approve Asset</button>
                <button class="btn" onclick="AdminPortal.requestChanges()">Request Changes</button>
                <button class="btn danger" onclick="AdminPortal.rejectAsset()">Reject</button>
              ` : ''}
              
              ${a.status === 'Approved' ? `
                <button class="btn success" onclick="AdminPortal.publishAsset()" ${!canPublish ? 'disabled title="Gates failing"' : ''}>Publish Listing</button>
                <button class="btn" onclick="AdminPortal.publishAsset(true)" title="Force publish for demo">Force Publish (Demo)</button>
              ` : ''}
              
              ${isLive ? `
                <button class="btn" onclick="AdminPortal.unpublishAsset()">Unpublish</button>
              ` : ''}
              
              ${!a.legalHold ? `
                <button class="btn danger" onclick="AdminPortal.placeLegalHold()">Place Legal Hold</button>
              ` : `
                <button class="btn success" onclick="AdminPortal.releaseLegalHold()">Release Legal Hold</button>
              `}
            </div>
            ${!readiness.allPass && (a.status === 'Under Review' || a.status === 'Approved') ? `
              <p style="font-size:11.5px;color:var(--warning);margin:8px 0 0">
                ⚠ <b>Blocking gates:</b> ${readiness.checks.filter(c => !c.pass).map(c => c.label).join(', ')}
              </p>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderOverviewTab(a, readiness) {
    return `<div class="grid2"><div class="group"><div class="caption">Asset</div><div class="body">
      <div class="kv-row"><span class="kv-k">Bank</span><span class="kv-v">${a.bankName}</span></div>
      <div class="kv-row"><span class="kv-k">Location</span><span class="kv-v">${a.publicLocation}</span></div>
      <div class="kv-row"><span class="kv-k">Reserve</span><span class="kv-v">${UI.fmtMoney(a.reserve)}</span></div>
      <div class="kv-row"><span class="kv-k">Legal Status</span><span class="kv-v">${UI.badge(a.legalStatus)}</span></div>
      <div class="kv-row"><span class="kv-k">Valuation</span><span class="kv-v">${UI.fmtMoney(a.valuationAmount)} (expires ${UI.fmtDateShort(a.valuationExpiry)})</span></div>
      <div class="kv-row"><span class="kv-k">Title Verified</span><span class="kv-v">${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</span></div>
    </div></div><div class="group"><div class="caption">Readiness</div><div class="body"><ul class="readiness-list">${readiness.checks.map(c => `<li>${UI.readinessIcon(c.pass)}<span class="item-label">${c.label}</span><span class="item-status" style="color:${c.pass ? 'var(--success)' : 'var(--danger)'}">${c.pass ? 'PASS' : 'FAIL'}</span></li>`).join('')}</ul></div></div></div>`;
  },

  renderReadinessTab(a, readiness) {
    return `<div class="group"><div class="caption">Gates with Diagnostics</div><div class="body">${readiness.checks.map(c => this.renderGateItem(c, a)).join('')}</div></div>`;
  },

  renderGateItem(c, a) {
    let fix = '';
    if (!c.pass) {
      if (c.key === 'legal' || c.key === 'injunction' || c.key === 'hold') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open Legal Workspace</button>`;
      else if (c.key === 'title' || c.key === 'landSearch') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Verify Title</button>`;
      else if (c.key === 'valuation') fix = `<button class="btn small" onclick="UI.toast('Ask bank to re-upload valuation','warn')">Ask Bank for New Valuation</button>`;
      else fix = `<span style="font-size:11px;color:var(--text-2);font-style:italic">Awaiting bank action</span>`;
    }
    return `
      <div class="gate-item">
        <div class="gate-header">
          ${UI.readinessIcon(c.pass)}
          <span class="item-label" style="font-weight:600;flex:1">${c.label}</span>
          <span class="item-status" style="color:${c.pass ? 'var(--success)' : 'var(--danger)'}">${c.pass ? 'PASS' : 'FAIL'}</span>
        </div>
        ${!c.pass && c.diagnostics ? `<div class="gate-sub">${c.diagnostics.map(d => `<div class="gate-sub-row">${UI.readinessIcon(d.pass)}<span style="flex:1;color:${d.pass ? 'var(--text)' : 'var(--danger)'}">${d.label}</span>${!d.pass ? `<span style="font-size:11px;color:var(--text-2);font-style:italic">${d.fixWho}</span>` : ''}</div>`).join('')}</div>` : ''}
        ${fix ? `<div class="gate-action">${fix}</div>` : ''}
      </div>
    `;
  },

  renderActivityTab(a) {
    return `<div class="group"><div class="caption">Activity</div><div class="body"><ul class="timeline">${a.activity.slice().reverse().map(act => `<li><span class="dot ${act.what.includes('Legal hold') ? 'red' : act.what.includes('Published') ? 'green' : ''}"></span><div class="tl-when">${UI.fmtDate(act.when)}</div><div class="tl-what">${act.what}</div><div class="tl-who">${act.who}</div></li>`).join('')}</ul></div></div>`;
  },

  renderAuditTab(a) {
    return `<div class="group"><div class="caption">Audit</div><div class="body">${Store.auditLog.filter(x => x.entityRef === a.ref).map(x => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(x.when)}</div><div class="ae-who">${x.who}</div><div class="ae-what"><b>${x.action}</b>${x.oldValue ? ` — <span class="ae-old">${x.oldValue}</span> → <span class="ae-new">${x.newValue}</span>` : ''}${x.detail ? `<br><span style="color:var(--text-2)">${x.detail}</span>` : ''}</div></div>`).join('') || '<p style="color:var(--text-2)">No events</p>'}</div></div>`;
  },

  renderReviewQueue() {
    const queue = Store.assets.filter(a => ['Submitted', 'Under Review', 'Changes Required'].includes(a.status));
    return `<div class="page-head"><h1>Review Queue</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Status</th><th>Readiness</th><th>Action</th></tr></thead><tbody>${queue.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.status)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td><td><button class="btn small primary" onclick="event.stopPropagation();AdminPortal.openAsset('${a.id}')">Open</button></td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">Empty</td></tr>'}</tbody></table></div>`;
  },

  renderLegalQueue() {
    const pending = Store.assets.filter(a => !a.legalSubstate?.clearanceIssued || a.injunctionActive || a.legalHold);
    return `<div class="page-head"><h1>Legal Verification Queue</h1><span class="crumb">${pending.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Legal Status</th><th>Instruments</th><th>Action</th></tr></thead><tbody>${pending.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.legalStatus)}</td><td>${(a.instruments || []).length}</td><td><button class="btn small primary" onclick="AdminPortal.openAsset('${a.id}');AdminPortal.openSubPage('legal-review')">Open Legal Workspace</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">No pending legal verifications</td></tr>'}</tbody></table></div>`;
  },

  renderTitleQueue() {
    const pending = Store.assets.filter(a => !a.titleVerified);
    return `<div class="page-head"><h1>Title &amp; Valuation Queue</h1><span class="crumb">${pending.length} assets pending title verification</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Title Details</th><th>Title Verified</th><th>Action</th></tr></thead><tbody>${pending.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${a.titleDetails ? UI.badge('Submitted') : UI.badge('Not Provided')}</td><td>${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</td><td>${a.titleDetails ? `<button class="btn small primary" onclick="AdminPortal.openAsset('${a.id}');AdminPortal.openSubPage('title-verify')">Verify Title</button>` : '<span style="font-size:11px;color:var(--text-2)">Awaiting bank</span>'}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">All titles verified</td></tr>'}</tbody></table></div>`;
  },

  renderOffersView() {
    return `<div class="page-head"><h1>Offers</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Ref</th><th>Asset</th><th>Buyer</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>${Store.offers.map(o => `<tr><td class="ref">${o.ref}</td><td class="ref">${o.assetRef}</td><td>${o.buyer}</td><td class="num">${UI.fmtMoney(o.amount)}</td><td>${UI.badge(o.status)}</td></tr>`).join('')}</tbody></table></div>`;
  },

  renderAuditView() {
    return `<div class="page-head"><h1>Audit Log</h1><span class="crumb">${Store.auditLog.length} events</span></div><div class="gridwrap"><div style="padding:10px 14px">${Store.auditLog.map(x => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(x.when)}</div><div class="ae-who">${x.who}</div><div class="ae-what"><b>${x.action}</b> ${x.entityRef}${x.oldValue ? ` — <span class="ae-old">${x.oldValue}</span> → <span class="ae-new">${x.newValue}</span>` : ''}${x.detail ? `<br><span style="color:var(--text-2)">${x.detail}</span>` : ''}</div></div>`).join('')}</div></div>`;
  },

  renderSubPage() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return '<div class="empty-state"><p>No asset selected</p></div>';
    switch (this.subPage) {
      case 'legal-review': return this.renderLegalWorkspace(a);
      case 'title-verify': return this.renderTitleWorkspace(a);
      default: return this.renderAssetDetail(a.id);
    }
  },

  renderLegalWorkspace(a) {
    const instruments = a.instruments || [];
    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeSubPage()">← Back to Asset</button>
        <h1>Legal Verification Workspace</h1>
        <span class="crumb">${a.ref} · ${a.bankName}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div><b>Legal Verification Officer workspace.</b> Review each instrument. Issuing clearance sets <code>legalStatus = Cleared</code> and unblocks the publication gate. Every decision is audited.</div></div>

      <div class="group">
        <div class="caption">Enforcement Basis</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Recorded Basis</span><span class="kv-v">${a.enforcementBasis || '<span style="color:var(--danger)">Not recorded</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Case Reference</span><span class="kv-v">${a.caseRef}</span></div>
          <div class="kv-row"><span class="kv-k">Injunction</span><span class="kv-v">${a.injunctionActive ? '<span class="badge alert">ACTIVE — blocks publication</span>' : '<span class="badge ok">None</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Legal Hold</span><span class="kv-v">${a.legalHold ? `<span class="badge hold">Active — ${a.legalHoldReason}</span>` : '<span class="badge ok">None</span>'}</span></div>
        </div>
      </div>

      <div class="group">
        <div class="caption">Instruments for Verification <span class="hint">${instruments.filter(i => i.status === 'Verified').length}/${instruments.length} verified</span></div>
        <div class="body">
          ${instruments.length ? instruments.map(i => `
            <div class="instrument-row">
              <span class="inst-type">${i.type}</span>
              <span class="inst-ref">${i.ref}</span>
              <span class="inst-status">${UI.badge(i.status)}</span>
              <span style="font-size:11px;color:var(--text-2)">${i.uploadedBy} · ${UI.fmtDateShort(i.uploadedAt)}</span>
              ${i.status !== 'Verified' ? `
                <button class="btn small primary" onclick="AdminPortal.verifyInstrument('${a.id}','${i.id}')">Verify</button>
                <button class="btn small danger" onclick="AdminPortal.rejectInstrument('${a.id}','${i.id}')">Reject</button>
              ` : '<span class="badge ok">✓ Verified</span>'}
            </div>
          `).join('') : '<p style="color:var(--text-2);margin:0">No instruments uploaded by bank. Ask bank to upload legal instruments first.</p>'}
        </div>
      </div>

      <div class="group">
        <div class="caption">Verification Notes</div>
        <div class="body">
          <textarea id="legal-notes" placeholder="Enter verification notes (Surge internal only)" style="width:100%;height:80px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px"></textarea>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn success" onclick="AdminPortal.issueClearance('${a.id}')" ${!a.legalSubstate?.instrumentsVerified ? 'disabled title="Verify all instruments first"' : ''}>
              Issue Legal Clearance
            </button>
            ${a.injunctionActive ? `<button class="btn danger" onclick="AdminPortal.liftInjunction('${a.id}')">Lift Injunction</button>` : ''}
            ${a.legalHold ? `<button class="btn success" onclick="AdminPortal.releaseLegalHold('${a.id}')">Release Legal Hold</button>` : `<button class="btn danger" onclick="AdminPortal.placeLegalHold()">Place Legal Hold</button>`}
          </div>
          ${!a.legalSubstate?.instrumentsVerified ? '<p style="font-size:11.5px;color:var(--warning);margin:10px 0 0">Verify all instruments before issuing clearance.</p>' : ''}
        </div>
      </div>

      <div class="group">
        <div class="caption">Verification History</div>
        <div class="body">
          <ul class="timeline">
            ${(a.legalNotes || []).slice().reverse().map(n => `<li><span class="dot ${n.decision === 'verified' ? 'green' : n.decision === 'rejected' ? 'red' : ''}"></span><div class="tl-when">${UI.fmtDate(n.when)}</div><div class="tl-what">${n.note}</div><div class="tl-who">${n.who}</div></li>`).join('') || '<li style="color:var(--text-2)">No history</li>'}
          </ul>
        </div>
      </div>
    `;
  },

  verifyInstrument(assetId, instrumentId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    const inst = a.instruments.find(i => i.id === instrumentId);
    if (inst) inst.status = 'Verified';
    const allVerified = a.instruments.every(i => i.status === 'Verified');
    a.legalSubstate = a.legalSubstate || {};
    a.legalSubstate.instrumentsVerified = allVerified;
    a.legalNotes = a.legalNotes || [];
    a.legalNotes.push({ when: new Date().toISOString(), who: 'S. Adjei (Legal Officer)', decision: 'verified', note: 'Instrument ' + instrumentId + ' verified' });
    Store.addAudit('S. Adjei', 'VERIFY_INSTRUMENT', 'Asset', a.ref, 'Pending', 'Verified', 'Instrument ' + instrumentId);
    UI.toast(allVerified ? 'All instruments verified. You can now issue legal clearance.' : 'Instrument verified. Verify remaining instruments.', 'success');
    this.render();
  },

  rejectInstrument(assetId, instrumentId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    const inst = a.instruments.find(i => i.id === instrumentId);
    if (inst) inst.status = 'Rejected';
    a.legalSubstate = a.legalSubstate || {};
    a.legalSubstate.instrumentsVerified = false;
    Store.addAudit('S. Adjei', 'REJECT_INSTRUMENT', 'Asset', a.ref, 'Pending', 'Rejected', 'Instrument ' + instrumentId);
    UI.toast('Instrument rejected. Bank will be notified to re-upload.', 'warn');
    this.render();
  },

  issueClearance(assetId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    if (!a.legalSubstate?.instrumentsVerified) return UI.toast('Verify all instruments first', 'error');
    if (a.injunctionActive) return UI.toast('Cannot clear: active injunction', 'error');
    const notes = document.getElementById('legal-notes')?.value || '';
    Store.updateAsset(assetId, {
      legalStatus: 'Cleared',
      legalSubstate: { ...a.legalSubstate, clearanceIssued: true }
    }, 'S. Adjei', 'Legal clearance issued' + (notes ? ': ' + notes : ''));
    a.legalNotes.push({ when: new Date().toISOString(), who: 'S. Adjei', decision: 'cleared', note: 'Legal clearance issued ' + (notes ? ': ' + notes : '') });
    Store.addActivity(assetId, 'S. Adjei', 'Legal clearance issued — gate now PASS');
    UI.toast('Legal clearance issued. The "Legal and enforcement verified" gate now passes.', 'success');
    this.closeSubPage();
  },

  liftInjunction(assetId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    Store.updateAsset(assetId, { injunctionActive: false, legalHold: false, legalHoldReason: null, status: 'Approved' }, 'S. Adjei', 'Injunction lifted');
    a.legalSubstate.injunctionClear = true;
    Store.addActivity(assetId, 'S. Adjei', 'Injunction lifted');
    UI.toast('Injunction lifted. Asset no longer blocked.', 'success');
    this.render(); PublicMarket.render(); BankPortal.render();
  },

  renderTitleWorkspace(a) {
    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeSubPage()">← Back to Asset</button>
        <h1>Title Verification</h1>
        <span class="crumb">${a.ref} · ${a.bankName}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Verify the title particulars submitted by the bank against the uploaded title deed.</div></div>

      <div class="group">
        <div class="caption">Submitted Title Information</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Title Number</span><span class="kv-v">${a.titleNumber || '<span style="color:var(--danger)">Not provided</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Title Type</span><span class="kv-v">${a.titleType || '—'}</span></div>
          <div class="kv-row"><span class="kv-k">Registered Owner</span><span class="kv-v">${a.titleOwner || '—'}</span></div>
          <div class="kv-row"><span class="kv-k">Perfection Status</span><span class="kv-v">${a.titlePerfection || '—'}</span></div>
        </div>
      </div>

      <div class="group">
        <div class="caption">Verification Actions</div>
        <div class="body">
          ${!a.titleDetails ? '<p style="color:var(--danger);margin:0 0 10px">Bank has not submitted title details yet. Ask bank to complete the Title Information page.</p>' : ''}
          <textarea id="title-notes" placeholder="Verification notes" style="width:100%;height:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px;margin-bottom:10px"></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn success" onclick="AdminPortal.verifyTitle('${a.id}')" ${!a.titleDetails ? 'disabled' : ''}>Verify Title</button>
            <button class="btn danger" onclick="AdminPortal.rejectTitle('${a.id}')" ${!a.titleDetails ? 'disabled' : ''}>Reject Title</button>
          </div>
        </div>
      </div>
    `;
  },

  verifyTitle(assetId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    const notes = document.getElementById('title-notes')?.value || '';
    Store.updateAsset(assetId, { titleVerified: true, landSearchValid: true, landSearchExpiry: new Date(Date.now() + 180*86400000).toISOString() }, 'A. Boateng', 'Title verified');
    Store.addActivity(assetId, 'A. Boateng', 'Title verified — gate now PASS' + (notes ? ': ' + notes : ''));
    UI.toast('Title verified. "Title information verified" gate now passes.', 'success');
    this.closeSubPage();
  },

  rejectTitle(assetId) {
    Store.addAudit('A. Boateng', 'REJECT_TITLE', 'Asset', Store.getAsset(assetId).ref, null, null, 'Title rejected');
    UI.toast('Title rejected. Bank notified to correct.', 'warn');
    this.closeSubPage();
  },

  startReview() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { status: 'Under Review' }, 'A. Boateng', 'Review started'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Review started'); 
    this.render(); 
  },
  
  approveAsset() { 
    if (!this.selectedAssetId) return; 
    const a = Store.getAsset(this.selectedAssetId); 
    const r = Store.checkPublishReadiness(a); 
    
    // Force a pass for the demo if the user clicks despite the visual block
    if (!r.allPass) {
      const fails = r.checks.filter(c => !c.pass).map(c => c.label).join(', ');
      if (confirm(`The following gates are technically failing in the data: ${fails}.\n\nDo you want to force approve this asset anyway for testing?`)) {
        // Auto-fix missing flags so it doesn't break the next step
        a.exteriorImage = true; 
        a.legalStatus = 'Cleared';
        a.titleVerified = true;
      } else {
        return; 
      }
    } 
    
    Store.updateAsset(this.selectedAssetId, { status: 'Approved' }, 'A. Boateng', 'Approved'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Approved'); 
    UI.toast('Asset Approved successfully.', 'success');
    this.render(); 
  },
  
  requestChanges() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { status: 'Changes Required' }, 'A. Boateng', 'Changes requested'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Changes requested'); 
    UI.toast('Changes requested', 'warn'); 
    this.render(); 
  },
  
  rejectAsset() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { status: 'Rejected' }, 'A. Boateng', 'Rejected'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Rejected'); 
    this.render(); 
  },
  
  publishCurrent() { this.publishAsset(); },
  
  publishAsset(force = false) {
    if (!this.selectedAssetId) return UI.toast('No asset', 'warn');
    const a = Store.getAsset(this.selectedAssetId);
    const r = Store.checkPublishReadiness(a);
    
    if (!r.allPass && !force) return UI.toast('Blocked: ' + r.checks.filter(c => !c.pass).map(c => c.label).join(', '), 'error');
    if (a.status !== 'Approved' && !force) return UI.toast('Must be Approved first', 'error');
    
    Store.updateAsset(this.selectedAssetId, { status: 'Live', publicationStatus: 'Published' }, 'A. Boateng', 'Published');
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Published to Marketplace');
    UI.toast('Published to Marketplace', 'success');
    this.render(); PublicMarket.render(); BankPortal.render();
  },
  
  unpublishAsset() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { publicationStatus: 'Unpublished', status: 'Approved' }, 'A. Boateng', 'Unpublished'); 
    this.render(); PublicMarket.render(); BankPortal.render(); 
  },
  
  holdCurrent() { this.placeLegalHold(); },
  
  placeLegalHold() {
    if (!this.selectedAssetId) return;
    UI.modal('Place Legal Hold', `<p>This immediately suspends the listing and blocks all progression.</p><div class="field"><span class="lbl">Reason <span class="req">*</span></span><div class="ctl"><input id="hold-reason" style="width:100%" placeholder="Required reason"></div></div>`, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn danger" onclick="AdminPortal.confirmHold()">Place Hold</button>`);
  },
  
  confirmHold() {
    const reason = document.getElementById('hold-reason')?.value || 'No reason';
    const a = Store.getAsset(this.selectedAssetId);
    Store.updateAsset(this.selectedAssetId, { legalHold: true, legalHoldReason: reason, status: 'Legal Hold', publicationStatus: 'Suspended' }, 'A. Boateng', 'Legal hold: ' + reason);
    a.legalSubstate.holdClear = false;
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Legal hold placed: ' + reason);
    UI.closeModal();
    UI.toast('Legal hold placed', 'error');
    this.render(); PublicMarket.render(); BankPortal.render();
  },
  
  releaseLegalHold(assetId) {
    const id = assetId || this.selectedAssetId;
    if (!id) return;
    Store.updateAsset(id, { legalHold: false, legalHoldReason: null, status: 'Approved', publicationStatus: 'Unpublished' }, 'A. Boateng', 'Legal hold released');
    Store.getAsset(id).legalSubstate.holdClear = true;
    Store.addActivity(id, 'A. Boateng', 'Legal hold released');
    UI.toast('Legal hold released. Asset returns to Approved.', 'success');
    this.render(); PublicMarket.render(); BankPortal.render();
  }
};

// ============================================================
// PUBLIC MARKETPLACE
// ============================================================
const PublicMarket = {
  currentPage: 'home', selectedAssetId: null, viewMode: 'grid',

  init() { this.render(); },

  setActiveNav(page) { document.querySelectorAll('#pub-nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page)); },
  goHome() { this.currentPage = 'home'; this.selectedAssetId = null; this.setActiveNav('home'); this.render(); },
  goHow() { this.currentPage = 'how'; this.setActiveNav('how'); this.render(); },
  goKyc() { this.currentPage = 'kyc'; this.setActiveNav('kyc'); this.render(); },
  goFaq() { this.currentPage = 'faq'; this.setActiveNav('faq'); this.render(); },
  goContact() { this.currentPage = 'contact'; this.setActiveNav('contact'); this.render(); },

  render() {
    const el = document.getElementById('public-work');
    switch (this.currentPage) {
      case 'home': el.innerHTML = this.selectedAssetId ? this.renderDetail() : this.renderHome(); break;
      case 'how': el.innerHTML = this.renderHow(); break;
      case 'kyc': el.innerHTML = this.renderKyc(); break;
      case 'faq': el.innerHTML = this.renderFaq(); break;
      case 'contact': el.innerHTML = this.renderContact(); break;
    }
  },

  renderHome() {
    const pub = Store.getPublicAssets();
    return `
      <div class="hero"><h2>Bank-Repossessed &amp; Distressed Assets in Ghana</h2><p>Browse verified listings managed exclusively by Surge Solutions.</p><div class="listedby"><span class="sq"></span>Listed by Surge Solutions · ${pub.length} live assets</div></div>
      <div class="searchpanel"><div class="row">
        <div><label>Region</label><select><option>All Regions</option></select></div>
        <div><label>Category</label><select><option>All Categories</option></select></div>
        <div><label>Price Range</label><select><option>Any Price</option></select></div>
        <div><label>Occupancy</label><select><option>Any</option></select></div>
        <div><label>Search</label><input placeholder="Reference or location..."></div>
        <button class="btn primary" onclick="UI.toast('Filter applied','success')">Search</button>
      </div></div>
      <div class="resultshead"><h3>Available Assets</h3><span class="count">${pub.length} results</span><span class="spacer"></span>
        <div class="viewtoggle">
          <button class="${this.viewMode === 'grid' ? 'active' : ''}" onclick="PublicMarket.setView('grid')">Grid</button>
          <button class="${this.viewMode === 'list' ? 'active' : ''}" onclick="PublicMarket.setView('list')">List</button>
        </div>
      </div>
      <div class="cards ${this.viewMode === 'list' ? 'list-view' : ''}">
        ${pub.map(a => this.renderCard(a)).join('') || '<div class="empty-state" style="grid-column:1/-1"><h3>No live assets</h3></div>'}
      </div>
      <div class="pub-footer"><div class="legal">All listings are managed by Surge Solutions.</div><span class="spacer"></span><span>&copy; 2026 Surge Solutions</span></div>
    `;
  },

  setView(v) { this.viewMode = v; this.render(); },

  renderCard(a) {
    return `<div class="acard" onclick="PublicMarket.openDetail('${a.id}')">
      <div class="thumb"><svg class="ph" viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg><span class="badge live">Live</span><span class="ref">${a.ref}</span></div>
      <div class="cbody"><span class="cat">${a.category}</span><span class="ttl">${a.assetType}</span><div class="loc">${a.publicLocation}</div>
      <div class="price">${a.showReserve ? `<span class="amt">${UI.fmtMoney(a.reserve).split('.')[0]}<small>.00</small></span>` : '<span class="poa">Price on Application</span>'}</div>
      <div class="listedby"><span class="sq"></span>Listed by Surge Solutions</div></div>
    </div>`;
  },

  openDetail(id) { this.selectedAssetId = id; this.currentPage = 'home'; this.render(); },
  closeDetail() { this.selectedAssetId = null; this.render(); },

  renderDetail() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return this.renderHome();
    return `
      <div class="page-head"><button class="btn small" onclick="PublicMarket.closeDetail()">← Back</button><h1 style="font-size:16px">${a.assetType}</h1>${UI.badge('Live')}</div>
      <div class="detail-page">
        <div class="gallery"><div class="mainimg"><svg class="ph" viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg></div>
          <div class="thumbs"><div class="t active">Main</div><div class="t">View 2</div><div class="t">View 3</div></div>
        </div>
        <div class="detail-side">
          <div class="panelbox"><h4>${a.category} · ${a.assetType}</h4>
            <div class="pricebig">${a.showReserve ? UI.fmtMoney(a.reserve) : 'Price on Application'}</div>
            <p style="font-size:12.5px;color:var(--text-2);margin:6px 0 12px">${a.description}</p>
            <table class="details"><tr><th>Reference</th><td>${a.ref}</td></tr><tr><th>Location</th><td>${a.publicLocation}</td></tr><tr><th>Region</th><td>${a.region}</td></tr></table>
          </div>
          <div class="panelbox"><div class="cta-col">
            <button class="btn primary" onclick="PublicMarket.enquiry('${a.id}')">Submit Enquiry</button>
            <button class="btn" onclick="PublicMarket.requestViewing('${a.id}')">Request Viewing</button>
            <button class="btn" onclick="UI.toast('KYC required before offers','warn')">Submit Offer (KYC required)</button>
          </div><div class="notice" style="margin-top:12px"><b>Listed by Surge Solutions.</b> Enquiries managed by Surge only.</div></div>
        </div>
      </div>
    `;
  },

  enquiry(id) {
    UI.modal('Submit Enquiry', `
      <div class="field"><span class="lbl">Full Name <span class="req">*</span></span><div class="ctl"><input id="enq-name" style="width:100%"></div></div>
      <div class="field"><span class="lbl">Phone <span class="req">*</span></span><div class="ctl"><input id="enq-phone" style="width:100%"></div></div>
      <div class="field"><span class="lbl">Email</span><div class="ctl"><input id="enq-email" style="width:100%"></div></div>
      <div class="field"><span class="lbl">Message</span><div class="ctl"><textarea id="enq-msg"></textarea></div></div>
    `, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn primary" onclick="PublicMarket.submitEnquiry('${id}')">Submit</button>`);
  },

  submitEnquiry(id) {
    const name = document.getElementById('enq-name').value;
    const phone = document.getElementById('enq-phone').value;
    if (!name || !phone) return UI.toast('Name and phone required', 'error');
    const a = Store.getAsset(id);
    const ref = 'SL-LEAD-2026-' + String(Store.leads.length + 104).padStart(6, '0');
    Store.leads.push({ id: 'l' + Date.now(), ref, assetId: id, assetRef: a.ref, name, phone, email: document.getElementById('enq-email').value, status: 'New', source: 'Public Enquiry', assignedTo: null, createdAt: new Date().toISOString() });
    Store.addAudit('Public Buyer', 'ENQUIRY', 'Lead', ref, null, 'New', 'Enquiry from ' + name);
    UI.closeModal();
    UI.toast('Enquiry submitted. Reference: ' + ref, 'success');
  },

  requestViewing(id) {
    const a = Store.getAsset(id);
    const ref = 'VW-2026-' + String(Store.viewings.length + 302).padStart(6, '0');
    Store.viewings.push({ id: 'v' + Date.now(), ref, assetId: id, assetRef: a.ref, buyer: 'Pending', scheduledAt: new Date(Date.now() + 3*86400000).toISOString(), status: 'Requested', agent: null });
    Store.addAudit('Public Buyer', 'VIEWING_REQUEST', 'Viewing', ref, null, 'Requested', 'Viewing requested on ' + a.ref);
    UI.toast('Viewing requested. Reference: ' + ref, 'success');
  },

  renderHow() { return `<div class="hero" style="padding:24px 28px"><h2>How It Works</h2></div><div class="group"><div class="caption">1. Browse &amp; Enquire</div><div class="body"><p style="margin:0;font-size:12.5px">Submit a free enquiry. No account needed.</p></div></div><div class="group"><div class="caption">2. Surge Contacts You</div><div class="body"><p style="margin:0;font-size:12.5px">A Surge officer discusses the asset and qualifies your interest.</p></div></div><div class="group"><div class="caption">3. KYC Verification</div><div class="body"><p style="margin:0;font-size:12.5px">Submit identity docs. Surge verifies.</p></div></div><div class="group"><div class="caption">4. Viewing &amp; Offer</div><div class="body"><p style="margin:0;font-size:12.5px">Schedule a viewing, then submit a formal offer.</p></div></div><div class="group"><div class="caption">5. Completion</div><div class="body"><p style="margin:0;font-size:12.5px">Bank decides. If accepted, Surge issues sale docs and invoice.</p></div></div><div style="margin-top:18px"><button class="btn primary" onclick="PublicMarket.goHome()">Browse Live Assets</button></div>`; },
  renderKyc() { return `<div class="hero" style="padding:24px 28px"><h2>KYC &amp; Verification</h2></div><div class="group"><div class="caption">Why KYC</div><div class="body"><p style="margin:0;font-size:12.5px">KYC is required before viewings and offers, but not to browse. We confirm your identity and source of funds.</p></div></div><div class="group"><div class="caption">What we collect</div><div class="body"><ul style="margin:0;padding-left:20px;font-size:12.5px"><li>Full name and contact</li><li>Ghana Card (encrypted)</li><li>Proof of funds</li><li>Consents</li></ul></div></div><div class="group"><div class="caption">How we protect it</div><div class="body"><ul style="margin:0;padding-left:20px;font-size:12.5px"><li>AES-256-GCM encryption</li><li>Private R2 buckets with signed-URL access</li><li>Only verified reviewers can access</li><li>All access logged</li></ul></div></div><div style="margin-top:18px"><button class="btn primary" onclick="PublicMarket.goHome()">Browse Assets</button></div>`; },
  renderFaq() { return `<div class="hero" style="padding:24px 28px"><h2>FAQ</h2></div><div class="group"><div class="caption">Do I need an account?</div><div class="body"><p style="margin:0;font-size:12.5px">No — browsing and enquiries are free.</p></div></div><div class="group"><div class="caption">Can I contact the bank?</div><div class="body"><p style="margin:0;font-size:12.5px">No. Surge is the sole intermediary.</p></div></div><div class="group"><div class="caption">Is KYC safe?</div><div class="body"><p style="margin:0;font-size:12.5px">Yes — encrypted and audited.</p></div></div><div style="margin-top:18px"><button class="btn primary" onclick="PublicMarket.goHome()">Browse Assets</button></div>`; },
  renderContact() {
    return `<div class="hero" style="padding:24px 28px"><h2>Contact Surge</h2></div><div class="grid2"><div class="group"><div class="caption">Enquiry Form</div><div class="body"><div class="field"><span class="lbl">Name <span class="req">*</span></span><div class="ctl"><input id="ct-name" style="width:100%"></div></div><div class="field"><span class="lbl">Phone <span class="req">*</span></span><div class="ctl"><input id="ct-phone" style="width:100%"></div></div><div class="field"><span class="lbl">Message</span><div class="ctl"><textarea id="ct-msg"></textarea></div></div><button class="btn primary" onclick="PublicMarket.submitContact()">Submit</button></div></div><div class="group"><div class="caption">Contact Details</div><div class="body"><div class="kv-row"><span class="kv-k">Email</span><span class="kv-v">enquiries@surge.gh</span></div><div class="kv-row"><span class="kv-k">Phone</span><span class="kv-v">+233 30 274 0000</span></div><div class="kv-row"><span class="kv-k">Hours</span><span class="kv-v">Mon-Fri, 08:00-17:00 GMT</span></div></div></div></div>`;
  },
  submitContact() {
    const name = document.getElementById('ct-name').value;
    const phone = document.getElementById('ct-phone').value;
    if (!name || !phone) return UI.toast('Name and phone required', 'error');
    UI.toast('Contact submitted', 'success');
    this.goHome();
  },
};

// ============================================================
// SWITCHER & BOOT
// ============================================================
document.querySelectorAll('.switcher button[data-app]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.switcher button[data-app]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.app').forEach(a => a.classList.remove('active'));
    document.getElementById('app-' + btn.dataset.app).classList.add('active');
    if (btn.dataset.app === 'public') PublicMarket.render();
    if (btn.dataset.app === 'bank') BankPortal.render();
    if (btn.dataset.app === 'admin') AdminPortal.render();
  });
});

Store.init();
BankPortal.init();
AdminPortal.init();
PublicMarket.init();
UI.clock('clock-bank');
UI.clock('clock-admin');

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); BankPortal.saveCurrent(); }
  if (e.key === 'Escape') UI.closeModal();
});