const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

// Find the exact old renderReadiness block
const startMarker = `    const rows = this.gateReadiness.gates.map(gate => {`;
const endMarker = `  renderGateItem(c, a) {`;
const startIdx = app.indexOf(startMarker);
const endIdx = app.indexOf(endMarker);
console.log('Block start:', startIdx);
console.log('Block end:', endIdx);
if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find block boundaries');
  process.exit(1);
}
// Print what we found
console.log('=== FOUND BLOCK ===');
console.log(app.substring(startIdx, endIdx));

