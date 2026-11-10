const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');
const idx = app.indexOf('Review Readiness Gates');
// Find the renderReview function that contains this
const renderStart = app.lastIndexOf('renderReview(', idx);
const renderEnd = app.indexOf('\n  render', idx);
console.log('renderReview start:', renderStart, 'end:', renderEnd);
console.log(app.substring(renderStart, renderEnd));

