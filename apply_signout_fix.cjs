const fs = require('fs');

const files = ['admin.html', 'bank.html', 'public/admin.html', 'public/bank.html'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');

  // 1. Remove .menu-signout button
  html = html.replace(/<button class="menu-signout"[\s\S]*?<\/button>\s*/g, '');

  // 2. Put switcher-signout at far right end of .switcher
  const signoutBtn = `<button class="switcher-signout" type="button" onclick="Auth.logout()" aria-label="Sign out">
    <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
    <span>Sign out</span>
  </button>`;

  // First remove any existing switcher-signout button if present
  html = html.replace(/<button class="switcher-signout"[\s\S]*?<\/button>\s*/g, '');

  // Insert before </nav> in .switcher
  html = html.replace(/(<nav class="switcher">[\s\S]*?)(<\/nav>)/, (match, p1, p2) => {
    // clean up any trailing whitespace before </nav>
    return p1.trimEnd() + '\n  ' + signoutBtn + '\n</nav>';
  });

  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated signout in', file);
}

// Update styles.css and public/styles.css
const cssFiles = ['styles.css', 'public/styles.css'];
for (const file of cssFiles) {
  if (!fs.existsSync(file)) continue;
  let css = fs.readFileSync(file, 'utf8');

  const targetSignout = /\.switcher \.switcher-signout, \.switcher \.switcher-signout:link[\s\S]*?\.switcher \.switcher-signout \.ico \{[^}]*\}/;
  const newSignout = `.switcher .switcher-signout, .switcher .switcher-signout:link, .switcher .switcher-signout:visited {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  margin-right: 0;
  padding: 4px 11px;
  border: 1px solid rgba(224, 85, 92, 0.45);
  border-radius: 4px;
  background: rgba(224, 85, 92, 0.08);
  color: #F08B90 !important;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}
.switcher .switcher-signout:hover {
  background: #B3262E;
  border-color: #B3262E;
  color: #FFFFFF !important;
}
.switcher .switcher-signout .ico {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}`;

  if (targetSignout.test(css)) {
    css = css.replace(targetSignout, newSignout);
  } else {
    css = newSignout + '\n' + css;
  }

  fs.writeFileSync(file, css, 'utf8');
  console.log('Updated css in', file);
}
