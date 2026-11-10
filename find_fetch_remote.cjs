const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async fetchRemote()')) {
    console.log('fetchRemote starts at line', i + 1);
    for (let j = i; j < i + 150; j++) {
      if (lines[j].includes('PublicMarket') || lines[j].includes('AdminPortal') || lines[j].includes('BankPortal')) {
        console.log('Line', j + 1, lines[j]);
      }
    }
    break;
  }
}
