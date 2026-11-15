/**
 * AI Request Protection Manager
 * All daily quota limits have been completely removed across all tiers (guest, user, admin)
 * to provide unlimited access throughout the application.
 */

export const MAX_REQUEST_SIZE_BYTES = 25 * 1024; // 25 KB max request body size
export const LOCAL_QUOTA_REQUEST = Symbol.for('kaiwa.localQuotaRequest');

export function extractClientIp(req) {
  let clientIp = 'unknown_ip';
  if (req && typeof req.headers?.get === 'function') {
    clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown_ip';
  } else if (req && req.headers) {
    clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
  }
  return clientIp.split(',')[0].trim();
}

/**
 * Checks request size. All daily AI quotas are removed (unlimited access for all users/guests/admins).
 * Returns { allowed: boolean, remainingQuota: number, reason?: string }
 */
export async function checkDailyQuota(userId, userRole = 'user', bodyString = '', req = null) {
  if (bodyString && typeof bodyString === 'string' && bodyString.length > MAX_REQUEST_SIZE_BYTES) {
    return {
      allowed: false,
      remainingQuota: 0,
      reason: `So'rov hajmi ruxsat etilgan maksimal chegaradan (${Math.round(MAX_REQUEST_SIZE_BYTES / 1024)} KB) oshdi.`,
    };
  }

  // Quotas are fully removed for everyone (guests, registered users, and admins)
  return {
    allowed: true,
    remainingQuota: 999999,
  };
}
