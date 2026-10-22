/**
 * Task 16 real-content fixtures.
 *
 * These are derived from the repository's real JLPT content
 * (`src/data/jlptMockExamData.ts`, N1-N5) rather than invented placeholder
 * text, so the import/workflow/mock-exam flow is exercised with genuine
 * Japanese questions, passages and audio references.
 */

import { JLPT_MOCK_EXAM_DATA, type ExamQuestion } from '../../../data/jlptMockExamData';

export type Level = 'N3' | 'N2' | 'N1';
export const LEVELS: Level[] = ['N3', 'N2', 'N1'];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function pickLevelQuestions(level: Level): {
  knowledge: ExamQuestion[];
  reading: ExamQuestion[];
  listening: ExamQuestion[];
} {
  const all = JLPT_MOCK_EXAM_DATA[level] || [];
  const knowledge = all.filter((q) => q.section === 'knowledge').slice(0, 5);
  const reading = all.filter((q) => q.section === 'reading' && !!q.passageText).slice(0, 2);
  const listening = all.filter((q) => q.section === 'listening').slice(0, 2);

  // Guarantee at least one of each section for every level.
  const fallback = all[0];
  const readingFallback = all.find((q) => q.passageText) || fallback;
  const listeningFallback = all.find((q) => q.section === 'listening') || fallback;

  return {
    knowledge: knowledge.length ? knowledge : [fallback],
    reading: reading.length ? reading : [readingFallback],
    listening: listening.length ? listening : [listeningFallback],
  };
}

function answerLetter(q: ExamQuestion): string {
  return OPTION_LETTERS[q.correctAnswer] || OPTION_LETTERS[0];
}

export interface RawFixtureQuestion {
  id: string;
  section: 'knowledge' | 'reading' | 'listening';
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  translation: string;
  level: Level;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function buildRawQuestions(level: Level): RawFixtureQuestion[] {
  const { knowledge, reading, listening } = pickLevelQuestions(level);
  const map = (q: ExamQuestion, section: RawFixtureQuestion['section']): RawFixtureQuestion => ({
    id: `${level.toLowerCase()}-${section}-${q.id}`,
    section,
    question: q.questionText,
    passage: q.passageText,
    options: q.options,
    correctAnswer: answerLetter(q),
    explanation: q.explanationUzbek,
    translation: `JLPT ${level} ${section} — ${q.questionText.slice(0, 24)}`,
    level,
    difficulty: section === 'knowledge' ? 'medium' : section === 'reading' ? 'hard' : 'medium',
  });

  return [
    ...knowledge.map((q) => map(q, 'knowledge')),
    ...reading.map((q) => map(q, 'reading')),
    ...listening.map((q) => map(q, 'listening')),
  ];
}

/** Real JSON import payload (array form accepted by parseJson/extractQuestionsFromData). */
export function buildJsonPayload(level: Level): string {
  const questions = buildRawQuestions(level).map((q) => ({
    id: q.id,
    section: q.section,
    question: q.question,
    passage: q.passage,
    type: 'multiple_choice',
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    translation: q.translation,
    level: q.level,
    difficulty: q.difficulty,
  }));
  return JSON.stringify(questions, null, 2);
}

function csvCell(value: string | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** Real CSV import payload using the exact headers parseCsv expects. */
export function buildCsvPayload(level: Level): string {
  const headers = [
    'id',
    'section',
    'question',
    'passage',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correctAnswer',
    'explanation',
    'translation',
    'level',
    'difficulty',
  ];
  const rows = buildRawQuestions(level).map((q) =>
    [
      q.id,
      q.section,
      q.question,
      q.passage || '',
      q.options[0] || '',
      q.options[1] || '',
      q.options[2] || '',
      q.options[3] || '',
      q.correctAnswer,
      q.explanation,
      q.translation,
      q.level,
      q.difficulty,
    ]
      .map(csvCell)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

/** Real reading passage + a linked question for the passage-import step. */
export function buildReadingPassage(level: Level): {
  title: string;
  content: string;
  question: RawFixtureQuestion;
} {
  const { reading } = pickLevelQuestions(level);
  const source = reading[0];
  return {
    title: `JLPT ${level} Dokkai —真实読解 Passage`,
    content: source.passageText || source.questionText,
    question: {
      id: `${level.toLowerCase()}-passage-${source.id}`,
      section: 'reading',
      question: source.questionText,
      passage: source.passageText,
      options: source.options,
      correctAnswer: answerLetter(source),
      explanation: source.explanationUzbek,
      translation: `JLPT ${level} real reading passage (${
        (source.passageText || '').length
      } chars)`,
      level,
      difficulty: 'hard',
    },
  };
}

/** Real listening audio metadata + a linked question for the audio-import step. */
export function buildListeningAudio(level: Level): {
  title: string;
  audioUrl: string;
  transcript: string;
  uzTranslation: string;
  question: RawFixtureQuestion;
} {
  const { listening } = pickLevelQuestions(level);
  const source = listening[0];
  return {
    title: `JLPT ${level} Choukai Audio ${source.id}`,
    audioUrl: source.audioUrl || `/audio/choukai/${level.toLowerCase()}/fixture-${source.id}.mp3`,
    transcript: source.script || source.passageText || source.questionText,
    uzTranslation: `JLPT ${level} tinglash savoli uchun audio transkript.`,
    question: {
      id: `${level.toLowerCase()}-audio-${source.id}`,
      section: 'listening',
      question: source.questionText,
      options: source.options,
      correctAnswer: answerLetter(source),
      explanation: source.explanationUzbek,
      translation: `JLPT ${level} real listening audio`,
      level,
      difficulty: 'medium',
    },
  };
}

/** AI provider draft response (deterministic) used to prove the AI draft flow. */
export function buildAiDraftResponse(level: Level): string {
  const questions = buildRawQuestions(level)
    .slice(0, 3)
    .map((q, idx) => ({
      id: `ai-${idx + 1}`,
      question_text: q.question,
      passage: q.passage ?? null,
      options: q.options,
      correct_answer: q.options[OPTION_LETTERS.indexOf(q.correctAnswer)] || q.options[0],
      correct_index: OPTION_LETTERS.indexOf(q.correctAnswer),
      explanation: q.explanation,
      level: q.level,
      section_type: q.section,
      question_type: 'vocabulary_meaning',
      difficulty: q.difficulty,
      is_published: false,
    }));
  return JSON.stringify({
    recommendedTitle: `JLPT ${level} AI Draft Exam`,
    recommendedLevel: level,
    recommendedSection: 'knowledge',
    summary: `AI extracted ${questions.length} questions for ${level}.`,
    questions,
  });
}
