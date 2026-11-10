const fs = require('fs');

const publicMarketCode = `
// ============================================================
// FULLSCREEN LIGHTBOX COMPONENT
// ============================================================
const Lightbox = {
  active: false,
  images: [], // array of { url, caption }
  index: 0,
  assetRef: '',

  open(images, index, assetRef) {
    if (!images || images.length === 0) return;
    this.images = images;
    this.index = Math.max(0, Math.min(index || 0, images.length - 1));
    this.assetRef = assetRef || '';
    this.active = true;
    this.render();
    document.removeEventListener('keydown', this._onKeyDown);
    document.addEventListener('keydown', this._onKeyDown);
  },

  close() {
    this.active = false;
    document.removeEventListener('keydown', this._onKeyDown);
    const el = document.getElementById('lightbox-modal');
    if (el) el.remove();
  },

  next() {
    if (this.images.length <= 1) return;
    this.index = (this.index + 1) % this.images.length;
    this.update();
  },

  prev() {
    if (this.images.length <= 1) return;
    this.index = (this.index - 1 + this.images.length) % this.images.length;
    this.update();
  },

  _onKeyDown(e) {
    if (e.key === 'Escape') Lightbox.close();
    else if (e.key === 'ArrowRight') Lightbox.next();
    else if (e.key === 'ArrowLeft') Lightbox.prev();
  },

  update() {
    const cur = this.images[this.index];
    const imgEl = document.getElementById('lb-img');
    const capEl = document.getElementById('lb-caption');
    const countEl = document.getElementById('lb-count');
    if (imgEl && cur) {
      imgEl.src = cur.url;
      imgEl.alt = cur.caption || 'Asset photo';
    }
    if (capEl && cur) {
      capEl.textContent = cur.caption || (this.assetRef ? 'Asset ' + this.assetRef : 'Property Photo');
    }
    if (countEl) {
      countEl.textContent = (this.index + 1) + ' / ' + this.images.length;
    }
  },

  render() {
    let el = document.getElementById('lightbox-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lightbox-modal';
      document.body.appendChild(el);
    }
    const cur = this.images[this.index] || {};
    const hasMultiple = this.images.length > 1;

    el.innerHTML = \`
      <div class="lb-backdrop" onclick="if(event.target===this) Lightbox.close()">
        <button class="lb-close" onclick="Lightbox.close()" aria-label="Close full screen">&times;</button>
        \${hasMultiple ? '<button class="lb-prev" onclick="Lightbox.prev()" aria-label="Previous photo">&#8249;</button>' : ''}
        \${hasMultiple ? '<button class="lb-next" onclick="Lightbox.next()" aria-label="Next photo">&#8250;</button>' : ''}
        <div class="lb-stage">
          <img id="lb-img" src="\${cur.url || ''}" alt="\${UI.escapeHtml(cur.caption || 'Asset photo')}" class="lb-photo">
          <div class="lb-bar">
            <span id="lb-caption" class="lb-caption">\${UI.escapeHtml(cur.caption || (this.assetRef ? 'Asset ' + this.assetRef : 'Property Photo'))}</span>
            <span id="lb-count" class="lb-count">\${this.index + 1} / \${this.images.length}</span>
          </div>
        </div>
      </div>
    \`;
  }
};

// ============================================================
// PUBLIC MARKETPLACE (NORMALIZED & LIVE DATA POWERED)
// ============================================================
const PublicMarket = {
  currentPage: 'home',
  selectedAssetId: null,
  viewMode: 'grid',
  activeImageIndex: 0,
  detailImages: [],
  detailImagesLoading: false,

  filterState: {
    q: '',
    cat: 'all',
    region: 'all',
    price: 'any',
    sort: 'default',
    view: 'grid'
  },

  faqQuery: '',
  faqCategory: 'all',

  BANDS: {
    any: ['Any price', 0, Infinity],
    u500: ['Under 500,000', 0, 500000],
    '500m': ['500,000 to 1M', 500000, 1000000],
    '1m5': ['1M to 5M', 1000000, 5000000],
    o5: ['Over 5M', 5000000, Infinity]
  },

  FAQ_DATA: [
    ['Legal & title', 'Where do the listed assets come from?', 'They come directly from partner commercial banks and licensed deposit-taking institutions in Ghana: collateral repossessed after judicial default, High Court writs of execution or settlement recoveries. Surge is the intermediary these institutions authorise to market and sell them.'],
    ['Legal & title', 'How does Surge make sure properties are free from litigation and land guards?', 'Every property passes a five-gate audit: High Court writ of possession, Lands Commission search of the root of title, Collateral Registry search, independent valuation, and a physical occupancy inspection. Assets with family or title disputes go on legal hold and are never listed.'],
    ['Legal & title', 'Which title documents will I receive?', 'You receive a Deed of Assignment or Conveyance executed by the bank (attested by the High Court registrar where required), the Certificate of Purchase or Vesting Deed, and certified site plans so you can register the title at the Lands Commission.'],
    ['Pricing & terms', 'Are prices negotiable, and what is the reserve price?', 'The reserve price is the liquidation threshold set by independent chartered valuers and approved by the bank’s Credit Committee. You can offer at, above or near it with reasons. The committee weighs price, settlement speed and payment method.'],
    ['Pricing & terms', 'Which payment structures are accepted?', 'Three: a direct bank wire or RTGS payment into the bank’s recovery escrow account; a pre-approved mortgage from a registered Ghanaian bank; or a staged settlement, typically 10–20% on acceptance with the balance paid over 30 to 90 days.'],
    ['Pricing & terms', 'Does Surge charge buyers broker or search fees?', 'No. Surge earns a regulated commission, typically 4.0%, already included in the approved transaction. There are no upfront inspection or registration fees, and searching and enquiring are free.'],
    ['Viewing & process', 'Can I inspect a property before making an offer?', 'Yes. Inspections are supervised and booked in advance through Surge, with an asset recovery officer and security escort. Unescorted visits are not allowed.'],
    ['Viewing & process', 'Can I bring my own engineer, valuer or lawyer?', 'We encourage it. You can bring chartered surveyors, structural engineers or legal counsel and carry out measurements and structural checks during the appointment.'],
    ['Viewing & process', 'Why do I need KYC before viewing or offering?', 'Repossessed property is under sensitive court and banking administration. Ghana Card verification and proof of acquisition capacity protect the asset from trespass, preserve borrower privacy and meet Bank of Ghana requirements under Act 1044.'],
    ['Diaspora & foreign', 'Can Ghanaians abroad buy remotely?', 'Yes. Overseas buyers can take a live video walkthrough, verify digitally with a Ghana Card PIN or passport, and appoint a local representative or lawyer under our power-of-attorney process.'],
    ['Diaspora & foreign', 'Can foreign nationals or companies buy land?', 'Under Article 266 of the 1992 Constitution and the Land Act, 2020 (Act 1036), non-citizens and foreign companies can hold land on renewable leasehold of up to 50 years. Surge checks the unexpired term on every listing before publishing.'],
    ['Diaspora & foreign', 'How do I send funds from abroad?', 'Send settlement funds only by SWIFT or RTGS wire into the bank’s designated recovery escrow account in Ghana. Surge never accepts cash through informal transmitters or personal mobile money.']
  ],

  init() {
    this.syncSwitcherState();
    this.render();
  },

  syncSwitcherState() {
    const swSignout = document.getElementById('sw-signout-btn');
    if (swSignout) {
      const isAuth = typeof Auth !== 'undefined' && Auth.currentUser;
      swSignout.style.display = isAuth ? 'inline-flex' : 'none';
    }
  },

  setActiveNav(page) {
    document.querySelectorAll('#pub-nav a').forEach(a => {
      a.classList.toggle('on', a.dataset.page === page);
    });
  },

  go(p) {
    this.currentPage = p;
    this.selectedAssetId = null;
    this.setActiveNav(p);
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goHome() { this.go('home'); },
  goHow() { this.go('how'); },
  goKyc() { this.go('kyc'); },
  goFaq() { this.go('faq'); },
  goContact() { this.go('contact'); },

  toast(m) {
    if (typeof UI !== 'undefined' && UI.toast) {
      UI.toast(m, 'info');
      return;
    }
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = m;
    el.classList.add('show');
    clearTimeout(this._tTimer);
    this._tTimer = setTimeout(() => el.classList.remove('show'), 2400);
  },

  // Helper icons
  icons: {
    tick: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>',
    pin: '<svg class="i" viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    ph: '<svg class="ph" viewBox="0 0 24 24"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    fs: '<svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'
  },

  fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return 'Price on application';
    return 'GH₵ ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Live Assets Accessor
  getAssets() {
    const pub = Store.getPublicAssets();
    if (pub && pub.length > 0) return pub;
    // Fallback: return any live assets in Store.assets
    return (Store.assets || []).filter(a => a.status === 'Live' || a.publicationStatus === 'Published');
  },

  filteredAssets() {
    const S = this.filterState;
    const b = this.BANDS[S.price] || this.BANDS.any;
    const q = (S.q || '').trim().toLowerCase();
    const all = this.getAssets();

    const list = all.filter(a => {
      const cat = a.category || a.category_code || 'Property';
      if (S.cat !== 'all' && cat.toLowerCase() !== S.cat.toLowerCase()) return false;

      const reg = a.region || '';
      if (S.region !== 'all' && reg.toLowerCase() !== S.region.toLowerCase()) return false;

      const price = a.showReserve ? Number(a.reserve) : null;
      if (S.price !== 'any') {
        if (price === null || isNaN(price)) return false;
        if (price < b[1] || price >= b[2]) return false;
      }

      if (q) {
        const text = [
          a.ref || '',
          a.assetType || a.title || '',
          a.publicLocation || '',
          a.region || '',
          cat,
          a.description || ''
        ].join(' ').toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    if (S.sort === 'low') {
      list.sort((x, y) => {
        const px = x.showReserve ? Number(x.reserve) : Infinity;
        const py = y.showReserve ? Number(y.reserve) : Infinity;
        return px - py;
      });
    } else if (S.sort === 'high') {
      list.sort((x, y) => {
        const px = x.showReserve ? Number(x.reserve) : -Infinity;
        const py = y.showReserve ? Number(y.reserve) : -Infinity;
        return py - px;
      });
    }

    return list;
  },

  renderChips() {
    const all = this.getAssets();
    const catMap = {};
    all.forEach(a => {
      const c = a.category || a.category_code || 'Property';
      catMap[c] = (catMap[c] || 0) + 1;
    });
    const cats = Object.keys(catMap);
    const S = this.filterState;

    const chipBtn = (val, label, count) => \`
      <button class="chip \${S.cat === val ? 'on' : ''}" type="button" onclick="PublicMarket.setCategory('\${UI.escapeHtml(val)}')">
        \${UI.escapeHtml(label)}<b>\${count}</b>
      </button>
    \`;

    return chipBtn('all', 'All assets', all.length) +
      cats.map(c => chipBtn(c, c, catMap[c])).join('');
  },

  setCategory(cat) {
    this.filterState.cat = cat;
    this.refreshListings();
  },

  setRegion(reg) {
    this.filterState.region = reg;
    this.refreshListings();
  },

  setPrice(priceKey) {
    this.filterState.price = priceKey;
    this.refreshListings();
  },

  setSort(sortKey) {
    this.filterState.sort = sortKey;
    this.refreshListings();
  },

  setView(view) {
    this.viewMode = view;
    this.filterState.view = view;
    this.refreshListings();
  },

  setSearchQuery(q) {
    this.filterState.q = q;
    this.refreshListings();
  },

  refreshListings() {
    const chipsEl = document.getElementById('chips');
    const resultsEl = document.getElementById('results');
    if (chipsEl) chipsEl.innerHTML = this.renderChips();
    if (resultsEl) resultsEl.innerHTML = this.renderResults();
  },

  renderCard(a) {
    const isPoa = !a.showReserve || a.reserve === null || isNaN(a.reserve);
    const priceFormatted = isPoa ? 'Price on application' : this.fmtMoney(a.reserve);
    const cat = a.category || a.category_code || 'Property';
    const title = a.assetType || a.title || 'Bank Repossessed Asset';
    const loc = a.publicLocation || [a.town, a.region].filter(Boolean).join(', ') || 'Greater Accra';

    const facts = [
      a.beds ? a.beds + ' bed' : '',
      a.baths ? a.baths + ' bath' : '',
      a.occupancyStatus || '',
      a.landGuardRisk ? 'Risk: ' + a.landGuardRisk : ''
    ].filter(Boolean);

    const hasImg = !!a.primaryImage;
    const imgHtml = hasImg
      ? \`<img src="\${UI.escapeHtml(a.primaryImage)}" alt="\${UI.escapeHtml(title)}" loading="lazy">\`
      : this.icons.ph;

    return \`
      <article class="card" tabindex="0" role="link" onclick="PublicMarket.openDetail('\${a.id}')" onkeydown="if(event.key==='Enter')PublicMarket.openDetail('\${a.id}')">
        <div class="img" onclick="PublicMarket.openCardPhoto(event, '\${a.id}')" title="Click photo to view Full Screen">
          \${imgHtml}
          <span class="ref">\${UI.escapeHtml(a.ref || 'SRG-' + a.id)}</span>
          <button class="img-fullscreen-btn" type="button" aria-label="View Full Screen" onclick="PublicMarket.openCardPhoto(event, '\${a.id}')">
            \${this.icons.fs}
            <span>Full Screen</span>
          </button>
        </div>
        <div class="body">
          <div class="cat">\${UI.escapeHtml(cat)}</div>
          <h3>\${UI.escapeHtml(title)}</h3>
          <p class="loc">\${this.icons.pin}\${UI.escapeHtml(loc)}</p>
          \${facts.length ? \`<div class="facts">\${facts.map(f => \`<span>\${UI.escapeHtml(f)}</span>\`).join('')}</div>\` : ''}
          <div class="price \${isPoa ? 'poa' : ''}">\${priceFormatted}</div>
        </div>
      </article>
    \`;
  },

  renderResults() {
    const list = this.filteredAssets();
    const S = this.filterState;
    const sel = (v, t) => \`<option value="\${v}" \${S.sort === v ? 'selected' : ''}>\${t}</option>\`;
    const empty = \`
      <div class="empty">
        <h3>No assets match these filters</h3>
        <p>Clear the filters or search term to see every live asset listing.</p>
        <button class="btn p" type="button" onclick="PublicMarket.clearFilters()">Clear filters</button>
      </div>
    \`;

    return \`
      <div class="head">
        <h2>\${list.length} \${list.length === 1 ? 'asset' : 'assets'} available</h2>
        <select aria-label="Sort" onchange="PublicMarket.setSort(this.value)">
          \${sel('default', 'Sort: Featured')}
          \${sel('low', 'Price: low to high')}
          \${sel('high', 'Price: high to low')}
        </select>
        <div class="view">
          <button class="\${this.viewMode === 'grid' ? 'on' : ''}" type="button" onclick="PublicMarket.setView('grid')">Grid</button>
          <button class="\${this.viewMode === 'list' ? 'on' : ''}" type="button" onclick="PublicMarket.setView('list')">List</button>
        </div>
      </div>
      <div class="grid \${this.viewMode === 'list' ? 'list' : ''}">
        \${list.length ? list.map(a => this.renderCard(a)).join('') : empty}
      </div>
    \`;
  },

  clearFilters() {
    this.filterState = { q: '', cat: 'all', region: 'all', price: 'any', sort: 'default', view: this.viewMode };
    this.goHome();
  },

  // Fullscreen Photo Handlers
  async openCardPhoto(e, assetId) {
    if (e && e.stopPropagation) e.stopPropagation();
    const a = Store.getAsset(assetId);
    if (!a) return;

    let imgs = [];
    if (a.primaryImage) {
      imgs.push({ url: a.primaryImage, caption: (a.assetType || a.title || 'Asset') + ' · ' + (a.ref || '') });
    }

    try {
      const resp = await fetch((Store.API_BASE || '') + '/api/marketplace/assets/' + encodeURIComponent(a.ref || a.id), { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data && Array.isArray(json.data.images) && json.data.images.length > 0) {
          imgs = json.data.images.map(img => ({
            url: img.url,
            caption: (img.caption ? img.caption.toUpperCase() + ' · ' : '') + (a.assetType || a.title || '') + ' (' + (a.ref || '') + ')'
          }));
        }
      }
    } catch (err) {}

    if (imgs.length > 0) {
      Lightbox.open(imgs, 0, a.ref);
    } else {
      this.openDetail(assetId);
    }
  },

  openGalleryPhoto(index) {
    if (this.detailImages && this.detailImages.length > 0) {
      const a = Store.getAsset(this.selectedAssetId);
      Lightbox.open(this.detailImages, index || 0, a ? a.ref : '');
    }
  },

  // Detail View
  async openDetail(id) {
    this.selectedAssetId = id;
    this.currentPage = 'home';
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.detailImagesLoading = true;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const a = Store.getAsset(id);
      const ref = a ? (a.ref || id) : id;
      const resp = await fetch((Store.API_BASE || '') + '/api/marketplace/assets/' + encodeURIComponent(ref), { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data && Array.isArray(json.data.images) && json.data.images.length > 0) {
          this.detailImages = json.data.images.map(img => ({
            id: img.id,
            url: img.url,
            caption: img.caption || (a.assetType || 'Property photo'),
            isPrimary: !!img.is_primary,
            isExterior: !!img.is_exterior
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load asset gallery:', e);
    }

    // Fallback to primaryImage if no gallery returned
    if (this.detailImages.length === 0) {
      const a = Store.getAsset(id);
      if (a && a.primaryImage) {
        this.detailImages = [{ id: 'primary', url: a.primaryImage, caption: a.assetType || 'Primary photo' }];
      }
    }

    this.detailImagesLoading = false;
    this.render();
  },

  closeDetail() {
    this.selectedAssetId = null;
    this.detailImages = [];
    this.activeImageIndex = 0;
    this.render();
  },

  selectImage(idx) {
    this.activeImageIndex = idx;
    const mainImg = document.getElementById('detail-main-img');
    if (mainImg && this.detailImages[idx]) {
      mainImg.src = this.detailImages[idx].url;
      mainImg.alt = this.detailImages[idx].caption || 'Property photo';
    }
    document.querySelectorAll('.thumbs div').forEach((el, i) => {
      el.classList.toggle('on', i === idx);
    });
  },

  renderDetail() {
    const a = Store.getAsset(this.selectedAssetId);
    if (!a) return this.renderHome();

    const isPoa = !a.showReserve || a.reserve === null || isNaN(a.reserve);
    const priceFormatted = isPoa ? 'Price on application' : this.fmtMoney(a.reserve);
    const cat = a.category || a.category_code || 'Property';
    const title = a.assetType || a.title || 'Bank Repossessed Asset';
    const loc = a.publicLocation || [a.town, a.region].filter(Boolean).join(', ') || 'Greater Accra';

    let galHtml = '';
    if (this.detailImagesLoading) {
      galHtml = \`
        <div class="gal">
          <div class="img" style="display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8A9AA9">
            \${this.icons.ph}
            <div style="margin-top:10px;font-size:13px">Loading verified photos…</div>
          </div>
        </div>
      \`;
    } else if (this.detailImages.length > 0) {
      const activeImg = this.detailImages[this.activeImageIndex] || this.detailImages[0];
      galHtml = \`
        <div class="gal">
          <div class="img" onclick="PublicMarket.openGalleryPhoto(PublicMarket.activeImageIndex)" title="Click photo to view Full Screen">
            <img id="detail-main-img" src="\${UI.escapeHtml(activeImg.url)}" alt="\${UI.escapeHtml(activeImg.caption || title)}">
            <button class="gal-fs-btn" type="button" onclick="event.stopPropagation();PublicMarket.openGalleryPhoto(PublicMarket.activeImageIndex)">
              \${this.icons.fs}
              <span>Full Screen</span>
            </button>
          </div>
          \${this.detailImages.length > 1 ? \`
            <div class="thumbs">
              \${this.detailImages.map((img, i) => \`
                <div class="\${i === this.activeImageIndex ? 'on' : ''}" onclick="PublicMarket.selectImage(\${i})" title="\${UI.escapeHtml(img.caption || 'Photo ' + (i + 1))}">
                  <img src="\${UI.escapeHtml(img.url)}" alt="">
                </div>
              \`).join('')}
            </div>
          \` : ''}
        </div>
      \`;
    } else {
      galHtml = \`
        <div class="gal">
          <div class="img">
            \${this.icons.ph}
          </div>
        </div>
      \`;
    }

    return \`
      <div class="page">
        <div class="back">
          <button class="btn" type="button" onclick="PublicMarket.closeDetail()">← Back</button>
          <h1>\${UI.escapeHtml(title)}</h1>
          <span class="live">Live</span>
        </div>
        <div class="dgrid">
          \${galHtml}
          <div class="side">
            <div class="box">
              <div class="k">\${UI.escapeHtml(cat)} · \${UI.escapeHtml(title)}</div>
              <div class="big">\${priceFormatted}</div>
              <p>\${UI.escapeHtml(a.description || 'Verified bank-repossessed asset. Complete legal, title, and valuation clearance confirmed.')}</p>
              <table>
                <tr><th>Reference</th><td>\${UI.escapeHtml(a.ref || 'SRG-' + a.id)}</td></tr>
                <tr><th>Location</th><td>\${UI.escapeHtml(loc)}</td></tr>
                <tr><th>Region</th><td>\${UI.escapeHtml(a.region || 'Greater Accra')}</td></tr>
                \${a.district ? \`<tr><th>District</th><td>\${UI.escapeHtml(a.district)}</td></tr>\` : ''}
                \${a.occupancyStatus ? \`<tr><th>Occupancy</th><td>\${UI.escapeHtml(a.occupancyStatus)}</td></tr>\` : ''}
                \${a.beds ? \`<tr><th>Bedrooms</th><td>\${a.beds}</td></tr>\` : ''}
                \${a.baths ? \`<tr><th>Bathrooms</th><td>\${a.baths}</td></tr>\` : ''}
                \${a.landGuardRisk ? \`<tr><th>Land Guard Risk</th><td>\${UI.escapeHtml(a.landGuardRisk)}</td></tr>\` : ''}
                <tr><th>Title Status</th><td><span style="color:#1E7B34;font-weight:600">Verified Clear Title</span></td></tr>
              </table>
            </div>
            <div class="box col">
              <button class="btn p" type="button" onclick="PublicMarket.enquiry('\${a.id}')">Submit enquiry</button>
              <button class="btn" type="button" onclick="PublicMarket.requestViewing('\${a.id}')">Request viewing</button>
              <button class="btn" type="button" onclick="PublicMarket.submitOffer('\${a.id}')">Submit formal offer</button>
            </div>
          </div>
        </div>
      </div>
      \${this.renderFooter()}
    \`;
  },

  // Inquiries / Viewing / Formal Offer Modals
  enquiry(id) {
    const a = Store.getAsset(id) || {};
    UI.modal('Submit Asset Enquiry', \`
      <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">Enquiry on <b>\${UI.escapeHtml(a.ref || '')}</b> (\${UI.escapeHtml(a.assetType || a.title || 'Asset')}). A Surge recovery specialist will reply within 4 hours.</p>
      <div class="field"><span class="lbl">Full Name <span class="req">*</span></span><div class="ctl"><input id="enq-name" style="width:100%" placeholder="Your legal name"></div></div>
      <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="enq-phone" style="width:100%" placeholder="+233 24 000 0000"></div></div>
      <div class="field"><span class="lbl">Email Address <span class="req">*</span></span><div class="ctl"><input id="enq-email" style="width:100%" placeholder="you@domain.com"></div></div>
      <div class="field"><span class="lbl">Message</span><div class="ctl"><textarea id="enq-msg" style="width:100%;min-height:90px" placeholder="Specify your budget range, questions about title, or request for site survey"></textarea></div></div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.submitEnquiry('\${id}')">Submit Enquiry</button>\`);
  },

  submitEnquiry(id) {
    const name = document.getElementById('enq-name')?.value?.trim();
    const phone = document.getElementById('enq-phone')?.value?.trim();
    const email = document.getElementById('enq-email')?.value?.trim();
    const msg = document.getElementById('enq-msg')?.value?.trim();
    if (!name || !phone) return UI.toast('Full name and phone are required', 'error');

    const a = Store.getAsset(id) || {};
    const ref = 'ENQ-2026-' + Math.floor(100000 + Math.random() * 900000);
    Store.leads.unshift({
      id: 'l' + Date.now(),
      ref,
      assetId: id,
      assetRef: a.ref || id,
      name,
      phone,
      email,
      status: 'New',
      source: 'Marketplace Enquiry',
      notes: msg,
      createdAt: new Date().toISOString()
    });
    Store.addAudit('Public Buyer', 'ENQUIRY', 'Lead', ref, null, 'New', 'Enquiry from ' + name + ' on ' + (a.ref || id));
    Store.persist();
    UI.closeModal();
    PublicMarket.toast('Enquiry sent. Reference: ' + ref);
  },

  requestViewing(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    UI.modal('Schedule Supervised Site Viewing', \`
      <p style="font-size:12.5px;color:var(--text-2);margin-bottom:12px">Viewing appointment request on <b>\${UI.escapeHtml(a.ref)}</b> (\${UI.escapeHtml(a.assetType || a.title)} at \${UI.escapeHtml(a.publicLocation)}). Surge security and recovery officers will accompany you.</p>
      <div class="field"><span class="lbl">Full Name <span class="req">*</span></span><div class="ctl"><input id="vw-name" style="width:100%" placeholder="Your legal name"></div></div>
      <div class="row2">
        <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="vw-phone" style="width:100%" placeholder="+233 ..."></div></div>
        <div class="field"><span class="lbl">Email Address</span><div class="ctl"><input id="vw-email" style="width:100%" placeholder="buyer@example.com"></div></div>
      </div>
      <div class="row2">
        <div class="field"><span class="lbl">Preferred Date <span class="req">*</span></span><div class="ctl"><input type="date" id="vw-date" value="\${tomorrow}" style="width:100%"></div></div>
        <div class="field"><span class="lbl">Time Slot <span class="req">*</span></span><div class="ctl">
          <select id="vw-time" style="width:100%">
            <option>Morning (09:00 - 12:00 GMT)</option>
            <option>Afternoon (13:00 - 16:00 GMT)</option>
            <option>Late Afternoon (16:00 - 17:30 GMT)</option>
          </select>
        </div></div>
      </div>
      <div class="field"><span class="lbl">Ghana Card PIN (Optional)</span><div class="ctl"><input id="vw-id" placeholder="GHA-XXXXXXXXX-X" style="width:100%"></div></div>
      <div class="field"><span class="lbl">Notes / Survey Requirements</span><div class="ctl"><textarea id="vw-notes" style="width:100%;min-height:75px" placeholder="Accompanying surveyor details or access requirements"></textarea></div></div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.submitViewing('\${id}')">Confirm Viewing Request</button>\`);
  },

  submitViewing(id) {
    const name = document.getElementById('vw-name')?.value?.trim();
    const phone = document.getElementById('vw-phone')?.value?.trim();
    const date = document.getElementById('vw-date')?.value;
    const time = document.getElementById('vw-time')?.value;
    if (!name || !phone || !date) return UI.toast('Full name, phone, and date are required', 'error');

    const a = Store.getAsset(id) || {};
    const ref = 'VW-2026-' + Math.floor(100000 + Math.random() * 900000);
    Store.viewings.unshift({
      id: 'v' + Date.now(),
      ref,
      assetId: id,
      assetRef: a.ref || id,
      buyer: name,
      phone,
      email: document.getElementById('vw-email')?.value?.trim() || '',
      idNumber: document.getElementById('vw-id')?.value?.trim() || '',
      scheduledAt: date + ' ' + time,
      status: 'Requested',
      notes: document.getElementById('vw-notes')?.value?.trim() || '',
      agent: null
    });
    Store.addAudit(name, 'VIEWING_REQUEST', 'Viewing', ref, null, 'Requested', 'Viewing requested for ' + (a.ref || id) + ' on ' + date + ' (' + time + ')');
    Store.persist();
    UI.closeModal();
    PublicMarket.toast('Viewing scheduled. Reference: ' + ref);
  },

  submitOffer(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const minOffer = a.minimum_offer || a.reserve || 0;
    UI.modal('Submit Formal Purchase Offer', \`
      <p style="font-size:12.5px;color:var(--text-2);margin-bottom:12px">Formal purchase offer on <b>\${UI.escapeHtml(a.ref)}</b> (\${UI.escapeHtml(a.assetType || a.title)}). All offers are timestamped and submitted directly to the recovery bank committee.</p>
      <div class="field"><span class="lbl">Buyer Full Legal Name <span class="req">*</span></span><div class="ctl"><input id="of-name" style="width:100%" placeholder="Legal purchaser or corporate name"></div></div>
      <div class="row2">
        <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="of-phone" style="width:100%" placeholder="+233 ..."></div></div>
        <div class="field"><span class="lbl">Email Address <span class="req">*</span></span><div class="ctl"><input id="of-email" style="width:100%" placeholder="buyer@example.com"></div></div>
      </div>
      <div class="row2">
        <div class="field"><span class="lbl">Offer Amount (GH₵) <span class="req">*</span></span><div class="ctl"><input type="number" id="of-amount" value="\${minOffer}" style="width:100%"></div></div>
        <div class="field"><span class="lbl">Payment Method <span class="req">*</span></span><div class="ctl">
          <select id="of-payment" style="width:100%">
            <option>Cash / Direct Bank Transfer (Escrow)</option>
            <option>Bank Mortgage / Pre-Approved Facility</option>
            <option>Staged Structured Settlement (30/60/90 Days)</option>
          </select>
        </div></div>
      </div>
      <div class="row2">
        <div class="field"><span class="lbl">Ghana Card PIN <span class="req">*</span></span><div class="ctl"><input id="of-ghana-card" placeholder="GHA-XXXXXXXXX-X" style="width:100%"></div></div>
        <div class="field"><span class="lbl">Offer Validity</span><div class="ctl">
          <select id="of-validity" style="width:100%">
            <option value="14">14 Business Days</option>
            <option value="30" selected>30 Calendar Days</option>
            <option value="60">60 Calendar Days</option>
          </select>
        </div></div>
      </div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.confirmOffer('\${id}')">Submit Binding Offer</button>\`);
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
    const a = Store.getAsset(id) || {};
    const ref = 'OF-2026-' + Math.floor(100000 + Math.random() * 900000);
    const expiry = new Date(Date.now() + validityDays * 86400000).toISOString();

    Store.offers.unshift({
      id: 'o' + Date.now(),
      ref,
      assetId: id,
      assetRef: a.ref || id,
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
    Store.addAudit(name, 'OFFER_SUBMISSION', 'Offer', ref, null, 'Under Review', 'Formal offer of GH₵ ' + amount.toLocaleString() + ' submitted on ' + (a.ref || id));
    Store.persist();
    UI.closeModal();
    PublicMarket.toast('Formal offer submitted. Reference: ' + ref);
  },

  // Main Pages
  renderHome() {
    const all = this.getAssets();
    const regions = [...new Set(all.map(a => a.region).filter(Boolean))].sort();
    const S = this.filterState;

    return \`
      <section class="hero">
        <h1>Bank-repossessed property in Ghana, checked before it is listed</h1>
        <p>Every asset here has passed Surge Solutions' legal, title and valuation review. Browse, request a viewing and make an offer through us.</p>
        <ul class="trust">
          <li>\${this.icons.tick}Five-gate review before publishing</li>
          <li>\${this.icons.tick}Buyers verified through KYC</li>
          <li>\${this.icons.tick}Offers handled by Surge Solutions</li>
        </ul>
      </section>

      <div class="main">
        <div class="search" role="search">
          <label class="fld">
            <span>Search</span>
            <input type="search" value="\${UI.escapeHtml(S.q)}" placeholder="Reference, town or property type" oninput="PublicMarket.setSearchQuery(this.value)">
          </label>
          <label class="fld">
            <span>Region</span>
            <select onchange="PublicMarket.setRegion(this.value)">
              <option value="all">All regions</option>
              \${regions.map(r => \`<option value="\${UI.escapeHtml(r)}" \${S.region === r ? 'selected' : ''}>\${UI.escapeHtml(r)}</option>\`).join('')}
            </select>
          </label>
          <label class="fld">
            <span>Price (GH₵)</span>
            <select onchange="PublicMarket.setPrice(this.value)">
              \${Object.entries(this.BANDS).map(([k, v]) => \`<option value="\${k}" \${S.price === k ? 'selected' : ''}>\${v[0]}</option>\`).join('')}
            </select>
          </label>
        </div>

        <div class="chips" id="chips">\${this.renderChips()}</div>
        <div id="results">\${this.renderResults()}</div>
      </div>
      \${this.renderFooter()}
    \`;
  },

  renderHow() {
    const st = [
      ['Bank handover and five-gate legal review', 'Assets come directly from partner banks after loan default recovery. Before anything is published, Surge confirms the High Court writ of possession, runs a Lands Commission title search and a Collateral Registry search, obtains an independent chartered valuation, and inspects the property for occupancy.', 'Assets with active disputes go on legal hold and are never listed.'],
      ['Browse listings and enquire for free', 'Search verified listings across Greater Accra, Ashanti, Western and Central. Each profile shows specifications, the general location, photos and the reserve price. You can send enquiries without registering.', 'Exact coordinates and borrower details stay restricted until KYC is complete.'],
      ['Meet your recovery officer and verify your identity', 'A Surge asset recovery officer contacts you within 24 hours. Under the Anti-Money Laundering Act, 2020 (Act 1044), you verify your identity with your Ghana Card PIN and declare your source of funds before viewing or offering.', 'Compliance approval is typically under 24 hours, and your records stay confidential.'],
      ['Supervised inspection and formal offer', 'An officer and security escort take you on a physical viewing. You are welcome to bring a chartered surveyor or structural engineer. When you are satisfied, submit an offer with your price and payment structure: direct wire, mortgage facility or staged settlement.', 'Offers are logged, timestamped and sent to the bank’s Credit and Recovery Committee.'],
      ['Bank committee decision and legal conveyance', 'When the committee approves, Surge issues the disposition agreement and settlement invoice. You pay into the bank’s recovery escrow account, and Surge’s legal team coordinates the Deed of Assignment and Certificate of Purchase for title registration.', 'Every step is audited and Surge handles no cash.']
    ];
    const ft = [
      ['Clear title', 'Every listing is backed by court judgments, Lands Commission searches and Collateral Registry certification.'],
      ['No broker markups', 'A fixed statutory commission of 4.0% rules out agent markups and surprise fees.'],
      ['Escrow settlement', 'You pay into authorised bank recovery escrow accounts, never mobile money or personal accounts.'],
      ['Built for the diaspora', 'Remote video walkthroughs, digital Ghana Card checks and power-of-attorney coordination for overseas buyers.']
    ];
    const cmp = [
      ['Title and verification', 'Court execution and five-gate Lands Commission audit', 'Unverified indentures and a high risk of multi-party litigation'],
      ['Pricing', 'Independent chartered valuation with a published reserve price', 'Broker markups, often 10–25% above actual value'],
      ['Dispute protection', 'Enforceable High Court writ of possession and police clearance', 'Exposure to land guards and customary stool injunctions'],
      ['Payment', 'Designated bank escrow account with a formal invoice', 'Cash requests or unregulated third-party accounts'],
      ['Conveyance', '14–30 business days with a structured legal handover', 'Open-ended delays and incomplete registration']
    ];

    return \`
      <section class="phero">
        <h1>How buying a bank-held asset works</h1>
        <p>Surge Solutions is the licensed disposition intermediary for commercial banks in Ghana. Five stages take you from browsing to a registered title.</p>
      </section>
      <div class="strip">
        <div class="in">
          <div><b>5 gates</b><span>Legal title clearance</span></div>
          <div><b>4.0%</b><span>Fixed statutory fee</span></div>
          <div><b>14–30 days</b><span>Bank conveyance target</span></div>
          <div><b>100%</b><span>Bank escrow protected</span></div>
        </div>
      </div>
      <div class="sec">
        <h2>The five stages</h2>
        <p class="sub">Each stage has a safeguard built in, so you know what is protected before you move on.</p>
        <ol class="steps">
          \${st.map((x, i) => \`
            <li class="step">
              <div class="n">\${i + 1}</div>
              <div>
                <h3>\${x[0]}</h3>
                <p>\${x[1]}</p>
                <div class="safe"><b>Safeguard:</b> \${x[2]}</div>
              </div>
            </li>
          \`).join('')}
        </ol>
      </div>
      <div class="sec">
        <h2>What you get</h2>
        <p class="sub">&nbsp;</p>
        <div class="feat" style="margin-top:-14px">
          \${ft.map(x => \`<div><h3>\${x[0]}</h3><p>\${x[1]}</p></div>\`).join('')}
        </div>
      </div>
      <div class="sec">
        <h2>Surge compared with the informal market</h2>
        <p class="sub">How a regulated disposition differs from buying through a broker.</p>
        <div class="tw">
          <table>
            <thead><tr><th>Parameter</th><th>Surge Solutions</th><th>Informal market</th></tr></thead>
            <tbody>
              \${cmp.map(r => \`<tr><td>\${r[0]}</td><td>\${r[1]}</td><td>\${r[2]}</td></tr>\`).join('')}
            </tbody>
          </table>
        </div>
        <div class="acts">
          <button class="btn p" type="button" onclick="PublicMarket.goHome()">Browse live assets</button>
          <button class="btn" type="button" onclick="PublicMarket.goKyc()">Start KYC verification</button>
          <button class="btn" type="button" onclick="PublicMarket.goContact()">Speak with an asset officer</button>
        </div>
      </div>
      <div style="height:32px"></div>
      \${this.renderFooter()}
    \`;
  },

  renderKyc() {
    const list = [
      ['Ghana Card PIN', 'Issued by the National Identification Authority'],
      ['Proof of acquisition capacity', 'Bank reference letter, facility pre-approval or funds statement'],
      ['GhanaPost digital address', 'Your residential or business location'],
      ['Corporate registration, if applicable', 'RGD Form 3 and a board resolution authorising the purchase']
    ];
    const opt = a => a.map(x => \`<option>\${x}</option>\`).join('');

    return \`
      <section class="phero">
        <h1>Buyer KYC and identity verification</h1>
        <p>Under the Anti-Money Laundering Act, 2020 (Act 1044), buyers complete due diligence before booking a supervised viewing or submitting an offer.</p>
      </section>
      <div class="strip three">
        <div class="in">
          <div><b>Act 1044</b><span>Statutory compliance</span></div>
          <div><b>Under 24 hours</b><span>Typical turnaround</span></div>
          <div><b>Confidential</b><span>Protected buyer data</span></div>
        </div>
      </div>
      <div class="sec">
        <div class="two">
          <div class="card2" id="kycBox">
            <h3>Submit your KYC application</h3>
            <p>Only authorised Surge compliance officers review your details.</p>
            <div class="f" id="k-name">
              <label for="kn">Full legal name *</label>
              <input id="kn" placeholder="As shown on your Ghana Card">
              <small>Individual or registered company name</small>
            </div>
            <div class="row2">
              <div class="f" id="k-card">
                <label for="kc">Ghana Card PIN *</label>
                <input id="kc" placeholder="GHA-123456789-0">
              </div>
              <div class="f" id="k-phone">
                <label for="kp">Phone number *</label>
                <input id="kp" placeholder="+233 24 000 0000">
              </div>
            </div>
            <div class="f" id="k-email">
              <label for="ke">Email address *</label>
              <input id="ke" type="email" placeholder="you@domain.com">
            </div>
            <div class="row2">
              <div class="f">
                <label for="kb">Buyer category</label>
                <select id="kb">\${opt(['Individual Ghanaian resident', 'Registered company or enterprise', 'Diaspora Ghanaian investor', 'Foreign national or international investor'])}</select>
              </div>
              <div class="f">
                <label for="ks">Source of funds</label>
                <select id="ks">\${opt(['Personal savings and earnings', 'Business revenue or retained earnings', 'Bank mortgage or pre-approved facility', 'Diaspora remittances', 'Proceeds from a previous asset sale'])}</select>
              </div>
            </div>
            <div class="f">
              <label for="kr">Target asset reference (optional)</label>
              <input id="kr" placeholder="e.g. SS-RE-2026-00248">
              <small>Leave blank for general buyer pre-approval</small>
            </div>
            <label class="chk">
              <input type="checkbox" id="kx">
              <span>I confirm these details are accurate and consent to verification with the National Identification Authority and partner bank compliance systems under Act 1044.</span>
            </label>
            <button class="btn p" type="button" onclick="PublicMarket.kycSubmit()">Submit for verification</button>
          </div>

          <div class="aside">
            <div class="card2">
              <h3>Why KYC is required</h3>
              <p>Repossessed assets are under court custody and bank administration. Verifying buyers prevents trespass, protects borrower privacy and blocks fraudulent bids.</p>
              <div class="note"><b>Browsing is always free.</b> You only need KYC to book a viewing or make an offer.</div>
            </div>
            <div class="card2">
              <h3>What to have ready</h3>
              <ul class="ck">
                \${list.map(x => \`<li>\${this.icons.tick}<span><b>\${x[0]}</b><small>\${x[1]}</small></span></li>\`).join('')}
              </ul>
            </div>
            <div class="card2">
              <h3>How we handle your data</h3>
              <div class="kv"><span>Purpose</span><span>Bank recovery due diligence only</span></div>
              <div class="kv"><span>Reviewed by</span><span>Surge compliance officers</span></div>
              <div class="kv"><span>Sharing</span><span>Never given to brokers or marketers</span></div>
            </div>
            <p style="font-size:12.5px;color:var(--text-2);margin:0">Under Act 1044, Surge must report suspicious transaction structures to the Financial Intelligence Centre.</p>
          </div>
        </div>
      </div>
      <div style="height:32px"></div>
      \${this.renderFooter()}
    \`;
  },

  kycSubmit() {
    const v = id => document.getElementById(id)?.value?.trim() || '';
    const name = v('kn'), card = v('kc'), phone = v('kp'), email = v('ke');
    if (!name || !card || !phone || !email) {
      return this.toast('Complete the highlighted required fields.');
    }
    if (!document.getElementById('kx')?.checked) {
      return this.toast('Tick the consent box to continue.');
    }

    const ref = 'KYC-2026-' + Math.floor(100000 + Math.random() * 900000);
    Store.addAudit(name, 'KYC_SUBMISSION', 'Compliance', ref, null, 'Pending', 'Buyer KYC application submitted by ' + name);
    Store.persist();

    const box = document.getElementById('kycBox');
    if (box) {
      box.innerHTML = \`
        <div class="okbox">
          <div class="tk">\${this.icons.tick}</div>
          <h3 style="margin:0 0 6px;font:700 20px var(--serif)">Application received</h3>
          <p style="color:var(--text-2);margin:0">Our compliance desk will confirm by SMS and email within 24 hours. Quote this reference when booking a viewing.</p>
          <code>Reference: \${ref}</code><br>
          <button class="btn p" type="button" onclick="PublicMarket.goHome()">Browse assets</button>
        </div>
      \`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  renderFaq() {
    return \`
      <section class="phero">
        <h1>Frequently asked questions</h1>
        <p>Answers on title, pricing, viewings and buying from abroad.</p>
      </section>
      <div class="sec">
        <div class="fq">
          <input type="search" aria-label="Filter questions" placeholder="Filter questions by keyword" value="\${UI.escapeHtml(this.faqQuery)}" oninput="PublicMarket.faqSearch(this.value)">
        </div>
        <div class="chips" id="fc" style="margin:0 0 18px">\${this.renderFaqChips()}</div>
        <div id="fl">\${this.renderFaqList()}</div>
        <div class="help">
          <div>
            <h3>Asking about a specific asset?</h3>
            <p>Our asset recovery officers can advise on title reports, site surveys and how to structure an offer.</p>
          </div>
          <button class="btn p" type="button" onclick="PublicMarket.goContact()">Send an enquiry</button>
          <button class="btn" type="button" onclick="PublicMarket.goHome()">Browse listings</button>
        </div>
      </div>
      <div style="height:32px"></div>
      \${this.renderFooter()}
    \`;
  },

  renderFaqChips() {
    const cats = [...new Set(this.FAQ_DATA.map(f => f[0]))];
    const c = (v, l) => \`<button class="chip \${this.faqCategory === v ? 'on' : ''}" type="button" onclick="PublicMarket.faqSetCategory('\${UI.escapeHtml(v)}')">\${l}</button>\`;
    return c('all', 'All questions') + cats.map(v => c(v, v)).join('');
  },

  renderFaqList() {
    const q = this.faqQuery.toLowerCase();
    const cat = this.faqCategory;
    const filtered = this.FAQ_DATA.filter(f => {
      if (cat !== 'all' && f[0] !== cat) return false;
      if (q && !(f[1].toLowerCase().includes(q) || f[2].toLowerCase().includes(q))) return false;
      return true;
    });

    if (filtered.length === 0) {
      return '<div class="empty"><h3>No questions matched your search</h3><p>Try searching with another word or view all categories.</p></div>';
    }

    return filtered.map(f => \`
      <details>
        <summary><em>\${UI.escapeHtml(f[0])}</em>\${UI.escapeHtml(f[1])}</summary>
        <p>\${UI.escapeHtml(f[2])}</p>
      </details>
    \`).join('');
  },

  faqSearch(val) {
    this.faqQuery = (val || '').trim();
    const fl = document.getElementById('fl');
    if (fl) fl.innerHTML = this.renderFaqList();
  },

  faqSetCategory(cat) {
    this.faqCategory = cat;
    const fc = document.getElementById('fc');
    const fl = document.getElementById('fl');
    if (fc) fc.innerHTML = this.renderFaqChips();
    if (fl) fl.innerHTML = this.renderFaqList();
  },

  renderContact() {
    const opt = a => a.map(x => \`<option>\${x}</option>\`).join('');
    return \`
      <section class="phero">
        <h1>Contact Surge Solutions</h1>
        <p>Send your enquiry to the asset desk. A recovery specialist will review it and get back to you.</p>
      </section>
      <div class="strip three">
        <div class="in">
          <div><b>Accra</b><span>Head office</span></div>
          <div><b>Under 4 hours</b><span>Average response</span></div>
          <div><b>Mon to Sat</b><span>Open six days</span></div>
        </div>
      </div>
      <div class="sec">
        <div class="two">
          <div class="card2" id="ctBox">
            <h3>Send an enquiry</h3>
            <p>Fields marked with an asterisk are required.</p>
            <div class="f" id="c-name">
              <label for="cn">Full name *</label>
              <input id="cn" placeholder="Your full name">
            </div>
            <div class="row2">
              <div class="f" id="c-phone">
                <label for="cp">Phone number *</label>
                <input id="cp" placeholder="+233 24 000 0000">
              </div>
              <div class="f" id="c-email">
                <label for="ce">Email address *</label>
                <input id="ce" type="email" placeholder="you@domain.com">
              </div>
            </div>
            <div class="row2">
              <div class="f">
                <label for="ct">Nature of enquiry</label>
                <select id="ct">\${opt(['Asset details and reserve price', 'Supervised viewing request', 'Diaspora advisory and remote purchase', 'Corporate or bulk acquisition', 'Title verification and court writ questions', 'General information'])}</select>
              </div>
              <div class="f">
                <label for="cm">Preferred contact</label>
                <select id="cm">\${opt(['Phone call', 'WhatsApp message', 'Email'])}</select>
              </div>
            </div>
            <div class="f">
              <label for="cr">Asset reference (optional)</label>
              <input id="cr" placeholder="e.g. SS-RE-2026-00248">
            </div>
            <div class="f" id="c-msg">
              <label for="cg">Message *</label>
              <textarea id="cg" placeholder="Describe your interest, preferred locations, budget range or questions"></textarea>
            </div>
            <button class="btn p" type="button" onclick="PublicMarket.contactSubmit()">Send enquiry</button>
          </div>

          <div class="aside">
            <div class="card2">
              <h3>Head office</h3>
              <div class="kv"><span>Address</span><span>Surge Asset Recovery Centre, 4th Floor, Ridge Financial Enclave, Independence Avenue, Accra</span></div>
              <div class="kv"><span>Digital address</span><span>GA-019-4821</span></div>
              <div class="kv"><span>Postal address</span><span>P.O. Box CT 4892, Cantonments, Accra</span></div>
            </div>
            <div class="card2">
              <h3>Talk to us</h3>
              <div class="kv"><span>Switchboard</span><span>+233 (0) 30 274 0000</span></div>
              <div class="kv"><span>Asset advisory</span><span>+233 (0) 24 455 0192</span></div>
              <div class="kv"><span>Diaspora WhatsApp</span><span>+233 (0) 50 123 4567</span></div>
              <div class="kv"><span>Enquiries</span><span><a href="mailto:enquiries@surge.gh">enquiries@surge.gh</a></span></div>
              <div class="kv"><span>Legal and compliance</span><span><a href="mailto:legal@surge.gh">legal@surge.gh</a></span></div>
              <div class="kv"><span>Buyer KYC</span><span><a href="mailto:kyc@surge.gh">kyc@surge.gh</a></span></div>
            </div>
            <div class="card2">
              <h3>Opening hours</h3>
              <div class="kv"><span>Monday to Friday</span><span>08:00 to 17:00 GMT</span></div>
              <div class="kv"><span>Saturday</span><span>09:00 to 14:00 GMT, supervised viewings only</span></div>
              <div class="kv"><span>Sunday and holidays</span><span>Closed</span></div>
            </div>
          </div>
        </div>
      </div>
      <div style="height:32px"></div>
      \${this.renderFooter()}
    \`;
  },

  contactSubmit() {
    const v = id => document.getElementById(id)?.value?.trim() || '';
    const name = v('cn'), phone = v('cp'), email = v('ce'), msg = v('cg');
    if (!name || !phone || !email || !msg) {
      return this.toast('Complete all required fields.');
    }

    const ref = 'ENQ-2026-' + Math.floor(100000 + Math.random() * 900000);
    const cm = document.getElementById('cm')?.value || 'Phone call';
    Store.leads.unshift({
      id: 'l' + Date.now(),
      ref,
      name,
      phone,
      email,
      notes: msg,
      source: 'Contact Page Enquiry',
      createdAt: new Date().toISOString()
    });
    Store.addAudit('Public Buyer', 'ENQUIRY', 'Lead', ref, null, 'New', 'General enquiry from ' + name);
    Store.persist();

    const box = document.getElementById('ctBox');
    if (box) {
      box.innerHTML = \`
        <div class="okbox">
          <div class="tk">\${this.icons.tick}</div>
          <h3 style="margin:0 0 6px;font:700 20px var(--serif)">Enquiry sent</h3>
          <p style="color:var(--text-2);margin:0">Your enquiry is with the asset desk. We will reply by \${cm.toLowerCase()} shortly.</p>
          <code>Reference: \${ref}</code><br>
          <button class="btn p" type="button" onclick="PublicMarket.goHome()">Back to listings</button>
        </div>
      \`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  renderFooter() {
    return \`
      <footer class="ft">
        <div class="in">
          <div>
            <img class="lg" src="surge-logo.jpg" alt="Surge Solutions, partners in business growth">
            <p>Licensed intermediary for bank-repossessed and distressed asset disposition in Ghana.</p>
            <p>All listings are managed by Surge Solutions.</p>
          </div>
          <div>
            <h4>Marketplace</h4>
            <ul>
              <li><a onclick="PublicMarket.goHome()">Buy assets</a></li>
              <li><a onclick="PublicMarket.goHow()">How it works</a></li>
              <li><a onclick="PublicMarket.goKyc()">KYC and verification</a></li>
              <li><a onclick="PublicMarket.goFaq()">FAQ</a></li>
              <li><a onclick="PublicMarket.goContact()">Contact</a></li>
            </ul>
          </div>
          <div class="ct">
            <h4>Contact</h4>
            <ul>
              <li><span>Surge Asset Recovery Centre</span><small>4th Floor, Ridge Financial Enclave, Independence Avenue, Accra</small></li>
              <li><a href="tel:+233302740000">+233 (0) 30 274 0000</a><small>Switchboard</small></li>
              <li><a href="tel:+233244550192">+233 (0) 24 455 0192</a><small>Asset advisory desk</small></li>
              <li><a href="mailto:enquiries@surge.gh">enquiries@surge.gh</a></li>
            </ul>
          </div>
          <div class="hr">
            <h4>Opening hours</h4>
            <ul>
              <li><span>Monday to Friday</span><small>08:00 to 17:00 GMT</small></li>
              <li><span>Saturday</span><small>09:00 to 14:00 GMT, supervised viewings only</small></li>
              <li><span>Sunday and holidays</span><small>Closed</small></li>
              <li><a href="bank.html">Bank and staff sign in</a></li>
            </ul>
          </div>
        </div>
        <div class="bar">
          <div>
            <span>&copy; 2026 Surge Solutions. Buyer verification is carried out under the Anti-Money Laundering Act, 2020 (Act 1044).</span>
            <span>Accra, Ghana</span>
          </div>
        </div>
      </footer>
    \`;
  },

  render() {
    const el = document.getElementById('app') || document.getElementById('public-work');
    if (!el) return;

    this.syncSwitcherState();

    switch (this.currentPage) {
      case 'home':
        el.innerHTML = this.selectedAssetId ? this.renderDetail() : this.renderHome();
        break;
      case 'how':
        el.innerHTML = this.renderHow();
        break;
      case 'kyc':
        el.innerHTML = this.renderKyc();
        break;
      case 'faq':
        el.innerHTML = this.renderFaq();
        break;
      case 'contact':
        el.innerHTML = this.renderContact();
        break;
      default:
        el.innerHTML = this.renderHome();
    }
  }
};
`;

// Update app.js and public/app.js
const appFiles = ['app.js', 'public/app.js'];

for (const file of appFiles) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  const startIdx = code.indexOf('const PublicMarket = {');
  const endMarker = 'document.querySelectorAll(\'.switcher button[data-app]\').forEach(';
  const endIdx = code.lastIndexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Could not locate PublicMarket bounds in', file);
    continue;
  }

  // Replace old PublicMarket with new PublicMarket + Lightbox
  const newCode = code.substring(0, startIdx) + publicMarketCode + '\n' + code.substring(endIdx);
  fs.writeFileSync(file, newCode, 'utf8');
  console.log('Successfully updated PublicMarket and Lightbox in', file);
}
