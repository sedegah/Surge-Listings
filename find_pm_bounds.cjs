const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');

const startIdx = app.indexOf('const PublicMarket = {');
console.log('PublicMarket start:', startIdx);

const endIdx = app.indexOf('const bodyPortal = document.body ? document.body.dataset.portal : null;');
console.log('PublicMarket end:', endIdx);

console.log('Snippet at end:');
console.log(app.substring(endIdx - 100, endIdx + 150));
