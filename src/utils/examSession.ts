import type { NormalizedExam } from '../services/ExamService';
import type { JlptExamMode, JlptTimingConfig, SectionKey } from './jlptExamTiming';
import { safeLocalStorage } from './storage/safeLocalStorage';

export interface ExamDraft {
  version: 2;
  owner: string;
  exam: NormalizedExam;
  answers: Record<number, number>;
  flags: number[];
  activeSection: SectionKey;
  sealedSections: SectionKey[];
  mode: JlptExamMode;
  fullTime: boolean;
  timingConfig: JlptTimingConfig;
  deadline: number;
  startedAt: number;
  sectionDuration: number;
  syntheticListening: boolean;
}
const sections = ['knowledge', 'reading', 'listening'];
export const examDraftKey = (owner: string) => `kaiwa_exam_draft:v2:${encodeURIComponent(owner)}`;
export function secondsUntil(deadline: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function readExamDraft(owner: string): ExamDraft | null {
  try {
    const raw = safeLocalStorage.getItem(examDraftKey(owner));
    if (!raw) return null;
    const draft = JSON.parse(raw) as ExamDraft;
    if (
      draft.version !== 2 ||
      draft.owner !== owner ||
      !draft.exam?.id ||
      !['N5', 'N4', 'N3', 'N2', 'N1'].includes(draft.exam.level) ||
      !Array.isArray(draft.exam.questions) ||
      !draft.exam.questions.length ||
      !sections.includes(draft.activeSection) ||
      !Array.isArray(draft.sealedSections) ||
      !draft.sealedSections.every((s) => sections.includes(s)) ||
      !Array.isArray(draft.flags) ||
      !draft.flags.every(Number.isInteger) ||
      typeof draft.fullTime !== 'boolean' ||
      typeof draft.syntheticListening !== 'boolean' ||
      !draft.timingConfig ||
      typeof draft.timingConfig !== 'object' ||
      Array.isArray(draft.timingConfig) ||
      !draft.answers ||
      typeof draft.answers !== 'object' ||
      !['practice', 'official_timed'].includes(draft.mode) ||
      !Number.isFinite(draft.deadline) ||
      !Number.isFinite(draft.startedAt) ||
      !Number.isFinite(draft.sectionDuration) ||
      draft.sectionDuration <= 0 ||
      !draft.exam.questions.every(
        (q) =>
          Number.isInteger(q.id) &&
          sections.includes(q.section) &&
          Array.isArray(q.options) &&
          q.options.length > 1 &&
          Number.isInteger(q.correctAnswer) &&
          q.correctAnswer >= 0 &&
          q.correctAnswer < q.options.length,
      )
    )
      return null;
    const byId = new Map(draft.exam.questions.map((q) => [String(q.id), q]));
    if (
      byId.size !== draft.exam.questions.length ||
      !Object.entries(draft.answers).every(([id, answer]) => {
        const q = byId.get(id);
        return q && Number.isInteger(answer) && answer >= 0 && answer < q.options.length;
      })
    )
      return null;
    return draft;
  } catch {
    return null;
  }
}
export function saveExamDraft(draft: ExamDraft): boolean {
  return safeLocalStorage.setItem(examDraftKey(draft.owner), JSON.stringify(draft));
}
export function clearExamDraft(owner: string): void {
  safeLocalStorage.removeItem(examDraftKey(owner));
}
export function countExamAnswers(
  questions: { id: number; correctAnswer: number; options: string[] }[],
  answers: Record<number, number>,
) {
  let correct = 0,
    wrong = 0,
    skipped = 0;
  for (const q of questions) {
    const answer = answers[q.id];
    if (!Number.isInteger(answer) || answer < 0 || answer >= q.options.length) skipped++;
    else if (answer === q.correctAnswer) correct++;
    else wrong++;
  }
  return { correct, wrong, skipped, total: questions.length };
}
