const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');

console.log('Lines 7555 to 7585:');
console.log(lines.slice(7555, 7585).map((l, i) => (7556 + i) + ': ' + l).join('\n'));
