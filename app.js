/**
 * Surge Solutions Platform Engine
 * Unified Interactive Controller & Shared Data Store
 * Derived from Surge Solutions — Complete Interactive Mockup.html
 */

// ============================================================
// GHANA GEOGRAPHIC DATA — 16 Administrative Regions & 276 Constituencies
// ============================================================
const GhanaGeo = {
  REGIONS: {
    'Ahafo': ['Asunafo North','Asunafo South','Asutifi North','Asutifi South','Tano North','Tano South'],
    'Ashanti': ['Adansi-Asokwa','Fomena','New Edubiase','Afigya Kwabre North','Afigya Kwabre South','Ahafo Ano North','Ahafo Ano South East','Ahafo Ano South West','Akrofuom','Odotobri','Manso Nkwanta','Manso Edubia','Asante Akim Central','Asante Akim North','Asante Akim South','Asawase','Asokwa','Atwima-Kwanwoma','Atwima Mponua','Atwima-Nwabiagya South','Atwima-Nwabiagya North','Bekwai','Bosome-Freho','Bosomtwe','Ejisu','Ejura-Sekyedumase','Juaben','Bantama','Manhyia North','Manhyia South','Nhyiaeso','Subin','Kwabre East','Kwadaso','Mampong','Obuasi East','Obuasi West','Offinso South','Offinso North','Oforikrom','Old Tafo','Sekyere Afram Plains','Nsuta-Kwamang-Beposo','Afigya Sekyere East','Kumawu','Effiduase-Asokore','Suame'],
    'Bono': ['Banda','Berekum East','Berekum West','Dormaa Central','Dormaa East','Dormaa West','Jaman North','Jaman South','Sunyani East','Sunyani West','Tain','Wenchi'],
    'Bono East': ['Atebubu-Amantin','Kintampo North','Kintampo South','Nkoranza North','Nkoranza South','Pru East','Pru West','Sene East','Sene West','Techiman South','Techiman North'],
    'Central': ['Abura-Asebu-Kwamankese','Agona East','Agona West','Ajumako-Enyan-Essiam','Asikuma-Odoben-Brakwa','Assin Central','Assin North','Assin South','Awutu-Senya East','Awutu-Senya West','Cape Coast North','Cape Coast South','Effutu','Ekumfi','Gomoa East','Gomoa Central','Gomoa West','Komenda-Edina-Eguafo-Abirem','Mfantseman','Twifo-Atii Morkwaa','Hemang Lower Denkyira','Upper Denkyira East','Upper Denkyira West'],
    'Eastern': ['Abuakwa North','Abuakwa South','Achiase','Akropong','Akuapem South','Ofoase-Ayirebi','Asene Akroso Manso','Asuogyaman','Atiwa East','Atiwa West','Ayensuano','Akim Oda','Abirem','Akim Swedru','Akwatia','Fanteakwa North','Fanteakwa South','Kade','Afram Plains North','Afram Plains South','Abetifi','Mpraeso','Nkawkaw','Lower Manya Krobo','New Juaben North','New Juaben South','Nsawam Adoagyiri','Okere','Suhum','Upper Manya Krobo','Upper West Akim','Lower West Akim','Yilo Krobo'],
    'Greater Accra': ['Ablekuma Central','Ablekuma North','Ablekuma West','Ablekuma South','Odododiodioo','Okaikwei Central','Okaikwei South','Ada','Sege','Adenta','Ashaiman','Ayawaso Central','Ayawaso East','Ayawaso North','Ayawaso West Wuogon','Anyaa-Sowutuom','Dome-Kwabenya','Trobu','Bortianor-Ngleshie-Amanfro','Amasaman','Korle Klottey','Kpone-Katamanso','Krowor','Dade Kotopon','Abokobi-Madina','Ledzokuku','Ningo-Prampram','Okaikwei North','Shai-Osudoku','Tema East','Tema Central','Tema West','Weija-Gbawe','Domeabra-Obom'],
    'North East': ['Bunkpurugu','Chereponi','Nalerigu','Yagaba-Kubori','Walewale','Yunyoo'],
    'Northern': ['Gushegu','Karaga','Kpandai','Kumbungu','Mion','Nanton','Bimbilla','Wulensi','Saboba','Sagnarigu','Savelugu','Tamale Central','Tamale North','Tamale South','Tatale-Sanguli','Tolon','Yendi','Zabzugu'],
    'Oti': ['Biakoye','Guan','Buem','Akan','Krachi East','Krachi Nchumuru','Krachi West','Nkwanta North','Nkwanta South'],
    'Savannah': ['Bole','Yapei-Kusawgu','Salaga South','Salaga North','Daboya-Mankarigu','Sawla-Tuna-Kalba','Damongo'],
    'Upper East': ['Bawku Central','Zebilla','Binduri','Bolgatanga East','Bolgatanga Central','Bongo','Builsa North','Builsa South','Garu','Navrongo Central','Chiana-Paga','Nabdam','Pusiga','Talensi','Tempane'],
    'Upper West': ['Daffiama-Bussie-Issa','Jirapa','Lambussie','Lawra','Nadowli-Kaleo','Nandom','Sissala East','Sissala West','Wa East','Wa Central','Wa West'],
    'Volta': ['Adaklu','Afadjato South','Agotime-Ziope','Akatsi North','Akatsi South','Anlo','Central Tongu','Ho Central','Ho West','Hohoe','Keta','Ketu North','Ketu South','Kpando','North Dayi','North Tongu','South Dayi','South Tongu'],
    'Western': ['Ahanta West','Amenfi Central','Amenfi West','Amenfi East','Effia','Kwesimintsim','Ellembelle','Jomoro','Mpohor','Evalue Gwira','Prestea-Huni Valley','Essikado-Ketan','Sekondi','Takoradi','Shama','Tarkwa-Nsuaem','Wassa East'],
    'Western North': ['Aowin','Bia East','Bia West','Bibiani-Anhwiaso-Bekwai','Bodi','Juaboso','Sefwi-Akontombra','Sefwi-Wiawso','Suaman']
  },
  getRegionList() { return Object.keys(this.REGIONS); },
  getDistricts(region) { return this.REGIONS[region] || []; },
  renderRegionOptions(selectedRegion) {
    return this.getRegionList().map(r => `<option value="${r}" ${r === selectedRegion ? 'selected' : ''}>${r}</option>`).join('');
  },
  renderDistrictOptions(region, selectedDistrict) {
    const list = this.getDistricts(region);
    return `<option value="">Select District / Constituency...</option>` +
      list.map(d => `<option value="${d}" ${d === selectedDistrict ? 'selected' : ''}>${d}</option>`).join('');
  }
};

// ============================================================
// CENTRALIZED AUTHENTICATION & SEPARATE BANK AUTHORIZATION
// ============================================================
const Auth = {
  token: null,
  user: null,
  selectedBranchId: null,

  getToken() {
    if (this.token) return this.token;
    try {
      this.token = sessionStorage.getItem('surge_token') || localStorage.getItem('surge_token');
    } catch(e) {}
    return this.token;
  },

  getUser() {
    if (this.user) return this.user;
    try {
      const u = sessionStorage.getItem('surge_user') || localStorage.getItem('surge_user');
      if (u) this.user = JSON.parse(u);
    } catch(e) {}
    return this.user;
  },

  setSession(token, user, remember) {
    this.token = token;
    this.user = user;
    this.selectedBranchId = user?.branchId || user?.branch_id || null;
    try {
      sessionStorage.setItem('surge_token', token);
      sessionStorage.setItem('surge_user', JSON.stringify(user));
      if (remember) {
        localStorage.setItem('surge_token', token);
        localStorage.setItem('surge_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('surge_token');
        localStorage.removeItem('surge_user');
      }
    } catch(e) {}
  },

  logout() {
    const token = this.getToken();
    if (token) {
      fetch(Store.API_BASE + '/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      }).catch(() => {});
    }
    this.token = null;
    this.user = null;
    this.selectedBranchId = null;
    try {
      sessionStorage.removeItem('surge_token');
      sessionStorage.removeItem('surge_user');
      localStorage.removeItem('surge_token');
      localStorage.removeItem('surge_user');
    } catch(e) {}
    window.location.href = 'login.html';
  },

  showVerificationError(message, requiredScope) {
    const status = document.getElementById('portal-auth-status');
    if (!status) return;

    status.replaceChildren();
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    status.appendChild(messageEl);

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn primary';
    retry.textContent = 'Retry';
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      status.replaceChildren(document.createTextNode('Verifying your session…'));
      if (await this.checkAuth(requiredScope)) {
        await (requiredScope === 'surge' ? AdminPortal : BankPortal).init(true);
      }
    });
    status.appendChild(retry);

    const signIn = document.createElement('a');
    signIn.className = 'btn';
    signIn.href = 'login.html?reason=required';
    signIn.textContent = 'Return to sign in';
    status.appendChild(signIn);
  },

  async checkAuth(requiredScope = 'bank') {
    const path = window.location.pathname.toLowerCase();

    // 1. NEVER redirect if on public marketplace or already on login page
    if (path.includes('login') || path.includes('marketplace') || path === '/' || path === '') {
      console.info('[Auth Guard] Public / login route bypass:', { path, requiredScope });
      if (path.includes('login')) return false;
      return true; // marketplace requires no auth
    }

    const token = this.getToken();
    if (!token) {
      const fallbackTarget = (requiredScope === 'surge') ? 'admin.html' : 'bank.html';
      let curPage = window.location.pathname.split('/').pop() || fallbackTarget;
      if (/login/i.test(curPage)) curPage = fallbackTarget;

      console.warn('[Auth Guard] Protected route access without session. Redirecting to login:', {
        requestedUrl: window.location.href,
        destination: 'login.html?next=' + encodeURIComponent(curPage),
        reason: 'Unauthenticated'
      });
      window.location.href = 'login.html?next=' + encodeURIComponent(curPage);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      let res;
      let data;
      try {
        res = await fetch(Store.API_BASE + '/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token },
          cache: 'no-store',
          signal: controller.signal
        });
        if (res.ok) data = await res.json();
      } finally {
        clearTimeout(timeoutId);
      }
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('[Auth Guard] Session invalid or expired. Clearing session.', { status: res.status });
          this.logout();
          return false;
        }
        console.error('[Auth Guard] Session could not be verified by the server.', { status: res.status });
        this.showVerificationError('The session service is temporarily unavailable. Retry, or return to sign in.', requiredScope);
        return false;
      }
      if (!data.authenticated || !data.user) {
        console.warn('[Auth Guard] Session not authenticated. Clearing session.');
        this.logout();
        return false;
      }
      this.user = data.user;
      sessionStorage.setItem('surge_user', JSON.stringify(data.user));
      this.selectedBranchId = data.user.branchId || data.user.branch_id || null;

      // Authorization check
      if (requiredScope === 'bank') {
        if (data.user.scope !== 'bank' && data.user.scope !== 'surge') {
          console.warn('[Auth Guard] Account is not authorized to open the bank portal.');
          window.location.href = 'login.html?next=bank.html';
          return false;
        }
      } else if (requiredScope === 'surge') {
        if (data.user.scope !== 'surge') {
          console.warn('[Auth Guard] Non-admin user attempted to open admin portal.');
          alert('Access denied. Administrator privileges required.');
          window.location.href = 'bank.html';
          return false;
        }
      }
      this.updateUIProfile();
      console.info('[Auth Guard] Access granted:', { user: data.user.username, scope: data.user.scope });
      const adminPortalLink = document.getElementById('admin-portal-link');
      if (adminPortalLink) adminPortalLink.hidden = data.user.scope !== 'surge';
      document.body.classList.add('auth-ready');
      return true;
    } catch(e) {
      console.error('[Auth Guard] Auth check failed before the server could verify the session:', e);
      const message = e.name === 'AbortError'
        ? 'Session verification timed out. Your saved sign-in was kept; retry in a moment.'
        : 'Could not reach the session service. Your saved sign-in was kept; check your connection and retry.';
      this.showVerificationError(message, requiredScope);
      return false;
    }
  },

  updateUIProfile() {
    const u = this.getUser();
    const name = u ? (u.fullName || u.full_name || u.username || 'Officer') : '';
    const role = u ? (u.roleCode || u.role_code || 'Recovery Officer') : '';
    const bank = u ? (u.bankName || u.bank_name || 'Institutional Bank Portal') : '';

    // Update statusbars in enterprise portals
    document.querySelectorAll('.statusbar').forEach(sb => {
      const cells = sb.querySelectorAll('.cell');
      cells.forEach(c => {
        if (c.innerText.includes('User:') && name) c.innerHTML = `User: <b>${name}</b>`;
        if (c.innerText.includes('Role:') && role) c.innerHTML = `Role: <b>${role}</b>`;
        if (c.innerText.includes('Org:') && bank) c.innerHTML = `Org: <b>${bank}</b>`;
      });
    });

  }
};

// ============================================================
// SHARED DATA STORE
// ============================================================
const Store = {
  assets: [], auditLog: [], leads: [], offers: [], viewings: [], invoices: [], banks: [], users: [], branches: [],
  STORAGE_KEY: 'surge_disposition_clean_v1',
  deploymentVersion: null,
  deploymentVersionTimer: null,
  API_BASE: (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.protocol === 'file:'))
    ? 'https://surge-solutions-api.sedegahkimathi.workers.dev'
    : '',

  getAuthHeaders() {
    const token = Auth.getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    const user = Auth.getUser();
    if (user?.bankId || user?.bank_id) h['x-bank-id'] = user.bankId || user.bank_id;
    if (user?.roleCode || user?.role_code) h['x-actor-role'] = user.roleCode || user.role_code;
    if (user?.fullName || user?.full_name || user?.username) h['x-actor-name'] = user.fullName || user.full_name || user.username;
    return h;
  },

  init() {
    try {
      if (typeof localStorage !== 'undefined') {
        (this.LEGACY_KEYS || []).forEach(k => localStorage.removeItem(k));
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {}
    this.assets = [];
    this.auditLog = [];
    this.leads = [];
    this.offers = [];
    this.viewings = [];
    this.invoices = [];
    this.banks = [];
    this.users = [];
    this.branches = [];
    this.startDeploymentVersionMonitor();
    if (!document.body?.dataset.portal) this.fetchRemote();
  },

  startDeploymentVersionMonitor() {
    if (this.deploymentVersionTimer) return;
    const check = () => this.checkDeploymentVersion();
    void check();
    this.deploymentVersionTimer = setInterval(check, 180000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void check();
    });
  },

  async checkDeploymentVersion() {
    try {
      const response = await fetch(this.API_BASE + '/api/version', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Version check failed (${response.status}).`);
      const data = await response.json();
      const version = String(data.version || '');
      if (!version || version === 'unknown' || version === 'local') return;
      if (!this.deploymentVersion) {
        this.deploymentVersion = version;
      } else if (version !== this.deploymentVersion) {
        this.showDeploymentUpdateNotice();
      }
    } catch (error) {
      console.warn('[Deployment Version] Could not check for a newer deployment:', error);
    }
  },

  showDeploymentUpdateNotice() {
    if (document.getElementById('deployment-update-notice')) return;
    const notice = document.createElement('div');
    notice.id = 'deployment-update-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    Object.assign(notice.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '10000',
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      borderRadius: '6px', background: '#172b4d', color: '#fff',
      boxShadow: '0 4px 18px rgba(0,0,0,.24)', font: '13px system-ui, sans-serif'
    });
    const message = document.createElement('span');
    message.textContent = 'A newer version is ready.';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = 'Refresh safely';
    Object.assign(refresh.style, {
      border: '0', borderRadius: '4px', padding: '7px 10px',
      background: '#fff', color: '#172b4d', fontWeight: '600', cursor: 'pointer'
    });
    refresh.addEventListener('click', () => window.location.reload());
    notice.append(message, refresh);
    document.body.appendChild(notice);
  },

  persist() {
    // No-op — Cloudflare D1 is the persistence layer
  },

  load() {
    // No-op — data comes exclusively from fetchRemote()
  },

  async fetchRemote() {
    try {
      const headers = this.getAuthHeaders();
      const portal = document.body?.dataset.portal;
      const scopeParam = portal === 'admin' ? '?scope=all' : portal === 'bank' ? '?scope=bank' : '';
      const assetsEndpoint = portal === 'admin' ? '/api/admin/assets' : '/api/v1/assets' + scopeParam;
      const skipAdminData = portal !== 'admin';
      const [assetsRes, leadsRes, offersRes, viewingsRes, invoicesRes, auditRes, banksRes, usersRes] = await Promise.allSettled([
        fetch(this.API_BASE + assetsEndpoint, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/leads' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/offers' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/viewings' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/invoices' + scopeParam, { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/audit-logs', { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/banks', { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/users', { headers, cache: 'no-store' }),
      ]);

      // Assets
      if (assetsRes.status === 'fulfilled' && assetsRes.value.ok) {
        const json = await assetsRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.assets = json.data.map(d => ({
            id: d.id,
            ref: d.public_ref,
            bankId: d.bank_id,
            bankName: d.bank_name || '',
            ownershipType: d.ownership_type || 'bank',
            ownerBankId: d.owner_bank_id || '',
            ownerBankName: d.owner_bank_name || '',
            ownerName: d.owner_name || '',
            category: d.category_code,
            assetType: d.asset_type,
            region: d.region,
            district: d.district || '',
            town: d.town || '',
            publicLocation: d.public_location,
            exactAddress: d.exact_address,
            description: d.description,
            reserve: d.reserve_price,
            minOffer: d.minimum_offer,
            showReserve: !!d.show_reserve_publicly,
            status: d.status,
            publicationStatus: d.status === 'Live' ? 'Published' : (d.status === 'Approved' ? 'Pending Approval' : 'Unpublished'),
            legalStatus: d.legal_hold_active ? 'On Hold' : (d.status === 'Live' || d.status === 'Approved' ? 'Cleared' : (d.status === 'Draft' ? 'Not Started' : 'Pending')),
            valuationAmount: d.reserve_price,
            valuationDate: d.created_at,
            valuationExpiry: null,
            landSearchValid: !d.legal_hold_active,
            injunctionActive: !!d.legal_hold_active,
            legalHold: !!d.legal_hold_active,
            legalHoldReason: d.legal_hold_reason || '',
            exteriorImage: (d.image_count || 0) > 0,
            titleVerified: d.status === 'Live' || d.status === 'Approved',
            titleDetails: d.status !== 'Draft',
            enforcementBasis: d.internal_bank_ref ? 'Court Judgment' : '',
            caseRef: d.internal_bank_ref || '',
            images: d.image_count || 0,
            documents: d.document_count || 0,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            createdBy: d.created_by || 'Officer',
            legalSubstate: {
              enforcementRecorded: d.status !== 'Draft',
              instrumentsVerified: d.status === 'Live' || d.status === 'Approved',
              injunctionClear: !d.legal_hold_active,
              clearanceIssued: d.status === 'Live' || d.status === 'Approved'
            },
            legalNotes: [],
            instruments: [],
            activity: [{ when: d.created_at, who: d.created_by || 'Officer', what: 'Asset created' }]
          }));
        }
      }

      // Leads
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const json = await leadsRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.leads = json.data.map(l => ({
            id: l.id, ref: l.lead_ref, assetId: l.asset_id, assetRef: l.asset_ref || '',
            name: l.buyer_name, phone: l.phone || '', email: l.email || '',
            status: l.stage || 'New', source: 'Public Enquiry',
            createdAt: l.created_at
          }));
        }
      }

      // Offers
      if (offersRes.status === 'fulfilled' && offersRes.value.ok) {
        const json = await offersRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.offers = json.data.map(o => ({
            id: o.id, ref: o.offer_ref, assetId: o.asset_id, assetRef: o.asset_ref || '',
            buyer: o.buyer_name, amount: o.amount, status: o.status,
            belowReserve: !!o.below_reserve, date: o.created_at,
            validity: o.validity_date, notes: o.notes || ''
          }));
        }
      }

      // Viewings
      if (viewingsRes.status === 'fulfilled' && viewingsRes.value.ok) {
        const json = await viewingsRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.viewings = json.data.map(v => ({
            id: v.id, ref: v.id, assetId: v.asset_id, assetRef: v.asset_ref || '',
            buyer: v.buyer_name, phone: v.phone || '',
            scheduledAt: v.viewing_date, status: v.status,
            notes: v.notes || ''
          }));
        }
      }

      // Invoices
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
        const json = await invoicesRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.invoices = json.data.map(i => ({
            id: i.id, ref: i.invoice_ref || i.id, bankId: i.bank_id,
            bankName: i.bank_name || '', description: i.description || '',
            amount: i.total_amount || i.amount || 0, status: i.status,
            issuedAt: i.created_at, paidAt: i.paid_at
          }));
        }
      }

      // Audit Log
      if (auditRes.status === 'fulfilled' && auditRes.value?.ok) {
        const json = await auditRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.auditLog = json.data.map(a => ({
            id: a.id, when: a.created_at, who: a.actor_name,
            action: a.action_type, entity: a.entity_type,
            entityRef: a.entity_id, detail: a.delta_summary
          }));
        }
      }

      // Banks
      if (banksRes.status === 'fulfilled' && banksRes.value?.ok) {
        const json = await banksRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.banks = json.data.map(b => ({
            id: b.id,
            orgId: b.organization_id,
            name: b.legal_name,
            code: b.short_code,
            email: b.contact_email,
            phone: b.contact_phone,
            commissionRate: b.default_commission_rate,
            branchCount: b.branch_count || 1,
            assetCount: b.asset_count || 0,
            staffCount: b.staff_count || 0,
            totalPortfolioValue: b.total_portfolio_value || 0,
            status: b.status || 'Active',
            createdAt: b.created_at
          }));
        }
      }

      // Users & Staff
      if (usersRes.status === 'fulfilled' && usersRes.value?.ok) {
        const json = await usersRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.users = json.data.map(u => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            email: u.email,
            roleCode: u.role_code,
            roleName: u.role_name || u.role_code,
            bankId: u.bank_id,
            bankName: u.bank_name || (u.bank_id ? u.bank_id : 'Surge Solutions'),
            bankCode: u.bank_code || '',
            branchId: u.branch_id,
            branchName: u.branch_name || 'Head Office',
            status: u.status || 'Active',
            hasPassword: !!u.has_password,
            mfaEnabled: !!u.mfa_enabled,
            lastLogin: u.last_login,
            createdAt: u.created_at
          }));
        }
      }

      // Re-render all active portals
      if (typeof BankPortal !== 'undefined' && BankPortal.render) BankPortal.render();
      if (typeof AdminPortal !== 'undefined' && AdminPortal.render) AdminPortal.render();
      if (typeof PublicMarket !== 'undefined' && PublicMarket.render) PublicMarket.render();
    } catch (e) {
      console.warn('API fetch failed — UI will show empty state:', e);
    }
  },

  async createBank(bankData) {
    try {
      const res = await fetch(this.API_BASE + '/api/v1/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' },
        body: JSON.stringify(bankData)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create bank');
      UI.toast(`Partner bank "${bankData.legal_name}" registered successfully.`, 'success');
      await this.fetchRemote();
      return true;
    } catch (err) {
      console.error('createBank error:', err);
      UI.toast(err.message, 'error');
      return false;
    }
  },

  async createUser(userData) {
    try {
      const res = await fetch(this.API_BASE + '/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' },
        body: JSON.stringify(userData)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create staff member');
      UI.toast(`Staff user @${userData.username} registered with credentials.`, 'success');
      await this.fetchRemote();
      return true;
    } catch (err) {
      console.error('createUser error:', err);
      UI.toast(err.message, 'error');
      return false;
    }
  },

  async resetUserPassword(userId, newPassword) {
    try {
      const res = await fetch(this.API_BASE + `/api/v1/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' },
        body: JSON.stringify({ password: newPassword })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to reset password');
      UI.toast('Password updated successfully.', 'success');
      await this.fetchRemote();
      return true;
    } catch (err) {
      console.error('resetUserPassword error:', err);
      UI.toast(err.message, 'error');
      return false;
    }
  },

  async toggleUserStatus(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await fetch(this.API_BASE + `/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update status');
      UI.toast(`User status updated to ${newStatus}.`, 'success');
      await this.fetchRemote();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    if (!confirm(`Are you sure you want to permanently remove staff account @${user.username} (${user.fullName})?`)) return;
    try {
      const res = await fetch(this.API_BASE + `/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: { 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete user');
      UI.toast(`User @${user.username} deleted.`, 'success');
      await this.fetchRemote();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async deleteBank(bankId) {
    const bank = this.banks.find(b => b.id === bankId);
    if (!bank) return;
    if (!confirm(`Are you sure you want to remove partner bank "${bank.name}" (${bank.code}) and all its associated staff?`)) return;
    try {
      const res = await fetch(this.API_BASE + `/api/v1/banks/${bankId}`, {
        method: 'DELETE',
        headers: { 'x-actor-name': 'Platform Admin', 'x-actor-role': 'SA' }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete bank');
      UI.toast(`Bank ${bank.name} removed.`, 'success');
      await this.fetchRemote();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },


  seed() {
    // No mock data — Cloudflare D1 is the single source of truth
    this.assets = [];
    this.leads = [];
    this.offers = [];
    this.invoices = [];
    this.auditLog = [];
    this.viewings = [];
  },

  getAsset(id) { return this.assets.find(a => a.id === id); },
  getAssetByRef(ref) { return this.assets.find(a => a.ref === ref); },
  getPublicAssets() { return this.assets.filter(a => a.publicationStatus === 'Published' && a.status === 'Live'); },
  getBankAssets() {
    const user = Auth.getUser();
    const bankId = user?.bankId || user?.bank_id;
    const branchId = Auth.selectedBranchId;

    let list = this.assets;
    if (bankId) {
      list = list.filter(a => a.bankId === bankId);
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(a => a.branchId === branchId);
    }
    return list;
  },

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
    this.persist();
  },

  addActivity(assetId, who, what) {
    const asset = this.getAsset(assetId);
    if (asset) {
      asset.activity.push({ when: new Date().toISOString(), who, what });
      this.persist();
    }
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
    const mb = document.getElementById('modal-backdrop');
    if (!mb) return;
    const mt = document.getElementById('modal-title');
    if (mt) mt.textContent = title;
    const body = document.getElementById('modal-body');
    if (body) body.innerHTML = bodyHtml;
    const foot = document.getElementById('modal-footer');
    if (foot) foot.innerHTML = footerHtml || '<button class="btn" onclick="UI.closeModal()">Close</button>';
    const win = document.getElementById('modal-window');
    if (win) win.className = 'surge-modal-window' + (wide ? ' wide' : '');
    mb.classList.add('open');
  },
  closeModal() {
    const mb = document.getElementById('modal-backdrop');
    if (mb) mb.classList.remove('open');
  },
  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  },
  assetOwnerLabel(asset) {
    if (asset.ownershipType === 'individual') return asset.ownerName || 'Individual';
    if (asset.ownershipType === 'surge') return 'Surge Solutions';
    return asset.ownerBankName || asset.bankName || 'Partner bank';
  },
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
  exportExcel(type = 'assets') {
    let csv = '';
    let filename = 'Surge_Assets_' + new Date().toISOString().slice(0, 10) + '.csv';
    if (type === 'assets') {
      const headers = ['Reference', 'Bank', 'Category', 'Asset Type', 'Region', 'Location', 'Reserve (GHS)', 'Min Offer (GHS)', 'Status', 'Legal Status', 'Publication'];
      const rows = Store.assets.map(a => [
        a.ref,
        `"${a.bankName || 'Partner Bank'}"`,
        `"${a.category}"`,
        `"${a.assetType}"`,
        `"${a.region}"`,
        `"${a.publicLocation || a.town || ''}"`,
        a.reserve || 0,
        a.minOffer || 0,
        a.status,
        a.legalStatus,
        a.publicationStatus
      ]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    } else if (type === 'invoices') {
      filename = 'Surge_Invoices_' + new Date().toISOString().slice(0, 10) + '.csv';
      const headers = ['Invoice Ref', 'Description', 'Amount (GHS)', 'Status'];
      const rows = Store.invoices.map(i => [i.ref, `"${i.description}"`, i.amount, i.status]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    } else if (type === 'audit') {
      filename = 'Surge_Audit_Log_' + new Date().toISOString().slice(0, 10) + '.csv';
      const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Entity Ref', 'Detail'];
      const rows = Store.auditLog.map(a => [`"${a.when}"`, `"${a.who}"`, `"${a.action}"`, `"${a.entity}"`, `"${a.entityRef}"`, `"${(a.detail || '').replace(/"/g, '""')}"`]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.toast('Exported ' + filename, 'success');
  },
  exportPDF() {
    window.print();
  },
};

// ============================================================
// BANK PORTAL
// ============================================================
const BankPortal = {
  currentView: 'assets', selectedAssetId: null, detailTab: 'overview',
  subPage: null,
  branches: [],
  branchStats: null,

  async init(alreadyAuthenticated = false) {
    const authed = alreadyAuthenticated || await Auth.checkAuth('bank');
    if (!authed) return;

    document.querySelectorAll('#bank-nav .navitem').forEach(el => {
      el.addEventListener('click', () => this.nav(el.dataset.view));
    });
    this.render();
    void Store.fetchRemote();
    void this.loadBranches().then(() => this.render());
  },

  async loadBranches() {
    try {
      const headers = Store.getAuthHeaders();
      const res = await fetch(Store.API_BASE + '/api/bank/branches', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.branches = json.data;
          this.updateBranchSelect();
        }
      }
    } catch(e) {}
  },

  updateBranchSelect() {
    const sel = document.getElementById('bank-branch-select');
    if (!sel) return;
    const current = Auth.selectedBranchId || '';
    sel.innerHTML = `<option value="">All Branches (${this.branches.length} Registered)</option>` +
      this.branches.map(b => `<option value="${b.id}" ${b.id === current ? 'selected' : ''}>${b.name} (${b.region})</option>`).join('');
  },

  async switchBranch(branchId) {
    Auth.selectedBranchId = branchId || null;
    if (branchId) {
      try {
        const res = await fetch(Store.API_BASE + `/api/bank/branches/${branchId}/dashboard`, {
          headers: Store.getAuthHeaders()
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            this.branchStats = json.data;
          }
        }
      } catch(e) {}
    } else {
      this.branchStats = null;
    }
    this.render();
  },

  onRegionChange(region) {
    const distEl = document.getElementById('edit-ov-district');
    if (distEl) {
      distEl.innerHTML = GhanaGeo.renderDistrictOptions(region, '');
    }
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
    this.updateBranchSelect();
    const el = document.getElementById('bank-work');
    if (!el) return;
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
    if (!el) return;
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
    const user = Auth.getUser();
    const bankName = user?.bankName || 'Partner Bank';
    const activeBranch = this.branches.find(b => b.id === Auth.selectedBranchId);
    const branchLabel = activeBranch ? `${activeBranch.name} (${activeBranch.region} / ${activeBranch.district || 'Hub'})` : 'All Branches (Whole Bank Portfolio)';

    const totalCount = this.branchStats ? this.branchStats.totalAssets : assets.length;
    const live = this.branchStats ? this.branchStats.liveListings : assets.filter(a => a.status === 'Live').length;
    const pending = this.branchStats ? this.branchStats.pendingReview : assets.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length;
    const holds = this.branchStats ? this.branchStats.legalHolds : assets.filter(a => a.legalHold).length;
    const activeOffers = Store.offers.filter(o => ['Submitted', 'Under Review'].includes(o.status)).length;
    return `
      <div class="page-head">
        <h1>Dashboard</h1>
        <span class="crumb">${bankName} · ${branchLabel} · ${totalCount} records</span>
        <span class="spacer"></span>
        <span class="badge info">Tenant: ${bankName}</span>
        ${activeBranch ? `<span class="badge ok">Branch: ${activeBranch.name}</span>` : ''}
      </div>
      <div class="kpis">
        <div class="kpi" onclick="BankPortal.nav('assets')"><div class="k">Total Assets</div><div class="v">${totalCount}</div><div class="d">${activeBranch ? 'This branch workspace' : 'All records managed by this bank'}</div></div>
        <div class="kpi ok" onclick="BankPortal.nav('assets')"><div class="k">Live Listings</div><div class="v">${live}</div><div class="d">Published to Marketplace</div></div>
        <div class="kpi warn" onclick="BankPortal.nav('assets')"><div class="k">Pending Review</div><div class="v">${pending}</div><div class="d">Awaiting Surge review</div></div>
        <div class="kpi alert" onclick="BankPortal.nav('legal')"><div class="k">Legal Holds</div><div class="v">${holds}</div><div class="d">Blocked from publication</div></div>
        <div class="kpi" onclick="BankPortal.nav('offers')"><div class="k">Active Offers</div><div class="v">${activeOffers}</div><div class="d">Awaiting decision</div></div>
      </div>
      <div class="gridwrap">
        <div class="gridtoolbar"><strong style="font-size:12.5px">Recent Activity ${activeBranch ? '— ' + activeBranch.name : ''}</strong></div>
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
        <span class="crumb">Partner Bank · ${assets.length} records</span>
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
            <th>Reference</th><th>Owner</th><th>Category</th><th>Location</th><th class="num">Reserve (GHS)</th><th>Status</th><th>Publication</th><th>Updated</th>
          </tr></thead>
          <tbody>
            ${assets.length ? assets.map(a => `
              <tr onclick="BankPortal.openAsset('${a.id}')">
                <td class="ref">${a.ref}</td>
                <td>${UI.escapeHtml(UI.assetOwnerLabel(a))}</td>
                <td>${a.category}<span class="sub">${a.assetType}</span></td>
                <td>${a.publicLocation}</td>
                <td class="num">${a.showReserve ? UI.fmtMoney(a.reserve) : 'POA'}</td>
                <td>${UI.badge(a.status)}${a.legalHold ? ' <span class="badge hold">HOLD</span>' : ''}</td>
                <td>${UI.badge(a.publicationStatus)}</td>
                <td>${UI.fmtDateShort(a.updatedAt)}</td>
              </tr>
            `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text-2);padding:30px">No assets registered yet. Click "+ New Asset" to create your first draft.</td></tr>'}
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
    if (!a) return '<div class="empty-state"><h3>No Asset Selected</h3><p>Select an asset from the list to view details.</p></div>';
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
          ${canEdit ? `<button class="btn primary" onclick="BankPortal.saveOverview()">Save Asset Details</button>` : ''}
          ${canEdit ? `<button class="btn" onclick="BankPortal.submitForReview()">Submit for Review</button>` : ''}
          ${a.status === 'Changes Required' ? `<button class="btn primary" onclick="BankPortal.resubmitAsset()">Resubmit</button>` : ''}
          ${a.status === 'Draft' ? `<button class="btn danger" onclick="BankPortal.deleteAsset('${a.id}')">Delete Draft</button>` : ''}
          <button class="btn" onclick="BankPortal.closeAsset()">Close</button>
        </div>
      </div>
    `;
  },

  renderOverviewTab(a) {
    const canEdit = ['Draft', 'Changes Required', 'Submitted'].includes(a.status);
    const owner = UI.assetOwnerLabel(a);
    if (!canEdit) {
      return `
        <div class="grid2">
          <div class="group">
            <div class="caption">Identification</div>
            <div class="body">
              <div class="field"><span class="lbl">Public Reference</span><div class="ctl"><input value="${a.ref}" readonly></div></div>
              <div class="field"><span class="lbl">Category</span><div class="ctl"><input value="${a.category}" readonly></div></div>
              <div class="field"><span class="lbl">Asset Type</span><div class="ctl"><input value="${a.assetType || '—'}" readonly></div></div>
              <div class="field"><span class="lbl">Internal Bank Ref</span><div class="ctl"><input value="${a.caseRef || '—'}" readonly></div></div>
              <div class="field"><span class="lbl">Asset Owner</span><div class="ctl"><input value="${UI.escapeHtml(owner || '—')}" readonly></div></div>
            </div>
          </div>
          <div class="group">
            <div class="caption">Location</div>
            <div class="body">
              <div class="field"><span class="lbl">Region</span><div class="ctl"><input value="${a.region || '—'}" readonly></div></div>
              <div class="field"><span class="lbl">District</span><div class="ctl"><input value="${a.district || '—'}" readonly></div></div>
              <div class="field"><span class="lbl">Public Location</span><div class="ctl"><input value="${a.publicLocation || '—'}" readonly></div></div>
              <div class="field"><span class="lbl">Exact Address</span><div class="ctl"><input value="${a.exactAddress || '—'}" readonly></div></div>
            </div>
          </div>
        </div>
        <div class="grid2">
          <div class="group">
            <div class="caption">Pricing</div>
            <div class="body">
              <div class="field"><span class="lbl">Reserve Price (GHS)</span><div class="ctl"><input class="money" value="${Number(a.reserve).toLocaleString('en-GH', { minimumFractionDigits: 2 })}" readonly></div></div>
              <div class="field"><span class="lbl">Minimum Offer (GHS)</span><div class="ctl"><input class="money" value="${Number(a.minOffer).toLocaleString('en-GH', { minimumFractionDigits: 2 })}" readonly></div></div>
              <div class="field"><span class="lbl">Show Reserve Publicly</span><div class="ctl"><input value="${a.showReserve ? 'Yes' : 'No — Price on Application'}" readonly></div></div>
            </div>
          </div>
          <div class="group">
            <div class="caption">Valuation</div>
            <div class="body">
              <div class="field"><span class="lbl">Valuation Amount</span><div class="ctl"><input class="money" value="${a.valuationAmount ? UI.fmtMoney(a.valuationAmount) : 'Not recorded'}" readonly></div></div>
              <div class="field"><span class="lbl">Valuation Date</span><div class="ctl"><input value="${a.valuationDate ? UI.fmtDateShort(a.valuationDate) : '—'}" readonly></div></div>
              <div class="field"><span class="lbl">Expiry Status</span><div class="ctl"><input value="${a.valuationExpiry && new Date(a.valuationExpiry) > new Date() ? 'Valid' : 'REVIEW REQUIRED'}" readonly style="color:${a.valuationExpiry && new Date(a.valuationExpiry) > new Date() ? 'var(--success)' : 'var(--danger)'};font-weight:600"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    const regions = ['Greater Accra','Ashanti','Central','Western','Eastern','Northern','Volta','Upper East','Upper West','Bono','Bono East','Ahafo','Oti','Savannah','North East','Western North'];
    const categories = ['House','Apartment','Commercial','Land','Vehicle','Equipment'];

    return `
      <div class="grid2">
        <div class="group">
          <div class="caption">Asset Particulars <span style="font-size:11px;color:var(--text-2);font-weight:normal;margin-left:auto">Draft details editable</span></div>
          <div class="body">
            <div class="field"><span class="lbl">Public Reference</span><div class="ctl"><input value="${a.ref}" readonly style="background:#F0F0F0;color:var(--text-2)"></div></div>
            <div class="field"><span class="lbl">Category <span class="req">*</span></span><div class="ctl">
              <select id="edit-ov-category">
                ${categories.map(c => `<option value="${c}" ${a.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div></div>
            <div class="field"><span class="lbl">Asset Type <span class="req">*</span></span><div class="ctl">
              <input id="edit-ov-assetType" value="${a.assetType || ''}" placeholder="e.g. 4-bedroom detached house, Toyota Hilux">
            </div></div>
            <div class="field"><span class="lbl">Internal Bank Reference <span class="req">*</span></span><div class="ctl">
              <input id="edit-ov-caseRef" value="${a.caseRef || ''}" placeholder="e.g. BNK-LN-88214">
            </div></div>
            <div class="field"><span class="lbl">Asset Owner</span><div class="ctl">
              <input value="${UI.escapeHtml(owner || '—')}" readonly>
            </div></div>
            <div class="field"><span class="lbl">Enforcement Basis</span><div class="ctl">
              <select id="edit-ov-enforcementBasis">
                <option value="">— Select Basis —</option>
                <option ${a.enforcementBasis === 'Court Judgment' ? 'selected' : ''}>Court Judgment</option>
                <option ${a.enforcementBasis === 'Default Notice' ? 'selected' : ''}>Default Notice</option>
                <option ${a.enforcementBasis === 'Memorandum of Agreement' ? 'selected' : ''}>Memorandum of Agreement</option>
                <option ${a.enforcementBasis === 'Settlement Agreement' ? 'selected' : ''}>Settlement Agreement</option>
              </select>
            </div></div>
          </div>
        </div>

        <div class="group">
          <div class="caption">Location Particulars</div>
          <div class="body">
            <div class="field"><span class="lbl">Region <span class="req">*</span></span><div class="ctl">
              <select id="edit-ov-region" onchange="BankPortal.onRegionChange(this.value)">
                ${GhanaGeo.renderRegionOptions(a.region || 'Greater Accra')}
              </select>
            </div></div>
            <div class="field"><span class="lbl">District / Constituency <span class="req">*</span></span><div class="ctl">
              <select id="edit-ov-district">
                ${GhanaGeo.renderDistrictOptions(a.region || 'Greater Accra', a.district)}
              </select>
            </div></div>
            <div class="field"><span class="lbl">Town / Neighborhood</span><div class="ctl">
              <input id="edit-ov-town" value="${a.town || ''}" placeholder="e.g. Community 25">
            </div></div>
            <div class="field"><span class="lbl">Public Location <span class="req">*</span></span><div class="ctl">
              <input id="edit-ov-publicLocation" value="${a.publicLocation || ''}" placeholder="e.g. Tema, Greater Accra (shown to public)">
            </div></div>
            <div class="field"><span class="lbl">Exact Address <span class="restricted-tag">Restricted</span></span><div class="ctl">
              <input id="edit-ov-exactAddress" value="${a.exactAddress || ''}" placeholder="e.g. Plot 14, Block C (hidden until KYC/Viewing)">
            </div></div>
          </div>
        </div>
      </div>

      <div class="grid2">
        <div class="group">
          <div class="caption">Pricing &amp; Commercial Terms</div>
          <div class="body">
            <div class="field"><span class="lbl">Reserve Price (GHS) <span class="req">*</span></span><div class="ctl">
              <input id="edit-ov-reserve" class="money" type="number" value="${a.reserve || 0}" min="0" placeholder="0.00">
            </div></div>
            <div class="field"><span class="lbl">Minimum Offer (GHS)</span><div class="ctl">
              <input id="edit-ov-minOffer" class="money" type="number" value="${a.minOffer || 0}" min="0" placeholder="0.00">
            </div></div>
            <div class="field"><span class="lbl">Show Reserve Publicly</span><div class="ctl">
              <select id="edit-ov-showReserve">
                <option value="true" ${a.showReserve ? 'selected' : ''}>Yes — display reserve price</option>
                <option value="false" ${!a.showReserve ? 'selected' : ''}>No — Price on Application</option>
              </select>
            </div></div>
          </div>
        </div>

        <div class="group">
          <div class="caption">Description &amp; Overview</div>
          <div class="body">
            <div class="field"><span class="lbl">Property Description <span class="req">*</span></span><div class="ctl">
              <textarea id="edit-ov-description" rows="5" placeholder="Detailed description of features, building specifications, condition, and disposition circumstances (minimum 20 characters)...">${a.description || ''}</textarea>
            </div></div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px">
              <button class="btn primary" onclick="BankPortal.saveOverview()">Save Information</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderReadinessTab(a, readiness) {
    return `
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
          `).join('') || '<p style="color:var(--text-2);margin:0">No legal instruments have been added.</p>'}
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
          ${!a.exteriorImage ? `<div class="banner amber" style="margin-top:12px;margin-bottom:0"><svg class="ico" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/></svg><div><b>Exterior photo required.</b> At least one exterior photo is mandatory for publication.</div></div>` : ''}
        </div>
      </div>
    `;
  },

  // ============================================================
  // SUB-PAGES (correction pages)
  // ============================================================
  renderSubPage() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return '<div class="empty-state"><p>Select an asset to continue.</p></div>';
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
          `).join('') : '<p style="color:var(--text-2);margin:0">No legal instruments have been added.</p>'}
        </div>
      </div>
      <div class="group">
        <div class="caption">Add Legal Instrument</div>
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
          <div class="upload-zone" style="margin-top:12px" onclick="document.getElementById('file-inst-input').click()">
            <input type="file" id="file-inst-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onchange="BankPortal.handleFileSelect(event, 'inst')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div id="inst-status-text">Upload legal instrument</div>
            <div style="font-size:11px;margin-top:4px;color:var(--text-2)">Supported formats: PDF, DOCX (up to 25MB)</div>
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

  handleFileSelect(e, category) {
    const file = e.target.files[0];
    if (!file) return;
    this._stagedFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      category,
      uploadedAt: new Date().toISOString()
    };
    const targetId = {
      inst: 'inst-status-text', doc: 'doc-status-text', photo: 'photo-status-text',
      title: 'title-status-text', val: 'val-status-text'
    }[category];
    const el = document.getElementById(targetId);
    if (el) el.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    UI.toast(`File selected: ${file.name}`, 'success');
  },

  async uploadSelectedFile(endpoint, category, extraFields = {}) {
    const file = this._stagedFile?.file;
    if (!file) throw new Error('Choose a file before uploading.');

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('category', category);
    for (const [key, value] of Object.entries(extraFields)) {
      form.append(key, String(value));
    }

    const headers = {};
    const token = Auth.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(Store.API_BASE + endpoint, {
      method: 'POST',
      headers,
      body: form,
      cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || `Upload failed (${response.status}).`);
    }

    this._stagedFile = null;
    await Store.fetchRemote();
    return result;
  },

  async addInstrument() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('new-inst-type').value;
    const ref = document.getElementById('new-inst-ref').value.trim();
    if (!ref) return UI.toast('Instrument reference number is required', 'error');
    try {
      await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Legal Instrument', {
        title: `${type} ${ref}`
      });
      a.instruments = a.instruments || [];
      a.instruments.push({
        id: 'i' + Date.now(), type, ref, fileName: this._stagedFile?.name || ref,
        status: 'Pending', uploadedBy: Auth.getUser()?.fullName || 'Bank User', uploadedAt: new Date().toISOString()
      });
      UI.toast('Instrument uploaded and attached to the asset.', 'success');
      this.render();
    } catch (error) {
      UI.toast(error.message || 'Instrument upload failed.', 'error');
    }
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
          <div class="upload-zone" onclick="document.getElementById('file-doc-input').click()">
            <input type="file" id="file-doc-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onchange="BankPortal.handleFileSelect(event, 'doc')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div id="doc-status-text">Click to choose document file (PDF, DOCX, JPG · max 20MB)</div>
          </div>
          <button class="btn primary" style="margin-top:12px" onclick="BankPortal.addDocument()">+ Add Document</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Close</button>
      </div>
    `;
  },

  async addDocument() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('doc-type').value;
    try {
      const result = await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, type, { title: type });
      a.documentFiles = a.documentFiles || [];
      a.documentFiles.push({ id: result.document_id, type, uploadedAt: new Date().toISOString() });
      UI.toast(`${type} uploaded and queued for review.`, 'success');
      this.render();
    } catch (error) {
      UI.toast(error.message || 'Document upload failed.', 'error');
    }
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
          <div class="upload-zone" onclick="document.getElementById('file-photo-input').click()">
            <input type="file" id="file-photo-input" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="BankPortal.handleFileSelect(event, 'photo')">
            <svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <div id="photo-status-text">Click to choose photo (JPG, PNG · max 10MB)</div>
            <div style="font-size:11px;margin-top:4px;color:var(--text-2)">JPEG, PNG, or WebP · 10MB maximum</div>
          </div>
          <button class="btn primary" style="margin-top:12px" onclick="BankPortal.uploadPhoto()">+ Upload Photo</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Close</button>
      </div>
    `;
  },

  async uploadPhoto() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const type = document.getElementById('media-type').value;
    try {
      await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/photos/upload`, type, {
        caption: type,
        is_exterior: type === 'exterior' ? '1' : '0',
        is_primary: (a.images || 0) === 0 ? '1' : '0'
      });
      a.images = (a.images || 0) + 1;
      if (type === 'exterior') a.exteriorImage = true;
      UI.toast(`${type} photo uploaded successfully.`, 'success');
      this.render();
    } catch (error) {
      UI.toast(error.message || 'Photo upload failed.', 'error');
    }
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
            <div class="upload-zone" onclick="document.getElementById('file-title-input').click()">
            <input type="file" id="file-title-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onchange="BankPortal.handleFileSelect(event, 'title')">
            <div id="title-status-text">Upload title deed</div>
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

  async saveTitle() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const titleNumber = document.getElementById('title-number').value.trim();
    if (!titleNumber) return UI.toast('Title number is required', 'error');
    if (this._stagedFile?.category === 'title') {
      try {
        await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Title Deed', {
          title: `Title Deed ${titleNumber}`
        });
      } catch (error) {
        return UI.toast(error.message || 'Title document upload failed.', 'error');
      }
    }
    Store.updateAsset(this.selectedAssetId, {
      titleNumber,
      titleType: document.getElementById('title-type').value,
      titleOwner: document.getElementById('title-owner').value.trim(),
      titlePerfection: document.getElementById('title-perfection').value,
      titleDetails: true,
    }, 'J. Mensah', 'Title verification pending');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Title verification pending');
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
          <div class="field"><span class="lbl">Validity (days)</span><div class="ctl"><input id="val-validity" type="number" value="365" min="1"><span class="help">Valuation validity period configured per institutional policy.</span></div></div>
          <div class="field"><span class="lbl">Valuer Name</span><div class="ctl"><input id="val-valuer" value="${a.valuerName || ''}" placeholder="Licensed valuer firm"></div></div>
          <div class="upload-zone" style="margin-top:12px" onclick="document.getElementById('file-val-input').click()">
            <input type="file" id="file-val-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onchange="BankPortal.handleFileSelect(event, 'val')">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
            <div id="val-status-text">Upload valuation report (PDF)</div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" onclick="BankPortal.closeSubPage()">Cancel</button>
        <button class="btn primary" onclick="BankPortal.saveValuation()">Save Valuation</button>
      </div>
    `;
  },

  async saveValuation() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const amount = Number(document.getElementById('val-amount').value);
    const dateStr = document.getElementById('val-date').value;
    const validityDays = Number(document.getElementById('val-validity').value) || 365;
    const valuerName = document.getElementById('val-valuer').value.trim();
    if (!amount || amount <= 0) return UI.toast('Valuation amount is required', 'error');
    if (!dateStr) return UI.toast('Valuation date is required', 'error');
    if (this._stagedFile?.category === 'val') {
      try {
        await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Valuation Report', {
          title: `Valuation Report ${dateStr}`
        });
      } catch (error) {
        return UI.toast(error.message || 'Valuation report upload failed.', 'error');
      }
    }
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
            ${assets.length ? assets.map(a => `
              <tr onclick="BankPortal.openAsset('${a.id}')">
                <td class="ref">${a.ref}</td>
                <td>${a.enforcementBasis || '<span style="color:var(--text-2)">Not set</span>'}</td>
                <td>${(a.instruments || []).length} uploaded</td>
                <td>${UI.badge(a.legalStatus)}</td>
                <td><button class="btn small" onclick="event.stopPropagation();BankPortal.openAsset('${a.id}');BankPortal.openSubPage('edit-legal')">Edit Legal</button></td>
              </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:30px">No assets registered yet. Click "+ New Asset" to create your first draft.</td></tr>'}
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
        <button class="btn" onclick="UI.exportPDF()">Export PDF</button>
        <button class="btn" onclick="UI.exportExcel('assets')">Export Excel (CSV)</button>
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

  async newAsset() {
    const user = Auth.getUser();
    if (user?.scope !== 'surge') {
      return this.createAsset({ ownershipType: 'bank' });
    }

    try {
      UI.modal('Create Asset Draft', `
        <p>Records created here are managed by Surge Partner Bank. Select who owns this asset.</p>
        <div class="field"><span class="lbl">Asset owner</span><div class="ctl">
          <select id="asset-owner-type" onchange="BankPortal.updateOwnerFields()">
            <option value="bank">Another partner bank</option>
            <option value="individual">An individual</option>
            <option value="surge">Surge Solutions</option>
          </select>
        </div></div>
        <div class="field" id="asset-owner-bank-field"><span class="lbl">Owning bank</span><div class="ctl">
          <select id="asset-owner-bank"><option value="">Loading partner banks…</option></select>
        </div></div>
        <div class="field" id="asset-owner-name-field" style="display:none"><span class="lbl">Individual owner name</span><div class="ctl">
          <input id="asset-owner-name" maxlength="160" placeholder="Enter the owner's full name">
        </div></div>
        <div class="field"><span class="lbl">Asset category</span><div class="ctl">
          <select id="asset-category">
            <option value="House">House</option><option value="Apartment">Apartment</option>
            <option value="Commercial">Commercial</option><option value="Land">Land</option>
            <option value="Vehicle">Vehicle</option><option value="Equipment">Equipment</option>
          </select>
        </div></div>
        <div class="field"><span class="lbl">Asset type</span><div class="ctl">
          <input id="asset-type" value="Property" maxlength="120">
        </div></div>
      `, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn primary" onclick="BankPortal.submitNewAsset()">Create Draft</button>`);
      this.updateOwnerFields();

      const response = await fetch(Store.API_BASE + '/api/admin/banks', { headers: Store.getAuthHeaders() });
      if (!response.ok) throw new Error(`Could not load partner banks (${response.status}).`);
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Could not load partner banks.');

      const select = document.getElementById('asset-owner-bank');
      if (select) {
        select.replaceChildren(new Option('Select owning bank…', ''));
        result.data.filter(bank => bank.id !== 'bank-surge').forEach(bank => {
          select.add(new Option(bank.legal_name, bank.id));
        });
      }
    } catch (e) {
      console.error('Could not prepare asset form:', e);
      UI.toast(e.message || 'Could not load the partner banks.', 'error');
    }
  },

  updateOwnerFields() {
    const type = document.getElementById('asset-owner-type')?.value;
    const bankField = document.getElementById('asset-owner-bank-field');
    const nameField = document.getElementById('asset-owner-name-field');
    if (bankField) bankField.style.display = type === 'bank' ? '' : 'none';
    if (nameField) nameField.style.display = type === 'individual' ? '' : 'none';
  },

  async submitNewAsset() {
    const ownershipType = document.getElementById('asset-owner-type')?.value || 'bank';
    const ownerBankId = document.getElementById('asset-owner-bank')?.value || '';
    const ownerName = document.getElementById('asset-owner-name')?.value.trim() || '';
    if (ownershipType === 'bank' && !ownerBankId) return UI.toast('Select the owning bank.', 'error');
    if (ownershipType === 'individual' && !ownerName) return UI.toast('Enter the individual owner’s name.', 'error');
    const categoryCode = document.getElementById('asset-category')?.value || 'House';
    const assetType = document.getElementById('asset-type')?.value.trim() || 'Property';
    await this.createAsset({ ownershipType, ownerBankId, ownerName, categoryCode, assetType });
  },

  async createAsset({ ownershipType, ownerBankId = '', ownerName = '', categoryCode = 'House', assetType = 'Property' }) {
    UI.toast('Creating new asset...', 'info');
    try {
      const user = Auth.getUser();
      const branchId = Auth.selectedBranchId || user?.branchId || user?.branch_id || null;
      const actorName = user?.fullName || user?.full_name || user?.username || 'Officer';

      const res = await fetch(Store.API_BASE + '/api/v1/assets', {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({ branchId, ownershipType, ownerBankId, ownerName, categoryCode, assetType, reservePrice: 0 })
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        UI.toast('Failed to create asset: ' + (json.error || `Request failed (${res.status})`), 'error');
        return;
      }
      const d = json.data;
      const asset = {
        id: d.id, ref: d.public_ref, bankId: d.bank_id, bankName: d.bank_name || (user?.bankName || 'Surge Partner Bank'),
        ownershipType: d.ownership_type || ownershipType, ownerBankId: d.owner_bank_id || ownerBankId,
        ownerBankName: d.owner_bank_name || (ownerBankId ? document.getElementById('asset-owner-bank')?.selectedOptions[0]?.textContent : '') || '',
        ownerName: d.owner_name || ownerName, branchId: d.branch_id || branchId,
        category: d.category_code, assetType: d.asset_type || '', region: d.region || 'Greater Accra',
        district: d.district || '', town: d.town || '', publicLocation: d.public_location || '',
        exactAddress: d.exact_address || '', description: d.description || '',
        reserve: d.reserve_price || 0, minOffer: d.minimum_offer || 0, showReserve: !!d.show_reserve_publicly,
        status: d.status || 'Draft', publicationStatus: 'Unpublished', legalStatus: 'Not Started',
        valuationAmount: 0, valuationDate: null, valuationExpiry: null,
        landSearchValid: false, injunctionActive: false, legalHold: false,
        exteriorImage: false, titleVerified: false, titleDetails: false,
        enforcementBasis: '', caseRef: d.internal_bank_ref || '',
        images: 0, documents: 0,
        createdAt: d.created_at, updatedAt: d.updated_at, createdBy: d.created_by || actorName,
        legalSubstate: { enforcementRecorded: false, instrumentsVerified: false, injunctionClear: true, clearanceIssued: false },
        legalNotes: [], instruments: [],
        activity: [{ when: d.created_at, who: d.created_by || actorName, what: 'Asset created as Draft' }],
      };
      Store.assets.unshift(asset);
      UI.closeModal();
      UI.toast('Draft asset created: ' + d.public_ref, 'success');
      this.openAsset(d.id);
    } catch (e) {
      console.error('Create asset failed:', e);
      UI.toast('Network error creating asset. Check your connection.', 'error');
    }
  },

  deleteAsset(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    if (a.status !== 'Draft') {
      return UI.toast('Only draft assets can be deleted', 'error');
    }
    if (!confirm(`Are you sure you want to permanently delete draft asset ${a.ref}?`)) {
      return;
    }
    Store.assets = Store.assets.filter(x => x.id !== id);
    Store.addAudit('J. Mensah', 'DELETE', 'Asset', a.ref, 'Draft', 'Deleted', `Draft asset ${a.ref} deleted`);
    Store.persist();
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      fetch(`/api/v1/assets/${id}?scope=bank`, {
        method: 'DELETE',
        headers: Store.getAuthHeaders()
      }).catch(() => {});
    }
    this.closeAsset();
    this.render();
    UI.toast(`Draft asset ${a.ref} deleted successfully.`, 'success');
  },

  saveOverview() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return;
    const catEl = document.getElementById('edit-ov-category');
    if (!catEl) return;
    
    const category = catEl.value;
    const assetType = document.getElementById('edit-ov-assetType')?.value?.trim() || '';
    const caseRef = document.getElementById('edit-ov-caseRef')?.value?.trim() || a.caseRef;
    const enforcementBasis = document.getElementById('edit-ov-enforcementBasis')?.value || a.enforcementBasis;
    const region = document.getElementById('edit-ov-region')?.value || a.region;
    const district = document.getElementById('edit-ov-district')?.value?.trim() || '';
    const town = document.getElementById('edit-ov-town')?.value?.trim() || '';
    const publicLocation = document.getElementById('edit-ov-publicLocation')?.value?.trim() || '';
    const exactAddress = document.getElementById('edit-ov-exactAddress')?.value?.trim() || '';
    const reserve = Number(document.getElementById('edit-ov-reserve')?.value) || 0;
    const minOffer = Number(document.getElementById('edit-ov-minOffer')?.value) || 0;
    const showReserve = document.getElementById('edit-ov-showReserve')?.value === 'true';
    const description = document.getElementById('edit-ov-description')?.value?.trim() || '';

    a.category = category;
    a.assetType = assetType;
    a.caseRef = caseRef;
    a.enforcementBasis = enforcementBasis;
    a.region = region;
    a.district = district;
    a.town = town;
    a.publicLocation = publicLocation;
    a.exactAddress = exactAddress;
    a.reserve = reserve;
    a.minOffer = minOffer;
    a.showReserve = showReserve;
    a.description = description;
    a.updatedAt = new Date().toISOString();

    Store.addAudit('J. Mensah', 'UPDATE', 'Asset', a.ref, null, null, 'Asset details updated');
    Store.persist();

    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      fetch(Store.API_BASE + '/api/v1/assets/' + encodeURIComponent(a.id) + '?scope=bank', {
        method: 'PUT',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({
          internalBankRef: a.caseRef,
          categoryCode: a.category,
          assetType: a.assetType,
          description: a.description,
          region: a.region,
          district: a.district,
          town: a.town,
          publicLocation: a.publicLocation,
          exactAddress: a.exactAddress,
          reservePrice: a.reserve,
          minimumOffer: a.minOffer,
          showReservePublicly: a.showReserve
        })
      }).then(r => r.json()).then(res => {
        if (!res.success) {
          console.warn('API update warning:', res.error);
        }
      }).catch(err => {
        console.error('API update failed:', err);
      });
    }

    UI.toast('Asset details saved successfully.', 'success');
    this.render();
  },

  saveCurrent() {
    if (!this.selectedAssetId) return UI.toast('Select an asset before continuing.', 'warn');
    if (document.getElementById('edit-ov-category')) {
      this.saveOverview();
    } else {
      UI.toast('Asset record saved', 'success');
    }
  },
  submitCurrent() { this.submitForReview(); },

  submitForReview() {
    if (!this.selectedAssetId) return UI.toast('Select an asset before continuing.', 'warn');
    const a = Store.getAsset(this.selectedAssetId);
    if (a.legalHold) return UI.toast('Cannot submit: legal hold active', 'error');
    const r = Store.checkPublishReadiness(a);
    const criticalMissing = r.checks.filter(c => !c.pass && ['price','description'].includes(c.key));
    if (criticalMissing.length) return UI.toast('This action is unavailable because the following requirements are incomplete: ' + criticalMissing.map(c => c.label).join(', '), 'error');
    Store.updateAsset(this.selectedAssetId, { status: 'Submitted' }, 'J. Mensah', 'Submitted for Surge review');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Submitted for review');
    UI.toast('Asset submitted for review. Surge disposition team notified.', 'success');
    this.render();
  },

  resubmitAsset() {
    if (!this.selectedAssetId) return;
    Store.updateAsset(this.selectedAssetId, { status: 'Submitted' }, 'J. Mensah', 'Resubmitted');
    Store.addActivity(this.selectedAssetId, 'J. Mensah', 'Resubmitted');
    UI.toast('Asset resubmitted for review.', 'success');
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
        UI.toast('Offer accepted. Sale processing can now begin.', 'success');
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
  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '',

  async init(alreadyAuthenticated = false) {
    const authed = alreadyAuthenticated || await Auth.checkAuth('surge');
    if (!authed) return;

    document.querySelectorAll('#admin-nav .navitem').forEach(el => {
      el.addEventListener('click', () => this.nav(el.dataset.view));
    });
    this.render();
    void Store.fetchRemote();
  },

  onBankRegionChange(region) {
    const distEl = document.getElementById('add-bank-district');
    if (distEl) {
      distEl.innerHTML = GhanaGeo.renderDistrictOptions(region, '');
    }
  },

  nav(view) {
    document.querySelectorAll('#admin-nav .navitem').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    this.currentView = view; this.selectedAssetId = null; this.detailTab = 'overview'; this.subPage = null;
    this.render();
  },

  render() {
    this.renderDoctabs();
    const el = document.getElementById('admin-work');
    if (!el) return;
    if (this.subPage) { el.innerHTML = this.renderSubPage(); return; }
    switch (this.currentView) {
      case 'dashboard': el.innerHTML = this.renderDashboard(); break;
      case 'assets': el.innerHTML = this.selectedAssetId ? this.renderAssetDetail(this.selectedAssetId) : this.renderAssetList(); break;
      case 'review': el.innerHTML = this.renderReviewQueue(); break;
      case 'legal': el.innerHTML = this.renderLegalQueue(); break;
      case 'title': el.innerHTML = this.renderTitleQueue(); break;
      case 'offers': el.innerHTML = this.renderOffersView(); break;
      case 'audit': el.innerHTML = this.renderAuditView(); break;
      case 'banks': el.innerHTML = this.renderBanksAndStaffView(); break;
      default: el.innerHTML = this.renderAssetList();
    }
  },

  renderDoctabs() {
    const el = document.getElementById('admin-doctabs');
    if (!el) return;
    if (this.selectedAssetId) {
      const a = Store.getAsset(this.selectedAssetId);
      el.innerHTML = `<div class="dtab" onclick="AdminPortal.nav('assets')">Assets</div><div class="dtab active">${a ? a.ref : 'Asset'}<span class="x" onclick="event.stopPropagation();AdminPortal.closeAsset()">×</span></div>`;
    } else {
      const titleMap = {
        'dashboard': 'Dashboard', 'assets': 'Assets', 'review': 'Review Queue',
        'legal': 'Legal Verification', 'title': 'Title & Valuation', 'offers': 'Offers',
        'audit': 'Audit Log', 'banks': 'Banks & Staff'
      };
      el.innerHTML = `<div class="dtab active">${titleMap[this.currentView] || 'Assets'}</div>`;
    }
  },

  renderDashboard() {
    const all = Store.assets;
    const legalQueueCount = all.filter(a => a.status === 'Submitted' && !a.legalSubstate?.clearanceIssued).length;
    return `
      <div class="page-head"><h1>Admin Dashboard</h1><span class="crumb">Surge Solutions · Platform Overview</span></div>
      <div class="kpis">
        <div class="kpi" onclick="AdminPortal.nav('assets')"><div class="k">Assets</div><div class="v">${all.length}</div></div>
        <div class="kpi ok" onclick="AdminPortal.nav('assets')"><div class="k">Live</div><div class="v">${all.filter(a => a.status === 'Live').length}</div></div>
        <div class="kpi warn" onclick="AdminPortal.nav('review')"><div class="k">Review</div><div class="v">${all.filter(a => ['Submitted','Under Review'].includes(a.status)).length}</div></div>
        <div class="kpi warn" onclick="AdminPortal.nav('legal')"><div class="k">Legal Pending</div><div class="v">${legalQueueCount}</div></div>
        <div class="kpi alert" onclick="AdminPortal.nav('assets')"><div class="k">Holds</div><div class="v">${all.filter(a => a.legalHold).length}</div></div>
        <div class="kpi" onclick="AdminPortal.nav('banks')" style="cursor:pointer"><div class="k">Partner Banks</div><div class="v">${Store.banks.length}</div></div>
        <div class="kpi ok" onclick="AdminPortal.nav('banks')" style="cursor:pointer"><div class="k">Active Staff</div><div class="v">${Store.users.length}</div></div>
      </div>
      <div class="gridwrap"><div class="gridtoolbar"><strong style="font-size:12.5px">Recent Activity</strong></div><div style="padding:10px 14px"><ul class="timeline">${Store.auditLog.slice(0, 8).map(a => `<li><span class="dot ${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span><div class="tl-when">${UI.fmtDate(a.when)}</div><div class="tl-what"><b>${a.action}</b> ${a.entityRef} — ${a.detail || ''}</div><div class="tl-who">${a.who}</div></li>`).join('')}</ul></div></div>
    `;
  },

  renderAssetList() {
    return `<div class="page-head"><h1>All Assets</h1><span class="crumb">${Store.assets.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Managing Bank</th><th>Owner</th><th>Category</th><th>Status</th><th>Legal</th><th>Readiness</th></tr></thead><tbody>${Store.assets.length ? Store.assets.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${UI.escapeHtml(a.bankName)}</td><td>${UI.escapeHtml(UI.assetOwnerLabel(a))}</td><td>${UI.escapeHtml(a.category)}</td><td>${UI.badge(a.status)}</td><td>${UI.badge(a.legalStatus)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td></tr>`; }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:30px">No assets registered in the platform yet.</td></tr>'}</tbody></table></div>`;
  },

  openAsset(id) { this.selectedAssetId = id; this.currentView = 'assets'; this.detailTab = 'overview'; this.subPage = null; this.render(); },
  closeAsset() { this.selectedAssetId = null; this.subPage = null; this.render(); },
  setTab(t) { this.detailTab = t; this.render(); },
  openSubPage(name) { this.subPage = name; this.render(); },
  closeSubPage() { this.subPage = null; this.render(); },

  renderAssetDetail(id) {
    const a = Store.getAsset(id);
    if (!a) return '<div class="empty-state"><h3>No Asset Selected</h3><p>Select an asset from the list to view details.</p></div>';
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
      if (c.key === 'legal' || c.key === 'injunction' || c.key === 'hold') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open</button>`;
      else if (c.key === 'title' || c.key === 'landSearch') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Verify Title</button>`;
      else if (c.key === 'valuation') fix = `<button class="btn small" onclick="UI.toast('Ask bank to re-upload valuation','warn')">Ask Bank for New Valuation</button>`;
      else fix = `<span style="font-size:11px;color:var(--text-2);font-style:italic">Awaiting bank submission</span>`;
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
    return `<div class="page-head"><h1>Review Queue</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Status</th><th>Readiness</th><th>Action</th></tr></thead><tbody>${queue.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.status)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td><td><button class="btn small primary" onclick="event.stopPropagation();AdminPortal.openAsset('${a.id}')">Open</button></td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">No assets currently in review queue.</td></tr>'}</tbody></table></div>`;
  },

  renderLegalQueue() {
    const pending = Store.assets.filter(a => !a.legalSubstate?.clearanceIssued || a.injunctionActive || a.legalHold);
    return `<div class="page-head"><h1>Legal Verification Queue</h1><span class="crumb">${pending.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Legal Status</th><th>Instruments</th><th>Action</th></tr></thead><tbody>${pending.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.legalStatus)}</td><td>${(a.instruments || []).length}</td><td><button class="btn small primary" onclick="AdminPortal.openAsset('${a.id}');AdminPortal.openSubPage('legal-review')">Open</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">No pending legal verifications</td></tr>'}</tbody></table></div>`;
  },

  renderTitleQueue() {
    const pending = Store.assets.filter(a => !a.titleVerified);
    return `<div class="page-head"><h1>Title &amp; Valuation Queue</h1><span class="crumb">${pending.length} pending verification</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Title Details</th><th>Title Verified</th><th>Action</th></tr></thead><tbody>${pending.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${a.titleDetails ? UI.badge('Submitted') : UI.badge('Not Provided')}</td><td>${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</td><td>${a.titleDetails ? `<button class="btn small primary" onclick="AdminPortal.openAsset('${a.id}');AdminPortal.openSubPage('title-verify')">Verify Title</button>` : '<span style="font-size:11px;color:var(--text-2)">Awaiting bank submission</span>'}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">All titles verified</td></tr>'}</tbody></table></div>`;
  },

  renderOffersView() {
    return `<div class="page-head"><h1>Offers</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Ref</th><th>Asset</th><th>Buyer</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>${Store.offers.map(o => `<tr><td class="ref">${o.ref}</td><td class="ref">${o.assetRef}</td><td>${o.buyer}</td><td class="num">${UI.fmtMoney(o.amount)}</td><td>${UI.badge(o.status)}</td></tr>`).join('')}</tbody></table></div>`;
  },

  renderAuditView() {
    return `<div class="page-head"><h1>Audit Log</h1><span class="crumb">${Store.auditLog.length} events</span></div><div class="gridwrap"><div style="padding:10px 14px">${Store.auditLog.map(x => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(x.when)}</div><div class="ae-who">${x.who}</div><div class="ae-what"><b>${x.action}</b> ${x.entityRef}${x.oldValue ? ` — <span class="ae-old">${x.oldValue}</span> → <span class="ae-new">${x.newValue}</span>` : ''}${x.detail ? `<br><span style="color:var(--text-2)">${x.detail}</span>` : ''}</div></div>`).join('')}</div></div>`;
  },

  renderSubPage() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return '<div class="empty-state"><p>Select an asset to continue.</p></div>';
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
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div><b>Legal Verification Officer workspace.</b> Review each instrument. Issuing clearance confirms legal authorization to dispose of the asset. Every decision is recorded in the permanent audit trail.</div></div>

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
    
    // Strict 5-gate readiness check enforcement — no bypass
    if (!r.allPass) {
      const fails = r.checks.filter(c => !c.pass).map(c => c.label).join('; ');
      return UI.toast(`Approval blocked by platform guards: ${fails}`, 'error');
    } 
    
    Store.updateAsset(this.selectedAssetId, { status: 'Approved' }, 'A. Boateng', 'Approved'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Approved'); 
    UI.toast('Asset approved. Ready for marketplace publication.', 'success');
    this.render(); 
  },
  
  requestChanges() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { status: 'Changes Required' }, 'A. Boateng', 'Changes requested'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Changes requested'); 
    UI.toast('Changes requested successfully.', 'warn'); 
    this.render(); 
  },
  
  rejectAsset() { 
    if (!this.selectedAssetId) return; 
    Store.updateAsset(this.selectedAssetId, { status: 'Rejected' }, 'A. Boateng', 'Rejected'); 
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Rejected'); 
    this.render(); 
  },
  
  publishCurrent() { this.publishAsset(); },
  
  publishAsset() {
    if (!this.selectedAssetId) return UI.toast('Select an asset before continuing.', 'warn');
    const a = Store.getAsset(this.selectedAssetId);
    const r = Store.checkPublishReadiness(a);
    
    if (!r.allPass) {
      return UI.toast('This action is unavailable because the following requirements are incomplete: ' + r.checks.filter(c => !c.pass).map(c => c.label).join('; '), 'error');
    }
    if (a.status !== 'Approved') {
      return UI.toast('This asset must be approved before publication.', 'error');
    }
    
    Store.updateAsset(this.selectedAssetId, { status: 'Live', publicationStatus: 'Published' }, 'A. Boateng', 'Published to Marketplace');
    Store.addActivity(this.selectedAssetId, 'A. Boateng', 'Published to Marketplace');
    UI.toast('Asset published to Marketplace.', 'success');
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
  },

  // ============================================================
  // BANK PARTNERS & STAFF MANAGEMENT
  // ============================================================
  setBankTab(tab) {
    this.activeBankTab = tab;
    this.render();
  },

  filterBankStaff(bankId) {
    this.selectedBankFilter = bankId;
    this.activeBankTab = 'staff';
    this.render();
  },

  renderBanksAndStaffView() {
    const isBanks = this.activeBankTab === 'banks';
    return `
      <div class="page-head" style="flex-wrap:wrap;gap:10px">
        <div>
          <h1 style="display:flex;align-items:center;gap:8px">
            <svg class="ico" viewBox="0 0 24 24" style="width:22px;height:22px;stroke:var(--blue)"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/></svg>
            Bank Partners &amp; Staff Administration
          </h1>
          <span class="crumb">Multi-tenant institutional onboarding, staff user accounts, and credential provisioning</span>
        </div>
        <span class="spacer"></span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn primary" onclick="AdminPortal.modalAddBank()">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Onboard New Bank
          </button>
          <button class="btn" onclick="AdminPortal.modalAddStaff()" style="background:#28a745;color:#fff;border-color:#28a745">
            <svg class="ico" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>Add Staff &amp; Password
          </button>
        </div>
      </div>

      <div class="tabs-inner" style="margin:14px 0 16px">
        <div class="tab-inner ${isBanks ? 'active' : ''}" onclick="AdminPortal.setBankTab('banks')" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
          <span>Partner Banks</span>
          <span class="pill ${Store.banks.length ? 'ok' : ''}">${Store.banks.length}</span>
        </div>
        <div class="tab-inner ${!isBanks ? 'active' : ''}" onclick="AdminPortal.setBankTab('staff')" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
          <span>Bank Staff &amp; Credentials</span>
          <span class="pill ${Store.users.length ? 'ok' : ''}">${Store.users.length}</span>
        </div>
      </div>

      ${isBanks ? this.renderBanksTab() : this.renderStaffTab()}
    `;
  },

  renderBanksTab() {
    const banks = Store.banks || [];
    const totalAssets = banks.reduce((sum, b) => sum + (b.assetCount || 0), 0);
    const totalStaff = banks.reduce((sum, b) => sum + (b.staffCount || 0), 0);

    return `
      <div class="kpis" style="margin-bottom:18px">
        <div class="kpi"><div class="k">Institutional Partners</div><div class="v">${banks.length}</div></div>
        <div class="kpi ok"><div class="k">Active Bank Staff</div><div class="v">${totalStaff}</div></div>
        <div class="kpi info"><div class="k">Assets in Portfolio</div><div class="v">${totalAssets}</div></div>
        <div class="kpi alert"><div class="k">Standard Commission</div><div class="v">4.0% — 5.0%</div></div>
      </div>

      ${banks.length === 0 ? `
        <div class="gridwrap" style="padding:40px 20px;text-align:center">
          <svg class="ico" viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--text-2);margin-bottom:12px"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/></svg>
          <h3 style="margin:0 0 8px">No Partner Banks Registered Yet</h3>
          <p style="color:var(--text-2);margin:0 0 16px">Onboard institutional banking partners to begin managing repossessed and distressed assets.</p>
          <button class="btn primary" onclick="AdminPortal.modalAddBank()">+ Onboard First Partner Bank</button>
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:16px">
          ${banks.map(b => `
            <div style="background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
                  <div>
                    <span style="display:inline-block;background:var(--blue);color:#fff;font-family:Consolas,monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:3px;margin-bottom:4px">${b.code}</span>
                    <h3 style="margin:0;font-size:15px;line-height:1.3">${b.name}</h3>
                  </div>
                  <span class="badge ${b.status === 'Active' ? 'ok' : 'draft'}">${b.status}</span>
                </div>

                <div style="font-size:12px;color:var(--text-2);margin-bottom:14px;display:flex;flex-direction:column;gap:4px">
                  <div style="display:flex;align-items:center;gap:6px">
                    <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                    <span>${b.email || '—'}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    <span>${b.phone || '—'}</span>
                  </div>
                </div>

                <div style="background:#F7F9FB;border:1px solid #E8EEF5;border-radius:3px;padding:8px 12px;margin-bottom:14px;display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;text-align:center">
                  <div>
                    <div style="font-size:11px;color:var(--text-2)">Commission</div>
                    <div style="font-weight:700;font-size:13px;color:var(--blue)">${b.commissionRate || 4.0}%</div>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--text-2)">Assets</div>
                    <div style="font-weight:700;font-size:13px">${b.assetCount || 0}</div>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--text-2)">Staff</div>
                    <div style="font-weight:700;font-size:13px;color:#28a745">${b.staffCount || 0}</div>
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:6px;border-top:1px solid #ECEFF2;padding-top:12px;margin-top:auto">
                <button class="btn small ok" onclick="AdminPortal.modalAddStaff('${b.id}')" title="Add new user to this bank" style="flex:1">
                  + Add Staff
                </button>
                <button class="btn small" onclick="AdminPortal.filterBankStaff('${b.id}')" title="View staff for this bank" style="flex:1">
                  View Staff (${b.staffCount || 0})
                </button>
                <button class="btn small danger" onclick="Store.deleteBank('${b.id}')" title="Remove Bank">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  renderStaffTab() {
    let users = Store.users || [];
    const banks = Store.banks || [];

    // Filter by bank
    if (this.selectedBankFilter) {
      users = users.filter(u => u.bankId === this.selectedBankFilter);
    }

    // Filter by role
    if (this.staffRoleFilter) {
      users = users.filter(u => u.roleCode === this.staffRoleFilter);
    }

    // Filter by search query
    if (this.staffSearchQuery) {
      const q = this.staffSearchQuery.toLowerCase();
      users = users.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    const roleNameMap = {
      'BA': 'Bank Administrator',
      'LRO': 'Legal / Recovery Officer',
      'AO': 'Asset Officer',
      'AP': 'Approver',
      'BFO': 'Finance Officer',
      'VW': 'Auditor / Viewer',
      'SA': 'Surge Administrator',
      'PM': 'Property Manager',
      'LO': 'Legal Officer',
      'SG': 'System Guard'
    };

    return `
      <!-- Filter Toolbar -->
      <div class="searchpanel" style="margin-bottom:14px;padding:12px 14px">
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr auto;gap:10px;align-items:end">
          <div>
            <label style="font-size:11.5px;color:var(--text-2);margin-bottom:4px;display:block">Search Staff by Name / Username / Email</label>
            <input type="text" placeholder="e.g. Mensah or j.mensah..." value="${this.staffSearchQuery || ''}" 
              oninput="AdminPortal.staffSearchQuery = this.value; AdminPortal.render();" 
              style="width:100%;height:32px;padding:0 10px;border:1px solid var(--border);border-radius:2px;font-size:12.5px">
          </div>
          <div>
            <label style="font-size:11.5px;color:var(--text-2);margin-bottom:4px;display:block">Filter by Partner Bank</label>
            <select onchange="AdminPortal.selectedBankFilter = this.value; AdminPortal.render();" style="width:100%;height:32px;padding:0 8px;border:1px solid var(--border);border-radius:2px;font-size:12.5px">
              <option value="">All Banks &amp; Platforms (${Store.users.length})</option>
              ${banks.map(b => `<option value="${b.id}" ${this.selectedBankFilter === b.id ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11.5px;color:var(--text-2);margin-bottom:4px;display:block">Filter by Role</label>
            <select onchange="AdminPortal.staffRoleFilter = this.value; AdminPortal.render();" style="width:100%;height:32px;padding:0 8px;border:1px solid var(--border);border-radius:2px;font-size:12.5px">
              <option value="">All Roles</option>
              <option value="BA" ${this.staffRoleFilter === 'BA' ? 'selected' : ''}>Bank Administrator (BA)</option>
              <option value="LRO" ${this.staffRoleFilter === 'LRO' ? 'selected' : ''}>Legal / Recovery Officer (LRO)</option>
              <option value="AO" ${this.staffRoleFilter === 'AO' ? 'selected' : ''}>Asset Officer (AO)</option>
              <option value="AP" ${this.staffRoleFilter === 'AP' ? 'selected' : ''}>Approver (AP)</option>
              <option value="BFO" ${this.staffRoleFilter === 'BFO' ? 'selected' : ''}>Finance Officer (BFO)</option>
              <option value="VW" ${this.staffRoleFilter === 'VW' ? 'selected' : ''}>Auditor / Viewer (VW)</option>
            </select>
          </div>
          <div>
            <button class="btn" onclick="AdminPortal.staffSearchQuery=''; AdminPortal.selectedBankFilter=''; AdminPortal.staffRoleFilter=''; AdminPortal.render();" style="height:32px">Reset</button>
          </div>
        </div>
      </div>

      <!-- Staff Grid -->
      <div class="gridwrap">
        <div class="gridtoolbar" style="display:flex;align-items:center;justify-content:space-between">
          <strong style="font-size:12.5px">Showing ${users.length} of ${Store.users.length} Staff Accounts</strong>
          <span style="font-size:11.5px;color:var(--text-2)">Passwords can be assigned, viewed, and reset anytime</span>
        </div>
        <table class="grid">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Username</th>
              <th>Partner Bank</th>
              <th>Role</th>
              <th>Security &amp; Password</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.length === 0 ? `
              <tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-2)">No staff members match the selected filters.</td></tr>
            ` : users.map(u => `
              <tr>
                <td>
                  <div style="font-weight:600">${u.fullName}</div>
                  <div style="font-size:11px;color:var(--text-2)">${u.email}</div>
                </td>
                <td>
                  <span style="font-family:Consolas,monospace;font-size:12px;background:#EEF3F8;color:var(--blue);padding:2px 6px;border-radius:3px;font-weight:600">@${u.username}</span>
                </td>
                <td>
                  <div style="font-weight:600">${u.bankName || 'Surge Solutions'}</div>
                  <div style="font-size:10.5px;color:var(--text-2)">${u.branchName || 'Head Office'}</div>
                </td>
                <td>
                  <span class="badge ${u.roleCode === 'BA' ? 'ok' : u.roleCode === 'LRO' ? 'pending' : u.roleCode === 'AP' ? 'live' : 'draft'}">
                    ${roleNameMap[u.roleCode] || u.roleCode}
                  </span>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#28a745"></span>
                    <span style="font-size:11.5px;font-weight:600;color:#28a745">Password Active</span>
                    <button class="btn small" onclick="AdminPortal.modalResetPassword('${u.id}')" style="margin-left:6px;padding:2px 6px;font-size:11px">
                      Reset Password
                    </button>
                  </div>
                </td>
                <td>
                  <span class="badge ${u.status === 'Active' ? 'ok' : 'hold'}" style="cursor:pointer" onclick="Store.toggleUserStatus('${u.id}')" title="Click to toggle status">
                    ${u.status || 'Active'}
                  </span>
                </td>
                <td style="text-align:right">
                  <div style="display:inline-flex;gap:4px">
                    <button class="btn small" onclick="AdminPortal.modalResetPassword('${u.id}')" title="Assign new password">
                      Key
                    </button>
                    <button class="btn small danger" onclick="Store.deleteUser('${u.id}')" title="Delete account">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Modal: Add Partner Bank
  modalAddBank() {
    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <p style="margin:0 0 4px;font-size:12.5px;color:var(--text-2)">
          Register an authorized commercial bank partner into the Surge platform. An isolated tenant workspace with primary branch and commission structure will be generated.
        </p>
        
        <div class="field">
          <span class="lbl">Bank Legal Name <span class="req">*</span></span>
          <div class="ctl">
            <input id="add-bank-legal-name" style="width:100%" placeholder="e.g. Zenith Bank Ghana Limited" required>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Bank Short Code <span class="req">*</span></span>
          <div class="ctl">
            <input id="add-bank-short-code" style="width:100%" placeholder="e.g. ZBG" maxlength="6" style="text-transform:uppercase" required>
            <small style="font-size:10.5px;color:var(--text-2)">Used for references, tenant identifiers, and branches (3–5 uppercase letters)</small>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Primary Contact Email <span class="req">*</span></span>
          <div class="ctl">
            <input type="email" id="add-bank-email" style="width:100%" placeholder="e.g. recoveries@zenithbank.com.gh" required>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Contact Phone Number</span>
          <div class="ctl">
            <input type="tel" id="add-bank-phone" style="width:100%" placeholder="e.g. +233 30 211 4455">
          </div>
        </div>

        <div class="field">
          <span class="lbl">Default Commission Rate (%)</span>
          <div class="ctl">
            <input type="number" id="add-bank-commission" style="width:100%" value="4.0" step="0.5" min="1" max="15">
          </div>
        </div>

        <div class="field">
          <span class="lbl">Primary Branch Name</span>
          <div class="ctl">
            <input id="add-bank-branch" style="width:100%" placeholder="e.g. Head Office - Accra">
          </div>
        </div>


        <div class="field">
          <span class="lbl">Region <span class="req">*</span></span>
          <div class="ctl">
            <select id="add-bank-region" style="width:100%" onchange="AdminPortal.onBankRegionChange(this.value)">
              ${GhanaGeo.renderRegionOptions('Greater Accra')}
            </select>
          </div>
        </div>

        <div class="field">
          <span class="lbl">District / Constituency</span>
          <div class="ctl">
            <select id="add-bank-district" style="width:100%">
              ${GhanaGeo.renderDistrictOptions('Greater Accra', 'Ayawaso West Wuogon')}
            </select>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn" onclick="UI.closeModal()">Cancel</button>
      <button class="btn primary" onclick="AdminPortal.submitAddBank()">Register Bank Partner</button>
    `;

    UI.modal('Onboard New Partner Bank', bodyHtml, footerHtml, false);
  },

  async submitAddBank() {
    const legal_name = document.getElementById('add-bank-legal-name')?.value?.trim();
    const short_code = document.getElementById('add-bank-short-code')?.value?.trim().toUpperCase();
    const contact_email = document.getElementById('add-bank-email')?.value?.trim();
    const contact_phone = document.getElementById('add-bank-phone')?.value?.trim() || '+233 30 000 0000';
    const default_commission_rate = Number(document.getElementById('add-bank-commission')?.value) || 4.0;
    const initial_branch = document.getElementById('add-bank-branch')?.value?.trim() || 'Head Office - Accra';

    if (!legal_name || !short_code || !contact_email) {
      return UI.toast('Please fill in bank legal name, short code, and official contact email.', 'error');
    }

    const ok = await Store.createBank({
      legal_name,
      short_code,
      contact_email,
      contact_phone,
      default_commission_rate,
      initial_branch
    });

    if (ok) {
      UI.closeModal();
      this.activeBankTab = 'banks';
      this.render();
    }
  },

  modalAddStaff(preselectedBankId = '') {
    const banks = Store.banks || [];
    const generatedPass = 'Surge@' + Math.floor(1000 + Math.random() * 9000);

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <p style="margin:0 0 4px;font-size:12.5px;color:var(--text-2)">
          Create a bank officer account and set their initial username and password for platform access.
        </p>

        <div class="field">
          <span class="lbl">Assign to Partner Bank <span class="req">*</span></span>
          <div class="ctl">
            <select id="add-staff-bank" style="width:100%">
              ${banks.map(b => `<option value="${b.id}" ${(preselectedBankId === b.id || (!preselectedBankId && b.id === 'bank-mtb')) ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
              <option value="">Surge Solutions (Platform Administrator)</option>
            </select>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Staff Full Name <span class="req">*</span></span>
          <div class="ctl">
            <input id="add-staff-name" style="width:100%" placeholder="e.g. Abena Owusu" oninput="AdminPortal.suggestUsername(this.value)" required>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Assigned Username <span class="req">*</span></span>
          <div class="ctl">
            <div style="position:relative">
              <span style="position:absolute;left:8px;top:6px;color:var(--text-2);font-family:Consolas,monospace">@</span>
              <input id="add-staff-username" style="width:100%;padding-left:24px;font-family:Consolas,monospace" placeholder="e.g. a.owusu" required>
            </div>
            <small style="font-size:10.5px;color:var(--text-2)">Used by staff member to log in to the portal</small>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Assign Initial Password <span class="req">*</span></span>
          <div class="ctl">
            <div style="display:flex;gap:6px">
              <input type="text" id="add-staff-password" value="${generatedPass}" style="flex:1;font-family:Consolas,monospace;font-weight:600" required>
              <button type="button" class="btn small" onclick="document.getElementById('add-staff-password').value = 'Surge@' + Math.floor(1000 + Math.random() * 9000); UI.toast('Generated new secure password', 'info');">
                Regenerate
              </button>
            </div>
            <small style="font-size:10.5px;color:var(--text-2)">Staff member can change this upon initial login</small>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Official Email Address <span class="req">*</span></span>
          <div class="ctl">
            <input type="email" id="add-staff-email" style="width:100%" placeholder="e.g. a.owusu@meridiantrust.com.gh" required>
          </div>
        </div>

        <div class="field">
          <span class="lbl">System Role &amp; Permissions <span class="req">*</span></span>
          <div class="ctl">
            <select id="add-staff-role" style="width:100%">
              <option value="BA">Bank Administrator — User management and institutional settings</option>
              <option value="LRO" selected>Legal / Recovery Officer — Asset creation, documents &amp; legal workflow</option>
              <option value="AO">Asset Officer — Draft asset preparation and specifications</option>
              <option value="AP">Approver — High-level review and offer acceptance authority</option>
              <option value="BFO">Finance Officer (Bank) — Invoices, commission reconciliations</option>
              <option value="VW">Auditor / Viewer — Read-only observation</option>
            </select>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn" onclick="UI.closeModal()">Cancel</button>
      <button class="btn primary" onclick="AdminPortal.submitAddStaff()">Create Staff Account &amp; Assign Password</button>
    `;

    UI.modal('Add Bank Staff & Provision Credentials', bodyHtml, footerHtml, false);
  },

  suggestUsername(fullName) {
    const unEl = document.getElementById('add-staff-username');
    if (!unEl || !fullName) return;
    const parts = fullName.trim().toLowerCase().split(/\s+/);
    if (parts.length >= 2) {
      unEl.value = (parts[0][0] + '.' + parts[parts.length - 1]).replace(/[^a-z0-9.]/g, '');
    } else if (parts.length === 1) {
      unEl.value = parts[0].replace(/[^a-z0-9]/g, '');
    }
  },

  async submitAddStaff() {
    const bank_id = document.getElementById('add-staff-bank')?.value || null;
    const full_name = document.getElementById('add-staff-name')?.value?.trim();
    const username = document.getElementById('add-staff-username')?.value?.trim().toLowerCase().replace(/^@/, '');
    const password = document.getElementById('add-staff-password')?.value?.trim();
    const email = document.getElementById('add-staff-email')?.value?.trim().toLowerCase();
    const role_code = document.getElementById('add-staff-role')?.value;

    if (!full_name || !username || !password || !email || !role_code) {
      return UI.toast('Please complete all required fields.', 'error');
    }

    const ok = await Store.createUser({
      bank_id,
      full_name,
      username,
      password,
      email,
      role_code
    });

    if (ok) {
      UI.closeModal();
      this.activeBankTab = 'staff';
      this.render();
    }
  },

  // Modal: Reset / Assign New Password
  modalResetPassword(userId) {
    const user = Store.users.find(u => u.id === userId);
    if (!user) return;
    const newPass = 'Surge@' + Math.floor(1000 + Math.random() * 9000);

    const bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="background:#F7F9FB;border:1px solid #E8EEF5;border-radius:4px;padding:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px">${user.fullName}</div>
          <div style="font-size:12px;color:var(--text-2);display:flex;gap:12px">
            <span>Username: <b style="font-family:Consolas,monospace;color:var(--blue)">@${user.username}</b></span>
            <span>Bank: <b>${user.bankName}</b></span>
          </div>
        </div>

        <p style="margin:4px 0 0;font-size:12.5px;color:var(--text-2)">
          Assign a new password for this staff member. The password will be immediately effective across all platform logins.
        </p>

        <div class="field">
          <span class="lbl">New Password <span class="req">*</span></span>
          <div class="ctl">
            <div style="display:flex;gap:6px">
              <input type="text" id="reset-staff-password" value="${newPass}" style="flex:1;font-family:Consolas,monospace;font-weight:600" required>
              <button type="button" class="btn small" onclick="document.getElementById('reset-staff-password').value = 'Surge@' + Math.floor(1000 + Math.random() * 9000); UI.toast('Generated password', 'info');">
                Regenerate
              </button>
            </div>
            <small style="font-size:10.5px;color:var(--text-2)">Minimum 6 characters. Must contain letters and numbers.</small>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn" onclick="UI.closeModal()">Cancel</button>
      <button class="btn ok" onclick="AdminPortal.submitResetPassword('${user.id}')">Update Password</button>
    `;

    UI.modal('Reset Staff Password', bodyHtml, footerHtml, false);
  },

  async submitResetPassword(userId) {
    const password = document.getElementById('reset-staff-password')?.value?.trim();
    if (!password || password.length < 6) {
      return UI.toast('Password must be at least 6 characters long.', 'error');
    }

    const ok = await Store.resetUserPassword(userId, password);
    if (ok) {
      UI.closeModal();
      this.render();
    }
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
    if (!el) return;
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
        <button class="btn primary" onclick="PublicMarket.render()">Search</button>
      </div></div>
      <div class="resultshead"><h3>Available Assets</h3><span class="count">${pub.length} results</span><span class="spacer"></span>
        <div class="viewtoggle">
          <button class="${this.viewMode === 'grid' ? 'active' : ''}" onclick="PublicMarket.setView('grid')">Grid</button>
          <button class="${this.viewMode === 'list' ? 'active' : ''}" onclick="PublicMarket.setView('list')">List</button>
        </div>
      </div>
      <div class="cards ${this.viewMode === 'list' ? 'list-view' : ''}">
        ${pub.map(a => this.renderCard(a)).join('') || '<div class="empty-state" style="grid-column:1/-1"><h3>No live assets currently available</h3><p style="color:var(--text-2);margin-top:6px">Check back shortly or submit an enquiry to receive updates.</p></div>'}
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
            <button class="btn" onclick="PublicMarket.submitOffer('${a.id}')">Submit Formal Offer</button>
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
    if (!a) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    UI.modal('Schedule Asset Viewing', `
      <p style="font-size:12px;color:var(--text-2);margin-bottom:12px">Viewing appointment request on <b>${a.ref}</b> (${a.assetType} at ${a.publicLocation}). Surge officers will accompany you.</p>
      <div class="field"><span class="lbl">Full Name <span class="req">*</span></span><div class="ctl"><input id="vw-name" style="width:100%" placeholder="Your full legal name"></div></div>
      <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="vw-phone" style="width:100%" placeholder="+233 ..."></div></div>
      <div class="field"><span class="lbl">Email Address</span><div class="ctl"><input id="vw-email" style="width:100%" placeholder="buyer@example.com"></div></div>
      <div class="grid2">
        <div class="field"><span class="lbl">Preferred Date <span class="req">*</span></span><div class="ctl"><input type="date" id="vw-date" required style="width:100%"></div></div>
        <div class="field"><span class="lbl">Time Slot <span class="req">*</span></span><div class="ctl">
          <select id="vw-time" style="width:100%">
            <option>Morning (09:00 - 12:00 GMT)</option>
            <option>Afternoon (13:00 - 16:00 GMT)</option>
            <option>Late Afternoon (16:00 - 17:30 GMT)</option>
          </select>
        </div></div>
      </div>
      <div class="field"><span class="lbl">Ghana Card / ID Number</span><div class="ctl"><input id="vw-id" style="width:100%" placeholder="GHA-XXXXXXXXX-X (Optional for viewing)"></div></div>
      <div class="field"><span class="lbl">Special Requirements / Notes</span><div class="ctl"><textarea id="vw-notes" placeholder="Any accessibility or specific questions"></textarea></div></div>
    `, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn primary" onclick="PublicMarket.submitViewing('${id}')">Confirm Viewing Request</button>`);
  },

  submitViewing(id) {
    const name = document.getElementById('vw-name')?.value?.trim();
    const phone = document.getElementById('vw-phone')?.value?.trim();
    const date = document.getElementById('vw-date')?.value;
    const time = document.getElementById('vw-time')?.value;
    if (!name || !phone || !date) return UI.toast('Full name, phone, and preferred date are required', 'error');
    const a = Store.getAsset(id);
    const ref = 'VW-2026-' + String(Store.viewings.length + 302).padStart(6, '0');
    Store.viewings.push({
      id: 'v' + Date.now(),
      ref,
      assetId: id,
      assetRef: a.ref,
      buyer: name,
      phone,
      email: document.getElementById('vw-email')?.value?.trim() || '',
      idNumber: document.getElementById('vw-id')?.value?.trim() || '',
      scheduledAt: date + ' ' + time,
      status: 'Requested',
      notes: document.getElementById('vw-notes')?.value?.trim() || '',
      agent: null
    });
    Store.addAudit(name, 'VIEWING_REQUEST', 'Viewing', ref, null, 'Requested', `Viewing appointment requested for ${a.ref} on ${date} (${time})`);
    Store.persist();
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      fetch('/api/v1/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: id, name, phone, email: document.getElementById('vw-email')?.value?.trim() || '', date, timeSlot: time, notes: document.getElementById('vw-notes')?.value?.trim() || '' })
      }).catch(() => {});
    }
    UI.closeModal();
    UI.toast(`Viewing appointment requested. Reference: ${ref}. Surge officer will contact you.`, 'success');
  },

  submitOffer(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const minOffer = a.minOffer || a.reserve || 0;
    UI.modal('Submit Formal Purchase Offer', `
      <p style="font-size:12px;color:var(--text-2);margin-bottom:12px">Formal binding purchase offer on <b>${a.ref}</b> (${a.assetType}). All offers are reviewed by Surge Solutions and presented to the recovery bank.</p>
      <div class="field"><span class="lbl">Buyer Full Name <span class="req">*</span></span><div class="ctl"><input id="of-name" style="width:100%" placeholder="Legal purchaser name"></div></div>
      <div class="grid2">
        <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="of-phone" style="width:100%" placeholder="+233 ..."></div></div>
        <div class="field"><span class="lbl">Email Address</span><div class="ctl"><input id="of-email" style="width:100%" placeholder="buyer@example.com"></div></div>
      </div>
      <div class="grid2">
        <div class="field"><span class="lbl">Offer Amount (GHS) <span class="req">*</span></span><div class="ctl"><input type="number" id="of-amount" value="${minOffer}" style="width:100%"></div></div>
        <div class="field"><span class="lbl">Payment Method <span class="req">*</span></span><div class="ctl">
          <select id="of-payment" style="width:100%">
            <option>Cash / Direct Bank Transfer</option>
            <option>Bank Mortgage / Pre-Approved Facility</option>
            <option>Staged Structured Settlement (30/60/90 Days)</option>
          </select>
        </div></div>
      </div>
      <div class="grid2">
        <div class="field"><span class="lbl">Ghana Card PIN / ID <span class="req">*</span></span><div class="ctl"><input id="of-ghana-card" placeholder="GHA-XXXXXXXXX-X" style="width:100%"></div></div>
        <div class="field"><span class="lbl">Offer Validity <span class="req">*</span></span><div class="ctl">
          <select id="of-validity" style="width:100%">
            <option value="14">14 Business Days</option>
            <option value="30" selected>30 Calendar Days</option>
            <option value="60">60 Calendar Days</option>
          </select>
        </div></div>
      </div>
    `, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn primary" onclick="PublicMarket.confirmOffer('${id}')">Submit Formal Offer</button>`);
  },

  confirmOffer(id) {
    const name = document.getElementById('of-name')?.value?.trim();
    const phone = document.getElementById('of-phone')?.value?.trim();
    const email = document.getElementById('of-email')?.value?.trim();
    const amount = Number(document.getElementById('of-amount')?.value);
    const payment = document.getElementById('of-payment')?.value;
    const ghanaCard = document.getElementById('of-ghana-card')?.value?.trim();
    const validityDays = Number(document.getElementById('of-validity')?.value) || 30;
    
    if (!name || !phone || !amount || !ghanaCard) {
      return UI.toast('Name, phone, Ghana Card, and offer amount are required', 'error');
    }
    const a = Store.getAsset(id);
    if (a.minOffer && amount < a.minOffer) {
      return UI.toast(`Offer of ${UI.fmtMoney(amount)} is below minimum acceptable offer of ${UI.fmtMoney(a.minOffer)}`, 'error');
    }
    
    const ref = 'OF-2026-' + String(Store.offers.length + 501).padStart(6, '0');
    const expiry = new Date(Date.now() + validityDays * 86400000).toISOString();
    Store.offers.unshift({
      id: 'o' + Date.now(),
      ref,
      assetId: id,
      assetRef: a.ref,
      buyer: name,
      phone,
      email,
      ghanaCard,
      amount,
      financing: payment,
      status: 'Under Review',
      submittedAt: new Date().toISOString(),
      expiresAt: expiry
    });
    Store.addAudit(name, 'OFFER_SUBMISSION', 'Offer', ref, null, 'Under Review', `Formal offer of ${UI.fmtMoney(amount)} submitted by ${name} on ${a.ref}`);
    Store.persist();
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      fetch('/api/v1/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: id, name, phone, email, amount, ghanaCard, validityDays, paymentMethod: payment })
      }).catch(() => {});
    }
    UI.closeModal();
    UI.toast(`Formal offer submitted. Reference: ${ref}. Recovery Bank notified.`, 'success');
  },

  renderHow() { return `<div class="hero" style="padding:24px 28px"><h2>How It Works</h2></div><div class="group"><div class="caption">1. Browse &amp; Enquire</div><div class="body"><p style="margin:0;font-size:12.5px">Submit a free enquiry. No account needed.</p></div></div><div class="group"><div class="caption">2. Surge Contacts You</div><div class="body"><p style="margin:0;font-size:12.5px">A Surge officer discusses the asset and qualifies your interest.</p></div></div><div class="group"><div class="caption">3. KYC Verification</div><div class="body"><p style="margin:0;font-size:12.5px">Submit identity docs. Surge verifies.</p></div></div><div class="group"><div class="caption">4. Viewing &amp; Offer</div><div class="body"><p style="margin:0;font-size:12.5px">Schedule a viewing, then submit a formal offer.</p></div></div><div class="group"><div class="caption">5. Completion</div><div class="body"><p style="margin:0;font-size:12.5px">Bank decides. If accepted, Surge issues sale docs and invoice.</p></div></div><div style="margin-top:18px"><button class="btn primary" onclick="PublicMarket.goHome()">Browse Live Assets</button></div>`; },
  renderKyc() { return `<div class="hero" style="padding:24px 28px"><h2>KYC &amp; Verification</h2></div><div class="group"><div class="caption">Why KYC</div><div class="body"><p style="margin:0;font-size:12.5px">KYC is required before viewings and offers, but not to browse. We confirm your identity and source of funds.</p></div></div><div class="group"><div class="caption">What we collect</div><div class="body"><ul style="margin:0;padding-left:20px;font-size:12.5px"><li>Full name and contact</li><li>Ghana Card (encrypted)</li><li>Proof of funds</li><li>Consents</li></ul></div></div><div class="group"><div class="caption">How we protect it</div><div class="body"><ul style="margin:0;padding-left:20px;font-size:12.5px"><li>AES-256-GCM encryption</li><li>Encrypted cloud document vault with audited access</li><li>Only verified reviewers can access</li><li>All access logged</li></ul></div></div><div style="margin-top:18px"><button class="btn primary" onclick="PublicMarket.goHome()">Browse Assets</button></div>`; },
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
    const target = document.getElementById('app-' + btn.dataset.app);
    if (target) target.classList.add('active');
    if (btn.dataset.app === 'public') PublicMarket.render();
    if (btn.dataset.app === 'bank') BankPortal.render();
    if (btn.dataset.app === 'admin') AdminPortal.render();
  });
});

Store.init();

const bodyPortal = document.body ? document.body.dataset.portal : null;
if (bodyPortal === 'bank') {
  BankPortal.init();
} else if (bodyPortal === 'admin') {
  AdminPortal.init();
} else {
  // Public marketplace is default and needs NO auth
  PublicMarket.init();
}

UI.clock('clock-bank');
UI.clock('clock-admin');

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); BankPortal.saveCurrent(); }
  if (e.key === 'Escape') UI.closeModal();
});