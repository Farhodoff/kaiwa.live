import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonalizedAiFeedbackService } from '../PersonalizedAiFeedbackService';
import { RealTimeAnalyticsService } from '../RealTimeAnalyticsService';
import { ApiLoggingService } from '../ApiLoggingService';
import * as aiCore from '../../utils/ai/aiCore';

describe('PersonalizedAiFeedbackService', () => {
  beforeEach(() => {
    RealTimeAnalyticsService.resetAll();
    ApiLoggingService.clearLogs();
    vi.restoreAllMocks();
  });

  it('generates structured feedback from AI response when available', async () => {
    RealTimeAnalyticsService.recordActivity({
      activityType: 'flashcards',
      title: 'Vocabulary N4 Drill',
      durationSeconds: 300,
      itemsCount: 20,
      successCount: 18,
    });

    const mockAiResponse = JSON.stringify({
      overallScore: 90,
      summary: "So'z boyligi bo'yicha juda yaxshi natija ko'rsatmoqdasiz.",
      strengths: ["So'zlarni esda saqlash aniqligi 90%", 'Intizomli takrorlash'],
      areasForImprovement: ["Grammatik tahlilga ko'proq vaqt ajrating"],
      actionableRecommendations: [
        {
          title: "Qiyin so'zlarni takrorlash",
          description: "Xato qilingan 2 ta so'zni qayta yodlang.",
          priority: 'high',
          actionUrl: '/decks',
        },
      ],
      motivationalQuote: '継続は力なり。Davom eting!',
      studyPaceAdvice: "Kunlik sur'at N4 imtihoniga to'liq mos keladi.",
    });

    vi.spyOn(aiCore, 'callAI').mockResolvedValue(mockAiResponse);

    const feedback = await PersonalizedAiFeedbackService.generateFeedback({
      userLanguage: 'uz',
      jlptLevel: 'N4',
      forceRefresh: true,
    });

    expect(feedback).toBeDefined();
    expect(feedback.overallScore).toBe(90);
    expect(feedback.summary).toContain("So'z boyligi");
    expect(feedback.strengths.length).toBe(2);
    expect(feedback.areasForImprovement.length).toBe(1);
    expect(feedback.actionableRecommendations[0].title).toBe("Qiyin so'zlarni takrorlash");
    expect(feedback.isHeuristicFallback).toBe(false);

    // Verify it was saved as latest feedback
    const latest = PersonalizedAiFeedbackService.getLatestFeedback();
    expect(latest?.id).toBe(feedback.id);
  });

  it('gracefully falls back to heuristic feedback if AI provider fails', async () => {
    RealTimeAnalyticsService.recordActivity({
      activityType: 'quiz',
      title: 'Grammar N4 Quiz',
      durationSeconds: 180,
      itemsCount: 10,
      successCount: 8,
    });

    vi.spyOn(aiCore, 'callAI').mockRejectedValue(new Error('API rate limit exceeded'));

    const feedback = await PersonalizedAiFeedbackService.generateFeedback({
      userLanguage: 'uz',
      jlptLevel: 'N4',
      forceRefresh: true,
    });

    expect(feedback).toBeDefined();
    expect(feedback.overallScore).toBeGreaterThan(0);
    expect(feedback.summary).toBeDefined();
    expect(feedback.strengths.length).toBeGreaterThan(0);
    expect(feedback.actionableRecommendations.length).toBeGreaterThan(0);
    expect(feedback.isHeuristicFallback).toBe(true);

    // Logs the call in ApiLoggingService
    const apiLogs = ApiLoggingService.getApiLogs();
    expect(apiLogs.length).toBeGreaterThan(0);
    expect(apiLogs[0].endpoint).toBe('/api/v1/analytics-feedback');
  });

  it('supports Japanese and English languages in fallback', async () => {
    vi.spyOn(aiCore, 'callAI').mockRejectedValue(new Error('Offline'));

    const feedbackJa = await PersonalizedAiFeedbackService.generateFeedback({
      userLanguage: 'ja',
      forceRefresh: true,
    });
    expect(feedbackJa.summary).toContain('本日の学習時間');

    const feedbackEn = await PersonalizedAiFeedbackService.generateFeedback({
      userLanguage: 'en',
      forceRefresh: true,
    });
    expect(feedbackEn.summary).toContain("Today's study time");
  });
});
