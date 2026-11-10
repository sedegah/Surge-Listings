const fs = require('fs');

// 1. ADD MODAL & FORM CSS TO marketplace.css AND public/marketplace.css
const marketplaceCssFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\marketplace.css',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\marketplace.css',
];

const MODAL_CSS = `
/* =====================================================================
   SURGE ENTERPRISE MODAL & FORM SYSTEM
   Theme: Surge Navy (#0B3C75), Crimson (#B3262E), Accent (#194DBA)
===================================================================== */
.surge-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 28, 55, 0.72);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 100000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}
.surge-modal-backdrop.open {
  display: flex !important;
}
.surge-modal-window {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 24px 50px -12px rgba(11, 60, 117, 0.35), 0 0 0 1px rgba(11, 60, 117, 0.08);
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalPopIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.surge-modal-window.wide {
  max-width: 820px;
}
.surge-modal-header {
  background: linear-gradient(135deg, #0B3C75 0%, #082A52 100%);
  color: #ffffff;
  padding: 16px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid #B3262E;
  flex-shrink: 0;
}
.surge-modal-header h3 {
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  flex: 1;
}
.surge-modal-close {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 20px;
  line-height: 1;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.surge-modal-close:hover {
  background: #B3262E;
  color: #ffffff;
  transform: scale(1.05);
}
.surge-modal-body {
  padding: 22px 24px;
  overflow-y: auto;
  font-size: 13.5px;
  color: #1F2937;
  background: #ffffff;
  max-height: calc(90vh - 140px);
  box-sizing: border-box;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
.surge-modal-footer {
  padding: 14px 24px;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* Modal Asset Strip */
.modal-asset-strip {
  background: #F0F5FA;
  border: 1px solid #D5E2F0;
  border-left: 4px solid #0B3C75;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 18px;
}
.modal-asset-strip .m-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #0B3C75;
  background: #FFFFFF;
  border: 1px solid #BFD3E6;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: Consolas, monospace;
  margin-bottom: 6px;
}
.modal-asset-strip p {
  margin: 0;
  font-size: 12.5px;
  color: #475569;
  line-height: 1.5;
}
.modal-asset-strip p b {
  color: #0F172A;
}

/* Modal Form Fields */
.surge-modal-body .field,
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
}
.surge-modal-body .field .lbl,
.field .lbl {
  font-size: 12.5px;
  font-weight: 600;
  color: #0F172A;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  text-align: left;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
.surge-modal-body .field .lbl .req,
.field .lbl .req {
  color: #B3262E;
  font-weight: 700;
  margin-left: 2px;
}
.surge-modal-body .field .ctl,
.field .ctl {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.surge-modal-body .field .ctl input,
.surge-modal-body .field .ctl select,
.surge-modal-body .field .ctl textarea,
.field .ctl input,
.field .ctl select,
.field .ctl textarea {
  width: 100% !important;
  box-sizing: border-box;
  padding: 10px 13px;
  border: 1.5px solid #CBD5E1;
  border-radius: 6px;
  background: #FFFFFF;
  color: #0F172A;
  font-size: 13.5px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  line-height: 1.4;
  height: auto;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.surge-modal-body .field .ctl input:focus,
.surge-modal-body .field .ctl select:focus,
.surge-modal-body .field .ctl textarea:focus,
.field .ctl input:focus,
.field .ctl select:focus,
.field .ctl textarea:focus {
  outline: none !important;
  border-color: #0B3C75 !important;
  box-shadow: 0 0 0 3px rgba(11, 60, 117, 0.14) !important;
}
.surge-modal-body .field .ctl textarea,
.field .ctl textarea {
  min-height: 90px;
  resize: vertical;
  line-height: 1.5;
}
.surge-modal-body .field .ctl input::placeholder,
.surge-modal-body .field .ctl textarea::placeholder,
.field .ctl input::placeholder,
.field .ctl textarea::placeholder {
  color: #94A3B8;
  font-size: 13px;
}
.surge-modal-body .row2,
.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 600px) {
  .surge-modal-body .row2,
  .row2 {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

/* Modal & Form Buttons */
.surge-modal-footer .btn {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
  border: 1px solid #CBD5E1;
  background: #ffffff;
  color: #475569;
}
.surge-modal-footer .btn:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
  color: #0F172A;
}
.surge-modal-footer .btn.p,
.surge-modal-footer .btn.primary {
  background: #0B3C75 !important;
  border: 1px solid #0B3C75 !important;
  color: #ffffff !important;
  box-shadow: 0 1px 2px rgba(11, 60, 117, 0.15);
}
.surge-modal-footer .btn.p:hover,
.surge-modal-footer .btn.primary:hover {
  background: #194DBA !important;
  border-color: #194DBA !important;
}
.surge-modal-footer .btn.danger {
  background: #B3262E !important;
  border: 1px solid #B3262E !important;
  color: #ffffff !important;
}
.surge-modal-footer .btn.danger:hover {
  background: #8F1D23 !important;
  border-color: #8F1D23 !important;
}
`;

for (const f of marketplaceCssFiles) {
  let css = fs.readFileSync(f, 'utf8');
  if (!css.includes('.surge-modal-backdrop')) {
    css += '\n' + MODAL_CSS;
    fs.writeFileSync(f, css, 'utf8');
    console.log('✅ Added modal & form CSS to', f);
  } else {
    console.log('ℹ️  Modal CSS already in', f);
  }
}

// 2. ALSO ADD STYLES TO styles.css & public/styles.css to elevate modal look across Admin & Bank
const stylesCssFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\styles.css',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\styles.css',
];

const STYLES_MODAL_CSS = `
/* Modern Surge Modal Polish */
.surge-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 28, 55, 0.72) !important;
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
  z-index: 100000 !important;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}
.surge-modal-backdrop.open {
  display: flex !important;
}
.surge-modal-window {
  background: #ffffff !important;
  border-radius: 10px !important;
  border: none !important;
  box-shadow: 0 24px 50px -12px rgba(11, 60, 117, 0.35), 0 0 0 1px rgba(11, 60, 117, 0.08) !important;
  max-width: 620px !important;
  overflow: hidden !important;
}
.surge-modal-header {
  background: linear-gradient(135deg, #0B3C75 0%, #082A52 100%) !important;
  border-bottom: 3px solid #B3262E !important;
  padding: 16px 22px !important;
  color: #fff !important;
}
.surge-modal-header h3 {
  color: #fff !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  font-size: 16.5px !important;
  font-weight: 700 !important;
}
.surge-modal-close {
  background: rgba(255, 255, 255, 0.12) !important;
  border-radius: 6px !important;
  width: 32px !important;
  height: 32px !important;
  color: #fff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.surge-modal-close:hover {
  background: #B3262E !important;
  color: #fff !important;
}
.surge-modal-footer {
  background: #F8FAFC !important;
  border-top: 1px solid #E2E8F0 !important;
  padding: 14px 24px !important;
}
`;

for (const f of stylesCssFiles) {
  let css = fs.readFileSync(f, 'utf8');
  if (!css.includes('/* Modern Surge Modal Polish */')) {
    css += '\n' + STYLES_MODAL_CSS;
    fs.writeFileSync(f, css, 'utf8');
    console.log('✅ Added modal polish to', f);
  }
}

// 3. FIX HTML FILES: ENSURE modal-backdrop has style="display:none"
const htmlFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\marketplace.html',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\marketplace.html',
  'C:\\Users\\kimat\\Desktop\\Listings\\index.html',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\index.html',
];

for (const f of htmlFiles) {
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('<div class="surge-modal-backdrop" id="modal-backdrop">')) {
    html = html.replace(
      '<div class="surge-modal-backdrop" id="modal-backdrop">',
      '<div class="surge-modal-backdrop" id="modal-backdrop" style="display:none">'
    );
    fs.writeFileSync(f, html, 'utf8');
    console.log('✅ Fixed modal-backdrop style in', f);
  }
}

// 4. IMPROVE MODALS IN app.js & public/app.js:
// Make sure UI.modal sets mb.style.display = 'flex' and UI.closeModal sets mb.style.display = 'none'
// And add backdrop click listener to dismiss modal
const jsFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\app.js',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\app.js',
];

for (const f of jsFiles) {
  let js = fs.readFileSync(f, 'utf8');

  // UI.modal update
  const oldModalFn = `  modal(title, bodyHtml, footerHtml, wide) {
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
  },`;

  const newModalFn = `  modal(title, bodyHtml, footerHtml, wide) {
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
    mb.style.display = 'flex';
    if (!mb._clickWired) {
      mb.addEventListener('click', (e) => {
        if (e.target === mb) UI.closeModal();
      });
      mb._clickWired = true;
    }
  },
  closeModal() {
    const mb = document.getElementById('modal-backdrop');
    if (mb) {
      mb.classList.remove('open');
      mb.style.display = 'none';
    }
  },`;

  if (js.includes(oldModalFn)) {
    js = js.replace(oldModalFn, newModalFn);
    console.log('✅ Updated UI.modal and UI.closeModal in', f);
  } else {
    console.log('ℹ️  UI.modal already updated or using different pattern in', f);
  }

  // Also enhance PublicMarket.enquiry modal markup
  const oldEnquiry = `  enquiry(id) {
    const a = Store.getAsset(id) || {};
    UI.modal('Submit Asset Enquiry', \`
      <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">Enquiry on <b>\${UI.escapeHtml(a.ref || '')}</b> (\${UI.escapeHtml(a.assetType || a.title || 'Asset')}). A Surge recovery specialist will reply within 4 hours.</p>
      <div class="field"><span class="lbl">Full Name <span class="req">*</span></span><div class="ctl"><input id="enq-name" style="width:100%" placeholder="Your legal name"></div></div>
      <div class="field"><span class="lbl">Phone Number <span class="req">*</span></span><div class="ctl"><input id="enq-phone" style="width:100%" placeholder="+233 24 000 0000"></div></div>
      <div class="field"><span class="lbl">Email Address <span class="req">*</span></span><div class="ctl"><input id="enq-email" style="width:100%" placeholder="you@domain.com"></div></div>
      <div class="field"><span class="lbl">Message</span><div class="ctl"><textarea id="enq-msg" style="width:100%;min-height:90px" placeholder="Specify your budget range, questions about title, or request for site survey"></textarea></div></div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.submitEnquiry('\${id}')">Submit Enquiry</button>\`);
  },`;

  const newEnquiry = `  enquiry(id) {
    const a = Store.getAsset(id) || {};
    UI.modal('Submit Asset Enquiry', \`
      <div class="modal-asset-strip">
        <span class="m-tag">\${UI.escapeHtml(a.ref || 'ASSET')} &middot; \${UI.escapeHtml(a.assetType || a.category || 'Listing')}</span>
        <p>Enquiry regarding <b>\${UI.escapeHtml(a.title || a.ref || 'Asset')}</b>. A Surge asset recovery specialist will review and reply within 4 hours.</p>
      </div>
      <div class="field">
        <label class="lbl" for="enq-name">Full Name <span class="req">*</span></label>
        <div class="ctl"><input id="enq-name" placeholder="Your full legal name"></div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="enq-phone">Phone Number <span class="req">*</span></label>
          <div class="ctl"><input id="enq-phone" placeholder="+233 24 000 0000"></div>
        </div>
        <div class="field">
          <label class="lbl" for="enq-email">Email Address <span class="req">*</span></label>
          <div class="ctl"><input id="enq-email" type="email" placeholder="you@domain.com"></div>
        </div>
      </div>
      <div class="field">
        <label class="lbl" for="enq-msg">Message / Specific Questions</label>
        <div class="ctl"><textarea id="enq-msg" placeholder="Specify your budget range, questions about title verification, or request for site survey..."></textarea></div>
      </div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.submitEnquiry('\${id}')">Submit Enquiry</button>\`);
  },`;

  if (js.includes(oldEnquiry)) {
    js = js.replace(oldEnquiry, newEnquiry);
    console.log('✅ Elevated PublicMarket.enquiry modal markup in', f);
  }

  // Also enhance PublicMarket.requestViewing modal markup
  const oldViewing = `  requestViewing(id) {
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
  },`;

  const newViewing = `  requestViewing(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    UI.modal('Schedule Supervised Site Viewing', \`
      <div class="modal-asset-strip">
        <span class="m-tag">\${UI.escapeHtml(a.ref)} &middot; \${UI.escapeHtml(a.assetType || a.title)}</span>
        <p>Viewing appointment for <b>\${UI.escapeHtml(a.ref)}</b> at \${UI.escapeHtml(a.publicLocation || 'Site')}. Surge security and recovery officers will accompany you.</p>
      </div>
      <div class="field">
        <label class="lbl" for="vw-name">Full Legal Name <span class="req">*</span></label>
        <div class="ctl"><input id="vw-name" placeholder="Your full legal name as on Ghana Card"></div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="vw-phone">Phone Number <span class="req">*</span></label>
          <div class="ctl"><input id="vw-phone" placeholder="+233 24 000 0000"></div>
        </div>
        <div class="field">
          <label class="lbl" for="vw-email">Email Address</label>
          <div class="ctl"><input id="vw-email" type="email" placeholder="buyer@example.com"></div>
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="vw-date">Preferred Date <span class="req">*</span></label>
          <div class="ctl"><input type="date" id="vw-date" value="\${tomorrow}"></div>
        </div>
        <div class="field">
          <label class="lbl" for="vw-time">Time Slot <span class="req">*</span></label>
          <div class="ctl">
            <select id="vw-time">
              <option>Morning (09:00 - 12:00 GMT)</option>
              <option>Afternoon (13:00 - 16:00 GMT)</option>
              <option>Late Afternoon (16:00 - 17:30 GMT)</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="lbl" for="vw-id">Ghana Card PIN (Optional)</label>
        <div class="ctl"><input id="vw-id" placeholder="GHA-XXXXXXXXX-X"></div>
      </div>
      <div class="field">
        <label class="lbl" for="vw-notes">Surveyor Details / Access Requirements</label>
        <div class="ctl"><textarea id="vw-notes" placeholder="Accompanying surveyor details, technical inspection requests, or access notes..."></textarea></div>
      </div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.submitViewing('\${id}')">Confirm Viewing Request</button>\`);
  },`;

  if (js.includes(oldViewing)) {
    js = js.replace(oldViewing, newViewing);
    console.log('✅ Elevated PublicMarket.requestViewing modal markup in', f);
  }

  // Also enhance PublicMarket.submitOffer modal markup
  const oldOffer = `  submitOffer(id) {
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
        <div class="field"><span class="lbl">Offer Amount (GHâ‚µ) <span class="req">*</span></span><div class="ctl"><input type="number" id="of-amount" value="\${minOffer}" style="width:100%"></div></div>
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
  },`;

  const newOffer = `  submitOffer(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const minOffer = a.minimum_offer || a.reserve || 0;
    UI.modal('Submit Formal Purchase Offer', \`
      <div class="modal-asset-strip">
        <span class="m-tag">\${UI.escapeHtml(a.ref)} &middot; \${UI.escapeHtml(a.assetType || a.title)}</span>
        <p>Formal purchase offer on <b>\${UI.escapeHtml(a.ref)}</b>. Timestamped and submitted directly to the recovery bank committee under Act 1044.</p>
      </div>
      <div class="field">
        <label class="lbl" for="of-name">Buyer Full Legal Name <span class="req">*</span></label>
        <div class="ctl"><input id="of-name" placeholder="Legal purchaser or corporate legal name"></div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="of-phone">Phone Number <span class="req">*</span></label>
          <div class="ctl"><input id="of-phone" placeholder="+233 24 000 0000"></div>
        </div>
        <div class="field">
          <label class="lbl" for="of-email">Email Address <span class="req">*</span></label>
          <div class="ctl"><input id="of-email" type="email" placeholder="buyer@example.com"></div>
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="of-amount">Offer Amount (GH₵) <span class="req">*</span></label>
          <div class="ctl"><input type="number" id="of-amount" value="\${minOffer}"></div>
        </div>
        <div class="field">
          <label class="lbl" for="of-payment">Payment Method <span class="req">*</span></label>
          <div class="ctl">
            <select id="of-payment">
              <option>Cash / Direct Bank Transfer (Escrow)</option>
              <option>Bank Mortgage / Pre-Approved Facility</option>
              <option>Staged Structured Settlement (30/60/90 Days)</option>
            </select>
          </div>
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label class="lbl" for="of-ghana-card">Ghana Card PIN <span class="req">*</span></label>
          <div class="ctl"><input id="of-ghana-card" placeholder="GHA-XXXXXXXXX-X"></div>
        </div>
        <div class="field">
          <label class="lbl" for="of-validity">Offer Validity <span class="req">*</span></label>
          <div class="ctl">
            <select id="of-validity">
              <option value="14">14 Business Days</option>
              <option value="30" selected>30 Calendar Days</option>
              <option value="60">60 Calendar Days</option>
            </select>
          </div>
        </div>
      </div>
    \`, \`<button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn p" onclick="PublicMarket.confirmOffer('\${id}')">Submit Binding Offer</button>\`);
  },`;

  if (js.includes(oldOffer)) {
    js = js.replace(oldOffer, newOffer);
    console.log('✅ Elevated PublicMarket.submitOffer modal markup in', f);
  }

  fs.writeFileSync(f, js, 'utf8');
}

console.log('All updates complete.');
