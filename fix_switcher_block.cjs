const fs = require('fs');

const appFiles = ['app.js', 'public/app.js'];

for (const file of appFiles) {
  let code = fs.readFileSync(file, 'utf8');

  // Fix the switcher block
  const brokenSnippet = `document.querySelectorAll('.switcher button[data-app]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.app').forEach(a => a.classList.remove('active'));
    const target = document.getElementById('app-' + btn.dataset.app);
    if (target) target.classList.add('active');
    if (btn.dataset.app === 'public') PublicMarket.render();
    if (btn.dataset.app === 'bank') BankPortal.render();
    if (btn.dataset.app === 'admin') AdminPortal.render();
  });
});`;

  const fixedSnippet = `// ============================================================
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
});`;

  code = code.replace(brokenSnippet, fixedSnippet);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed switcher block in', file);
}
