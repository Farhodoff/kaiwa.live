/**
 * Nihongo Talk Universal SDK
 * Lightweight, zero-dependency client for Sakubun Evaluation, JLPT, Flashcards, and SM-2 Spaced Repetition.
 * Works in Node.js, Next.js, React, Vue, React Native, and vanilla JavaScript.
 */

export interface KaizenConfig {
  baseUrl?: string;
  apiKey?: string;
}

export interface SakubunEvaluateParams {
  essay: string;
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  topic?: string;
}

export interface SakubunEvaluateResult {
  score: number;
  kanjiRating: string;
  grammarFeedback: string;
  correctedText: string;
  suggestions: string[];
}

/** @deprecated Use SakubunEvaluateParams instead */
export interface IeltsEvaluateParams {
  essay: string;
  topic?: string;
  taskType?: 'task1' | 'task2';
}

/** @deprecated Use SakubunEvaluateResult instead */
export interface IeltsEvaluateResult {
  overallBand: number;
  scores: {
    taskAchievement: number;
    coherenceAndCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
  correctedEssay: string;
}

export interface FlashcardGenerateParams {
  topic: string;
  language?: string;
  count?: number;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  example?: string;
}

export interface SrsCalculateParams {
  quality: number; // 0-5
  repetitions?: number;
  interval?: number;
  easeFactor?: number;
}

export interface SrsCalculateResult {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  dueInDays: number;
}

export class KaizenAI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config?: KaizenConfig) {
    this.baseUrl =
      config?.baseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://kaiwa.live');
    this.apiKey = config?.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['X-Kaizen-Key'] = this.apiKey;
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `HTTP ${response.status}: API request failed`);
    }

    const resJson = await response.json();
    return resJson.data ?? resJson;
  }

  public sakubun = {
    evaluate: async (params: SakubunEvaluateParams): Promise<SakubunEvaluateResult> => {
      return this.request<SakubunEvaluateResult>('/api/v1/sakubun-evaluate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  };

  /** @deprecated Use client.sakubun.evaluate instead */
  public ielts = {
    evaluateEssay: async (params: IeltsEvaluateParams): Promise<IeltsEvaluateResult> => {
      return this.request<IeltsEvaluateResult>('/api/v1/ielts-evaluate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  };

  public flashcards = {
    generate: async (params: FlashcardGenerateParams): Promise<GeneratedFlashcard[]> => {
      return this.request<GeneratedFlashcard[]>('/api/v1/flashcards-generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  };

  public srs = {
    calculateNextReview: async (params: SrsCalculateParams): Promise<SrsCalculateResult> => {
      return this.request<SrsCalculateResult>('/api/v1/srs', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  };
}

export const createKaizenClient = (config?: KaizenConfig) => new KaizenAI(config);
export default KaizenAI;
