const fs = require('fs');

// ─── 1. REDESIGN CSS (tabs + gate cards + font) ───────────────────────────────
const cssFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\styles.css',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\styles.css',
];

const OLD_TAB_CSS = `.tabs-inner {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #CBD5E1;
  margin: 0 0 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}
.tab-inner {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #F1F5F9;
  color: var(--text-2);
  border: 1px solid #CBD5E1;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all .15s ease;
  position: relative;
  top: 1px;
}
.tab-inner:hover {
  background: #E2E8F0;
  color: var(--text);
}
.tab-inner.active {
  background: #FFFFFF;
  color: var(--blue);
  font-weight: 700;
  border-color: #CBD5E1;
  border-top: 2px solid var(--blue);
  border-bottom: 1px solid #FFFFFF;
  padding-top: 5px;
}
.tab-inner .pill {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 10px;
  background: #E2E8F0;
  color: var(--text-2);
  font-weight: 600;
}
.tab-inner.active .pill {
  background: #E0EBF7;
  color: var(--blue);
}
.tab-inner .pill.ok {
  background: #D4EDDA;
  color: var(--success);
}
.tab-inner.active .pill.ok {
  background: #E0EBF7;
  color: var(--blue);
}`;

const NEW_TAB_CSS = `.tabs-inner {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #E2E8F0;
  margin: 0 0 20px;
  flex-wrap: wrap;
  align-items: flex-end;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
.tab-inner {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #64748B;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: color .15s ease, border-color .15s ease;
  position: relative;
  letter-spacing: 0.01em;
}
.tab-inner:hover {
  color: #0B3C75;
  background: #F8FAFC;
  border-radius: 4px 4px 0 0;
}
.tab-inner.active {
  background: transparent;
  color: #0B3C75;
  font-weight: 700;
  border-bottom: 2px solid #0B3C75;
}
.tab-inner .pill {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 20px;
  background: #E2E8F0;
  color: #64748B;
  font-weight: 600;
  line-height: 1.4;
}
.tab-inner.active .pill {
  background: #EBF0F9;
  color: #0B3C75;
}
.tab-inner .pill.ok {
  background: #DCFCE7;
  color: #16A34A;
}
.tab-inner.active .pill.ok {
  background: #EBF0F9;
  color: #0B3C75;
}
/* Gate review card styles */
.gate-review-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow .15s;
}
.gate-review-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,.08); }
.gate-review-card.gate-fail { border-left: 4px solid #B3262E; }
.gate-review-card.gate-pass { border-left: 4px solid #16A34A; }
.gate-review-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.gate-code-badge {
  background: #0B3C75;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  font-family: 'JetBrains Mono', Consolas, monospace;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}
.gate-review-name {
  font-weight: 600;
  font-size: 13.5px;
  color: #0F172A;
  font-family: 'Inter', system-ui, sans-serif;
}
.gate-review-detail {
  font-size: 12px;
  color: #64748B;
  margin-top: 3px;
  font-family: 'Inter', system-ui, sans-serif;
}
.gate-review-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.gate-status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  font-family: 'Inter', system-ui, sans-serif;
}
.gate-status-pill.pill-pass { background: #DCFCE7; color: #15803D; }
.gate-status-pill.pill-fail { background: #FEE2E2; color: #B91C1C; }
.gate-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.gate-revoke-section {
  margin-top: 20px;
  border: 1px solid #FDDBD9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(179,38,46,.06);
}
.gate-revoke-header {
  background: #FFF5F5;
  border-bottom: 1px solid #FDDBD9;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 12.5px;
  color: #B3262E;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', system-ui, sans-serif;
  letter-spacing: 0.01em;
}
.gate-revoke-body { padding: 16px 18px; background: #fff; }
.gate-revoke-body textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  resize: vertical;
  color: #0F172A;
  box-sizing: border-box;
  transition: border-color .15s;
}
.gate-revoke-body textarea:focus {
  outline: none;
  border-color: #0B3C75;
  box-shadow: 0 0 0 3px rgba(11,60,117,.1);
}`;

const GATE_INFO_BANNER = `/* Gate review info banner override */
.gate-info-banner {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  color: #1E40AF;
  font-size: 12.5px;
  padding: 12px 16px;
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.6;
}`;

for (const f of cssFiles) {
  let css = fs.readFileSync(f, 'utf8');

  // Replace tab styles
  if (css.includes(OLD_TAB_CSS)) {
    css = css.replace(OLD_TAB_CSS, NEW_TAB_CSS);
    console.log('✅ Replaced tab CSS in', f);
  } else {
    // Try a looser match on just the .tabs-inner block
    css = css.replace(
      /\.tabs-inner \{[\s\S]*?\.tab-inner\.active \.pill\.ok \{[\s\S]*?\}/,
      NEW_TAB_CSS
    );
    console.log('✅ (regex) Replaced tab CSS in', f);
  }

  // Add gate card CSS if not already present
  if (!css.includes('.gate-review-card')) {
    css += '\n' + GATE_INFO_BANNER;
    console.log('✅ Added gate card CSS to', f);
  }

  fs.writeFileSync(f, css, 'utf8');
}

// ─── 2. REDESIGN renderGateReviewTab in app.js files ─────────────────────────
const jsFiles = [
  'C:\\Users\\kimat\\Desktop\\Listings\\app.js',
  'C:\\Users\\kimat\\Desktop\\Listings\\public\\app.js',
];

const OLD_GATE_FN = `    const rows = this.gateReadiness.gates.map(gate => {
      const key = gate.gate.startsWith('LG-2') ? 'legal'
        : gate.gate.startsWith('TL-2') ? 'title'
          : gate.gate.startsWith('VL-1') ? 'valuation' : '';
      let action = \`<button class="btn small" onclick="AdminPortal.recheckGate('\${UI.escapeHtml(a.id)}')">Recheck</button>\`;
      if (key === 'legal') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open legal review</button>
          \${gate.passed ? \`<button class="btn small danger" onclick="AdminPortal.revokeLegalClearance('\${UI.escapeHtml(a.id)}')">Revoke gate</button>\` : ''}\`;
      } else if (key === 'title') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Review / reverify title</button>\`;
      } else if (key === 'valuation') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openAssetValuationReview('\${UI.escapeHtml(a.id)}')">Review / reverify valuation</button>\`;
      }
      return \`<tr>
        <td><b>\${UI.escapeHtml(gate.gate)}</b><div style="font-size:11px;color:var(--text-2);margin-top:4px">\${UI.escapeHtml(gate.detail || '')}</div></td>
        <td>\${UI.badge(gate.passed ? 'PASS' : 'FAIL')}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">\${action}</div></td>
      </tr>\`;
    }).join('');
    return \`
      <div class="page-head"><h2>Review Readiness Gates</h2>
        <span class="crumb">\${this.gateReadiness.gates.filter(gate => gate.passed).length}/\${this.gateReadiness.gates.length} passed · Live verification</span>
        <button class="btn small" onclick="AdminPortal.recheckGate('\${UI.escapeHtml(a.id)}')">Recheck all</button>
      </div>
      <div class="banner info"><div>Review each gate independently. Legal, title, and valuation decisions can be reopened and revoked; evidence-based gates are recalculated from verified records.</div></div>
      <div class="group"><div class="caption">Gate-by-gate review</div><div class="gridwrap"><table class="grid">
        <thead><tr><th>Gate and current evidence</th><th>Status</th><th>Review action</th></tr></thead>
        <tbody>\${rows || '<tr><td colspan="3" style="text-align:center;padding:20px">No readiness gates were returned for this asset.</td></tr>'}</tbody>
      </table></div></div>
      <div class="group"><div class="caption">Revoke legal clearance</div><div class="body">
        <textarea id="gate-review-notes" placeholder="Reason required to revoke legal clearance" style="width:100%;height:64px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:inherit;font-size:12.5px"></textarea>
      </div></div>\`;`;

const NEW_GATE_FN = `    const passedCount = this.gateReadiness.gates.filter(g => g.passed).length;
    const totalCount = this.gateReadiness.gates.length;
    const cards = this.gateReadiness.gates.map(gate => {
      const key = gate.gate.startsWith('LG-2') ? 'legal'
        : gate.gate.startsWith('TL-2') ? 'title'
          : gate.gate.startsWith('VL-1') ? 'valuation' : '';
      const codePart = gate.gate.split(' ')[0];
      const namePart = gate.gate.replace(/^[A-Z]+-\\d+\\s*/, '').trim();
      let action = \`<button class="btn small" onclick="AdminPortal.recheckGate('\${UI.escapeHtml(a.id)}')">↻ Recheck</button>\`;
      if (key === 'legal') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openSubPage('legal-review')">Open Legal Review</button>
          \${gate.passed ? \`<button class="btn small danger" onclick="AdminPortal.revokeLegalClearance('\${UI.escapeHtml(a.id)}')">Revoke Gate</button>\` : ''}\`;
      } else if (key === 'title') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openSubPage('title-verify')">Review / Reverify Title</button>\`;
      } else if (key === 'valuation') {
        action = \`<button class="btn small primary" onclick="AdminPortal.openAssetValuationReview('\${UI.escapeHtml(a.id)}')">Review / Reverify Valuation</button>\`;
      }
      return \`<div class="gate-review-card \${gate.passed ? 'gate-pass' : 'gate-fail'}">
        <div class="gate-review-left">
          <span class="gate-code-badge">\${UI.escapeHtml(codePart)}</span>
          <div>
            <div class="gate-review-name">\${UI.escapeHtml(namePart)}</div>
            \${gate.detail ? \`<div class="gate-review-detail">\${UI.escapeHtml(gate.detail)}</div>\` : ''}
          </div>
        </div>
        <div class="gate-review-right">
          <span class="gate-status-pill \${gate.passed ? 'pill-pass' : 'pill-fail'}">\${gate.passed ? 'PASS' : 'FAIL'}</span>
          <div class="gate-actions">\${action}</div>
        </div>
      </div>\`;
    }).join('');
    return \`
      <div class="page-head" style="margin-bottom:16px">
        <h2 style="font-family:'Inter',system-ui,sans-serif;font-size:17px;font-weight:700;color:#0F172A;margin:0">Review Readiness Gates</h2>
        <span class="crumb" style="font-family:'Inter',system-ui,sans-serif;font-size:12px;color:#64748B">\${passedCount}/\${totalCount} passed &middot; Live verification</span>
        <button class="btn small" onclick="AdminPortal.recheckGate('\${UI.escapeHtml(a.id)}')" style="margin-left:auto">↻ Recheck all</button>
      </div>
      <div class="gate-info-banner">
        <svg style="width:16px;height:16px;flex-shrink:0;margin-top:1px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>Review each gate independently. Legal, title, and valuation decisions can be reopened and revoked; evidence-based gates are recalculated from verified records.</span>
      </div>
      <div style="margin-bottom:24px">
        \${cards || '<div style="text-align:center;padding:32px;color:#64748B;font-family:Inter,sans-serif">No readiness gates were returned for this asset.</div>'}
      </div>
      <div class="gate-revoke-section">
        <div class="gate-revoke-header">
          <svg style="width:15px;height:15px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Revoke Legal Clearance
        </div>
        <div class="gate-revoke-body">
          <textarea id="gate-review-notes" placeholder="A reason is required to revoke legal clearance. This action is logged and audited."></textarea>
          <div style="margin-top:10px;display:flex;justify-content:flex-end">
            <button class="btn danger small" onclick="AdminPortal.revokeLegalClearance('\${UI.escapeHtml(a.id)}')">Revoke Legal Clearance</button>
          </div>
        </div>
      </div>\`;`;

for (const f of jsFiles) {
  let js = fs.readFileSync(f, 'utf8');
  if (js.includes('const rows = this.gateReadiness.gates.map(gate => {')) {
    js = js.replace(OLD_GATE_FN, NEW_GATE_FN);
    console.log('✅ Replaced renderGateReviewTab body in', f);
  } else {
    console.log('⚠️  Could not find exact target in', f, '— trying regex...');
    js = js.replace(
      /const rows = this\.gateReadiness\.gates\.map\(gate => \{[\s\S]*?<\/div><\/div>\`\;/,
      NEW_GATE_FN
    );
    console.log('✅ (regex) Replaced in', f);
  }
  fs.writeFileSync(f, js, 'utf8');
}

console.log('\nAll done.');
