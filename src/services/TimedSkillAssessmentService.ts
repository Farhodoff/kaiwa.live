import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export type TimedSkill = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export interface TimedSkillAttempt {
  id: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  skill: TimedSkill;
  questionId: string;
  correct: boolean;
  skipped: boolean;
  durationMs: number;
  createdAt: string;
}

export interface TimedSkillSummary {
  skill: TimedSkill;
  attempts: number;
  accuracy: number | null;
  averageDurationMs: number | null;
  skipped: number;
  recentAccuracy: number | null;
}

const storageKey = (userId?: string | null) => `kaiwa_timed_skill_attempts_${userId || 'guest'}`;
const skills: TimedSkill[] = ['vocabulary', 'grammar', 'reading', 'listening'];

export class TimedSkillAssessmentService {
  static record(
    attempt: Omit<TimedSkillAttempt, 'id' | 'createdAt'>,
    userId?: string | null,
  ): void {
    const existing = this.getAttempts(userId);
    const entry: TimedSkillAttempt = {
      ...attempt,
      id: `timed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    safeLocalStorage.setJSON(storageKey(userId), [entry, ...existing].slice(0, 1000));
  }

  static getAttempts(userId?: string | null): TimedSkillAttempt[] {
    if (typeof window === 'undefined') return [];
    return safeLocalStorage.getJSON<TimedSkillAttempt[]>(storageKey(userId), []);
  }

  static summarize(userId?: string | null): TimedSkillSummary[] {
    const all = this.getAttempts(userId);
    return skills.map((skill) => {
      const attempts = all.filter((attempt) => attempt.skill === skill);
      const answered = attempts.filter((attempt) => !attempt.skipped);
      const recent = answered.slice(0, 10);
      return {
        skill,
        attempts: attempts.length,
        accuracy: answered.length
          ? Math.round(
              (answered.filter((attempt) => attempt.correct).length / answered.length) * 100,
            )
          : null,
        averageDurationMs: answered.length
          ? Math.round(
              answered.reduce((sum, attempt) => sum + attempt.durationMs, 0) / answered.length,
            )
          : null,
        skipped: attempts.filter((attempt) => attempt.skipped).length,
        recentAccuracy: recent.length
          ? Math.round((recent.filter((attempt) => attempt.correct).length / recent.length) * 100)
          : null,
      };
    });
  }
}
