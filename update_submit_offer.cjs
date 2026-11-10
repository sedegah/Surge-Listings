const fs = require('fs');

const jsFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\app.js',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\app.js',
];

const newOffer = `  submitOffer(id) {
    const a = Store.getAsset(id);
    if (!a) return;
    const minOffer = a.minimum_offer || a.reserve || 0;
    UI.modal('Submit Formal Purchase Offer', \`
      <div class="modal-asset-strip">
        <span class="m-tag">\${UI.escapeHtml(a.ref)} &middot; \${UI.escapeHtml(a.assetType || a.title)}</span>
        <p>Formal purchase offer on <b>\${UI.escapeHtml(a.ref)}</b>. All offers are timestamped and submitted directly to the recovery bank committee under Act 1044.</p>
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

for (const f of jsFiles) {
  let js = fs.readFileSync(f, 'utf8');
  js = js.replace(/submitOffer\(id\)\s*\{[\s\S]*?confirmOffer\(\'\$\{id\}\'\)\">Submit Binding Offer<\/button>\`\);?\s*\},/, newOffer);
  fs.writeFileSync(f, js, 'utf8');
  console.log('✅ Updated submitOffer in', f);
}
