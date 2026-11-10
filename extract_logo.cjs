const fs = require('fs');

const mockup = fs.readFileSync('surge-marketplace-mockup (1).html', 'utf8');
const match = mockup.match(/const LOGO\s*=\s*"(data:image\/png;base64,[^"]+)"/);
if (match) {
  const base64Data = match[1].replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('surge-logo.png', Buffer.from(base64Data, 'base64'));
  if (fs.existsSync('public')) {
    fs.writeFileSync('public/surge-logo.png', Buffer.from(base64Data, 'base64'));
  }
  console.log('Saved surge-logo.png, size:', fs.statSync('surge-logo.png').size);
} else {
  console.log('LOGO base64 not matched');
}
