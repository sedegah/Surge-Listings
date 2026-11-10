const fs = require('fs');

function patchFile(filePath, transforms) {
  let content = fs.readFileSync(filePath, 'utf8');
  const hadCRLF = content.includes('\r\n');
  if (hadCRLF) content = content.replace(/\r\n/g, '\n');

  for (const { label, find, replaceWith } of transforms) {
    if (!content.includes(find)) {
      console.error(`[${filePath}] MISS: ${label}`);
      console.error('  Target snippet:', JSON.stringify(find.slice(0, 100)));
      process.exit(1);
    }
    content = content.replace(find, replaceWith);
    console.log(`[${filePath}] OK: ${label}`);
  }

  if (hadCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. APP.JS
patchFile('app.js', [
  {
    label: "AdminPortal default to dashboard view and tab",
    find: `const AdminPortal = {
  currentView: 'assets', selectedAssetId: null, detailTab: 'overview', subPage: null,
  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '', selectedValuationId: null,
  openedReviewDocuments: new Set(), gateReadiness: null, gateReadinessAssetId: null,
  gateReadinessLoading: false, gateReadinessError: '',
  tabs: [
    { id: 'assets', title: 'Assets', view: 'assets', closable: false }
  ],
  activeTabId: 'assets',`,
    replaceWith: `const AdminPortal = {
  currentView: 'dashboard', selectedAssetId: null, detailTab: 'overview', subPage: null,
  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '', selectedValuationId: null,
  openedReviewDocuments: new Set(), gateReadiness: null, gateReadinessAssetId: null,
  gateReadinessLoading: false, gateReadinessError: '',
  tabs: [
    { id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }
  ],
  activeTabId: 'dashboard',`
  },
  {
    label: "AdminPortal.render updates #admin-nav .navitem active class",
    find: `  render() {
    this.renderDoctabs();
    const el = document.getElementById('admin-work');`,
    replaceWith: `  render() {
    this.renderDoctabs();
    document.querySelectorAll('#admin-nav .navitem').forEach(n => {
      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);
    });
    const el = document.getElementById('admin-work');`
  },
  {
    label: "BankPortal.render updates #bank-nav .navitem active class",
    find: `  render() {
    this.renderDoctabs();
    this.updateBranchSelect();
    const el = document.getElementById('bank-work');`,
    replaceWith: `  render() {
    this.renderDoctabs();
    this.updateBranchSelect();
    document.querySelectorAll('#bank-nav .navitem').forEach(n => {
      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);
    });
    const el = document.getElementById('bank-work');`
  },
  {
    label: "Store.users mapping include lockedUntil",
    find: `            branchName: u.branch_name || 'Head Office',
            status: u.status || 'Active',`,
    replaceWith: `            branchName: u.branch_name || 'Head Office',
            status: u.status || 'Active',
            lockedUntil: u.locked_until || null,`
  },
  {
    label: "Add Store.unlockUser",
    find: `  async deleteUser(userId) {`,
    replaceWith: `  async unlockUser(userId) {
    try {
      const res = await fetch(this.API_BASE + \`/api/admin/users/\${encodeURIComponent(userId)}/unlock\`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to unlock user.');
      UI.toast(data.message || 'Account unlocked.', 'success');
      await this.fetchRemote();
      AdminPortal.render();
      return true;
    } catch (err) {
      UI.toast(err.message, 'error');
      return false;
    }
  },

  async deleteUser(userId) {`
  },
  {
    label: "Admin staff status shows locked badge & unlock button",
    find: `                  <span class="badge \${u.status === 'Active' ? 'ok' : 'hold'}" style="cursor:pointer" onclick="Store.toggleUserStatus('\${u.id}')" title="Click to toggle status">
                    \${u.status || 'Active'}
                  </span>`,
    replaceWith: `                  \${(u.lockedUntil && new Date(u.lockedUntil.endsWith('Z') ? u.lockedUntil : u.lockedUntil + 'Z') > new Date()) ? \`
                    <span class="badge alert" style="background:#B3262E;color:#fff;font-weight:700" title="Account locked due to repeated failed logins">LOCKED</span>
                    <button class="btn small ok" onclick="Store.unlockUser('\${u.id}')" style="margin-top:4px;font-size:10.5px;padding:2px 6px">Unlock Account</button>
                  \` : \`
                    <span class="badge \${u.status === 'Active' ? 'ok' : 'hold'}" style="cursor:pointer" onclick="Store.toggleUserStatus('\${u.id}')" title="Click to toggle status">
                      \${u.status || 'Active'}
                    </span>
                  \`}`
  }
]);

fs.copyFileSync('app.js', 'public/app.js');
console.log('✓ Synced app.js to public/app.js');

// 2. ADMIN.HTML
['admin.html', 'public/admin.html'].forEach(p => {
  patchFile(p, [
    {
      label: "Remove hardcoded active on assets navitem",
      find: '<div class="navitem active" data-view="assets">',
      replaceWith: '<div class="navitem" data-view="assets">'
    },
    {
      label: "Add Dashboard to menubar",
      find: '<span class="menu-item" onclick="AdminPortal.nav(\'assets\')"><u>A</u>ssets</span>',
      replaceWith: '<span class="menu-item" onclick="AdminPortal.nav(\'dashboard\')"><u>D</u>ashboard</span>\n        <span class="menu-item" onclick="AdminPortal.nav(\'assets\')"><u>A</u>ssets</span>'
    },
    {
      label: "Fix em-dash in Administration title",
      find: 'Surge Solutions — Administration',
      replaceWith: 'Surge Solutions · Administration'
    }
  ]);
});

console.log('Done with all patches.');
