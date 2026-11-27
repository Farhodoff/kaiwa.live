import type {
  LearningSignal,
  VocabularySignal,
  GrammarSignal,
  IncorrectAnswerSignal,
  RepeatedErrorSignal,
  CompletedLessonSignal,
} from '../types/learningSignals';
import { Lesson, VocabItem, SupportedLanguage } from '../types/lesson';
import { MasterySkill } from '../types/mastery';
import { Flashcard } from '../types';
import { FlashcardService } from './FlashcardService';
import { MasteryEngine } from './MasteryEngine';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const SIGNALS_STORAGE_PREFIX = 'study_planner_learning_signals_';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sig_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function normalizeTerm(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[\s()[\]（）]/g, '');
}

function stablePart(value: string | number | undefined): string {
  return (
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'unknown'
  );
}

function clampPercentage(scoreData: { score: number; total: number; percentage?: number }): number {
  if (typeof scoreData.percentage === 'number' && Number.isFinite(scoreData.percentage)) {
    return Math.max(0, Math.min(100, Math.round(scoreData.percentage)));
  }
  if (Number.isFinite(scoreData.score) && Number.isFinite(scoreData.total) && scoreData.total > 0) {
    return Math.max(0, Math.min(100, Math.round((scoreData.score / scoreData.total) * 100)));
  }
  return 0;
}

function inferSkillFromText(text: string, language: SupportedLanguage): MasterySkill | null {
  const lower = text.toLowerCase();
  if (language === 'ja' && (lower.includes('kanji') || /[\u4e00-\u9faf]/.test(text)))
    return 'kanji';
  if (
    lower.includes('grammar') ||
    lower.includes('grammatika') ||
    lower.includes('verb') ||
    lower.includes('tense') ||
    lower.includes('pattern')
  )
    return 'grammar';
  if (lower.includes('listen') || lower.includes('audio')) return 'listening';
  if (lower.includes('read') || lower.includes('passage')) return 'reading';
  if (lower.includes('speak') || lower.includes('interview')) return 'speaking';
  if (language === 'en' && (lower.includes('writ') || lower.includes('essay'))) return 'writing';
  if (lower.includes('vocab') || lower.includes('word') || lower.includes('term'))
    return 'vocabulary';
  return null;
}

function resolveLessonSkills(lesson: Lesson): MasterySkill[] {
  const skills = new Set<MasterySkill>();
  const validSkills: MasterySkill[] =
    lesson.language === 'ja'
      ? ['vocabulary', 'kanji', 'grammar', 'reading', 'listening', 'speaking']
      : ['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking'];

  const explicitSkill = (lesson as any).skill as MasterySkill | undefined;
  if (explicitSkill && validSkills.includes(explicitSkill)) skills.add(explicitSkill);

  for (const step of lesson.steps || []) {
    if (step.learnData?.vocabulary?.length) skills.add('vocabulary');
    if (
      lesson.language === 'ja' &&
      step.learnData?.vocabulary?.some(
        (v) =>
          /[\u4e00-\u9faf]/.test(v.term || '') || /[\u4e00-\u9faf]/.test(v.exampleSentence || ''),
      )
    ) {
      skills.add('kanji');
    }
    if (step.learnData?.grammarRules?.length) skills.add('grammar');
    const text = [step.title, step.practiceData?.instructions, step.testData?.instructions]
      .filter(Boolean)
      .join(' ');
    const inferred = inferSkillFromText(text, lesson.language);
    if (inferred && validSkills.includes(inferred)) skills.add(inferred);
  }

  const lessonText = [lesson.title, lesson.description, lesson.unitTitle].join(' ');
  const inferred = inferSkillFromText(lessonText, lesson.language);
  if (inferred && validSkills.includes(inferred)) skills.add(inferred);

  if (skills.size === 0) skills.add('grammar');
  return Array.from(skills);
}

function resolveSignalSkill(
  signal: IncorrectAnswerSignal,
  fallback: MasterySkill,
  language: SupportedLanguage,
): MasterySkill {
  const explicitSkill = signal.skill as MasterySkill | undefined;
  const validSkills: MasterySkill[] =
    language === 'ja'
      ? ['vocabulary', 'kanji', 'grammar', 'reading', 'listening', 'speaking']
      : ['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking'];
  if (explicitSkill && validSkills.includes(explicitSkill)) return explicitSkill;
  return inferSkillFromText(`${signal.prompt} ${signal.explanation || ''}`, language) || fallback;
}

export const LearningSignalService = {
  /**
   * Get all recorded learning signals for a user.
   */
  getSignalsForUser(userId: string): LearningSignal[] {
    const key = `${SIGNALS_STORAGE_PREFIX}${userId || 'guest'}`;
    return safeLocalStorage.getJSON<LearningSignal[]>(key, []);
  },

  /**
   * Record a single learning signal.
   */
  async recordSignal(signal: LearningSignal): Promise<void> {
    await this.recordSignalsBatch([signal]);
  },

  /**
   * Record multiple learning signals in a single batch.
   * Implements deterministic idempotency: ignores signals with IDs that already exist.
   */
  async recordSignalsBatch(signals: LearningSignal[]): Promise<void> {
    if (!signals || signals.length === 0) return;

    const grouped = new Map<string, LearningSignal[]>();
    for (const sig of signals) {
      if (!sig || !sig.id || !sig.userId || !sig.language || !sig.lessonId || !sig.timestamp) {
        console.warn('[LearningSignalService] Rejected invalid learning signal.');
        continue;
      }
      const list = grouped.get(sig.userId) || [];
      list.push(sig);
      grouped.set(sig.userId, list);
    }

    for (const [userId, userSignals] of grouped.entries()) {
      const key = `${SIGNALS_STORAGE_PREFIX}${userId || 'guest'}`;
      const current = this.getSignalsForUser(userId);
      const existingIds = new Set(current.map((s) => s.id).filter(Boolean));
      const uniqueNewSignals: LearningSignal[] = [];

      for (const sig of userSignals) {
        if (sig.userId !== userId) continue;
        if (existingIds.has(sig.id)) continue;
        existingIds.add(sig.id);
        uniqueNewSignals.push(sig);
      }

      if (uniqueNewSignals.length === 0) continue;

      const updated = [...current, ...uniqueNewSignals].slice(-300);
      safeLocalStorage.setJSON(key, updated);
      // Do NOT mirror learning_signals into auth user_metadata: it is embedded in the
      // JWT, so a growing array bloats every request header and causes HTTP 431/494.
    }
  },

  /**
   * Check whether a vocabulary term already exists in user's flashcards.
   * Prevents duplicate card creation across repeated lessons.
   */
  isVocabAlreadyInFlashcards(vocab: VocabItem, existingCards: Flashcard[]): boolean {
    if (!vocab || !vocab.term) return true;
    const normalizedVocabTerm = normalizeTerm(vocab.term);

    return existingCards.some((card) => {
      if (!card.front) return false;
      const normalizedFront = normalizeTerm(card.front);
      // Matches exact term or front starts with term
      return (
        normalizedFront === normalizedVocabTerm ||
        normalizedFront.startsWith(normalizedVocabTerm) ||
        normalizedVocabTerm.startsWith(normalizedFront)
      );
    });
  },

  /**
   * Ingests vocabulary into the user's SRS flashcard deck and records all relevant learning signals.
   */
  async processLessonCompletion(
    userId: string,
    lesson: Lesson,
    scoreData: { score: number; total: number; percentage: number },
    incorrectAnswers: IncorrectAnswerSignal[] = [],
  ): Promise<{ newCardsCount: number; mistakesCount: number }> {
    const timestamp = new Date().toISOString();
    const activeUserId = userId || 'guest';
    const emittedSignals: LearningSignal[] = [];

    // 1. Extract vocabulary from all "learn" steps in this lesson
    const allVocab: VocabItem[] = [];
    lesson.steps.forEach((step) => {
      if (step.type === 'learn' && step.learnData?.vocabulary) {
        allVocab.push(...step.learnData.vocabulary);
      }
    });

    // 2. Fetch existing cards to perform duplicate protection check
    let existingCards: Flashcard[] = [];
    try {
      existingCards = await FlashcardService.fetchFlashcards(activeUserId);
    } catch (e) {
      console.warn(
        '[LearningSignalService] Could not fetch existing cards for duplicate check:',
        e,
      );
    }

    const cardsToCreate: Partial<Flashcard>[] = [];

    allVocab.forEach((v) => {
      const alreadyExists = this.isVocabAlreadyInFlashcards(v, existingCards);

      if (!alreadyExists) {
        const frontText = `${v.term}${v.reading ? ` (${v.reading})` : ''}`.trim();
        const backText = [
          v.meaning,
          v.exampleSentence ? `\n\n📌 Misol: ${v.exampleSentence}` : '',
          v.exampleTranslation ? `\n(${v.exampleTranslation})` : '',
        ]
          .join('')
          .trim();

        const newCard: Partial<Flashcard> = {
          front: frontText,
          back: backText,
          nextReviewDate: timestamp,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
        };
        cardsToCreate.push(newCard);

        // Add to local list so duplicates within the same lesson are also skipped
        existingCards.push({
          id: generateUUID(),
          subjectId: '',
          front: frontText,
          back: backText,
          nextReviewDate: timestamp,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
        });

        // Create vocabulary signal
        const vocabSignal: VocabularySignal = {
          id: `vocab_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${stablePart(v.term)}`,
          type: 'new_vocabulary',
          language: lesson.language,
          lessonId: lesson.id,
          userId: activeUserId,
          term: v.term,
          reading: v.reading,
          meaning: v.meaning,
          exampleSentence: v.exampleSentence,
          exampleTranslation: v.exampleTranslation,
          timestamp,
        };
        emittedSignals.push(vocabSignal);
      }
    });

    // 3. Batch insert new non-duplicate cards into SRS
    let createdCount = 0;
    if (cardsToCreate.length > 0) {
      try {
        const created = await FlashcardService.addFlashcardsBatch(activeUserId, cardsToCreate);
        createdCount = created.length;
      } catch (err) {
        console.error('[LearningSignalService] Failed to auto-create SRS cards:', err);
      }
    }

    // 4. Capture Grammar signals from the lesson
    lesson.steps.forEach((step) => {
      if (step.type === 'learn' && step.learnData?.grammarRules) {
        step.learnData.grammarRules.forEach((rule) => {
          const grammarSignal: GrammarSignal = {
            id: `grammar_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${stablePart(rule.pattern)}`,
            type: 'grammar_pattern',
            language: lesson.language,
            lessonId: lesson.id,
            userId: activeUserId,
            pattern: rule.pattern,
            meaning: rule.meaning,
            level: lesson.level,
            timestamp,
          };
          emittedSignals.push(grammarSignal);
        });
      }
    });

    const lessonSkills = resolveLessonSkills(lesson);
    const primaryLessonSkill = lessonSkills[0] || 'grammar';

    // 5. Check for repeated errors (questions failed >= 2 times)
    const errorCountByQuestion: Record<string, { count: number; prompt: string }> = {};
    incorrectAnswers.forEach((err) => {
      if (!errorCountByQuestion[err.questionId]) {
        errorCountByQuestion[err.questionId] = { count: 0, prompt: err.prompt };
      }
      errorCountByQuestion[err.questionId].count += 1;
    });

    Object.entries(errorCountByQuestion).forEach(([qId, data]) => {
      if (data.count >= 2) {
        const repeatedSignal: RepeatedErrorSignal = {
          id: `repeated_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${stablePart(qId)}`,
          type: 'repeated_error',
          language: lesson.language,
          lessonId: lesson.id,
          userId: activeUserId,
          questionId: qId,
          errorCount: data.count,
          prompt: data.prompt,
          skill: inferSkillFromText(data.prompt, lesson.language) || primaryLessonSkill,
          timestamp,
        };
        emittedSignals.push(repeatedSignal);
      }
    });

    const normalizedIncorrectAnswers = incorrectAnswers.map((err, index) => ({
      ...err,
      id:
        err.id ||
        `incorrect_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${stablePart(err.questionId)}_${index}`,
      userId: activeUserId,
      language: lesson.language,
      lessonId: lesson.id,
      skill: resolveSignalSkill(err, primaryLessonSkill, lesson.language),
      timestamp: err.timestamp || timestamp,
    }));

    // Add the incorrect answer signals after enforcing user/language/lesson isolation.
    emittedSignals.push(...normalizedIncorrectAnswers);

    // 6. Record CompletedLessonSignal
    const completionSignal: CompletedLessonSignal = {
      id: `completed_${stablePart(activeUserId)}_${stablePart(lesson.id)}`,
      type: 'completed_lesson',
      language: lesson.language,
      lessonId: lesson.id,
      userId: activeUserId,
      level: lesson.level,
      score: Number.isFinite(scoreData.score) ? scoreData.score : 0,
      total: Number.isFinite(scoreData.total) && scoreData.total > 0 ? scoreData.total : 1,
      percentage: clampPercentage(scoreData),
      newCardsCreated: createdCount,
      mistakesCount: normalizedIncorrectAnswers.length,
      durationMinutes: lesson.estimatedDurationMinutes,
      timestamp,
      activityType: 'lesson_completion',
    };
    emittedSignals.push(completionSignal);

    // 7. Save all emitted signals in batch
    await this.recordSignalsBatch(emittedSignals);

    // 8. Record lesson mastery evidence in MasteryEngine
    const finalPercentage = clampPercentage(scoreData);

    for (const lessonSkill of lessonSkills) {
      // Completion evidence (checkbox — does NOT raise mastery). Stable upsert prevents duplicate completions inflating evidence.
      MasteryEngine.upsertEvidence(activeUserId, lesson.language, {
        id: `lesson_completion_ev_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${lessonSkill}`,
        userId: activeUserId,
        language: lesson.language,
        activityType: 'lesson_completion',
        category: 'completion',
        lessonId: lesson.id,
        skill: lessonSkill,
        score: finalPercentage,
        isCompleted: true,
        timeSpent: lesson.estimatedDurationMinutes,
        timestamp,
        completedAt: timestamp,
        details: `Lesson completed: ${lesson.title}`,
        source: 'lesson_player',
      });

      // Quiz/result evidence is the only lesson completion evidence that raises mastery.
      MasteryEngine.upsertEvidence(activeUserId, lesson.language, {
        id: `lesson_result_ev_${stablePart(activeUserId)}_${stablePart(lesson.id)}_${lessonSkill}`,
        userId: activeUserId,
        language: lesson.language,
        activityType: 'quiz',
        category: 'performance',
        lessonId: lesson.id,
        skill: lessonSkill,
        score: finalPercentage,
        accuracy: finalPercentage,
        attempts: 1,
        timestamp,
        details: `Lesson final result: ${lesson.title} (${finalPercentage}%)`,
        source: 'lesson_player',
      });
    }

    return {
      newCardsCount: createdCount,
      mistakesCount: normalizedIncorrectAnswers.length,
    };
  },

  /**
   * Records a single quiz answer into both MasteryEngine and LearningSignalService with idempotency.
   */
  async recordQuizAnswer(
    userId: string,
    language: SupportedLanguage,
    params: {
      id?: string;
      eventId?: string;
      lessonId?: string;
      questionId: string;
      prompt: string;
      isCorrect: boolean;
      userAnswer?: string | number;
      expectedAnswer?: string | number;
      skill?: MasterySkill;
      explanation?: string;
      attemptCount?: number;
      source?: string;
    },
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const activeUserId = userId || 'guest';
    const skill = params.skill || 'grammar';
    const eventId = params.eventId || params.id || generateUUID();

    // 1. Record evidence in MasteryEngine
    const score = params.isCorrect ? 100 : 0;
    MasteryEngine.recordEvent(activeUserId, language, {
      id: `ev_quiz_${eventId}`,
      activityType: 'quiz',
      lessonId: params.lessonId,
      skill,
      score,
      accuracy: score,
      attempts: params.attemptCount || 1,
      timestamp,
      details: `Quiz answer: ${params.prompt?.slice(0, 50) || 'Question'}`,
      source: params.source || 'quiz',
    });

    // 2. If correct, record correct_answer signal
    if (params.isCorrect) {
      await this.recordSignal({
        id: eventId,
        type: 'correct_answer',
        language,
        lessonId: params.lessonId || 'quiz',
        userId: activeUserId,
        timestamp,
        stepId: 'quiz_step',
        questionId: params.questionId,
        prompt: params.prompt,
        userAnswer: params.userAnswer ?? '',
        expectedAnswer: params.expectedAnswer ?? '',
        explanation: params.explanation,
        attemptCount: params.attemptCount || 1,
        skill,
        source: params.source || 'quiz',
      });
    } else {
      // 3. If incorrect, record incorrect_answer signal
      await this.recordSignal({
        id: eventId,
        type: 'incorrect_answer',
        language,
        lessonId: params.lessonId || 'quiz',
        userId: activeUserId,
        timestamp,
        stepId: 'quiz_step',
        questionId: params.questionId,
        prompt: params.prompt,
        userAnswer: params.userAnswer ?? '',
        expectedAnswer: params.expectedAnswer ?? '',
        explanation: params.explanation,
        attemptCount: params.attemptCount || 1,
        skill,
        source: params.source || 'quiz',
      });
    }
  },
};
