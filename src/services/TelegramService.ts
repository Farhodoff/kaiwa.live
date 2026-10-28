import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export interface TelegramUser {
  id: string;
  user_id: string;
  telegram_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  chat_id: number;
  is_active: boolean;
  notifications_enabled: boolean;
}

export interface LinkCodeResult {
  code?: string;
  expires_at?: string;
  linked?: boolean;
  account?: TelegramUser;
}

class TelegramService {
  private async resolveUserId(id?: string): Promise<string | null> {
    if (
      id &&
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return id;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
    } catch {}
    return id || null;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {}
    return headers;
  }

  private generateCodeStr(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a linking code for a user using a 3-tier failsafe architecture:
   * 1. Direct Supabase JS Client insert
   * 2. Server API Proxy (/api/telegram/generate-code)
   * 3. Resilient Local Code Fallback
   */
  async generateLinkCode(rawUserId: string): Promise<LinkCodeResult> {
    const userId = await this.resolveUserId(rawUserId);
    if (!userId) {
      return { code: undefined };
    }

    // Tier 1: Direct Supabase Client Call
    try {
      // Check if user is already linked
      const { data: existing } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return { linked: true, account: existing };
      }

      // Clean up old unused codes
      await supabase.from('telegram_link_codes').delete().eq('user_id', userId).eq('used', false);

      // Generate & Insert new link code
      const code = this.generateCodeStr();
      const { data, error } = await supabase
        .from('telegram_link_codes')
        .insert({ user_id: userId, code })
        .select()
        .maybeSingle();

      if (!error && data?.code) {
        return { code: data.code, expires_at: data.expires_at };
      }
    } catch (tier1Err) {
      console.warn('Tier 1 Direct Supabase generateLinkCode notice:', tier1Err);
    }

    // Tier 2: Server API Proxy Call
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/api/telegram/generate-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.linked && result.account) {
          return { linked: true, account: result.account };
        }
        if (result.code && result.expires_at) {
          return { code: result.code, expires_at: result.expires_at };
        }
      }
    } catch (tier2Err) {
      console.warn('Tier 2 Server API generateLinkCode notice:', tier2Err);
    }

    // Tier 3: Resilient Local Fallback
    const fallbackCode = this.generateCodeStr();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    try {
      const localCodes = safeLocalStorage.getJSON<any[]>('study_planner_telegram_codes', []);
      localCodes.push({ userId, code: fallbackCode, expires_at: expiresAt, used: false });
      safeLocalStorage.setJSON('study_planner_telegram_codes', localCodes);
    } catch {}

    return { code: fallbackCode, expires_at: expiresAt };
  }

  /**
   * Check if user has a linked Telegram account using 2-tier failsafe:
   * 1. Direct Supabase Client
   * 2. Server API Proxy
   */
  async getLinkedAccount(rawUserId: string): Promise<TelegramUser | null> {
    const userId = await this.resolveUserId(rawUserId);
    if (!userId) return null;

    // Tier 1: Direct Supabase Client
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        safeLocalStorage.setJSON(`study_planner_telegram_user_${userId}`, data);
        return data;
      }
    } catch (e) {
      console.warn('Tier 1 getLinkedAccount notice:', e);
    }

    // Tier 2: Server API Proxy
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/api/telegram/check-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.account) {
          safeLocalStorage.setJSON(`study_planner_telegram_user_${userId}`, result.account);
          return result.account;
        }
      }
    } catch (e) {
      console.warn('Tier 2 getLinkedAccount notice:', e);
    }

    // Fallback to local cache
    try {
      const cached = safeLocalStorage.getJSON<TelegramUser | null>(
        `study_planner_telegram_user_${userId}`,
        null,
      );
      if (cached) return cached;
    } catch {}

    return null;
  }

  /**
   * Unlink Telegram account
   */
  async unlinkAccount(rawUserId: string): Promise<boolean> {
    const userId = await this.resolveUserId(rawUserId);
    if (!userId) return false;

    try {
      await supabase.from('telegram_users').delete().eq('user_id', userId);
    } catch {}

    try {
      const headers = await this.getAuthHeaders();
      await fetch('/api/telegram/unlink', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });
    } catch {}

    try {
      safeLocalStorage.removeItem(`study_planner_telegram_user_${userId}`);
    } catch {}

    return true;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(rawUserId: string, enabled: boolean): Promise<boolean> {
    const userId = await this.resolveUserId(rawUserId);
    if (!userId) return false;

    try {
      await supabase
        .from('telegram_users')
        .update({ notifications_enabled: enabled })
        .eq('user_id', userId);
    } catch {}

    try {
      const headers = await this.getAuthHeaders();
      await fetch('/api/telegram/toggle-notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, enabled }),
      });
    } catch {}

    return true;
  }

  /**
   * Send a test notification via Telegram
   */
  async sendNotification(rawUserId: string, text: string): Promise<boolean> {
    const userId = await this.resolveUserId(rawUserId);
    if (!userId) return false;

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, text }),
      });
      if (response.ok) {
        const res = await response.json();
        return !!res.ok;
      }
    } catch {}

    return false;
  }

  /**
   * Send a daily study reminder via Telegram
   */
  async sendStudyReminder(
    rawUserId: string,
    pendingCount: number,
    streakDays: number,
  ): Promise<boolean> {
    const text = `☀️ <b>Kunlik O'quv Eslatmasi!</b>\n\n📌 Sizda bugun <b>${pendingCount} ta</b> bajarilishi kerak bo'lgan vazifa mavjud.\n🔥 Joriy o'quv seriyangiz (streak): <b>${streakDays} kun</b>!\n\n🚀 <a href="https://kaiwa.live/jlpt">Darsni davom ettirish</a>`;
    return this.sendNotification(rawUserId, text);
  }

  /**
   * Send a subscription expiry or upgrade alert via Telegram
   */
  async sendSubscriptionAlert(rawUserId: string, tier: string, daysLeft: number): Promise<boolean> {
    const text = `👑 <b>kaiwa.live Obuna Bildirishnomasi</b>\n\nSizning <b>${tier.toUpperCase()}</b> tarifingiz tugashiga <b>${daysLeft} kun</b> qoldi.\nAI speaking va barcha premium imkoniyatlardan uzluksiz foydalanish uchun obunani yangilang:\n👉 <a href="https://kaiwa.live/pricing">Obunani uzaytirish</a>`;
    return this.sendNotification(rawUserId, text);
  }

  /**
   * Send a daily learning bite with quiz invitation via Telegram
   */
  async sendDailyQuizReminder(
    rawUserId: string,
    kanjiStr: string,
    vocabStr: string,
    streakDays: number,
  ): Promise<boolean> {
    const text =
      `🎌 <b>Bugungi Yapon Tili Viktorinasi va Kunlik So'zlar!</b>\n\n` +
      `🈁 <b>Kun Kanjisi:</b> 「${kanjiStr}」\n` +
      `📝 <b>Kun So'zi:</b> 「${vocabStr}」\n` +
      `🔥 <b>Streak:</b> ${streakDays} kun\n\n` +
      `⚡ 5 ta tezkor savolga javob bering va +50 XP oling!\n` +
      `👉 <a href="https://kaiwa.live/twa">Mini Appda Viktorinani Boshlash</a>`;
    return this.sendNotification(rawUserId, text);
  }
}

export const telegramService = new TelegramService();
export default telegramService;
