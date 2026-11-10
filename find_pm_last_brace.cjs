const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const switcherIdx = app.lastIndexOf("document.querySelectorAll('.switcher button[data-app]').forEach");
console.log('switcher setup starts at:', switcherIdx);
console.log(app.substring(switcherIdx - 400, switcherIdx));
