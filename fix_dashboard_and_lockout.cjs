const fs = require('fs');

// 1. UPDATE app.js
let app = fs.readFileSync('app.js', 'utf8');

// A. Update AdminPortal defaults to 'dashboard'
app = app.replace(
  `const AdminPortal = {\n  currentView: 'assets', selectedAssetId: null, detailTab: 'overview', subPage: null,\n  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '', selectedValuationId: null,\n  openedReviewDocuments: new Set(), gateReadiness: null, gateReadinessAssetId: null,\n  gateReadinessLoading: false, gateReadinessError: '',\n  tabs: [\n    { id: 'assets', title: 'Assets', view: 'assets', closable: false }\n  ],\n  activeTabId: 'assets',`,
  `const AdminPortal = {\n  currentView: 'dashboard', selectedAssetId: null, detailTab: 'overview', subPage: null,\n  activeBankTab: 'banks', selectedBankFilter: '', staffSearchQuery: '', staffRoleFilter: '', selectedValuationId: null,\n  openedReviewDocuments: new Set(), gateReadiness: null, gateReadinessAssetId: null,\n  gateReadinessLoading: false, gateReadinessError: '',\n  tabs: [\n    { id: 'dashboard', title: 'Dashboard', view: 'dashboard', closable: false }\n  ],\n  activeTabId: 'dashboard',`
);

// B. In AdminPortal.render(), ensure #admin-nav .navitem active class is updated
app = app.replace(
  `  render() {\n    this.renderDoctabs();\n    const el = document.getElementById('admin-work');`,
  `  render() {\n    this.renderDoctabs();\n    document.querySelectorAll('#admin-nav .navitem').forEach(n => {\n      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);\n    });\n    const el = document.getElementById('admin-work');`
);

// C. In BankPortal.render(), ensure #bank-nav .navitem active class is updated
app = app.replace(
  `  render() {\n    this.renderDoctabs();\n    this.updateBranchSelect();\n    const el = document.getElementById('bank-work');`,
  `  render() {\n    this.renderDoctabs();\n    this.updateBranchSelect();\n    document.querySelectorAll('#bank-nav .navitem').forEach(n => {\n      n.classList.toggle('active', n.dataset.view === this.currentView && !this.selectedAssetId && !this.subPage);\n    });\n    const el = document.getElementById('bank-work');`
);

// D. In Store.users mapping, map lockedUntil
app = app.replace(
  `            branchName: u.branch_name || 'Head Office',\n            status: u.status || 'Active',`,
  `            branchName: u.branch_name || 'Head Office',\n            status: u.status || 'Active',\n            lockedUntil: u.locked_until || null,`
);

// E. Add Store.unlockUser
if (!app.includes('async unlockUser(')) {
  app = app.replace(
    `  async deleteUser(userId) {`,
    `  async unlockUser(userId) {\n    try {\n      const res = await fetch(this.API_BASE + \`/api/admin/users/\${encodeURIComponent(userId)}/unlock\`, {\n        method: 'PUT',\n        headers: this.getAuthHeaders(),\n        cache: 'no-store'\n      });\n      const data = await res.json();\n      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to unlock user.');\n      UI.toast(data.message || 'Account unlocked.', 'success');\n      await this.fetchRemote();\n      AdminPortal.render();\n      return true;\n    } catch (err) {\n      UI.toast(err.message, 'error');\n      return false;\n    }\n  },\n\n  async deleteUser(userId) {`
  );
}

// F. In AdminPortal.renderStaffTab(), show Locked badge and Unlock button
const oldStaffRow = `<span class="badge \${u.status === 'Active' ? 'ok' : 'hold'}" style="cursor:pointer" onclick="Store.toggleUserStatus('\${u.id}')" title="Click to toggle status">\n                    \${u.status || 'Active'}\n                  </span>`;
const newStaffRow = `\${(u.lockedUntil && new Date(u.lockedUntil.endsWith('Z') ? u.lockedUntil : u.lockedUntil + 'Z') > new Date()) ? \`
                    <span class="badge alert" style="background:#B3262E;color:#fff;font-weight:700" title="Account locked due to repeated failed logins">LOCKED</span>
                    <button class="btn small ok" onclick="Store.unlockUser('\${u.id}')" style="margin-top:4px;font-size:10.5px;padding:2px 6px">Unlock Account</button>
                  \` : \`
                    <span class="badge \${u.status === 'Active' ? 'ok' : 'hold'}" style="cursor:pointer" onclick="Store.toggleUserStatus('\${u.id}')" title="Click to toggle status">
                      \${u.status || 'Active'}
                    </span>
                  \`}`;
if (app.includes(oldStaffRow)) {
  app = app.replace(oldStaffRow, newStaffRow);
  console.log('OK: Replaced staff status with lockout badge & unlock button');
}

// Replace timeline / audit em-dashes and format in renderDashboard
app = app.replace(
  `\${Store.auditLog.slice(0, 8).map(a => \`      <li><span class="dot \${a.action === 'LEGAL_HOLD' ? 'red' : a.action === 'PUBLISH' ? 'green' : ''}"></span><div class="tl-when">\${UI.fmtDate(a.when)}</div><div class="tl-what"><b>\${UI.escapeHtml(a.action)}</b> \${UI.escapeHtml(UI.cleanAuditRef(a.entityRef, a.entity))} — \${UI.cleanAuditDetail(a.detail, a)}</div><div class="tl-who">\${UI.auditActor(a)}</div></li>\`).join('')}`,
  `\${Store.auditLog.slice(0, 8).map(a => UI.renderTimelineItem(a)).join('')}`
);

fs.writeFileSync('app.js', app, 'utf8');
fs.copyFileSync('app.js', 'public/app.js');
console.log('OK: Updated app.js and public/app.js');

// 2. UPDATE admin.html & public/admin.html
['admin.html', 'public/admin.html'].forEach(filePath => {
  let h = fs.readFileSync(filePath, 'utf8');
  // Remove hardcoded active on assets
  h = h.replace('<div class="navitem active" data-view="assets">', '<div class="navitem" data-view="assets">');
  // Add dashboard to menubar if missing
  if (!h.includes("AdminPortal.nav('dashboard')")) {
    h = h.replace(
      '<span class="menu-item" onclick="AdminPortal.nav(\'assets\')"><u>A</u>ssets</span>',
      '<span class="menu-item" onclick="AdminPortal.nav(\'dashboard\')"><u>D</u>ashboard</span>\n        <span class="menu-item" onclick="AdminPortal.nav(\'assets\')"><u>A</u>ssets</span>'
    );
  }
  // Replace em-dash in titles
  h = h.replace('Surge Solutions — Administration', 'Surge Solutions · Administration');
  fs.writeFileSync(filePath, h, 'utf8');
  console.log('OK: Updated ' + filePath);
});

// 3. UPDATE login.html & public/login.html
['login.html', 'public/login.html'].forEach(filePath => {
  let l = fs.readFileSync(filePath, 'utf8');
  l = l.replace('Surge Solutions — Sign in', 'Surge Solutions · Sign in');
  l = l.replace('Sign in to your bank account', 'Sign in to your portal');
  
  // Update startLock function
  const oldStartLock = `  function startLock() {
    lockedUntil = Date.now() + LOCK_MS; btn.disabled = true;
    $('lock').classList.add('show');
    if (window.NotificationSystem) {
      NotificationSystem.warning('Too many failed attempts. Try again in 60 seconds.', 'Account Temporarily Locked');
    }
    clearInterval(lockTimer);
    lockTimer = setInterval(function () {
      var s = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (s <= 0) { clearInterval(lockTimer); $('lock').classList.remove('show'); btn.disabled = false; tries = 0; return; }
      $('lock-msg').textContent = 'Too many failed attempts. Try again in ' + s + ' seconds.';
    }, 250);
    $('lock-msg').textContent = 'Too many failed attempts. Try again in 60 seconds.';
  }`;

  const newStartLock = `  function formatCountdown(sec) {
    if (sec >= 60) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
    }
    return sec + ' second' + (sec === 1 ? '' : 's');
  }

  function startLock(seconds) {
    var durMs = (typeof seconds === 'number' && seconds > 0) ? seconds * 1000 : LOCK_MS;
    lockedUntil = Date.now() + durMs;
    btn.disabled = true;
    $('lock').classList.add('show');
    var initSec = Math.ceil(durMs / 1000);
    var initMsg = 'Account locked after failed sign-in attempts. Try again in ' + formatCountdown(initSec) + '.';
    $('lock-msg').textContent = initMsg;
    if (window.NotificationSystem) {
      NotificationSystem.warning(initMsg, 'Account Temporarily Locked');
    }
    clearInterval(lockTimer);
    lockTimer = setInterval(function () {
      var s = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (s <= 0) {
        clearInterval(lockTimer);
        $('lock').classList.remove('show');
        btn.disabled = false;
        tries = 0;
        return;
      }
      $('lock-msg').textContent = 'Account locked after failed sign-in attempts. Try again in ' + formatCountdown(s) + '.';
    }, 500);
  }`;

  if (l.includes('function startLock() {')) {
    l = l.replace(oldStartLock, newStartLock);
    console.log('OK: Replaced startLock in ' + filePath);
  }

  // Update response handler for login
  const oldLoginHandler = `        if (loginToast) loginToast.dismiss();
        tries++; btn.textContent = 'Sign in'; btn.disabled = false; pass.value = '';
        if (res.status === 423 || res.status === 429 || tries >= MAX_TRIES) { startLock(); return; }
        if (res.status === 403) return showError(res.json.error || 'Sign-in is not allowed for this account. Contact your Surge administrator.', ['u']);
        showError('The username or password is incorrect. ' + (MAX_TRIES - tries) + ' attempt' + (MAX_TRIES - tries === 1 ? '' : 's') + ' left.', ['p']);`;

  const newLoginHandler = `        if (loginToast) loginToast.dismiss();
        btn.textContent = 'Sign in'; btn.disabled = false; pass.value = '';
        var data = res.json || {};
        if (res.status === 423 || res.status === 429 || data.locked) {
          var lockMins = data.lockMinutesLeft || 15;
          startLock(lockMins * 60);
          showError(data.error || ('Account locked. Please try again in ' + lockMins + ' minutes or contact your administrator.'), ['u', 'p']);
          return;
        }
        if (res.status === 403) return showError(data.error || 'Sign-in is not allowed for this account. Contact your Surge administrator.', ['u']);
        var remaining = (typeof data.attemptsRemaining === 'number') ? data.attemptsRemaining : (MAX_TRIES - (++tries));
        if (remaining <= 0) {
          startLock(15 * 60);
          showError('Account locked after repeated failed attempts. Try again in 15 minutes.', ['u', 'p']);
          return;
        }
        tries = MAX_TRIES - remaining;
        showError('The username or password is incorrect. ' + remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' left.', ['p']);`;

  if (l.includes("if (res.status === 423 || res.status === 429 || tries >= MAX_TRIES)")) {
    l = l.replace(oldLoginHandler, newLoginHandler);
    console.log('OK: Replaced login failure handler in ' + filePath);
  }

  fs.writeFileSync(filePath, l, 'utf8');
});

console.log('All files updated successfully.');
