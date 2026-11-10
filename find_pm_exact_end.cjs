const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const endIdx = app.indexOf('Store.init();');
console.log('Snippet before Store.init():');
console.log(app.substring(endIdx - 500, endIdx + 50));
