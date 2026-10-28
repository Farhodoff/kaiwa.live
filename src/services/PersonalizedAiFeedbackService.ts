import { callAI } from '../utils/ai/aiCore';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { ApiLoggingService } from './ApiLoggingService';
import { RealTimeMetricsSnapshot, RealTimeAnalyticsService } from './RealTimeAnalyticsService';
import { generateUUID } from '../utils/uuid';

export interface ActionableRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface PersonalizedAiFeedback {
  id: string;
  generatedAt: string; // ISO
  overallScore: number; // 0..100
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  actionableRecommendations: ActionableRecommendation[];
  motivationalQuote: string;
  studyPaceAdvice: string;
  isHeuristicFallback?: boolean;
}

export interface FeedbackGenerationOptions {
  userLanguage?: 'uz' | 'ja' | 'en';
  jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  userName?: string;
  forceRefresh?: boolean;
}

const STORAGE_KEY_LATEST_FEEDBACK = 'nihongo_personalized_ai_feedback_latest';
const STORAGE_KEY_FEEDBACK_HISTORY = 'nihongo_personalized_ai_feedback_history';
const MAX_FEEDBACK_HISTORY = 20;

export class PersonalizedAiFeedbackService {
  /**
   * Retrieve the latest cached feedback, or generate default heuristic feedback if none exists.
   */
  static getLatestFeedback(): PersonalizedAiFeedback | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY_LATEST_FEEDBACK);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  /**
   * Retrieve past generated feedbacks.
   */
  static getFeedbackHistory(): PersonalizedAiFeedback[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY_FEEDBACK_HISTORY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  /**
   * Generate personalized AI feedback for the user based on real-time metrics.
   * If the AI model is unreachable, gracefully returns calibrated deterministic feedback.
   */
  static async generateFeedback(
    options: FeedbackGenerationOptions = {},
  ): Promise<PersonalizedAiFeedback> {
    const lang = options.userLanguage || 'uz';
    const level = options.jlptLevel || 'N4';
    const name = options.userName || "O'quvchi";

    // 1. Get current real-time metrics snapshot
    const metrics = RealTimeAnalyticsService.getMetricsSnapshot();

    // 2. Check if we have recent cached feedback (less than 10 minutes old) and forceRefresh is false
    const existing = this.getLatestFeedback();
    if (
      !options.forceRefresh &&
      existing &&
      Date.now() - new Date(existing.generatedAt).getTime() < 10 * 60 * 1000
    ) {
      return existing;
    }

    const startTime = Date.now();
    let feedback: PersonalizedAiFeedback;

    try {
      feedback = await this.requestAiFeedback(metrics, lang, level, name);

      // Log successful API call
      ApiLoggingService.logApiCall({
        endpoint: '/api/v1/analytics-feedback',
        method: 'POST',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        success: true,
        metadata: {
          jlptLevel: level,
          overallScore: feedback.overallScore,
          studyTimeMinutes: metrics.todayStudyTimeMinutes,
          successRate: metrics.overallSuccessRate,
        },
      });
    } catch (err: any) {
      console.warn('[PersonalizedAiFeedbackService] AI service unavailable, using fallback:', err);

      // Log failed/fallback API call
      ApiLoggingService.logApiCall({
        endpoint: '/api/v1/analytics-feedback',
        method: 'POST',
        statusCode: 500,
        durationMs: Date.now() - startTime,
        success: false,
        errorMessage: err?.message || 'AI request failed, fallback invoked',
        metadata: { fallback: true },
      });

      // Fallback heuristic generation
      feedback = this.generateDeterministicFeedback(metrics, lang, level, name);
    }

    // Save latest feedback and history
    this.saveFeedback(feedback);

    return feedback;
  }

  /**
   * Construct calibrated AI prompt and invoke AI provider.
   */
  private static async requestAiFeedback(
    metrics: RealTimeMetricsSnapshot,
    lang: 'uz' | 'ja' | 'en',
    level: string,
    userName: string,
  ): Promise<PersonalizedAiFeedback> {
    const systemPrompt = `You are an elite Japanese language mentor and learning analytics expert for the Nihongo Talk platform.
Analyze the student's real-time metrics (study time, success rates across skills, error patterns, streak) and generate a highly personalized, constructive, actionable study feedback report.
Language requirement: Generate all text fields in ${lang === 'ja' ? 'Japanese (日本語)' : lang === 'en' ? 'English' : "Uzbek (O'zbek tili)"}.

CRITICAL: Return ONLY a valid JSON object matching this schema, no markdown fences or preambles:
{
  "overallScore": <number between 0 and 100>,
  "summary": "<concise 1-2 sentence overview of user's current progress>",
  "strengths": [
    "<specific strong area 1 with evidence>",
    "<specific strong area 2 with evidence>"
  ],
  "areasForImprovement": [
    "<specific area needing work 1>",
    "<specific area needing work 2>"
  ],
  "actionableRecommendations": [
    {
      "title": "<short action title>",
      "description": "<concrete 1-sentence instruction on how to practice>",
      "priority": "high",
      "actionUrl": "/decks"
    },
    {
      "title": "<short action title>",
      "description": "<concrete 1-sentence instruction>",
      "priority": "medium",
      "actionUrl": "/focus"
    },
    {
      "title": "<short action title>",
      "description": "<concrete 1-sentence instruction>",
      "priority": "low",
      "actionUrl": "/speaking"
    }
  ],
  "motivationalQuote": "<inspiring quote or words of encouragement>",
  "studyPaceAdvice": "<specific guidance on whether their current pace matches their JLPT target>"
}`;

    const prompt = `Student Name: ${userName}
JLPT Target Level: ${level}
Today's Study Time: ${metrics.todayStudyTimeMinutes} minutes
Overall Success Rate: ${metrics.overallSuccessRate}%
Total Items Attempted: ${metrics.totalItemsAttempted}
Total Items Successful: ${metrics.totalItemsSuccessful}
Study Streak: ${metrics.streakDays} days
Performance Trend: ${metrics.performanceTrend}
Identified Weakest Skill: ${metrics.weakestSkill}
Identified Strongest Skill: ${metrics.strongestSkill}

Skill Breakdown:
${JSON.stringify(metrics.skillBreakdown, null, 2)}

Recent Activity History:
${JSON.stringify(
  metrics.recentEvents.slice(0, 5).map((e) => ({
    activity: e.activityType,
    title: e.title,
    accuracy: `${e.accuracyPercent}%`,
    durationSeconds: e.durationSeconds,
  })),
  null,
  2,
)}

Evaluate the student now and return valid JSON.`;

    const aiResponse = await callAI(prompt, systemPrompt, true, {
      skipCache: true,
      maxRetries: 1,
    });

    const parsed = this.parseAiResponse(aiResponse);
    return {
      ...parsed,
      id: generateUUID(),
      generatedAt: new Date().toISOString(),
      isHeuristicFallback: false,
    };
  }

  /**
   * Safely parse and sanitize the raw AI response.
   */
  private static parseAiResponse(raw: string): Omit<PersonalizedAiFeedback, 'id' | 'generatedAt'> {
    let cleaned = (raw || '').trim();
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      const obj = JSON.parse(cleaned);
      return {
        overallScore: Math.min(100, Math.max(0, Number(obj.overallScore) || 75)),
        summary: String(obj.summary || 'Ajoyib natijalar qayd etilmoqda.'),
        strengths:
          Array.isArray(obj.strengths) && obj.strengths.length > 0
            ? obj.strengths.map(String)
            : ["Lug'at boyligini o'rganishda faollik yuqori"],
        areasForImprovement:
          Array.isArray(obj.areasForImprovement) && obj.areasForImprovement.length > 0
            ? obj.areasForImprovement.map(String)
            : ["Murakkab grammatik konstruksiyalarga ko'proq e'tibor qarating"],
        actionableRecommendations:
          Array.isArray(obj.actionableRecommendations) && obj.actionableRecommendations.length > 0
            ? obj.actionableRecommendations.map((r: any) => ({
                title: String(r.title || 'Mashq qilish'),
                description: String(r.description || 'Darslarni muntazam takrorlang.'),
                priority:
                  r.priority === 'high' || r.priority === 'medium' || r.priority === 'low'
                    ? r.priority
                    : 'medium',
                actionUrl: r.actionUrl ? String(r.actionUrl) : undefined,
              }))
            : [
                {
                  title: "Lug'at takrorlash",
                  description: "Har kuni 15 daqiqa SRS kartochkalarini ko'rib chiqing.",
                  priority: 'high',
                  actionUrl: '/decks',
                },
              ],
        motivationalQuote: String(
          obj.motivationalQuote ||
            'Har bir qadam sizni maqsadingizga yaqinlashtiradi! 継続は力なり。',
        ),
        studyPaceAdvice: String(
          obj.studyPaceAdvice || "Kunlik 30 daqiqalik o'rganish rejimi o'z samarasini bermoqda.",
        ),
      };
    } catch {
      throw new Error('AI response could not be parsed into valid JSON structure');
    }
  }

  /**
   * Calibrated heuristic generator if AI API is offline or rate-limited.
   */
  private static generateDeterministicFeedback(
    metrics: RealTimeMetricsSnapshot,
    lang: 'uz' | 'ja' | 'en',
    level: string,
    _name: string,
  ): PersonalizedAiFeedback {
    const successRate = metrics.overallSuccessRate;
    const studyTime = metrics.todayStudyTimeMinutes;

    let overallScore = Math.min(
      100,
      Math.max(40, Math.round(successRate * 0.7 + Math.min(30, studyTime))),
    );
    if (studyTime === 0 && metrics.totalItemsAttempted === 0) {
      overallScore = 60; // Initial baseline
    }

    if (lang === 'ja') {
      return {
        id: generateUUID(),
        generatedAt: new Date().toISOString(),
        overallScore,
        summary: `本日の学習時間は${studyTime}分、総合正答率は${successRate}%です。${level}合格に向けて着実に前進しています。`,
        strengths: [
          `${metrics.strongestSkill}の定着度が高く、安定した成果を出しています。`,
          `学習ストリークが${metrics.streakDays}日継続しており、良い学習習慣が形成されています。`,
        ],
        areasForImprovement: [
          `${metrics.weakestSkill}における誤答率をさらに下げるための復習が必要です。`,
          studyTime < 30
            ? '目標とする1日30分の学習時間の確保を推奨します。'
            : '長文読解や実践問題での応用力を磨きましょう。',
        ],
        actionableRecommendations: [
          {
            title: '弱点分野の単語・文法ドリル',
            description: `${metrics.weakestSkill}の復習セッションを15分間行いましょう。`,
            priority: 'high',
            actionUrl: '/decks',
          },
          {
            title: 'ポモドーロ集中学習',
            description: '25分間の集中タイマーを使って今日の学習目標を達成しましょう。',
            priority: 'medium',
            actionUrl: '/focus',
          },
          {
            title: 'AI会話コーチ実践',
            description: 'AIコーチと5分間の日本語ロールプレイングで会話力を鍛えましょう。',
            priority: 'low',
            actionUrl: '/speaking',
          },
        ],
        motivationalQuote: '「継続は力なり」日々の努力が大きな実を結びます！',
        studyPaceAdvice:
          studyTime >= 25
            ? '現在の学習ペースは理想的です。このリズムを維持しましょう。'
            : '隙間時間を活用して、あと15分学習時間を増やしてみましょう。',
        isHeuristicFallback: true,
      };
    }

    if (lang === 'en') {
      return {
        id: generateUUID(),
        generatedAt: new Date().toISOString(),
        overallScore,
        summary: `Today's study time is ${studyTime} mins with a ${successRate}% accuracy rate. You are making steady progress toward your ${level} target.`,
        strengths: [
          `Strong performance in ${metrics.strongestSkill} with high retention.`,
          `Maintained a ${metrics.streakDays}-day study streak, building strong learning momentum.`,
        ],
        areasForImprovement: [
          `Target additional review sessions for ${metrics.weakestSkill}.`,
          studyTime < 25
            ? 'Aim for at least 25-30 minutes of daily practice.'
            : 'Expand reading comprehension with longer authentic texts.',
        ],
        actionableRecommendations: [
          {
            title: 'Targeted Review Drill',
            description: `Review 15-20 flashcards focusing on ${metrics.weakestSkill}.`,
            priority: 'high',
            actionUrl: '/decks',
          },
          {
            title: 'Deep Focus Session',
            description: 'Complete one 25-minute Pomodoro study block.',
            priority: 'medium',
            actionUrl: '/focus',
          },
          {
            title: 'Speaking Roleplay',
            description: 'Practice speaking with the AI Coach for 5 minutes.',
            priority: 'low',
            actionUrl: '/speaking',
          },
        ],
        motivationalQuote: 'Consistency is the key to mastery. Every practice session counts!',
        studyPaceAdvice:
          studyTime >= 25
            ? 'Your study pace is on track for JLPT readiness.'
            : 'Increase daily practice by 10-15 minutes to stay ahead of schedule.',
        isHeuristicFallback: true,
      };
    }

    // Default: Uzbek
    return {
      id: generateUUID(),
      generatedAt: new Date().toISOString(),
      overallScore,
      summary: `Bugun jami ${studyTime} daqiqa dars qilindi, umumiy to'g'ri javoblar ko'rsatkichi ${successRate}%. Siz ${level} darajasiga erishish yo'lida to'g'ri ketyapsiz.`,
      strengths: [
        `${metrics.strongestSkill} bo'yicha mustahkamlash darajasi yuqori va barqaror.`,
        `${metrics.streakDays} kunlik uzluksiz o'qish seriyasi saqlanib turibdi, bu ajoyib intizom!`,
      ],
      areasForImprovement: [
        `${metrics.weakestSkill} bo'yicha ko'proq xatolar qayd etilmoqda, qayta takrorlash talab etiladi.`,
        studyTime < 25
          ? "Kunlik 25-30 daqiqalik o'rganish me'yoriga yetkazish tavsiya qilinadi."
          : "Matnlar tahlili va eshitish (Choukai) mashqlariga chuqurroq e'tibor bering.",
      ],
      actionableRecommendations: [
        {
          title: 'Xatolar ustida ishlash (SRS)',
          description: `${metrics.weakestSkill} bo'yicha 15-20 ta kartochkani Qiyin/Qayta tugmalari orqali qayta yodlang.`,
          priority: 'high',
          actionUrl: '/decks',
        },
        {
          title: 'Pomodoro diqqat seansi',
          description: "25 daqiqalik chalg'imasdan o'qish blokini yakunlang.",
          priority: 'medium',
          actionUrl: '/focus',
        },
        {
          title: 'AI Suhbatdoshi bilan amaliyot',
          description:
            "AI Coach bilan 5 daqiqa jonli ovozli muloqot qilib yangi so'zlarni nutqda qo'llang.",
          priority: 'low',
          actionUrl: '/speaking',
        },
      ],
      motivationalQuote:
        "Kichik qadamlar buyuk g'alabalarga olib boradi! 継続は力なり (Uzluksizlik — kuchdir).",
      studyPaceAdvice:
        studyTime >= 25
          ? "Kunlik o'rganish sur'atingiz me'yorda va rejadagidek bormoqda."
          : "Kuniga yana 10-15 daqiqa vaqt ajratsangiz, o'zlashtirish tezligi 40% ga oshadi.",
      isHeuristicFallback: true,
    };
  }

  private static saveFeedback(feedback: PersonalizedAiFeedback): void {
    if (typeof window === 'undefined') return;
    try {
      safeLocalStorage.setItem(STORAGE_KEY_LATEST_FEEDBACK, JSON.stringify(feedback));

      const history = this.getFeedbackHistory();
      const updated = [feedback, ...history.filter((h) => h.id !== feedback.id)].slice(
        0,
        MAX_FEEDBACK_HISTORY,
      );
      safeLocalStorage.setItem(STORAGE_KEY_FEEDBACK_HISTORY, JSON.stringify(updated));
    } catch {}
  }
}
