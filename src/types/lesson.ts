export type SupportedLanguage = 'en' | 'ja';

export type LessonStepType = 'learn' | 'practice' | 'test';

export interface VocabItem {
  term: string;
  reading?: string; // Furigana or phonetic transcription
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

export interface LessonKanji {
  kanji: string;
  onyomi?: string;
  kunyomi?: string;
  meaningUz: string;
  strokeCount?: number;
  examples?: {
    word: string;
    reading: string;
    meaning: string;
  }[];
}

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface KanjiLessonItem {
  id: string;
  kanji: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  strokeCount: number;
  exampleWords: { word: string; reading: string; meaning: string }[];
  exampleSentence: string;
  exampleTranslation: string;
  jlptLevel: JlptLevel;
  strokeOrderAsset?: string;
  strokeOrderUrl?: string;
}

export interface GrammarRule {
  pattern: string;
  meaning: string;
  usageNotes?: string;
  examples: {
    sentence: string;
    translation: string;
  }[];
}

export interface DialogueLineItem {
  id?: string;
  speaker: string;
  speakerRoleUz?: string;
  gender?: 'male' | 'female' | 'neutral';
  japanese: string;
  romaji?: string;
  uzbek: string;
  startTime?: number;
  endTime?: number;
}

export interface LessonDialogue {
  title: string;
  titleJa?: string;
  situationUz?: string;
  audioUrl?: string;
  lines: DialogueLineItem[];
}

export interface LearnContent {
  title: string;
  subtitle?: string;
  explanation: string;
  keyPoints?: string[];
  vocabulary?: VocabItem[];
  kanji?: KanjiLessonItem[];
  grammarRules?: GrammarRule[];
  culturalNotes?: string;
  dialogue?: LessonDialogue;
}

export interface PracticeExercise {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'sentence-order';
  category?:
    | 'guided-practice'
    | 'grammar-drill'
    | 'vocabulary-drill'
    | 'reading-application'
    | 'listening-application'
    | 'sentence-building'
    | 'translation'
    | 'speaking-prompt'
    | 'writing-prompt'
    | 'kanji-reading'
    | 'kanji-meaning'
    | 'kanji-compound'
    | 'kanji-writing';
  prompt: string;
  audioUrl?: string; // Real CD audio track for listening practice
  audioTitle?: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  hint?: string;
  starPosition?: number;
  fragments?: string[];
  correctOrder?: number[];
}

export interface TestQuestion {
  id: string;
  question: string;
  audioUrl?: string; // Real CD audio track for listening comprehension
  audioTitle?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  category?: 'kanji' | 'vocabulary' | 'grammar' | 'reading' | 'listening';
}

export interface LessonStep {
  id: string;
  title: string;
  type: LessonStepType;
  estimatedMinutes: number;
  learnData?: LearnContent;
  practiceData?: {
    instructions: string;
    exercises: PracticeExercise[];
  };
  testData?: {
    instructions: string;
    passingScorePercentage: number;
    questions: TestQuestion[];
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  unitId: string;
  unitTitle: string;
  language: SupportedLanguage;
  level: string; // e.g. 'N3' or 'B2'
  lessonNumber: number;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  icon?: string;
  kanji?: LessonKanji[];
  steps: LessonStep[];
}

export interface UserLessonProgress {
  lessonId: string;
  userId: string;
  currentStepIndex: number;
  completedStepIds: string[];
  isCompleted: boolean;
  completed?: boolean; // Legacy alias for backward compatibility
  quizScore?: {
    score: number;
    total: number;
    percentage: number;
  };
  lastAttemptedAt: string;
  completedAt?: string;
}
