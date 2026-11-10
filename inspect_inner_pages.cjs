const fs = require('fs');
const mockup = fs.readFileSync('surge-marketplace-mockup (1).html', 'utf8');

const howIdx = mockup.indexOf('function how()');
const goIdx = mockup.indexOf('function go(p)');
console.log(mockup.substring(howIdx, goIdx));
