const fs = require('fs');

for (const f of ['admin.html', 'bank.html', 'marketplace.html']) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const swIdx = content.indexOf('class="switcher"');
  if (swIdx !== -1) {
    const swEnd = content.indexOf('</nav>', swIdx);
    console.log('Switcher:\n', content.substring(swIdx - 11, swEnd + 6));
  }
  const m = content.match(/<button[^>]*signout[^>]*>[\s\S]*?<\/button>/gi);
  console.log('Signout buttons count:', m ? m.length : 0);
  if (m) m.forEach(b => console.log('Button:', b.replace(/\s+/g, ' ')));
}
