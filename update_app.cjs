// update_app.cjs — Add workspace persistence + background refresh to both portals
const fs = require('fs');
let src = fs.readFileSync('app.js', 'utf8');

// Normalize to \n for matching, restore \r\n at the end
const hadCRLF = src.includes('\r\n');
if (hadCRLF) src = src.replace(/\r\n/g, '\n');

let patchCount = 0;
function replace(label, target, replacement) {
  if (!src.includes(target)) {
    console.error('MISS: ' + label);
    console.error('  First 150 chars:', JSON.stringify(target.slice(0, 150)));
    // Try to find nearby text
    const first20 = target.slice(0, 40).trim();
    const idx = src.indexOf(first20);
    if (idx >= 0) {
      console.error('  Found start at offset', idx);
      console.error('  Actual text:', JSON.stringify(src.slice(idx, idx + 200)));
    }
    process.exit(1);
  }
  src = src.replace(target, replacement);
  patchCount++;
  console.log('OK: ' + label);
}

// =========================================================
// 1. ADMIN PORTAL — insert saveWorkspace, restoreWorkspace, refreshActiveTab before openTab
//    and patch switchTab to call saveWorkspace + refreshActiveTab
// =========================================================
replace(
  'AdminPortal: add workspace methods + patch switchTab',
  [
    '  openTab(tab) {',
    '    if (!Array.isArray(this.tabs)) this.tabs = [];',
    '    if (!tab || !tab.id) return;',
    '    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);',
    '    if (existingIndex >= 0) {',
    '      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };',
    '    } else {',
    '      this.tabs.push(tab);',
    '    }',
    '    this.switchTab(tab.id);',
    '  },',
    '',
    '  switchTab(tabId) {',
    '    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {',
    "      this.tabs = [{ id: 'assets', title: 'Assets', view: 'assets', closable: false }];",
    '    }',
    '    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];',
    '    if (!tab) return;',
    '    this.activeTabId = tab.id;',
    "    this.currentView = tab.view || 'assets';",
    '    this.selectedAssetId = tab.assetId || null;',
    '    this.selectedValuationId = tab.selectedValuationId || null;',
    '    this.selectedOfferId = tab.selectedOfferId || null;',
    '    this.subPage = tab.subPage || null;',
    "    this.detailTab = tab.detailTab || 'overview';",
    '',
    "    document.querySelectorAll('#admin-nav .navitem').forEach(n => {",
    "      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);",
    '    });',
    '',
    '    this.render();',
    '  },'
  ].join('\n'),

  [
    '  saveWorkspace() {',
    '    try {',
    '      const state = {',
    '        tabs: this.tabs, activeTabId: this.activeTabId, currentView: this.currentView,',
    '        selectedAssetId: this.selectedAssetId, selectedValuationId: this.selectedValuationId,',
    '        selectedOfferId: this.selectedOfferId, subPage: this.subPage, detailTab: this.detailTab',
    '      };',
    "      localStorage.setItem('surge_admin_state', JSON.stringify(state));",
    "      if (this.activeTabId) history.replaceState(null, '', '#' + encodeURIComponent(this.activeTabId));",
    '    } catch (e) {}',
    '  },',
    '',
    '  restoreWorkspace() {',
    '    try {',
    "      const raw = localStorage.getItem('surge_admin_state');",
    '      const saved = raw ? JSON.parse(raw) : null;',
    "      const hash = window.location.hash.replace(/^#/, '');",
    '      if (saved && Array.isArray(saved.tabs) && saved.tabs.length > 0) {',
    '        this.tabs = saved.tabs;',
    '        this.activeTabId = saved.activeTabId || this.tabs[0].id;',
    "        this.currentView = saved.currentView || 'assets';",
    '        this.selectedAssetId = saved.selectedAssetId || null;',
    '        this.selectedValuationId = saved.selectedValuationId || null;',
    '        this.selectedOfferId = saved.selectedOfferId || null;',
    '        this.subPage = saved.subPage || null;',
    "        this.detailTab = saved.detailTab || 'overview';",
    '      }',
    '      if (hash) {',
    '        const decoded = decodeURIComponent(hash);',
    '        const match = this.tabs.find(t => t.id === decoded);',
    '        if (match) {',
    '          this.activeTabId = match.id;',
    '          this.currentView = match.view || this.currentView;',
    '          this.selectedAssetId = match.assetId || null;',
    '          this.subPage = match.subPage || null;',
    "          this.detailTab = match.detailTab || 'overview';",
    "        } else if (decoded.startsWith('asset-')) {",
    "          const assetId = decoded.replace('asset-', '');",
    '          if (!this.tabs.find(t => t.id === decoded)) {',
    "            this.tabs.push({ id: decoded, title: 'Asset', view: 'assets', assetId, closable: true });",
    '          }',
    "          this.activeTabId = decoded; this.currentView = 'assets'; this.selectedAssetId = assetId;",
    "        } else if (['dashboard','assets','review','legal','title','offers','banks','audit'].includes(decoded)) {",
    '          if (!this.tabs.find(t => t.id === decoded)) {',
    "            this.tabs.push({ id: decoded, title: this.getViewTitle(decoded), view: decoded, closable: decoded !== 'assets' });",
    '          }',
    '          this.activeTabId = decoded; this.currentView = decoded; this.selectedAssetId = null;',
    '        }',
    '      }',
    '    } catch (e) {}',
    '  },',
    '',
    '  async refreshActiveTab() {',
    '    try { await Store.fetchRemote(); this.render(); } catch (e) {}',
    '  },',
    '',
    '  openTab(tab) {',
    '    if (!Array.isArray(this.tabs)) this.tabs = [];',
    '    if (!tab || !tab.id) return;',
    '    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);',
    '    if (existingIndex >= 0) {',
    '      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };',
    '    } else {',
    '      this.tabs.push(tab);',
    '    }',
    '    this.switchTab(tab.id);',
    '  },',
    '',
    '  switchTab(tabId) {',
    '    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {',
    "      this.tabs = [{ id: 'assets', title: 'Assets', view: 'assets', closable: false }];",
    '    }',
    '    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];',
    '    if (!tab) return;',
    '    this.activeTabId = tab.id;',
    "    this.currentView = tab.view || 'assets';",
    '    this.selectedAssetId = tab.assetId || null;',
    '    this.selectedValuationId = tab.selectedValuationId || null;',
    '    this.selectedOfferId = tab.selectedOfferId || null;',
    '    this.subPage = tab.subPage || null;',
    "    this.detailTab = tab.detailTab || 'overview';",
    '',
    "    document.querySelectorAll('#admin-nav .navitem').forEach(n => {",
    "      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);",
    '    });',
    '',
    '    this.saveWorkspace();',
    '    this.render();',
    '    void this.refreshActiveTab();',
    '  },'
  ].join('\n')
);

// =========================================================
// 2. ADMIN PORTAL — patch init() to call restoreWorkspace + hashchange
// =========================================================
replace(
  'AdminPortal: init restoreWorkspace',
  [
    '  async init(alreadyAuthenticated = false) {',
    "    const authed = alreadyAuthenticated || await Auth.checkAuth('surge');",
    '    if (!authed) return;',
    '',
    "    document.querySelectorAll('#admin-nav .navitem').forEach(el => {",
    "      el.addEventListener('click', () => this.nav(el.dataset.view));",
    '    });',
    '    this.render();',
    '    try {',
    '      await Store.fetchRemote();',
    '    } finally {',
    '      this.render();',
    '    }',
    '  },'
  ].join('\n'),

  [
    '  async init(alreadyAuthenticated = false) {',
    "    const authed = alreadyAuthenticated || await Auth.checkAuth('surge');",
    '    if (!authed) return;',
    '',
    '    this.restoreWorkspace();',
    "    window.addEventListener('hashchange', () => {",
    "      const hash = window.location.hash.replace(/^#/, '');",
    '      if (hash && hash !== this.activeTabId) {',
    '        const decoded = decodeURIComponent(hash);',
    '        const match = this.tabs.find(t => t.id === decoded);',
    '        if (match) this.switchTab(match.id);',
    '      }',
    '    });',
    '',
    "    document.querySelectorAll('#admin-nav .navitem').forEach(el => {",
    "      el.addEventListener('click', () => this.nav(el.dataset.view));",
    '    });',
    '    this.render();',
    '    try {',
    '      await Store.fetchRemote();',
    '    } finally {',
    '      this.render();',
    '    }',
    '  },'
  ].join('\n')
);

// =========================================================
// 3. ADMIN PORTAL — closeTab: add saveWorkspace in else branch
// =========================================================
replace(
  'AdminPortal: closeTab saveWorkspace',
  '    } else {\n      this.renderDoctabs();\n    }\n  },\n\n  async init(alreadyAuthenticated',
  '    } else {\n      this.saveWorkspace();\n      this.renderDoctabs();\n    }\n  },\n\n  async init(alreadyAuthenticated'
);

// =========================================================
// 4. ADMIN PORTAL — openSubPage: add saveWorkspace
// =========================================================
replace(
  'AdminPortal: openSubPage saveWorkspace',
  '  openSubPage(name) { this.subPage = name; this.render(); },',
  '  openSubPage(name) { this.subPage = name; this.saveWorkspace(); this.render(); },'
);

// =========================================================
// 5. ADMIN PORTAL — closeSubPage: add saveWorkspace
// =========================================================
replace(
  'AdminPortal: closeSubPage saveWorkspace',
  '    this.subPage = null;\n    this.selectedOfferId = null;\n    if (this.currentView === \'title\') {\n      this.selectedAssetId = null;\n      this.selectedValuationId = null;\n    }\n    if (this.currentView === \'assets\'',
  '    this.subPage = null;\n    this.selectedOfferId = null;\n    if (this.currentView === \'title\') {\n      this.selectedAssetId = null;\n      this.selectedValuationId = null;\n    }\n    this.saveWorkspace();\n    if (this.currentView === \'assets\''
);

// =========================================================
// 6. BANK PORTAL — insert saveWorkspace, restoreWorkspace, refreshActiveTab before openTab
//    and patch switchTab
// =========================================================
replace(
  'BankPortal: add workspace methods + patch switchTab',
  [
    '  openTab(tab) {',
    '    if (!Array.isArray(this.tabs)) this.tabs = [];',
    '    if (!tab || !tab.id) return;',
    '    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);',
    '    if (existingIndex >= 0) {',
    '      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };',
    '    } else {',
    '      this.tabs.push(tab);',
    '    }',
    '    this.switchTab(tab.id);',
    '  },',
    '',
    '  switchTab(tabId) {',
    '    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {',
    "      this.tabs = [{ id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }];",
    '    }',
    '    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];',
    '    if (!tab) return;',
    '    this.activeTabId = tab.id;',
    "    this.currentView = tab.view || 'dashboard';",
    '    this.selectedAssetId = tab.assetId || null;',
    '    this.selectedOfferId = tab.selectedOfferId || null;',
    '    this.subPage = tab.subPage || null;',
    "    this.detailTab = tab.detailTab || 'overview';",
    '',
    "    document.querySelectorAll('#bank-nav .navitem').forEach(n => {",
    "      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);",
    '    });',
    '',
    '    this.render();',
    '  },'
  ].join('\n'),

  [
    '  saveWorkspace() {',
    '    try {',
    '      const state = {',
    '        tabs: this.tabs, activeTabId: this.activeTabId, currentView: this.currentView,',
    '        selectedAssetId: this.selectedAssetId, selectedOfferId: this.selectedOfferId,',
    '        subPage: this.subPage, detailTab: this.detailTab',
    '      };',
    "      localStorage.setItem('surge_bank_state', JSON.stringify(state));",
    "      if (this.activeTabId) history.replaceState(null, '', '#' + encodeURIComponent(this.activeTabId));",
    '    } catch (e) {}',
    '  },',
    '',
    '  restoreWorkspace() {',
    '    try {',
    "      const raw = localStorage.getItem('surge_bank_state');",
    '      const saved = raw ? JSON.parse(raw) : null;',
    "      const hash = window.location.hash.replace(/^#/, '');",
    '      if (saved && Array.isArray(saved.tabs) && saved.tabs.length > 0) {',
    '        this.tabs = saved.tabs;',
    '        this.activeTabId = saved.activeTabId || this.tabs[0].id;',
    "        this.currentView = saved.currentView || 'dashboard';",
    '        this.selectedAssetId = saved.selectedAssetId || null;',
    '        this.selectedOfferId = saved.selectedOfferId || null;',
    '        this.subPage = saved.subPage || null;',
    "        this.detailTab = saved.detailTab || 'overview';",
    '      }',
    '      if (hash) {',
    '        const decoded = decodeURIComponent(hash);',
    '        const match = this.tabs.find(t => t.id === decoded);',
    '        if (match) {',
    '          this.activeTabId = match.id;',
    '          this.currentView = match.view || this.currentView;',
    '          this.selectedAssetId = match.assetId || null;',
    '          this.subPage = match.subPage || null;',
    "          this.detailTab = match.detailTab || 'overview';",
    "        } else if (decoded.startsWith('asset-')) {",
    "          const assetId = decoded.replace('asset-', '');",
    '          if (!this.tabs.find(t => t.id === decoded)) {',
    "            this.tabs.push({ id: decoded, title: 'Asset', view: 'assets', assetId, closable: true });",
    '          }',
    "          this.activeTabId = decoded; this.currentView = 'assets'; this.selectedAssetId = assetId;",
    "        } else if (['dashboard','assets','legal','documents','offers','reports','notifications'].includes(decoded)) {",
    '          if (!this.tabs.find(t => t.id === decoded)) {',
    "            this.tabs.push({ id: decoded, title: this.getViewTitle(decoded), view: decoded, closable: decoded !== 'dashboard' });",
    '          }',
    '          this.activeTabId = decoded; this.currentView = decoded; this.selectedAssetId = null;',
    '        }',
    '      }',
    '    } catch (e) {}',
    '  },',
    '',
    '  async refreshActiveTab() {',
    '    try { await Store.fetchRemote(); this.render(); } catch (e) {}',
    '  },',
    '',
    '  openTab(tab) {',
    '    if (!Array.isArray(this.tabs)) this.tabs = [];',
    '    if (!tab || !tab.id) return;',
    '    const existingIndex = this.tabs.findIndex(t => t.id === tab.id);',
    '    if (existingIndex >= 0) {',
    '      this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };',
    '    } else {',
    '      this.tabs.push(tab);',
    '    }',
    '    this.switchTab(tab.id);',
    '  },',
    '',
    '  switchTab(tabId) {',
    '    if (!Array.isArray(this.tabs) || this.tabs.length === 0) {',
    "      this.tabs = [{ id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }];",
    '    }',
    '    const tab = this.tabs.find(t => t.id === tabId) || this.tabs[0];',
    '    if (!tab) return;',
    '    this.activeTabId = tab.id;',
    "    this.currentView = tab.view || 'dashboard';",
    '    this.selectedAssetId = tab.assetId || null;',
    '    this.selectedOfferId = tab.selectedOfferId || null;',
    '    this.subPage = tab.subPage || null;',
    "    this.detailTab = tab.detailTab || 'overview';",
    '',
    "    document.querySelectorAll('#bank-nav .navitem').forEach(n => {",
    "      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);",
    '    });',
    '',
    '    this.saveWorkspace();',
    '    this.render();',
    '    void this.refreshActiveTab();',
    '  },'
  ].join('\n')
);

// =========================================================
// 7. BANK PORTAL — patch init() to call restoreWorkspace + hashchange
// =========================================================
replace(
  'BankPortal: init restoreWorkspace',
  [
    '  async init(alreadyAuthenticated = false) {',
    "    const authed = alreadyAuthenticated || await Auth.checkAuth('bank');",
    '    if (!authed) return;',
    '',
    "    const tabsEl = document.getElementById('bank-doctabs');"
  ].join('\n'),

  [
    '  async init(alreadyAuthenticated = false) {',
    "    const authed = alreadyAuthenticated || await Auth.checkAuth('bank');",
    '    if (!authed) return;',
    '',
    '    this.restoreWorkspace();',
    "    window.addEventListener('hashchange', () => {",
    "      const hash = window.location.hash.replace(/^#/, '');",
    '      if (hash && hash !== this.activeTabId) {',
    '        const decoded = decodeURIComponent(hash);',
    '        const match = this.tabs.find(t => t.id === decoded);',
    '        if (match) this.switchTab(match.id);',
    '      }',
    '    });',
    '',
    "    const tabsEl = document.getElementById('bank-doctabs');"
  ].join('\n')
);

// =========================================================
// 8. BANK PORTAL — closeTab: add saveWorkspace in else branch
// =========================================================
replace(
  'BankPortal: closeTab saveWorkspace',
  '    } else {\n      this.renderDoctabs();\n    }\n  },\n\n  async init(alreadyAuthenticated',
  '    } else {\n      this.saveWorkspace();\n      this.renderDoctabs();\n    }\n  },\n\n  async init(alreadyAuthenticated'
);

// =========================================================
// 9. BANK PORTAL — openSubPage: add saveWorkspace
// =========================================================
replace(
  'BankPortal: openSubPage saveWorkspace',
  '  openSubPage(name) {\n    this._stagedFile = null;\n    this.subPage = name;\n    this.updateCurrentTab({ subPage: name });\n    this.render();',
  '  openSubPage(name) {\n    this._stagedFile = null;\n    this.subPage = name;\n    this.updateCurrentTab({ subPage: name });\n    this.saveWorkspace();\n    this.render();'
);

// =========================================================
// 10. BANK PORTAL — closeSubPage: add saveWorkspace
// =========================================================
replace(
  'BankPortal: closeSubPage saveWorkspace',
  '    this.updateCurrentTab({ subPage: null, selectedOfferId: null });\n    this.render();\n  },\n\n  async loadPhotos',
  '    this.updateCurrentTab({ subPage: null, selectedOfferId: null });\n    this.saveWorkspace();\n    this.render();\n  },\n\n  async loadPhotos'
);

// Restore original line endings
if (hadCRLF) src = src.replace(/\n/g, '\r\n');

fs.writeFileSync('app.js', src, 'utf8');
console.log('\n=== All ' + patchCount + ' patches applied successfully ===');
console.log('Copying to public/app.js...');
fs.copyFileSync('app.js', 'public/app.js');
console.log('Done. public/app.js synced.');
