const fs = require('fs');
const mockup = fs.readFileSync('surge-marketplace-mockup (1).html', 'utf8');

const faqIdx = mockup.indexOf('const FAQ=');
console.log(mockup.substring(faqIdx, faqIdx + 1500));
