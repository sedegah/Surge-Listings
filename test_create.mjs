import https from 'https';
import { execSync } from 'child_process';

const token = 'test-token-' + Date.now();
execSync(`npx wrangler d1 execute surge-solutions-db --remote --command "INSERT INTO sessions (id, user_id, organization_id, role_code, scope, bank_id, created_at, expires_at, revoked, secret_hash) VALUES ('${token}', 'u-sedegah', 'org-surge', 'SA', 'surge', 'bank-surge', datetime('now'), datetime('now', '+1 day'), 0, NULL);"`);

console.log('Inserted session token:', token);

const req1 = https.request('https://surge-solutions-api.sedegahkimathi.workers.dev/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Origin': 'https://surge-listings.vercel.app'
  }
}, (res1) => {
  let meBody = '';
  res1.on('data', c => meBody += c);
  res1.on('end', () => {
    console.log('Step 1 status:', res1.statusCode);
    const setCookie = res1.headers['set-cookie'];
    console.log('Set-Cookie raw:', setCookie);
    const cookieHeader = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    console.log('Cookie header to send:', cookieHeader);

    const payload = JSON.stringify({
      branchId: null,
      ownershipType: 'surge',
      ownerBankId: '',
      ownerName: 'Surge Solutions',
      categoryCode: 'House',
      assetType: 'Executive Villa',
      reservePrice: 3500000
    });

    const req2 = https.request('https://surge-solutions-api.sedegahkimathi.workers.dev/api/v1/assets', {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Origin': 'https://surge-listings.vercel.app',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res2) => {
      let body = '';
      res2.on('data', c => body += c);
      res2.on('end', () => {
        console.log('Step 2 POST /api/v1/assets Status:', res2.statusCode);
        console.log('Step 2 Response Body:', body);
      });
    });
    req2.write(payload);
    req2.end();
  });
});
req1.end();
