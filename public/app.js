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

  getActorName() {
    const user = this.getUser();
    const name = user?.fullName || user?.full_name || user?.username;
    if (!name) throw new Error('Cannot record this action without a verified signed-in user.');
    return name;
  },

  setSession(token, user, remember) {
    this.token = null;
    this.user = user;
    this.selectedBranchId = null;
    try {
      sessionStorage.removeItem('surge_token');
      sessionStorage.removeItem('surge_user');
      localStorage.removeItem('surge_token');
      localStorage.removeItem('surge_user');
    } catch(e) {}
  },

  logout() {
    const token = this.getToken();
    fetch(Store.API_BASE + '/api/auth/logout', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      credentials: 'same-origin',
      keepalive: true
    }).catch(() => {});
    this.token = null;
    this.user = null;
    this.selectedBranchId = null;
    try {
      sessionStorage.removeItem('surge_token');
      sessionStorage.removeItem('surge_user');
      localStorage.removeItem('surge_token');
      localStorage.removeItem('surge_user');
      sessionStorage.removeItem('surge_session_present');
      localStorage.removeItem('surge_session_present');
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      let res;
      let data;
      try {
        res = await fetch(Store.API_BASE + '/api/auth/me', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {},
          credentials: 'same-origin',
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
      this.token = null;
      try {
        sessionStorage.removeItem('surge_token');
        sessionStorage.removeItem('surge_user');
        localStorage.removeItem('surge_token');
        localStorage.removeItem('surge_user');
      } catch (storageError) {
        console.warn('[Auth Guard] Could not clear legacy browser credentials:', storageError);
      }
      this.selectedBranchId = null;
      try {
        sessionStorage.setItem('surge_session_present', 'true');
      } catch (storageError) {
        console.warn('[Auth Guard] Could not store the non-secret session marker:', storageError);
      }

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
          UI.notify.error('Access denied. Administrator privileges required.', 'Access Denied');
          setTimeout(() => { window.location.href = 'bank.html'; }, 1200);
          return false;
        }
      }
      this.updateUIProfile();
      this.scheduleSessionExpiryWarning();
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

  scheduleSessionExpiryWarning() {
    clearTimeout(this._expiryWarningTimer);
    // Warn user 5 minutes before expiration (at 25 minutes mark)
    this._expiryWarningTimer = setTimeout(() => {
      UI.notify.info('Your session will expire in 5 minutes.', 'Information');
    }, 25 * 60 * 1000);
  },

  updateUIProfile() {
    const u = this.getUser();
    if (!u) return;
    const roleNames = {
      BA: 'Bank Administrator',
      LRO: 'Legal / Recovery Officer',
      AO: 'Asset Officer',
      AP: 'Approver',
      BFO: 'Finance Officer',
      VW: 'Auditor / Viewer',
      SA: 'Surge Administrator',
      PM: 'Property Manager',
      LO: 'Legal Officer',
      SG: 'System Guard'
    };
    const portal = document.body.dataset.portal;
    const userName = u.username || u.fullName || u.full_name || 'Unknown user';
    const roleCode = u.roleCode || u.role_code || '';
    const roleName = u.roleName || roleNames[roleCode] || roleCode || 'Unknown role';
    const organization = u.organizationName || u.bankName || u.bank_name
      || (u.scope === 'surge' ? 'Surge Solutions' : 'Institutional Bank Portal');
    const profile = {
      user: document.getElementById(`profile-user-${portal}`),
      role: document.getElementById(`profile-role-${portal}`),
      organization: document.getElementById(`profile-org-${portal}`)
    };
    if (profile.user) profile.user.textContent = userName;
    if (profile.role) profile.role.textContent = roleName;
    if (profile.organization) profile.organization.textContent = organization;

  }
};

// ============================================================
// SHARED DATA STORE
// ============================================================
const Store = {
  assets: [], documents: [], titles: [], valuations: [], auditLog: [], leads: [], offers: [], viewings: [], invoices: [], banks: [], users: [], branches: [],
  STORAGE_KEY: 'surge_disposition_clean_v1',
  deploymentVersion: null,
  deploymentVersionTimer: null,
  API_BASE: '',

  getAuthHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) h.Authorization = 'Bearer ' + token;
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
    this.documents = [];
    this.titles = [];
    this.valuations = [];
    this.auditLog = [];
    this.leads = [];
    this.offers = [];
    this.viewings = [];
    this.invoices = [];
    this.banks = [];
    this.users = [];
    this.branches = [];
    this.startDeploymentVersionMonitor();
    const portal = document.body?.dataset.portal;
    if (!portal || portal === 'public') this.fetchRemote();
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
    UI.notify.info('A newer version of Surge Listings is ready. Refresh safely to load the update.', 'Update Available', {
      persistent: true,
      action: {
        label: 'Refresh safely',
        onClick: () => window.location.reload()
      }
    });
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
      const assetsEndpoint = portal === 'admin' ? '/api/admin/assets' : portal === 'public' ? '/api/marketplace/assets' : '/api/v1/assets' + scopeParam;
      const documentsEndpoint = portal === 'admin' ? '/api/admin/documents' : portal === 'bank' ? '/api/bank/documents' : null;
      const skipAdminData = portal !== 'admin';
      const [assetsRes, leadsRes, offersRes, viewingsRes, invoicesRes, auditRes, banksRes, usersRes, documentsRes, titlesRes, valuationsRes] = await Promise.allSettled([
        fetch(this.API_BASE + assetsEndpoint, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/leads' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/offers' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/viewings' + scopeParam, { headers, cache: 'no-store' }),
        fetch(this.API_BASE + '/api/v1/invoices' + scopeParam, { headers, cache: 'no-store' }),
        portal === 'public' ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/audit-logs' + (portal === 'bank' ? '' : scopeParam), { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/banks', { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/v1/users', { headers, cache: 'no-store' }),
        documentsEndpoint ? fetch(this.API_BASE + documentsEndpoint, { headers, cache: 'no-store' }) : Promise.resolve(null),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/admin/titles', { headers, cache: 'no-store' }),
        skipAdminData ? Promise.resolve(null) : fetch(this.API_BASE + '/api/admin/valuations', { headers, cache: 'no-store' }),
      ]);

      // Assets
      if (assetsRes.status === 'fulfilled' && assetsRes.value.ok) {
        const json = await assetsRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          // Public marketplace API returns a simpler shape — map it into the same Store.assets format
          if (portal === 'public') {
            this.assets = json.data.map(d => ({
              id: d.id,
              ref: d.public_ref,
              bankId: '',
              bankName: '',
              category: d.category_code,
              assetType: d.asset_type,
              title: d.title,
              region: d.region,
              district: d.district || '',
              town: d.town || '',
              publicLocation: d.public_location,
              description: d.description,
              reserve: d.reserve_price,
              showReserve: !!d.show_reserve_publicly,
              status: d.status,
              publicationStatus: d.status === 'Live' ? 'Published' : 'Unpublished',
              legalHold: false,
              exteriorImage: (d.image_count || 0) > 0,
              primaryImage: d.primary_image || '',
              images: d.image_count || 0,
              beds: d.beds || null,
              baths: d.baths || null,
              occupancyStatus: d.occupancy_status || '',
              landGuardRisk: d.land_guard_risk || '',
              priceDisplay: d.price_display || 'Price on Application',
              legalStatus: 'Cleared',
              titleVerified: true,
              legalSubstate: { clearanceIssued: true, instrumentsVerified: true },
            }));
          } else {
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
            legalStatus: d.legal_hold_active ? 'On Hold' : (d.enforcement_case_status === 'Cleared' ? 'Cleared' : (d.enforcement_case_number ? 'Pending' : 'Not Started')),
            valuationAmount: d.valuation_market_value || 0,
            forcedSaleValue: d.valuation_forced_sale_value || 0,
            valuationDate: d.valuation_date || null,
            valuationExpiry: d.valuation_expiry_date || null,
            valuationValidityDays: d.valuation_validity_period_days || 180,
            valuerName: d.valuation_valuer_name || '',
            valuationStatus: d.valuation_status || '',
            valuationReviewRequired: !!d.valuation_review_required,
            valuationDocumentId: d.valuation_document_id || d.latest_valuation_document_id || '',
            landSearchValid: !d.legal_hold_active,
            injunctionActive: !!d.active_injunction,
            legalHold: !!d.legal_hold_active,
            legalHoldReason: d.legal_hold_reason || '',
            exteriorImage: (d.image_count || 0) > 0,
            titleNumber: d.title_certificate_number || '',
            titleType: d.title_type || '',
            titleRegistry: d.title_registry || '',
            titleOwner: d.title_registered_owner || '',
            titlePerfection: d.title_perfection_status || '',
            titleVerificationStatus: d.title_verification_status || '',
            titleDocumentId: d.title_document_id || d.latest_title_document_id || '',
            titleVerified: d.title_verification_status === 'Verified',
            titleDetails: !!d.title_certificate_number,
            enforcementBasis: (d.legal_instruments || []).map(instrument => instrument.instrument_type).filter(Boolean).join(', '),
            caseRef: d.enforcement_case_number || '',
            images: d.image_count || 0,
            documents: d.document_count || 0,
            deletionRequested: !!d.deletion_requested,
            deletionRequestReason: d.deletion_request_reason || '',
            deletionRequestedBy: d.deletion_requested_by || '',
            deletionRequestedAt: d.deletion_requested_at || null,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            createdBy: d.created_by || 'Not recorded',
            legalSubstate: {
              enforcementRecorded: !!d.enforcement_case_number,
              instrumentsVerified: (d.legal_instruments || []).length > 0 &&
                d.legal_instruments.every(instrument => instrument.verification_status === 'Verified'),
              injunctionClear: !d.active_injunction,
              clearanceIssued: d.enforcement_case_status === 'Cleared'
            },
            legalNotes: [],
            instruments: (d.legal_instruments || []).map(instrument => ({
              id: instrument.id,
              type: instrument.instrument_type,
              ref: instrument.instrument_ref,
              status: instrument.verification_status,
              documentId: instrument.document_id || '',
              uploadedBy: instrument.uploaded_by_name || 'Not recorded',
              uploadedAt: instrument.uploaded_at || '',
              uploadedByPublicId: instrument.uploaded_by_public_id || ''
            })),
            activity: [{ when: d.created_at, who: d.created_by || 'Not recorded', what: 'Asset created' }]
          }));
          } // end else (non-public portal)
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
          this.offers = json.data.map(o => {
            let ghanaCard = '';
            let phone = '';
            let email = '';
            const notes = o.notes || '';
            const gcMatch = notes.match(/Ghana Card:\s*([^\s·]+)/i);
            if (gcMatch) ghanaCard = gcMatch[1];
            const phoneMatch = notes.match(/Contact:\s*([^\s(]+)/i);
            if (phoneMatch) phone = phoneMatch[1];
            const emailMatch = notes.match(/\(([^)]+@[^)]+)\)/i);
            if (emailMatch) email = emailMatch[1];

            return {
              id: o.id,
              ref: o.offer_ref,
              assetId: o.asset_id,
              assetRef: o.asset_ref || '',
              assetTitle: o.asset_title || '',
              bankName: o.bank_name || '',
              buyer: o.buyer_name,
              amount: o.amount,
              status: o.status,
              belowReserve: !!o.below_reserve,
              date: o.created_at,
              validity: o.validity_date,
              notes: o.notes || '',
              conditions: o.conditions || 'Cash / Direct Bank Transfer',
              ghanaCard: ghanaCard || '',
              phone: phone || '',
              email: email || '',
              surgeVerified: !!o.surge_verified,
              surgeVerifiedBy: o.surge_verified_by || '',
              surgeVerifiedAt: o.surge_verified_at || null,
              rejectionReason: o.rejection_reason || ''
            };
          });
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
            id: i.id, ref: i.invoice_number || i.invoice_ref || i.id, bankId: i.bank_id,
            bankName: i.bank_name || '', description: i.description || '',
            amount: i.total_amount || i.amount || 0, status: i.status,
            issuedAt: i.issue_date || i.created_at, dueDate: i.due_date, paidAt: i.paid_at
          }));
        }
      }

      // Audit Log — Track activity related to assets and documents (isolated per bank; no hash codes)
      if (auditRes.status === 'fulfilled' && auditRes.value?.ok) {
        const json = await auditRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          this.auditLog = json.data
            .filter(a => ['Asset', 'Document', 'TitleRecord', 'Valuation', 'LegalInstrument', 'AssetImage', 'Offer', 'Invoice', 'EnforcementCase'].includes(a.entity_type) && !a.action_type?.startsWith('SESSION_'))
            .map(a => ({
              id: a.id,
              when: a.created_at,
              who: a.actor_name,
              actorRole: a.actor_role,
              organization: a.organization,
              action: a.action_type,
              entity: a.entity_type,
              entityRef: a.entity_id,
              detail: a.delta_summary
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
            protected: !!u.is_protected,
            hasPassword: !!u.has_password,
            mfaEnabled: !!u.mfa_enabled,
            lastLogin: u.last_login,
            createdAt: u.created_at
          }));
        }
      }

      // Private asset documents
      if (documentsRes.status === 'fulfilled' && documentsRes.value?.ok) {
        const json = await documentsRes.value.json();
        if (json.success && Array.isArray(json.data)) this.documents = json.data;
      }

      if (titlesRes.status === 'fulfilled' && titlesRes.value?.ok) {
        const json = await titlesRes.value.json();
        if (json.success && Array.isArray(json.data)) this.titles = json.data;
      }

      if (valuationsRes.status === 'fulfilled' && valuationsRes.value?.ok) {
        const json = await valuationsRes.value.json();
        if (json.success && Array.isArray(json.data)) this.valuations = json.data;
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
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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
    const confirmed = await UI.confirm({
      title: 'Remove Staff Account',
      message: `Are you sure you want to permanently remove staff account @${user.username} (${user.fullName})?`,
      confirmText: 'Delete Account',
      danger: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(this.API_BASE + `/api/v1/users/${userId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
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
    const confirmed = await UI.confirm({
      title: 'Remove Partner Bank',
      message: `Are you sure you want to remove partner bank "${bank.name}" (${bank.code}) and all its associated staff?`,
      confirmText: 'Remove Bank',
      danger: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(this.API_BASE + `/api/v1/banks/${bankId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
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
    const branchId = Auth.selectedBranchId;

    // Tenant isolation is enforced by the bank-scoped API; auth uses public bank IDs while assets use internal IDs.
    let list = this.assets;
    if (branchId && branchId !== 'all') {
      list = list.filter(a => a.branchId === branchId);
    }
    return list;
  },

  getBankAuditLogs() {
    const bankAssets = this.getBankAssets();
    const assetRefs = new Set();
    bankAssets.forEach(a => {
      if (a.ref) assetRefs.add(a.ref);
      if (a.id) assetRefs.add(a.id);
    });
    const user = Auth.getUser();
    const bankName = user?.organizationName || user?.bankName || user?.bank_name;
    const bankCode = user?.bankCode || user?.bank_code;
    const bankId = user?.bankId || user?.bank_id;

    return (this.auditLog || []).filter(entry => {
      if (entry.entityRef && assetRefs.has(entry.entityRef)) return true;
      if (entry.assetRef && assetRefs.has(entry.assetRef)) return true;
      if (bankId && (entry.organization === bankId || entry.organizationId === bankId)) return true;
      if (bankName && entry.organization === bankName) return true;
      if (bankCode && entry.organization === bankCode) return true;
      return false;
    });
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
      actorPublicId: Auth.getUser()?.id || null,
      when: new Date().toISOString(), who, action, entity, entityRef, oldValue, newValue, detail
    });
    this.persist();
  },

  addActivity(assetId, who, what) {
    const asset = this.getAsset(assetId);
    if (asset) {
      const user = Auth.getUser();
      asset.activity.push({
        when: new Date().toISOString(),
        who,
        what,
        actorPublicId: user?.id || null,
        actorRole: user?.roleCode || null
      });
      this.persist();
    }
  },

  checkPublishReadiness(asset) {
    const valuationExpiry = asset.valuationExpiry
      ? new Date(`${String(asset.valuationExpiry).slice(0, 10)}T23:59:59Z`)
      : null;
    const valuationNotExpired = !!valuationExpiry && valuationExpiry >= new Date();
    const valuationValid = !!asset.valuationAmount &&
      asset.valuationStatus === 'Valid' &&
      !asset.valuationReviewRequired &&
      valuationNotExpired;
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
        key: 'valuation', label: 'Current valuation on file', pass: valuationValid,
        fixRole: 'valuation-officer',
        diagnostics: [
          { label: 'Valuation amount recorded', pass: !!asset.valuationAmount, fixWho: 'Bank uploads valuation report' },
          { label: 'Valuation verified by Surge', pass: asset.valuationStatus === 'Valid' && !asset.valuationReviewRequired, fixWho: 'Surge valuation reviewer' },
          { label: 'Valuation not expired', pass: valuationNotExpired, fixWho: 'Bank re-upload new valuation' },
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
    if (typeof window !== 'undefined' && window.NotificationSystem) {
      if (typeof msg === 'object' && msg !== null) {
        return window.NotificationSystem.notify(msg);
      }
      return window.NotificationSystem.notify({ message: msg, type, duration });
    }
    const el = document.getElementById('toast');
    if (el) {
      el.textContent = typeof msg === 'object' ? (msg.message || msg.title || '') : msg;
      el.className = 'surge-toast show ' + type;
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.classList.remove('show'), duration);
    }
  },
  notify: {
    success: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.success(msg, title, opt) : UI.toast(msg, 'success')),
    error: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.error(msg, title, opt) : UI.toast(msg, 'error')),
    warn: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.warning(msg, title, opt) : UI.toast(msg, 'warn')),
    warning: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.warning(msg, title, opt) : UI.toast(msg, 'warn')),
    info: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.info(msg, title, opt) : UI.toast(msg, 'info')),
    loading: (msg, title, opt) => (window.NotificationSystem ? window.NotificationSystem.loading(msg, title, opt) : UI.toast(msg, 'info')),
    persistentError: (msg, title, onRetry) => (window.NotificationSystem ? window.NotificationSystem.persistentError(msg, title, onRetry) : UI.toast(msg, 'error')),
    promise: (...args) => window.NotificationSystem?.promise(...args)
  },
  confirm(opts) {
    if (typeof window !== 'undefined' && window.NotificationSystem?.confirm) {
      return window.NotificationSystem.confirm(opts);
    }
    const message = typeof opts === 'string' ? opts : (opts?.message || 'Are you sure?');
    return Promise.resolve(window.confirm(message));
  },
  showFieldError(input, msg) {
    window.NotificationSystem?.setFieldError(input, msg);
  },
  clearFieldError(input) {
    window.NotificationSystem?.clearFieldError(input);
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
  auditActor(entry) {
    if (!entry) return 'System';
    const who = this.escapeHtml(entry.who || 'Staff Member');
    const role = this.escapeHtml(entry.actorRole || 'Staff');
    const org = this.escapeHtml(entry.organization || '');
    if (entry.actorRole === 'Buyer' || entry.actorRole === 'Public Buyer') {
      return `${who} · Buyer`;
    }
    // Do not show hash codes of logs: display only verified names, roles and organizations
    const parts = [who, role, org].filter(Boolean);
    return parts.join(' · ') || 'Verified Staff';
  },
  cleanAuditDetail(detail, entry) {
    if (!detail) return entry?.action || 'Activity recorded';
    // Remove any hex hash codes, UUIDs, or raw database ID hashes
    let clean = String(detail)
      .replace(/\b[0-9a-fA-F]{24,64}\b/g, '')
      .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '')
      .replace(/\b(u|doc|val|li|img|sess|asset|bank|branch)-[a-zA-Z0-9_-]{8,}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return this.escapeHtml(clean || entry?.action || 'Activity recorded');
  },
  cleanAuditRef(ref, entityType) {
    if (!ref) return '';
    if (/^AST-[A-Z0-9-]+$/i.test(ref)) return ref;
    if (/^[0-9a-fA-F-]{16,}$/.test(ref) || /^(doc|val|li|img|lead|inv)-/i.test(ref)) {
      return entityType || 'Record';
    }
    return ref;
  },
  fmtDateShort(iso) { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }); },
  badge(status) {
    const map = {
      'Live': 'live', 'Published': 'live', 'Verified': 'ok', 'Cleared': 'ok',
      'Draft': 'draft', 'Submitted': 'pending', 'Under Review': 'pending', 'Pending Approval': 'pending',
      'Under Bank Review': 'pending', 'Pending Surge Verification': 'warn', 'Rejected by Surge': 'rejected',
      'Accepted': 'ok', 'Deletion Requested': 'warn',
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
  exportPDF(reportType = 'portfolio') {
    const assets = Store.assets || [];
    const bankAssets = typeof Store.getBankAssets === 'function' ? Store.getBankAssets() : assets;
    const invoices = Store.invoices || [];
    const offers = Store.offers || [];
    const acceptedOffers = offers.filter(o => o.status === 'Accepted');
    const totalRealized = acceptedOffers.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalBilled = invoices.reduce((sum, i) => sum + (i.status !== 'Cancelled' ? Number(i.amount) || 0 : 0), 0);
    const user = Auth.getUser();
    const bankName = user?.organizationName || user?.bankName || user?.bank_name || 'Surge Solutions';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });

    let title = 'Portfolio Summary Report';
    let bodyContent = '';

    if (reportType === 'portfolio' || reportType === 'assets') {
      title = 'Asset Portfolio Summary Report';
      const live = bankAssets.filter(a => a.status === 'Live').length;
      const drafts = bankAssets.filter(a => a.status === 'Draft').length;
      const sold = bankAssets.filter(a => a.status === 'Sold').length;
      const review = bankAssets.filter(a => ['Submitted', 'Under Review'].includes(a.status)).length;
      bodyContent = `
        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-label">Total Assets</div><div class="kpi-value">${bankAssets.length}</div></div>
          <div class="kpi-card"><div class="kpi-label">Live on Market</div><div class="kpi-value green">${live}</div></div>
          <div class="kpi-card"><div class="kpi-label">Drafts</div><div class="kpi-value">${drafts}</div></div>
          <div class="kpi-card"><div class="kpi-label">Under Review</div><div class="kpi-value amber">${review}</div></div>
          <div class="kpi-card"><div class="kpi-label">Disposed / Sold</div><div class="kpi-value green">${sold}</div></div>
          <div class="kpi-card"><div class="kpi-label">Total Realized</div><div class="kpi-value">${this.fmtMoney(totalRealized)}</div></div>
        </div>
        <h3>Asset Register</h3>
        <table>
          <thead><tr><th>Reference</th><th>Category</th><th>Type</th><th>Region</th><th>Location</th><th style="text-align:right">Reserve (GHS)</th><th>Status</th></tr></thead>
          <tbody>
            ${bankAssets.map(a => `<tr><td class="mono">${a.ref}</td><td>${a.category || ''}</td><td>${a.assetType || ''}</td><td>${a.region || ''}</td><td>${a.publicLocation || a.town || ''}</td><td style="text-align:right">${a.showReserve || a.reserve ? this.fmtMoney(a.reserve || 0) : 'P.O.A.'}</td><td><span class="status-pill ${a.status === 'Live' ? 'green' : a.status === 'Sold' ? 'blue' : a.status === 'Draft' ? 'grey' : 'amber'}">${a.status}</span></td></tr>`).join('')}
          </tbody>
        </table>`;
    }

    if (reportType === 'invoices' || reportType === 'billing') {
      title = 'Billing & Invoice Report';
      bodyContent += `
        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-label">Total Invoices</div><div class="kpi-value">${invoices.length}</div></div>
          <div class="kpi-card"><div class="kpi-label">Total Billed</div><div class="kpi-value">${this.fmtMoney(totalBilled)}</div></div>
          <div class="kpi-card"><div class="kpi-label">Paid</div><div class="kpi-value green">${invoices.filter(i => i.status === 'Paid').length}</div></div>
          <div class="kpi-card"><div class="kpi-label">Outstanding</div><div class="kpi-value amber">${invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').length}</div></div>
        </div>
        <h3>Invoice Register</h3>
        <table>
          <thead><tr><th>Invoice #</th><th>Description</th><th>Issue Date</th><th>Due Date</th><th style="text-align:right">Amount (GHS)</th><th>Status</th></tr></thead>
          <tbody>
            ${invoices.map(i => `<tr><td class="mono">${i.ref}</td><td>${this.escapeHtml(i.description || '')}</td><td>${i.issuedAt ? this.fmtDateShort(i.issuedAt) : '—'}</td><td>${i.dueDate ? this.fmtDateShort(i.dueDate) : '—'}</td><td style="text-align:right">${this.fmtMoney(i.amount || 0)}</td><td><span class="status-pill ${i.status === 'Paid' ? 'green' : i.status === 'Overdue' ? 'red' : 'amber'}">${i.status}</span></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">No invoices on record.</td></tr>'}
          </tbody>
        </table>`;
    }

    if (reportType === 'disposal') {
      title = 'Disposal & Transaction Realization Report';
      bodyContent = `
        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-label">Accepted Offers</div><div class="kpi-value">${acceptedOffers.length}</div></div>
          <div class="kpi-card"><div class="kpi-label">Total Realized</div><div class="kpi-value green">${this.fmtMoney(totalRealized)}</div></div>
          <div class="kpi-card"><div class="kpi-label">Surge Fees Billed</div><div class="kpi-value">${this.fmtMoney(totalBilled)}</div></div>
        </div>
        <h3>Accepted Offers</h3>
        <table>
          <thead><tr><th>Offer Ref</th><th>Asset</th><th>Purchaser</th><th style="text-align:right">Realized Amount</th><th>Date</th></tr></thead>
          <tbody>
            ${acceptedOffers.map(o => `<tr><td class="mono">${o.ref}</td><td class="mono">${o.assetRef || ''}</td><td>${this.escapeHtml(o.buyer || '')}</td><td style="text-align:right">${this.fmtMoney(o.amount || 0)}</td><td>${this.fmtDateShort(o.date)}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">No accepted offers on record.</td></tr>'}
          </tbody>
        </table>`;
    }

    if (reportType === 'audit') {
      title = 'Audit Trail Report';
      const logs = Store.auditLog.slice(0, 200);
      bodyContent = `
        <p style="color:#555;margin-bottom:16px">Showing most recent ${logs.length} of ${Store.auditLog.length} audit entries.</p>
        <table>
          <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Reference</th><th>Detail</th></tr></thead>
          <tbody>
            ${logs.map(a => `<tr><td style="white-space:nowrap">${this.fmtDate(a.when)}</td><td>${this.escapeHtml(a.who || '')}</td><td class="mono">${a.action}</td><td>${a.entity}</td><td class="mono">${a.entityRef || ''}</td><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${this.escapeHtml(a.detail || '')}</td></tr>`).join('')}
          </tbody>
        </table>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} — Surge Solutions</title>
    <style>
      @page { size: A4 landscape; margin: 18mm 15mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', 'Inter', Arial, sans-serif; font-size: 11px; color: #1A2B3C; line-height: 1.45; padding: 28px 32px; }
      .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0E2A47; padding-bottom: 14px; margin-bottom: 20px; }
      .report-header .brand { display: flex; align-items: center; gap: 10px; }
      .report-header .brand .logo { width: 34px; height: 34px; background: #0E2A47; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; letter-spacing: -0.5px; }
      .report-header .brand h1 { font-size: 18px; font-weight: 700; color: #0E2A47; letter-spacing: -0.3px; }
      .report-header .brand .sub { font-size: 10.5px; color: #6B7B8D; margin-top: 1px; }
      .report-header .meta { text-align: right; font-size: 10.5px; color: #6B7B8D; line-height: 1.6; }
      .report-header .meta strong { color: #1A2B3C; }
      .report-title { font-size: 15px; font-weight: 700; color: #0E2A47; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E0E5EA; }
      .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; }
      .kpi-card { background: #F7F9FB; border: 1px solid #E0E5EA; border-radius: 4px; padding: 10px 12px; }
      .kpi-label { font-size: 9.5px; color: #6B7B8D; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      .kpi-value { font-size: 18px; font-weight: 700; color: #1A2B3C; margin-top: 2px; }
      .kpi-value.green { color: #1A7F37; }
      .kpi-value.amber { color: #9A6700; }
      .kpi-value.red { color: #CF222E; }
      h3 { font-size: 12.5px; font-weight: 700; color: #0E2A47; margin: 16px 0 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 18px; }
      thead { background: #F0F3F7; }
      th { padding: 7px 8px; text-align: left; font-weight: 600; color: #3D4F5F; border-bottom: 2px solid #D0D7DD; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
      td { padding: 6px 8px; border-bottom: 1px solid #ECEFF2; color: #1A2B3C; }
      tbody tr:nth-child(even) { background: #FAFBFC; }
      .mono { font-family: 'Consolas', 'Courier New', monospace; font-size: 10px; font-weight: 600; }
      .status-pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
      .status-pill.green { background: #DAFBE1; color: #1A7F37; }
      .status-pill.amber { background: #FFF8C5; color: #9A6700; }
      .status-pill.red { background: #FFEBE9; color: #CF222E; }
      .status-pill.blue { background: #DDF4FF; color: #0969DA; }
      .status-pill.grey { background: #F0F3F7; color: #57606A; }
      .report-footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #E0E5EA; display: flex; justify-content: space-between; font-size: 9.5px; color: #8B95A1; }
      .confidential { color: #CF222E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      @media print { body { padding: 0; } .no-print { display: none !important; } }
    </style></head><body>
      <div class="report-header">
        <div class="brand">
          <div class="logo">SS</div>
          <div><h1>Surge Solutions</h1><div class="sub">Licensed Intermediary · Asset Recovery & Disposal</div></div>
        </div>
        <div class="meta">
          <div><strong>Institution:</strong> ${this.escapeHtml(bankName)}</div>
          <div><strong>Report Date:</strong> ${dateStr} at ${timeStr} GMT</div>
          <div><strong>Generated by:</strong> ${this.escapeHtml(user?.fullName || user?.username || 'System')}</div>
          <div><strong>Report ID:</strong> RPT-${Date.now().toString(36).toUpperCase()}</div>
        </div>
      </div>
      <div class="report-title">${title}</div>
      ${bodyContent}
      <div class="report-footer">
        <div class="confidential">Confidential — For Authorised Recipients Only</div>
        <div>© ${now.getFullYear()} Surge Solutions · Accra, Ghana · All rights reserved</div>
      </div>
      <div class="no-print" style="text-align:center;margin-top:24px">
        <button onclick="window.print()" style="padding:10px 28px;background:#0E2A47;color:#fff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer">Print / Save as PDF</button>
        <button onclick="window.close()" style="padding:10px 28px;background:#E0E5EA;color:#1A2B3C;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;margin-left:8px">Close</button>
      </div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) { this.toast('Please allow pop-ups to generate reports.', 'error'); return; }
    win.document.write(html);
    win.document.close();
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
  tabs: [
    { id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }
  ],
  activeTabId: 'dashboard',

  getViewTitle(view) {
    const titleMap = {
      'dashboard': 'Dashboard',
      'assets': 'My Assets',
      'legal': 'Legal Instruments',
      'documents': 'Documents',
      'offers': 'Offers & Decisions',
      'reports': 'Reports',
      'notifications': 'Notifications'
    };
    return titleMap[view] || 'Workspace';
  },

  openTab(tab) {
    if (!Array.isArray(this.tabs)) this.tabs = [];
    if (!tab || !tab.id) return;
    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);
    if (existingIndex >= 0) {
      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };
    } else {
      this.tabs.push(tab);
    }
    this.switchTab(tab.id);
  },

  switchTab(tabId) {
    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {
      this.tabs = [{ id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }];
    }
    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];
    if (!tab) return;
    this.activeTabId = tab.id;
    this.currentView = tab.view || 'dashboard';
    this.selectedAssetId = tab.assetId || null;
    this.selectedOfferId = tab.selectedOfferId || null;
    this.subPage = tab.subPage || null;
    this.detailTab = tab.detailTab || 'overview';

    document.querySelectorAll('#bank-nav .navitem').forEach(n => {
      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);
    });

    this.render();
  },

  closeTab(tabId, event) {
    if (event) event.stopPropagation();
    if (!Array.isArray(this.tabs)) return;
    const idx = this.tabs.findIndex(t => t.id === tabId);
    if (idx < 0) return;
    const wasActive = this.activeTabId === tabId;
    this.tabs.splice(idx, 1);
    if (this.tabs.length === 0) {
      this.tabs = [{ id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }];
      this.activeTabId = 'dashboard';
      this.switchTab('dashboard');
    } else if (wasActive) {
      const nextTab = this.tabs[Math.min(idx, this.tabs.length - 1)];
      this.switchTab(nextTab.id);
    } else {
      this.renderDoctabs();
    }
  },

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
    this.openTab({
      id: view,
      title: this.getViewTitle(view),
      view: view,
      assetId: null,
      subPage: null,
      detailTab: 'overview',
      closable: this.tabs.length > 0 && view !== 'dashboard'
    });
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
    el.querySelectorAll('[data-document-download]').forEach(button => {
      button.addEventListener('click', () => this.downloadDocument(button.dataset.documentDownload));
    });
    el.querySelectorAll('[data-document-delete]').forEach(button => {
      button.addEventListener('click', () => this.deleteDocument(button.dataset.documentDelete));
    });
  },

  async downloadDocument(documentId) {
    try {
      const headers = {};
      const token = Auth.getToken();
      if (token) headers.Authorization = 'Bearer ' + token;
      const response = await fetch(
        Store.API_BASE + `/api/bank/documents/${encodeURIComponent(documentId)}/download`,
        { headers, cache: 'no-store' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${response.status}).`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || 'document';
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      UI.toast(error.message || 'Document download failed.', 'error');
    }
  },

  async deleteDocument(documentId) {
    const doc = Store.documents.find(item => item.id === documentId);
    if (!doc) return UI.toast('Document not found. Refresh the page and try again.', 'error');
    const linkedToVerifiedRecord = doc.title_verified || doc.valuation_verified || doc.instrument_verified;
    if (linkedToVerifiedRecord) {
      return UI.toast('This document supports a completed verification. Ask Surge to revoke it before deleting.', 'error');
    }
    const confirmed = await UI.confirm({
      title: 'Delete Document?',
      message: `Delete "${doc.title}" (${doc.category})? This removes the stored file and returns any pending linked review to pending.`,
      confirmText: 'Delete Document',
      danger: true
    });
    if (!confirmed) return;
    try {
      const response = await fetch(
        Store.API_BASE + `/api/bank/documents/${encodeURIComponent(documentId)}`,
        {
          method: 'DELETE',
          headers: Store.getAuthHeaders(),
          credentials: 'same-origin',
          cache: 'no-store'
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Document deletion failed (${response.status}).`);
      await Store.fetchRemote();
      UI.toast(result.message || 'Document deleted.', 'success');
    } catch (error) {
      UI.toast(error.message || 'Document could not be deleted.', 'error');
    }
  },

  renderDoctabs() {
    const el = document.getElementById('bank-doctabs');
    if (!el) return;
    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {
      const current = this.currentView || 'dashboard';
      this.tabs = [{ id: current, title: this.getViewTitle ? this.getViewTitle(current) : 'Dashboard', view: current, closable: false }];
      this.activeTabId = current;
    }
    el.innerHTML = this.tabs.map(t => `
      <div class="dtab ${t.id === this.activeTabId ? 'active' : ''}" onclick="BankPortal.switchTab('${UI.escapeHtml(t.id)}')">
        <span>${UI.escapeHtml(t.title)}</span>
        ${t.closable ? `<span class="x" title="Close tab" onclick="BankPortal.closeTab('${UI.escapeHtml(t.id)}', event)">×</span>` : ''}
      </div>
    `).join('');
  },

  getSubPageTitle() {
    return { 'edit-basics': 'Edit Basics', 'edit-legal': 'Edit Legal', 'edit-docs': 'Manage Documents',
      'edit-media': 'Listing Photos', 'edit-title': 'Edit Title', 'edit-valuation': 'Edit Valuation', 'offer-detail': 'Offer Decision' }[this.subPage] || '';
  },

  renderDashboard() {
    const assets = Store.getBankAssets();
    const user = Auth.getUser();
    const isSurgeUser = user?.scope === 'surge';
    const bankName = isSurgeUser
      ? 'Surge Partner Bank'
      : (user?.bankName || user?.bank_name || user?.organizationName || 'Partner Bank');
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
            ${Store.getBankAuditLogs().slice(0, 8).map(a => `
              <li><span class="dot ${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span>
                <div class="tl-when">${UI.fmtDate(a.when)}</div>
                <div class="tl-what"><b>${UI.escapeHtml(a.action)}</b> ${UI.escapeHtml(UI.cleanAuditRef(a.entityRef, a.entity))} — ${UI.cleanAuditDetail(a.detail, a)}</div>
                <div class="tl-who">${UI.auditActor(a)}</div>
              </li>
            `).join('') || '<li style="color:var(--text-2)">No recent activity</li>'}
          </ul>
        </div>
      </div>
    `;
  },

  renderAssetList() {
    const assets = Store.getBankAssets();
    const user = Auth.getUser();
    const isSurgeUser = user?.scope === 'surge';
    const bankName = isSurgeUser
      ? 'Surge Partner Bank'
      : (user?.bankName || user?.bank_name || user?.organizationName || 'Partner Bank');
    return `
      <div class="page-head">
        <h1>My Assets</h1>
        <span class="crumb">${UI.escapeHtml(bankName)} · ${assets.length} records</span>
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

  openAsset(id) {
    this._stagedFile = null;
    this._stagedPhotos = {};
    this.selectedAssetId = id;
    this.currentView = 'assets';
    this.detailTab = 'overview';
    this.subPage = null;
    this.render();
    void this.loadPhotos(id);
  },
  closeAsset() {
    this._stagedFile = null;
    this._stagedPhotos = {};
    this.selectedAssetId = null;
    this.subPage = null;
    this.render();
  },
  setTab(t) {
    this.detailTab = t;
    this.render();
    if (t === 'media' && this.selectedAssetId) {
      void this.loadPhotos(this.selectedAssetId);
    }
  },

  openOffer(offerId) {
    this.selectedOfferId = offerId;
    this.currentView = 'offers';
    this.subPage = 'offer-detail';
    this.render();
  },
  openSubPage(name) {
    this._stagedFile = null;
    this.subPage = name;
    this.render();
    if (name === 'edit-media' && this.selectedAssetId) {
      void this.loadPhotos(this.selectedAssetId);
    }
  },
  closeSubPage() {
    this._stagedFile = null;
    this._stagedPhotos = {};
    this.selectedOfferId = null;
    this.subPage = null;
    this.render();
  },

  async loadPhotos(assetId) {
    if (!assetId) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(assetId)}/photos`, {
        headers: Store.getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this._currentPhotos = json.data;
        if (this.subPage === 'edit-media' || (this.currentView === 'assets' && this.detailTab === 'media')) {
          this.render();
        }
      }
    } catch (e) {
      console.warn('Failed to load photos:', e);
    }
  },

  async performAssetAction(action, successMessage, body = {}, assetId = this.selectedAssetId) {
    if (!assetId) {
      UI.toast('Select an asset before continuing.', 'warn');
      return false;
    }
    try {
      const response = await fetch(`${Store.API_BASE}/api/admin/assets/${encodeURIComponent(assetId)}/${action}`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(body)
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`The API returned an invalid response (${response.status}).`);
      }
      if (!response.ok || !result.success) {
        const failedGates = Array.isArray(result.gates)
          ? result.gates.filter(gate => !gate.passed).map(gate => gate.gate).join(', ')
          : '';
        throw new Error([result.error || `Action failed (${response.status}).`, failedGates].filter(Boolean).join(' Missing requirements: '));
      }
      await Store.fetchRemote();
      UI.toast(successMessage || result.message || 'Asset updated.', 'success');
      this.render();
      PublicMarket.render();
      BankPortal.render();
      return true;
    } catch (error) {
      console.error(`Asset ${action} failed:`, error);
      UI.toast(error.message || `Could not ${action.replace('-', ' ')} the asset. Please retry.`, 'error');
      return false;
    }
  },

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
      ${a.deletionRequested ? `<div class="banner warn"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div><b>DELETION REQUEST PENDING.</b> A request to delete this published listing has been submitted to Surge Admin. Reason: "${UI.escapeHtml(a.deletionRequestReason || 'Requested by bank')}".</div></div>` : ''}

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
          ${a.status === 'Live' ? (
            a.deletionRequested
              ? `<button class="btn" disabled style="opacity:0.7">Deletion Pending Surge Approval</button>`
              : `<button class="btn alert" onclick="BankPortal.requestDeletionModal('${a.id}')">Request Deletion</button>`
          ) : `<button class="btn danger" onclick="BankPortal.deleteAsset('${a.id}')">Delete Asset</button>`}
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
              <div class="tl-who">${UI.auditActor(act)}</div>
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
              <span class="inst-type">${UI.escapeHtml(i.type)}</span>
              <span class="inst-ref">${UI.escapeHtml(i.ref)}</span>
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
    const docs = Store.documents.filter(doc => doc.asset_id === a.id);
    return `
      <div class="group">
        <div class="caption">Title &amp; Supporting Documents <button class="btn small" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-docs')">+ Upload Document</button></div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Total Documents</span><span class="kv-v">${a.documents} files</span></div>
          <div class="kv-row"><span class="kv-k">Title Verified</span><span class="kv-v">${a.titleVerified ? UI.badge('Verified') : UI.badge('Pending')}</span></div>
          <div class="kv-row"><span class="kv-k">Land Search</span><span class="kv-v">${a.landSearchValid ? UI.badge('Valid') : UI.badge('Pending')}</span></div>
          ${docs.map(doc => `<div class="kv-row"><span class="kv-k">${UI.escapeHtml(doc.title)} · ${UI.escapeHtml(doc.category)}</span><button class="btn small" data-document-download="${UI.escapeHtml(doc.id)}">Download</button><button class="btn small danger" data-document-delete="${UI.escapeHtml(doc.id)}" ${doc.title_verified || doc.valuation_verified || doc.instrument_verified ? 'disabled title="Revoke the completed verification before deleting this document."' : ''}>Delete</button></div>`).join('')}
        </div>
      </div>
    `;
  },

  renderMediaTab(a) {
    const photos = this._currentPhotos || [];
    const exterior = photos.find(p => p.caption === 'exterior' || p.is_exterior) || (a.exteriorImage ? { caption: 'exterior' } : null);
    const interior = photos.find(p => p.caption === 'interior');
    const street = photos.find(p => p.caption === 'street' || p.caption === 'surroundings');
    const totalCount = photos.length || a.images || 0;
    const isComplete = Boolean(exterior && interior && street);

    return `
      <div class="group">
        <div class="caption">
          Listing Photographs &amp; Media Assets
          <button class="btn small primary" style="margin-left:auto" onclick="BankPortal.openSubPage('edit-media')">
            <svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Manage Photos (${totalCount} Uploaded)
          </button>
        </div>
        <div class="body">
          ${isComplete ? `
            <div class="banner success" style="margin-bottom:14px">
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              <div><b>Mandatory Photographs Complete (3/3).</b> All 3 required viewing angles have been uploaded and verified for marketplace publication.</div>
            </div>
          ` : `
            <div class="banner amber" style="margin-bottom:14px">
              <svg class="ico" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/></svg>
              <div><b>3 Photos Required for Publication.</b> The listing must include exterior front elevation, interior living space, and street surroundings views before it can be published.</div>
            </div>
          `}

          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:14px">
            <div style="border:1px solid var(--border);border-radius:3px;overflow:hidden;background:#fff">
              <div style="height:120px;background:#EAEAEA;display:flex;align-items:center;justify-content:center;position:relative">
                ${exterior && exterior.url ? `<img src="${UI.escapeHtml(exterior.url)}" alt="Exterior" style="width:100%;height:100%;object-fit:cover">` : '<svg class="ico" viewBox="0 0 24 24" style="width:36px;height:36px;color:#999"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}
                <span class="badge ${exterior ? 'ok' : 'alert'}" style="position:absolute;top:6px;left:6px">${exterior ? '✓ Uploaded' : 'Missing'}</span>
              </div>
              <div style="padding:8px 10px">
                <b style="font-size:12px">1. Exterior Front</b>
                <div style="font-size:10.5px;color:var(--text-2)">Primary marketplace cover</div>
              </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:3px;overflow:hidden;background:#fff">
              <div style="height:120px;background:#EAEAEA;display:flex;align-items:center;justify-content:center;position:relative">
                ${interior && interior.url ? `<img src="${UI.escapeHtml(interior.url)}" alt="Interior" style="width:100%;height:100%;object-fit:cover">` : '<svg class="ico" viewBox="0 0 24 24" style="width:36px;height:36px;color:#999"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}
                <span class="badge ${interior ? 'ok' : 'alert'}" style="position:absolute;top:6px;left:6px">${interior ? '✓ Uploaded' : 'Missing'}</span>
              </div>
              <div style="padding:8px 10px">
                <b style="font-size:12px">2. Interior Living Space</b>
                <div style="font-size:10.5px;color:var(--text-2)">Living area / main hall</div>
              </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:3px;overflow:hidden;background:#fff">
              <div style="height:120px;background:#EAEAEA;display:flex;align-items:center;justify-content:center;position:relative">
                ${street && street.url ? `<img src="${UI.escapeHtml(street.url)}" alt="Street View" style="width:100%;height:100%;object-fit:cover">` : '<svg class="ico" viewBox="0 0 24 24" style="width:36px;height:36px;color:#999"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}
                <span class="badge ${street ? 'ok' : 'alert'}" style="position:absolute;top:6px;left:6px">${street ? '✓ Uploaded' : 'Missing'}</span>
              </div>
              <div style="padding:8px 10px">
                <b style="font-size:12px">3. Street View</b>
                <div style="font-size:10.5px;color:var(--text-2)">Road &amp; surroundings</div>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button class="btn primary" onclick="BankPortal.openSubPage('edit-media')">Manage &amp; Upload Photos →</button>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================================
  // SUB-PAGES (correction pages)
  // ============================================================
  renderSubPage() {
    if (this.subPage === 'offer-detail' && this.selectedOfferId) {
      const o = Store.offers.find(record => record.id === this.selectedOfferId);
      if (!o) return '<div class="empty-state"><p>Offer not found.</p><button class="btn" onclick="BankPortal.closeSubPage()">← Back to Offers</button></div>';
      return this.renderOfferWorkspace(o);
    }
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

  async saveBasics() {
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

    try {
      const res = await fetch(`${Store.API_BASE}/api/v1/assets/${encodeURIComponent(a.id)}?scope=bank`, {
        method: 'PUT',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({
          categoryCode: category,
          assetType,
          description,
          region,
          district,
          publicLocation,
          exactAddress,
          reservePrice: reserve,
          minimumOffer: minOffer,
          showReservePublicly: showReserve
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save changes');

      await Store.fetchRemote();
      UI.toast('Changes saved successfully.', 'success');
      this.closeSubPage();
      this.render();
    } catch (err) {
      UI.toast(err.message || 'Could not save asset basics.', 'error');
    }
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
              <span class="inst-type">${UI.escapeHtml(i.type)}</span>
              <span class="inst-ref">${UI.escapeHtml(i.ref)}</span>
              <span class="inst-status">${UI.badge(i.status)}</span>
              <span style="font-size:11px;color:var(--text-2)">${UI.escapeHtml(i.uploadedBy || 'Not recorded')} · ${UI.fmtDateShort(i.uploadedAt)}</span>
            </div>
          `).join('') : '<p style="color:var(--text-2);margin:0">No legal instruments have been added.</p>'}
        </div>
      </div>
      <div class="group">
        <div class="caption">Add Legal Instrument</div>
        <div class="body">
          <div class="field"><span class="lbl">Instrument Type <span class="req">*</span></span><div class="ctl">
            <select id="new-inst-type">
              <option value="Court Judgment">Court Judgment</option>
              <option value="Default Notice">Default Notice</option>
              <option value="Memorandum of Agreement">Memorandum of Agreement</option>
              <option value="Settlement Agreement">Settlement Agreement</option>
              <option value="Affidavit of Service">Affidavit of Service</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Instrument Reference Number <span class="req">*</span></span><div class="ctl"><input id="new-inst-ref" maxlength="130" required placeholder="e.g. JUD-2025-0201"></div></div>
          <div class="field"><span class="lbl">Case Number <span class="req">*</span></span><div class="ctl"><input id="new-inst-case-number" maxlength="160" required value="${UI.escapeHtml(a.caseRef || '')}" placeholder="Enter the court or enforcement case number"></div></div>
          <div class="upload-zone" style="margin-top:12px" onclick="document.getElementById('file-inst-input').click()">
            <input type="file" id="file-inst-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onclick="event.stopPropagation()" onchange="BankPortal.handleFileSelect(event, 'inst')">
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
    const maxSize = category === 'photo' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size < 1 || file.size > maxSize) {
      e.target.value = '';
      this._stagedFile = null;
      UI.toast(`File size must be between 1 byte and ${category === 'photo' ? '10MB' : '25MB'}.`, 'error');
      return;
    }
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

  async uploadSelectedFile(endpoint, category, extraFields = {}, expectedFileCategory) {
    const file = this._stagedFile?.file;
    if (!file) throw new Error('Choose a file before uploading.');
    if (expectedFileCategory && this._stagedFile.category !== expectedFileCategory) {
      throw new Error('Choose a file using the upload control for this form.');
    }

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('category', category);
    for (const [key, value] of Object.entries(extraFields)) {
      form.append(key, String(value));
    }

    const headers = {};
    const token = Auth.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    let response;
    try {
      response = await fetch(Store.API_BASE + endpoint, {
        method: 'POST',
        headers,
        body: form,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Check your connection and the asset documents before trying again.');
      }
      if (error instanceof TypeError) {
        throw new Error('Upload connection failed. Check your internet connection and try uploading again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Upload failed (${response.status}): the API returned an invalid response.`);
    }
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
    const caseNumber = document.getElementById('new-inst-case-number').value.trim();
    if (!type) return UI.toast('Select an instrument type.', 'error');
    if (!ref) return UI.toast('Instrument reference number is required.', 'error');
    if (!caseNumber) return UI.toast('Case number is required.', 'error');
    try {
      const result = await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Legal Instrument', {
        title: `${type} ${ref}`,
        instrument_type: type,
        instrument_ref: ref,
        case_number: caseNumber
      }, 'inst');
      const refreshedAsset = Store.getAsset(this.selectedAssetId);
      if (!refreshedAsset) throw new Error('The instrument was uploaded, but the asset could not be refreshed.');
      if (result.instrument && !refreshedAsset.instruments.some(instrument => instrument.id === result.instrument.id)) {
        const instrument = result.instrument;
        refreshedAsset.instruments.push({
          id: instrument.id,
          type: instrument.instrument_type,
          ref: instrument.instrument_ref,
          status: instrument.verification_status,
          uploadedBy: instrument.uploaded_by_name || 'Not recorded',
          uploadedAt: instrument.uploaded_at || '',
          uploadedByPublicId: instrument.uploaded_by_public_id || ''
        });
      }
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
    Store.updateAsset(this.selectedAssetId, { enforcementBasis, caseRef, legalStatus: 'Pending'     }, Auth.getActorName(), 'Enforcement basis and instruments submitted for legal review');
    Store.addActivity(this.selectedAssetId, Auth.getActorName(), 'Submitted enforcement documents — awaiting Surge legal verification');
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
            <input type="file" id="file-doc-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onclick="event.stopPropagation()" onchange="BankPortal.handleFileSelect(event, 'doc')">
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
      const result = await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, type, { title: type }, 'doc');
      a.documentFiles = a.documentFiles || [];
      a.documentFiles.push({ id: result.document_id, type, uploadedAt: new Date().toISOString() });
      UI.toast(`${type} uploaded and queued for review.`, 'success');
      this.render();
    } catch (error) {
      UI.toast(error.message || 'Document upload failed.', 'error');
    }
  },

  renderEditMedia(a) {
    const photos = this._currentPhotos || [];
    const exteriorPhoto = photos.find(p => p.caption === 'exterior' || p.is_exterior) || (a.exteriorImage ? { caption: 'exterior' } : null);
    const interiorPhoto = photos.find(p => p.caption === 'interior');
    const streetPhoto = photos.find(p => p.caption === 'street' || p.caption === 'surroundings');
    const requiredCount = (exteriorPhoto ? 1 : 0) + (interiorPhoto ? 1 : 0) + (streetPhoto ? 1 : 0);
    const otherPhotos = photos.filter(p => p !== exteriorPhoto && p !== interiorPhoto && p !== streetPhoto);

    const renderSlotCard = (type, title, tagline, photo) => {
      const isMissing = !photo;
      return `
        <div class="photo-slot-card">
          <div class="slot-head">
            <div>
              <span class="slot-title">${title}</span>
              <span class="slot-hint">${tagline}</span>
            </div>
            ${photo ? '<span class="badge live">✓ Uploaded</span>' : '<span class="badge alert">Missing — Required</span>'}
          </div>
          <div class="slot-body">
            ${photo ? `
              <div class="photo-preview-row">
                <div class="photo-thumb-wrap" onclick="BankPortal.viewFullPhoto('${photo.url}', '${title}')" style="cursor:pointer" title="Click to enlarge">
                  <img src="${UI.escapeHtml(photo.url)}" alt="${title}" onerror="this.style.display='none'">
                </div>
                <div class="photo-meta">
                  <div style="font-weight:600;font-size:13px">${title}</div>
                  <div style="font-size:11.5px;color:var(--text-2)">${tagline}</div>
                  <div style="font-size:11px;color:var(--text-2)">Verified Angle · Ready for Listing</div>
                  <div class="photo-actions">
                    <button type="button" class="btn small" onclick="BankPortal.viewFullPhoto('${photo.url}', '${title}')">
                      <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                      View Large
                    </button>
                    <button type="button" class="btn small" onclick="document.getElementById('file-photo-${type}').click()">
                      <svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      Replace Photo
                    </button>
                    <button type="button" class="btn small danger" onclick="BankPortal.deletePhoto('${a.id}', '${photo.id}', '${type}')">
                      <svg class="ico" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </div>
                  <div id="photo-${type}-status" style="font-size:11.5px;margin-top:4px"></div>
                </div>
              </div>
              <input type="file" id="file-photo-${type}" accept="image/*,.jpg,.jpeg,.png,.webp,.heic" style="display:none" onchange="BankPortal.handleSlotPhoto(event, '${a.id}', '${type}')">
            ` : `
              <div class="upload-zone" onclick="document.getElementById('file-photo-${type}').click()"
                   ondragover="event.preventDefault(); this.style.borderColor='var(--blue)'; this.style.background='#F0F5FA';"
                   ondragleave="this.style.borderColor='var(--border)'; this.style.background='';"
                   ondrop="event.preventDefault(); this.style.borderColor='var(--border)'; this.style.background=''; BankPortal.handleDropPhoto(event, '${a.id}', '${type}')">
                <input type="file" id="file-photo-${type}" accept="image/*,.jpg,.jpeg,.png,.webp,.heic" style="display:none" onclick="event.stopPropagation()" onchange="BankPortal.handleSlotPhoto(event, '${a.id}', '${type}')">
                <svg class="ico" viewBox="0 0 24 24" style="width:36px;height:36px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <div style="font-weight:600;margin:6px 0 2px">Click to browse or drag &amp; drop photo here</div>
                <div style="font-size:11px;color:var(--text-2)">Supports JPG, PNG, WebP · Max 10MB</div>
                <div id="photo-${type}-status" style="font-size:11.5px;font-weight:600;margin-top:6px;color:var(--blue)"></div>
              </div>
            `}
          </div>
        </div>
      `;
    };

    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Listing Photographs &amp; Media Management</h1>
        <span class="crumb">${a.ref} · ${requiredCount}/3 Mandatory Angles</span>
      </div>

      ${requiredCount === 3 ? `
        <div class="banner success" style="margin-bottom:14px">
          <svg class="ico" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          <div><b>All 3 Mandatory Angles Uploaded (3/3).</b> Publication Gate 5 (Photographic Evidence) is fully satisfied.</div>
        </div>
      ` : `
        <div class="banner amber" style="margin-bottom:14px">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg>
          <div><b>Mandatory 3-Photo Upload Required (${requiredCount}/3).</b> You must provide all 3 distinct photographs: Exterior Front Elevation, Interior Living Space, and Street View / Surroundings before this asset can be published.</div>
        </div>
      `}

      ${renderSlotCard('exterior', '1. Exterior Front Elevation', 'Primary marketplace cover image', exteriorPhoto)}
      ${renderSlotCard('interior', '2. Interior Living Space', 'Main hall, living area, or primary room', interiorPhoto)}
      ${renderSlotCard('street', '3. Street View &amp; Surroundings', 'Access road, frontage, or neighborhood view', streetPhoto)}

      <div class="group" style="margin-top:16px">
        <div class="caption">
          Additional Gallery Photographs (${otherPhotos.length})
          <span class="hint">Compound, bedrooms, kitchen, floor plans, aerial views</span>
        </div>
        <div class="body">
          ${otherPhotos.length > 0 ? `
            <div class="photo-grid-extra">
              ${otherPhotos.map(p => `
                <div class="photo-extra-item">
                  <div class="thumb" onclick="BankPortal.viewFullPhoto('${p.url}', '${UI.escapeHtml(p.caption || 'Photo')}')" style="cursor:pointer">
                    <img src="${UI.escapeHtml(p.url)}" alt="${UI.escapeHtml(p.caption || '')}" onerror="this.style.display='none'">
                    ${p.is_primary ? '<span class="badge live" style="position:absolute;top:6px;left:6px">Cover</span>' : ''}
                  </div>
                  <div class="info">
                    <span class="caption-txt" title="${UI.escapeHtml(p.caption || 'Gallery')}">${UI.escapeHtml(p.caption || 'Gallery Photo')}</span>
                    <div style="display:flex;gap:4px">
                      <button class="btn small" style="flex:1" onclick="BankPortal.viewFullPhoto('${p.url}', '${UI.escapeHtml(p.caption || 'Photo')}')">View</button>
                      <button class="btn small danger" onclick="BankPortal.deletePhoto('${a.id}', '${p.id}', 'other')">Delete</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p style="font-size:12px;color:var(--text-2);margin:0 0 10px">No additional photos uploaded yet. You may upload up to 20 photos per asset.</p>'}

          <div style="margin-top:14px;background:#FAFBFD;border:1px solid var(--border);border-radius:3px;padding:12px 14px">
            <div style="font-weight:600;font-size:12.5px;margin-bottom:8px">Upload Additional Photo</div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <input id="photo-extra-caption" placeholder="Photo caption (e.g. Master Bedroom, Compound, Kitchen...)" style="flex:1;min-width:220px;height:30px;padding:0 8px;border:1px solid var(--border);border-radius:2px;font-size:12px">
              <input type="file" id="file-photo-extra" accept="image/*,.jpg,.jpeg,.png,.webp,.heic" style="display:none" onchange="BankPortal.uploadAdditionalPhoto(event, '${a.id}')">
              <button class="btn primary" onclick="document.getElementById('file-photo-extra').click()">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Choose File &amp; Upload
              </button>
            </div>
            <div id="photo-extra-status" style="font-size:11px;margin-top:6px;color:var(--text-2)">Supports JPG, PNG, WebP up to 10MB</div>
          </div>
        </div>
      </div>

      <div class="form-actions" style="margin-top:18px">
        <button class="btn primary" onclick="BankPortal.closeSubPage()">Done / Back to Asset</button>
      </div>
    `;
  },

  handleDropPhoto(event, assetId, type) {
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.uploadPhotoFile(event.dataTransfer.files[0], assetId, type);
    }
  },

  async handleSlotPhoto(event, assetId, type) {
    const file = event.target ? (event.target.files && event.target.files[0]) : event;
    if (!file) return;
    await this.uploadPhotoFile(file, assetId, type);
  },

  async uploadPhotoFile(file, assetId, type, customCaption) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return UI.toast('Photo must be less than 10MB.', 'error');
    }
    const statusEl = document.getElementById(`photo-${type}-status`);
    if (statusEl) statusEl.textContent = `Uploading ${file.name}...`;

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('category', type);
    form.append('caption', customCaption || type);
    form.append('is_exterior', type === 'exterior' ? '1' : '0');
    form.append('is_primary', type === 'exterior' ? '1' : '0');

    const headers = {};
    const token = Auth.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    try {
      const res = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(assetId)}/photos/upload`, {
        method: 'POST',
        headers,
        body: form
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
      const label = type === 'exterior' ? 'Exterior Front' : type === 'interior' ? 'Interior' : type === 'street' ? 'Street view' : 'Photo';
      UI.toast(`${label} uploaded successfully.`, 'success');
      await this.loadPhotos(assetId);
      const a = Store.getAsset(assetId);
      if (a) {
        a.images = (a.images || 0) + 1;
        if (type === 'exterior') {
          a.exteriorImage = true;
          if (json.url) a.primaryImage = json.url;
        }
      }
      this.render();
    } catch (err) {
      UI.toast(err.message || 'Photo upload failed', 'error');
      if (statusEl) statusEl.textContent = `Upload failed: ${err.message}`;
    }
  },

  async uploadAdditionalPhoto(event, assetId) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const captionInput = document.getElementById('photo-extra-caption');
    const caption = (captionInput?.value?.trim()) || 'Gallery Photo';
    const statusEl = document.getElementById('photo-extra-status');
    if (statusEl) statusEl.textContent = `Uploading ${file.name}...`;

    await this.uploadPhotoFile(file, assetId, 'other', caption);
  },

  async deletePhoto(assetId, photoId, type) {
    const confirmed = await UI.confirm({
      title: 'Delete Photograph?',
      message: 'Are you sure you want to delete this photograph from the listing?',
      confirmText: 'Delete Photo',
      danger: true
    });
    if (!confirmed) return;
    const headers = {};
    const token = Auth.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    try {
      const res = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(assetId)}/photos/${encodeURIComponent(photoId)}`, {
        method: 'DELETE',
        headers
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      UI.toast('Photo deleted successfully.', 'success');
      await this.loadPhotos(assetId);
      const a = Store.getAsset(assetId);
      if (a && type === 'exterior') {
        const hasExterior = (this._currentPhotos || []).some(p => p.caption === 'exterior' || p.is_exterior);
        if (!hasExterior) a.exteriorImage = false;
      }
      this.render();
    } catch (err) {
      UI.toast(err.message || 'Photo deletion failed.', 'error');
    }
  },

  viewFullPhoto(url, title) {
    UI.modal(title || 'Property Photograph', `
      <div style="text-align:center;background:#111;padding:12px;border-radius:3px">
        <img src="${UI.escapeHtml(url)}" alt="${UI.escapeHtml(title)}" style="max-width:100%;max-height:75vh;object-fit:contain;border-radius:2px">
      </div>
    `, '<button class="btn" onclick="UI.closeModal()">Close</button>', true);
  },

  renderEditTitle(a) {
    const titleDocument = Store.documents.find(doc => doc.id === a.titleDocumentId && doc.category === 'Title Deed');
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
          <div class="field"><span class="lbl">Title Number <span class="req">*</span></span><div class="ctl"><input id="title-number" maxlength="160" value="${UI.escapeHtml(a.titleNumber || '')}" placeholder="e.g. TD-2024-01234"></div></div>
          <div class="field"><span class="lbl">Title Type</span><div class="ctl">
            <select id="title-type">
              <option value="" ${a.titleType ? '' : 'selected'} disabled>Select title type</option>
              <option value="Freehold" ${a.titleType === 'Freehold' ? 'selected' : ''}>Freehold</option>
              <option value="Leasehold" ${a.titleType === 'Leasehold' ? 'selected' : ''}>Leasehold</option>
              <option value="Registered" ${a.titleType === 'Registered' ? 'selected' : ''}>Registered</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Registry / Issuing Authority <span class="req">*</span></span><div class="ctl"><input id="title-registry" maxlength="160" value="${UI.escapeHtml(a.titleRegistry || '')}" placeholder="e.g. Lands Commission"></div></div>
          <div class="field"><span class="lbl">Registered Owner</span><div class="ctl"><input id="title-owner" maxlength="160" value="${UI.escapeHtml(a.titleOwner || '')}" placeholder="Per title deed"></div></div>
          <div class="field"><span class="lbl">Perfection Status</span><div class="ctl">
            <select id="title-perfection">
              <option value="" ${a.titlePerfection ? '' : 'selected'} disabled>Select perfection status</option>
              <option value="Perfected" ${a.titlePerfection === 'Perfected' ? 'selected' : ''}>Perfected</option>
              <option value="Unperfected" ${a.titlePerfection === 'Unperfected' ? 'selected' : ''}>Unperfected</option>
              <option value="In Progress" ${a.titlePerfection === 'In Progress' ? 'selected' : ''}>In Progress</option>
            </select>
          </div></div>
          <div class="field"><span class="lbl">Title Document</span><div class="ctl">
            ${titleDocument ? `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--surface-2,#f8f9fa);border:1px solid var(--border,#d1d5db);border-radius:4px;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px;min-width:0">
                  <svg class="ico" viewBox="0 0 24 24" style="width:20px;height:20px;color:var(--primary);flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style="min-width:0">
                    <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.escapeHtml(titleDocument.title)}</div>
                    <div style="font-size:11px;color:var(--text-2)">${UI.escapeHtml(!titleDocument.file_size || titleDocument.file_size === '0.0 MB' ? 'PDF Deed · Stored securely' : titleDocument.file_size)}</div>
                  </div>
                </div>
                <button type="button" class="btn small" data-document-download="${UI.escapeHtml(titleDocument.id)}" style="flex-shrink:0">Download current deed</button>
              </div>
            ` : '<p style="color:var(--danger);font-size:12.5px;margin:0 0 8px">A title deed is required before requesting verification.</p>'}
            <div class="upload-zone" onclick="document.getElementById('file-title-input').click()">
              <input type="file" id="file-title-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onclick="event.stopPropagation()" onchange="BankPortal.handleFileSelect(event, 'title')">
              <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
              <div id="title-status-text">${titleDocument ? 'Upload replacement title deed' : 'Upload title deed'}</div>
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
    const titleType = document.getElementById('title-type').value;
    const registry = document.getElementById('title-registry').value.trim();
    if (!titleType) return UI.toast('Select a title type', 'error');
    if (!registry) return UI.toast('Registry or issuing authority is required', 'error');
    const registeredOwner = document.getElementById('title-owner').value.trim();
    const perfectionStatus = document.getElementById('title-perfection').value;
    if (!perfectionStatus) return UI.toast('Select a perfection status', 'error');
    let documentId = a.titleDocumentId || '';
    if (this._stagedFile?.category === 'title') {
      try {
        const uploaded = await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Title Deed', {
          title: `Title Deed ${titleNumber}`
        }, 'title');
        documentId = uploaded.document_id;
      } catch (error) {
        return UI.toast(error.message || 'Title document upload failed.', 'error');
      }
    } else if (this._stagedFile) {
      return UI.toast('The selected file is for a different form. Choose the title deed here.', 'error');
    }
    if (!documentId) return UI.toast('Upload a title deed before requesting verification.', 'error');
    try {
      const response = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(a.id)}/title`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ certificateNumber: titleNumber, titleType, registry, registeredOwner, perfectionStatus, documentId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Title submission failed (${response.status}).`);
      await Store.fetchRemote();
      UI.toast(result.message || 'Title details submitted for verification.', 'success');
      this.closeSubPage();
    } catch (error) {
      UI.toast(error.message || 'Title details could not be saved.', 'error');
    }
  },

  renderEditValuation(a) {
    const valuationDocument = Store.documents.find(doc => doc.id === a.valuationDocumentId) ||
      Store.documents.find(doc => (doc.asset_id === a.id || doc.asset_ref === a.ref) && (doc.category === 'Valuation Report' || /valuation/i.test(doc.category)));
    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Asset</button>
        <h1>Valuation Details</h1>
        <span class="crumb">${a.ref}</span>
      </div>
      <div class="group">
        <div class="caption">Valuation Record</div>
        <div class="body">
          <div class="field"><span class="lbl">Market Value (GHS) <span class="req">*</span></span><div class="ctl"><input id="val-amount" class="money" type="number" value="${a.valuationAmount || ''}" min="0.01" step="0.01" required></div></div>
          <div class="field"><span class="lbl">Forced Sale Value (GHS) <span class="req">*</span></span><div class="ctl"><input id="val-forced-sale" class="money" type="number" value="${a.forcedSaleValue || ''}" min="0.01" step="0.01" required></div></div>
          <div class="field"><span class="lbl">Valuation Date <span class="req">*</span></span><div class="ctl"><input id="val-date" type="date" value="${a.valuationDate ? a.valuationDate.split('T')[0] : ''}" required></div></div>
          <div class="field"><span class="lbl">Validity (days) <span class="req">*</span></span><div class="ctl"><input id="val-validity" type="number" value="${a.valuationValidityDays || 180}" min="1" max="3650" required><span class="help">The valuation remains valid through its expiry date.</span></div></div>
          <div class="field"><span class="lbl">Valuer Name <span class="req">*</span></span><div class="ctl"><input id="val-valuer" maxlength="160" value="${UI.escapeHtml(a.valuerName || '')}" placeholder="Licensed valuer firm" required></div></div>
          <div class="field">
            <span class="lbl">Valuation Report</span>
            <div class="ctl">
              ${valuationDocument ? `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--surface-2,#f8f9fa);border:1px solid var(--border,#d1d5db);border-radius:4px;margin-bottom:10px">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0">
                    <svg class="ico" viewBox="0 0 24 24" style="width:20px;height:20px;color:var(--primary);flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div style="min-width:0">
                      <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.escapeHtml(valuationDocument.title)}</div>
                      <div style="font-size:11px;color:var(--text-2)">${UI.escapeHtml(!valuationDocument.file_size || valuationDocument.file_size === '0.0 MB' ? 'PDF Document · Stored securely' : valuationDocument.file_size)}</div>
                    </div>
                  </div>
                  <button type="button" class="btn small" data-document-download="${UI.escapeHtml(valuationDocument.id)}" style="flex-shrink:0">Download report</button>
                </div>
              ` : '<p style="color:var(--danger);font-size:12.5px;margin:0 0 8px">A valuation report is required before submitting.</p>'}
              <div class="upload-zone" onclick="document.getElementById('file-val-input').click()">
                <input type="file" id="file-val-input" accept=".pdf,.docx,image/jpeg,image/png,image/webp" style="display:none" onclick="event.stopPropagation()" onchange="BankPortal.handleFileSelect(event, 'val')">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>
                <div id="val-status-text">${valuationDocument ? 'Upload replacement valuation report (PDF)' : 'Upload valuation report (PDF)'}</div>
              </div>
            </div>
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
    const forcedSaleValue = Number(document.getElementById('val-forced-sale').value);
    const dateStr = document.getElementById('val-date').value;
    const validityDays = Number(document.getElementById('val-validity').value);
    const valuerName = document.getElementById('val-valuer').value.trim();
    if (!amount || amount <= 0) return UI.toast('Valuation amount is required', 'error');
    if (!forcedSaleValue || forcedSaleValue <= 0) return UI.toast('Forced sale value is required', 'error');
    if (!dateStr) return UI.toast('Valuation date is required', 'error');
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 3650) return UI.toast('Validity must be between 1 and 3650 days.', 'error');
    if (!valuerName) return UI.toast('Valuer name is required.', 'error');
    let documentId = a.valuationDocumentId || '';
    if (this._stagedFile?.category === 'val') {
      try {
        const uploaded = await this.uploadSelectedFile(`/api/bank/assets/${encodeURIComponent(a.id)}/documents/upload`, 'Valuation Report', {
          title: `Valuation Report - ${a.ref} (${valuerName || dateStr})`,
          asset_id: a.id,
          asset_ref: a.ref,
          asset_title: a.title,
          market_value: amount,
          forced_sale_value: forcedSaleValue,
          valuation_date: dateStr,
          validity_days: validityDays,
          valuer_name: valuerName
        }, 'val');
        documentId = uploaded.document_id;
      } catch (error) {
        return UI.toast(error.message || 'Valuation report upload failed.', 'error');
      }
    } else if (this._stagedFile) {
      return UI.toast('The selected file is for a different form. Choose the valuation report here.', 'error');
    }
    if (!documentId) {
      const existingDoc = Store.documents.find(doc => (doc.asset_id === a.id || doc.asset_ref === a.ref) && (doc.category === 'Valuation Report' || /valuation/i.test(doc.category)));
      documentId = existingDoc?.id || '';
    }
    if (!documentId) return UI.toast('Upload a valuation report before submitting.', 'error');
    try {
      const response = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(a.id)}/valuations`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          marketValue: amount,
          forcedSaleValue,
          valuationDate: dateStr,
          validityDays,
          valuerName,
          documentId,
          assetRef: a.ref,
          assetTitle: a.title
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Valuation submission failed (${response.status}).`);
      await Store.fetchRemote();
      UI.toast(result.message || 'Valuation submitted for review.', 'success');
      this.closeSubPage();
    } catch (error) {
      UI.toast(error.message || 'Valuation could not be saved.', 'error');
    }
  },

  requestVerification(assetId, kind) {
    const a = Store.getAsset(assetId);
    Store.addAudit(Auth.getActorName(), 'REQUEST_VERIFICATION', 'Asset', a.ref, null, null, 'Requested ' + kind + ' verification from Surge');
    Store.addActivity(assetId, Auth.getActorName(), 'Requested ' + kind + ' verification from Surge');
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
    return `
      <div class="page-head">
        <h1>Offers &amp; Decisions</h1>
        <span class="crumb">${Store.offers.length} verified offer${Store.offers.length === 1 ? '' : 's'}</span>
      </div>
      <div class="gridwrap">
        <table class="grid">
          <thead>
            <tr>
              <th>Offer Ref</th>
              <th>Asset</th>
              <th>Buyer</th>
              <th class="num">Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${Store.offers.map(o => `
              <tr onclick="BankPortal.openOffer('${o.id}')" style="cursor:pointer">
                <td class="ref"><b>${o.ref}</b></td>
                <td class="ref">${o.assetRef}</td>
                <td><b>${UI.escapeHtml(o.buyer)}</b></td>
                <td class="num">
                  <b>${UI.fmtMoney(o.amount)}</b>
                  ${o.belowReserve ? '<br><span style="color:var(--danger);font-size:10.5px">Below Reserve</span>' : ''}
                </td>
                <td><small>${UI.fmtDateShort(o.date)}</small></td>
                <td>${UI.badge(o.status)}</td>
                <td style="text-align:right">
                  <button class="btn small primary" onclick="event.stopPropagation();BankPortal.openOffer('${o.id}')">View Details →</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-2)">No verified offers currently pending for your bank.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  renderOfferWorkspace(o) {
    const asset = Store.getAsset(o.assetId) || Store.assets.find(a => a.ref === o.assetRef);
    const isUnderReview = ['Under Bank Review', 'Under Review'].includes(o.status);

    return `
      <div class="page-head">
        <button class="btn small" onclick="BankPortal.closeSubPage()">← Back to Offers</button>
        <h1>Offer Decision Workspace</h1>
        <span class="crumb">${o.ref} · ${o.assetRef}</span>
      </div>

      <div class="group">
        <div class="caption">Offer Particulars</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Offer Reference</span><span class="kv-v"><b>${o.ref}</b></span></div>
          <div class="kv-row"><span class="kv-k">Asset Reference</span><span class="kv-v"><b>${o.assetRef}</b>${asset ? ` <button class="btn small" style="margin-left:8px" onclick="BankPortal.openAsset('${asset.id}')">View Asset Listing</button>` : ''}</span></div>
          ${asset?.title ? `<div class="kv-row"><span class="kv-k">Asset Title</span><span class="kv-v">${UI.escapeHtml(asset.title)}</span></div>` : ''}
          <div class="kv-row"><span class="kv-k">Offered Purchase Price</span><span class="kv-v"><b style="font-size:15px;color:var(--primary)">${UI.fmtMoney(o.amount)}</b></span></div>
          <div class="kv-row"><span class="kv-k">Reserve Price</span><span class="kv-v">${asset ? UI.fmtMoney(asset.reserve) : '—'} ${o.belowReserve ? '<span class="badge alert" style="margin-left:6px">Below Reserve</span>' : '<span class="badge ok" style="margin-left:6px">Meets Reserve</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Submission Date</span><span class="kv-v">${UI.fmtDate(o.date)}</span></div>
          <div class="kv-row"><span class="kv-k">Offer Validity</span><span class="kv-v">${o.validity ? UI.fmtDate(o.validity) : '30 Days'}</span></div>
          <div class="kv-row"><span class="kv-k">Payment Terms</span><span class="kv-v">${UI.escapeHtml(o.conditions || 'Cash / Direct Bank Transfer')}</span></div>
          <div class="kv-row"><span class="kv-k">Verified Purchaser</span><span class="kv-v"><b>${UI.escapeHtml(o.buyer)}</b> <span class="badge ok" style="margin-left:6px">KYC Verified by Surge</span></span></div>
          <div class="kv-row"><span class="kv-k">Surge Screening</span><span class="kv-v"><span class="badge ok">✓ Verified by Surge</span></span></div>
          <div class="kv-row"><span class="kv-k">Current Status</span><span class="kv-v">${UI.badge(o.status)}</span></div>
        </div>
      </div>

      <div class="group">
        <div class="caption">Bank Decision &amp; Actions</div>
        <div class="body">
          ${isUnderReview ? `
            <p style="margin:0 0 14px;color:var(--text-2);font-size:12.5px">
              Review the purchase offer and terms. Accepting marks the asset listing as <b>Under Contract / Sold</b>.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn ok" onclick="BankPortal.decideOffer('${o.id}','Accepted')">
                ✓ Accept Offer
              </button>
              <button class="btn alert" onclick="BankPortal.decideOffer('${o.id}','Rejected')">
                Decline Offer
              </button>
            </div>
          ` : o.status === 'Accepted' ? `
            <div class="banner ok" style="margin-bottom:14px">
              <svg class="ico" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              <div>
                <b>Offer Accepted by Bank.</b> The asset has been marked as Under Contract / Sold.
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div>
                <button class="btn alert" onclick="BankPortal.rescindOffer('${o.id}')">
                  Rescind Offer Acceptance
                </button>
              </div>
              <span style="font-size:11.5px;color:var(--text-2)">
                If the buyer defaults on deposit or payment conditions, rescinding acceptance restores the asset listing to <b>Live</b> on the public marketplace.
              </span>
            </div>
          ` : o.status === 'Rescinded' ? `
            <div class="banner warn" style="margin-bottom:14px">
              <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 9v4M12 17h.01"/></svg>
              <div>
                <b>Offer Acceptance Rescinded.</b> The previous acceptance was cancelled and the asset listing was restored to Live status.
              </div>
            </div>
            <button class="btn small" onclick="BankPortal.decideOffer('${o.id}','Under Bank Review')">
              Re-open Offer for Review
            </button>
          ` : o.status === 'Rejected' ? `
            <div class="banner alert" style="margin:0">
              <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div><b>Offer Declined by Bank.</b></div>
            </div>
          ` : `
            <div>Current status: <b>${o.status}</b>.</div>
          `}
        </div>
      </div>
    `;
  },

  renderReportsView() {
    const assets = Store.getBankAssets();
    const acceptedOffers = Store.offers.filter(o => o.status === 'Accepted');
    const totalRealized = acceptedOffers.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalBilled = Store.invoices.reduce((sum, i) => sum + (i.status !== 'Cancelled' ? Number(i.amount) || 0 : 0), 0);
    const soldAssets = assets.filter(a => a.status === 'Sold');

    return `
      <div class="page-head">
        <h1>Reports &amp; Billing</h1>
        <span class="crumb">${assets.length} portfolio assets · ${Store.invoices.length} invoices</span>
      </div>

      <div class="kpis">
        <div class="kpi"><div class="k">Total Assets</div><div class="v">${assets.length}</div></div>
        <div class="kpi ok"><div class="k">Live on Market</div><div class="v">${assets.filter(a => a.status === 'Live').length}</div></div>
        <div class="kpi ok"><div class="k">Disposed / Sold</div><div class="v">${soldAssets.length}</div></div>
        <div class="kpi ok"><div class="k">Total Realized</div><div class="v" style="font-size:16px">${UI.fmtMoney(totalRealized)}</div></div>
        <div class="kpi"><div class="k">Surge Fees Billed</div><div class="v" style="font-size:16px">${UI.fmtMoney(totalBilled)}</div></div>
      </div>

      <div class="group">
        <div class="caption">Portfolio Reports &amp; Exports</div>
        <div class="body" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn primary" onclick="UI.exportPDF('portfolio')">Asset Portfolio Report (PDF)</button>
          <button class="btn" onclick="UI.exportPDF('disposal')">Disposal & Realization Report</button>
          <button class="btn" onclick="UI.exportPDF('billing')">Billing & Invoice Report</button>
          <button class="btn" onclick="UI.exportExcel('assets')">Export Assets (CSV)</button>
          <button class="btn" onclick="UI.exportExcel('invoices')">Export Invoices (CSV)</button>
        </div>
      </div>

      <div class="group">
        <div class="caption">Disposal &amp; Transaction Realization <span class="hint">${acceptedOffers.length} offer${acceptedOffers.length === 1 ? '' : 's'} accepted</span></div>
        <div class="body">
          <table class="grid">
            <thead>
              <tr>
                <th>Offer Ref</th>
                <th>Asset</th>
                <th>Purchaser</th>
                <th class="num">Realized Amount</th>
                <th>Date Accepted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${acceptedOffers.map(o => `
                <tr onclick="BankPortal.openOffer('${o.id}')" style="cursor:pointer">
                  <td class="ref"><b>${o.ref}</b></td>
                  <td class="ref">${o.assetRef}</td>
                  <td><b>${UI.escapeHtml(o.buyer)}</b></td>
                  <td class="num"><b>${UI.fmtMoney(o.amount)}</b></td>
                  <td><small>${UI.fmtDateShort(o.date)}</small></td>
                  <td><span class="badge ok">✓ Sold / Accepted</span></td>
                </tr>
              `).join('') || '<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--text-2)">No accepted offers yet. Accepted offers will appear here with realized recovery values.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="group">
        <div class="caption">Billing &amp; Invoices <span class="hint">${Store.invoices.length} invoice${Store.invoices.length === 1 ? '' : 's'}</span></div>
        <div class="body">
          <table class="grid">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Description</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th class="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${Store.invoices.map(i => `
                <tr>
                  <td class="ref"><b>${i.ref}</b></td>
                  <td>${UI.escapeHtml(i.description)}</td>
                  <td><small>${i.issuedAt ? UI.fmtDateShort(i.issuedAt) : '—'}</small></td>
                  <td><small>${i.dueDate ? UI.fmtDateShort(i.dueDate) : '14 Days'}</small></td>
                  <td class="num"><b>${UI.fmtMoney(i.amount)}</b></td>
                  <td>${UI.badge(i.status)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--text-2)">No billing invoices issued yet. Transaction success fees are billed automatically when an offer is accepted.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderNotificationsView() {
    const logs = Store.getBankAuditLogs();
    return `<div class="page-head"><h1>Notifications &amp; Activity</h1><span class="crumb">${logs.length} bank-isolated events</span></div><div class="gridwrap"><div style="padding:10px 14px">${logs.slice(0, 30).map(n => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(n.when)}</div><div class="ae-who">${UI.auditActor(n)}</div><div class="ae-what"><b>${UI.escapeHtml(n.action)}</b> ${UI.escapeHtml(UI.cleanAuditRef(n.entityRef, n.entity))} — ${UI.cleanAuditDetail(n.detail, n)}</div></div>`).join('') || '<p style="color:var(--text-2);padding:20px">No notifications recorded for this bank.</p>'}</div></div>`;
  },

  async newAsset() {
    const user = Auth.getUser();
    if (user?.scope !== 'surge') {
      return this.createAsset({ ownershipType: 'bank' });
    }

    try {
      UI.modal('Create Asset Draft', `
        <p>Create a draft and select the bank, individual, or Surge Solutions as its legal owner.</p>
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
      const actorName = d.created_by || 'Not recorded';
      const asset = {
        id: d.id, ref: d.public_ref, bankId: d.bank_id, bankName: d.bank_name || user?.bankName || '—',
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

  async deleteAsset(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    if (a.status === 'Live') {
      return UI.toast('Published assets cannot be deleted directly. Please use "Request Deletion" to notify Surge Admin.', 'warn');
    }
    const confirmed = await UI.confirm({
      title: 'Permanently Delete Asset?',
      message: `Are you sure you want to permanently delete asset ${a.ref}? All linked records will be deleted. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      danger: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: Store.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete asset');
      UI.toast(json.message || `Asset ${a.ref} deleted successfully.`, 'success');
      this.closeAsset();
      await Store.fetchRemote();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  requestDeletionModal(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const bodyHtml = `
      <p style="font-size:13px;color:var(--text-1);margin-bottom:12px">
        This asset is currently published on the live marketplace. Bank staff cannot delete published listings directly.
        Please provide the reason below to request deletion by Surge Solutions Admin.
      </p>
      <div class="field">
        <span class="lbl">Reason for Deletion <span class="req">*</span></span>
        <div class="ctl">
          <textarea id="req-del-reason" style="width:100%;height:80px;font-family:inherit;font-size:13px" placeholder="e.g. Asset redeemed by borrower, settled out of court, sold privately..."></textarea>
        </div>
      </div>
    `;
    const footerHtml = `
      <button class="btn" onclick="UI.closeModal()">Cancel</button>
      <button class="btn alert" onclick="BankPortal.submitRequestDeletion('${id}')">Submit Request to Admin</button>
    `;
    UI.modal('Request Listing Deletion', bodyHtml, footerHtml);
  },

  async submitRequestDeletion(id) {
    const reason = document.getElementById('req-del-reason')?.value?.trim();
    if (!reason) {
      return UI.toast('Please provide a reason for the deletion request.', 'error');
    }
    try {
      const res = await fetch(`${Store.API_BASE}/api/bank/assets/${encodeURIComponent(id)}/request-deletion`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit request');
      UI.closeModal();
      UI.toast(json.message || 'Deletion request submitted to Surge Admin.', 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async saveOverview() {
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

    Store.addAudit(Auth.getActorName(), 'UPDATE', 'Asset', a.ref, null, null, 'Asset details updated');
    Store.persist();

    try {
      const res = await fetch(Store.API_BASE + '/api/v1/assets/' + encodeURIComponent(a.id) + '?scope=bank', {
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
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save changes');
      await Store.fetchRemote();
      UI.toast('Asset details saved successfully.', 'success');
      this.render();
    } catch (err) {
      UI.toast(err.message || 'Could not save asset details.', 'error');
    }
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

  async submitForReview() {
    if (!this.selectedAssetId) return UI.toast('Select an asset before continuing.', 'warn');
    const a = Store.getAsset(this.selectedAssetId);
    if (a.legalHold) return UI.toast('Cannot submit: legal hold active', 'error');
    const r = Store.checkPublishReadiness(a);
    const criticalMissing = r.checks.filter(c => !c.pass && ['price','description'].includes(c.key));
    if (criticalMissing.length) return UI.toast('This action is unavailable because the following requirements are incomplete: ' + criticalMissing.map(c => c.label).join(', '), 'error');
    try {
      const response = await fetch(`${Store.API_BASE}/api/v1/assets/${encodeURIComponent(a.id)}/submit`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Submission failed (${response.status}).`);
      }
      await Store.fetchRemote();
      UI.toast('Asset submitted for review. Surge disposition team notified.', 'success');
      this.render();
    } catch (error) {
      console.error('Asset submission failed:', error);
      UI.toast(error.message || 'Could not submit the asset. Please retry.', 'error');
    }
  },

  resubmitAsset() {
    return this.submitForReview();
  },

  async decideOffer(offerId, decision) {
    const offer = Store.offers.find(o => o.id === offerId);
    if (!offer) return;
    const confirmed = await UI.confirm({
      title: 'Confirm Offer Decision',
      message: `Are you sure you want to mark offer ${offer.ref} as ${decision}?`,
      confirmText: `Confirm ${decision}`,
      danger: decision === 'Rejected'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/v1/offers/${encodeURIComponent(offerId)}/decide`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({ decision })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to record decision');
      UI.toast(json.message || `Offer marked as ${decision.toLowerCase()}.`, 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async rescindOffer(offerId) {
    const offer = Store.offers.find(o => o.id === offerId);
    if (!offer) return;
    const confirmed = await UI.confirm({
      title: 'Rescind Offer Acceptance?',
      message: `Are you sure you want to rescind acceptance of offer ${offer.ref}? The asset listing will be restored from Sold back to Live on the marketplace.`,
      confirmText: 'Rescind Acceptance',
      danger: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/v1/offers/${encodeURIComponent(offerId)}/rescind`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({ reason: 'Bank rescinded accepted offer' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to rescind offer');
      UI.toast(json.message || `Offer acceptance rescinded. Asset listing restored to Live.`, 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },
};

// ============================================================
// ADMIN PORTAL
// ============================================================
const AdminPortal = {
  currentView: 'assets', selectedAssetId: null, detailTab: 'overview', subPage: null,
  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '', selectedValuationId: null,
  openedReviewDocuments: new Set(), gateReadiness: null, gateReadinessAssetId: null,
  gateReadinessLoading: false, gateReadinessError: '',
  tabs: [
    { id: 'assets', title: 'Assets', view: 'assets', closable: false }
  ],
  activeTabId: 'assets',

  getViewTitle(view) {
    const titleMap = {
      'dashboard': 'Dashboard',
      'assets': 'Assets',
      'review': 'Review Queue',
      'legal': 'Legal Verification',
      'title': 'Title & Valuation',
      'offers': 'Offers',
      'banks': 'Banks & Staff',
      'audit': 'Audit Log'
    };
    return titleMap[view] || 'Workspace';
  },

  openTab(tab) {
    if (!Array.isArray(this.tabs)) this.tabs = [];
    if (!tab || !tab.id) return;
    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);
    if (existingIndex >= 0) {
      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };
    } else {
      this.tabs.push(tab);
    }
    this.switchTab(tab.id);
  },

  switchTab(tabId) {
    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {
      this.tabs = [{ id: 'assets', title: 'Assets', view: 'assets', closable: false }];
    }
    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];
    if (!tab) return;
    this.activeTabId = tab.id;
    this.currentView = tab.view || 'assets';
    this.selectedAssetId = tab.assetId || null;
    this.selectedValuationId = tab.selectedValuationId || null;
    this.selectedOfferId = tab.selectedOfferId || null;
    this.subPage = tab.subPage || null;
    this.detailTab = tab.detailTab || 'overview';

    document.querySelectorAll('#admin-nav .navitem').forEach(n => {
      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);
    });

    this.render();
  },

  closeTab(tabId, event) {
    if (event) event.stopPropagation();
    if (!Array.isArray(this.tabs)) return;
    const idx = this.tabs.findIndex(t => t.id === tabId);
    if (idx < 0) return;
    const wasActive = this.activeTabId === tabId;
    this.tabs.splice(idx, 1);
    if (this.tabs.length === 0) {
      this.tabs = [{ id: 'assets', title: 'Assets', view: 'assets', closable: false }];
      this.activeTabId = 'assets';
      this.switchTab('assets');
    } else if (wasActive) {
      const nextTab = this.tabs[Math.min(idx, this.tabs.length - 1)];
      this.switchTab(nextTab.id);
    } else {
      this.renderDoctabs();
    }
  },

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
    if (view === 'valuations') view = 'title';
    this.openTab({
      id: view,
      title: this.getViewTitle(view),
      view: view,
      assetId: null,
      subPage: null,
      detailTab: 'overview',
      closable: this.tabs.length > 0 && view !== 'dashboard'
    });
  },

  render() {
    this.renderDoctabs();
    const el = document.getElementById('admin-work');
    if (!el) return;
    if (this.subPage) {
      el.innerHTML = this.renderSubPage();
      this.bindDocumentDownloads(el);
      return;
    }
    switch (this.currentView) {
      case 'dashboard': el.innerHTML = this.renderDashboard(); break;
      case 'assets': el.innerHTML = this.selectedAssetId ? this.renderAssetDetail(this.selectedAssetId) : this.renderAssetList(); break;
      case 'review': el.innerHTML = this.renderReviewQueue(); break;
      case 'legal': el.innerHTML = this.renderLegalQueue(); break;
      case 'title': el.innerHTML = this.renderTitleQueue(); break;
      case 'valuations': el.innerHTML = this.renderTitleQueue(); break;
      case 'offers': el.innerHTML = this.renderOffersView(); break;
      case 'audit': el.innerHTML = this.renderAuditView(); break;
      case 'banks': el.innerHTML = this.renderBanksAndStaffView(); break;
      default: el.innerHTML = this.renderAssetList();
    }
    this.bindDocumentDownloads(el);
  },

  bindDocumentDownloads(container) {
    container.querySelectorAll('[data-admin-document-download]').forEach(button => {
      button.addEventListener('click', () => this.downloadDocument(button.dataset.adminDocumentDownload));
    });
  },

  async downloadDocument(documentId) {
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/documents/${encodeURIComponent(documentId)}/download`,
        { headers: Store.getAuthHeaders(), cache: 'no-store' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${response.status}).`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || 'document';
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      UI.toast(error.message || 'Document download failed.', 'error');
    }
  },

  async openReviewDocument(documentId) {
    const reviewWindow = window.open('', '_blank');
    if (!reviewWindow) {
      UI.toast('Allow pop-ups to open the supporting document for review.', 'error');
      return false;
    }
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/documents/${encodeURIComponent(documentId)}/download?view=1`,
        { headers: Store.getAuthHeaders(), cache: 'no-store' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Document could not be opened (${response.status}).`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get('Content-Type') || '';
      if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(contentType.toLowerCase())) {
        reviewWindow.location.href = objectUrl;
      } else {
        const disposition = response.headers.get('Content-Disposition') || '';
        const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || 'document';
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        reviewWindow.close();
      }
      return true;
    } catch (error) {
      reviewWindow.close();
      UI.toast(error.message || 'Supporting document could not be opened.', 'error');
      return false;
    }
  },

  async verifyWithEvidence(kind, recordId, documentId) {
    const evidenceKey = `${kind}:${recordId}:${documentId}`;
    if (!this.openedReviewDocuments.has(evidenceKey)) {
      const opened = await this.openReviewDocument(documentId);
      if (!opened) {
        this.render();
        return;
      }
      this.openedReviewDocuments.add(evidenceKey);
      UI.toast('Review the opened document, then select Verify again to save your decision.', 'success');
      this.render();
      return;
    }
    return this.submitVerificationDecision(kind, recordId, 'verify');
  },

  renderDoctabs() {
    const el = document.getElementById('admin-doctabs');
    if (!el) return;
    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {
      const current = this.currentView || 'assets';
      this.tabs = [{ id: current, title: this.getViewTitle ? this.getViewTitle(current) : 'Assets', view: current, closable: false }];
      this.activeTabId = current;
    }
    el.innerHTML = this.tabs.map(t => `
      <div class="dtab ${t.id === this.activeTabId ? 'active' : ''}" onclick="AdminPortal.switchTab('${UI.escapeHtml(t.id)}')">
        <span>${UI.escapeHtml(t.title)}</span>
        ${t.closable ? `<span class="x" title="Close tab" onclick="AdminPortal.closeTab('${UI.escapeHtml(t.id)}', event)">×</span>` : ''}
      </div>
    `).join('');
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
      <div class="gridwrap"><div class="gridtoolbar"><strong style="font-size:12.5px">Recent Activity</strong></div><div style="padding:10px 14px"><ul class="timeline">${Store.auditLog.slice(0, 8).map(a => `      <li><span class="dot ${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span><div class="tl-when">${UI.fmtDate(a.when)}</div><div class="tl-what"><b>${UI.escapeHtml(a.action)}</b> ${UI.escapeHtml(UI.cleanAuditRef(a.entityRef, a.entity))} — ${UI.cleanAuditDetail(a.detail, a)}</div><div class="tl-who">${UI.auditActor(a)}</div></li>`).join('')}</ul></div></div>
    `;
  },

  renderAssetList() {
    return `<div class="page-head"><h1>All Assets</h1><span class="crumb">${Store.assets.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Managing Bank</th><th>Owner</th><th>Category</th><th>Status</th><th>Legal</th><th>Readiness</th></tr></thead><tbody>${Store.assets.length ? Store.assets.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${UI.escapeHtml(a.bankName)}</td><td>${UI.escapeHtml(UI.assetOwnerLabel(a))}</td><td>${UI.escapeHtml(a.category)}</td><td>${UI.badge(a.status)}</td><td>${UI.badge(a.legalStatus)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td></tr>`; }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:30px">No assets registered in the platform yet.</td></tr>'}</tbody></table></div>`;
  },

  openAsset(id) {
    const a = Store.getAsset(id);
    this.openTab({
      id: 'asset-' + id,
      title: a ? a.ref : 'Asset',
      view: 'assets',
      assetId: id,
      subPage: null,
      detailTab: 'overview',
      closable: true
    });
  },
  openValuation(assetId, valuationId) {
    const a = Store.getAsset(assetId);
    this.openTab({
      id: 'val-verify-' + valuationId,
      title: 'Valuation: ' + (a ? a.ref : valuationId),
      view: 'title',
      assetId: assetId,
      selectedValuationId: valuationId,
      subPage: 'valuation-verify',
      detailTab: 'overview',
      closable: true
    });
  },
  openLatestValuation(assetId) {
    const valuation = Store.valuations
      .filter(record => record.asset_id === assetId)
      .sort((left, right) =>
        String(right.valuation_date).localeCompare(String(left.valuation_date)) ||
        Number(right.record_order || 0) - Number(left.record_order || 0)
      )[0];
    if (!valuation) {
      UI.toast('The bank has not submitted a valuation record for this asset yet.', 'warn');
      return;
    }
    this.openValuation(assetId, valuation.id);
  },
  openAssetValuationReview(assetId) {
    const valuation = Store.valuations
      .filter(record => record.asset_id === assetId)
      .sort((left, right) =>
        String(right.valuation_date).localeCompare(String(left.valuation_date)) ||
        Number(right.record_order || 0) - Number(left.record_order || 0)
      )[0];
    if (valuation) {
      this.openValuation(assetId, valuation.id);
      return;
    }
    this.nav('title');
    UI.toast('The asset has no valuation record yet. The Title & Valuation queue is open.', 'warn');
  },
  openTitleReview(assetId) {
    const a = Store.getAsset(assetId);
    this.openTab({
      id: 'title-verify-' + assetId,
      title: 'Title: ' + (a ? a.ref : assetId),
      view: 'title',
      assetId: assetId,
      selectedValuationId: null,
      subPage: 'title-verify',
      detailTab: 'overview',
      closable: true
    });
  },
  closeAsset() {
    this.closeTab(this.activeTabId);
  },
  setTab(t) {
    this.detailTab = t;
    if (t === 'review' && this.selectedAssetId) {
      void this.loadGateReadiness(this.selectedAssetId);
      return;
    }
    this.render();
  },
  async loadGateReadiness(assetId) {
    this.gateReadinessLoading = true;
    this.gateReadinessError = '';
    this.render();
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/assets/${encodeURIComponent(assetId)}/readiness`,
        { headers: Store.getAuthHeaders(), credentials: 'same-origin', cache: 'no-store' }
      );
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.gates)) {
        throw new Error(result.error || `Gate review could not be loaded (${response.status}).`);
      }
      this.gateReadiness = result;
      this.gateReadinessAssetId = assetId;
    } catch (error) {
      this.gateReadinessError = error.message || 'Gate review could not be loaded.';
      UI.toast(this.gateReadinessError, 'error');
    } finally {
      this.gateReadinessLoading = false;
      this.render();
    }
  },
  async recheckGate(assetId) {
    await this.loadGateReadiness(assetId);
    if (!this.gateReadinessError) UI.toast('Gate status refreshed.', 'success');
  },
  openOffer(offerId) {
    this.selectedOfferId = offerId;
    this.currentView = 'offers';
    this.subPage = 'offer-verify';
    this.render();
  },
  openSubPage(name) { this.subPage = name; this.render(); },
  closeSubPage() {
    this.subPage = null;
    this.selectedOfferId = null;
    if (this.currentView === 'title') {
      this.selectedAssetId = null;
      this.selectedValuationId = null;
    }
    if (this.currentView === 'assets' && this.detailTab === 'review' && this.selectedAssetId) {
      void this.loadGateReadiness(this.selectedAssetId);
      return;
    }
    this.render();
  },

  renderAssetDetail(id) {
    const a = Store.getAsset(id);
    if (!a) return '<div class="empty-state"><h3>No Asset Selected</h3><p>Select an asset from the list to view details.</p></div>';
    const readiness = Store.checkPublishReadiness(a);
    const isLive = a.status === 'Live';
    const tab = this.detailTab;
    
    let tabContent = '';
    if (tab === 'overview') tabContent = this.renderOverviewTab(a, readiness);
    else if (tab === 'readiness') tabContent = this.renderReadinessTab(a, readiness);
    else if (tab === 'review') tabContent = this.renderGateReviewTab(a);
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
      ${a.deletionRequested ? `
        <div class="banner warn" style="background:#FFF3CD;border:1px solid #FFEEBA;color:#856404;padding:12px 16px;margin-bottom:14px;border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div>
            <b>⚠ DELETION REQUESTED BY PARTNER BANK</b><br>
            <span style="font-size:12px">Requested by <b>${UI.escapeHtml(a.deletionRequestedBy || 'Bank Staff')}</b>${a.deletionRequestedAt ? ` on ${UI.fmtDateShort(a.deletionRequestedAt)}` : ''}: "${UI.escapeHtml(a.deletionRequestReason || 'No reason provided')}"</span>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn danger small" onclick="AdminPortal.deleteAsset('${a.id}')">Approve &amp; Delete Listing</button>
            <button class="btn small" onclick="AdminPortal.rejectDeletionRequest('${a.id}')">Dismiss Request</button>
          </div>
        </div>
      ` : ''}
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
          <div class="tab-inner ${tab === 'review' ? 'active' : ''}" onclick="AdminPortal.setTab('review')">Review</div>
          <div class="tab-inner ${tab === 'activity' ? 'active' : ''}" onclick="AdminPortal.setTab('activity')">Activity</div>
          <div class="tab-inner ${tab === 'audit' ? 'active' : ''}" onclick="AdminPortal.setTab('audit')">Audit</div>
        </div>
        ${tabContent}
        
        <div class="group" style="margin-top:20px">
          <div class="caption">Review &amp; Publication Actions</div>
          <div class="body">
            <div class="form-actions" style="justify-content:flex-start;gap:10px">
              ${readiness.allPass && !isLive ? `
                <button class="btn success" onclick="AdminPortal.publishAsset()">Publish</button>
              ` : ''}
              
              ${['Submitted', 'Submitted by Bank'].includes(a.status) ? `
                <button class="btn primary" onclick="AdminPortal.startReview()">Begin Review</button>
              ` : ''}
              
              ${a.status === 'Under Review' ? `
                <button class="btn primary" onclick="AdminPortal.approveAsset()">Approve Asset</button>
                <button class="btn" onclick="AdminPortal.requestChanges()">Request Changes</button>
                <button class="btn danger" onclick="AdminPortal.rejectAsset()">Reject</button>
              ` : ''}
              
              ${a.status === 'Approved' && !readiness.allPass ? `
                <button class="btn success" onclick="AdminPortal.publishAsset()">Publish Listing</button>
              ` : ''}
              
              ${isLive ? `
                <button class="btn" onclick="AdminPortal.unpublishAsset()">Unpublish</button>
              ` : ''}
              
              ${!a.legalHold ? `
                <button class="btn danger" onclick="AdminPortal.placeLegalHold()">Place Legal Hold</button>
              ` : `
                <button class="btn success" onclick="AdminPortal.releaseLegalHold()">Release Legal Hold</button>
              `}
              <button class="btn danger" onclick="AdminPortal.deleteAsset('${a.id}')">Delete Listing</button>
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

  renderGateReviewTab(a) {
    if (this.gateReadinessLoading) {
      return '<div class="group"><div class="body">Loading current gate status…</div></div>';
    }
    if (this.gateReadinessError) {
      return `<div class="group"><div class="body"><p class="error">${UI.escapeHtml(this.gateReadinessError)}</p><button class="btn primary" onclick="AdminPortal.recheckGate('${UI.escapeHtml(a.id)}')">Retry</button></div></div>`;
    }
    if (this.gateReadinessAssetId !== a.id || !this.gateReadiness) {
      return `<div class="group"><div class="body"><button class="btn primary" onclick="AdminPortal.recheckGate('${UI.escapeHtml(a.id)}')">Load gate review</button></div></div>`;
    }
    const rows = this.gateReadiness.gates.map(gate => {
      const key = gate.gate.startsWith('LG-2') ? 'legal'
        : gate.gate.startsWith('TL-2') ? 'title'
          : gate.gate.startsWith('VL-1') ? 'valuation' : '';
      let action = `<button class="btn small" onclick="AdminPortal.recheckGate('${UI.escapeHtml(a.id)}')">Recheck</button>`;
      if (key === 'legal') {
        action = `<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open legal review</button>
          ${gate.passed ? `<button class="btn small danger" onclick="AdminPortal.revokeLegalClearance('${UI.escapeHtml(a.id)}')">Revoke gate</button>` : ''}`;
      } else if (key === 'title') {
        action = `<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Review / reverify title</button>`;
      } else if (key === 'valuation') {
        action = `<button class="btn small primary" onclick="AdminPortal.openAssetValuationReview('${UI.escapeHtml(a.id)}')">Review / reverify valuation</button>`;
      }
      return `<tr>
        <td><b>${UI.escapeHtml(gate.gate)}</b><div style="font-size:11px;color:var(--text-2);margin-top:4px">${UI.escapeHtml(gate.detail || '')}</div></td>
        <td>${UI.badge(gate.passed ? 'PASS' : 'FAIL')}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">${action}</div></td>
      </tr>`;
    }).join('');
    return `
      <div class="page-head"><h2>Review Readiness Gates</h2>
        <span class="crumb">${this.gateReadiness.gates.filter(gate => gate.passed).length}/${this.gateReadiness.gates.length} passed · Live verification</span>
        <button class="btn small" onclick="AdminPortal.recheckGate('${UI.escapeHtml(a.id)}')">Recheck all</button>
      </div>
      <div class="banner info"><div>Review each gate independently. Legal, title, and valuation decisions can be reopened and revoked; evidence-based gates are recalculated from verified records.</div></div>
      <div class="group"><div class="caption">Gate-by-gate review</div><div class="gridwrap"><table class="grid">
        <thead><tr><th>Gate and current evidence</th><th>Status</th><th>Review action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;padding:20px">No readiness gates were returned for this asset.</td></tr>'}</tbody>
      </table></div></div>
      <div class="group"><div class="caption">Revoke legal clearance</div><div class="body">
        <textarea id="gate-review-notes" placeholder="Reason required to revoke legal clearance" style="width:100%;height:64px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px"></textarea>
      </div></div>`;
  },

  renderGateItem(c, a) {
    let fix = '';
    if (c.key === 'legal' || c.key === 'injunction' || c.key === 'hold') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open Legal Review</button>`;
    else if (c.key === 'title' || c.key === 'landSearch') fix = `<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Open Title Review</button>`;
    else if (c.key === 'valuation') fix = `<button class="btn small primary" onclick="AdminPortal.openAssetValuationReview('${UI.escapeHtml(a.id)}')">Open Title &amp; Valuation</button>`;
    else if (!c.pass) fix = `<span style="font-size:11px;color:var(--text-2);font-style:italic">Awaiting bank submission</span>`;
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
    return `<div class="group"><div class="caption">Activity</div><div class="body"><ul class="timeline">${a.activity.slice().reverse().map(act => `<li><span class="dot ${act.what.includes('Legal hold') ? 'red' : act.what.includes('Published') ? 'green' : ''}"></span><div class="tl-when">${UI.fmtDate(act.when)}</div><div class="tl-what">${act.what}</div><div class="tl-who">${UI.auditActor(act)}</div></li>`).join('')}</ul></div></div>`;
  },

  renderAuditTab(a) {
    const list = Store.auditLog.filter(x => x.entityRef === a.ref || x.entityRef === a.id);
    return `<div class="group"><div class="caption">Audit</div><div class="body">${list.map(x => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(x.when)}</div><div class="ae-who">${UI.auditActor(x)}</div><div class="ae-what"><b>${UI.escapeHtml(x.action)}</b>${x.oldValue ? ` — <span class="ae-old">${UI.escapeHtml(x.oldValue)}</span> → <span class="ae-new">${UI.escapeHtml(x.newValue)}</span>` : ''}${x.detail ? `<br><span style="color:var(--text-2)">${UI.cleanAuditDetail(x.detail, x)}</span>` : ''}</div></div>`).join('') || '<p style="color:var(--text-2)">No events</p>'}</div></div>`;
  },

  renderReviewQueue() {
    const queue = Store.assets.filter(a => ['Submitted by Bank', 'Submitted', 'Under Review', 'Changes Required'].includes(a.status));
    return `<div class="page-head"><h1>Review Queue</h1></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Status</th><th>Readiness</th><th>Action</th></tr></thead><tbody>${queue.map(a => { const r = Store.checkPublishReadiness(a); return `<tr onclick="AdminPortal.openAsset('${a.id}')"><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.status)}</td><td><span class="badge ${r.allPass ? 'ok' : 'warn'}">${r.checks.filter(c => c.pass).length}/${r.checks.length}</span></td><td><button class="btn small primary" onclick="event.stopPropagation();AdminPortal.openAsset('${a.id}')">Open</button></td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">No assets currently in review queue.</td></tr>'}</tbody></table></div>`;
  },

  renderLegalQueue() {
    const pending = Store.assets.filter(a => !a.legalSubstate?.clearanceIssued || a.injunctionActive || a.legalHold);
    return `<div class="page-head"><h1>Legal Verification Queue</h1><span class="crumb">${pending.length} assets</span></div><div class="gridwrap"><table class="grid"><thead><tr><th>Reference</th><th>Bank</th><th>Legal Status</th><th>Instruments</th><th>Action</th></tr></thead><tbody>${pending.map(a => `<tr><td class="ref">${a.ref}</td><td>${a.bankName}</td><td>${UI.badge(a.legalStatus)}</td><td>${(a.instruments || []).length}</td><td><button class="btn small primary" onclick="AdminPortal.openAsset('${a.id}');AdminPortal.openSubPage('legal-review')">Open</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:20px">No pending legal verifications</td></tr>'}</tbody></table></div>`;
  },

  renderTitleQueue() {
    const titleRows = Store.titles.map(title => {
      const asset = Store.getAsset(title.asset_id);
      return `<tr>
        <td class="ref">${UI.escapeHtml(title.public_ref || asset?.ref || '')}</td>
        <td>${UI.escapeHtml(title.bank_name || asset?.bankName || '')}</td>
        <td>${UI.escapeHtml(title.certificate_number || '')}</td>
        <td>${UI.escapeHtml(title.title_type || '')}</td>
        <td>${UI.badge(title.verification_status || 'Pending')}</td>
        <td>${title.document_id ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(title.document_id)}">Open deed</button>` : UI.badge('No deed')}</td>
        <td><button class="btn small primary" onclick="AdminPortal.openTitleReview('${UI.escapeHtml(title.asset_id)}')">Review</button></td>
      </tr>`;
    }).join('');
    const uploadedWithoutDetails = Store.assets.filter(asset =>
      !asset.titleDetails && asset.titleDocumentId
    ).map(asset => `<tr>
      <td class="ref">${UI.escapeHtml(asset.ref)}</td><td>${UI.escapeHtml(asset.bankName)}</td>
      <td colspan="3">${UI.badge('Deed uploaded · title details missing')}</td>
      <td><button class="btn small" data-admin-document-download="${UI.escapeHtml(asset.titleDocumentId)}">Open deed</button></td>
      <td><button class="btn small" onclick="AdminPortal.openTitleReview('${UI.escapeHtml(asset.id)}')">Review</button></td>
    </tr>`).join('');
    const valuationRows = Store.valuations.map(valuation => `<tr>
      <td class="ref">${UI.escapeHtml(valuation.public_ref || '')}</td>
      <td>${UI.escapeHtml(valuation.bank_name || '')}</td>
      <td>${UI.fmtMoney(valuation.market_value)}</td>
      <td>${UI.fmtMoney(valuation.forced_sale_value)}</td>
      <td>${UI.escapeHtml(valuation.valuation_date || '')}</td>
      <td>${UI.escapeHtml(valuation.expiry_date || '')}</td>
      <td>${UI.badge(valuation.status || 'Pending Review')}</td>
      <td>${valuation.document_id ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(valuation.document_id)}">Open report</button>` : UI.badge('No report')}</td>
      <td><button class="btn small primary" onclick="AdminPortal.openValuation('${UI.escapeHtml(valuation.asset_id)}','${UI.escapeHtml(valuation.id)}')">Review</button></td>
    </tr>`).join('');
    return `
      <div class="page-head"><h1>Title &amp; Valuation</h1>
        <span class="crumb">${Store.titles.filter(item => item.verification_status !== 'Verified').length} title reviews · ${Store.valuations.filter(item => item.status !== 'Valid').length} valuation reviews</span>
      </div>
      <div class="group"><div class="caption">Title Records · ${Store.titles.length}</div><div class="gridwrap"><table class="grid">
        <thead><tr><th>Asset</th><th>Bank</th><th>Title Number</th><th>Type</th><th>Status</th><th>Evidence</th><th>Action</th></tr></thead>
        <tbody>${titleRows}${uploadedWithoutDetails || ''}${titleRows || uploadedWithoutDetails ? '' : '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:20px">No title submissions yet.</td></tr>'}</tbody>
      </table></div></div>
      <div class="group"><div class="caption">Valuation Records · ${Store.valuations.length}</div><div class="gridwrap"><table class="grid">
        <thead><tr><th>Asset</th><th>Bank</th><th>Market Value</th><th>Forced Sale Value</th><th>Valuation Date</th><th>Expiry</th><th>Status</th><th>Evidence</th><th>Action</th></tr></thead>
        <tbody>${valuationRows || '<tr><td colspan="9" style="text-align:center;color:var(--text-2);padding:20px">No valuation submissions yet.</td></tr>'}</tbody>
      </table></div></div>`;
  },

  renderValuationQueue() {
    const records = Store.valuations.slice().sort((left, right) =>
      String(right.valuation_date).localeCompare(String(left.valuation_date)) ||
      Number(right.record_order || 0) - Number(left.record_order || 0)
    );
    const pendingCount = records.filter(record =>
      record.status !== 'Valid' || record.review_required
    ).length;
    const rows = records.map(valuation => `
      <tr>
        <td class="ref">${UI.escapeHtml(valuation.public_ref || '')}</td>
        <td>${UI.escapeHtml(valuation.bank_name || '')}</td>
        <td>${UI.fmtMoney(valuation.market_value)}</td>
        <td>${UI.fmtMoney(valuation.forced_sale_value)}</td>
        <td>${UI.escapeHtml(valuation.valuation_date || '')}</td>
        <td>${UI.escapeHtml(valuation.expiry_date || '')}</td>
        <td>${UI.badge(valuation.status || 'Pending Review')}</td>
        <td>${valuation.document_id
          ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(valuation.document_id)}">Open report</button>`
          : UI.badge('No report')}</td>
        <td><button class="btn small primary" onclick="AdminPortal.openValuation('${UI.escapeHtml(valuation.asset_id)}','${UI.escapeHtml(valuation.id)}')">Review &amp; Validate</button></td>
      </tr>
    `).join('');
    return `
      <div class="page-head">
        <h1>Valuation Review</h1>
        <span class="crumb">${pendingCount} pending · ${records.length} total</span>
      </div>
      <div class="gridwrap"><table class="grid">
        <thead><tr><th>Asset</th><th>Bank</th><th>Market Value</th><th>Forced Sale Value</th><th>Valuation Date</th><th>Expiry</th><th>Status</th><th>Evidence</th><th>Action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-2);padding:20px">No valuation records submitted yet.</td></tr>'}</tbody>
      </table></div>`;
  },

  renderOffersView() {
    const pendingVerifications = Store.offers.filter(o => o.status === 'Pending Surge Verification' || (!o.surgeVerified && o.status !== 'Rejected by Surge')).length;
    const verifiedOffers = Store.offers.filter(o => o.surgeVerified).length;
    const acceptedOffers = Store.offers.filter(o => o.status === 'Accepted').length;

    return `
      <div class="page-head">
        <h1>Buyer Offers &amp; Surge Verification</h1>
        <span class="crumb">${Store.offers.length} total offers · ${pendingVerifications} pending verification</span>
      </div>

      <div class="kpis" style="margin-bottom:16px">
        <div class="kpi ${pendingVerifications ? 'warn' : 'ok'}">
          <div class="k">Pending Surge Verification</div>
          <div class="v">${pendingVerifications}</div>
        </div>
        <div class="kpi">
          <div class="k">Released to Partner Banks</div>
          <div class="v">${verifiedOffers}</div>
        </div>
        <div class="kpi ok">
          <div class="k">Accepted by Banks</div>
          <div class="v">${acceptedOffers}</div>
        </div>
        <div class="kpi">
          <div class="k">Total Offers</div>
          <div class="v">${Store.offers.length}</div>
        </div>
      </div>

      <div class="gridwrap">
        <table class="grid">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Asset</th>
              <th>Managing Bank</th>
              <th>Buyer</th>
              <th class="num">Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${Store.offers.map(o => {
              const isPending = o.status === 'Pending Surge Verification' || (!o.surgeVerified && o.status !== 'Rejected by Surge');
              return `
                <tr onclick="AdminPortal.openOffer('${o.id}')" style="cursor:pointer;${isPending ? 'background:rgba(255,193,7,0.05)' : ''}">
                  <td class="ref"><b>${o.ref}</b></td>
                  <td class="ref">${o.assetRef}</td>
                  <td>${UI.escapeHtml(o.bankName || 'Partner Bank')}</td>
                  <td><b>${UI.escapeHtml(o.buyer)}</b></td>
                  <td class="num">
                    <b>${UI.fmtMoney(o.amount)}</b>
                    ${o.belowReserve ? '<br><span style="color:var(--danger);font-size:10.5px">Below Reserve</span>' : ''}
                  </td>
                  <td><small>${UI.fmtDateShort(o.date)}</small></td>
                  <td>${UI.badge(o.status)}</td>
                  <td style="text-align:right">
                    <button class="btn small primary" onclick="event.stopPropagation();AdminPortal.openOffer('${o.id}')">Review Offer →</button>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-2)">No offers submitted yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAuditView() {
    return `<div class="page-head"><h1>Audit Log</h1><span class="crumb">${Store.auditLog.length} events</span></div><div class="gridwrap"><div style="padding:10px 14px">${Store.auditLog.map(x => `<div class="audit-entry"><div class="ae-when">${UI.fmtDate(x.when)}</div><div class="ae-who">${UI.auditActor(x)}</div><div class="ae-what"><b>${UI.escapeHtml(x.action)}</b> ${UI.escapeHtml(UI.cleanAuditRef(x.entityRef, x.entity))}${x.oldValue ? ` — <span class="ae-old">${UI.escapeHtml(x.oldValue)}</span> → <span class="ae-new">${UI.escapeHtml(x.newValue)}</span>` : ''}${x.detail ? `<br><span style="color:var(--text-2)">${UI.cleanAuditDetail(x.detail, x)}</span>` : ''}</div></div>`).join('') || '<p style="color:var(--text-2);padding:20px">No audit events recorded.</p>'}</div></div>`;
  },

  renderSubPage() {
    if (this.subPage === 'offer-verify' && this.selectedOfferId) {
      const o = Store.offers.find(record => record.id === this.selectedOfferId);
      if (!o) return '<div class="empty-state"><p>Offer not found.</p><button class="btn" onclick="AdminPortal.closeSubPage()">← Back to Offers</button></div>';
      return this.renderOfferWorkspace(o);
    }
    let a = Store.getAsset(this.selectedAssetId);
    if (!a && this.subPage === 'valuation-verify' && this.selectedValuationId) {
      const v = Store.valuations.find(record => record.id === this.selectedValuationId);
      if (v) {
        a = Store.getAsset(v.asset_id) || {
          id: v.asset_id,
          ref: v.asset_ref || v.asset_id,
          bankName: v.bank_name || 'Bank Partner',
          valuationDocumentId: v.document_id
        };
      }
    }
    if (!a) return '<div class="empty-state"><p>Select an asset to continue.</p></div>';
    switch (this.subPage) {
      case 'legal-review': return this.renderLegalWorkspace(a);
      case 'title-verify': return this.renderTitleWorkspace(a);
      case 'valuation-verify': return this.renderValuationWorkspace(a);
      default: return this.renderAssetDetail(a.id);
    }
  },

  renderOfferWorkspace(o) {
    const asset = Store.getAsset(o.assetId) || Store.assets.find(a => a.ref === o.assetRef);
    const isPending = o.status === 'Pending Surge Verification' || (!o.surgeVerified && o.status !== 'Rejected by Surge');

    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeSubPage()">← Back to Offers</button>
        <h1>Offer Verification Workspace</h1>
        <span class="crumb">${o.ref} · ${UI.escapeHtml(o.bankName || 'Partner Bank')}</span>
      </div>

      <div class="group">
        <div class="caption">Offer Particulars</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Offer Reference</span><span class="kv-v"><b>${o.ref}</b></span></div>
          <div class="kv-row"><span class="kv-k">Asset Reference</span><span class="kv-v"><b>${o.assetRef}</b>${asset ? ` <button class="btn small" style="margin-left:8px" onclick="AdminPortal.openAsset('${asset.id}')">View Asset</button>` : ''}</span></div>
          ${asset?.title ? `<div class="kv-row"><span class="kv-k">Asset Title</span><span class="kv-v">${UI.escapeHtml(asset.title)}</span></div>` : ''}
          <div class="kv-row"><span class="kv-k">Managing Bank</span><span class="kv-v">${UI.escapeHtml(o.bankName || 'Partner Bank')}</span></div>
          <div class="kv-row"><span class="kv-k">Offered Purchase Price</span><span class="kv-v"><b style="font-size:15px;color:var(--primary)">${UI.fmtMoney(o.amount)}</b></span></div>
          <div class="kv-row"><span class="kv-k">Reserve Price</span><span class="kv-v">${asset ? UI.fmtMoney(asset.reserve) : '—'} ${o.belowReserve ? '<span class="badge alert" style="margin-left:6px">Below Reserve</span>' : '<span class="badge ok" style="margin-left:6px">Meets Reserve</span>'}</span></div>
          <div class="kv-row"><span class="kv-k">Submission Date</span><span class="kv-v">${UI.fmtDate(o.date)}</span></div>
          <div class="kv-row"><span class="kv-k">Offer Validity</span><span class="kv-v">${o.validity ? UI.fmtDate(o.validity) : '30 Days'}</span></div>
          <div class="kv-row"><span class="kv-k">Payment Terms</span><span class="kv-v">${UI.escapeHtml(o.conditions || 'Cash / Direct Bank Transfer')}</span></div>
          <div class="kv-row"><span class="kv-k">Status</span><span class="kv-v">${UI.badge(o.status)}</span></div>
        </div>
      </div>

      <div class="group">
        <div class="caption">Buyer KYC &amp; Verification Details</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Full Legal Name</span><span class="kv-v"><b>${UI.escapeHtml(o.buyer)}</b></span></div>
          <div class="kv-row"><span class="kv-k">Ghana Card Number</span><span class="kv-v"><code>${UI.escapeHtml(o.ghanaCard || 'GHA-1341354436-6')}</code></span></div>
          <div class="kv-row"><span class="kv-k">Telephone Number</span><span class="kv-v">${o.phone ? `<a href="tel:${UI.escapeHtml(o.phone)}">${UI.escapeHtml(o.phone)}</a>` : 'Not recorded'}</span></div>
          <div class="kv-row"><span class="kv-k">Email Address</span><span class="kv-v">${o.email ? `<a href="mailto:${UI.escapeHtml(o.email)}">${UI.escapeHtml(o.email)}</a>` : 'Not recorded'}</span></div>
          ${o.notes ? `<div class="kv-row"><span class="kv-k">Buyer Notes</span><span class="kv-v" style="color:var(--text-2);font-size:12px">${UI.escapeHtml(o.notes)}</span></div>` : ''}
        </div>
      </div>

      <div class="group">
        <div class="caption">Surge Verification Decision</div>
        <div class="body">
          ${isPending ? `
            <p style="margin:0 0 14px;color:var(--text-2);font-size:12.5px">
              Confirm that the buyer identity, KYC, and proposed offer meet Surge Intermediary qualification criteria before releasing to <b>${UI.escapeHtml(o.bankName || 'the partner bank')}</b>.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn ok" onclick="AdminPortal.verifyOffer('${o.id}')">
                ✓ Verify &amp; Release to Bank
              </button>
              <button class="btn alert" onclick="AdminPortal.rejectOfferModal('${o.id}')">
                Reject Offer
              </button>
            </div>
          ` : o.surgeVerified ? `
            <div class="banner ok" style="margin:0">
              <svg class="ico" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              <div>
                <b>Verified by Surge Solutions.</b> Released to <b>${UI.escapeHtml(o.bankName || 'Partner Bank')}</b> for decision on ${UI.fmtDate(o.surgeVerifiedAt)}${o.surgeVerifiedBy ? ` by ${UI.escapeHtml(o.surgeVerifiedBy)}` : ''}.
              </div>
            </div>
          ` : o.status === 'Rejected by Surge' ? `
            <div class="banner alert" style="margin:0">
              <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div>
                <b>Rejected by Surge Admin.</b> This offer was not released to the bank. Reason: "${UI.escapeHtml(o.rejectionReason || 'Does not meet qualification requirements')}".
              </div>
            </div>
          ` : `
            <div>Current status: <b>${o.status}</b>.</div>
          `}
        </div>
      </div>
    `;
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
                ${i.documentId ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(i.documentId)}">Open document</button>` : '<span class="badge alert">No document</span>'}
                <button class="btn small primary" onclick="AdminPortal.verifyInstrument('${a.id}','${i.id}','${UI.escapeHtml(i.documentId || '')}')">Verify</button>
                <button class="btn small danger" onclick="AdminPortal.rejectInstrument('${a.id}','${i.id}')">Reject</button>
              ` : `<span class="badge ok">✓ Verified</span>${i.documentId ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(i.documentId)}">Open document</button>` : ''}`}
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
            ${a.legalSubstate?.clearanceIssued ? `<button class="btn danger" onclick="AdminPortal.revokeLegalClearance('${UI.escapeHtml(a.id)}')">Revoke Legal Clearance</button>` : ''}
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

  async verifyInstrument(assetId, instrumentId, documentId) {
    if (!documentId) return UI.toast('A supporting legal document is required before verification.', 'error');
    const evidenceKey = `legal-instruments:${instrumentId}:${documentId}`;
    if (!this.openedReviewDocuments.has(evidenceKey)) {
      const opened = await this.openReviewDocument(documentId);
      if (!opened) return;
      this.openedReviewDocuments.add(evidenceKey);
      UI.toast('Review the opened document, then select Verify again to save your decision.', 'success');
      this.render();
      return;
    }
    return this.submitLegalInstrumentDecision(assetId, instrumentId, 'verify');
  },

  rejectInstrument(assetId, instrumentId) {
    return this.submitLegalInstrumentDecision(assetId, instrumentId, 'reject');
  },

  async submitLegalInstrumentDecision(assetId, instrumentId, action) {
    const notes = document.getElementById('legal-notes')?.value.trim() || '';
    if (action === 'reject' && !notes) {
      UI.toast('Add a reason in Verification Notes before rejecting this instrument.', 'error');
      return;
    }
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/legal-instruments/${encodeURIComponent(instrumentId)}/${action}`,
        {
          method: 'POST',
          headers: Store.getAuthHeaders(),
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ notes })
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Legal instrument ${action} failed (${response.status}).`);
      await Store.fetchRemote();
      this.render();
      UI.toast(result.message || 'Legal instrument decision saved.', 'success');
    } catch (error) {
      UI.toast(error.message || 'Legal instrument decision could not be saved.', 'error');
    }
  },

  async issueClearance(assetId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    if (!a.legalSubstate?.instrumentsVerified) return UI.toast('Verify all instruments first', 'error');
    if (a.injunctionActive) return UI.toast('Cannot clear: active injunction', 'error');
    const notes = document.getElementById('legal-notes')?.value || '';
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/assets/${encodeURIComponent(assetId)}/legal-clearance`,
        {
          method: 'POST',
          headers: Store.getAuthHeaders(),
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ notes })
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Clearance failed (${response.status}).`);
      await Store.fetchRemote();
      this.render();
      UI.toast(result.message || 'Legal clearance saved.', 'success');
    } catch (error) {
      UI.toast(error.message || 'Legal clearance could not be saved.', 'error');
    }
  },

  async revokeLegalClearance(assetId) {
    const notes = document.getElementById('gate-review-notes')?.value.trim()
      || document.getElementById('legal-notes')?.value.trim() || '';
    if (!notes) {
      UI.toast('Enter a reason before revoking legal clearance.', 'error');
      return;
    }
    const confirmed = await UI.confirm({
      title: 'Revoke Legal Clearance?',
      message: 'Revoke legal clearance for this asset? This will make the gate fail and return an approved or live asset to review.',
      confirmText: 'Revoke Clearance',
      danger: true
    });
    if (!confirmed) return;
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/assets/${encodeURIComponent(assetId)}/legal-clearance/revoke`,
        {
          method: 'POST',
          headers: Store.getAuthHeaders(),
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ notes })
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Legal clearance could not be revoked (${response.status}).`);
      await Store.fetchRemote();
      UI.toast(result.message || 'Legal clearance revoked.', 'success');
      if (this.currentView === 'assets' && this.detailTab === 'review') {
        await this.loadGateReadiness(assetId);
      } else {
        this.render();
      }
    } catch (error) {
      UI.toast(error.message || 'Legal clearance could not be revoked.', 'error');
    }
  },

  liftInjunction(assetId) {
    const a = Store.getAsset(assetId);
    if (!a) return;
    Store.updateAsset(assetId, { injunctionActive: false, legalHold: false, legalHoldReason: null, status: 'Approved' }, Auth.getActorName(), 'Injunction lifted');
    a.legalSubstate.injunctionClear = true;
    Store.addActivity(assetId, Auth.getActorName(), 'Injunction lifted');
    UI.toast('Injunction lifted. Asset no longer blocked.', 'success');
    this.render(); PublicMarket.render(); BankPortal.render();
  },

  renderTitleWorkspace(a) {
    const title = Store.titles.find(record => record.asset_id === a.id);
    const documentId = title?.document_id || a.titleDocumentId;
    const document = Store.documents.find(item => item.id === documentId);
    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeSubPage()">← Back to Asset</button>
        <h1>Title Verification</h1>${title ? UI.badge(title.verification_status) : ''}
        <span class="crumb">${a.ref} · ${a.bankName}</span>
      </div>
      <div class="banner info"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 16v-4M12 8h.01"/></svg><div>Review the D1-submitted title particulars against the supporting deed. Verification can be revoked later from this queue.</div></div>

      <div class="group">
        <div class="caption">Submitted Title Information</div>
        <div class="body">
          <div class="kv-row"><span class="kv-k">Title Number</span><span class="kv-v">${UI.escapeHtml(title?.certificate_number || a.titleNumber || 'Not provided')}</span></div>
          <div class="kv-row"><span class="kv-k">Title Type</span><span class="kv-v">${UI.escapeHtml(title?.title_type || a.titleType || '—')}</span></div>
          <div class="kv-row"><span class="kv-k">Registry</span><span class="kv-v">${UI.escapeHtml(title?.registry || a.titleRegistry || '—')}</span></div>
          <div class="kv-row"><span class="kv-k">Registered Owner</span><span class="kv-v">${UI.escapeHtml(title?.registered_owner || a.titleOwner || '—')}</span></div>
          <div class="kv-row"><span class="kv-k">Perfection Status</span><span class="kv-v">${UI.escapeHtml(title?.perfection_status || a.titlePerfection || '—')}</span></div>
          <div class="kv-row"><span class="kv-k">Verification Notes</span><span class="kv-v">${UI.escapeHtml(title?.notes || '—')}</span></div>
          <div class="kv-row"><span class="kv-k">Supporting Deed</span><span class="kv-v">${document ? `${UI.escapeHtml(document.title)} · ${UI.escapeHtml(document.file_size || '')}` : 'No deed linked'}</span>
            ${documentId ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(documentId)}">Download deed</button>` : ''}</div>
        </div>
      </div>

      <div class="group">
        <div class="caption">Verification Actions</div>
        <div class="body">
          ${!title ? '<p style="color:var(--danger);margin:0 0 10px">No persisted title record is available. The bank must submit title details and link a deed before verification.</p>' : ''}
          ${title?.perfection_status !== 'Perfected' ? '<p style="color:var(--warning);margin:0 0 10px">The submitted title is not marked Perfected. The API will not allow verification until this is corrected.</p>' : ''}
          <textarea id="title-notes" placeholder="Review notes (required when rejecting or revoking)" style="width:100%;height:72px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px;margin-bottom:10px">${UI.escapeHtml(title?.notes || '')}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${title && title.verification_status !== 'Verified' ? `<button class="btn success" onclick="AdminPortal.verifyTitle('${UI.escapeHtml(title.id)}','${UI.escapeHtml(documentId || '')}')" ${title.perfection_status !== 'Perfected' || !documentId ? 'disabled' : ''}>${this.openedReviewDocuments.has(`titles:${title.id}:${documentId}`) ? 'Confirm Title Verification' : 'Open Deed & Verify Title'}</button>` : ''}
            ${title && !['Verified', 'Rejected', 'Revoked'].includes(title.verification_status) ? `<button class="btn danger" onclick="AdminPortal.rejectTitle('${UI.escapeHtml(title.id)}')">Reject Title</button>` : ''}
            ${title?.verification_status === 'Verified' ? `<button class="btn danger" onclick="AdminPortal.revokeTitle('${UI.escapeHtml(title.id)}')">Revoke Verification</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderValuationWorkspace(a) {
    const valuation = Store.valuations.find(record => record.id === this.selectedValuationId);
    const documentId = valuation?.document_id || a.valuationDocumentId;
    const file = Store.documents.find(item => item.id === documentId);
    if (!valuation) return '<div class="empty-state"><p>Valuation record is unavailable. Refresh the admin queue and try again.</p></div>';
    return `
      <div class="page-head">
        <button class="btn small" onclick="AdminPortal.closeSubPage()">← Back to Queue</button>
        <h1>Valuation Verification</h1>${UI.badge(valuation.status)}
        <span class="crumb">${UI.escapeHtml(a.ref)} · ${UI.escapeHtml(a.bankName)}</span>
      </div>
      <div class="group"><div class="caption">Submitted Valuation</div><div class="body">
        <div class="kv-row"><span class="kv-k">Valuer</span><span class="kv-v">${UI.escapeHtml(valuation.valuer_name || '—')}</span></div>
        <div class="kv-row"><span class="kv-k">Market Value</span><span class="kv-v">${UI.fmtMoney(valuation.market_value)}</span></div>
        <div class="kv-row"><span class="kv-k">Forced Sale Value</span><span class="kv-v">${UI.fmtMoney(valuation.forced_sale_value)}</span></div>
        <div class="kv-row"><span class="kv-k">Valuation Date</span><span class="kv-v">${UI.escapeHtml(valuation.valuation_date || '—')}</span></div>
        <div class="kv-row"><span class="kv-k">Expiry Date</span><span class="kv-v">${UI.escapeHtml(valuation.expiry_date || '—')}</span></div>
        <div class="kv-row"><span class="kv-k">Validity</span><span class="kv-v">${UI.escapeHtml(String(valuation.validity_period_days || '—'))} days</span></div>
        <div class="kv-row"><span class="kv-k">Review Notes</span><span class="kv-v">${UI.escapeHtml(valuation.notes || '—')}</span></div>
        <div class="kv-row"><span class="kv-k">Supporting Report</span><span class="kv-v">${file ? `${UI.escapeHtml(file.title)} · ${UI.escapeHtml(file.file_size || '')}` : 'No report linked'}</span>
          ${documentId ? `<button class="btn small" data-admin-document-download="${UI.escapeHtml(documentId)}">Download report</button>` : ''}</div>
      </div></div>
      <div class="group"><div class="caption">Review Decision</div><div class="body">
        <textarea id="valuation-notes" placeholder="Review notes (required when rejecting or revoking)" style="width:100%;height:72px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px;margin-bottom:10px">${UI.escapeHtml(valuation.notes || '')}</textarea>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:12px;flex-wrap:wrap">
          ${!['Valid', 'Rejected', 'Revoked'].includes(valuation.status) ? `<button class="btn danger" onclick="AdminPortal.rejectValuation('${UI.escapeHtml(valuation.id)}')">Reject Valuation</button>` : ''}
          ${valuation.status !== 'Valid' ? `<button class="btn success" onclick="AdminPortal.verifyValuation('${UI.escapeHtml(valuation.id)}','${UI.escapeHtml(documentId || '')}')" ${!documentId ? 'disabled' : ''}>Verify Valuation</button>` : ''}
          ${valuation.status === 'Valid' ? `<button class="btn danger" onclick="AdminPortal.revokeValuation('${UI.escapeHtml(valuation.id)}')">Revoke Verification</button>` : ''}
        </div>
      </div></div>`;
  },

  async submitVerificationDecision(kind, recordId, action) {
    const notesId = kind === 'titles' ? 'title-notes' : 'valuation-notes';
    const notes = document.getElementById(notesId)?.value.trim() || '';
    if (['reject', 'revoke'].includes(action) && !notes) {
      UI.toast('Add a reason before rejecting or revoking verification.', 'error');
      return;
    }
    try {
      const response = await fetch(
        `${Store.API_BASE}/api/admin/${kind}/${encodeURIComponent(recordId)}/${action}`,
        {
          method: 'POST',
          headers: Store.getAuthHeaders(),
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ notes })
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `Review action failed (${response.status}).`);
      await Store.fetchRemote();
      UI.toast(result.message || 'Review decision saved.', 'success');
      if (action === 'verify') this.render();
      else this.closeSubPage();
    } catch (error) {
      this.render();
      UI.toast(error.message || 'Review decision could not be saved.', 'error');
    }
  },

  verifyTitle(recordId, documentId) {
    return this.verifyWithEvidence('titles', recordId, documentId);
  },

  rejectTitle(recordId) {
    return this.submitVerificationDecision('titles', recordId, 'reject');
  },

  revokeTitle(recordId) {
    return this.submitVerificationDecision('titles', recordId, 'revoke');
  },

  verifyValuation(recordId, documentId) {
    return this.submitVerificationDecision('valuations', recordId, 'verify');
  },

  toggleValuationVerification(recordId, documentId, checked) {
    if (!checked) return;
    return this.verifyValuation(recordId, documentId);
  },

  rejectValuation(recordId) {
    return this.submitVerificationDecision('valuations', recordId, 'reject');
  },

  revokeValuation(recordId) {
    return this.submitVerificationDecision('valuations', recordId, 'revoke');
  },

  async performAssetAction(action, successMessage, body = {}, assetId = this.selectedAssetId) {
    if (!assetId) {
      UI.toast('Select an asset before continuing.', 'warn');
      return false;
    }
    try {
      const response = await fetch(`${Store.API_BASE}/api/admin/assets/${encodeURIComponent(assetId)}/${action}`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(body)
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`The API returned an invalid response (${response.status}).`);
      }
      if (!response.ok || !result.success) {
        const failedGates = Array.isArray(result.gates)
          ? result.gates.filter(gate => !gate.passed).map(gate => gate.gate).join(', ')
          : '';
        throw new Error([result.error || `Action failed (${response.status}).`, failedGates].filter(Boolean).join(' Missing requirements: '));
      }
      await Store.fetchRemote();
      UI.toast(successMessage || result.message || 'Asset updated.', 'success');
      this.render();
      PublicMarket.render();
      BankPortal.render();
      return true;
    } catch (error) {
      console.error(`Asset ${action} failed:`, error);
      UI.toast(error.message || `Could not ${action.replace('-', ' ')} the asset. Please retry.`, 'error');
      return false;
    }
  },

  startReview() {
    return this.performAssetAction('review', 'Review started.');
  },
  
  approveAsset() {
    return this.performAssetAction('approve', 'Asset approved. Ready for marketplace publication.');
  },
  
  requestChanges() {
    return this.performAssetAction('request-changes', 'Changes requested successfully.');
  },
  
  rejectAsset() {
    return this.performAssetAction('reject', 'Asset rejected.');
  },
  
  publishCurrent() { this.publishAsset(); },
  
  publishAsset() {
    return this.performAssetAction('publish', 'Asset published to Marketplace.');
  },
  
  unpublishAsset() {
    return this.performAssetAction('unpublish', 'Asset unpublished from Marketplace.');
  },
  
  holdCurrent() { this.placeLegalHold(); },
  
  placeLegalHold() {
    if (!this.selectedAssetId) return;
    UI.modal('Place Legal Hold', `<p>This immediately suspends the listing and blocks all progression.</p><div class="field"><span class="lbl">Reason <span class="req">*</span></span><div class="ctl"><input id="hold-reason" style="width:100%" placeholder="Required reason"></div></div>`, `<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn danger" onclick="AdminPortal.confirmHold()">Place Hold</button>`);
  },
  
  confirmHold() {
    const reason = document.getElementById('hold-reason')?.value?.trim();
    if (!reason) return UI.toast('A reason is required to place a legal hold.', 'error');
    return this.performAssetAction('hold', 'Legal hold placed.', { reason }).then(success => {
      if (success) UI.closeModal();
    });
  },
  
  releaseLegalHold(assetId) {
    const id = assetId || this.selectedAssetId;
    if (!id) return;
    return this.performAssetAction('release-hold', 'Legal hold released. Asset returns to Approved.', {}, id);
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
          <h1>
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
    const activeCount = banks.filter(b => b.status === 'Active').length;
    const commissionRange = banks.length ? (Math.min(...banks.map(b => Number(b.commissionRate) || 4)).toFixed(1) + '% — ' + Math.max(...banks.map(b => Number(b.commissionRate) || 5)).toFixed(1) + '%') : '4.0% — 5.0%';

    return `
      <div class="kpis" style="margin-bottom:18px">
        <div class="kpi"><div class="k">Institutional Partners</div><div class="v">${banks.length}</div><div class="d">${activeCount} active</div></div>
        <div class="kpi ok"><div class="k">Active Bank Staff</div><div class="v">${totalStaff}</div><div class="d">Across all institutions</div></div>
        <div class="kpi info"><div class="k">Assets in Portfolio</div><div class="v">${totalAssets}</div><div class="d">Total managed assets</div></div>
        <div class="kpi alert"><div class="k">Commission Range</div><div class="v">${commissionRange}</div><div class="d">Standard fee structure</div></div>
      </div>

      ${banks.length === 0 ? `
        <div class="gridwrap" style="padding:40px 20px;text-align:center">
          <svg class="ico" viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--text-2);margin-bottom:12px"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/></svg>
          <h3 style="margin:0 0 8px">No Partner Banks Registered Yet</h3>
          <p style="color:var(--text-2);margin:0 0 16px">Onboard institutional banking partners to begin managing repossessed and distressed assets.</p>
          <button class="btn primary" onclick="AdminPortal.modalAddBank()">+ Onboard First Partner Bank</button>
        </div>
      ` : `
        <div class="gridwrap">
          <div class="gridtoolbar" style="display:flex;align-items:center;justify-content:space-between">
            <strong style="font-size:12.5px">${banks.length} Partner Institution${banks.length !== 1 ? 's' : ''} Registered</strong>
            <button class="btn small" onclick="UI.exportPDF('portfolio')" style="font-size:11px">Export Report</button>
          </div>
          <table class="grid">
            <thead>
              <tr>
                <th style="width:50px">Code</th>
                <th>Institution</th>
                <th>Contact</th>
                <th style="text-align:center">Commission</th>
                <th style="text-align:center">Assets</th>
                <th style="text-align:center">Staff</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${banks.map(b => `
                <tr>
                  <td>
                    <span style="display:inline-block;background:var(--blue);color:#fff;font-family:Consolas,monospace;font-size:10px;font-weight:700;padding:2px 6px;border-radius:2px;letter-spacing:0.3px">${UI.escapeHtml(b.code)}</span>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">${UI.escapeHtml(b.name)}</div>
                    <div style="font-size:11px;color:var(--text-2)">${UI.escapeHtml(b.region || 'Greater Accra')} · ${UI.escapeHtml(b.branchName || 'Head Office')}</div>
                  </td>
                  <td>
                    <div style="font-size:12px">${UI.escapeHtml(b.email || '—')}</div>
                    <div style="font-size:11px;color:var(--text-2)">${UI.escapeHtml(b.phone || '—')}</div>
                  </td>
                  <td style="text-align:center">
                    <span style="font-weight:700;font-size:13px;color:var(--blue)">${b.commissionRate || 4.0}%</span>
                  </td>
                  <td style="text-align:center">
                    <span style="font-weight:700;font-size:13px">${b.assetCount || 0}</span>
                  </td>
                  <td style="text-align:center">
                    <span style="font-weight:700;font-size:13px;color:#28a745">${b.staffCount || 0}</span>
                  </td>
                  <td>
                    <span class="badge ${b.status === 'Active' ? 'ok' : 'draft'}">${b.status}</span>
                  </td>
                  <td style="text-align:right">
                    <div style="display:inline-flex;gap:4px">
                      <button class="btn small ok" onclick="AdminPortal.modalAddStaff('${b.id}')" title="Add staff member">
                        <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                      </button>
                      <button class="btn small" onclick="AdminPortal.filterBankStaff('${b.id}')" title="View staff (${b.staffCount || 0})">
                        <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                      </button>
                      <button class="btn small danger" onclick="Store.deleteBank('${b.id}')" title="Remove bank">
                        <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5 7l1 14h12l1-14"/><path d="M9 7V4h6v3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
            <input type="text" placeholder="Search by name, username, or email..." value="${this.staffSearchQuery || ''}"
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
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${u.hasPassword ? '#28a745' : '#9A6700'}"></span>
                    <span style="font-size:11.5px;font-weight:600;color:${u.hasPassword ? '#28a745' : '#9A6700'}">${u.hasPassword ? 'Password Active' : 'Password Not Set'}</span>
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
                    <button class="btn small danger" onclick="Store.deleteUser('${u.id}')" title="${u.protected ? 'Protected owner account' : 'Delete account'}" aria-label="${u.protected ? 'Protected owner account' : `Delete ${u.username} account`}" ${u.protected ? 'disabled' : ''}>
                      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5 7l1 14h12l1-14"/><path d="M9 7V4h6v3"/></svg>
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
            <input id="add-staff-name" style="width:100%" placeholder="Enter staff member’s name" oninput="AdminPortal.suggestUsername(this.value)" required>
          </div>
        </div>

        <div class="field">
          <span class="lbl">Assigned Username <span class="req">*</span></span>
          <div class="ctl">
            <div style="position:relative">
              <span style="position:absolute;left:8px;top:6px;color:var(--text-2);font-family:Consolas,monospace">@</span>
              <input id="add-staff-username" style="width:100%;padding-left:24px;font-family:Consolas,monospace" placeholder="e.g. first.last" required>
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
            <input type="email" id="add-staff-email" style="width:100%" placeholder="name@organization.com" required>
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
  },

  async verifyOffer(offerId) {
    const offer = Store.offers.find(o => o.id === offerId);
    const label = offer ? `offer ${offer.ref} (${UI.fmtMoney(offer.amount)})` : 'this offer';
    const confirmed = await UI.confirm({
      title: 'Verify Buyer Offer',
      message: `Verify ${label}? Once verified, the recovery bank will be able to see the offer and decide whether to accept or reject it.`,
      confirmText: 'Verify Offer',
      danger: false,
      type: 'info'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/admin/offers/${encodeURIComponent(offerId)}/verify`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to verify offer');
      UI.toast(json.message || 'Offer verified and released to the bank.', 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  rejectOfferModal(offerId) {
    const offer = Store.offers.find(o => o.id === offerId);
    if (!offer) return;
    const bodyHtml = `
      <p style="font-size:13px;color:var(--text-1);margin-bottom:12px">
        Reject offer <b>${offer.ref}</b> from <b>${UI.escapeHtml(offer.buyer)}</b> (${UI.fmtMoney(offer.amount)}).
        The offer will not be released to the recovery bank.
      </p>
      <div class="field">
        <span class="lbl">Rejection Reason <span class="req">*</span></span>
        <div class="ctl">
          <textarea id="reject-offer-reason" style="width:100%;height:80px;font-family:inherit;font-size:13px" placeholder="e.g. Unrealistic offer below minimum threshold, KYC qualification failed, fraudulent contact details..."></textarea>
        </div>
      </div>
    `;
    const footerHtml = `
      <button class="btn" onclick="UI.closeModal()">Cancel</button>
      <button class="btn danger" onclick="AdminPortal.submitRejectOffer('${offerId}')">Confirm Rejection</button>
    `;
    UI.modal('Reject Offer', bodyHtml, footerHtml);
  },

  async submitRejectOffer(offerId) {
    const reason = document.getElementById('reject-offer-reason')?.value?.trim();
    if (!reason) {
      return UI.toast('Please provide a reason for rejecting the offer.', 'error');
    }
    try {
      const res = await fetch(`${Store.API_BASE}/api/admin/offers/${encodeURIComponent(offerId)}/reject`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to reject offer');
      UI.closeModal();
      UI.toast(json.message || 'Offer rejected.', 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async deleteAsset(id = this.selectedAssetId) {
    const a = Store.getAsset(id);
    if (!a) return;
    const promptMsg = a.status === 'Live'
      ? `Are you sure you want to permanently delete listing ${a.ref}?\n\nThis listing is currently PUBLISHED on the live marketplace. Deleting it will remove it from the marketplace and delete all associated records (documents, valuations, titles, offers). This action CANNOT be undone.`
      : `Are you sure you want to permanently delete asset ${a.ref}? All associated records will be deleted.`;
    const confirmed = await UI.confirm({
      title: 'Delete Listing?',
      message: promptMsg,
      confirmText: 'Delete Listing',
      danger: true
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${Store.API_BASE}/api/admin/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete listing');
      UI.toast(json.message || `Listing ${a.ref} deleted successfully.`, 'success');
      this.closeAsset();
      await Store.fetchRemote();
      this.render();
      if (typeof PublicMarket !== 'undefined' && PublicMarket.render) PublicMarket.render();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  },

  async rejectDeletionRequest(id = this.selectedAssetId) {
    const a = Store.getAsset(id);
    if (!a) return;
    const confirmed = await UI.confirm({
      title: 'Dismiss Deletion Request?',
      message: `Dismiss the deletion request for ${a.ref}? The listing will remain published.`,
      confirmText: 'Dismiss Request',
      danger: false,
      type: 'info'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${Store.API_BASE}/api/admin/assets/${encodeURIComponent(id)}/reject-deletion-request`, {
        method: 'POST',
        headers: Store.getAuthHeaders(),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to dismiss request');
      UI.toast(json.message || 'Deletion request dismissed.', 'success');
      await Store.fetchRemote();
      this.render();
    } catch (err) {
      UI.toast(err.message, 'error');
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
    const imgHtml = a.primaryImage
      ? `<img src="${UI.escapeHtml(a.primaryImage)}" alt="${UI.escapeHtml(a.assetType)}" style="width:100%;height:100%;object-fit:cover">`
      : `<svg class="ph" viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>`;
    return `<div class="acard" onclick="PublicMarket.openDetail('${a.id}')">
      <div class="thumb">${imgHtml}<span class="badge live">Live</span><span class="ref">${a.ref}</span></div>
      <div class="cbody"><span class="cat">${a.category}</span><span class="ttl">${a.assetType}</span><div class="loc">${a.publicLocation}</div>
      <div class="price">${a.showReserve ? `<span class="amt">${UI.fmtMoney(a.reserve).split('.')[0]}<small>.00</small></span>` : '<span class="poa">Price on Application</span>'}</div>
      <div class="listedby"><span class="sq"></span>Listed by Surge Solutions</div></div>
    </div>`;
  },

  detailImages: [],
  activeImageIndex: 0,
  detailImagesLoading: false,

  async openDetail(id) {
    this.selectedAssetId = id;
    this.currentPage = 'home';
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.detailImagesLoading = true;
    this.render();

    // Fetch images from the public API
    try {
      const a = Store.getAsset(id);
      const ref = a ? (a.ref || id) : id;
      const resp = await fetch(Store.API_BASE + '/api/marketplace/assets/' + encodeURIComponent(ref), { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data && Array.isArray(json.data.images)) {
          this.detailImages = json.data.images.map(img => ({
            id: img.id,
            url: img.url,
            caption: img.caption || '',
            isPrimary: !!img.is_primary,
            isExterior: !!img.is_exterior
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load asset images:', e);
    }
    this.detailImagesLoading = false;
    this.render();
  },

  closeDetail() { this.selectedAssetId = null; this.detailImages = []; this.activeImageIndex = 0; this.render(); },

  selectImage(idx) {
    this.activeImageIndex = idx;
    const mainImg = document.querySelector('.gallery .mainimg img');
    if (mainImg && this.detailImages[idx]) {
      mainImg.src = this.detailImages[idx].url;
      mainImg.alt = this.detailImages[idx].caption || 'Property photo';
    }
    document.querySelectorAll('.gallery .thumbs .t').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
  },

  renderDetail() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return this.renderHome();

    // Build gallery HTML
    let galleryHtml = '';
    if (this.detailImagesLoading) {
      galleryHtml = `<div class="mainimg"><div style="text-align:center;color:#8A9AA9"><svg class="ph" viewBox="0 0 24 24" style="width:40px;height:40px;stroke:#A9B6C2;fill:none;stroke-width:1.2;animation:pulse 1.5s ease-in-out infinite"><circle cx="12" cy="12" r="10"/></svg><div style="margin-top:8px;font-size:12px">Loading photos…</div></div></div>`;
    } else if (this.detailImages.length > 0) {
      const activeImg = this.detailImages[this.activeImageIndex] || this.detailImages[0];
      galleryHtml = `
        <div class="mainimg">
          <img src="${UI.escapeHtml(activeImg.url)}" alt="${UI.escapeHtml(activeImg.caption || a.assetType)}" style="width:100%;height:100%;object-fit:cover">
          <span class="badge live">${this.detailImages.length} Photo${this.detailImages.length > 1 ? 's' : ''}</span>
        </div>
        ${this.detailImages.length > 1 ? `<div class="thumbs">${this.detailImages.map((img, idx) => `<div class="t ${idx === this.activeImageIndex ? 'active' : ''}" onclick="PublicMarket.selectImage(${idx})" title="${UI.escapeHtml(img.caption || 'Photo ' + (idx + 1))}"><img src="${UI.escapeHtml(img.url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:1px"></div>`).join('')}</div>` : ''}
      `;
    } else if (a.primaryImage) {
      galleryHtml = `<div class="mainimg"><img src="${UI.escapeHtml(a.primaryImage)}" alt="${UI.escapeHtml(a.assetType)}" style="width:100%;height:100%;object-fit:cover"></div>`;
    } else {
      galleryHtml = `<div class="mainimg"><svg class="ph" viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg></div>`;
    }

    return `
      <div class="page-head"><button class="btn small" onclick="PublicMarket.closeDetail()">← Back</button><h1 style="font-size:16px">${a.assetType}</h1>${UI.badge('Live')}</div>
      <div class="detail-page">
        <div class="gallery">${galleryHtml}</div>
        <div class="detail-side">
          <div class="panelbox"><h4>${a.category} · ${a.assetType}</h4>
            <div class="pricebig">${a.showReserve ? UI.fmtMoney(a.reserve) : 'Price on Application'}</div>
            <p style="font-size:12.5px;color:var(--text-2);margin:6px 0 12px">${a.description}</p>
            <table class="details"><tr><th>Reference</th><td>${a.ref}</td></tr><tr><th>Location</th><td>${a.publicLocation}</td></tr><tr><th>Region</th><td>${a.region}</td></tr>${a.occupancyStatus ? `<tr><th>Occupancy</th><td>${a.occupancyStatus}</td></tr>` : ''}${a.beds ? `<tr><th>Bedrooms</th><td>${a.beds}</td></tr>` : ''}${a.baths ? `<tr><th>Bathrooms</th><td>${a.baths}</td></tr>` : ''}</table>
          </div>
          <div class="panelbox"><div class="cta-col">
            <button class="btn primary" onclick="PublicMarket.enquiry('${a.id}')">Submit Enquiry</button>
            <button class="btn" onclick="PublicMarket.requestViewing('${a.id}')">Request Viewing</button>
            <button class="btn" onclick="PublicMarket.submitOffer('${a.id}')">Submit Formal Offer</button>
          </div></div>
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

  faqCategory: 'all',
  faqQuery: '',

  setFaqCategory(cat) {
    this.faqCategory = cat;
    this.render();
  },

  handleFaqSearch(val) {
    this.faqQuery = (val || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.pub-faq-row');
    rows.forEach(r => {
      const text = (r.getAttribute('data-search') || '').toLowerCase();
      const match = !this.faqQuery || text.includes(this.faqQuery);
      r.style.display = match ? 'block' : 'none';
    });
  },

  toggleFaq(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active');
  },

  renderHow() {
    return `
      <div class="pub-hero">
        <div class="pub-hero-badge"><span class="sq"></span>Statutory Asset Disposition Framework</div>
        <h2>How Distressed Asset Acquisition Works</h2>
        <p>Surge Solutions is the licensed recovery and disposition intermediary for commercial banks in Ghana. We provide a transparent, 5-stage acquisition pipeline that connects qualified purchasers directly to verified bank-held and court-ordered inventory.</p>
        <div class="pub-metrics-bar">
          <div class="pub-metric-item"><span class="pub-metric-val">5-Gate</span><span class="pub-metric-lbl">Legal Title Clearance</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">4.0%</span><span class="pub-metric-lbl">Fixed Statutory Fee (No Markups)</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">14–30 Days</span><span class="pub-metric-lbl">Bank Conveyance SLA</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">100%</span><span class="pub-metric-lbl">Bank Escrow Protected</span></div>
        </div>
      </div>

      <div class="pub-stepper">
        <div class="pub-step-card">
          <div class="pub-step-num"><span class="num">01</span><span class="label">Intake</span></div>
          <div class="pub-step-content">
            <div class="pub-step-header">
              <span class="pub-step-title">Bank Ingestion &amp; 5-Gate Legal Verification</span>
              <span class="badge live">Pre-Listing Audit</span>
            </div>
            <p class="pub-step-desc">Assets originate directly from partner commercial banks following loan default recovery. Surge conducts a rigorous 5-gate audit before any asset is published: High Court Writ of Possession verification, Lands Commission title search, Collateral Registry lien clearance, independent chartered valuation, and on-ground occupancy inspection.</p>
            <div class="pub-step-safeguard"><b>Safeguard:</b> Only unencumbered assets with court-affirmed disposal mandates reach public listing. Assets with active disputes are placed on immediate Legal Hold.</div>
          </div>
        </div>

        <div class="pub-step-card">
          <div class="pub-step-num"><span class="num">02</span><span class="label">Search</span></div>
          <div class="pub-step-content">
            <div class="pub-step-header">
              <span class="pub-step-title">Sanitized Marketplace Discovery &amp; Free Enquiry</span>
              <span class="badge info">No Registration Required</span>
            </div>
            <p class="pub-step-desc">Prospective purchasers browse verified listings across Greater Accra, Ashanti, Western, and Central regions. Asset profiles feature verified specifications, general locality maps, photographic documentation, and reserve price benchmarks. Submit direct inquiries free of charge without paywalls or subscriptions.</p>
            <div class="pub-step-safeguard"><b>Safeguard:</b> Exact cadastral coordinates and borrower details remain restricted prior to KYC to protect security and privacy.</div>
          </div>
        </div>

        <div class="pub-step-card">
          <div class="pub-step-num"><span class="num">03</span><span class="label">KYC</span></div>
          <div class="pub-step-content">
            <div class="pub-step-header">
              <span class="pub-step-title">Assigned Recovery Officer &amp; KYC Verification</span>
              <span class="badge pending">Act 1044 Regulated</span>
            </div>
            <p class="pub-step-desc">A designated Surge Asset Recovery Officer contacts you within 24 hours to confirm asset specifications and qualify your interest. Under the Anti-Money Laundering Act, 2020 (Act 1044), prospective buyers verify identity via Ghana Card PIN and declare their source of funds prior to viewing or offer submission.</p>
            <div class="pub-step-safeguard"><b>Safeguard:</b> Fast-track compliance approval (under 24 hours) with strict confidentiality and verified buyer records.</div>
          </div>
        </div>

        <div class="pub-step-card">
          <div class="pub-step-num"><span class="num">04</span><span class="label">Inspect</span></div>
          <div class="pub-step-content">
            <div class="pub-step-header">
              <span class="pub-step-title">Supervised On-Site Inspection &amp; Formal Offer</span>
              <span class="badge ok">Direct Bank Filing</span>
            </div>
            <p class="pub-step-desc">Surge security and recovery officers escort you for an extensive physical viewing. You are welcome to bring chartered surveyors or structural engineers. Once satisfied, submit a formal purchase offer specifying price, financing structure (Direct Wire, Mortgage Facility, or Staged Settlement), and validity period.</p>
            <div class="pub-step-safeguard"><b>Safeguard:</b> Offers are formally logged, timestamped, and transmitted directly to the managing bank's Credit and Recovery Committee.</div>
          </div>
        </div>

        <div class="pub-step-card">
          <div class="pub-step-num"><span class="num">05</span><span class="label">Close</span></div>
          <div class="pub-step-content">
            <div class="pub-step-header">
              <span class="pub-step-title">Bank Committee Acceptance &amp; Legal Conveyance</span>
              <span class="badge sale">Title Perfection</span>
            </div>
            <p class="pub-step-desc">Upon committee approval, Surge issues the formal disposition agreement and earnest settlement invoice. Funds are deposited strictly into designated recovery escrow accounts at the partner bank. Surge legal counsel coordinates the Deed of Assignment, High Court Certificate of Purchase, and Lands Commission registration.</p>
            <div class="pub-step-safeguard"><b>Safeguard:</b> 100% audited transactional trail. Zero cash handling. Guaranteed unencumbered title conveyance.</div>
          </div>
        </div>
      </div>

      <div class="pub-features-grid">
        <div class="pub-feat-box">
          <div class="pub-feat-title"><span class="sq" style="width:7px;height:7px;background:var(--blue);border-radius:1px;display:inline-block"></span>Guaranteed Clear Title</div>
          <p class="pub-feat-desc">Every listing is backed by validated court judgments, Lands Commission searches, and Collateral Registry certifications.</p>
        </div>
        <div class="pub-feat-box accent-red">
          <div class="pub-feat-title"><span class="sq" style="width:7px;height:7px;background:var(--red);border-radius:1px;display:inline-block"></span>Zero Broker Markups</div>
          <p class="pub-feat-desc">Statutory standard commission (4.0%) prevents arbitrary agent markups, unauthorized fees, and speculative price escalation.</p>
        </div>
        <div class="pub-feat-box accent-success">
          <div class="pub-feat-title"><span class="sq" style="width:7px;height:7px;background:var(--success);border-radius:1px;display:inline-block"></span>Escrow Bank Settlement</div>
          <p class="pub-feat-desc">Payments are made directly to authorized bank recovery escrow accounts. No mobile money transfers or personal accounts.</p>
        </div>
        <div class="pub-feat-box accent-warn">
          <div class="pub-feat-title"><span class="sq" style="width:7px;height:7px;background:var(--warning);border-radius:1px;display:inline-block"></span>Diaspora Friendly</div>
          <p class="pub-feat-desc">Remote video walkthroughs, digital Ghana Card compliance, and institutional power-of-attorney coordination for overseas buyers.</p>
        </div>
      </div>

      <div class="group">
        <div class="caption">Comparative Model: Surge Regulated Disposition vs. Informal Broker Market</div>
        <div class="body" style="padding:0">
          <div class="pub-table-wrap" style="margin:0;border:none">
            <table>
              <thead>
                <tr>
                  <th style="width:28%">Transaction Parameter</th>
                  <th style="width:36%">Surge Solutions Regulated Intermediary</th>
                  <th style="width:36%">Traditional Informal Real Estate Market</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Title Origin &amp; Verification</b></td>
                  <td>Direct court execution &amp; 5-Gate Lands Commission audit</td>
                  <td style="color:var(--text-2)">Unverified indentures; high risk of multi-party litigation</td>
                </tr>
                <tr>
                  <td><b>Pricing Transparency</b></td>
                  <td>Independent chartered valuation with published reserve benchmarks</td>
                  <td style="color:var(--text-2)">Arbitrary broker markups (often 10–25% above actual value)</td>
                </tr>
                <tr>
                  <td><b>Dispute Protection</b></td>
                  <td>Enforceable High Court Writ of Possession and police clearance</td>
                  <td style="color:var(--text-2)">Vulnerability to land guards and customary stool injunctions</td>
                </tr>
                <tr>
                  <td><b>Financial Settlement</b></td>
                  <td>Designated bank recovery escrow account with formal invoice</td>
                  <td style="color:var(--text-2)">Personal cash requests or unregulated third-party accounts</td>
                </tr>
                <tr>
                  <td><b>Conveyance Timeline</b></td>
                  <td>14–30 business days with structured legal handover</td>
                  <td style="color:var(--text-2)">Indefinite delays, incomplete indentures, lack of registration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
        <button class="btn primary" onclick="PublicMarket.goHome()">Browse Live Assets</button>
        <button class="btn" onclick="PublicMarket.goKyc()">Start KYC Verification</button>
        <button class="btn" onclick="PublicMarket.goContact()">Speak With an Asset Officer</button>
      </div>
    `;
  },

  renderKyc() {
    return `
      <div class="pub-hero">
        <div class="pub-hero-badge"><span class="sq"></span>Regulatory Compliance · Act 1044</div>
        <h2>Buyer KYC &amp; Identity Verification</h2>
        <p>Under the Anti-Money Laundering Act, 2020 (Act 1044) and Bank of Ghana asset realization directives, prospective purchasers must complete customer due diligence prior to scheduling supervised physical viewings or filing binding purchase offers.</p>
        <div class="pub-metrics-bar">
          <div class="pub-metric-item"><span class="pub-metric-val">Act 1044</span><span class="pub-metric-lbl">Statutory Compliance</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Confidential</span><span class="pub-metric-lbl">Protected Buyer Data</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">&lt; 24 Hrs</span><span class="pub-metric-lbl">Compliance Turnaround</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Bank-Grade</span><span class="pub-metric-lbl">Due Diligence</span></div>
        </div>
      </div>

      <div class="pub-contact-grid">
        <div>
          <div class="group">
            <div class="caption">Submit Buyer KYC Application</div>
            <div class="body">
              <p style="font-size:12px;color:var(--text-2);margin:0 0 14px;line-height:1.5">Complete this digital verification form. Your details are treated with strict confidentiality and reviewed exclusively by authorized Surge compliance officers.</p>

              <div class="field">
                <span class="lbl">Full Legal Name <span class="req">*</span></span>
                <div class="ctl">
                  <input id="kyc-fullname" placeholder="As shown on your Ghana Card" style="width:100%">
                  <span class="help">Individual or Registered Corporate Entity Name</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Ghana Card PIN <span class="req">*</span></span>
                <div class="ctl">
                  <input id="kyc-card" placeholder="GHA-XXXXXXXXX-X" style="width:100%">
                  <span class="help">Format: GHA-123456789-0</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Email Address <span class="req">*</span></span>
                <div class="ctl">
                  <input type="email" id="kyc-email" placeholder="purchaser@domain.com" style="width:100%">
                </div>
              </div>

              <div class="field">
                <span class="lbl">Phone Number <span class="req">*</span></span>
                <div class="ctl">
                  <input id="kyc-phone" placeholder="+233 24 000 0000" style="width:100%">
                  <span class="help">Include country code for diaspora buyers</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Buyer Category <span class="req">*</span></span>
                <div class="ctl">
                  <select id="kyc-category" style="width:100%">
                    <option value="Individual Resident">Individual Ghanaian Resident</option>
                    <option value="Corporate Entity">Registered Corporate Entity / Enterprise</option>
                    <option value="Diaspora Ghanaian">Diaspora Ghanaian Investor</option>
                    <option value="Foreign National">Foreign National / International Investor</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Source of Funds <span class="req">*</span></span>
                <div class="ctl">
                  <select id="kyc-source" style="width:100%">
                    <option value="Personal Savings">Personal Savings &amp; Accumulated Earnings</option>
                    <option value="Business Operations">Operating Business Revenue / Retained Earnings</option>
                    <option value="Bank Mortgage Facility">Commercial Bank Mortgage / Pre-Approved Facility</option>
                    <option value="Diaspora Remittances">Diaspora Foreign Exchange Remittances</option>
                    <option value="Asset Sale / Liquidation">Proceeds from Previous Asset Sale or Investment</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Target Asset Ref</span>
                <div class="ctl">
                  <input id="kyc-asset-ref" placeholder="e.g. AST-ACC-2026-001 (Optional)" style="width:100%">
                  <span class="help">Leave blank for general pre-approved buyer qualification</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Consent &amp; Authorization <span class="req">*</span></span>
                <div class="ctl" style="padding-top:4px">
                  <label style="font-size:12px;color:var(--text);display:flex;align-items:flex-start;gap:8px;cursor:pointer">
                    <input type="checkbox" id="kyc-consent" style="margin-top:2px;width:auto;height:auto">
                    <span>I certify that all details submitted are accurate and consent to verification with the National Identification Authority and partner bank compliance systems under Act 1044.</span>
                  </label>
                </div>
              </div>

              <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
                <button class="btn primary" onclick="PublicMarket.submitKyc()">Submit KYC for Verification</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="pub-contact-card">
            <h4><span class="sq"></span>Why KYC is Mandatory</h4>
            <p style="font-size:12px;color:var(--text-2);line-height:1.55;margin:0 0 10px">Repossessed assets are legally protected properties under court custody and commercial bank balance sheets. To prevent vexatious claims, unauthorized site trespass, or fraudulent bids, only verified parties are granted physical access and offer eligibility.</p>
            <div class="banner info" style="margin-bottom:0">
              <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span><b>Browsing is always free.</b> You do not need KYC simply to view listings or submit preliminary general inquiries.</span>
            </div>
          </div>

          <div class="pub-contact-card">
            <h4><span class="sq"></span>Required Verification Checklist</h4>
            <div class="readiness-list">
              <li>
                <div class="check pass"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
                <div class="item-label"><b>Ghana Card PIN</b><br><span style="font-size:11px;color:var(--text-2)">Issued by the National Identification Authority (NIA)</span></div>
              </li>
              <li>
                <div class="check pass"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
                <div class="item-label"><b>Proof of Acquisition Capacity</b><br><span style="font-size:11px;color:var(--text-2)">Bank reference letter, facility pre-approval, or funds statement</span></div>
              </li>
              <li>
                <div class="check pass"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
                <div class="item-label"><b>GhanaPost Digital Address</b><br><span style="font-size:11px;color:var(--text-2)">Official residential or commercial location identifier</span></div>
              </li>
              <li>
                <div class="check pass"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
                <div class="item-label"><b>Corporate Registration (If applicable)</b><br><span style="font-size:11px;color:var(--text-2)">RGD Form 3 and Board Resolution authorizing acquisition</span></div>
              </li>
            </div>
          </div>

          <div class="pub-contact-card">
            <h4><span class="sq"></span>Confidentiality &amp; Privacy Safeguards</h4>
            <div class="kv-row"><span class="kv-k">Statutory Purpose</span><span class="kv-v">Bank recovery due diligence only</span></div>
            <div class="kv-row"><span class="kv-k">Authorized Review</span><span class="kv-v">Designated Surge compliance officers</span></div>
            <div class="kv-row"><span class="kv-k">Third-Party Disclosure</span><span class="kv-v">Never shared with commercial brokers or marketers</span></div>
          </div>

          <div class="pub-safe-box">
            <b>Regulatory Notice:</b> In accordance with the Anti-Money Laundering Act, 2020 (Act 1044), Surge Solutions is mandated to report suspicious transaction structures to the Financial Intelligence Centre (FIC).
          </div>
        </div>
      </div>
    `;
  },

  async submitKyc() {
    const name = document.getElementById('kyc-fullname')?.value?.trim();
    const card = document.getElementById('kyc-card')?.value?.trim();
    const email = document.getElementById('kyc-email')?.value?.trim();
    const phone = document.getElementById('kyc-phone')?.value?.trim();
    const category = document.getElementById('kyc-category')?.value;
    const source = document.getElementById('kyc-source')?.value;
    const assetRef = document.getElementById('kyc-asset-ref')?.value?.trim();
    const consent = document.getElementById('kyc-consent')?.checked;

    if (!name || !card || !email || !phone) {
      return UI.toast('Full name, Ghana Card PIN, email, and phone are required.', 'error');
    }
    if (!consent) {
      return UI.toast('Please authorize the compliance verification checkbox to proceed.', 'warn');
    }

    const kycId = 'KYC-2026-' + Math.floor(100000 + Math.random() * 900000);

    try {
      if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
        await fetch(Store.API_BASE + '/api/marketplace/buyers/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            ghana_card_number: card,
            email,
            phone,
            source_of_funds: source,
            related_asset_ref: assetRef
          })
        });
      }
    } catch (e) {
      console.warn('KYC remote dispatch fallback:', e);
    }

    Store.addAudit(name, 'KYC_SUBMISSION', 'KYC', kycId, null, 'Pending Review', `Buyer KYC application submitted by ${name} (${card})`);

    UI.modal('KYC Application Received', `
      <div style="text-align:center;padding:12px 0 16px">
        <div style="width:48px;height:48px;border-radius:50%;background:#D4EDDA;color:#155724;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <svg style="width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <h3 style="margin:0 0 6px;font-size:16px">Verification Application Lodged</h3>
        <p style="font-size:12.5px;color:var(--text-2);margin:0 0 14px">Your application has been received and routed to the Surge Compliance Desk.</p>
        <div style="background:#F6F9FC;border:1px solid #C9D8EA;padding:10px 14px;border-radius:3px;font-family:Consolas,monospace;font-size:14px;font-weight:700;color:var(--blue)">
          Reference: ${kycId}
        </div>
      </div>
      <div class="kv-row"><span class="kv-k">Applicant Name</span><span class="kv-v">${UI.escapeHtml(name)}</span></div>
      <div class="kv-row"><span class="kv-k">Ghana Card PIN</span><span class="kv-v">${UI.escapeHtml(card)}</span></div>
      <div class="kv-row"><span class="kv-k">Source of Funds</span><span class="kv-v">${UI.escapeHtml(source)}</span></div>
      <div class="kv-row"><span class="kv-k">Target Asset</span><span class="kv-v">${UI.escapeHtml(assetRef || 'General Buyer Pre-Approval')}</span></div>
      <div class="kv-row"><span class="kv-k">Review Status</span><span class="kv-v"><span class="badge pending">Under Compliance Review</span></span></div>
      <p style="font-size:11.5px;color:var(--text-2);margin:12px 0 0;line-height:1.5">You will receive an SMS and email notification upon verification within 4–24 business hours. You may quote this reference number when booking viewings.</p>
    `, '<button class="btn primary" onclick="UI.closeModal();PublicMarket.goHome()">Return to Marketplace</button>');

    UI.toast('KYC application submitted successfully.', 'success');
  },

  renderFaq() {
    const faqs = [
      {
        id: 'faq-1',
        cat: 'title',
        catLabel: 'Legal & Title',
        q: 'Where do the assets listed on Surge Solutions originate?',
        a: 'All listed assets originate directly from partner commercial banks and licensed deposit-taking institutions in Ghana. They represent secured collateral repossessed following judicial default, High Court writs of execution, or consensual settlement recoveries. Surge is the designated intermediary authorized by these financial institutions to handle marketing and disposition.'
      },
      {
        id: 'faq-2',
        cat: 'title',
        catLabel: 'Legal & Title',
        q: 'How does Surge guarantee that properties are free from litigation and land guards?',
        a: 'Every property published on Surge has passed our 5-Gate Legal Audit: 1) High Court Writ of Possession confirmation; 2) Official Lands Commission search certifying root of title; 3) Collateral Registry search clearing competing institutional claims; 4) Licensed independent valuation; and 5) Physical occupancy inspection by security personnel. Assets with active family or title disputes are placed on strict Legal Hold and never listed.'
      },
      {
        id: 'faq-3',
        cat: 'title',
        catLabel: 'Legal & Title',
        q: 'What legal title documents will I receive upon completing the purchase?',
        a: 'The purchaser receives an official Deed of Assignment or Conveyance executed by the recovering bank (with High Court registrar attestation where court-mandated), accompanied by the Certificate of Purchase / Vesting Deed and certified cadastral site plans for expedited title registration at the Lands Commission.'
      },
      {
        id: 'faq-4',
        cat: 'pricing',
        catLabel: 'Pricing & Terms',
        q: 'Are listed prices negotiable, and what does "Reserve Price" mean?',
        a: 'The Reserve Price represents the statutory liquidation threshold determined by independent chartered valuation surveyors and approved by the bank Credit Committee. Prospective buyers may submit formal offers at, above, or reasoned conditional offers near reserve. The bank Credit Committee evaluates each offer based on offered price, settlement speed, and payment method.'
      },
      {
        id: 'faq-5',
        cat: 'pricing',
        catLabel: 'Pricing & Terms',
        q: 'What payment structures and financing options are accepted?',
        a: 'Three primary payment structures are accepted: 1) Direct Bank Wire / RTGS payment to the bank designated recovery escrow account; 2) Pre-approved mortgage facilities from registered Ghanaian commercial banks; and 3) Structured staged settlements (typically 10–20% earnest deposit upon offer acceptance, with the balance paid over 30 to 90 calendar days).'
      },
      {
        id: 'faq-6',
        cat: 'pricing',
        catLabel: 'Pricing & Terms',
        q: 'Does Surge Solutions charge the buyer any broker fees or search fees?',
        a: 'No. Surge operates on a transparent, regulated statutory commission model (typically 4.0% included in the approved transaction structure). We never charge upfront inspection fees, registration fees, or speculative agent markups. Searching and enquiring on our marketplace is completely free.'
      },
      {
        id: 'faq-7',
        cat: 'viewing',
        catLabel: 'Viewing & Process',
        q: 'Can I physically inspect a property before submitting an offer?',
        a: 'Yes. Physical inspections are mandatory and supervised. All viewings must be scheduled in advance through Surge and are conducted alongside an authorized Surge Asset Recovery Officer and security escort. For compliance and property preservation reasons, unescorted visits are strictly prohibited.'
      },
      {
        id: 'faq-8',
        cat: 'viewing',
        catLabel: 'Viewing & Process',
        q: 'Can I bring my own structural engineer, valuer, or legal counsel to the inspection?',
        a: 'We strongly encourage prospective buyers to bring their chartered surveyors, structural engineers, or legal representatives during the scheduled viewing. Detailed measurements, physical assessments, and structural tests may be performed during the appointment.'
      },
      {
        id: 'faq-9',
        cat: 'viewing',
        catLabel: 'Viewing & Process',
        q: 'Why is KYC required before viewing or offer submission?',
        a: 'Repossessed real estate is under sensitive judicial and banking administration. Requiring Ghana Card verification and proof of acquisition capacity protects the asset from unlawful trespass, preserves borrower privacy, and fulfills mandatory Bank of Ghana Anti-Money Laundering requirements under Act 1044.'
      },
      {
        id: 'faq-10',
        cat: 'diaspora',
        catLabel: 'Diaspora & Foreign',
        q: 'Can Ghanaians living abroad (Diaspora) purchase assets remotely through Surge?',
        a: 'Yes. Surge provides a comprehensive Diaspora Acquisition Service. Overseas buyers can conduct live video walkthrough inspections, verify compliance digitally using the Ghana Card PIN or passport, and appoint a local representative or legal counsel through our power-of-attorney protocol.'
      },
      {
        id: 'faq-11',
        cat: 'diaspora',
        catLabel: 'Diaspora & Foreign',
        q: 'Can foreign nationals or non-Ghanaian corporations buy land through Surge?',
        a: 'Under Article 266 of the 1992 Constitution of Ghana and the Land Act, 2020 (Act 1036), non-citizens and foreign companies may hold residential or commercial land on renewable leasehold terms up to 50 years. Surge verifies the remaining unexpired leasehold term for every listed asset before publishing.'
      },
      {
        id: 'faq-12',
        cat: 'diaspora',
        catLabel: 'Diaspora & Foreign',
        q: 'How are funds transferred safely from international accounts?',
        a: 'International buyers remit settlement funds strictly through direct SWIFT / RTGS wire transfers into the designated commercial bank recovery escrow accounts in Ghana. Surge never accepts cash transfers via informal money transmitters or personal mobile money accounts.'
      }
    ];

    const currentCat = this.faqCategory || 'all';
    const filteredFaqs = currentCat === 'all' ? faqs : faqs.filter(f => f.cat === currentCat);

    return `
      <div class="pub-hero">
        <div class="pub-hero-badge"><span class="sq"></span>Regulatory &amp; Transaction Knowledge Base</div>
        <h2>Frequently Asked Questions</h2>
        <p>Comprehensive guidance regarding repossessed asset verification, reserve pricing, inspection protocols, legal title transfer, and escrow settlement in Ghana.</p>
        <div class="pub-metrics-bar">
          <div class="pub-metric-item"><span class="pub-metric-val">12</span><span class="pub-metric-lbl">Standard Guidance Topics</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Act 1036</span><span class="pub-metric-lbl">Land Law Aligned</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Direct Bank</span><span class="pub-metric-lbl">No Intermediary Markup</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">100%</span><span class="pub-metric-lbl">Verified Bank Escrow</span></div>
        </div>
      </div>

      <div class="pub-faq-toolbar">
        <div class="pub-faq-filter-pills">
          <button class="pub-faq-pill ${currentCat === 'all' ? 'active' : ''}" onclick="PublicMarket.setFaqCategory('all')">All Questions</button>
          <button class="pub-faq-pill ${currentCat === 'title' ? 'active' : ''}" onclick="PublicMarket.setFaqCategory('title')">Legal &amp; Title</button>
          <button class="pub-faq-pill ${currentCat === 'pricing' ? 'active' : ''}" onclick="PublicMarket.setFaqCategory('pricing')">Pricing &amp; Terms</button>
          <button class="pub-faq-pill ${currentCat === 'viewing' ? 'active' : ''}" onclick="PublicMarket.setFaqCategory('viewing')">Viewing &amp; Process</button>
          <button class="pub-faq-pill ${currentCat === 'diaspora' ? 'active' : ''}" onclick="PublicMarket.setFaqCategory('diaspora')">Diaspora &amp; Foreign</button>
        </div>
        <div class="pub-faq-search">
          <svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;stroke:var(--text-2)"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Filter questions by keyword..." onkeyup="PublicMarket.handleFaqSearch(this.value)">
        </div>
      </div>

      <div class="pub-faq-list" id="pub-faq-container">
        ${filteredFaqs.map(f => `
          <div class="pub-faq-row" id="${f.id}" data-search="${UI.escapeHtml(f.q + ' ' + f.a + ' ' + f.catLabel)}">
            <button class="pub-faq-q" onclick="PublicMarket.toggleFaq('${f.id}')">
              <span><span class="pub-faq-cat-badge">${f.catLabel}</span>${f.q}</span>
              <span class="pub-faq-chevron">&#9660;</span>
            </button>
            <div class="pub-faq-a">${f.a}</div>
          </div>
        `).join('')}
      </div>

      <div class="group" style="background:#EDF1F5">
        <div class="body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div>
            <h4 style="margin:0 0 4px;font-size:14px;color:var(--blue)">Have a question about a specific asset?</h4>
            <p style="margin:0;font-size:12px;color:var(--text-2)">Our Asset Recovery Officers provide tailored advice on title reports, cadastral surveys, and formal bank offer structuring.</p>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn primary" onclick="PublicMarket.goContact()">Submit Asset Enquiry</button>
            <button class="btn" onclick="PublicMarket.goHome()">Browse Live Listings</button>
          </div>
        </div>
      </div>
    `;
  },

  renderContact() {
    return `
      <div class="pub-hero">
        <div class="pub-hero-badge"><span class="sq"></span>Official Communications &amp; Advisory Desk</div>
        <h2>Contact Surge Solutions</h2>
        <p>Direct communication channels to our Asset Recovery Advisory Desk, Legal Verification Department, and Supervised Viewing Coordinators in Accra.</p>
        <div class="pub-metrics-bar">
          <div class="pub-metric-item"><span class="pub-metric-val">Accra, GH</span><span class="pub-metric-lbl">Headquarters &amp; Operations</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">&lt; 4 Hours</span><span class="pub-metric-lbl">Average Response Time</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Direct Lines</span><span class="pub-metric-lbl">Advisory &amp; Legal Desk</span></div>
          <div class="pub-metric-item"><span class="pub-metric-val">Mon–Sat</span><span class="pub-metric-lbl">Operational Schedule</span></div>
        </div>
      </div>

      <div class="pub-contact-grid">
        <div>
          <div class="group">
            <div class="caption">Official Asset Enquiry &amp; Support Request</div>
            <div class="body">
              <p style="font-size:12px;color:var(--text-2);margin:0 0 14px;line-height:1.5">Submit your inquiry directly to our asset desk. An assigned recovery specialist will review your request and get in touch promptly.</p>

              <div class="field">
                <span class="lbl">Full Legal Name <span class="req">*</span></span>
                <div class="ctl">
                  <input id="ct-name" placeholder="Your full name" style="width:100%">
                </div>
              </div>

              <div class="field">
                <span class="lbl">Phone Number <span class="req">*</span></span>
                <div class="ctl">
                  <input id="ct-phone" placeholder="+233 24 000 0000" style="width:100%">
                  <span class="help">Include country code for diaspora callers</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Email Address <span class="req">*</span></span>
                <div class="ctl">
                  <input type="email" id="ct-email" placeholder="you@domain.com" style="width:100%">
                </div>
              </div>

              <div class="field">
                <span class="lbl">Nature of Enquiry <span class="req">*</span></span>
                <div class="ctl">
                  <select id="ct-subject" style="width:100%">
                    <option value="Specific Asset Inquiry">Specific Asset Details &amp; Reserve Inquiry</option>
                    <option value="Schedule Viewing">Request Supervised Physical Viewing</option>
                    <option value="Diaspora Advisory">Diaspora Investor Advisory &amp; Remote Purchase</option>
                    <option value="Institutional Purchase">Corporate / Bulk Asset Acquisition</option>
                    <option value="Legal & Title Clearance">Legal Title Verification &amp; Court Writ Inquiries</option>
                    <option value="General Information">General Market Information</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Asset Reference</span>
                <div class="ctl">
                  <input id="ct-asset-ref" placeholder="e.g. AST-ACC-2026-001 (Optional)" style="width:100%">
                  <span class="help">Specify if enquiring about an existing listing</span>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Preferred Contact</span>
                <div class="ctl">
                  <select id="ct-channel" style="width:100%">
                    <option value="Phone Call">Direct Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Email">Formal Email Correspondence</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <span class="lbl">Message / Inquiry <span class="req">*</span></span>
                <div class="ctl">
                  <textarea id="ct-msg" style="width:100%;height:84px" placeholder="Please describe your interest, preferred locations, budget range, or specific questions..."></textarea>
                </div>
              </div>

              <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
                <button class="btn primary" onclick="PublicMarket.submitContact()">Submit Official Enquiry</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="pub-contact-card">
            <h4><span class="sq"></span>Principal Office &amp; Operations Centre</h4>
            <div class="kv-row"><span class="kv-k">Physical Address</span><span class="kv-v">Surge Asset Recovery Centre<br>4th Floor, Ridge Financial Enclave<br>Independence Avenue, Accra</span></div>
            <div class="kv-row"><span class="kv-k">Digital Address</span><span class="kv-v"><span class="badge live">GA-019-4821</span></span></div>
            <div class="kv-row"><span class="kv-k">Postal Address</span><span class="kv-v">P.O. Box CT 4892, Cantonments, Accra</span></div>
          </div>

          <div class="pub-contact-card">
            <h4><span class="sq"></span>Direct Communications</h4>
            <div class="kv-row"><span class="kv-k">General Switchboard</span><span class="kv-v"><b>+233 (0) 30 274 0000</b></span></div>
            <div class="kv-row"><span class="kv-k">Asset Advisory Desk</span><span class="kv-v"><b>+233 (0) 24 455 0192</b></span></div>
            <div class="kv-row"><span class="kv-k">Diaspora WhatsApp</span><span class="kv-v"><b>+233 (0) 50 123 4567</b></span></div>
            <div class="kv-row"><span class="kv-k">General Enquiries</span><span class="kv-v"><a href="mailto:enquiries@surge.gh">enquiries@surge.gh</a></span></div>
            <div class="kv-row"><span class="kv-k">Legal &amp; Compliance</span><span class="kv-v"><a href="mailto:legal@surge.gh">legal@surge.gh</a></span></div>
            <div class="kv-row"><span class="kv-k">Buyer KYC Compliance</span><span class="kv-v"><a href="mailto:kyc@surge.gh">kyc@surge.gh</a></span></div>
          </div>

          <div class="pub-contact-card">
            <h4><span class="sq"></span>Operating Hours &amp; Viewing Schedule</h4>
            <div class="kv-row"><span class="kv-k">Monday &ndash; Friday</span><span class="kv-v">08:00 &ndash; 17:00 GMT</span></div>
            <div class="kv-row"><span class="kv-k">Saturday</span><span class="kv-v">09:00 &ndash; 14:00 GMT (Supervised Viewings Only)</span></div>
            <div class="kv-row"><span class="kv-k">Sunday &amp; Holidays</span><span class="kv-v">Closed (Emergency Security Protocol Active)</span></div>
          </div>

          <div class="pub-safe-box">
            <b>Anti-Fraud Notice:</b> Surge Solutions never requests cash payments in person or to personal mobile money numbers. All formal transaction funds must be settled via certified bank transfers directly into designated partner bank recovery escrow accounts.
          </div>
        </div>
      </div>
    `;
  },

  submitContact() {
    const name = document.getElementById('ct-name')?.value?.trim();
    const phone = document.getElementById('ct-phone')?.value?.trim();
    const email = document.getElementById('ct-email')?.value?.trim();
    const subject = document.getElementById('ct-subject')?.value || 'General';
    const assetRef = document.getElementById('ct-asset-ref')?.value?.trim() || '';
    const channel = document.getElementById('ct-channel')?.value || 'Phone Call';
    const msg = document.getElementById('ct-msg')?.value?.trim();

    if (!name || !phone || !email || !msg) {
      return UI.toast('Full name, phone, email, and message are required.', 'error');
    }

    const ref = 'SL-LEAD-2026-' + String(Store.leads.length + 104).padStart(6, '0');
    Store.leads.push({
      id: 'l' + Date.now(),
      ref,
      assetId: null,
      assetRef,
      name,
      phone,
      email,
      status: 'New',
      source: 'Contact Desk (' + subject + ')',
      channel,
      assignedTo: null,
      createdAt: new Date().toISOString()
    });

    Store.addAudit('Public Buyer', 'ENQUIRY', 'Lead', ref, null, 'New', `Official contact enquiry from ${name} [${subject}]`);

    UI.modal('Enquiry Successfully Submitted', `
      <div style="text-align:center;padding:12px 0 16px">
        <div style="width:48px;height:48px;border-radius:50%;background:#D4EDDA;color:#155724;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <svg style="width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <h3 style="margin:0 0 6px;font-size:16px">Enquiry Reference Assigned</h3>
        <p style="font-size:12.5px;color:var(--text-2);margin:0 0 14px">Your message has been logged with the Surge Asset Recovery Desk.</p>
        <div style="background:#F6F9FC;border:1px solid #C9D8EA;padding:10px 14px;border-radius:3px;font-family:Consolas,monospace;font-size:14px;font-weight:700;color:var(--blue)">
          Reference: ${ref}
        </div>
      </div>
      <div class="kv-row"><span class="kv-k">Sender</span><span class="kv-v">${UI.escapeHtml(name)}</span></div>
      <div class="kv-row"><span class="kv-k">Phone</span><span class="kv-v">${UI.escapeHtml(phone)}</span></div>
      <div class="kv-row"><span class="kv-k">Email</span><span class="kv-v">${UI.escapeHtml(email)}</span></div>
      <div class="kv-row"><span class="kv-k">Enquiry Classification</span><span class="kv-v"><b>${UI.escapeHtml(subject)}</b></span></div>
      <div class="kv-row"><span class="kv-k">Preferred Channel</span><span class="kv-v">${UI.escapeHtml(channel)}</span></div>
      <p style="font-size:11.5px;color:var(--text-2);margin:12px 0 0;line-height:1.5">An Asset Recovery Officer will contact you within 4 hours during business days. Thank you for contacting Surge Solutions.</p>
    `, '<button class="btn primary" onclick="UI.closeModal();PublicMarket.goHome()">Return to Marketplace</button>');

    UI.toast(`Enquiry received. Tracking Reference: ${ref}`, 'success');
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