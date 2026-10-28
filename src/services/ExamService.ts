import { supabase } from '../lib/supabase';
import {
  JLPT_MOCK_EXAM_DATA,
  JLPT_MOCK_EXAM_SET2_DATA,
  JLPT_MOCK_EXAM_SET3_DATA,
  ExamQuestion,
} from '../data/jlptMockExamData';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

import type { ExamWorkflowStatus } from './ExamWorkflowService';
import type { ExamLicenseType } from '../types/examMetadata';

export interface ExamListItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  level: JlptLevel;
  isPublished: boolean;
  status?: ExamWorkflowStatus;
  createdAt: string;
  totalQuestions?: number;
  sourceName?: string | null;
  sourceUrl?: string | null;
  author?: string | null;
  licenseType?: ExamLicenseType;
  copyrightConfirmed?: boolean;
  isOfficialJlpt?: boolean;
}

export interface NormalizedExam {
  id: string;
  title: string;
  description: string | null;
  type: string;
  level: JlptLevel;
  questions: ExamQuestion[];
  timeLimitSeconds: number;
  isFromDb: boolean;
  sourceName?: string | null;
  sourceUrl?: string | null;
  author?: string | null;
  licenseType?: ExamLicenseType;
  copyrightConfirmed?: boolean;
  isOfficialJlpt?: boolean;
  generationWarnings?: string[];
}

export type ExamSection = ExamQuestion['section'];

export interface AnsweredQuestionRecord {
  originalId: string;
  answeredAt: number;
}

export interface RandomizedExamOptions {
  now?: number;
  random?: () => number;
  questionPool?: ExamQuestion[];
  noRepeatPeriodDays?: number;
  recentAnswered?: AnsweredQuestionRecord[];
  targetCounts?: Partial<Record<ExamSection, number>>;
}

export const DEFAULT_NO_REPEAT_PERIOD_DAYS = 30;

const ANSWERED_QUESTIONS_STORAGE_KEY = 'jlpt_answered_questions_v2';
const LEGACY_ANSWERED_QUESTIONS_KEY = 'jlpt_recent_answered_qids';
const NO_REPEAT_SETTINGS_STORAGE_KEY = 'jlpt_no_repeat_settings';
const MAX_ANSWERED_RECORDS = 3000;
const RANDOM_EXAM_TARGETS: Record<ExamSection, number> = {
  knowledge: 13,
  reading: 6,
  listening: 6,
};

const DEFAULT_TIME_LIMITS: Record<JlptLevel, number> = {
  N5: 3000, // 50 mins
  N4: 3300, // 55 mins
  N3: 4200, // 70 mins
  N2: 4800, // 80 mins
  N1: 5400, // 90 mins
};

export class ExamService {
  /**
   * Helper to normalize a JLPT level from a type string (e.g. "JLPT N2" -> "N2")
   */
  static parseLevelFromType(typeStr?: string): JlptLevel {
    if (!typeStr) return 'N5';
    const upper = typeStr.toUpperCase();
    if (upper.includes('N1')) return 'N1';
    if (upper.includes('N2')) return 'N2';
    if (upper.includes('N3')) return 'N3';
    if (upper.includes('N4')) return 'N4';
    return 'N5';
  }

  /**
   * Fetch all published JLPT exams from Supabase, optionally filtered by level.
   */
  static async getPublishedJlptExams(level?: JlptLevel): Promise<ExamListItem[]> {
    try {
      let query = supabase
        .from('exams')
        .select(
          'id, title, description, type, is_published, status, created_at, source_name, source_url, author, license_type, copyright_confirmed, is_official_jlpt',
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (level) {
        // Match "JLPT N5", "N5", etc.
        query = query.ilike('type', `%${level}%`);
      } else {
        query = query.ilike('type', '%JLPT%');
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        // Enforce workflow: only exams that are not archived and have published status (or null in legacy)
        const visibleExams = data.filter(
          (item: any) => item.status !== 'archived' && item.status !== 'draft',
        );
        return visibleExams.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          level: this.parseLevelFromType(item.type),
          isPublished: item.is_published,
          status: item.status,
          createdAt: item.created_at,
          sourceName: item.source_name || null,
          sourceUrl: item.source_url || null,
          author: item.author || null,
          licenseType: item.license_type || 'original',
          copyrightConfirmed: Boolean(item.copyright_confirmed),
          isOfficialJlpt: Boolean(item.is_official_jlpt),
        }));
      }
    } catch (err) {
      console.warn('ExamService: Failed to fetch exams from Supabase, using fallback', err);
    }

    // Offline / Network fallback list (Provides Set 1 and Set 2 for each level)
    const fallbackLevels: JlptLevel[] = level ? [level] : ['N5', 'N4', 'N3', 'N2', 'N1'];
    const items: ExamListItem[] = [];
    for (const lvl of fallbackLevels) {
      items.push({
        id: `builtin_${lvl.toLowerCase()}`,
        title: `JLPT ${lvl} Rasmiy Mock Test - 1-to'plam`,
        description: `Rasmiy formatdagi ${lvl} daraja yapon tili imtihoni (1-to'liq sinov).`,
        type: `JLPT ${lvl}`,
        level: lvl,
        isPublished: true,
        createdAt: new Date().toISOString(),
        totalQuestions: JLPT_MOCK_EXAM_DATA[lvl]?.length || 25,
      });
      items.push({
        id: `builtin_${lvl.toLowerCase()}_set2`,
        title: `JLPT ${lvl} Rasmiy Mock Test - 2-to'plam (500 Mon & Shin Kanzen)`,
        description: `500 Mon va Shin Kanzen asosidagi ${lvl} daraja imtihon simulyatori (2-to'liq sinov).`,
        type: `JLPT ${lvl}`,
        level: lvl,
        isPublished: true,
        createdAt: new Date().toISOString(),
        totalQuestions: JLPT_MOCK_EXAM_SET2_DATA[lvl]?.length || 25,
      });
      items.push({
        id: `builtin_${lvl.toLowerCase()}_set3`,
        title: `JLPT ${lvl} Rasmiy Mock Test - 3-to'plam (Speed Master & Choukai Masterclass)`,
        description: `Speed Master va Choukai Masterclass asosidagi ${lvl} daraja imtihon simulyatori (3-to'liq sinov).`,
        type: `JLPT ${lvl}`,
        level: lvl,
        isPublished: true,
        createdAt: new Date().toISOString(),
        totalQuestions: JLPT_MOCK_EXAM_SET3_DATA[lvl]?.length || 25,
      });
      items.push({
        id: `builtin_${lvl.toLowerCase()}_random`,
        title: `JLPT ${lvl} 🎲 Aqlli Dinamik Variant (Smart Dynamic Simulator)`,
        description: `Barcha to'plamlardan saralangan, takrorlanmaydigan savollar bilan tuzilgan yangi simulyatsiya.`,
        type: `JLPT ${lvl}`,
        level: lvl,
        isPublished: true,
        createdAt: new Date().toISOString(),
        totalQuestions: 25,
      });
    }
    return items;
  }

  /**
   * Fetch an exam with its sections and questions, normalized into standard ExamQuestion[] format.
   * If not found or if offline, safely falls back to local JLPT_MOCK_EXAM_DATA.
   */
  static async getExamWithQuestions(
    examId: string,
    fallbackLevel: JlptLevel = 'N5',
  ): Promise<NormalizedExam> {
    // If ID is a built-in slug
    if (examId.startsWith('builtin_')) {
      const lvl = this.parseLevelFromType(examId);
      if (examId.endsWith('_random')) {
        return this.buildRandomizedExam(lvl);
      }
      const isSet3 = examId.endsWith('_set3');
      const isSet2 = examId.endsWith('_set2');
      return this.buildFallbackExam(lvl, isSet2, isSet3);
    }

    try {
      // 1. Fetch Exam
      const { data: examData, error: examErr } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examErr || !examData) throw examErr || new Error('Exam not found');

      const lvl = this.parseLevelFromType(examData.type);

      // 2. Fetch Sections
      const { data: sectionsData, error: secErr } = await supabase
        .from('exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (secErr) throw secErr;
      const sections = sectionsData || [];

      if (sections.length === 0) {
        return this.buildFallbackExam(lvl, examData);
      }

      // 3. Fetch Questions
      const sectionIds = sections.map((s) => s.id);
      const { data: questionsData, error: qErr } = await supabase
        .from('exam_questions')
        .select('*')
        .in('section_id', sectionIds)
        .order('order_index', { ascending: true });

      if (qErr) throw qErr;
      const rawQuestions = questionsData || [];

      if (rawQuestions.length === 0) {
        return this.buildFallbackExam(lvl, examData);
      }

      // 4. Map sections dictionary
      const sectionMap = new Map<string, any>();
      sections.forEach((s) => sectionMap.set(s.id, s));

      // 5. Convert to normalized ExamQuestion[]
      const questions: ExamQuestion[] = rawQuestions.map((q, idx) => {
        const sec = sectionMap.get(q.section_id);
        const secType = (sec?.type || '').toLowerCase();
        const secTitle = (sec?.title || '').toLowerCase();

        let sectionCategory: 'knowledge' | 'reading' | 'listening' = 'knowledge';
        if (secType.includes('read') || secTitle.includes('読解') || secTitle.includes('dokkai')) {
          sectionCategory = 'reading';
        } else if (
          secType.includes('listen') ||
          secTitle.includes('聴解') ||
          secTitle.includes('choukai')
        ) {
          sectionCategory = 'listening';
        }

        // Parse options (can be string array or json string)
        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options.map(String);
        } else if (typeof q.options === 'string') {
          try {
            options = JSON.parse(q.options);
          } catch {
            options = [q.options];
          }
        }

        // Resolve correct answer index (0..3)
        let correctAnswerIndex = 0;
        if (typeof q.correct_answer === 'string') {
          const matchedIdx = options.findIndex((opt) => opt.trim() === q.correct_answer.trim());
          if (matchedIdx !== -1) {
            correctAnswerIndex = matchedIdx;
          } else {
            const parsed = parseInt(q.correct_answer, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < options.length) {
              correctAnswerIndex = parsed;
            }
          }
        } else if (typeof q.correct_answer === 'number') {
          correctAnswerIndex = q.correct_answer;
        }

        return {
          id: idx + 1,
          originalId: String(q.id),
          displayNumber: idx + 1,
          section: sectionCategory,
          questionText: q.question_text || '',
          passageText: sectionCategory === 'reading' ? sec?.content || undefined : undefined,
          audioUrl: sectionCategory === 'listening' ? sec?.audio_url || undefined : undefined,
          script: sectionCategory === 'listening' ? sec?.content || undefined : undefined,
          options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
          correctAnswer: correctAnswerIndex,
          explanationUzbek: q.explanation || "Rasmiy JLPT mezonlari bo'yicha to'g'ri javob.",
        };
      });

      return {
        id: examData.id,
        title: examData.title,
        description: examData.description,
        type: examData.type,
        level: lvl,
        questions,
        timeLimitSeconds: DEFAULT_TIME_LIMITS[lvl] || 3000,
        isFromDb: true,
        sourceName: examData.source_name || null,
        sourceUrl: examData.source_url || null,
        author: examData.author || null,
        licenseType: examData.license_type || 'original',
        copyrightConfirmed: Boolean(examData.copyright_confirmed),
        isOfficialJlpt: Boolean(examData.is_official_jlpt),
      };
    } catch (err) {
      console.warn('ExamService: Falling back to local dataset for exam', examId, err);
      return this.buildFallbackExam(fallbackLevel);
    }
  }

  /**
   * Helper to construct a local mock exam when DB is offline or empty
   */
  private static buildFallbackExam(
    level: JlptLevel,
    isSet2: boolean = false,
    isSet3: boolean = false,
    existingExamMeta?: any,
  ): NormalizedExam {
    const rawQuestions = isSet3
      ? JLPT_MOCK_EXAM_SET3_DATA[level] || JLPT_MOCK_EXAM_DATA[level]
      : isSet2
        ? JLPT_MOCK_EXAM_SET2_DATA[level] || JLPT_MOCK_EXAM_DATA[level]
        : JLPT_MOCK_EXAM_DATA[level] || JLPT_MOCK_EXAM_DATA['N5'];
    const title = isSet3
      ? `JLPT ${level} Rasmiy Mock Test - 3-to'plam (Speed Master & Choukai Masterclass)`
      : isSet2
        ? `JLPT ${level} Rasmiy Mock Test - 2-to'plam (500 Mon & Shin Kanzen)`
        : `JLPT ${level} Rasmiy Mock Test - 1-to'plam`;
    const id =
      existingExamMeta?.id ||
      (isSet3
        ? `builtin_${level.toLowerCase()}_set3`
        : isSet2
          ? `builtin_${level.toLowerCase()}_set2`
          : `builtin_${level.toLowerCase()}`);
    return {
      id,
      title: existingExamMeta?.title || title,
      description:
        existingExamMeta?.description ||
        (isSet3
          ? `Speed Master va Choukai Masterclass asosidagi ${level} daraja imtihon sinovi.`
          : isSet2
            ? `500 Mon va Shin Kanzen asosidagi ${level} daraja imtihon sinovi.`
            : `Rasmiy formatdagi ${level} daraja yapon tili sinovi.`),
      type: existingExamMeta?.type || `JLPT ${level}`,
      level,
      questions: this.withDisplayNumbers(rawQuestions),
      timeLimitSeconds: DEFAULT_TIME_LIMITS[level] || 3000,
      isFromDb: false,
    };
  }

  private static getQuestionOriginalId(question: ExamQuestion): string {
    return String(question.originalId ?? question.id);
  }

  private static withDisplayNumbers(questions: ExamQuestion[]): ExamQuestion[] {
    return questions.map((question, idx) => ({
      ...question,
      id: idx + 1,
      displayNumber: idx + 1,
      originalId: this.getQuestionOriginalId(question),
    }));
  }

  private static getStorage(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;
    }
  }

  private static shuffle<T>(items: T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static getNoRepeatPeriodDays(): number {
    const storage = this.getStorage();
    if (!storage) return DEFAULT_NO_REPEAT_PERIOD_DAYS;
    try {
      const raw = storage.getItem(NO_REPEAT_SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_NO_REPEAT_PERIOD_DAYS;
      const parsed = JSON.parse(raw);
      const value = typeof parsed === 'number' ? parsed : parsed?.periodDays;
      if (!Number.isFinite(value) || value < 0) return DEFAULT_NO_REPEAT_PERIOD_DAYS;
      return Math.floor(value);
    } catch {
      return DEFAULT_NO_REPEAT_PERIOD_DAYS;
    }
  }

  static setNoRepeatPeriodDays(days: number): void {
    const storage = this.getStorage();
    if (!storage) return;
    const normalized =
      Number.isFinite(days) && days >= 0 ? Math.floor(days) : DEFAULT_NO_REPEAT_PERIOD_DAYS;
    try {
      storage.setItem(NO_REPEAT_SETTINGS_STORAGE_KEY, JSON.stringify({ periodDays: normalized }));
    } catch {
      // Ignore storage errors
    }
  }

  static getAnsweredQuestionRecords(now: number = Date.now()): AnsweredQuestionRecord[] {
    const storage = this.getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(ANSWERED_QUESTIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (item) =>
                item &&
                typeof item.originalId === 'string' &&
                item.originalId.length > 0 &&
                Number.isFinite(item.answeredAt),
            )
            .map((item) => ({
              originalId: item.originalId,
              answeredAt: Number(item.answeredAt),
            }));
        }
      }

      const legacyRaw = storage.getItem(LEGACY_ANSWERED_QUESTIONS_KEY);
      if (!legacyRaw) return [];
      const legacyIds = JSON.parse(legacyRaw);
      if (!Array.isArray(legacyIds)) return [];
      const migrated = Array.from(new Set(legacyIds.map((id) => String(id)))).map((originalId) => ({
        originalId,
        answeredAt: now,
      }));
      if (migrated.length > 0) {
        storage.setItem(ANSWERED_QUESTIONS_STORAGE_KEY, JSON.stringify(migrated));
      }
      storage.removeItem(LEGACY_ANSWERED_QUESTIONS_KEY);
      return migrated;
    } catch {
      return [];
    }
  }

  static getRecentAnsweredQuestionIds(
    periodDays: number = this.getNoRepeatPeriodDays(),
    now: number = Date.now(),
  ): Set<string> {
    if (periodDays <= 0) return new Set();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    return new Set(
      this.getAnsweredQuestionRecords(now)
        .filter((record) => now - record.answeredAt <= periodMs)
        .map((record) => record.originalId),
    );
  }

  /**
   * Builds a dynamic, randomized mock exam variant with no-repeat prioritization.
   */
  static buildRandomizedExam(
    level: JlptLevel,
    options: RandomizedExamOptions = {},
  ): NormalizedExam {
    const now = options.now ?? Date.now();
    const random = options.random ?? Math.random;
    const set1 = JLPT_MOCK_EXAM_DATA[level] || [];
    const set2 = JLPT_MOCK_EXAM_SET2_DATA[level] || [];
    const set3 = JLPT_MOCK_EXAM_SET3_DATA[level] || [];
    const rawPool = options.questionPool ?? [...set1, ...set2, ...set3];

    const uniquePool: ExamQuestion[] = [];
    const seenOriginalIds = new Set<string>();
    for (const question of rawPool) {
      const originalId = this.getQuestionOriginalId(question);
      if (seenOriginalIds.has(originalId)) continue;
      seenOriginalIds.add(originalId);
      uniquePool.push({ ...question, originalId });
    }
    const duplicateCount = rawPool.length - uniquePool.length;

    const periodDays = options.noRepeatPeriodDays ?? this.getNoRepeatPeriodDays();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const recentAnsweredAt = new Map<string, number>();
    if (periodDays > 0) {
      const records = options.recentAnswered ?? this.getAnsweredQuestionRecords(now);
      for (const record of records) {
        if (now - record.answeredAt > periodMs) continue;
        const existing = recentAnsweredAt.get(record.originalId);
        if (existing === undefined || record.answeredAt > existing) {
          recentAnsweredAt.set(record.originalId, record.answeredAt);
        }
      }
    }

    const targets: Record<ExamSection, number> = {
      ...RANDOM_EXAM_TARGETS,
      ...options.targetCounts,
    };
    const sections: ExamSection[] = ['knowledge', 'reading', 'listening'];
    const selected: ExamQuestion[] = [];
    const selectedIds = new Set<string>();
    const sectionCounts: Record<ExamSection, number> = {
      knowledge: 0,
      reading: 0,
      listening: 0,
    };

    for (const section of sections) {
      const target = Math.max(0, Math.floor(targets[section] || 0));
      const candidates = uniquePool.filter(
        (question) => question.section === section && !selectedIds.has(question.originalId!),
      );
      const fresh = candidates.filter((question) => !recentAnsweredAt.has(question.originalId!));
      const seen = candidates
        .filter((question) => recentAnsweredAt.has(question.originalId!))
        .sort(
          (a, b) =>
            (recentAnsweredAt.get(a.originalId!) || 0) - (recentAnsweredAt.get(b.originalId!) || 0),
        );
      const ordered = [...this.shuffle(fresh, random), ...this.shuffle(seen, random)];
      const chosen = ordered.slice(0, target);
      for (const question of chosen) {
        selected.push(question);
        selectedIds.add(question.originalId!);
      }
      sectionCounts[section] = chosen.length;
    }

    const questions = this.withDisplayNumbers(selected.map((question) => ({ ...question })));
    const warnings: string[] = [];
    if (duplicateCount > 0) {
      warnings.push(
        `${duplicateCount} ta takroriy savol olib tashlandi; bir imtihonda faqat noyob savollar ishlatiladi.`,
      );
    }

    const totalTarget = sections.reduce((sum, section) => sum + Math.max(0, targets[section]), 0);
    const totalSelected = questions.length;
    if (totalSelected < totalTarget) {
      const shortageDetails = sections
        .filter((section) => sectionCounts[section] < targets[section])
        .map((section) => `${section}: ${sectionCounts[section]}/${targets[section]}`)
        .join(', ');
      warnings.push(
        `${level} uchun ${totalTarget} ta savol kerak edi, ammo faqat ${totalSelected} ta mavjud (${shortageDetails}). Iltimos, savollar bazasini to'ldiring.`,
      );
    }

    const reusedCount = selected.filter((question) =>
      recentAnsweredAt.has(question.originalId!),
    ).length;
    if (reusedCount > 0) {
      warnings.push(
        `${reusedCount} ta savol so'nggi ${periodDays} kun ichida ishlangan, ammo boshqa yetarli savol topilmadi. No-repeat davrini qisqartiring yoki yangi savollar qo'shing.`,
      );
    }

    return {
      id: `builtin_${level.toLowerCase()}_random`,
      title: `JLPT ${level} 🎲 Aqlli Dinamik Variant (Tasodifiy Generator)`,
      description: `Barcha to'plamlardan saralangan, takrorlanmaydigan savollar bilan tuzilgan yangi simulyatsiya.`,
      type: `JLPT ${level}`,
      level,
      questions,
      timeLimitSeconds: DEFAULT_TIME_LIMITS[level] || 3000,
      isFromDb: false,
      generationWarnings: warnings,
    };
  }

  /**
   * Persists answered original question IDs to avoid repeats in future mock exams.
   */
  static recordAnsweredQuestions(questionIds: Array<string | number>): void {
    const storage = this.getStorage();
    if (!storage || !questionIds || questionIds.length === 0) return;
    try {
      const now = Date.now();
      const incoming = new Map<string, number>();
      for (const id of questionIds) {
        const originalId = String(id ?? '').trim();
        if (!originalId) continue;
        incoming.set(originalId, now);
      }
      if (incoming.size === 0) return;

      const existing = this.getAnsweredQuestionRecords(now);
      const merged = new Map<string, number>();
      for (const record of existing) merged.set(record.originalId, record.answeredAt);
      for (const [originalId, answeredAt] of incoming) merged.set(originalId, answeredAt);

      const records = Array.from(merged, ([originalId, answeredAt]) => ({
        originalId,
        answeredAt,
      }))
        .sort((a, b) => b.answeredAt - a.answeredAt)
        .slice(0, MAX_ANSWERED_RECORDS);

      storage.setItem(ANSWERED_QUESTIONS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Ignore storage errors
    }
  }
}
