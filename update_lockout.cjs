// update_lockout.cjs — Implement real server-side account lockouts
const fs = require('fs');
let src = fs.readFileSync('worker/index.js', 'utf8');
const hadCRLF = src.includes('\r\n');
if (hadCRLF) src = src.replace(/\r\n/g, '\n');

let patchCount = 0;
function replace(label, target, replacement) {
  if (!src.includes(target)) {
    console.error('MISS: ' + label);
    const first50 = target.slice(0, 80).trim();
    const idx = src.indexOf(first50);
    if (idx >= 0) {
      console.error('  Found start at offset', idx);
      console.error('  Actual:', JSON.stringify(src.slice(idx, idx + 300)));
    } else {
      console.error('  Cannot find even:', JSON.stringify(first50));
    }
    process.exit(1);
  }
  src = src.replace(target, replacement);
  patchCount++;
  console.log('OK: ' + label);
}

// =========================================================
// 1. Replace checkLoginRateLimit to also check users.locked_until
// =========================================================
replace(
  'Replace checkLoginRateLimit with lockout-aware version',

  `    // Lock an account after repeated failures and throttle abusive source IPs.
    async function checkLoginRateLimit(username, ipAddress) {
      const [accountAttempts, ipAttempts] = await Promise.all([
        env.DB.prepare(\`
        SELECT COUNT(*) as c FROM login_attempts
        WHERE username = ? AND success = 0
          AND datetime(attempted_at) >= datetime('now', '-15 minutes')
      \`).bind(username).first(),
        env.DB.prepare(\`
        SELECT COUNT(*) as c FROM login_attempts
        WHERE ip_address = ? AND success = 0
          AND datetime(attempted_at) >= datetime('now', '-15 minutes')
      \`).bind(ipAddress).first()
      ]);
      return {
        accountLocked: Number(accountAttempts?.c || 0) >= 5,
        ipRateLimited: Number(ipAttempts?.c || 0) >= 20
      };
    }`,

  `    // Lock an account after repeated failures and throttle abusive source IPs.
    async function checkLoginRateLimit(username, ipAddress) {
      const [accountAttempts, ipAttempts, userRow] = await Promise.all([
        env.DB.prepare(\`
        SELECT COUNT(*) as c FROM login_attempts
        WHERE username = ? AND success = 0
          AND datetime(attempted_at) >= datetime('now', '-15 minutes')
      \`).bind(username).first(),
        env.DB.prepare(\`
        SELECT COUNT(*) as c FROM login_attempts
        WHERE ip_address = ? AND success = 0
          AND datetime(attempted_at) >= datetime('now', '-15 minutes')
      \`).bind(ipAddress).first(),
        env.DB.prepare(\`
        SELECT locked_until FROM users WHERE (username = ? OR email = ?)
      \`).bind(username, username).first()
      ]);
      const failCount = Number(accountAttempts?.c || 0);
      const maxAttempts = 5;
      let hardLocked = false;
      let lockMinutesLeft = 0;
      if (userRow?.locked_until) {
        const lockEnd = new Date(userRow.locked_until + (userRow.locked_until.endsWith('Z') ? '' : 'Z'));
        const now = new Date();
        if (lockEnd > now) {
          hardLocked = true;
          lockMinutesLeft = Math.ceil((lockEnd - now) / 60000);
        }
      }
      return {
        accountLocked: hardLocked || failCount >= maxAttempts,
        ipRateLimited: Number(ipAttempts?.c || 0) >= 20,
        failCount,
        attemptsRemaining: Math.max(0, maxAttempts - failCount),
        lockMinutesLeft: hardLocked ? lockMinutesLeft : (failCount >= maxAttempts ? 15 : 0)
      };
    }

    async function lockUserAccount(username) {
      try {
        await env.DB.prepare(\`
          UPDATE users SET locked_until = datetime('now', '+15 minutes')
          WHERE (username = ? OR email = ?) AND (locked_until IS NULL OR datetime(locked_until) <= datetime('now'))
        \`).bind(username, username).run();
      } catch (e) {}
    }

    async function clearUserLock(userId) {
      try {
        await env.DB.prepare(\`UPDATE users SET locked_until = NULL WHERE id = ?\`).bind(userId).run();
      } catch (e) {}
    }`
);

// =========================================================
// 2. Replace the login rate limit check response
// =========================================================
replace(
  'Login: return lockout details in 429 response',
  `        const loginLimits = await checkLoginRateLimit(lockoutUsername, ipAddress);
        if (loginLimits.accountLocked || loginLimits.ipRateLimited) {
          return err('Too many sign-in attempts. Wait 15 minutes before trying again.', 429);
        }`,

  `        const loginLimits = await checkLoginRateLimit(lockoutUsername, ipAddress);
        if (loginLimits.accountLocked || loginLimits.ipRateLimited) {
          const mins = loginLimits.lockMinutesLeft || 15;
          return new Response(JSON.stringify({
            success: false,
            error: 'This account has been temporarily locked after too many failed sign-in attempts. Try again in ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.',
            locked: true,
            lockMinutesLeft: mins
          }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }`
);

// =========================================================
// 3. Replace wrong-password failure
// =========================================================
replace(
  'Login: wrong password returns attemptsRemaining + triggers lockout',
  `        if (!validPassword) {
          await recordFailure('WRONG_PASSWORD');
          return err('The username or password is incorrect.', 401);
        }`,

  `        if (!validPassword) {
          await recordFailure('WRONG_PASSWORD');
          const updatedLimits = await checkLoginRateLimit(lockoutUsername, ipAddress);
          if (updatedLimits.attemptsRemaining <= 0) {
            await lockUserAccount(lockoutUsername);
            return new Response(JSON.stringify({
              success: false,
              error: 'This account has been locked after too many failed sign-in attempts. Try again in 15 minutes.',
              locked: true, lockMinutesLeft: 15, attemptsRemaining: 0
            }), { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({
            success: false,
            error: 'The username or password is incorrect. ' + updatedLimits.attemptsRemaining + ' attempt' + (updatedLimits.attemptsRemaining === 1 ? '' : 's') + ' remaining.',
            attemptsRemaining: updatedLimits.attemptsRemaining
          }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }`
);

// =========================================================
// 4. Clear lock on successful login
// =========================================================
replace(
  'Login: clear lock on successful login',
  `        // Record success & update last_login
        await env.DB.prepare(\`INSERT INTO login_attempts (id, username, ip_address, success, attempted_at) VALUES (?, ?, ?, 1, datetime('now'))\`)
          .bind(randomId(), uname, ipAddress).run();
        await env.DB.prepare(\`UPDATE users SET last_login = datetime('now') WHERE id = ?\`).bind(user.id).run();`,

  `        // Record success, clear lockout & update last_login
        await env.DB.prepare(\`INSERT INTO login_attempts (id, username, ip_address, success, attempted_at) VALUES (?, ?, ?, 1, datetime('now'))\`)
          .bind(randomId(), uname, ipAddress).run();
        await clearUserLock(user.id);
        await env.DB.prepare(\`UPDATE users SET last_login = datetime('now'), locked_until = NULL WHERE id = ?\`).bind(user.id).run();`
);

// =========================================================
// 5. Add admin unlock endpoint after the user delete block
// =========================================================
replace(
  'Add admin unlock endpoint after user delete',
  "        return json({ success: true, message: `Staff account @${target.username} was deleted.` });\n      }\n",

  `        return json({ success: true, message: \`Staff account @\${target.username} was deleted.\` });
      }

      // PUT /api/admin/users/:id/unlock - Admin unlock a locked account
      const unlockUserMatch = pathname.match(/^\\/api\\/admin\\/users\\/([^\\/]+)\\/unlock$/);
      if (unlockUserMatch && method === 'PUT') {
        const session = await requireAdminAuth();
        const targetId = unlockUserMatch[1];
        const target = await env.DB.prepare(\`SELECT id, username, full_name, locked_until, status FROM users WHERE id = ?\`).bind(targetId).first();
        if (!target) return err('User not found.', 404);
        await env.DB.batch([
          env.DB.prepare(\`UPDATE users SET locked_until = NULL WHERE id = ?\`).bind(targetId),
          env.DB.prepare(\`DELETE FROM login_attempts WHERE username = ? AND success = 0 AND datetime(attempted_at) >= datetime('now', '-15 minutes')\`).bind(target.username)
        ]);
        await auditLog(session.full_name, session.role_code, session.organization_name || 'Surge Solutions', 'UNLOCK_USER', 'User', target.full_name, 'Account unlocked by administrator');
        return json({ success: true, message: target.full_name + '\\'s account has been unlocked.' });
      }

`
);

// =========================================================
// 6. Add locked_until to user listing SELECT
// =========================================================
replace(
  'User listing: include locked_until',
  `           SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
                 u.status, u.mfa_enabled, u.last_login, u.created_at,`,
  `           SELECT u.id, u.organization_id, u.bank_id, u.branch_id, u.username, u.full_name, u.email, u.role_code,
                 u.status, u.locked_until, u.mfa_enabled, u.last_login, u.created_at,`
);

// Restore line endings
if (hadCRLF) src = src.replace(/\n/g, '\r\n');
fs.writeFileSync('worker/index.js', src, 'utf8');
console.log('\n=== All ' + patchCount + ' worker patches applied ===');
