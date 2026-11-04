import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanJapaneseTTS, parseCoachResponse } from '../ai/aiCoach';
import { validateSpeechInput } from '../ai';
import { sanitizeErrorMessage } from '../../components/ErrorBoundary';
import { TaskService } from '../../services/TaskService';
import { setLocalFlashcardCache, getLocalFlashcardCache } from '../../services/FlashcardService';
import { HistoryService } from '../../services/HistoryService';

describe('TRUE PRODUCTION USER-FLOW AUDIT', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. User Isolation & Clean Cache Namespacing', () => {
    it('isolates tasks per userId so user B never sees user A offline tasks', async () => {
      const userATask = {
        id: 'task-a-1',
        userId: 'user-a-uuid',
        title: 'User A Secret Task',
        status: 'todo' as const,
        priority: 'high' as const,
        dueDate: new Date().toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      };

      // User A saves task to their cache
      localStorage.setItem('study_planner_tasks_user-a-uuid', JSON.stringify([userATask]));

      // User B logs in and fetches tasks
      const userBTasks = await TaskService.fetchTasks('user-b-uuid');
      expect(userBTasks.some((t) => t.title === 'User A Secret Task')).toBe(false);
    });

    it('isolates flashcards per userId so user B never sees user A decks', () => {
      const userACards = [
        {
          id: 'card-1',
          userId: 'user-a',
          subjectId: 'sub-1',
          front: 'Kanji A',
          back: 'Meaning A',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setLocalFlashcardCache('user-a', userACards);

      const userBCards = getLocalFlashcardCache('user-b');
      expect(userBCards.length).toBe(0);
    });
  });

  describe('2. Japanese Speaking Coach End-to-End Safeguards', () => {
    it('filters out brief background noises (< 1.2s or < 3 chars) from calling AI', () => {
      expect(validateSpeechInput('ah', 500)).toBe(false);
      expect(validateSpeechInput('um', 800)).toBe(false);
      expect(validateSpeechInput('こんにちは', 2000)).toBe(true);
      expect(validateSpeechInput('Hello coach, how are you today?', 3500)).toBe(true);
    });

    it('strictly strips Romaji, English translations, and bracketed notes from Japanese TTS', () => {
      const messyAIResponse = 'こんにちは！ (Konnichiwa) [Hello] 元気ですか？ (Genki desu ka?) 😊';
      const cleanTTS = cleanJapaneseTTS(messyAIResponse);

      expect(cleanTTS).toBe('こんにちは！ 元気ですか？');
      expect(cleanTTS).not.toContain('Konnichiwa');
      expect(cleanTTS).not.toContain('Hello');
      expect(cleanTTS).not.toContain('(');
      expect(cleanTTS).not.toContain('[');
      expect(cleanTTS).not.toContain('😊');
    });

    it('correctly parses structured coach JSON with correction and vocabulary items', () => {
      const rawJson = JSON.stringify({
        language: 'ja',
        reply: '昨日はどこへ行きましたか？',
        ttsText: '昨日はどこへ行きましたか？',
        romaji: 'Kinou wa doko e ikimashita ka?',
        correction: {
          hasError: true,
          original: '昨日学校を行きました',
          corrected: '昨日学校へ行きました',
          explanation: "Harakat yo'nalishi uchun 'へ' (e) yoki 'に' (ni) qo'shimchasi ishlatiladi.",
        },
        vocabulary: [
          {
            word: '昨日',
            reading: 'きのう',
            meaning: 'Kecha (Yesterday)',
            example: '昨日は雨でした。',
          },
        ],
      });

      const parsed = parseCoachResponse(rawJson, 'ja');
      expect(parsed.language).toBe('ja');
      expect(parsed.reply).toBe('昨日はどこへ行きましたか？');
      expect(parsed.ttsText).toBe('昨日はどこへ行きましたか？');
      expect(parsed.romaji).toBe('Kinou wa doko e ikimashita ka?');
      expect(parsed.correction?.hasError).toBe(true);
      expect(parsed.correction?.corrected).toBe('昨日学校へ行きました');
      expect(parsed.vocabulary?.length).toBe(1);
      expect(parsed.vocabulary?.[0].word).toBe('昨日');
    });
  });

  describe('3. JLPT Mock Exam Persistence', () => {
    it('saves and retrieves JLPT mock exam scores accurately without data loss', async () => {
      const examRecord = await HistoryService.saveMockExam({
        examType: 'jlpt',
        level: 'N3',
        score: 145,
        totalQuestions: 40,
      });

      expect(examRecord.id).toBeDefined();
      expect(examRecord.score).toBe(145);
      expect(examRecord.level).toBe('N3');

      const history = await HistoryService.getMockExamsHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].score).toBe(145);
    });
  });

  describe('4. Observability & Zero Secret Leakage in Error Logs', () => {
    it('scrubs API keys, Bearer tokens, and database passwords from error messages', () => {
      const dangerousError =
        'Connection failed with key AIzaSyD9876543210 and Bearer eyJhbGciOiJIUzI1NiJ9.secret and postgresql://postgres:mypassword123@db.supabase.co:5432';
      const sanitized = sanitizeErrorMessage(dangerousError);

      expect(sanitized).not.toContain('AIzaSyD9876543210');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiJ9.secret');
      expect(sanitized).not.toContain('mypassword123');
      expect(sanitized).toContain('AIzaSy[REDACTED]');
      expect(sanitized).toContain('Bearer [REDACTED]');
      expect(sanitized).toContain('[REDACTED_PASSWORD]');
    });
  });
});
