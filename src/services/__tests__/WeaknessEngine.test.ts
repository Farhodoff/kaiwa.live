import { describe, it, expect, beforeEach } from 'vitest';
import { WeaknessEngine } from '../WeaknessEngine';
import { MasteryEngine } from '../MasteryEngine';
import { NextActionService } from '../NextActionService';
import { UserLearningState } from '../../types/learningOrchestrator';

describe('WeaknessEngine Unit Tests', () => {
  const userId = 'weakness_test_user';

  beforeEach(() => {
    localStorage.clear();
  });

  it('1. should identify top weaknesses when skill scores are low', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'listening',
      score: 45,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'grammar',
      score: 85,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'speaking',
      score: 55,
      timestamp: new Date().toISOString(),
    });

    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');

    expect(profile.topWeaknesses.length).toBe(2);
    expect(profile.topWeaknesses[0].skill).toBe('listening');
    expect(profile.topWeaknesses[0].severity).toBe('high');
    expect(profile.topWeaknesses[1].skill).toBe('speaking');
  });

  it('2. should identify top strengths when skills are strong', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'grammar',
      score: 92,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'vocabulary',
      score: 88,
      timestamp: new Date().toISOString(),
    });

    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');

    expect(profile.topStrengths.length).toBe(2);
    expect(profile.topStrengths[0].skill).toBe('grammar');
    expect(profile.topStrengths[0].score).toBe(92);
  });

  it('3. should map Japanese Kanji weakness to valid JLPT route', () => {
    MasteryEngine.recordEvidence(userId, 'ja', {
      skill: 'kanji',
      score: 40,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'ja');

    expect(profile.topWeaknesses[0].skill).toBe('kanji');
    expect(profile.topWeaknesses[0].recommendedRoute).toBe('/jlpt');
  });

  it('4. should map Japanese Reading weakness to /jlpt/reading', () => {
    MasteryEngine.recordEvidence(userId, 'ja', {
      skill: 'reading',
      score: 42,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'ja');

    expect(profile.topWeaknesses[0].recommendedRoute).toBe('/jlpt/reading');
  });

  it('5. should map English Speaking weakness to /speaking-coach?lang=en', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'speaking',
      score: 50,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');

    expect(profile.topWeaknesses[0].recommendedRoute).toBe('/speaking-coach?lang=en');
  });

  it('6. should map English Writing weakness to /ielts/writing', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'writing',
      score: 48,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');

    expect(profile.topWeaknesses[0].recommendedRoute).toBe('/ielts/writing');
  });

  it('7. should flag declining trends with high severity even if score is moderate', () => {
    const now = new Date();
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'listening',
      score: 80,
      timestamp: new Date(now.getTime() - 30000).toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'listening',
      score: 70,
      timestamp: new Date(now.getTime() - 20000).toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'listening',
      score: 62,
      timestamp: new Date(now.getTime() - 10000).toISOString(),
    });

    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');
    const weakness = profile.topWeaknesses.find((w) => w.skill === 'listening');

    expect(weakness).toBeDefined();
    expect(weakness?.severity).toBe('high');
    expect(weakness?.reason).toContain('declining');
  });

  it('8. should inform NextActionService with targeted weakness action', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'listening',
      score: 40,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');

    const mockState: UserLearningState = {
      userId,
      primaryLanguage: 'en',
      enabledLanguages: ['en'],
      currentLevel: 'B2',
      targetLevel: 'B2',
      targetGoal: 'IELTS 7.5+',
      availableStudyMinutes: 30,
      currentPosition: null,
      completedLessonsCount: 1,
      unfinishedLessons: [],
      reviewSummary: {
        totalCards: 0,
        dueCount: 0,
        overdueCount: 0,
        newCount: 0,
        learnedCount: 0,
        averageRetentionScore: 0,
      },
      signalsSummary: {
        totalSignalsCount: 0,
        recentMistakesCount: 0,
        newVocabCount: 0,
        completedLessonsCount: 0,
        recentMistakeTopics: [],
      },
      recentActivity: { lastStudyAt: null, recentLessonIds: [], lastCompletedLessonId: null },
      masteryProfile: profile,
    };

    const action = NextActionService.getNextAction(mockState);

    expect(action.type).toBe('weakness_practice');
    expect(action.title).toContain('LISTENING');
    expect(action.route).toBe('/ielts/reading-listening');
  });

  it('9. should handle empty state with 0 weaknesses and 0 strengths', () => {
    const profile = WeaknessEngine.getUserMasteryProfile('empty_user', 'en');
    expect(profile.topWeaknesses.length).toBe(0);
    expect(profile.topStrengths.length).toBe(0);
  });

  it('10. should not create weakness from completion-only evidence', () => {
    MasteryEngine.recordEvent(userId, 'en', {
      id: 'completion_only_ev',
      userId,
      language: 'en',
      lessonId: 'lesson_completion_only',
      activityType: 'lesson_completion',
      category: 'completion',
      skill: 'grammar',
      score: 100,
      timestamp: new Date().toISOString(),
    });

    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'en');
    expect(profile.skills.grammar.status).toBe('not_started');
    expect(profile.topWeaknesses).toHaveLength(0);
  });

  it('11. should ensure primary language isolation in weakness routing', () => {
    MasteryEngine.recordEvidence(userId, 'ja', {
      skill: 'listening',
      score: 45,
      timestamp: new Date().toISOString(),
    });
    const profile = WeaknessEngine.getUserMasteryProfile(userId, 'ja');

    expect(profile.topWeaknesses[0].recommendedRoute).toBe('/jlpt/listening');
    expect(profile.topWeaknesses[0].recommendedRoute).not.toContain('/ielts');
  });
});
