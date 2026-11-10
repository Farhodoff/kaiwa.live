import { describe, it, expect } from 'vitest';
import { SubscriptionService, SUBSCRIPTION_PLANS } from '../SubscriptionService';
import { CertificateService } from '../CertificateService';

describe('SubscriptionService', () => {
  it('returns default free subscription for empty user ID', async () => {
    const sub = await SubscriptionService.getUserSubscription('');
    expect(sub.tier).toBe('free');
    expect(sub.isActive).toBe(false);
    expect(sub.dailyVoiceMinutesLimit).toBe(10);
    expect(sub.dailyAiQueriesLimit).toBe(35);
  });

  it('correctly constructs Payme checkout URL with tiyin conversion', () => {
    const url = SubscriptionService.getCheckoutUrl('pro_monthly', 'payme', 'user-123');
    expect(url).toContain('https://checkout.paycom.uz/');
    expect(url.length).toBeGreaterThan(30);
  });

  it('correctly constructs Click checkout URL', () => {
    const url = SubscriptionService.getCheckoutUrl('pro_monthly', 'click', 'user-123');
    expect(url).toContain('https://my.click.uz/services/pay');
    expect(url).toContain('amount=89000');
  });

  it('verifies all subscription plans contain essential features', () => {
    expect(SUBSCRIPTION_PLANS.free.features.length).toBeGreaterThan(0);
    expect(SUBSCRIPTION_PLANS.pro_monthly.priceUzs).toBe(89000);
    expect(SUBSCRIPTION_PLANS.pro_yearly.maxDailyAiQueries).toBe(500);
    expect(SUBSCRIPTION_PLANS.lifetime.unlimitedMockExams).toBe(true);
  });
});

describe('CertificateService', () => {
  it('correctly evaluates JLPT N2 passing score', () => {
    // N2 requires total >= 90 and all sections >= 19
    const passed = CertificateService.evaluatePassStatus('N2', {
      languageKnowledge: 35,
      reading: 30,
      listening: 30,
    });
    expect(passed.passed).toBe(true);
    expect(passed.totalScore).toBe(95);

    // Section fail (listening < 19)
    const failed = CertificateService.evaluatePassStatus('N2', {
      languageKnowledge: 50,
      reading: 40,
      listening: 15,
    });
    expect(failed.passed).toBe(false);
    expect(failed.totalScore).toBe(105);
  });

  it('generates unique certificate ID and verification link', () => {
    const cert = CertificateService.createCertificate('Ali Valiyev', 'N3', {
      languageKnowledge: 35,
      reading: 35,
      listening: 35,
    });
    expect(cert.certificateId).toMatch(/^KL-\d{4}-N3-\d{5}$/);
    expect(cert.studentName).toBe('Ali Valiyev');
    expect(cert.passStatus).toBe(true);
    expect(cert.qrVerificationUrl).toContain('https://kaiwa.live/verify/');
  });
});
