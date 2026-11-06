/**
 * AI Daily Quota & Request Size Protection Manager
 * Enforces per-user and per-guest daily limits to prevent cost explosion and token draining.
 */

const MAX_REQUEST_SIZE_BYTES = 25 * 1024; // 25 KB max request body size
const DEFAULT_DAILY_QUOTA_GUEST = 5; // 5 AI requests per day for unauthenticated guest IP
const DEFAULT_DAILY_QUOTA_FREE = 35; // 35 AI requests per day for standard logged-in users
const DEFAULT_DAILY_QUOTA_ADMIN = 500; // 500 AI requests per day for admin/power users

// In-memory fallback for daily quota (keyed by user ID or guest IP)
const localDailyQuotaStore = new Map();

function getTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

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
 * Checks request size and daily AI quota.
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

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isGuest = !userId;

  // Never rely on a process-wide development flag: Vitest may load the Vite
  // plugin in the same process. The header is added exclusively by our local
  // Vite middleware immediately before it invokes an API handler.
  const isLocalDevelopment =
    req?.headers?.['x-kaiwa-local-dev'] === 'true' ||
    req?.headers?.get?.('x-kaiwa-local-dev') === 'true';
  const maxQuota = isAdmin
    ? DEFAULT_DAILY_QUOTA_ADMIN
    // Local Vite testing has no durable quota store. Give guests the same
    // bounded allowance as signed-in users so a short test session does not
    // lock the coach after its first few turns. Production is unchanged.
    : isLocalDevelopment
      ? DEFAULT_DAILY_QUOTA_FREE
    : isGuest
      ? DEFAULT_DAILY_QUOTA_GUEST
      : DEFAULT_DAILY_QUOTA_FREE;

  const todayStr = getTodayKey();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const targetIdentifier = isGuest ? `guest:${extractClientIp(req)}` : `user:${userId}`;
  const quotaKey = `quota:ai:${targetIdentifier}:${todayStr}`;

  // 1. If Redis is available, check and increment atomic daily count
  if (redisUrl && redisToken) {
    try {
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', quotaKey],
          ['EXPIRE', quotaKey, 86400, 'NX'], // 24 hours
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const currentCount = results[0]?.result || 1;

        if (currentCount > maxQuota) {
          return {
            allowed: false,
            remainingQuota: 0,
            reason: isGuest
              ? `Mehmon sifatida kunlik bepul AI so'rovlar limitingiz (${maxQuota} ta) tugadi. O'rganishni davom ettirish uchun bepul ro'yxatdan o'ting yoki tizimga kiring.`
              : `Bugungi kunlik AI so'rovlar limitingiz (${maxQuota} ta) tugadi. Ertaga qayta urinib ko'ring yoki hisobingizni yangilang.`,
          };
        }

        return {
          allowed: true,
          remainingQuota: Math.max(0, maxQuota - currentCount),
        };
      }
    } catch (e) {
      console.warn('[Quota] Upstash Redis quota check failed, falling back to memory store:', e?.message);
    }
  }

  // 2. In-memory fallback
  const memoryKey = `${targetIdentifier}:${todayStr}`;
  const currentCount = (localDailyQuotaStore.get(memoryKey) || 0) + 1;
  localDailyQuotaStore.set(memoryKey, currentCount);

  if (currentCount > maxQuota) {
    return {
      allowed: false,
      remainingQuota: 0,
      reason: isGuest
        ? `Mehmon sifatida kunlik bepul AI so'rovlar limitingiz (${maxQuota} ta) tugadi. O'rganishni davom ettirish uchun bepul ro'yxatdan o'ting yoki tizimga kiring.`
        : `Bugungi kunlik AI so'rovlar limitingiz (${maxQuota} ta) tugadi. Ertaga qayta urinib ko'ring yoki hisobingizni yangilang.`,
    };
  }

  return {
    allowed: true,
    remainingQuota: Math.max(0, maxQuota - currentCount),
  };
}
