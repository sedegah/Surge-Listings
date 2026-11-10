const fs = require('fs');

const mockup = fs.readFileSync('surge-marketplace-mockup (1).html', 'utf8');

// Find all function names
const funcs = mockup.match(/function\s+[a-zA-Z0-9_]+/g);
console.log('Functions in mockup:', funcs);
