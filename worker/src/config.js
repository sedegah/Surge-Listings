// Session lifetime policy. Idle expiry slides on activity; the absolute cap does
// not, so a stolen cookie cannot be kept alive indefinitely by replaying it.
export const SESSION_COOKIE = '__Host-surge_session';
export const SESSION_TTL_HOURS = 8;
// Idle expiry slides on activity; the absolute cap does not, so a stolen
// cookie cannot be kept alive indefinitely by replaying it.
export const SESSION_ABSOLUTE_HOURS = 24;
export const REMEMBERED_ABSOLUTE_HOURS = 24 * 7;
