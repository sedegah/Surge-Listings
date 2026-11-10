const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

// Find the section with renderReview gate content
const reviewGatesIdx = app.indexOf('Review Readiness Gates');
if (reviewGatesIdx === -1) { console.log('Not found'); process.exit(1); }

// Search backwards for a function/method definition
let searchBack = app.lastIndexOf('renderReview', reviewGatesIdx);
let searchBack2 = app.lastIndexOf('renderAssetReview', reviewGatesIdx);
let searchBack3 = app.lastIndexOf('renderReadiness', reviewGatesIdx);

console.log('renderReview:', searchBack);
console.log('renderAssetReview:', searchBack2);
console.log('renderReadiness:', searchBack3);

// Find the full context
console.log('\n=== Context around Review Readiness Gates ===');
console.log(app.substring(reviewGatesIdx - 1500, reviewGatesIdx + 2000));

