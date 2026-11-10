const fs = require('fs');

const jsFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\app.js',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\app.js',
];

for (const f of jsFiles) {
  let js = fs.readFileSync(f, 'utf8');

  // 1. Replace PublicMarket.init() to restore asset or page from URL hash / sessionStorage
  const oldInit = `  init() {
    this.syncSwitcherState();
    this.render();
  },`;

  const newInit = `  init() {
    this.syncSwitcherState();
    this.restoreStateFromUrl();
    this.render();

    window.addEventListener('hashchange', () => {
      this.restoreStateFromUrl();
    });
  },

  restoreStateFromUrl() {
    try {
      const hash = (window.location.hash || '').replace(/^#/, '').trim();
      const searchParams = new URLSearchParams(window.location.search);
      const queryAsset = searchParams.get('asset') || searchParams.get('ref');
      const savedRef = sessionStorage.getItem('surge_market_selected_ref');
      const savedAsset = sessionStorage.getItem('surge_market_selected_asset');

      if (['how', 'kyc', 'faq', 'contact'].includes(hash.toLowerCase())) {
        this.selectedAssetId = null;
        this.currentPage = hash.toLowerCase();
        this.setActiveNav(this.currentPage);
        this.render();
        return;
      }

      const target = hash ? decodeURIComponent(hash) : (queryAsset || savedRef || savedAsset);
      if (target && target !== 'home') {
        const a = Store.assets.find(x => x.id === target || x.ref === target) || Store.getAsset(target) || Store.getAssetByRef(target);
        if (a) {
          this.openDetail(a.id);
        } else {
          // If Store.fetchRemote is still in-flight, preserve target so openDetail runs once assets load
          this._pendingTarget = target;
          this.selectedAssetId = target;
          this.detailImagesLoading = true;
          this.openDetail(target);
        }
      }
    } catch (e) {
      console.warn('Failed to restore marketplace URL state:', e);
    }
  },`;

  if (js.includes(oldInit)) {
    js = js.replace(oldInit, newInit);
    console.log('✅ Replaced init() with restoreStateFromUrl() in', f);
  }

  // 2. Update go(p) to clear URL hash and sessionStorage
  const oldGo = `  go(p) {
    this.currentPage = p;
    this.selectedAssetId = null;
    this.setActiveNav(p);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },`;

  const newGo = `  go(p) {
    this.currentPage = p;
    this.selectedAssetId = null;
    this._pendingTarget = null;
    try {
      sessionStorage.removeItem('surge_market_selected_asset');
      sessionStorage.removeItem('surge_market_selected_ref');
      if (p === 'home') {
        if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        history.replaceState(null, '', '#' + encodeURIComponent(p));
      }
    } catch (e) {}
    this.setActiveNav(p);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },`;

  if (js.includes(oldGo)) {
    js = js.replace(oldGo, newGo);
    console.log('✅ Updated go(p) in', f);
  }

  // 3. Update openDetail(id) to persist to URL hash and sessionStorage
  const oldOpenDetail = `  async openDetail(id) {
    this.selectedAssetId = id;
    this.currentPage = 'home';
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.detailImagesLoading = true;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const a = Store.getAsset(id);
      const ref = a ? (a.ref || id) : id;`;

  const newOpenDetail = `  async openDetail(id) {
    this.selectedAssetId = id;
    this.currentPage = 'home';
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.detailImagesLoading = true;

    // Persist to URL hash and sessionStorage so refreshing stays on this asset page
    try {
      const a = Store.getAsset(id) || Store.getAssetByRef(id) || Store.assets.find(x => x.id === id || x.ref === id);
      const refOrId = a ? (a.ref || a.id) : id;
      sessionStorage.setItem('surge_market_selected_asset', id);
      sessionStorage.setItem('surge_market_selected_ref', refOrId);
      history.replaceState(null, '', '#' + encodeURIComponent(refOrId));
    } catch (e) {}

    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const a = Store.getAsset(id) || Store.getAssetByRef(id) || Store.assets.find(x => x.id === id || x.ref === id);
      const ref = a ? (a.ref || id) : id;`;

  if (js.includes(oldOpenDetail)) {
    js = js.replace(oldOpenDetail, newOpenDetail);
    console.log('✅ Updated openDetail(id) in', f);
  }

  // 4. Update closeDetail() to clear hash and storage
  const oldCloseDetail = `  closeDetail() {
    this.selectedAssetId = null;
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.render();
  },`;

  const newCloseDetail = `  closeDetail() {
    this.selectedAssetId = null;
    this._pendingTarget = null;
    this.detailImages = [];
    this.activeImageIndex = 0;
    try {
      sessionStorage.removeItem('surge_market_selected_asset');
      sessionStorage.removeItem('surge_market_selected_ref');
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {}
    this.render();
  },`;

  if (js.includes(oldCloseDetail)) {
    js = js.replace(oldCloseDetail, newCloseDetail);
    console.log('✅ Updated closeDetail() in', f);
  }

  // 5. Update renderDetail() to handle loading and fallback lookup by ref or id
  const oldRenderDetailHead = `  renderDetail() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return this.renderHome();`;

  const newRenderDetailHead = `  renderDetail() {
    const a = Store.getAsset(this.selectedAssetId) || Store.getAssetByRef(this.selectedAssetId) || Store.assets.find(x => x.id === this.selectedAssetId || x.ref === this.selectedAssetId);
    if (!a) {
      if (this.detailImagesLoading || Store.assets.length === 0) {
        return \`
          <main class="main" style="padding-top:48px;padding-bottom:64px;text-align:center">
            <div style="font-size:14px;color:var(--text-2);padding:40px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:2px">
              Loading asset listing \${UI.escapeHtml(this.selectedAssetId || '')}...
            </div>
          </main>
          \${this.renderFooter()}
        \`;
      }
      return this.renderHome();
    }`;

  if (js.includes(oldRenderDetailHead)) {
    js = js.replace(oldRenderDetailHead, newRenderDetailHead);
    console.log('✅ Updated renderDetail() in', f);
  }

  // 6. Update render() to resolve _pendingTarget when Store.assets populates
  const oldRender = `  render() {
    const el = document.getElementById('app') || document.getElementById('public-work');
    if (!el) return;

    this.syncSwitcherState();`;

  const newRender = `  render() {
    const el = document.getElementById('app') || document.getElementById('public-work');
    if (!el) return;

    this.syncSwitcherState();

    if (this._pendingTarget && Store.assets.length > 0) {
      const found = Store.assets.find(x => x.id === this._pendingTarget || x.ref === this._pendingTarget) || Store.getAsset(this._pendingTarget) || Store.getAssetByRef(this._pendingTarget);
      if (found) {
        this.selectedAssetId = found.id;
        this._pendingTarget = null;
      }
    }`;

  if (js.includes(oldRender)) {
    js = js.replace(oldRender, newRender);
    console.log('✅ Updated render() in', f);
  }

  fs.writeFileSync(f, js, 'utf8');
}

console.log('State persistence script complete.');
