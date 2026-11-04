import { describe, it, expect } from 'vitest';
import {
  LearningPathState,
  DailyLearningPlan,
  NextBestAction,
  SkillAllocation,
  LearningReason,
  ProgressionState,
  ProgressionRequirement,
  LessonRecommendation,
  ReviewRecommendation,
  RemediationRecommendation,
  LearningDecision,
  RemediationItem,
  SRSAllocation,
  LearningPathOptions,
} from '../../types/learningPath';

describe('Phase 8.1 - Learning Path Domain Types & Models', () => {
  it('1. should create valid LearningReason with enum code and evidence metadata', () => {
    const reason: LearningReason = {
      code: 'WEAK_SKILL',
      type: 'weak_skill',
      title: "Listening sizning zaif ko'nikmangiz",
      description: 'Listening accuracy is below the required baseline for B1.',
      message: 'Listening skill requires consolidation based on adaptive diagnostic.',
      evidence: {
        level: 'A2',
        confidence: 0.85,
        recentMistakes: 5,
        metricName: 'accuracy',
        metricValue: '44%',
        threshold: '>=60%',
        sourceId: 'diag-eval-listening',
      },
      priority: 90,
    };

    expect(reason.code).toBe('WEAK_SKILL');
    expect(reason.evidence.level).toBe('A2');
    expect(reason.evidence.confidence).toBe(0.85);
    expect(reason.evidence.recentMistakes).toBe(5);
    expect(reason.priority).toBe(90);
  });

  it('2. should create valid NextBestAction for continuing unfinished lesson', () => {
    const nextAction: NextBestAction = {
      type: 'continue_lesson',
      lessonId: 'en-b1-u2-l1',
      contentId: 'en-b1-u2-l1',
      title: 'Resume: Present Perfect Continuous',
      description: 'You left off at step 3 of 6 in B1 Grammar.',
      route: '/lesson/en-b1-u2-l1',
      language: 'en',
      skill: 'grammar',
      estimatedMinutes: 12,
      priority: 95,
      reason: {
        code: 'UNFINISHED_LESSON',
        type: 'unfinished_lesson',
        title: 'Tugallanmagan dars',
        message: 'Lesson is 50% complete.',
        evidence: { metricValue: 50 },
        priority: 95,
      },
      expectedOutcome: 'Complete step 4 to 6 and master continuous usage.',
      ctaLabel: '🚀 Davom Ettirish',
      badgeIcon: '🎓',
      isZeroFoundation: false,
    };

    expect(nextAction.type).toBe('continue_lesson');
    expect(nextAction.lessonId).toBe('en-b1-u2-l1');
    expect(nextAction.reason.code).toBe('UNFINISHED_LESSON');
    expect(nextAction.estimatedMinutes).toBe(12);
  });

  it('3. should support zero-level foundation NextAction for English and Japanese beginners', () => {
    const zeroAction: NextBestAction = {
      type: 'zero_foundation',
      lessonId: 'ja-zero-hiragana-1',
      contentId: 'ja-zero-hiragana-1',
      title: 'Hiragana Foundation: Basic Vowels (あ、い、う、え、お)',
      description: 'Begin your Japanese journey with foundational kana.',
      route: '/lesson/ja-zero-hiragana-1',
      language: 'ja',
      skill: 'grammar',
      estimatedMinutes: 10,
      priority: 99,
      reason: {
        code: 'ZERO_LEVEL_FOUNDATION',
        type: 'zero_level_foundation',
        title: 'Nol daraja uchun poydevor darsi',
        message: 'Zero-level starting requirement for complete beginners.',
        evidence: { threshold: 'A0/N0' },
        priority: 99,
      },
      expectedOutcome: 'Learn correct stroke order and pronunciation for 5 basic vowels.',
      ctaLabel: '🇯🇵 Hiragana Boshlash',
      badgeIcon: '🔰',
      isZeroFoundation: true,
    };

    expect(zeroAction.isZeroFoundation).toBe(true);
    expect(zeroAction.type).toBe('zero_foundation');
    expect(zeroAction.reason.code).toBe('ZERO_LEVEL_FOUNDATION');
  });

  it('4. should create valid SkillAllocation with percentage and weighted time distribution', () => {
    const weakAllocation: SkillAllocation = {
      skill: 'listening',
      percentage: 40,
      weightPercentage: 40,
      minutes: 12,
      reason: 'Listening accuracy is below 50% (Weak Skill Remediation)',
      targetLevel: 'B1',
      isWeaknessFocus: true,
    };

    const standardAllocation: SkillAllocation = {
      skill: 'vocabulary',
      percentage: 20,
      weightPercentage: 20,
      minutes: 6,
      reason: 'Standard spaced vocabulary review',
      targetLevel: 'B2',
      isWeaknessFocus: false,
    };

    expect(weakAllocation.percentage).toBe(40);
    expect(weakAllocation.isWeaknessFocus).toBe(true);
    expect(standardAllocation.percentage).toBe(20);
  });

  it('5. should create valid DailyLearningPlan with itemized activities', () => {
    const plan: DailyLearningPlan = {
      userId: 'u_123',
      language: 'en',
      targetDate: '2026-08-20',
      totalMinutes: 30,
      allocatedMinutes: 30,
      completedMinutes: 0,
      remainingMinutes: 30,
      items: [
        {
          id: 'act-1',
          type: 'remediation',
          title: 'B1 Listening Dialogues',
          skill: 'listening',
          estimatedMinutes: 15,
          minutes: 15,
          route: '/lesson/en-b1-l1',
          priority: 90,
          isCompleted: false,
          reason: {
            code: 'WEAK_SKILL',
            type: 'weak_skill',
            title: "Zaif ko'nikma ustida ishlash",
            message: 'Listening is marked as a critical focus area.',
            evidence: { metricValue: '44%' },
            priority: 90,
          },
        },
        {
          id: 'act-2',
          type: 'srs_review',
          title: 'Review 15 Due Flashcards',
          estimatedMinutes: 10,
          minutes: 10,
          route: '/study-mode',
          priority: 85,
          isCompleted: false,
          reason: {
            code: 'SRS_DUE',
            type: 'due_srs',
            title: 'Takrorlash vaqti kelgan kartalar',
            message: '15 cards scheduled for spaced repetition review.',
            evidence: { metricValue: 15 },
            priority: 85,
          },
        },
        {
          id: 'act-3',
          type: 'skill_practice',
          title: 'Grammar Practice: Present Perfect',
          skill: 'grammar',
          estimatedMinutes: 5,
          minutes: 5,
          route: '/ielts?topic=present-perfect',
          priority: 75,
          isCompleted: false,
          reason: {
            code: 'RECENT_MISTAKES',
            type: 'mistake_topic',
            title: "Oxirgi xatolar bo'yicha mashq",
            message: 'Frequent mistakes detected in Present Perfect exercises.',
            evidence: { metricValue: 4 },
            priority: 75,
          },
        },
      ],
      skillAllocations: [
        {
          skill: 'listening',
          percentage: 50,
          minutes: 15,
          reason: 'Weakness focus',
          targetLevel: 'B1',
          isWeaknessFocus: true,
        },
        {
          skill: 'grammar',
          percentage: 17,
          minutes: 5,
          reason: 'Mistake recovery',
          targetLevel: 'B1',
          isWeaknessFocus: false,
        },
      ],
      primaryFocus: 'Listening Remediation & SRS Review',
      summaryReason: 'Targeted focus on Listening remediation and timely spaced repetition review.',
    };

    expect(plan.totalMinutes).toBe(30);
    expect(plan.items?.length).toBe(3);
    expect(plan.items?.[0].type).toBe('remediation');
  });

  it('6. should create valid ProgressionState with readiness score and missing evidence', () => {
    const reqs: ProgressionRequirement[] = [
      {
        id: 'req-mastery-grammar',
        title: 'B1 Grammar Mastery >= 80%',
        description: 'Overall grammar mastery score in B1 unit tests.',
        requiredValue: 80,
        currentValue: 85,
        isSatisfied: true,
        category: 'mastery',
      },
      {
        id: 'req-mastery-listening',
        title: 'B1 Listening Mastery >= 70%',
        description: 'Listening comprehension benchmark.',
        requiredValue: 70,
        currentValue: 48,
        isSatisfied: false,
        category: 'mastery',
      },
    ];

    const progression: ProgressionState = {
      currentLevel: 'B1',
      nextLevel: 'B2',
      isZeroLevel: false,
      readinessScore: 65,
      overallProgressPercentage: 65,
      canAdvance: false,
      requiredEvidence: ['Grammar mastery >= 80%', 'Listening mastery >= 70%'],
      missingEvidence: ['Listening mastery (48%) is below required threshold (70%)'],
      requirements: reqs,
      advancementBlockers: ['Listening mastery is insufficient'],
    };

    expect(progression.canAdvance).toBe(false);
    expect(progression.readinessScore).toBe(65);
    expect(progression.missingEvidence?.length).toBe(1);
  });

  it('7. should create complete LearningPathState consolidating all sub-models', () => {
    const state: LearningPathState = {
      userId: 'u_test_main',
      primaryLanguage: 'en',
      currentLevel: 'B1',
      targetLevel: 'C1',
      targetGoal: 'IELTS 7.5',
      availableStudyMinutes: 45,
      isZeroLevel: false,
      progression: {
        currentLevel: 'B1',
        nextLevel: 'B2',
        isZeroLevel: false,
        readinessScore: 70,
        overallProgressPercentage: 70,
        canAdvance: false,
        requirements: [],
        advancementBlockers: [],
      },
      nextAction: {
        type: 'remediation',
        title: 'B1 Listening Practice',
        description: 'Strengthen listening comprehension.',
        route: '/lesson/en-b1-l1',
        estimatedMinutes: 15,
        priority: 92,
        ctaLabel: '🎧 Practice Listening',
        reason: {
          code: 'WEAK_SKILL',
          type: 'weak_skill',
          title: "Zaif ko'nikmani mustahkamlash",
          message: 'Listening is your primary focus area.',
          evidence: { metricValue: '44%' },
          priority: 92,
        },
      },
      todayPlan: {
        userId: 'u_test_main',
        language: 'en',
        targetDate: '2026-08-20',
        totalMinutes: 45,
        allocatedMinutes: 45,
        completedMinutes: 0,
        remainingMinutes: 45,
        items: [],
        skillAllocations: [],
        primaryFocus: 'Listening',
        summaryReason: 'Targeted weak skill practice',
      },
      skillAllocations: [],
      reasons: [],
      lastEvaluatedAt: new Date().toISOString(),
    };

    expect(state.primaryLanguage).toBe('en');
    expect(state.targetGoal).toBe('IELTS 7.5');
    expect(state.availableStudyMinutes).toBe(45);
    expect(state.nextAction.reason.code).toBe('WEAK_SKILL');
  });

  it('8. should create valid LessonRecommendation, ReviewRecommendation, RemediationRecommendation and LearningDecision', () => {
    const lessonRec: LessonRecommendation = {
      lessonId: 'en-b1-u1-l1',
      title: 'Past Tenses in Context',
      level: 'B1',
      skill: 'grammar',
      route: '/lesson/en-b1-u1-l1',
      estimatedMinutes: 15,
      isResume: false,
      reason: {
        code: 'NEXT_CURRICULUM_STEP',
        type: 'curriculum_next',
        message: 'Next standard curriculum lesson',
        evidence: {},
        priority: 70,
      },
    };

    const reviewRec: ReviewRecommendation = {
      dueCount: 12,
      overdueCount: 4,
      estimatedMinutes: 8,
      averageRetentionScore: 82,
      urgency: 'high',
      reason: {
        code: 'SRS_OVERDUE',
        type: 'overdue_srs',
        message: '4 cards are overdue for spaced repetition',
        evidence: { metricValue: 4 },
        priority: 92,
      },
    };

    const remediationRec: RemediationRecommendation = {
      skill: 'listening',
      topic: 'Fast Speech & Connected Speech',
      severity: 'high',
      currentScore: 44,
      suggestedRoute: '/lesson/en-b1-listening-connected',
      estimatedMinutes: 12,
      recentMistakesCount: 3,
      reason: {
        code: 'WEAK_SKILL',
        type: 'weak_skill',
        message: 'Connected speech comprehension is below target benchmark',
        evidence: { metricValue: 3 },
        priority: 88,
      },
    };

    const decision: LearningDecision = {
      primaryAction: {
        type: 'remediation',
        title: 'Fast Speech & Connected Speech',
        description: 'Targeted listening session',
        route: '/lesson/en-b1-listening-connected',
        estimatedMinutes: 12,
        priority: 92,
        ctaLabel: '🎧 Start Listening',
        reason: remediationRec.reason,
      },
      rationale: 'Prioritizing high-severity listening weakness before curriculum progression.',
      evidenceSummary: ['Listening accuracy is 44% (benchmark >= 60%)', '4 SRS cards overdue'],
      generatedAt: new Date().toISOString(),
    };

    expect(lessonRec.lessonId).toBe('en-b1-u1-l1');
    expect(reviewRec.urgency).toBe('high');
    expect(remediationRec.severity).toBe('high');
    expect(decision.evidenceSummary.length).toBe(2);
  });

  it('9. should create valid RemediationItem and SRSAllocation instances', () => {
    const remItem: RemediationItem = {
      skill: 'listening',
      topic: 'Basic numbers listening',
      severity: 'medium',
      currentScore: 48,
      recentMistakesCount: 3,
      suggestedRoute: '/lesson/en-a1-numbers-listening',
      reason: {
        code: 'WEAK_SKILL',
        message: 'Listening is weak',
        evidence: { metricValue: 48 },
        priority: 80,
      },
    };

    const srsAlloc: SRSAllocation = {
      dueCount: 15,
      overdueCount: 5,
      minutesAllocated: 10,
      urgency: 'high',
      reason: {
        code: 'SRS_OVERDUE',
        message: 'Spaced repetition due cards',
        evidence: { metricValue: 5 },
        priority: 90,
      },
    };

    expect(remItem.topic).toBe('Basic numbers listening');
    expect(srsAlloc.urgency).toBe('high');
  });

  it('10. should construct valid LearningPathOptions configurations', () => {
    const opts: LearningPathOptions = {
      forceLanguage: 'en',
      customMinutes: 45,
      goalWeightingEnabled: true,
      skipSrs: false,
      skipRemediation: false,
    };

    expect(opts.forceLanguage).toBe('en');
    expect(opts.customMinutes).toBe(45);
  });
});
