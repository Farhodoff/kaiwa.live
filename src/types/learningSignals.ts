import { SupportedLanguage } from './lesson';
import { LearningActivityType } from './learningEvidence';

export type LearningSignalType =
  | 'new_vocabulary'
  | 'grammar_pattern'
  | 'incorrect_answer'
  | 'correct_answer'
  | 'repeated_error'
  | 'completed_lesson'
  | 'diagnostic_completed';

export interface BaseLearningSignal {
  id: string;
  type: LearningSignalType;
  language: SupportedLanguage;
  lessonId: string;
  userId: string;
  timestamp: string;
  source?: string;
  skill?: string;
  /** Phase 19: canonical activity type of this signal. */
  activityType?: LearningActivityType;
}

export interface VocabularySignal extends BaseLearningSignal {
  type: 'new_vocabulary';
  term: string;
  reading?: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  srsCardId?: string;
}

export interface GrammarSignal extends BaseLearningSignal {
  type: 'grammar_pattern';
  pattern: string;
  meaning: string;
  level: string;
}

export interface IncorrectAnswerSignal extends BaseLearningSignal {
  type: 'incorrect_answer';
  stepId: string;
  questionId: string;
  prompt: string;
  userAnswer: string | number;
  expectedAnswer: string | number;
  explanation?: string;
  attemptCount: number;
}

export interface CorrectAnswerSignal extends BaseLearningSignal {
  type: 'correct_answer';
  stepId?: string;
  questionId: string;
  prompt?: string;
  userAnswer?: string | number;
  expectedAnswer?: string | number;
  explanation?: string;
  attemptCount?: number;
}

export interface RepeatedErrorSignal extends BaseLearningSignal {
  type: 'repeated_error';
  questionId: string;
  errorCount: number;
  prompt: string;
}

export interface CompletedLessonSignal extends BaseLearningSignal {
  type: 'completed_lesson';
  level: string;
  score: number;
  total: number;
  percentage: number;
  newCardsCreated: number;
  mistakesCount: number;
  durationMinutes?: number;
}

export interface DiagnosticCompletedSignal extends BaseLearningSignal {
  type: 'diagnostic_completed';
  diagnosticLevel: string;
  overallScore: number;
  overallConfidence: number;
}

export type LearningSignal =
  | VocabularySignal
  | GrammarSignal
  | IncorrectAnswerSignal
  | CorrectAnswerSignal
  | RepeatedErrorSignal
  | CompletedLessonSignal
  | DiagnosticCompletedSignal;
