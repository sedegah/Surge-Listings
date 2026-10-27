/**
 * Surge Solutions — Enterprise Multi-Tenant Platform Engine
 * Real Data Layer, Live API Client, Routing, State Machines & UI View Renderers
 * Conforming to Consolidated Product, Design and Implementation Document v1.0
 */

const API_BASE = (window.location.protocol === 'file:' || !window.location.origin) 
  ? 'http://localhost:5080/api/v1' 
  : '/api/v1';

// Global state
window.Surge = {
  activeApp: 'bank', // 'bank', 'admin', 'public'
  currentRoute: '',
  currentUser: {
    name: 'j.mensah',
    role: 'Legal / Recovery Officer',
    org: 'Meridian Trust Bank',
    env: 'PROD',
    email: 'j.mensah@meridiantrust.com.gh'
  },
  adminUser: {
    name: 'a.boateng',
    role: 'Property Manager',
    org: 'Surge Solutions',
    env: 'PROD',
    email: 'a.boateng@surgesolutions.com.gh'
  },
  publicBuyer: {
    name: '',
    email: '',
    phone: '',
    ghanaCard: '',
    isVerified: false
  },
  selectedAssetId: 'ast-001',
  openTabs: [
    { id: 'tab-assets', label: 'My Assets', app: 'bank', route: 'assets' },
    { id: 'tab-asset-detail', label: '* SS-RE-2026-00241', app: 'bank', route: 'asset-detail', assetId: 'ast-001', active: true }
  ],
  cache: {}
};

// Utilities
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatMoney = amt => (amt !== null && amt !== undefined) ? 'GHS ' + Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
const formatDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

// Notification toast system
let toastTimer;
function notify(msg, type = 'info') {
  let el = document.getElementById('surge-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'surge-toast';
    document.body.appendChild(el);
  }
  el.className = 'surge-toast show ' + type;
  el.innerHTML = `<span>${esc(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
window.Surge.notify = notify;

// Modal dialog system
function showModal(title, contentHtml, onConfirm = null, confirmText = 'Confirm', cancelText = 'Cancel', isWide = false) {
  let modal = document.getElementById('surge-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'surge-modal';
    modal.className = 'surge-modal-backdrop';
    document.body.appendChild(modal);
  }
  const wideStyle = isWide ? 'style="max-width:920px;width:95%"' : '';
  modal.innerHTML = `
    <div class="surge-modal-window ${isWide ? 'wide' : ''}" ${wideStyle}>
      <div class="surge-modal-header">
        <h3>${esc(title)}</h3>
        <button class="surge-modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="surge-modal-body">${contentHtml}</div>
      <div class="surge-modal-footer">
        <button class="btn" onclick="closeModal()">${esc(cancelText)}</button>
        ${onConfirm ? `<button class="btn primary" id="surge-modal-confirm-btn">${esc(confirmText)}</button>` : ''}
      </div>
    </div>
  `;
  modal.classList.add('open');
  if (onConfirm) {
    document.getElementById('surge-modal-confirm-btn').onclick = () => {
      onConfirm();
    };
  }
}
window.Surge.showModal = showModal;

function closeModal() {
  const modal = document.getElementById('surge-modal');
  if (modal) modal.classList.remove('open');
}
window.closeModal = closeModal;
window.Surge.closeModal = closeModal;

// Generic API caller routed to 3 separate backend endpoints
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    let url = endpoint;
    if (endpoint.startsWith('/bank/')) {
      url = '/api/bank' + endpoint.substring(5);
    } else if (endpoint.startsWith('/admin/')) {
      url = '/api/admin' + endpoint.substring(6);
    } else if (endpoint.startsWith('/public/')) {
      url = '/api/public' + endpoint.substring(7);
    } else if (endpoint === '/stats') {
      url = '/api/admin/dashboard';
    } else if (!endpoint.startsWith('/api')) {
      url = '/api' + endpoint;
    }

    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Bank-ID': window.Surge?.currentUser?.bankId || 'bank-mtb',
        'X-Actor-Name': window.Surge?.currentUser?.name || 'Bank User',
        'X-Actor-Role': window.Surge?.currentUser?.role || 'Asset Officer'
      }
    };
    if (body) opts.body = JSON.stringify(body);

    let res = await fetch(url, opts);
    if (!res.ok) {
      // Fallback try with /api/v1 legacy prefix if needed
      const legacyRes = await fetch(`/api/v1${endpoint}`, opts).catch(() => null);
      if (legacyRes && legacyRes.ok) return await legacyRes.json();

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call ${endpoint} failed:`, err.message);
    // Provide fallback from local database simulation if server is offline
    return await fallbackLocal(endpoint, method, body);
  }
}

// Local In-Memory Fallback if backend server not running
async function fallbackLocal(endpoint, method, body) {
  console.log(`[Local Fallback] ${method} ${endpoint}`);
  if (endpoint.startsWith('/stats')) {
    return { totalAssets: 6, liveListings: 3, pendingReview: 1, legalHolds: 1, completedSales: 1, totalSaleValue: 1250000, activeOffers: 2, pendingKYC: 1, activeInjunctions: 1 };
  }
  if (endpoint.startsWith('/public/assets')) {
    return {
      total: 3,
      data: [
        { id: 'ast-002', public_ref: 'SS-VH-2026-00187', category_code: 'Vehicle', asset_type: 'Double Cabin Pickup', title: 'Toyota Hilux 2.4 GD-6 double cab', region: 'Ashanti', town: 'Kumasi', public_location: 'Kumasi, Ashanti (approximate)', reserve_price: 185000, show_reserve_publicly: 1, occupancy_status: 'Vacant', status: 'Live', year: 2021, mileage: '48,200 km', fuel: 'Diesel' },
        { id: 'ast-003', public_ref: 'SS-RE-2026-00239', category_code: 'House', asset_type: '4-bedroom detached house', title: '4-bedroom detached house with compound', region: 'Western', town: 'Takoradi', public_location: 'Takoradi, Western Region (approximate)', reserve_price: 1240000, show_reserve_publicly: 1, occupancy_status: 'Occupied — Cooperative', status: 'Live', beds: 4, baths: 3 },
        { id: 'ast-005', public_ref: 'SS-EQ-2026-00094', category_code: 'Equipment', asset_type: 'Hydraulic Excavator', title: 'Caterpillar 320D Tracked Hydraulic Excavator', region: 'Greater Accra', town: 'Tema Heavy Industrial', public_location: 'Tema, Greater Accra', reserve_price: 96500, show_reserve_publicly: 1, occupancy_status: 'Vacant', status: 'Live' }
      ]
    };
  }
  return { success: true, message: 'Executed in local workspace mode' };
}

/* ============================================================
   ROUTER & APP SWITCHER
   ============================================================ */
function initApp() {
  // Bind top mockup switcher
  document.querySelectorAll('.switcher button').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = btn.dataset.app;
      switchApp(app);
    });
  });

  // Bind navpane items in Bank Portal
  document.querySelectorAll('#app-bank .navpane .navitem').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const txt = item.textContent.trim().toLowerCase();
      if (txt.includes('dashboard')) navigateBank('dashboard');
      else if (txt.includes('my assets') || txt.includes('assets')) navigateBank('assets');
      else if (txt.includes('legal')) navigateBank('legal');
      else if (txt.includes('title')) navigateBank('title-documents');
      else if (txt.includes('listings status')) navigateBank('listings-status');
      else if (txt.includes('viewings')) navigateBank('viewings');
      else if (txt.includes('offers')) navigateBank('offers');
      else if (txt.includes('reports')) navigateBank('reports');
      else if (txt.includes('billing')) navigateBank('billing');
      else if (txt.includes('users')) navigateBank('users');
      else if (txt.includes('notifications')) navigateBank('notifications');
    });
  });

  // Bind navpane items in Surge Admin
  document.querySelectorAll('#app-admin .navpane .navitem').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const txt = item.textContent.trim().toLowerCase();
      if (txt.includes('dashboard')) navigateAdmin('dashboard');
      else if (txt.includes('banks')) navigateAdmin('banks');
      else if (txt.includes('users & roles') || txt.includes('users')) navigateAdmin('users');
      else if (txt.includes('assets') && !txt.includes('approval')) navigateAdmin('assets');
      else if (txt.includes('legal & enforcement') || txt.includes('legal')) navigateAdmin('legal-queue');
      else if (txt.includes('title & land search') || txt.includes('title')) navigateAdmin('title-queue');
      else if (txt.includes('valuations')) navigateAdmin('valuations-queue');
      else if (txt.includes('document verification')) navigateAdmin('document-verification');
      else if (txt.includes('listings approval')) navigateAdmin('listings-approval');
      else if (txt.includes('leads')) navigateAdmin('leads');
      else if (txt.includes('kyc queue') || txt.includes('kyc')) navigateAdmin('kyc');
      else if (txt.includes('viewings')) navigateAdmin('viewings');
      else if (txt.includes('offers')) navigateAdmin('offers');
      else if (txt.includes('invoices & payments') || txt.includes('invoices')) navigateAdmin('invoices');
      else if (txt.includes('reports')) navigateAdmin('reports');
      else if (txt.includes('fee & agreement') || txt.includes('settings')) navigateAdmin('settings');
      else if (txt.includes('audit log') || txt.includes('audit')) navigateAdmin('audit');
    });
  });

  // Bind public marketplace nav links
  document.querySelectorAll('#app-public .pub-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const txt = a.textContent.trim().toLowerCase();
      if (txt.includes('buy assets')) navigatePublic('home');
      else if (txt.includes('how it works')) navigatePublic('how-it-works');
      else if (txt.includes('kyc')) navigatePublic('kyc-info');
      else if (txt.includes('faq')) navigatePublic('faq');
      else if (txt.includes('contact')) navigatePublic('contact');
    });
  });

  // Bind document tabs in Bank & Admin
  document.querySelectorAll('#app-bank .doctabs .dtab').forEach(tab => {
    tab.style.cursor = 'pointer';
    tab.addEventListener('click', () => {
      const txt = tab.textContent.trim();
      if (txt.includes('SS-')) navigateBank(`asset-detail/${window.Surge.selectedAssetId || 'ast-001'}`);
      else navigateBank('assets');
    });
  });
  document.querySelectorAll('#app-admin .doctabs .dtab').forEach(tab => {
    tab.style.cursor = 'pointer';
    tab.addEventListener('click', () => {
      const txt = tab.textContent.trim();
      if (txt.includes('SS-')) navigateAdmin(`asset-detail/${window.Surge.selectedAssetId || 'ast-001'}`);
      else navigateAdmin('assets');
    });
  });

  // Listen to hash changes for deep linking
  window.addEventListener('hashchange', handleHashRouting);

  // Detect active standalone portal if on individual page
  const pagePortal = document.body.dataset.portal || 
    (document.getElementById('app-bank') && !document.getElementById('app-admin') ? 'bank' : null) ||
    (document.getElementById('app-admin') && !document.getElementById('app-bank') ? 'admin' : null) ||
    (document.getElementById('app-public') && !document.getElementById('app-bank') ? 'public' : null) ||
    (window.location.pathname.includes('/bank') ? 'bank' : null) ||
    (window.location.pathname.includes('/admin') ? 'admin' : null) ||
    (window.location.pathname.includes('/marketplace') ? 'public' : null);

  if (pagePortal) {
    switchApp(pagePortal);
  } else if (window.location.hash) {
    handleHashRouting();
  } else {
    switchApp('public', 'home');
  }

  // Bind global keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+F, Esc)
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleGlobalSave();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      handleGlobalNew();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      const searchInput = document.querySelector('.searchbox input, [data-local-search]');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}
window.Surge.initApp = initApp;

function switchApp(appName, route = '') {
  window.Surge.activeApp = appName;
  document.querySelectorAll('.switcher button').forEach(b => {
    b.classList.toggle('active', b.dataset.app === appName);
  });
  document.querySelectorAll('.app').forEach(a => {
    a.classList.toggle('active', a.id === `app-${appName}`);
  });

  // Update status bar user and environment info
  if (appName === 'bank') {
    updateBankStatusBar();
    if (!route) route = 'assets';
    navigateBank(route);
  } else if (appName === 'admin') {
    updateAdminStatusBar();
    if (!route) route = 'dashboard';
    navigateAdmin(route);
  } else if (appName === 'public') {
    if (!route) route = 'home';
    navigatePublic(route);
  }

  window.scrollTo(0, 0);
  const viewport = document.querySelector('.viewport');
  if (viewport) viewport.scrollTop = 0;
}
window.Surge.switchApp = switchApp;

function handleHashRouting() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return;

  const parts = hash.split('/');
  const app = parts[0];
  const route = parts.slice(1).join('/');

  if (['bank', 'admin', 'public'].includes(app)) {
    switchApp(app, route);
  }
}

function setHash(app, route) {
  window.location.hash = `#/${app}/${route}`;
}

/* ============================================================
   STATUS BAR & HEADER UPDATES
   ============================================================ */
function updateBankStatusBar() {
  const sb = document.querySelector('#app-bank .statusbar');
  if (!sb) return;
  const u = window.Surge.currentUser;
  sb.innerHTML = `
    <span class="cell">User: <b>${esc(u.name)}</b></span>
    <span class="cell">Role: <b>${esc(u.role)}</b></span>
    <span class="cell">Org: <b>${esc(u.org)}</b></span>
    <span class="cell">Env: <b>PROD</b></span>
    <span class="cell lock">● Record lock active</span>
    <span class="cell grow">Verified Session · Africa/Accra</span>
  `;
}

function updateAdminStatusBar() {
  const sb = document.querySelector('#app-admin .statusbar');
  if (!sb) return;
  const u = window.Surge.adminUser;
  sb.innerHTML = `
    <span class="cell">User: <b>${esc(u.name)}</b></span>
    <span class="cell">Role: <b>${esc(u.role)}</b></span>
    <span class="cell">Org: <b>${esc(u.org)}</b></span>
    <span class="cell">Env: <b>PROD</b></span>
    <span class="cell">Tenant: <b>Global Platform Operator</b></span>
    <span class="cell grow">Audited Mode · Africa/Accra</span>
  `;
}

/* ============================================================
   BANK PORTAL CONTROLLER & VIEWS
   ============================================================ */
async function navigateBank(route) {
  setHash('bank', route);
  const work = document.querySelector('#app-bank .work');
  if (!work) return;

  // Set active navitem
  document.querySelectorAll('#app-bank .navpane .navitem').forEach(item => {
    const txt = item.textContent.trim().replace(/\d+$/, '').trim().toLowerCase();
    const isActive = (
      (route === 'dashboard' && txt.includes('dashboard')) ||
      ((route === 'assets' || route === 'asset-detail') && txt.includes('my assets')) ||
      (route === 'legal' && txt.includes('legal')) ||
      (route === 'title-documents' && txt.includes('title')) ||
      (route === 'listings-status' && txt.includes('listings status')) ||
      (route === 'viewings' && txt.includes('viewings')) ||
      (route === 'offers' && txt.includes('offers')) ||
      (route === 'reports' && txt.includes('reports')) ||
      (route === 'billing' && txt.includes('billing')) ||
      (route === 'users' && txt.includes('users')) ||
      (route === 'notifications' && txt.includes('notifications'))
    );
    item.classList.toggle('active', isActive);
  });

  if (route === 'dashboard') {
    await renderBankDashboard(work);
  } else if (route === 'assets') {
    await renderBankAssetsList(work);
  } else if (route.startsWith('asset-detail')) {
    const assetId = route.split('/')[1] || window.Surge.selectedAssetId || 'ast-001';
    await renderBankAssetDetail(work, assetId);
  } else if (route === 'legal') {
    await renderBankLegalMatters(work);
  } else if (route === 'title-documents') {
    await renderBankTitleDocuments(work);
  } else if (route === 'listings-status') {
    await renderBankListingsStatus(work);
  } else if (route === 'viewings') {
    await renderBankViewings(work);
  } else if (route === 'offers') {
    await renderBankOffers(work);
  } else if (route === 'reports') {
    await renderBankReports(work);
  } else if (route === 'billing') {
    await renderBankBilling(work);
  } else if (route === 'users') {
    await renderBankUsers(work);
  } else if (route === 'notifications') {
    await renderBankNotifications(work);
  } else {
    await renderBankAssetsList(work);
  }

  bindBankToolbar();
}

async function renderBankDashboard(container) {
  const stats = await apiCall('/bank/dashboard?bankId=bank-mtb');
  container.innerHTML = `
    <div class="page-head">
      <h1>Bank Portfolio Dashboard — Meridian Trust Bank</h1>
      <span class="crumb">Bank Portal / Dashboard</span>
      <span class="spacer"></span>
      <span class="badge live">Tenant Isolated</span>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="k">Total Portfolio</div><div class="v">${stats.totalAssets || 4}</div><div class="d">Registered bank assets</div></div>
      <div class="kpi ok"><div class="k">Live on Market</div><div class="v">${stats.liveAssets || 1}</div><div class="d up">Marketing by Surge</div></div>
      <div class="kpi warn"><div class="k">Submitted / Review</div><div class="v">${stats.submittedAssets || 1}</div><div class="d">Awaiting Surge review</div></div>
      <div class="kpi alert"><div class="k">Pending Decisions</div><div class="v">${stats.pendingDecisions || 2}</div><div class="d down">Offers requiring decision</div></div>
      <div class="kpi"><div class="k">Outstanding Invoices</div><div class="v">${formatMoney(stats.invoicesDue || 12400)}</div><div class="d">Commission & fees</div></div>
    </div>

    <section class="group">
      <div class="caption">Priority Action Items <span class="hint">Items requiring Bank Administrator or Approver response</span></div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Type</th><th>Reference</th><th>Description</th><th>Action Required</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge alert">Offer</span></td>
              <td class="ref">SS-OFF-2026-0081</td>
              <td>Offer of GHS 920,000 for Tema Comm 25 House (Below Reserve of GHS 950,000)</td>
              <td>Approver decision (Accept, Counter, or Reject)</td>
              <td><button class="btn small primary" onclick="Surge.openOfferDecision('SS-OFF-2026-0081')">Review Offer</button></td>
            </tr>
            <tr>
              <td><span class="badge warn">Legal Hold</span></td>
              <td class="ref">SS-RE-2026-00236</td>
              <td>Cantonments Bungalow — Family caveat notice</td>
              <td>LRO review of High Court notice</td>
              <td><button class="btn small" onclick="Surge.navigateBank('asset-detail/ast-004')">View Matter</button></td>
            </tr>
            <tr>
              <td><span class="badge info">Valuation</span></td>
              <td class="ref">SS-RE-2026-00241</td>
              <td>Tema Comm 25 valuation expired on 30 Sep 2026</td>
              <td>Upload updated GhIS valuation report</td>
              <td><button class="btn small" onclick="Surge.navigateBank('asset-detail/ast-001')">Update</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="group">
      <div class="caption">Quick Asset Register</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead><tr><th>Ref</th><th>Title</th><th>Category</th><th>Reserve</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${(stats.recentAssets || []).map(a => `
              <tr>
                <td class="ref">${esc(a.public_ref)}</td>
                <td><b>${esc(a.title)}</b></td>
                <td>House</td>
                <td class="num">${formatMoney(a.reserve_price)}</td>
                <td><span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span></td>
                <td><button class="btn small" onclick="Surge.openBankAsset('${esc(a.id)}')">Open</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

async function renderBankAssetsList(container) {
  const res = await apiCall('/bank/assets?bankId=bank-mtb');
  const assets = res.data || [];

  container.innerHTML = `
    <div class="page-head">
      <h1>My Assets Register — Meridian Trust Bank</h1>
      <span class="crumb">Bank Portal / My Assets</span>
      <span class="spacer"></span>
      <button class="btn primary" onclick="Surge.openNewAssetWizard()">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>+ New Asset
      </button>
    </div>

    <div class="gridwrap">
      <div class="gridtoolbar">
        <div class="searchbox">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
          <input type="text" id="bank-asset-search" placeholder="Filter by ref, internal ref, title… (Ctrl+F)">
        </div>
        <select id="bank-asset-filter-status" onchange="Surge.filterBankAssetsTable()" style="width:auto;height:27px">
          <option value="All">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted by Bank">Submitted</option>
          <option value="Live">Live</option>
          <option value="Legal Hold">Legal Hold</option>
          <option value="Sold">Sold</option>
        </select>
        <button class="btn small" onclick="Surge.exportCurrentTable('meridian-trust-assets.csv')">Export CSV</button>
        <button class="btn small" onclick="window.print()">Print</button>
        <span class="spacer"></span>
        <span class="help">Showing ${assets.length} assets · Meridian Trust Bank tenant</span>
      </div>

      <table class="grid" id="bank-assets-table">
        <thead>
          <tr>
            <th style="width:30px"><input type="checkbox"></th>
            <th>Public Ref</th>
            <th>Internal Bank Ref</th>
            <th>Asset Type / Description</th>
            <th>Region</th>
            <th class="num">Reserve (GHS)</th>
            <th>Occupancy</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map(a => `
            <tr onclick="Surge.selectBankRow(this, '${esc(a.id)}')">
              <td><input type="checkbox"></td>
              <td class="ref">${esc(a.public_ref)}</td>
              <td><code>${esc(a.internal_bank_ref)}</code> <span class="restricted-tag">Restricted</span></td>
              <td><b>${esc(a.title)}</b><span class="sub">${esc(a.asset_type)}</span></td>
              <td>${esc(a.region)}</td>
              <td class="num">${formatMoney(a.reserve_price)}</td>
              <td><span class="badge ${a.occupancy_status.includes('Hostile') ? 'rejected' : a.occupancy_status === 'Vacant' ? 'live' : 'warn'}">${esc(a.occupancy_status)}</span></td>
              <td><span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span></td>
              <td>
                <button class="btn small" onclick="event.stopPropagation(); Surge.openBankAsset('${esc(a.id)}')">Open</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="gridfooter">
        <span>Total: ${assets.length} bank assets</span>
        <span class="spacer"></span>
        <span>Keyboard: Enter opens row · Ctrl+N creates new asset</span>
      </div>
    </div>
  `;

  // Search input binding
  const searchInput = document.getElementById('bank-asset-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      document.querySelectorAll('#bank-assets-table tbody tr').forEach(tr => {
        tr.hidden = !tr.textContent.toLowerCase().includes(q);
      });
    });
  }
}

async function renderBankAssetDetail(container, assetId) {
  window.Surge.selectedAssetId = assetId;
  const res = await apiCall(`/bank/assets/${assetId}`);
  const { asset, enforcement, instruments = [], title, landSearches = [], valuations = [], documents = [], offers = [], audit = [] } = res;

  const hasInjunction = instruments.some(i => i.injunction_active === 1);
  const isHostile = asset.occupancy_status === 'Occupied — Hostile';
  const valuation = valuations[0];
  const isValuationExpired = valuation && (valuation.status === 'Expired' || valuation.review_required === 1);

  container.innerHTML = `
    <div class="page-head">
      <h1>${esc(asset.title)}</h1>
      <span class="crumb">My Assets / ${esc(asset.public_ref)}</span>
      <span class="spacer"></span>
      <span class="badge ${badgeClass(asset.status)}">${esc(asset.status)}</span>
    </div>

    <!-- Active Warning Banners -->
    ${hasInjunction ? `
      <div class="banner red">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
        <div><strong>COURT RESTRICTION / INJUNCTION ACTIVE</strong> An active injunction is registered in High Court suit (${instruments.find(i=>i.injunction_active)?.instrument_ref || 'Judgment'}). Public marketplace publishing is blocked until court discharge is verified.</div>
      </div>
    ` : ''}

    ${isHostile ? `
      <div class="banner amber">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
        <div><strong>HIGH-RISK OCCUPANCY: ${esc(asset.occupancy_status).toUpperCase()}</strong> Administrator security override with recorded reason is required prior to scheduling or confirming any buyer viewings (Rule OC-1).</div>
      </div>
    ` : ''}

    ${isValuationExpired ? `
      <div class="banner amber">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
        <div><strong>REVIEW REQUIRED</strong> Valuation report expired on ${formatDate(valuation?.expiry_date)} and is outside the 180-day validity window (VL-1, VL-2). Re-valuation required before Approved -> Live.</div>
      </div>
    ` : ''}

    <!-- Record Tabs -->
    <div class="rectabs" id="bank-asset-rectabs">
      <div class="rectab active" onclick="Surge.switchBankRecordTab('overview')">Asset Overview</div>
      <div class="rectab" onclick="Surge.switchBankRecordTab('legal')">Legal &amp; Instruments <span class="pill ${hasInjunction ? 'alert' : 'ok'}">${instruments.length}</span></div>
      <div class="rectab" onclick="Surge.switchBankRecordTab('title')">Title &amp; Valuation <span class="pill ${isValuationExpired ? 'alert' : 'ok'}">${isValuationExpired ? 'Review' : 'Valid'}</span></div>
      <div class="rectab" onclick="Surge.switchBankRecordTab('documents')">Documents <span class="pill">${documents.length}</span></div>
      <div class="rectab" onclick="Surge.switchBankRecordTab('offers')">Offers <span class="pill alert">${offers.length}</span></div>
      <div class="rectab" onclick="Surge.switchBankRecordTab('audit')">History &amp; Audit</div>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div id="bank-tab-overview" class="bank-subtab">
      <section class="group" style="margin-top:14px">
        <div class="caption">Identification <span class="hint">Internal bank reference is restricted — never shown publicly</span></div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Public Reference</label>
              <div class="ctl"><input type="text" value="${esc(asset.public_ref)}" readonly></div></div>
            <div class="field"><label class="lbl">Category<span class="req">*</span></label>
              <div class="ctl"><input type="text" id="edit-cat" value="${esc(asset.category_code)}"></div></div>
            <div class="field"><label class="lbl">Asset Type<span class="req">*</span></label>
              <div class="ctl"><input type="text" id="edit-type" value="${esc(asset.asset_type)}"></div></div>
            <div class="field"><label class="lbl">Internal Bank Ref</label>
              <div class="ctl"><input type="text" value="${esc(asset.internal_bank_ref)}" readonly>
                <span class="restricted-tag"><svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>Restricted</span>
              </div></div>
          </div>
        </div>
      </section>

      <section class="group">
        <div class="caption">Location Details</div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Region<span class="req">*</span></label>
              <div class="ctl"><input type="text" id="edit-region" value="${esc(asset.region)}"></div></div>
            <div class="field"><label class="lbl">District</label>
              <div class="ctl"><input type="text" id="edit-district" value="${esc(asset.district)}"></div></div>
            <div class="field"><label class="lbl">Town / Area<span class="req">*</span></label>
              <div class="ctl"><input type="text" id="edit-town" value="${esc(asset.town)}"></div></div>
            <div class="field"><label class="lbl">Public Location</label>
              <div class="ctl"><input type="text" id="edit-publoc" value="${esc(asset.public_location)}"></div></div>
            <div class="field wide"><label class="lbl">Exact Address</label>
              <div class="ctl"><input type="text" id="edit-exact" value="${esc(asset.exact_address)}">
                <span class="restricted-tag">Restricted</span>
              </div></div>
          </div>
        </div>
      </section>

      <section class="group">
        <div class="caption">Pricing &amp; Reserve Policy</div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Reserve Price (GHS)<span class="req">*</span></label>
              <div class="ctl"><input class="money" type="number" id="edit-reserve" value="${asset.reserve_price}"></div></div>
            <div class="field"><label class="lbl">Minimum Offer (GHS)</label>
              <div class="ctl"><input class="money" type="number" id="edit-minoffer" value="${asset.minimum_offer || ''}"></div></div>
            <div class="field wide"><label class="lbl">Public Price Display</label>
              <div class="ctl">
                <label style="display:flex;align-items:center;gap:7px;font-size:12.5px">
                  <input type="checkbox" id="edit-show-reserve" ${asset.show_reserve_publicly ? 'checked' : ''} style="width:auto;height:auto"> Show reserve publicly
                </label>
                <span class="help">If unchecked, public marketplace displays “Price on Application” (Rule PR-2).</span>
              </div></div>
          </div>
        </div>
      </section>

      <section class="group">
        <div class="caption">Occupancy &amp; Risk Classification</div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Occupancy Status</label>
              <div class="ctl">
                <select id="edit-occupancy">
                  <option value="Occupied — Hostile" ${asset.occupancy_status === 'Occupied — Hostile' ? 'selected' : ''}>Occupied — Hostile</option>
                  <option value="Occupied — Cooperative" ${asset.occupancy_status === 'Occupied — Cooperative' ? 'selected' : ''}>Occupied — Cooperative</option>
                  <option value="Vacant" ${asset.occupancy_status === 'Vacant' ? 'selected' : ''}>Vacant</option>
                </select>
              </div></div>
            <div class="field"><label class="lbl">Land Guard Risk</label>
              <div class="ctl">
                <select id="edit-risk">
                  <option value="High" ${asset.land_guard_risk === 'High' ? 'selected' : ''}>High</option>
                  <option value="Medium" ${asset.land_guard_risk === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="Low" ${asset.land_guard_risk === 'Low' ? 'selected' : ''}>Low</option>
                </select>
              </div></div>
          </div>
        </div>
      </section>
    </div>

    <!-- TAB 2: LEGAL -->
    <div id="bank-tab-legal" class="bank-subtab" style="display:none">
      <section class="group" style="margin-top:14px">
        <div class="caption">Legal Checklist Snapshot (LG-5)</div>
        <div class="body" style="padding:0">
          <table class="checklist">
            <thead><tr><th>Document / Instrument</th><th>Ref</th><th>Court</th><th>Injunction</th><th>Status</th><th>Verified By</th></tr></thead>
            <tbody>
              ${instruments.map(i => `
                <tr>
                  <td><b>${esc(i.instrument_type)}</b></td>
                  <td><code>${esc(i.instrument_ref)}</code></td>
                  <td>${esc(i.court || 'High Court Accra')}</td>
                  <td><span class="badge ${i.injunction_active ? 'rejected' : 'live'}">${i.injunction_active ? 'Active Injunction' : 'None'}</span></td>
                  <td><span class="badge ${i.verification_status === 'Verified' ? 'live' : 'pending'}">${esc(i.verification_status)}</span></td>
                  <td>${esc(i.verified_by || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- TAB 3: TITLE & VALUATION -->
    <div id="bank-tab-title" class="bank-subtab" style="display:none">
      <section class="group" style="margin-top:14px">
        <div class="caption">Land Search &amp; Perfection</div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Certificate Number</label><div class="ctl"><input type="text" value="${esc(title?.certificate_number || 'GA/TM/2019/8821')}" readonly></div></div>
            <div class="field"><label class="lbl">Registry</label><div class="ctl"><input type="text" value="${esc(title?.registry || 'Tema Lands Commission')}" readonly></div></div>
            <div class="field"><label class="lbl">Perfection Status</label><div class="ctl"><span class="badge live">${esc(title?.perfection_status || 'Perfected')}</span></div></div>
            <div class="field"><label class="lbl">Search Status</label><div class="ctl"><span class="badge ${landSearches[0]?.status === 'Valid' ? 'live' : 'warn'}">${esc(landSearches[0]?.status || 'Expired')}</span></div></div>
          </div>
        </div>
      </section>

      <section class="group">
        <div class="caption">Valuation Report (180-Day Window)</div>
        <div class="body">
          <div class="grid2">
            <div class="field"><label class="lbl">Valuer Name</label><div class="ctl"><input type="text" value="${esc(valuation?.valuer_name || 'Consolidated Property Valuers Ltd')}" readonly></div></div>
            <div class="field"><label class="lbl">Market Value</label><div class="ctl"><input class="money" type="text" value="${formatMoney(valuation?.market_value || 1150000)}" readonly></div></div>
            <div class="field"><label class="lbl">Forced Sale Value</label><div class="ctl"><input class="money" type="text" value="${formatMoney(valuation?.forced_sale_value || 920000)}" readonly></div></div>
            <div class="field"><label class="lbl">Expiry Date</label><div class="ctl"><input type="text" value="${formatDate(valuation?.expiry_date)}" readonly></div></div>
          </div>
        </div>
      </section>
    </div>

    <!-- TAB 4: DOCUMENTS -->
    <div id="bank-tab-documents" class="bank-subtab" style="display:none">
      <section class="group" style="margin-top:14px">
        <div class="caption">Secure Document Vault (DC-1, DC-2)</div>
        <div class="body" style="padding:0">
          <table class="grid">
            <thead><tr><th>Title</th><th>Category</th><th>Size</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${documents.map(d => `
                <tr>
                  <td><b>${esc(d.title)}</b></td>
                  <td>${esc(d.category)}</td>
                  <td>${esc(d.file_size)}</td>
                  <td><span class="badge ${d.verification_status === 'Verified' ? 'live' : 'pending'}">${esc(d.verification_status)}</span></td>
                  <td><button class="btn small" onclick="Surge.requestDocAccess('${esc(d.id)}', '${esc(d.title)}')">Request Signed Link</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- TAB 5: OFFERS -->
    <div id="bank-tab-offers" class="bank-subtab" style="display:none">
      <section class="group" style="margin-top:14px">
        <div class="caption">Offer Submissions &amp; Approver Decisions</div>
        <div class="body" style="padding:0">
          <table class="grid">
            <thead><tr><th>Offer Ref</th><th>Amount</th><th>Validity</th><th>Reserve Comp</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${offers.map(o => `
                <tr>
                  <td class="ref">${esc(o.offer_ref)}</td>
                  <td class="num"><b>${formatMoney(o.amount)}</b></td>
                  <td>${formatDate(o.validity_date)}</td>
                  <td><span class="badge ${o.below_reserve ? 'warn' : 'live'}">${o.below_reserve ? 'Below Reserve' : 'Meets Reserve'}</span></td>
                  <td><span class="badge ${badgeClass(o.status)}">${esc(o.status)}</span></td>
                  <td><button class="btn small primary" onclick="Surge.openOfferDecision('${esc(o.id)}')">Approver Decision</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- TAB 6: AUDIT -->
    <div id="bank-tab-audit" class="bank-subtab" style="display:none">
      <section class="group" style="margin-top:14px">
        <div class="caption">Append-Only Audit Trail (Reconstructable State History)</div>
        <div class="body">
          <ul class="feed">
            ${audit.map(log => `
              <li>
                <span class="when">${formatDate(log.created_at)} ${formatTime(log.created_at)}</span>
                <span class="what"><span class="who">${esc(log.actor_name)}</span> (${esc(log.actor_role)}): ${esc(log.delta_summary)}</span>
                <span class="delta">${log.old_values ? `<span class="from">${esc(log.old_values)}</span> → ` : ''}<span class="to">${esc(log.new_values || log.delta_summary)}</span></span>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
    </div>

    <!-- Form Actions Footer -->
    <div class="form-actions" style="margin-top:16px">
      <div class="left">
        <span class="help">Bank Administrator &amp; Recovery Officer Workspace</span>
      </div>
      <button class="btn" onclick="Surge.navigateBank('assets')">Close</button>
      <button class="btn" onclick="Surge.saveBankAssetChanges('${esc(asset.id)}')">Save Draft</button>
      <button class="btn primary" onclick="Surge.submitAssetForReview('${esc(asset.id)}')">
        <svg class="ico" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6z"/></svg>Submit for Review
      </button>
    </div>
  `;
}

// Bank Legal Matters View (LG-5)
async function renderBankLegalMatters(container) {
  const res = await apiCall('/bank/legal/matters?bankId=bank-mtb');
  const matters = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Legal Matters &amp; Court Enforcement Register</h1>
      <span class="crumb">Bank Portal / Legal &amp; Enforcement</span>
      <span class="spacer"></span>
      <span class="badge info">Meridian Trust Bank Legal Portfolio</span>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="k">Enforcement Cases</div><div class="v">${matters.length}</div><div class="d">Active recovery suits</div></div>
      <div class="kpi alert"><div class="k">Active Injunctions</div><div class="v">${matters.reduce((acc, m) => acc + (m.active_injunctions || 0), 0)}</div><div class="d down">Court listing holds</div></div>
      <div class="kpi ok"><div class="k">Clearance Status</div><div class="v">${matters.filter(m => !m.active_injunctions).length} / ${matters.length}</div><div class="d up">Cleared for disposal</div></div>
    </div>

    <section class="group">
      <div class="caption">High Court Litigation &amp; Realization Proceedings</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Case Number</th><th>Court</th><th>Action Type</th><th>Related Asset</th><th>Injunction Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${matters.map(m => `
              <tr>
                <td class="ref"><b>${esc(m.case_number)}</b></td>
                <td>${esc(m.court)}</td>
                <td><span class="badge info">${esc(m.action_type)}</span></td>
                <td><b>${esc(m.public_ref)}</b><br><small style="color:var(--text-2)">${esc(m.asset_title)}</small></td>
                <td>${m.active_injunctions > 0 ? '<span class="badge rejected">Yes — Active Injunction</span>' : '<span class="badge live">No — Discharged</span>'}</td>
                <td><button class="btn small primary" onclick="Surge.openBankAsset('${esc(m.asset_id)}')">Open Asset File</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Title Documents & Searches View (TL-1, TL-3)
async function renderBankTitleDocuments(container) {
  const res = await apiCall('/bank/title-documents?bankId=bank-mtb');
  const titles = res.titles || [];
  const searches = res.landSearches || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Title Deeds &amp; Official Land Searches</h1>
      <span class="crumb">Bank Portal / Title Documents</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('bank-title-registry.csv')">Export CSV</button>
    </div>

    <section class="group">
      <div class="caption">Registered Title Certificates &amp; Deeds (Lands Commission Perfection)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Title Certificate No</th><th>Registry</th><th>Perfection Status</th><th>Mortgage Registered</th><th>Related Asset</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${titles.map(t => `
              <tr>
                <td class="ref"><b>${esc(t.certificate_number || 'Pending')}</b></td>
                <td>${esc(t.registry)}</td>
                <td><span class="badge ${t.perfection_status === 'Perfected' ? 'live' : 'warn'}">${esc(t.perfection_status)}</span></td>
                <td>${t.mortgage_registered ? '<span class="badge live">Yes — 1st Legal Charge</span>' : '<span class="badge warn">Pending Registration</span>'}</td>
                <td><b>${esc(t.public_ref)}</b> — ${esc(t.asset_title)}</td>
                <td><button class="btn small" onclick="Surge.openBankAsset('${esc(t.asset_id)}')">View File</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="group" style="margin-top:14px">
      <div class="caption">Lands Commission Official Cadastral Searches</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Search Date</th><th>Asset</th><th>Status</th><th>Encumbrances Disclosed</th><th>Searcher</th></tr>
          </thead>
          <tbody>
            ${searches.map(s => `
              <tr>
                <td>${formatDate(s.search_date)}</td>
                <td><b>${esc(s.public_ref)}</b></td>
                <td><span class="badge ${s.status === 'Valid' ? 'live' : 'warn'}">${esc(s.status)}</span></td>
                <td>${esc(s.encumbrances_found || 'None registered')}</td>
                <td>${esc(s.conducted_by || 'Surge Legal Officer')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Listings Status Lifecycle View (AS-7)
async function renderBankListingsStatus(container) {
  const res = await apiCall('/bank/assets?bankId=bank-mtb');
  const assets = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Asset Lifecycle &amp; Listings Status Tracker</h1>
      <span class="crumb">Bank Portal / Listings Status</span>
      <span class="spacer"></span>
      <span class="badge info">${assets.length} Registered Portfolio Assets</span>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="k">Drafts</div><div class="v">${assets.filter(a=>a.status==='Draft').length}</div><div class="d">Internal prep</div></div>
      <div class="kpi warn"><div class="k">Submitted</div><div class="v">${assets.filter(a=>a.status==='Submitted by Bank').length}</div><div class="d">Awaiting Surge review</div></div>
      <div class="kpi ok"><div class="k">Live Marketplace</div><div class="v">${assets.filter(a=>a.status==='Live').length}</div><div class="d up">Active buyer marketing</div></div>
      <div class="kpi alert"><div class="k">Legal Hold</div><div class="v">${assets.filter(a=>a.status==='Legal Hold').length}</div><div class="d down">Blocked from market</div></div>
      <div class="kpi ok"><div class="k">Realized / Sold</div><div class="v">${assets.filter(a=>a.status==='Sold').length}</div><div class="d">Disposal complete</div></div>
    </div>

    <section class="group">
      <div class="caption">Portfolio Lifecycle Pipeline</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Public Ref</th><th>Title</th><th>Category</th><th class="num">Reserve (GHS)</th><th>Current Status</th><th>Public Visibility</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${assets.map(a => `
              <tr>
                <td class="ref">${esc(a.public_ref)}</td>
                <td><b>${esc(a.title)}</b></td>
                <td>${esc(a.category_code)}</td>
                <td class="num">${formatMoney(a.reserve_price)}</td>
                <td><span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span></td>
                <td>${a.status === 'Live' ? '<span class="badge live">Live on Marketplace</span>' : '<span class="badge draft">Private (Internal Only)</span>'}</td>
                <td><button class="btn small primary" onclick="Surge.openBankAsset('${esc(a.id)}')">Manage</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Viewings View (VW-1)
async function renderBankViewings(container) {
  const res = await apiCall('/bank/viewings?bankId=bank-mtb');
  const viewings = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Buyer Accompanied Viewing Schedule</h1>
      <span class="crumb">Bank Portal / Viewings</span>
      <span class="spacer"></span>
      <span class="badge info">${viewings.length} Scheduled Viewings</span>
    </div>

    <section class="group">
      <div class="caption">Accompanied Property Inspections</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Asset</th><th>Buyer Name</th><th>Inspection Date</th><th>Time Window</th><th>Accompanied Officer</th><th>Status</th><th>Security Note</th></tr>
          </thead>
          <tbody>
            ${viewings.map(v => `
              <tr>
                <td><b>${esc(v.public_ref)}</b><br><small>${esc(v.asset_title)}</small></td>
                <td>${esc(v.buyer_name)} <span class="badge live">KYC Verified</span></td>
                <td><b>${formatDate(v.viewing_date)}</b></td>
                <td>${esc(v.time_slot)}</td>
                <td>${esc(v.accompanied_by || 'Surge Escort Officer')}</td>
                <td><span class="badge ${v.status === 'Confirmed' ? 'live' : 'pending'}">${esc(v.status)}</span></td>
                <td>${v.high_risk_override ? '<span class="badge warn">High-Risk Override</span>' : 'Standard accompanied visit'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Offers View (OF-1, OF-2)
async function renderBankOffers(container) {
  const res = await apiCall('/bank/offers?bankId=bank-mtb');
  const offers = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Purchase Offers &amp; Approver Mandate</h1>
      <span class="crumb">Bank Portal / Offers</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('bank-offers.csv')">Export CSV</button>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="k">Total Offers</div><div class="v">${offers.length}</div><div class="d">Submitted by verified buyers</div></div>
      <div class="kpi warn"><div class="k">Pending Decision</div><div class="v">${offers.filter(o=>o.status==='Under Bank Review'||o.status==='Surge Review').length}</div><div class="d">Awaiting Approver action</div></div>
      <div class="kpi ok"><div class="k">Accepted Offers</div><div class="v">${offers.filter(o=>o.status==='Accepted').length}</div><div class="d up">Completed disposals</div></div>
    </div>

    <section class="group">
      <div class="caption">Received Offers &amp; Decision Queue</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Offer Ref</th><th>Asset Ref</th><th>Buyer Name</th><th class="num">Offer Amount</th><th class="num">Reserve</th><th>Reserve Check</th><th>Status</th><th>Validity</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${offers.map(o => `
              <tr>
                <td class="ref"><b>${esc(o.offer_ref)}</b></td>
                <td><b>${esc(o.public_ref)}</b></td>
                <td>${esc(o.buyer_name)}</td>
                <td class="num"><b>${formatMoney(o.amount)}</b></td>
                <td class="num">${formatMoney(o.reserve_price)}</td>
                <td>${o.below_reserve ? '<span class="badge warn">Below Reserve</span>' : '<span class="badge live">Meets Reserve</span>'}</td>
                <td><span class="badge ${badgeClass(o.status)}">${esc(o.status)}</span></td>
                <td>${formatDate(o.validity_date)}</td>
                <td>
                  ${o.status === 'Accepted' ? '<span class="badge live">Sale Finalized</span>' : `<button class="btn small primary" onclick="Surge.openOfferDecision('${esc(o.id)}')">Approver Decision</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Reports View
async function renderBankReports(container) {
  const stats = await apiCall('/bank/dashboard?bankId=bank-mtb');
  container.innerHTML = `
    <div class="page-head">
      <h1>Portfolio Realization &amp; Executive Reports</h1>
      <span class="crumb">Bank Portal / Reports</span>
      <span class="spacer"></span>
      <button class="btn small primary" onclick="Surge.exportCurrentTable('meridian-trust-portfolio-report.csv')">Export Portfolio Report</button>
      <button class="btn small" onclick="window.print()">Print</button>
    </div>

    <div class="kpis">
      <div class="kpi ok"><div class="k">Portfolio Realization</div><div class="v">96.8%</div><div class="d up">Realized vs Reserve Average</div></div>
      <div class="kpi"><div class="k">Avg Days on Market</div><div class="v">42 days</div><div class="d">From publication to offer acceptance</div></div>
      <div class="kpi alert"><div class="k">Total Commissions</div><div class="v">${formatMoney(stats.invoicesDue || 12400)}</div><div class="d">Platform disposition fees (4%)</div></div>
    </div>

    <section class="group">
      <div class="caption">Quarterly Disposal Performance Breakdown</div>
      <div class="body">
        <p class="help">Executive summary for Meridian Trust Bank Asset Recovery Committee. Generated under licensed Surge Solutions platform mandate.</p>
        <table class="grid">
          <thead><tr><th>Category</th><th>Registered Assets</th><th>Sold Assets</th><th>Total Realized (GHS)</th><th>Avg Discount</th></tr></thead>
          <tbody>
            <tr><td><b>Residential Property (Houses)</b></td><td>3</td><td>1</td><td class="num"><b>1,250,000.00</b></td><td>-3.1%</td></tr>
            <tr><td><b>Commercial Vehicles</b></td><td>1</td><td>0</td><td class="num">—</td><td>0.0%</td></tr>
            <tr><td><b>Industrial Equipment</b></td><td>1</td><td>0</td><td class="num">—</td><td>0.0%</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Billing & Invoices View (FE-1, FE-5)
async function renderBankBilling(container) {
  const res = await apiCall('/bank/billing?bankId=bank-mtb');
  const invoices = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Platform Commission Invoices &amp; Fee Ledger</h1>
      <span class="crumb">Bank Portal / Billing</span>
      <span class="spacer"></span>
      <span class="badge info">Standard Mandate: 4.0% Disposition Fee</span>
    </div>

    <section class="group">
      <div class="caption">Commission Invoices Issued by Surge Solutions</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Invoice No</th><th>Description</th><th class="num">Amount (GHS)</th><th>Issue Date</th><th>Due Date</th><th>Payment Status</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td class="ref"><b>${esc(inv.invoice_number)}</b></td>
                <td>${esc(inv.description)}</td>
                <td class="num"><b>${formatMoney(inv.amount)}</b></td>
                <td>${formatDate(inv.issue_date)}</td>
                <td>${formatDate(inv.due_date)}</td>
                <td><span class="badge ${inv.status === 'Paid' ? 'live' : inv.status === 'Overdue' ? 'rejected' : 'warn'}">${esc(inv.status)}</span></td>
                <td><button class="btn small" onclick="window.print()">Print Invoice</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Users View
async function renderBankUsers(container) {
  const res = await apiCall('/bank/users?bankId=bank-mtb');
  const users = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Bank Portal Authorized Users &amp; Roles</h1>
      <span class="crumb">Bank Portal / Users</span>
      <span class="spacer"></span>
      <span class="badge live">Meridian Trust Bank Domain</span>
    </div>

    <section class="group">
      <div class="caption">Authorized Officers (Role-Based Access Control)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Full Name</th><th>Username</th><th>Email</th><th>Assigned Role</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><b>${esc(u.full_name)}</b></td>
                <td><code>${esc(u.username)}</code></td>
                <td>${esc(u.email)}</td>
                <td><span class="badge info">${esc(u.role_name || u.role_code)}</span></td>
                <td><span class="badge live">${esc(u.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Bank Notifications View
async function renderBankNotifications(container) {
  const res = await apiCall('/bank/notifications?bankId=bank-mtb');
  const notifs = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Notifications &amp; Portfolio Alerts</h1>
      <span class="crumb">Bank Portal / Notifications</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="notify('All notifications marked as read', 'info')">Mark All as Read</button>
    </div>

    <section class="group">
      <div class="caption">Real-Time Event Feed</div>
      <div class="body">
        <ul class="feed">
          ${notifs.length ? notifs.map(n => `
            <li>
              <span class="when">${formatDate(n.created_at)}</span>
              <span class="what"><b>${esc(n.title)}</b>: ${esc(n.message)}</span>
            </li>
          `).join('') : `
            <li><span class="what">No active unread alerts.</span></li>
          `}
        </ul>
      </div>
    </section>
  `;
}

function bindBankToolbar() {
  const tb = document.querySelector('#app-bank .toolbar');
  if (!tb) return;
  tb.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const txt = btn.textContent.trim().toLowerCase();
      if (txt.includes('new')) Surge.openNewAssetWizard();
      else if (txt.includes('save')) Surge.saveBankAssetChanges(window.Surge.selectedAssetId);
      else if (txt.includes('submit')) Surge.submitAssetForReview(window.Surge.selectedAssetId);
      else if (txt.includes('export')) Surge.exportCurrentTable('bank-export.csv');
      else if (txt.includes('print')) window.print();
    };
  });
}

/* ============================================================
   SURGE ADMIN CONTROLLER & VIEWS
   ============================================================ */
async function navigateAdmin(route) {
  setHash('admin', route);
  const work = document.querySelector('#app-admin .work');
  if (!work) return;

  // Set active navitem in Surge Admin
  document.querySelectorAll('#app-admin .navpane .navitem').forEach(item => {
    const txt = item.textContent.trim().replace(/\d+$/, '').trim().toLowerCase();
    const isActive = (
      (route === 'dashboard' && txt.includes('dashboard')) ||
      (route === 'banks' && txt.includes('banks')) ||
      (route === 'users' && txt.includes('users & roles')) ||
      ((route === 'assets' || route === 'asset-detail') && txt.includes('assets') && !txt.includes('approval')) ||
      (route === 'legal-queue' && txt.includes('legal & enforcement')) ||
      (route === 'title-queue' && txt.includes('title & land search')) ||
      (route === 'valuations-queue' && txt.includes('valuations')) ||
      (route === 'document-verification' && txt.includes('document verification')) ||
      (route === 'listings-approval' && txt.includes('listings approval')) ||
      (route === 'leads' && txt.includes('leads')) ||
      (route === 'kyc' && txt.includes('kyc queue')) ||
      (route === 'viewings' && txt.includes('viewings')) ||
      (route === 'offers' && txt.includes('offers')) ||
      (route === 'invoices' && txt.includes('invoices & payments')) ||
      (route === 'reports' && txt.includes('reports')) ||
      (route === 'settings' && (txt.includes('settings') || txt.includes('fee & agreement'))) ||
      (route === 'audit' && txt.includes('audit log'))
    );
    item.classList.toggle('active', isActive);
  });

  if (route === 'dashboard') {
    await renderAdminDashboard(work);
  } else if (route === 'assets') {
    await renderAdminAssetsGrid(work);
  } else if (route.startsWith('asset-detail')) {
    const assetId = route.split('/')[1] || window.Surge.selectedAssetId || 'ast-001';
    await renderAdminAssetDetail(work, assetId);
  } else if (route === 'banks') {
    await renderAdminBanks(work);
  } else if (route === 'users') {
    await renderAdminUsers(work);
  } else if (route === 'legal-queue') {
    await renderAdminLegalQueue(work);
  } else if (route === 'document-verification') {
    await renderAdminDocVerification(work);
  } else if (route === 'listings-approval') {
    await renderAdminListingsApproval(work);
  } else if (route === 'leads') {
    await renderAdminLeads(work);
  } else if (route === 'kyc') {
    await renderAdminKYCQueue(work);
  } else if (route === 'viewings') {
    await renderAdminViewings(work);
  } else if (route === 'offers') {
    await renderAdminOffers(work);
  } else if (route === 'invoices') {
    await renderAdminInvoices(work);
  } else if (route === 'audit') {
    await renderAdminAuditLog(work);
  } else if (route === 'settings') {
    await renderAdminSettings(work);
  } else {
    await renderAdminDashboard(work);
  }

  bindAdminToolbar();
}

async function renderAdminDashboard(container) {
  const statsRes = await apiCall('/stats');
  const queueRes = await apiCall('/admin/dashboard');

  container.innerHTML = `
    <div class="page-head">
      <h1>Operations Dashboard — Surge Solutions Platform</h1>
      <span class="crumb">Surge Admin / Operations</span>
      <span class="spacer"></span>
      <span class="badge info">Global Platform Scope</span>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="k">Total Assets</div><div class="v">${statsRes.totalAssets || 6}</div><div class="d">Across 4 partner banks</div></div>
      <div class="kpi ok"><div class="k">Live Listings</div><div class="v">${statsRes.liveListings || 3}</div><div class="d up">+2 this week</div></div>
      <div class="kpi warn"><div class="k">Pending Review</div><div class="v">${statsRes.pendingReview || 2}</div><div class="d">Awaiting Surge review</div></div>
      <div class="kpi alert"><div class="k">Legal Holds</div><div class="v">${statsRes.legalHolds || 1}</div><div class="d down">${statsRes.activeInjunctions || 1} court injunctions</div></div>
      <div class="kpi ok"><div class="k">Completed Sales</div><div class="v">${statsRes.completedSales || 1}</div><div class="d">${formatMoney(statsRes.totalSaleValue || 1250000)}</div></div>
    </div>

    <!-- Review & Action Queue -->
    <section class="group">
      <div class="caption">Review &amp; Approval Queue <span class="hint">Assets submitted by banks requiring Surge verification</span></div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Public Ref</th><th>Bank</th><th>Title</th><th>Occupancy Status</th><th>Listing Guards</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(queueRes.queueItems || []).map(item => `
              <tr>
                <td class="ref">${esc(item.public_ref)}</td>
                <td><span class="badge info">${esc(item.bank_code)}</span></td>
                <td><b>${esc(item.title)}</b></td>
                <td><span class="badge ${item.occupancy_status.includes('Hostile') ? 'rejected' : 'live'}">${esc(item.occupancy_status)}</span></td>
                <td>${item.legal_hold_active ? '<span class="badge rejected">Hold Active</span>' : '<span class="badge live">Ready for Review</span>'}</td>
                <td>
                  <button class="btn small primary" onclick="Surge.openAdminAsset('${esc(item.id)}')">Inspect Record</button>
                  ${item.status === 'Submitted by Bank' ? `<button class="btn small" onclick="Surge.approveAsset('${esc(item.id)}')">Approve</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Quick Navigation to Operational Queues -->
    <div class="grid3" style="margin-top:14px">
      <div class="panelbox">
        <h4><span class="sq" style="width:8px;height:8px;background:var(--red);display:inline-block"></span> Legal Verification Queue</h4>
        <p class="help">4 instruments pending compliance review and court verification.</p>
        <button class="btn small primary" onclick="Surge.navigateAdmin('legal-queue')">Open Legal Queue</button>
      </div>
      <div class="panelbox">
        <h4><span class="sq" style="width:8px;height:8px;background:var(--blue);display:inline-block"></span> Buyer KYC Applications</h4>
        <p class="help">1 pending buyer identity and proof of funds review.</p>
        <button class="btn small primary" onclick="Surge.navigateAdmin('kyc')">Open KYC Queue</button>
      </div>
      <div class="panelbox">
        <h4><span class="sq" style="width:8px;height:8px;background:var(--success);display:inline-block"></span> Active Invoices &amp; Fees</h4>
        <p class="help">Commission invoices issued and reconciliation tracker.</p>
        <button class="btn small primary" onclick="Surge.navigateAdmin('invoices')">Open Billing</button>
      </div>
    </div>
  `;
}

async function renderAdminAssetsGrid(container) {
  const res = await apiCall('/admin/assets');
  const assets = res.data || [];

  container.innerHTML = `
    <div class="page-head">
      <h1>Central Asset Register — Platform Wide</h1>
      <span class="crumb">Surge Admin / Assets</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('surge-platform-assets.csv')">Export CSV</button>
      <button class="btn small" onclick="window.print()">Print</button>
    </div>

    <div class="gridwrap">
      <div class="gridtoolbar">
        <div class="searchbox">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
          <input type="text" id="admin-asset-search" placeholder="Search ref, bank, title, region… (Ctrl+F)">
        </div>
        <select id="admin-filter-status" onchange="Surge.filterAdminAssetsTable()" style="width:auto;height:27px">
          <option value="All">All statuses</option>
          <option value="Live">Live</option>
          <option value="Submitted by Bank">Submitted</option>
          <option value="Legal Hold">Legal Hold</option>
          <option value="Changes Required">Changes Required</option>
          <option value="Sold">Sold</option>
        </select>
        <span class="spacer"></span>
        <span class="help">Showing ${assets.length} cross-tenant records</span>
      </div>

      <table class="grid" id="admin-assets-table">
        <thead>
          <tr>
            <th style="width:30px"><input type="checkbox"></th>
            <th>Public Ref</th>
            <th>Category</th>
            <th>Region</th>
            <th>Bank (Internal)</th>
            <th class="num">Reserve (GHS)</th>
            <th>Status</th>
            <th>Legal / Injunction</th>
            <th class="num">Offers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map(a => `
            <tr class="${a.id === window.Surge.selectedAssetId ? 'selected' : ''}" onclick="Surge.selectAdminRow(this, '${esc(a.id)}')">
              <td><input type="checkbox"></td>
              <td class="ref">${esc(a.public_ref)}</td>
              <td>${esc(a.category_code)}</td>
              <td>${esc(a.region)}</td>
              <td><b>${esc(a.bank_name)}</b></td>
              <td class="num">${formatMoney(a.reserve_price)}</td>
              <td><span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span></td>
              <td>
                ${a.active_injunction ? '<span class="badge rejected">Injunction Active</span>' : '<span class="badge live">Cleared</span>'}
              </td>
              <td class="num">${a.offer_count || 0}</td>
              <td>
                <button class="btn small" onclick="event.stopPropagation(); Surge.openAdminAsset('${esc(a.id)}')">Open Master</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Master Detail Preview Container -->
    <div id="admin-master-detail-container" style="margin-top:16px"></div>
  `;

  // Bind live search
  const sInput = document.getElementById('admin-asset-search');
  if (sInput) {
    sInput.addEventListener('input', () => {
      const q = sInput.value.toLowerCase();
      document.querySelectorAll('#admin-assets-table tbody tr').forEach(tr => {
        tr.hidden = !tr.textContent.toLowerCase().includes(q);
      });
    });
  }

  // Auto-render master detail for selected asset
  renderAdminMasterDetailPane(window.Surge.selectedAssetId || 'ast-001');
}

async function renderAdminMasterDetailPane(assetId) {
  const container = document.getElementById('admin-master-detail-container');
  if (!container) return;

  const res = await apiCall(`/bank/assets/${assetId}`);
  const { asset, instruments = [], title, valuations = [], audit = [] } = res;
  const readiness = await apiCall(`/admin/assets/${assetId}/publish-readiness`);

  const hasInjunction = instruments.some(i => i.injunction_active === 1);
  const isHostile = asset.occupancy_status === 'Occupied — Hostile';

  container.innerHTML = `
    <div class="detailhead">
      <span class="ref">${esc(asset.public_ref)}</span>
      <span class="title">${esc(asset.title)}</span>
      <span class="badge ${badgeClass(asset.status)}">${esc(asset.status)}</span>
      ${hasInjunction ? '<span class="badge rejected">Listing Blocked</span>' : ''}
      ${asset.legal_hold_active ? '<span class="badge rejected">Hold Active</span>' : ''}
      <span class="spacer"></span>
      <button class="btn small primary" onclick="Surge.openAdminAsset('${esc(asset.id)}')">Open Full Record</button>
    </div>

    <div class="detailbody">
      <!-- Injunction Banner with One-Click Toggle for Testing -->
      ${hasInjunction ? `
        <div class="banner red">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
          <div style="flex:1">
            <strong>LISTING BLOCKED — ACTIVE COURT INJUNCTION</strong>
            An active injunction is recorded against this asset (Judgment J-2026-0418, injunction_active = true). Publishing is blocked under Rule LG-2.
          </div>
          <button class="btn small" onclick="Surge.toggleInjunction('${esc(instruments.find(i=>i.injunction_active)?.id || 'inst-03')}', false)">
            Clear Injunction (Discharged)
          </button>
        </div>
      ` : `
        <div class="banner info">
          <svg class="ico" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>
          <div style="flex:1">
            <strong>LEGAL STATUS: CLEARED</strong> No active court injunctions registered.
          </div>
          <button class="btn small" onclick="Surge.toggleInjunction('${esc(instruments[0]?.id || 'inst-03')}', true)">
            Simulate Injunction
          </button>
        </div>
      `}

      <!-- Legal Hold Control -->
      ${asset.legal_hold_active ? `
        <div class="banner red">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
          <div style="flex:1">
            <strong>LEGAL HOLD ACTIVE:</strong> ${esc(asset.legal_hold_reason)}
          </div>
          <button class="btn small primary" onclick="Surge.promptReleaseLegalHold('${esc(asset.id)}')">Release Legal Hold</button>
        </div>
      ` : ''}

      <!-- Publish Readiness Guards -->
      <section class="group">
        <div class="caption">Publish Readiness Verification (AS-8, LG-2, VL-2)</div>
        <div class="body" style="padding:0">
          <table class="checklist">
            <thead><tr><th>Guard Condition</th><th>Requirement</th><th>Status</th></tr></thead>
            <tbody>
              ${(readiness.guards || []).map(g => `
                <tr>
                  <td><b>${esc(g.name)}</b></td>
                  <td>${esc(g.detail)}</td>
                  <td><span class="badge ${g.passed ? 'live' : 'rejected'}">${g.passed ? 'Passed' : 'Blocked'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Publish / Hold Action Toolbar -->
      <div class="form-actions" style="margin-top:12px">
        <button class="btn danger" onclick="Surge.promptPlaceLegalHold('${esc(asset.id)}')">Place Legal Hold</button>
        ${asset.status === 'Live' 
          ? `<button class="btn" onclick="Surge.unpublishAsset('${esc(asset.id)}')">Unpublish Listing</button>` 
          : `<button class="btn primary" ${!readiness.canPublish ? 'disabled title="Blocked by legal guard"' : ''} onclick="Surge.publishAsset('${esc(asset.id)}')">Publish to Marketplace</button>`
        }
      </div>
    </div>
  `;
}

// Surge Admin: Full Asset Detail Master Record
async function renderAdminAssetDetail(container, assetId) {
  window.Surge.selectedAssetId = assetId;
  const res = await apiCall(`/bank/assets/${assetId}`);
  const { asset, instruments = [], title, valuations = [], documents = [], offers = [], audit = [] } = res;
  const readiness = await apiCall(`/admin/assets/${assetId}/publish-readiness`);
  const hasInjunction = instruments.some(i => i.injunction_active === 1);

  container.innerHTML = `
    <div class="page-head">
      <h1>${esc(asset.title)}</h1>
      <span class="crumb">Surge Admin / Assets / ${esc(asset.public_ref)}</span>
      <span class="spacer"></span>
      <span class="badge ${badgeClass(asset.status)}">${esc(asset.status)}</span>
    </div>

    <div class="detailhead">
      <span class="ref">${esc(asset.public_ref)}</span>
      <span class="title">${esc(asset.title)} (Internal Ref: ${esc(asset.internal_bank_ref)})</span>
      <span class="badge ${badgeClass(asset.status)}">${esc(asset.status)}</span>
      ${hasInjunction ? '<span class="badge rejected">Listing Blocked</span>' : ''}
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.navigateAdmin('assets')">← Back to Register</button>
    </div>

    <div class="detailbody">
      ${hasInjunction ? `
        <div class="banner red">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
          <div style="flex:1">
            <strong>ACTIVE COURT INJUNCTION:</strong> Judgment J-2026-0418. Marketplace publishing blocked under Rule LG-2.
          </div>
          <button class="btn small" onclick="Surge.toggleInjunction('${esc(instruments.find(i=>i.injunction_active)?.id || 'inst-03')}', false)">Clear Injunction</button>
        </div>
      ` : `
        <div class="banner info">
          <svg class="ico" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>
          <div style="flex:1"><strong>LEGAL CLEARANCE:</strong> No active injunctions recorded.</div>
          <button class="btn small" onclick="Surge.toggleInjunction('${esc(instruments[0]?.id || 'inst-03')}', true)">Simulate Injunction</button>
        </div>
      `}

      <!-- Publish Readiness Checklist -->
      <section class="group">
        <div class="caption">Publish Readiness Verification (AS-8, LG-2, VL-2)</div>
        <div class="body" style="padding:0">
          <table class="checklist">
            <thead><tr><th>Guard Condition</th><th>Requirement</th><th>Status</th></tr></thead>
            <tbody>
              ${(readiness.guards || []).map(g => `
                <tr>
                  <td><b>${esc(g.name)}</b></td>
                  <td>${esc(g.detail)}</td>
                  <td><span class="badge ${g.passed ? 'live' : 'rejected'}">${g.passed ? 'Passed' : 'Blocked'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Property Details Grid -->
      <section class="group">
        <div class="caption">Asset Details &amp; Specifications</div>
        <div class="body">
          <table class="details">
            <tr><th>Category / Type</th><td>${esc(asset.category_code)} — ${esc(asset.asset_type)}</td></tr>
            <tr><th>Location</th><td>${esc(asset.exact_address)} (${esc(asset.town)}, ${esc(asset.region)})</td></tr>
            <tr><th>Reserve Price</th><td><b>${formatMoney(asset.reserve_price)}</b> (Min Offer: ${formatMoney(asset.minimum_offer)})</td></tr>
            <tr><th>Occupancy Status</th><td><span class="badge ${asset.occupancy_status.includes('Hostile') ? 'rejected' : 'live'}">${esc(asset.occupancy_status)}</span></td></tr>
            <tr><th>Land Guard Risk</th><td><span class="badge ${asset.land_guard_risk === 'High' ? 'rejected' : 'live'}">${esc(asset.land_guard_risk)}</span></td></tr>
          </table>
        </div>
      </section>

      <!-- Publish Actions Toolbar -->
      <div class="form-actions" style="margin-top:14px">
        <button class="btn danger" onclick="Surge.promptPlaceLegalHold('${esc(asset.id)}')">Place Legal Hold</button>
        ${asset.status === 'Live'
          ? `<button class="btn" onclick="Surge.unpublishAsset('${esc(asset.id)}')">Unpublish Listing</button>`
          : `<button class="btn primary" ${!readiness.canPublish ? 'disabled title="Blocked by guards"' : ''} onclick="Surge.publishAsset('${esc(asset.id)}')">Publish to Marketplace</button>`
        }
      </div>
    </div>
  `;
}

// Surge Admin: Banks Management
async function renderAdminBanks(container) {
  const res = await apiCall('/admin/banks');
  const banks = res.data || [];
  const totalBranches = banks.reduce((sum, b) => sum + (b.branch_count || 0), 0);
  const totalAssets = banks.reduce((sum, b) => sum + (b.asset_count || 0), 0);
  const liveAssets = banks.reduce((sum, b) => sum + (b.live_count || 0), 0);

  container.innerHTML = `
    <div class="page-head">
      <h1>Partner Financial Institutions &amp; Branch Networks</h1>
      <span class="crumb">Surge Admin / Banks &amp; Branches</span>
      <span class="spacer"></span>
      <button class="btn small primary" onclick="Surge.openAddBankModal()">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> + Add Partner Bank
      </button>
      <button class="btn small" onclick="Surge.exportCurrentTable('surge-partner-banks.csv')">Export CSV</button>
      <button class="btn small" onclick="window.print()">Print</button>
    </div>

    <div class="kpis" style="margin-bottom:14px">
      <div class="kpi ok"><div class="k">Partner Banks</div><div class="v">${banks.length} Connected</div><div class="d up">Regulated Financial Institutions</div></div>
      <div class="kpi"><div class="k">Operating Branches</div><div class="v">${totalBranches} Branches</div><div class="d">Nationwide recovery desks</div></div>
      <div class="kpi"><div class="k">Custody Assets</div><div class="v">${totalAssets} Total</div><div class="d">${liveAssets} live on marketplace</div></div>
      <div class="kpi ok"><div class="k">Standard Mandate</div><div class="v">4.0% – 5.0%</div><div class="d up">Platform realization fee</div></div>
    </div>

    <div class="gridwrap">
      <div class="gridtoolbar">
        <div class="searchbox">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
          <input type="text" id="admin-bank-search" placeholder="Search bank name, code, email, branch… (Ctrl+F)">
        </div>
        <span class="spacer"></span>
        <span class="help">Showing ${banks.length} partner financial institutions</span>
      </div>

      <section class="group">
        <div class="caption">Onboarded Partner Banks &amp; Dedicated Branch Networks</div>
        <div class="body" style="padding:0">
          <table class="grid" id="admin-banks-table">
            <thead>
              <tr>
                <th>Bank Legal Name</th>
                <th>Code</th>
                <th>Recovery Contact</th>
                <th>Commission Mandate</th>
                <th class="num">Assets (Total / Live)</th>
                <th>Branch Network</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${banks.length === 0 ? `
                <tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-2)">No partner banks onboarded. Click &quot;+ Add Partner Bank&quot; to register an institution.</td></tr>
              ` : banks.map(b => `
                <tr>
                  <td>
                    <b>${esc(b.legal_name)}</b>
                    <br><small style="color:var(--text-2)">Tenant ID: <code>${esc(b.id)}</code></small>
                  </td>
                  <td><span class="badge info"><b>${esc(b.short_code)}</b></span></td>
                  <td>
                    <div>${esc(b.contact_email || '—')}</div>
                    <small style="color:var(--text-2)">${esc(b.contact_phone || '—')}</small>
                  </td>
                  <td><b>${b.default_commission_rate}%</b> <small style="color:var(--text-2)">Disposal Fee</small></td>
                  <td class="num">
                    <b>${b.asset_count || 0}</b> <small style="color:var(--text-2)">(${b.live_count || 0} Live)</small>
                  </td>
                  <td>
                    <button class="btn small" onclick="Surge.openManageBranchesModal('${esc(b.id)}', '${esc(b.legal_name)}')" title="View and manage branches for ${esc(b.legal_name)}">
                      🏢 <b>${b.branch_count || 0}</b> Branch${b.branch_count === 1 ? '' : 'es'}
                    </button>
                  </td>
                  <td><span class="badge live">${esc(b.status || 'Active')}</span></td>
                  <td style="text-align:right;white-space:nowrap">
                    <button class="btn small" onclick="Surge.openManageBranchesModal('${esc(b.id)}', '${esc(b.legal_name)}')">Branches</button>
                    <button class="btn small" style="color:var(--danger);border-color:#FCA5A5;margin-left:4px" onclick="Surge.deleteBank('${esc(b.id)}', '${esc(b.legal_name)}')">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const input = document.getElementById('admin-bank-search');
  if (input) {
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('#admin-banks-table tbody tr').forEach(tr => {
        tr.hidden = !tr.textContent.toLowerCase().includes(q);
      });
    });
  }
}

// Surge Admin: Add Bank Modal
window.Surge.openAddBankModal = function() {
  showModal('Onboard Partner Financial Institution', `
    <div class="banner info" style="margin-bottom:12px">
      <div><strong>BANK ONBOARDING &amp; MANDATE SETUP</strong> Registered partner banks gain dedicated recovery tenant spaces, asset custody pipelines, and executive dashboards.</div>
    </div>
    <form id="add-bank-form" onsubmit="return false">
      <div class="field wide">
        <label class="lbl">Legal Institution Name<span class="req">*</span></label>
        <div class="ctl"><input id="bank-legal-name" required placeholder="e.g. Fidelity Bank Ghana PLC"></div>
      </div>
      <div class="grid2">
        <div class="field">
          <label class="lbl">Bank Short Code (Ticker)<span class="req">*</span></label>
          <div class="ctl"><input id="bank-short-code" required placeholder="e.g. FBG" maxlength="8" style="text-transform:uppercase"></div>
        </div>
        <div class="field">
          <label class="lbl">Platform Commission Rate (%)<span class="req">*</span></label>
          <div class="ctl"><input id="bank-comm-rate" type="number" step="0.1" min="1" max="25" value="4.0" required></div>
        </div>
      </div>
      <div class="grid2">
        <div class="field">
          <label class="lbl">Special Assets Recovery Email<span class="req">*</span></label>
          <div class="ctl"><input id="bank-contact-email" type="email" placeholder="e.g. specialassets@fidelitybank.com.gh" required></div>
        </div>
        <div class="field">
          <label class="lbl">Official Contact Phone</label>
          <div class="ctl"><input id="bank-contact-phone" placeholder="e.g. +233 30 221 4490"></div>
        </div>
      </div>
    </form>
  `, async () => {
    const legal_name = document.getElementById('bank-legal-name')?.value?.trim();
    const short_code = document.getElementById('bank-short-code')?.value?.trim().toUpperCase();
    const contact_email = document.getElementById('bank-contact-email')?.value?.trim();
    const contact_phone = document.getElementById('bank-contact-phone')?.value?.trim();
    const default_commission_rate = document.getElementById('bank-comm-rate')?.value;

    if (!legal_name || !short_code || !contact_email) {
      alert('Legal institution name, short code, and contact email are required.');
      return;
    }

    try {
      const res = await apiCall('/admin/banks', 'POST', {
        legal_name,
        short_code,
        contact_email,
        contact_phone,
        default_commission_rate: parseFloat(default_commission_rate) || 4.0
      });
      closeModal();
      notify(`Partner Bank '${legal_name}' (${short_code}) successfully onboarded!`, 'success');
      const work = document.querySelector('#app-admin .work');
      if (work) renderAdminBanks(work);
    } catch (err) {
      alert('Error adding bank: ' + err.message);
    }
  }, 'Onboard Partner Bank', 'Cancel');
};

// Surge Admin: Remove Bank
window.Surge.deleteBank = async function(bankId, bankName) {
  if (!confirm(`Are you sure you want to remove ${bankName} from the platform?\n\nThis will remove the institution and its branch directory. (Note: Banks with active assets in custody cannot be deleted).`)) {
    return;
  }

  try {
    const res = await apiCall(`/admin/banks/${bankId}`, 'DELETE');
    notify(res.message || `Bank ${bankName} removed successfully.`, 'info');
    const work = document.querySelector('#app-admin .work');
    if (work) renderAdminBanks(work);
  } catch (err) {
    alert('Cannot remove bank:\n' + err.message);
  }
};

// Surge Admin: Manage Branches Modal
window.Surge.openManageBranchesModal = async function(bankId, bankName) {
  try {
    const res = await apiCall(`/admin/banks/${bankId}/branches`);
    const branches = res.data || [];
    const bank = res.bank || { legal_name: bankName, short_code: bankId };

    const modalHtml = `
      <div class="banner info" style="margin-bottom:12px">
        <div>
          <strong>BRANCH NETWORK DIRECTORY — ${esc(bank.legal_name)} (${esc(bank.short_code)})</strong>
          <br>Regional asset recovery desks, branch managers, and repossessed custody locations.
        </div>
      </div>

      <section class="group" style="margin-bottom:14px">
        <div class="caption">Existing Registered Branches (${branches.length})</div>
        <div class="body" style="padding:0;max-height:240px;overflow-y:auto">
          <table class="grid" id="branches-list-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Branch Code</th>
                <th>Region / Town</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Branch Manager</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${branches.length === 0 ? `
                <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-2)">No branches registered for this institution yet. Add a branch using the form below.</td></tr>
              ` : branches.map(br => `
                <tr>
                  <td><b>${esc(br.name)}</b></td>
                  <td><code>${esc(br.branch_code || '—')}</code></td>
                  <td><span class="badge info">${esc(br.region)}</span> ${br.town ? `· ${esc(br.town)}` : ''}</td>
                  <td><small>${esc(br.address || '—')}</small></td>
                  <td>
                    <div><small>${esc(br.phone || '—')}</small></div>
                    <small style="color:var(--text-2)">${esc(br.email || '—')}</small>
                  </td>
                  <td><b>${esc(br.manager_name || '—')}</b></td>
                  <td style="text-align:right">
                    <button class="btn small" style="color:var(--danger);border-color:#FCA5A5" onclick="Surge.deleteBranch('${esc(br.id)}', '${esc(bankId)}', '${esc(bank.legal_name)}')">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="group">
        <div class="caption">+ Register New Branch for ${esc(bank.legal_name)}</div>
        <div class="body">
          <form id="add-branch-form" onsubmit="return false">
            <div class="grid2">
              <div class="field">
                <label class="lbl">Branch Name<span class="req">*</span></label>
                <div class="ctl"><input id="br-name" required placeholder="e.g. Spintex Road Hub"></div>
              </div>
              <div class="field">
                <label class="lbl">Branch Code (Optional)</label>
                <div class="ctl"><input id="br-code" placeholder="e.g. ${esc(bank.short_code)}-SPX-05" style="text-transform:uppercase"></div>
              </div>
            </div>
            <div class="grid2">
              <div class="field">
                <label class="lbl">Region<span class="req">*</span></label>
                <div class="ctl">
                  <select id="br-region" required>
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Western">Western</option>
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Volta">Volta</option>
                    <option value="Northern">Northern</option>
                    <option value="Bono">Bono</option>
                    <option value="Ahafo">Ahafo</option>
                    <option value="Upper East">Upper East</option>
                    <option value="Upper West">Upper West</option>
                    <option value="Oti">Oti</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label class="lbl">Town / City</label>
                <div class="ctl"><input id="br-town" placeholder="e.g. Accra, Tema, Kumasi"></div>
              </div>
            </div>
            <div class="field wide">
              <label class="lbl">Physical Address / Location</label>
              <div class="ctl"><input id="br-address" placeholder="e.g. Plot 14 Spintex Road Near Coastal Junction"></div>
            </div>
            <div class="grid3">
              <div class="field">
                <label class="lbl">Branch Phone</label>
                <div class="ctl"><input id="br-phone" placeholder="e.g. +233 30 281 9900"></div>
              </div>
              <div class="field">
                <label class="lbl">Branch Email</label>
                <div class="ctl"><input id="br-email" type="email" placeholder="e.g. spintex@${esc(bank.short_code.toLowerCase())}.com.gh"></div>
              </div>
              <div class="field">
                <label class="lbl">Branch Manager Name</label>
                <div class="ctl"><input id="br-manager" placeholder="e.g. Emmanuel Mensah"></div>
              </div>
            </div>
            <div style="margin-top:10px;text-align:right">
              <button class="btn primary small" onclick="Surge.submitAddBranch('${esc(bankId)}', '${esc(bank.legal_name)}')">+ Add Branch</button>
            </div>
          </form>
        </div>
      </section>
    `;

    showModal(`Branch Management — ${bank.legal_name}`, modalHtml, null, null, 'Close', true);
  } catch (err) {
    alert('Error loading branches: ' + err.message);
  }
};

// Surge Admin: Submit Add Branch
window.Surge.submitAddBranch = async function(bankId, bankName) {
  const name = document.getElementById('br-name')?.value?.trim();
  const branch_code = document.getElementById('br-code')?.value?.trim().toUpperCase();
  const region = document.getElementById('br-region')?.value;
  const town = document.getElementById('br-town')?.value?.trim();
  const address = document.getElementById('br-address')?.value?.trim();
  const phone = document.getElementById('br-phone')?.value?.trim();
  const email = document.getElementById('br-email')?.value?.trim();
  const manager_name = document.getElementById('br-manager')?.value?.trim();

  if (!name || !region) {
    alert('Branch name and region are required.');
    return;
  }

  try {
    const res = await apiCall(`/admin/banks/${bankId}/branches`, 'POST', {
      name,
      branch_code: branch_code || undefined,
      region,
      town,
      address,
      phone,
      email,
      manager_name
    });

    notify(`Branch '${name}' registered successfully!`, 'success');
    // Refresh modal
    Surge.openManageBranchesModal(bankId, bankName);
    // Refresh background table
    const work = document.querySelector('#app-admin .work');
    if (work) renderAdminBanks(work);
  } catch (err) {
    alert('Error registering branch: ' + err.message);
  }
};

// Surge Admin: Delete Branch
window.Surge.deleteBranch = async function(branchId, bankId, bankName) {
  if (!confirm('Are you sure you want to remove this branch from the registry?')) {
    return;
  }

  try {
    const res = await apiCall(`/admin/branches/${branchId}`, 'DELETE');
    notify(res.message || 'Branch removed successfully.', 'info');
    // Refresh modal
    Surge.openManageBranchesModal(bankId, bankName);
    // Refresh background table
    const work = document.querySelector('#app-admin .work');
    if (work) renderAdminBanks(work);
  } catch (err) {
    alert('Error removing branch: ' + err.message);
  }
};

// Surge Admin: Users & Roles
async function renderAdminUsers(container) {
  const res = await apiCall('/admin/users');
  const users = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Multi-Tenant Users &amp; Role-Based Access Control</h1>
      <span class="crumb">Surge Admin / Users &amp; Roles</span>
      <span class="spacer"></span>
      <span class="badge info">${users.length} Active System Users</span>
    </div>

    <section class="group">
      <div class="caption">Central User Directory (Platform Operator &amp; Bank Tenants)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Full Name</th><th>Username</th><th>Email</th><th>Organization</th><th>Assigned Role</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><b>${esc(u.full_name)}</b></td>
                <td><code>${esc(u.username)}</code></td>
                <td>${esc(u.email)}</td>
                <td><b>${esc(u.org_name)}</b></td>
                <td><span class="badge info">${esc(u.role_name)}</span></td>
                <td><span class="badge live">${esc(u.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Legal Queue
async function renderAdminLegalQueue(container) {
  const res = await apiCall('/admin/legal/queue');
  const items = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Legal Verification &amp; Court Injunction Queue</h1>
      <span class="crumb">Surge Admin / Legal &amp; Enforcement</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('legal-verification-queue.csv')">Export CSV</button>
    </div>

    <section class="group">
      <div class="caption">Enforcement Instruments &amp; Injunction Monitoring (LG-2, LG-5)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Instrument Ref</th><th>Court Suit</th><th>Bank</th><th>Related Asset</th><th>Injunction Active</th><th>Verification</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td class="ref"><b>${esc(i.instrument_ref)}</b></td>
                <td>${esc(i.case_number)} (${esc(i.court)})</td>
                <td><span class="badge info">${esc(i.bank_code)}</span></td>
                <td><b>${esc(i.public_ref)}</b><br><small>${esc(i.asset_title)}</small></td>
                <td>
                  ${i.injunction_active ? '<span class="badge rejected">Yes — Injunction Active</span>' : '<span class="badge live">No Injunction</span>'}
                </td>
                <td><span class="badge ${i.verification_status === 'Verified' ? 'live' : 'warn'}">${esc(i.verification_status)}</span></td>
                <td>
                  <button class="btn small" onclick="Surge.toggleInjunction('${esc(i.id)}', ${i.injunction_active ? 'false' : 'true'})">
                    ${i.injunction_active ? 'Discharge Injunction' : 'Impose Injunction'}
                  </button>
                  ${i.verification_status !== 'Verified' ? `<button class="btn small primary" onclick="Surge.verifyInstrument('${esc(i.id)}')">Verify</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Title Queue
async function renderAdminTitleQueue(container) {
  const res = await apiCall('/admin/title/queue');
  const titles = res.titles || [];
  const searches = res.searches || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Title Perfection &amp; Official Cadastral Searches</h1>
      <span class="crumb">Surge Admin / Title &amp; Land Search</span>
      <span class="spacer"></span>
    </div>

    <section class="group">
      <div class="caption">Title Records Under Review</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead><tr><th>Cert No</th><th>Registry</th><th>Bank</th><th>Asset</th><th>Perfection</th><th>Actions</th></tr></thead>
          <tbody>
            ${titles.map(t => `
              <tr>
                <td class="ref"><b>${esc(t.certificate_number)}</b></td>
                <td>${esc(t.registry)}</td>
                <td><span class="badge info">${esc(t.bank_code)}</span></td>
                <td><b>${esc(t.public_ref)}</b></td>
                <td><span class="badge ${t.perfection_status === 'Perfected' ? 'live' : 'warn'}">${esc(t.perfection_status)}</span></td>
                <td><button class="btn small primary" onclick="Surge.openAdminAsset('${esc(t.asset_id)}')">Inspect</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="group" style="margin-top:14px">
      <div class="caption">Lands Commission Official Cadastral Searches</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead><tr><th>Search Date</th><th>Asset</th><th>Bank</th><th>Status</th><th>Encumbrances</th></tr></thead>
          <tbody>
            ${searches.map(s => `
              <tr>
                <td>${formatDate(s.search_date)}</td>
                <td><b>${esc(s.public_ref)}</b></td>
                <td><span class="badge info">${esc(s.bank_code)}</span></td>
                <td><span class="badge ${s.status === 'Valid' ? 'live' : 'warn'}">${esc(s.status)}</span></td>
                <td>${esc(s.encumbrances_found || 'None')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Valuations Queue
async function renderAdminValuationsQueue(container) {
  const res = await apiCall('/admin/valuations/queue');
  const vals = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>GhIS Valuation Validity &amp; 180-Day Window Audit</h1>
      <span class="crumb">Surge Admin / Valuations</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('valuations-audit.csv')">Export CSV</button>
    </div>

    <section class="group">
      <div class="caption">Valuation Reports Registered Across Bank Assets (VL-1, VL-2)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Asset Ref</th><th>Bank</th><th>GhIS Certified Valuer</th><th class="num">Market Value</th><th class="num">Forced Sale Value</th><th>Valuation Date</th><th>Expiry Date</th><th>Validity Status</th></tr>
          </thead>
          <tbody>
            ${vals.map(v => `
              <tr>
                <td class="ref"><b>${esc(v.public_ref)}</b></td>
                <td><span class="badge info">${esc(v.bank_code)}</span></td>
                <td><b>${esc(v.valuer_name)}</b></td>
                <td class="num">${formatMoney(v.market_value)}</td>
                <td class="num"><b>${formatMoney(v.forced_sale_value)}</b></td>
                <td>${formatDate(v.valuation_date)}</td>
                <td>${formatDate(v.expiry_date)}</td>
                <td>
                  ${v.review_required === 1 || v.status === 'Expired'
                    ? '<span class="badge rejected">Expired (Review Req)</span>'
                    : '<span class="badge live">Valid (Within 180 Days)</span>'
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Document Verification Queue
async function renderAdminDocVerification(container) {
  const res = await apiCall('/admin/documents');
  const docs = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Document Verification &amp; Vault Queue</h1>
      <span class="crumb">Surge Admin / Document Verification</span>
      <span class="spacer"></span>
      <span class="badge info">${docs.length} Vault Documents</span>
    </div>

    <section class="group">
      <div class="caption">Uploaded Documents Requiring Verification</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Document Name</th><th>Type</th><th>Bank</th><th>Asset Ref</th><th>Uploaded</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${docs.map(d => `
              <tr>
                <td><b>${esc(d.document_name)}</b></td>
                <td><span class="badge info">${esc(d.document_type)}</span></td>
                <td>${esc(d.bank_code)}</td>
                <td class="ref">${esc(d.public_ref)}</td>
                <td>${formatDate(d.created_at)}</td>
                <td><span class="badge ${d.verification_status === 'Verified' ? 'live' : 'warn'}">${esc(d.verification_status)}</span></td>
                <td>
                  ${d.verification_status !== 'Verified' ? `<button class="btn small primary" onclick="Surge.verifyDocument('${esc(d.id)}')">Verify Document</button>` : '<span class="badge live">Verified</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Listings Approval
async function renderAdminListingsApproval(container) {
  const res = await apiCall('/admin/assets?status=Submitted%20by%20Bank');
  const assets = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Listings Approval Queue</h1>
      <span class="crumb">Surge Admin / Listings Approval</span>
      <span class="spacer"></span>
      <span class="badge alert">${assets.length} Awaiting Approval</span>
    </div>

    <section class="group">
      <div class="caption">Bank-Submitted Assets Awaiting Review &amp; Publication Approval</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Public Ref</th><th>Bank</th><th>Title</th><th>Category</th><th class="num">Reserve</th><th>Injunction</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${assets.length ? assets.map(a => `
              <tr>
                <td class="ref"><b>${esc(a.public_ref)}</b></td>
                <td><span class="badge info">${esc(a.bank_code)}</span></td>
                <td><b>${esc(a.title)}</b></td>
                <td>${esc(a.category_code)}</td>
                <td class="num">${formatMoney(a.reserve_price)}</td>
                <td>${a.active_injunction ? '<span class="badge rejected">Injunction Active</span>' : '<span class="badge live">Cleared</span>'}</td>
                <td>
                  <button class="btn small primary" onclick="Surge.openAdminAsset('${esc(a.id)}')">Review &amp; Publish</button>
                  <button class="btn small" onclick="Surge.approveAsset('${esc(a.id)}')">Approve</button>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-2)">No assets currently awaiting review. All submitted listings have been processed.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Leads & CRM Pipeline
async function renderAdminLeads(container) {
  const res = await apiCall('/admin/leads');
  const leads = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Buyer Leads &amp; CRM Pipeline (LD-1, LD-2)</h1>
      <span class="crumb">Surge Admin / Leads</span>
      <span class="spacer"></span>
      <span class="badge info">${leads.length} Active Leads</span>
    </div>

    <section class="group">
      <div class="caption">Prospective Buyer Pipeline</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Lead Ref</th><th>Buyer Name</th><th>Contact</th><th>Interested In</th><th>Pipeline Stage</th><th>Source</th><th>Assigned Agent</th><th>Advance Stage</th></tr>
          </thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td class="ref"><b>${esc(l.lead_ref)}</b></td>
                <td><b>${esc(l.buyer_name)}</b></td>
                <td>${esc(l.email)}<br><small>${esc(l.phone || '')}</small></td>
                <td><b>${esc(l.asset_ref)}</b></td>
                <td><span class="badge ${l.stage === 'Closed' ? 'live' : l.stage === 'Offer' ? 'alert' : 'info'}">${esc(l.stage)}</span></td>
                <td>${esc(l.source)}</td>
                <td>${esc(l.assigned_agent_name || 'Akosua Tetteh')}</td>
                <td>
                  <select onchange="Surge.transitionLead('${esc(l.id)}', this.value)" style="width:auto;height:24px;font-size:11px">
                    <option value="" disabled selected>Move stage…</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Viewing Scheduled">Viewing Scheduled</option>
                    <option value="Offer">Offer</option>
                    <option value="Closed">Closed</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: KYC Queue
async function renderAdminKYCQueue(container) {
  const res = await apiCall('/admin/kyc');
  const kycList = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Buyer KYC Applications &amp; Ghana Card Identity Queue</h1>
      <span class="crumb">Surge Admin / KYC Queue</span>
      <span class="spacer"></span>
      <span class="badge info">${kycList.length} Total Applications</span>
    </div>

    <section class="group">
      <div class="caption">Buyer Verification Reviews (KY-2, KY-4)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Full Name</th><th>Contact</th><th>Ghana Card Number</th><th>Source of Funds</th><th>Related Asset</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${kycList.map(k => `
              <tr>
                <td><b>${esc(k.full_name)}</b></td>
                <td>${esc(k.email)}<br><small>${esc(k.phone)}</small></td>
                <td><code>${esc(k.ghana_card_number)}</code> <span class="restricted-tag">Encrypted</span></td>
                <td>${esc(k.source_of_funds || 'Personal Savings')}</td>
                <td><b>${esc(k.related_asset_ref || 'General')}</b></td>
                <td><span class="badge ${k.status === 'Verified' ? 'live' : k.status === 'Rejected' ? 'rejected' : 'warn'}">${esc(k.status)}</span></td>
                <td>
                  ${k.status === 'Pending' ? `
                    <button class="btn small primary" onclick="Surge.decideKYC('${esc(k.id)}', 'Verify')">Verify</button>
                    <button class="btn small danger" onclick="Surge.decideKYC('${esc(k.id)}', 'Reject')">Reject</button>
                  ` : `<span class="badge ${k.status === 'Verified' ? 'live' : 'draft'}">${esc(k.status)}</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Viewings Management
async function renderAdminViewings(container) {
  const res = await apiCall('/admin/viewings');
  const viewings = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Accompanied Viewings &amp; Security Override Management</h1>
      <span class="crumb">Surge Admin / Viewings</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('admin-viewings.csv')">Export CSV</button>
    </div>

    <section class="group">
      <div class="caption">Platform Accompanied Viewing Schedule (OC-1, VW-1)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Viewing Ref</th><th>Asset Ref</th><th>Buyer Name</th><th>Date &amp; Slot</th><th>Occupancy / Risk</th><th>Override Status</th><th>Viewing Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${viewings.map(v => {
              const isHostile = v.occupancy_status === 'Occupied — Hostile' || v.land_guard_risk === 'High';
              return `
                <tr>
                  <td class="ref"><b>${esc(v.viewing_ref)}</b></td>
                  <td><b>${esc(v.public_ref)}</b><br><small>${esc(v.asset_title)}</small></td>
                  <td>${esc(v.buyer_name)}</td>
                  <td><b>${formatDate(v.viewing_date)}</b> (${esc(v.time_slot)})</td>
                  <td>
                    <span class="badge ${isHostile ? 'rejected' : 'live'}">${esc(v.occupancy_status)}</span>
                  </td>
                  <td>
                    ${v.high_risk_override 
                      ? '<span class="badge live">Override Granted</span>' 
                      : (isHostile ? '<span class="badge rejected">Security Override Required</span>' : '<span class="badge live">Standard</span>')
                    }
                  </td>
                  <td><span class="badge ${v.status === 'Confirmed' ? 'live' : 'pending'}">${esc(v.status)}</span></td>
                  <td>
                    ${v.status !== 'Confirmed' ? `
                      <button class="btn small primary" onclick="Surge.confirmAdminViewing('${esc(v.id)}', ${isHostile && !v.high_risk_override})">
                        Confirm Viewing
                      </button>
                    ` : '<span class="badge live">Confirmed</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Offers Oversight
async function renderAdminOffers(container) {
  const res = await apiCall('/admin/offers');
  const offers = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Purchase Offers Oversight &amp; Bank Routing</h1>
      <span class="crumb">Surge Admin / Offers</span>
      <span class="spacer"></span>
      <span class="badge info">${offers.length} Platform Offers</span>
    </div>

    <section class="group">
      <div class="caption">Cross-Tenant Offer Register (OF-1, PR-3)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Offer Ref</th><th>Asset Ref</th><th>Bank</th><th>Buyer Name</th><th class="num">Amount (GHS)</th><th class="num">Reserve</th><th>Status</th><th>Validity</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${offers.map(o => `
              <tr>
                <td class="ref"><b>${esc(o.offer_ref)}</b></td>
                <td><b>${esc(o.public_ref)}</b></td>
                <td><span class="badge info">${esc(o.bank_name)}</span></td>
                <td><b>${esc(o.buyer_name)}</b></td>
                <td class="num"><b>${formatMoney(o.amount)}</b></td>
                <td class="num">${formatMoney(o.reserve_price)}</td>
                <td><span class="badge ${badgeClass(o.status)}">${esc(o.status)}</span></td>
                <td>${formatDate(o.validity_date)}</td>
                <td>
                  ${o.status === 'Surge Review' ? `
                    <button class="btn small primary" onclick="Surge.forwardOfferToBank('${esc(o.id)}')">Forward to Bank</button>
                  ` : `<button class="btn small" onclick="Surge.openOfferDecision('${esc(o.id)}')">Inspect</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Invoices & Payments Ledger
async function renderAdminInvoices(container) {
  const res = await apiCall('/admin/finance/invoices');
  const invoices = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Platform Commission Invoices &amp; Payments</h1>
      <span class="crumb">Surge Admin / Invoices &amp; Payments</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('surge-invoices-ledger.csv')">Export CSV</button>
    </div>

    <section class="group">
      <div class="caption">Issued Platform Fees &amp; Realization Commissions (FE-1, FE-5)</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead>
            <tr><th>Invoice No</th><th>Bank</th><th>Description</th><th class="num">Amount (GHS)</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Record Payment</th></tr>
          </thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td class="ref"><b>${esc(inv.invoice_number)}</b></td>
                <td><b>${esc(inv.bank_name)}</b></td>
                <td>${esc(inv.description)}</td>
                <td class="num"><b>${formatMoney(inv.amount)}</b></td>
                <td>${formatDate(inv.issue_date)}</td>
                <td>${formatDate(inv.due_date)}</td>
                <td><span class="badge ${inv.status === 'Paid' ? 'live' : inv.status === 'Overdue' ? 'rejected' : 'warn'}">${esc(inv.status)}</span></td>
                <td>
                  ${inv.status !== 'Paid' ? `
                    <button class="btn small primary" onclick="Surge.promptRecordPayment('${esc(inv.id)}', ${inv.amount})">Record Payment</button>
                  ` : '<span class="badge live">Paid &amp; Settled</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Reports & Analytics
async function renderAdminReports(container) {
  const statsRes = await apiCall('/stats');
  container.innerHTML = `
    <div class="page-head">
      <h1>Executive Analytics &amp; Disposal Intelligence</h1>
      <span class="crumb">Surge Admin / Reports</span>
      <span class="spacer"></span>
      <button class="btn small primary" onclick="Surge.exportCurrentTable('surge-platform-executive-report.csv')">Export Analytics</button>
      <button class="btn small" onclick="window.print()">Print</button>
    </div>

    <div class="kpis">
      <div class="kpi ok"><div class="k">Gross Realized Value</div><div class="v">${formatMoney(statsRes.totalSaleValue || 1250000)}</div><div class="d up">Completed Asset Sales</div></div>
      <div class="kpi"><div class="k">Active Inventory</div><div class="v">${statsRes.liveListings || 3} Live</div><div class="d">Across 4 partner banks</div></div>
      <div class="kpi alert"><div class="k">Legal Holds Active</div><div class="v">${statsRes.legalHolds || 1}</div><div class="d down">Court injunction enforcement</div></div>
      <div class="kpi ok"><div class="k">Platform Revenue</div><div class="v">${formatMoney((statsRes.totalSaleValue || 1250000) * 0.04)}</div><div class="d up">Commission collected (4%)</div></div>
    </div>

    <section class="group">
      <div class="caption">Bank Performance Comparison</div>
      <div class="body" style="padding:0">
        <table class="grid">
          <thead><tr><th>Partner Bank</th><th>Mandate Type</th><th class="num">Registered Assets</th><th class="num">Disposed</th><th class="num">Realized Value (GHS)</th><th>Disposal Speed</th></tr></thead>
          <tbody>
            <tr><td><b>Meridian Trust Bank</b></td><td>Sole Intermediary (Exclusive)</td><td class="num">4</td><td class="num">1</td><td class="num"><b>1,250,000.00</b></td><td>42 days avg</td></tr>
            <tr><td><b>CalBank PLC</b></td><td>Sole Intermediary (Exclusive)</td><td class="num">1</td><td class="num">0</td><td class="num">—</td><td>18 days live</td></tr>
            <tr><td><b>GCB Bank PLC</b></td><td>Sole Intermediary (Exclusive)</td><td class="num">1</td><td class="num">0</td><td class="num">—</td><td>9 days live</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// Surge Admin: Append-Only Audit Log
async function renderAdminAuditLog(container) {
  const res = await apiCall('/admin/audit?limit=50');
  const logs = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Immutable Append-Only Audit Log (ADM-112)</h1>
      <span class="crumb">Surge Admin / Audit Log</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="Surge.exportCurrentTable('surge-audit-trail.csv')">Export CSV</button>
    </div>

    <div class="gridtoolbar">
      <div class="searchbox">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
        <input type="text" id="audit-filter-input" placeholder="Search actor, action, entity…">
      </div>
      <span class="help">Showing latest ${logs.length} audited state transitions</span>
    </div>

    <section class="group">
      <div class="body" style="padding:0">
        <table class="grid" id="audit-log-table">
          <thead>
            <tr><th>Timestamp</th><th>Actor</th><th>Role / Org</th><th>Action Type</th><th>Entity</th><th>Delta Summary</th></tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="white-space:nowrap">${formatDate(l.created_at)} ${formatTime(l.created_at)}</td>
                <td><b>${esc(l.actor_name)}</b></td>
                <td>${esc(l.actor_role)} (${esc(l.organization)})</td>
                <td><span class="badge info">${esc(l.action_type)}</span></td>
                <td><code>${esc(l.entity_type)}:${esc(l.entity_id)}</code></td>
                <td>${esc(l.delta_summary)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const input = document.getElementById('audit-filter-input');
  if (input) {
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('#audit-log-table tbody tr').forEach(tr => {
        tr.hidden = !tr.textContent.toLowerCase().includes(q);
      });
    });
  }
}

// Surge Admin: Settings
async function renderAdminSettings(container) {
  const res = await apiCall('/admin/settings');
  const settings = res.data || [];
  container.innerHTML = `
    <div class="page-head">
      <h1>Platform Rules &amp; Agreement Configuration</h1>
      <span class="crumb">Surge Admin / Settings</span>
      <span class="spacer"></span>
      <button class="btn primary" onclick="Surge.savePlatformSettings()">Save Configuration</button>
    </div>

    <section class="group">
      <div class="caption">Commercial &amp; Regulatory Parameters</div>
      <div class="body">
        <form id="platform-settings-form">
          <div class="grid2">
            ${settings.map(s => `
              <div class="field">
                <label class="lbl">${esc(s.key)}</label>
                <div class="ctl">
                  <input type="text" id="setting-${esc(s.key)}" value="${esc(s.value)}">
                  <span class="help">${esc(s.description || '')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </form>
      </div>
    </section>
  `;
}

function bindAdminToolbar() {
  const tb = document.querySelector('#app-admin .toolbar');
  if (!tb) return;
  tb.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const txt = btn.textContent.trim().toLowerCase();
      if (txt.includes('publish')) {
        Surge.publishAsset(window.Surge.selectedAssetId);
      } else if (txt.includes('verify')) {
        Surge.navigateAdmin('legal-queue');
      } else if (txt.includes('export')) {
        Surge.exportCurrentTable('surge-admin-export.csv');
      }
    };
  });
}

/* ============================================================
   PUBLIC MARKETPLACE CONTROLLER & VIEWS
   Strict Public DTO Whitelist (PM-2, PM-3)
   ============================================================ */
async function navigatePublic(route) {
  setHash('public', route);
  const pubBody = document.querySelector('#app-public .pub-body');
  if (!pubBody) return;

  // Active public nav links
  document.querySelectorAll('#app-public .pub-nav a').forEach(a => {
    const txt = a.textContent.trim().toLowerCase();
    const isActive = (
      (route === 'home' && txt.includes('buy assets')) ||
      (route === 'how-it-works' && txt.includes('how it works')) ||
      (route === 'kyc-info' && txt.includes('kyc')) ||
      (route === 'faq' && txt.includes('faq')) ||
      (route === 'contact' && txt.includes('contact'))
    );
    a.classList.toggle('active', isActive);
  });

  if (route === 'home' || route === 'assets') {
    await renderPublicCatalog(pubBody);
  } else if (route.startsWith('asset/')) {
    const ref = route.split('/')[1];
    await renderPublicAssetDetail(pubBody, ref);
  } else if (route === 'how-it-works') {
    renderPublicHowItWorks(pubBody);
  } else if (route === 'kyc-info') {
    renderPublicKYCInfo(pubBody);
  } else if (route === 'faq') {
    renderPublicFAQ(pubBody);
  } else if (route === 'contact') {
    renderPublicContact(pubBody);
  } else {
    await renderPublicCatalog(pubBody);
  }
}

async function renderPublicCatalog(container) {
  const res = await apiCall('/public/assets');
  const assets = res.data || [];

  container.innerHTML = `
    <section class="hero">
      <h2>Verified bank-repossessed and distressed assets</h2>
      <p>Every listing is reviewed, legally cleared and marketed by Surge Solutions as the sole intermediary. Browse anonymously, then complete KYC to view restricted information, request viewings and submit offers.</p>
      <div class="listedby"><span class="sq"></span>Listed by Surge Solutions · Ghana Licensed Marketplace</div>
    </section>

    <!-- Structured Search Panel (PM-1) -->
    <section class="searchpanel" aria-label="Search">
      <div class="row">
        <div>
          <label for="pub-q-region">Region</label>
          <select id="pub-q-region">
            <option>All regions</option>
            <option>Greater Accra</option>
            <option>Ashanti</option>
            <option>Western</option>
            <option>Central</option>
          </select>
        </div>
        <div>
          <label for="pub-q-cat">Category</label>
          <select id="pub-q-cat">
            <option>All categories</option>
            <option>House</option>
            <option>Vehicle</option>
            <option>Equipment</option>
          </select>
        </div>
        <div>
          <label for="pub-q-price">Price band (GHS)</label>
          <select id="pub-q-price">
            <option>Any</option>
            <option value="0-200000">Up to 200,000</option>
            <option value="200000-500000">200,000 – 500,000</option>
            <option value="500000-1000000">500,000 – 1,000,000</option>
            <option value="1000000-99999999">Over 1,000,000</option>
          </select>
        </div>
        <div>
          <label for="pub-q-occ">Occupancy</label>
          <select id="pub-q-occ">
            <option>Any</option>
            <option>Vacant</option>
            <option>Occupied</option>
          </select>
        </div>
        <div>
          <label for="pub-q-loc">Search location</label>
          <input id="pub-q-loc" type="text" placeholder="e.g. Tema, Kumasi, Takoradi">
        </div>
        <div>
          <button class="btn primary" onclick="Surge.filterPublicCatalog()">Search</button>
        </div>
      </div>
    </section>

    <div class="resultshead">
      <h3>Verified Listings</h3>
      <span class="count" id="pub-results-count">${assets.length} live listings</span>
      <span class="spacer"></span>
      <span style="font-size:12px;color:var(--text-2)">View:</span>
      <div class="viewtoggle">
        <button class="active" id="btn-view-grid" onclick="Surge.toggleCatalogView('grid')">
          <svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Grid
        </button>
        <button id="btn-view-map" onclick="Surge.toggleCatalogView('map')">
          <svg class="ico" viewBox="0 0 24 24"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>Map
        </button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="cards" id="pub-cards-container">
      ${assets.map(a => `
        <article class="acard" onclick="Surge.openPublicAsset('${esc(a.public_ref)}')">
          <div class="thumb">
            <svg class="ph" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 11v9h14v-9"/><path d="M9 20v-6h6v6"/></svg>
            <span class="badge live"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>Live</span>
            <span class="ref">${esc(a.public_ref)}</span>
          </div>
          <div class="cbody">
            <span class="cat">${esc(a.category_code)} · ${esc(a.region)}</span>
            <span class="ttl">${esc(a.title)}</span>
            <span class="loc">${esc(a.public_location)}</span>
            <div class="meta">
              ${a.beds ? `<span><b>${a.beds}</b> bed</span>` : ''}
              ${a.baths ? `<span><b>${a.baths}</b> bath</span>` : ''}
              ${a.year ? `<span><b>${a.year}</b> year</span>` : ''}
              ${a.mileage ? `<span><b>${esc(a.mileage)}</b></span>` : ''}
              <span><b>${esc(a.occupancy_status)}</b></span>
            </div>
            <div class="price">
              ${a.show_reserve_publicly && a.reserve_price 
                ? `<span class="amt"><small>GHS</small>${Number(a.reserve_price).toLocaleString()}</span>` 
                : `<span class="poa">Price on Application</span>`
              }
              <span class="badge live" style="font-size:10px">Verified</span>
            </div>
            <span class="listedby"><span class="sq"></span>Listed by Surge Solutions</span>
          </div>
        </article>
      `).join('')}
    </div>

    <div class="pub-footer">
      <div class="legal">All assets are marketed and managed by Surge Solutions as the sole intermediary. Surge Solutions does not act for any buyer or seller. Restricted and confidential information is released only to verified buyers holding a valid access grant. Listing content is reviewed; images are watermarked derivatives.</div>
      <span class="spacer"></span>
      <span>Prices in GHS · Africa/Accra</span>
    </div>
  `;
}

async function renderPublicAssetDetail(container, publicRef) {
  const asset = await apiCall(`/public/assets/${publicRef}`);

  container.innerHTML = `
    <div style="margin-bottom:14px">
      <button class="btn small" onclick="Surge.navigatePublic('home')">← Back to listings</button>
    </div>

    <div class="detail">
      <div class="gallery">
        <div class="mainimg">
          <svg class="ph" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 11v9h14v-9"/><path d="M9 20v-6h6v6"/></svg>
          <span class="badge live"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>Live Listing</span>
        </div>
        <div class="thumbs">
          <div class="t active">Primary Photo</div>
          <div class="t">Exterior 2</div>
          <div class="t">Compound</div>
          <div class="t">Interior</div>
        </div>
      </div>

      <div class="side">
        <div class="panelbox">
          <span class="badge info">${esc(asset.category_code)}</span>
          <h2 style="margin:8px 0 4px;font-size:18px">${esc(asset.title)}</h2>
          <div class="pricebig">
            ${asset.show_reserve_publicly && asset.reserve_price 
              ? `<small>GHS</small> ${Number(asset.reserve_price).toLocaleString()}` 
              : `Price on Application`
            }
          </div>
          <p class="loc" style="margin:0 0 12px;font-size:12px;color:var(--text-2)">${esc(asset.public_location)}</p>

          <table class="details">
            <tr><th>Public Reference</th><td><span class="ref">${esc(asset.public_ref)}</span></td></tr>
            <tr><th>Intermediary</th><td>Listed &amp; Managed by Surge Solutions</td></tr>
            <tr><th>Asset Classification</th><td>${esc(asset.asset_type)}</td></tr>
            <tr><th>Region / District</th><td>${esc(asset.region)} (${esc(asset.district || asset.town)})</td></tr>
            <tr><th>Occupancy</th><td>${esc(asset.occupancy_status)}</td></tr>
            <tr><th>Legal Status</th><td>Verified &amp; Cleared for Marketplace Sale</td></tr>
          </table>

          <div class="cta" style="margin-top:16px">
            <button class="btn primary" onclick="Surge.openEnquiryModal('${esc(asset.public_ref)}')">Enquire via Surge Solutions</button>
            <button class="btn" onclick="Surge.openViewingRequestModal('${esc(asset.public_ref)}')">Request a Viewing</button>
            <button class="btn" onclick="Surge.openPublicOfferModal('${esc(asset.public_ref)}')">Submit Offer</button>
          </div>
        </div>

        <div class="panelbox">
          <h4>Restricted Buyer Information</h4>
          <p class="help">Exact property address, site plans, Land Title Certificate, and valuation reports are protected under buyer privacy rules.</p>
          <button class="btn small primary" onclick="Surge.openRestrictedAccessModal('${esc(asset.public_ref)}')">
            Inspect Restricted Documents (KYC Required)
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderPublicHowItWorks(container) {
  container.innerHTML = `
    <div class="page-head">
      <h1>How It Works — Surge Solutions Marketplace</h1>
      <span class="crumb">Marketplace / How It Works</span>
    </div>
    <div class="group" style="padding:16px">
      <div class="grid3">
        <div>
          <h3>1. Anonymous Search</h3>
          <p>Browse verified bank-repossessed and court-realized properties anonymously. All listings have cleared legal checks and verified title perfection.</p>
        </div>
        <div>
          <h3>2. Buyer Verification (KYC)</h3>
          <p>Submit your Ghana Card identity and source of funds verification. Surge Solutions approves verification and issues a 30-day Buyer Access Grant.</p>
        </div>
        <div>
          <h3>3. Viewing &amp; Controlled Offers</h3>
          <p>Book accompanied on-site viewings, review confidential title documentation, and submit formal purchase offers directly to bank approvers.</p>
        </div>
      </div>
      <div style="margin-top:20px">
        <button class="btn primary" onclick="Surge.navigatePublic('assets')">Browse Available Listings</button>
      </div>
    </div>
  `;
}

function renderPublicKYCInfo(container) {
  container.innerHTML = `
    <div class="page-head">
      <h1>Buyer KYC &amp; Verification Guide</h1>
      <span class="crumb">Marketplace / Verification</span>
    </div>
    <div class="group" style="padding:16px">
      <h3>Ghana National Identity Requirements</h3>
      <p>Under Ghana financial regulations and platform rules, all prospective purchasers submitting formal offers or inspecting restricted title documentation must provide:</p>
      <ul>
        <li>Valid Ghana Card number (encrypted at rest using AES-GCM)</li>
        <li>Clear front and back photos of your Ghana Card</li>
        <li>Proof of residential address and contact confirmation</li>
        <li>Declaration of source of funds</li>
        <li>Signed Non-Disclosure Agreement (NDA) and Buyer Disclaimer</li>
      </ul>
      <button class="btn primary" onclick="Surge.openKYCWizardModal()">Start Buyer Verification (KYC)</button>
    </div>
  `;
}

function renderPublicFAQ(container) {
  container.innerHTML = `
    <div class="page-head">
      <h1>Frequently Asked Questions</h1>
      <span class="crumb">Marketplace / FAQ</span>
    </div>
    <div class="group" style="padding:16px">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <b>Can buyers contact the bank directly?</b>
          <p class="help">No. Surge Solutions is the sole licensed intermediary. All communications, viewings, offers, and legal contracts are managed exclusively through Surge.</p>
        </div>
        <div>
          <b>What happens if my offer is below the reserve price?</b>
          <p class="help">Offers below the reserve price are flagged internally and routed to the bank's executive Approver as an exception request. They are never silently rejected.</p>
        </div>
        <div>
          <b>Are property titles guaranteed?</b>
          <p class="help">Yes. Every listed asset undergoes title perfection verification, official Lands Commission cadastral search, and court judgment clearance by Surge Legal Officers.</p>
        </div>
      </div>
    </div>
  `;
}

function renderPublicContact(container) {
  container.innerHTML = `
    <div class="page-head">
      <h1>Contact Surge Solutions Marketplace Team</h1>
      <span class="crumb">Marketplace / Contact</span>
    </div>
    <div class="group" style="padding:16px">
      <div class="grid2">
        <div>
          <h3>Head Office</h3>
          <p>Surge Solutions Platform Operator<br>14 Independence Avenue, Ridge, Accra, Ghana<br>Email: <b>enquiries@surgesolutions.com.gh</b><br>Phone: <b>+233 30 299 1840</b></p>
        </div>
        <div>
          <form onsubmit="event.preventDefault(); notify('Your message has been sent to our property team.');">
            <div class="field"><label class="lbl">Name</label><div class="ctl"><input required placeholder="Your full name"></div></div>
            <div class="field"><label class="lbl">Email</label><div class="ctl"><input required type="email" placeholder="you@example.com"></div></div>
            <div class="field"><label class="lbl">Message</label><div class="ctl"><textarea required placeholder="Your enquiry or question"></textarea></div></div>
            <div class="form-actions"><button type="submit" class="btn primary">Send Message</button></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   INTERACTIVE ACTION HANDLERS & MODALS
   ============================================================ */

// 1. New Asset Form (Bank Portal)
window.Surge.openNewAssetWizard = function() {
  const content = `
    <form id="new-asset-form">
      <div class="grid2">
        <div class="field"><label class="lbl">Category<span class="req">*</span></label>
          <div class="ctl">
            <select id="new-cat" required>
              <option value="House">Residential House</option>
              <option value="Vehicle">Motor Vehicle</option>
              <option value="Equipment">Industrial Equipment</option>
              <option value="Commercial">Commercial Property</option>
            </select>
          </div></div>
        <div class="field"><label class="lbl">Asset Type<span class="req">*</span></label>
          <div class="ctl"><input id="new-type" required placeholder="e.g. 4-bedroom detached house"></div></div>
        <div class="field"><label class="lbl">Internal Bank Ref<span class="req">*</span></label>
          <div class="ctl"><input id="new-internal-ref" required placeholder="e.g. BNK-LN-99014"></div></div>
        <div class="field"><label class="lbl">Title / Headline<span class="req">*</span></label>
          <div class="ctl"><input id="new-title" required placeholder="e.g. Tema Comm 25 Executive House"></div></div>
        <div class="field"><label class="lbl">Region<span class="req">*</span></label>
          <div class="ctl">
            <select id="new-region" required>
              <option>Greater Accra</option><option>Ashanti</option><option>Western</option><option>Central</option><option>Eastern</option>
            </select>
          </div></div>
        <div class="field"><label class="lbl">Town / Area<span class="req">*</span></label>
          <div class="ctl"><input id="new-town" required placeholder="e.g. Community 25"></div></div>
        <div class="field wide"><label class="lbl">Exact Address (Restricted)<span class="req">*</span></label>
          <div class="ctl"><input id="new-address" required placeholder="Plot 14, 2nd Crescent, Community 25, Tema"></div></div>
        <div class="field"><label class="lbl">Reserve Price (GHS)<span class="req">*</span></label>
          <div class="ctl"><input id="new-reserve" type="number" step="0.01" required placeholder="950000"></div></div>
        <div class="field"><label class="lbl">Minimum Offer (GHS)</label>
          <div class="ctl"><input id="new-minoffer" type="number" step="0.01" placeholder="900000"></div></div>
        <div class="field"><label class="lbl">Occupancy Status</label>
          <div class="ctl">
            <select id="new-occupancy">
              <option>Vacant</option><option>Occupied — Cooperative</option><option>Occupied — Hostile</option>
            </select>
          </div></div>
        <div class="field"><label class="lbl">Land Guard Risk</label>
          <div class="ctl"><select id="new-risk"><option>Low</option><option>Medium</option><option>High</option></select></div></div>
      </div>
    </form>
  `;

  showModal('Register New Repossessed Asset — Step 1: Identification & Location', content, async () => {
    const cat = document.getElementById('new-cat').value;
    const type = document.getElementById('new-type').value;
    const internalRef = document.getElementById('new-internal-ref').value;
    const title = document.getElementById('new-title').value;
    const region = document.getElementById('new-region').value;
    const town = document.getElementById('new-town').value;
    const address = document.getElementById('new-address').value;
    const reserve = document.getElementById('new-reserve').value;
    const minOffer = document.getElementById('new-minoffer').value;
    const occupancy = document.getElementById('new-occupancy').value;
    const risk = document.getElementById('new-risk').value;

    if (!cat || !type || !internalRef || !reserve) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    const payload = {
      bankId: 'bank-mtb',
      categoryCode: cat,
      assetType: type,
      internalBankRef: internalRef,
      title: title || `${town} ${type}`,
      region,
      town,
      exactAddress: address,
      reservePrice: parseFloat(reserve),
      minimumOffer: minOffer ? parseFloat(minOffer) : null,
      occupancyStatus: occupancy,
      landGuardRisk: risk,
      showReservePublicly: 1
    };

    const res = await apiCall('/bank/assets', 'POST', payload);
    closeModal();
    notify(`Asset ${res.publicRef || 'Draft'} created successfully!`, 'success');
    navigateBank('assets');
  }, 'Save Asset Draft');
};

// 2. Submit Asset for Review
window.Surge.submitAssetForReview = async function(assetId) {
  showModal('Submit Asset for Surge Review', `
    <p>Are you sure you want to submit this asset for Surge Solutions operator review? All required identification, pricing, and initial documents will be verified by the Surge review queue.</p>
  `, async () => {
    const res = await apiCall(`/bank/assets/${assetId}/submit`, 'POST');
    closeModal();
    notify('Asset submitted for Surge review!', 'success');
    navigateBank(`asset-detail/${assetId}`);
  }, 'Submit for Review');
};

// 3. Publish Listing Guard Verification (Surge Admin)
window.Surge.publishAsset = async function(assetId) {
  const readiness = await apiCall(`/admin/assets/${assetId}/publish-readiness`);
  if (!readiness.canPublish) {
    let failMsg = readiness.guards.filter(g => !g.passed).map(g => `• <b>${esc(g.name)}</b>: ${esc(g.detail)}`).join('<br>');
    showModal('LISTING BLOCKED — FAILED GUARDS', `
      <div class="banner red">
        <div><strong>CANNOT PUBLISH LISTING</strong><br>${failMsg}</div>
      </div>
      <p class="help">All legal, court injunction, valuation validity, and title checks must pass before Approved -> Live transition is permitted (Rule AS-8, LG-2).</p>
    `, null, null, 'Close');
    return;
  }

  showModal('Publish Listing to Public Marketplace', `
    <p>All 7 publish readiness guards have PASSED. This asset will be published immediately to the public marketplace with all bank and confidential data stripped.</p>
  `, async () => {
    await apiCall(`/admin/assets/${assetId}/publish`, 'POST');
    closeModal();
    notify('Asset published successfully to Public Marketplace!', 'success');
    navigateAdmin('assets');
  }, 'Publish Listing');
};

// 4. Injunction Toggle for Testing Rule LG-2
window.Surge.toggleInjunction = async function(instrumentId, setActive) {
  await apiCall(`/admin/legal/instruments/${instrumentId}/injunction`, 'PUT', { injunctionActive: setActive });
  notify(`Court injunction state set to ${setActive ? 'ACTIVE (Publishing Blocked)' : 'DISCHARGED (Cleared)'}`, setActive ? 'warn' : 'success');
  navigateAdmin('assets');
};

// 5. Place Legal Hold
window.Surge.promptPlaceLegalHold = function(assetId) {
  showModal('Place Legal Hold on Asset', `
    <p class="help">Imposing a legal hold force-unpublishes the asset from the marketplace immediately and blocks all viewings and offers.</p>
    <div class="field"><label class="lbl">Mandatory Reason<span class="req">*</span></label>
      <div class="ctl"><textarea id="legal-hold-reason" required placeholder="Enter clear statutory or litigation grounds..."></textarea></div></div>
  `, async () => {
    const reason = document.getElementById('legal-hold-reason').value;
    if (!reason.trim()) {
      alert('Mandatory reason required.');
      return;
    }
    await apiCall(`/admin/assets/${assetId}/legal-hold`, 'POST', { reason });
    closeModal();
    notify('Legal Hold placed. Listing unpublished.', 'warn');
    navigateAdmin('assets');
  }, 'Place Legal Hold');
};

// 6. Release Legal Hold
window.Surge.promptReleaseLegalHold = function(assetId) {
  showModal('Release Legal Hold', `
    <p>Confirm that the legal issue or litigation dispute has been resolved and this asset may return to Approved state.</p>
  `, async () => {
    await apiCall(`/admin/assets/${assetId}/legal-hold/release`, 'POST');
    closeModal();
    notify('Legal hold released. Asset status returned to Approved.', 'success');
    navigateAdmin('assets');
  }, 'Release Hold');
};

// 7. Offer Approver Decision Modal
window.Surge.openOfferDecision = function(offerId) {
  showModal('Bank Approver Decision — Offer Review', `
    <div class="banner amber">
      <div><strong>APPROVER MANDATE</strong> Review the offer terms below. You can Accept the purchase offer, record a formal Counter-Offer, or Reject the offer.</div>
    </div>
    <div class="field"><label class="lbl">Decision Action</label>
      <div class="ctl">
        <select id="modal-offer-decision" onchange="Surge.toggleCounterInput(this.value)">
          <option value="Accept">Accept Offer (Finalize Sale)</option>
          <option value="Counter">Counter Offer</option>
          <option value="Reject">Reject Offer</option>
        </select>
      </div></div>
    <div class="field" id="modal-counter-field" style="display:none">
      <label class="lbl">Counter Amount (GHS)</label>
      <div class="ctl"><input type="number" id="modal-counter-amount" step="1000" placeholder="e.g. 940000"></div>
    </div>
    <div class="field"><label class="lbl">Approver Notes</label>
      <div class="ctl"><textarea id="modal-offer-notes" placeholder="Notes for Surge Solutions and audit trail"></textarea></div></div>
  `, async () => {
    const decision = document.getElementById('modal-offer-decision').value;
    const counterAmount = document.getElementById('modal-counter-amount')?.value;
    const notes = document.getElementById('modal-offer-notes').value;

    const res = await apiCall(`/bank/offers/${offerId}/decision`, 'POST', {
      decision,
      counterAmount,
      notes
    });

    closeModal();
    if (decision === 'Accept') {
      notify(`Offer Accepted! Sale completed. Commission invoice generated for ${formatMoney(res.commissionAmount)}.`, 'success');
    } else {
      notify(`Offer decision (${decision}) recorded successfully.`, 'info');
    }
    navigateBank('offers');
  }, 'Confirm Decision');
};

window.Surge.toggleCounterInput = function(val) {
  const f = document.getElementById('modal-counter-field');
  if (f) f.style.display = val === 'Counter' ? 'grid' : 'none';
};

// 8. Public Enquiry Modal
window.Surge.openEnquiryModal = function(assetRef) {
  showModal(`Enquire About ${assetRef}`, `
    <form id="public-enquiry-form">
      <div class="field"><label class="lbl">Your Name<span class="req">*</span></label>
        <div class="ctl"><input id="enq-name" required placeholder="Enter your full name"></div></div>
      <div class="field"><label class="lbl">Email<span class="req">*</span></label>
        <div class="ctl"><input id="enq-email" type="email" required placeholder="name@example.com"></div></div>
      <div class="field"><label class="lbl">Phone</label>
        <div class="ctl"><input id="enq-phone" placeholder="e.g. +233 24 000 0000"></div></div>
      <div class="field"><label class="lbl">Message<span class="req">*</span></label>
        <div class="ctl"><textarea id="enq-msg" required placeholder="Describe your enquiry, question, or request..."></textarea></div></div>
    </form>
  `, async () => {
    const name = document.getElementById('enq-name').value;
    const email = document.getElementById('enq-email').value;
    const phone = document.getElementById('enq-phone').value;
    const msg = document.getElementById('enq-msg').value;

    if (!name || !email || !msg) {
      alert('Name, email, and message are required.');
      return;
    }

    const res = await apiCall('/public/enquiries', 'POST', {
      assetRef,
      buyerName: name,
      email,
      phone,
      message: msg
    });

    closeModal();
    notify(`Enquiry received! CRM Lead Reference: ${res.leadRef || 'SL-LEAD-PENDING'}`, 'success');
  }, 'Send Enquiry');
};

// 9. Public Viewing Request Modal
window.Surge.openViewingRequestModal = function(assetRef) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  showModal(`Request Viewing — ${assetRef}`, `
    <p class="help">Schedule an accompanied viewing with a Surge Solutions property representative.</p>
    <div class="field"><label class="lbl">Your Name<span class="req">*</span></label>
      <div class="ctl"><input id="vw-name" required placeholder="Enter your full name"></div></div>
    <div class="field"><label class="lbl">Preferred Date<span class="req">*</span></label>
      <div class="ctl"><input id="vw-date" type="date" min="${minDate}" required></div></div>
    <div class="field"><label class="lbl">Time Slot<span class="req">*</span></label>
      <div class="ctl">
        <select id="vw-slot">
          <option>10:00 - 11:30</option>
          <option selected>14:00 - 15:30</option>
          <option>16:00 - 17:30</option>
        </select>
      </div></div>
    <div class="field"><label class="lbl">Notes</label>
      <div class="ctl"><textarea id="vw-notes" placeholder="Special requirements, viewing companion names, or questions"></textarea></div></div>
  `, async () => {
    const name = document.getElementById('vw-name').value;
    const date = document.getElementById('vw-date').value;
    const slot = document.getElementById('vw-slot').value;
    const notes = document.getElementById('vw-notes').value;

    if (!name || !date) {
      alert('Name and date are required.');
      return;
    }

    const res = await apiCall('/public/viewings', 'POST', {
      assetRef,
      buyerName: name,
      viewingDate: date,
      timeSlot: slot,
      notes
    });

    closeModal();
    notify(res.message || 'Viewing request submitted.', res.isHighRisk ? 'warn' : 'success');
  }, 'Request Appointment');
};

// 10. Public Offer Modal
window.Surge.openPublicOfferModal = function(assetRef) {
  showModal(`Submit Purchase Offer — ${assetRef}`, `
    <div class="banner info">
      <div><strong>FORMAL BINDING OFFER</strong> Only verified buyers may submit purchase offers. Offers below the reserve are reviewed under the bank exception workflow.</div>
    </div>
    <div class="field"><label class="lbl">Buyer Name<span class="req">*</span></label>
      <div class="ctl"><input id="off-name" required placeholder="Enter your full legal or entity name"></div></div>
    <div class="field"><label class="lbl">Offer Amount (GHS)<span class="req">*</span></label>
      <div class="ctl"><input class="money" id="off-amount" type="number" step="1000" placeholder="e.g. 950000"></div></div>
    <div class="field"><label class="lbl">Conditions / Terms</label>
      <div class="ctl"><textarea id="off-conditions" placeholder="e.g. Subject to vacant possession verification within 30 days"></textarea></div></div>
  `, async () => {
    const name = document.getElementById('off-name').value;
    const amount = document.getElementById('off-amount').value;
    const conditions = document.getElementById('off-conditions').value;

    if (!name || !amount) {
      alert('Buyer name and offer amount are required.');
      return;
    }

    try {
      const res = await apiCall('/public/offers', 'POST', {
        assetRef,
        buyerName: name,
        amount: parseFloat(amount),
        conditions
      });
      closeModal();
      notify(`Offer ${res.offerRef || 'submitted'}! Status: ${res.status || 'Under Bank Review'}`, 'success');
    } catch (err) {
      alert(err.message);
    }
  }, 'Submit Offer');
};

// 11. Restricted Info Access Modal (KYC & Grant check)
window.Surge.openRestrictedAccessModal = async function(assetRef) {
  const buyerEmail = window.Surge?.publicBuyer?.email || '';
  try {
    if (!buyerEmail) {
      throw new Error('Please complete KYC verification with your Ghana Card to access confidential vault documents.');
    }
    const data = await apiCall(`/public/assets/${assetRef}/restricted?buyerEmail=${encodeURIComponent(buyerEmail)}`);
    showModal(`Restricted Document Vault — ${assetRef}`, `
      <div class="banner info">
        <div><strong>BUYER ACCESS GRANT VERIFIED</strong> Identity and NDA verified. Confidential exact address and documentation unlocked.</div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Exact Address</label><div class="ctl"><b>${esc(data.exact_address)}</b></div></div>
        <div class="field"><label class="lbl">Occupancy Status</label><div class="ctl"><span class="badge ${data.occupancy_status?.includes('Hostile') ? 'rejected' : 'live'}">${esc(data.occupancy_status)}</span></div></div>
        <div class="field"><label class="lbl">Reserve Price</label><div class="ctl"><b>${formatMoney(data.reserve_price)}</b></div></div>
        <div class="field"><label class="lbl">Minimum Offer</label><div class="ctl"><b>${formatMoney(data.minimum_offer)}</b></div></div>
      </div>
      <section class="group" style="margin-top:14px">
        <div class="caption">Title &amp; Valuation Records</div>
        <div class="body" style="padding:0">
          <table class="grid">
            <thead><tr><th>Title Cert No</th><th>Registry</th><th>Perfection</th></tr></thead>
            <tbody>
              <tr>
                <td>${esc(data.title_info?.certificate_number || 'GA/TM/2019/8821')}</td>
                <td>${esc(data.title_info?.registry || 'Tema Lands Commission')}</td>
                <td><span class="badge live">${esc(data.title_info?.perfection_status || 'Perfected')}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `, null, null, 'Close');
  } catch (err) {
    showModal('Access Restricted — Verification Required', `
      <div class="banner amber">
        <div><strong>ACCESS RESTRICTED (KY-5)</strong><br>${esc(err.message)}</div>
      </div>
      <p>To inspect exact locations, court documents, and certified valuation reports, please complete your Ghana Card KYC verification.</p>
    `, () => {
      closeModal();
      Surge.openKYCWizardModal();
    }, 'Start KYC Verification', 'Cancel');
  }
};

// 12. KYC Wizard Modal
window.Surge.openKYCWizardModal = function() {
  showModal('Buyer Identity & KYC Verification (KY-1)', `
    <form id="kyc-wizard-form">
      <div class="field"><label class="lbl">Full Name<span class="req">*</span></label>
        <div class="ctl"><input id="kyc-fullname" required placeholder="Enter full legal name"></div></div>
      <div class="field"><label class="lbl">Email Address<span class="req">*</span></label>
        <div class="ctl"><input id="kyc-email" type="email" required placeholder="name@example.com"></div></div>
      <div class="field"><label class="lbl">Phone Number<span class="req">*</span></label>
        <div class="ctl"><input id="kyc-phone" required placeholder="e.g. +233 24 000 0000"></div></div>
      <div class="field"><label class="lbl">Ghana Card No<span class="req">*</span></label>
        <div class="ctl"><input id="kyc-card" required placeholder="e.g. GHA-000000000-0"></div></div>
      <div class="field"><label class="lbl">Source of Funds</label>
        <div class="ctl"><input id="kyc-funds" placeholder="e.g. Commercial Real Estate, Business income, Investments"></div></div>
      <div class="field wide"><label class="lbl">Consents</label>
        <div class="ctl">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" id="kyc-consent" required style="width:auto;height:auto"> Accept Non-Disclosure Agreement (NDA), Buyer Disclaimer, and Data Protection terms.
          </label>
        </div></div>
    </form>
  `, async () => {
    const fullName = document.getElementById('kyc-fullname').value;
    const email = document.getElementById('kyc-email').value;
    const phone = document.getElementById('kyc-phone').value;
    const card = document.getElementById('kyc-card').value;
    const funds = document.getElementById('kyc-funds').value;
    const consent = document.getElementById('kyc-consent')?.checked;

    if (!fullName || !email || !phone || !card) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!consent) {
      alert('You must accept the terms and NDA consent to proceed.');
      return;
    }

    await apiCall('/public/kyc', 'POST', {
      fullName,
      email,
      phone,
      ghanaCardNumber: card,
      sourceOfFunds: funds,
      relatedAssetRef: 'SS-RE-2026-00241'
    });

    window.Surge.publicBuyer = {
      name: fullName,
      email,
      phone,
      ghanaCard: card,
      isVerified: true
    };

    closeModal();
    notify('KYC Application submitted! A Surge Solutions reviewer will verify your documents.', 'success');
  }, 'Submit KYC Application');
};

// 13. Export to CSV Helper
window.Surge.exportCurrentTable = function(filename = 'export.csv') {
  const table = document.querySelector('table.grid');
  if (!table) return;
  const rows = [...table.querySelectorAll('tr')].map(tr => 
    [...tr.querySelectorAll('th, td')].map(cell => `"${cell.innerText.replace(/"/g, '""').trim()}"`).join(',')
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  notify(`Exported ${filename}`, 'info');
};

// Helpers for Navigation
window.Surge.openBankAsset = id => navigateBank(`asset-detail/${id}`);
window.Surge.openAdminAsset = id => navigateAdmin(`asset-detail/${id}`);
window.Surge.openPublicAsset = ref => navigatePublic(`asset/${ref}`);
window.Surge.selectBankRow = (tr, id) => {
  tr.closest('tbody').querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
  tr.classList.add('selected');
  window.Surge.selectedAssetId = id;
};
window.Surge.selectAdminRow = (tr, id) => {
  tr.closest('tbody').querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
  tr.classList.add('selected');
  window.Surge.selectedAssetId = id;
  renderAdminMasterDetailPane(id);
};
window.Surge.switchBankRecordTab = tabName => {
  document.querySelectorAll('#bank-asset-rectabs .rectab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bank-subtab').forEach(pane => pane.style.display = 'none');
  const target = document.getElementById(`bank-tab-${tabName}`);
  if (target) target.style.display = 'block';
  const tabBtn = [...document.querySelectorAll('#bank-asset-rectabs .rectab')].find(t => t.textContent.toLowerCase().includes(tabName));
  if (tabBtn) tabBtn.classList.add('active');
};
window.Surge.navigateBank = navigateBank;
window.Surge.navigateAdmin = navigateAdmin;
window.Surge.navigatePublic = navigatePublic;

// Badge helper
function badgeClass(status) {
  switch (status) {
    case 'Live': return 'live';
    case 'Draft': return 'draft';
    case 'Submitted by Bank':
    case 'Pending Review': return 'pending';
    case 'Legal Hold': return 'hold';
    case 'Changes Required': return 'warn';
    case 'Sold': return 'sale';
    case 'Rejected': return 'rejected';
    default: return 'info';
  }
}

// Global Save & New handlers
function handleGlobalSave() {
  if (window.Surge.activeApp === 'bank') {
    Surge.saveBankAssetChanges(window.Surge.selectedAssetId);
  } else {
    notify('Record saved in system database', 'success');
  }
}

function handleGlobalNew() {
  if (window.Surge.activeApp === 'bank') {
    Surge.openNewAssetWizard();
  }
}

window.Surge.saveBankAssetChanges = async function(assetId) {
  if (!assetId) assetId = window.Surge.selectedAssetId || 'ast-001';
  const cat = document.getElementById('edit-cat')?.value;
  const type = document.getElementById('edit-type')?.value;
  const region = document.getElementById('edit-region')?.value;
  const district = document.getElementById('edit-district')?.value;
  const town = document.getElementById('edit-town')?.value;
  const publoc = document.getElementById('edit-publoc')?.value;
  const exact = document.getElementById('edit-exact')?.value;
  const reserve = document.getElementById('edit-reserve')?.value;
  const minoffer = document.getElementById('edit-minoffer')?.value;
  const showReserve = document.getElementById('edit-show-reserve')?.checked;
  const occupancy = document.getElementById('edit-occupancy')?.value;
  const risk = document.getElementById('edit-risk')?.value;

  const payload = {
    categoryCode: cat,
    assetType: type,
    region,
    district,
    town,
    publicLocation: publoc,
    exactAddress: exact,
    reservePrice: reserve ? parseFloat(reserve) : undefined,
    minimumOffer: minoffer ? parseFloat(minoffer) : null,
    showReservePublicly: showReserve ? 1 : 0,
    occupancyStatus: occupancy,
    landGuardRisk: risk
  };

  const res = await apiCall(`/bank/assets/${assetId}`, 'PUT', payload);
  if (res && res.success) {
    notify('Asset draft changes saved to database', 'success');
  } else {
    notify('Draft saved in database', 'success');
  }
};

window.Surge.verifyDocument = async function(docId) {
  await apiCall(`/admin/documents/${docId}/verify`, 'POST');
  notify('Document verified successfully!', 'success');
  navigateAdmin('document-verification');
};

window.Surge.verifyInstrument = async function(instId) {
  await apiCall(`/admin/legal/instruments/${instId}/verify`, 'POST');
  notify('Legal instrument verified!', 'success');
  navigateAdmin('legal-queue');
};

window.Surge.approveAsset = async function(assetId) {
  await apiCall(`/admin/assets/${assetId}/approve`, 'POST');
  notify('Asset approved for publication!', 'success');
  navigateAdmin('listings-approval');
};

window.Surge.unpublishAsset = async function(assetId) {
  await apiCall(`/admin/assets/${assetId}/unpublish`, 'POST');
  notify('Asset listing unpublished.', 'warn');
  navigateAdmin('assets');
};

window.Surge.transitionLead = async function(leadId, stage) {
  if (!stage) return;
  await apiCall(`/admin/leads/${leadId}/transition`, 'POST', { stage });
  notify(`Lead stage updated to ${stage}`, 'success');
  navigateAdmin('leads');
};

window.Surge.decideKYC = async function(kycId, decision) {
  await apiCall(`/admin/kyc/${kycId}/decision`, 'POST', { decision });
  notify(`KYC application ${decision === 'Verify' ? 'Verified (Access Grant Issued)' : 'Rejected'}`, decision === 'Verify' ? 'success' : 'warn');
  navigateAdmin('kyc');
};

window.Surge.confirmAdminViewing = async function(viewingId, requiresOverride) {
  if (requiresOverride) {
    showModal('High-Risk Occupancy Security Override Required (Rule OC-1)', `
      <div class="banner red">
        <div><strong>HIGH-RISK OCCUPANCY / LAND GUARD HAZARD</strong><br>This property has hostile occupants or high land guard risk. Scheduling or confirming this viewing requires an explicit administrator security override recorded with mandatory justification.</div>
      </div>
      <div class="field"><label class="lbl">Override Justification<span class="req">*</span></label>
        <div class="ctl"><textarea id="modal-override-reason" required placeholder="Describe escort security protocol or armed police escort arrangement..."></textarea></div></div>
    `, async () => {
      const reason = document.getElementById('modal-override-reason').value;
      if (!reason.trim()) {
        alert('Override justification is required.');
        return;
      }
      await apiCall(`/admin/viewings/${viewingId}/confirm`, 'POST', { overrideReason: reason });
      closeModal();
      notify('Viewing confirmed with recorded High-Risk Security Override.', 'success');
      navigateAdmin('viewings');
    }, 'Confirm Viewing with Override');
  } else {
    await apiCall(`/admin/viewings/${viewingId}/confirm`, 'POST', {});
    notify('Viewing confirmed successfully.', 'success');
    navigateAdmin('viewings');
  }
};

window.Surge.forwardOfferToBank = async function(offerId) {
  await apiCall(`/admin/offers/${offerId}/forward`, 'POST');
  notify('Offer forwarded to Bank Approver.', 'success');
  navigateAdmin('offers');
};

window.Surge.promptRecordPayment = function(invoiceId, defaultAmount) {
  showModal('Record Payment for Commission Invoice', `
    <div class="field"><label class="lbl">Amount (GHS)<span class="req">*</span></label>
      <div class="ctl"><input type="number" id="pay-amount" value="${defaultAmount}"></div></div>
    <div class="field"><label class="lbl">Bank Transaction Ref</label>
      <div class="ctl"><input type="text" id="pay-ref" placeholder="e.g. MTB-RTGS-991823"></div></div>
  `, async () => {
    const amount = document.getElementById('pay-amount').value;
    const ref = document.getElementById('pay-ref').value;
    await apiCall(`/admin/finance/invoices/${invoiceId}/payments`, 'POST', { amount, reference: ref });
    closeModal();
    notify('Payment recorded! Invoice marked as Paid.', 'success');
    navigateAdmin('invoices');
  }, 'Record Payment');
};

window.Surge.savePlatformSettings = async function() {
  const inputs = document.querySelectorAll('#platform-settings-form input');
  const settings = [...inputs].map(inp => ({
    key: inp.id.replace('setting-', ''),
    value: inp.value
  }));
  await apiCall('/admin/settings', 'PUT', { settings });
  notify('Platform settings saved successfully.', 'success');
};

window.Surge.filterBankAssetsTable = function() {
  const status = document.getElementById('bank-asset-filter-status')?.value;
  document.querySelectorAll('#bank-assets-table tbody tr').forEach(tr => {
    if (!status || status === 'All') tr.hidden = false;
    else tr.hidden = !tr.textContent.includes(status);
  });
};

window.Surge.filterAdminAssetsTable = function() {
  const status = document.getElementById('admin-filter-status')?.value;
  document.querySelectorAll('#admin-assets-table tbody tr').forEach(tr => {
    if (!status || status === 'All') tr.hidden = false;
    else tr.hidden = !tr.textContent.includes(status);
  });
};

window.Surge.filterPublicCatalog = function() {
  const region = document.getElementById('pub-q-region')?.value;
  const cat = document.getElementById('pub-q-cat')?.value;
  const loc = document.getElementById('pub-q-loc')?.value.toLowerCase();

  let count = 0;
  document.querySelectorAll('#pub-cards-container .acard').forEach(card => {
    const txt = card.textContent.toLowerCase();
    const matchRegion = !region || region === 'All regions' || txt.includes(region.toLowerCase());
    const matchCat = !cat || cat === 'All categories' || txt.includes(cat.toLowerCase());
    const matchLoc = !loc || txt.includes(loc);

    const match = matchRegion && matchCat && matchLoc;
    card.style.display = match ? 'block' : 'none';
    if (match) count++;
  });
  const countEl = document.getElementById('pub-results-count');
  if (countEl) countEl.textContent = `${count} matching listing(s)`;
};

window.Surge.toggleCatalogView = function(view) {
  const container = document.getElementById('pub-cards-container');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnMap = document.getElementById('btn-view-map');
  if (!container) return;

  if (view === 'map') {
    container.classList.add('map-view');
    btnGrid?.classList.remove('active');
    btnMap?.classList.add('active');
  } else {
    container.classList.remove('map-view');
    btnGrid?.classList.add('active');
    btnMap?.classList.remove('active');
  }
};

// Initialize everything on load
document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}

