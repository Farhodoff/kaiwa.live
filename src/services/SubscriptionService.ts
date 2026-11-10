import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceUzs: number;
  priceUsd: number;
  period: string;
  features: string[];
  maxDailyMinutesVoice: number;
  maxDailyAiQueries: number;
  unlimitedMockExams: boolean;
  offlineDownloads: boolean;
}

export interface UserSubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  provider: 'payme' | 'click' | 'stripe' | 'admin' | null;
  dailyVoiceMinutesLimit: number;
  dailyAiQueriesLimit: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Boshlang‘ich (Free)',
    priceUzs: 0,
    priceUsd: 0,
    period: 'Doimiy bepul',
    features: [
      'N5 va N4 asosiy darslari',
      'Kunlik 10 daqiqa ovozli AI Sensei',
      '35 ta AI dars tahlili / kun',
      'Anki SM-2 Fleshkartalar',
      'Bitta bepul JLPT sinov imtihoni',
    ],
    maxDailyMinutesVoice: 10,
    maxDailyAiQueries: 35,
    unlimitedMockExams: false,
    offlineDownloads: false,
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Kaiwa Pro (Oylik)',
    priceUzs: 89000,
    priceUsd: 7,
    period: '1 oy',
    features: [
      'N5 – N1 barcha 140 ta darslar',
      'Cheksiz ovozli AI Sensei suhbati',
      '500 ta AI tahlil / kun',
      'Cheksiz JLPT Mock imtihonlari va QR sertifikat',
      'PWA audio oflayn yuklab olish',
      '24/7 ustuvor yordam',
    ],
    maxDailyMinutesVoice: 9999,
    maxDailyAiQueries: 500,
    unlimitedMockExams: true,
    offlineDownloads: true,
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Kaiwa Pro (Yillik - 40% Chegirma)',
    priceUzs: 640000,
    priceUsd: 49,
    period: '1 yil',
    features: [
      'Oylik rejadagi barcha imkoniyatlar',
      'Yillik JLPT imtihoniga to‘liq tayyorgarlik kafolati',
      'Shaxsiy AI murabbiy yo‘l xaritasi',
      'Rasmiy tasdiqlangan sertifikatlar',
    ],
    maxDailyMinutesVoice: 9999,
    maxDailyAiQueries: 500,
    unlimitedMockExams: true,
    offlineDownloads: true,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Cheksiz Umrbod (Lifetime)',
    priceUzs: 1490000,
    priceUsd: 119,
    period: 'Umrbod',
    features: [
      'Barcha kelgusi yangilanishlar va kurslar bepul',
      'Eng yuqori server prioriteti va cheklovlarsiz kirish',
      'Shaxsiy VIP nishon (Badge)',
    ],
    maxDailyMinutesVoice: 9999,
    maxDailyAiQueries: 1000,
    unlimitedMockExams: true,
    offlineDownloads: true,
  },
};

export class SubscriptionService {
  /**
   * Retrieves active subscription for the current user.
   */
  static async getUserSubscription(userId: string): Promise<UserSubscriptionStatus> {
    if (!userId) {
      return this.getDefaultFreeSubscription();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, subscription_tier, subscription_expires_at, subscription_provider')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return this.getDefaultFreeSubscription();
      }

      const role = data.role;
      if (role === 'admin' || role === 'superadmin') {
        return {
          tier: 'lifetime',
          isActive: true,
          expiresAt: null,
          provider: 'admin',
          dailyVoiceMinutesLimit: 9999,
          dailyAiQueriesLimit: 1000,
        };
      }

      const tier: SubscriptionTier = (data.subscription_tier as SubscriptionTier) || 'free';
      const expiresAt = data.subscription_expires_at || null;

      let isActive = tier !== 'free';
      if (isActive && expiresAt) {
        isActive = new Date(expiresAt).getTime() > Date.now();
      }

      const activeTier = isActive ? tier : 'free';
      const plan = SUBSCRIPTION_PLANS[activeTier];

      return {
        tier: activeTier,
        isActive,
        expiresAt,
        provider: data.subscription_provider || null,
        dailyVoiceMinutesLimit: plan.maxDailyMinutesVoice,
        dailyAiQueriesLimit: plan.maxDailyAiQueries,
      };
    } catch {
      return this.getDefaultFreeSubscription();
    }
  }

  /**
   * Generates localized checkout URL for Payme, Click or Stripe.
   */
  static getCheckoutUrl(
    tier: SubscriptionTier,
    provider: 'payme' | 'click' | 'stripe',
    userId: string,
  ): string {
    const plan = SUBSCRIPTION_PLANS[tier];
    if (provider === 'payme') {
      const amountTiyin = plan.priceUzs * 100;
      const merchantId = '654321_kaiwa_payme';
      const base64Params = btoa(
        `m=${merchantId};ac.user_id=${userId};ac.plan=${tier};a=${amountTiyin}`,
      );
      return `https://checkout.paycom.uz/${base64Params}`;
    }
    if (provider === 'click') {
      const serviceId = '12345';
      const merchantId = '67890';
      return `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${plan.priceUzs}&transaction_param=${userId}_${tier}`;
    }
    // Stripe checkout fallback
    return `/api/checkout?plan=${tier}&userId=${userId}`;
  }

  static getDefaultFreeSubscription(): UserSubscriptionStatus {
    const plan = SUBSCRIPTION_PLANS.free;
    return {
      tier: 'free',
      isActive: false,
      expiresAt: null,
      provider: null,
      dailyVoiceMinutesLimit: plan.maxDailyMinutesVoice,
      dailyAiQueriesLimit: plan.maxDailyAiQueries,
    };
  }
}
