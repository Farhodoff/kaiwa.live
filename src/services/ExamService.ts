import { supabase } from '../lib/supabase';
import {
  JLPT_MOCK_EXAM_DATA,
  JLPT_MOCK_EXAM_SET2_DATA,
  JLPT_MOCK_EXAM_SET3_DATA,
  ExamQuestion,
} from '../data/jlptMockExamData';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

import type { ExamWorkflowStatus } from './ExamWorkflowService';

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
}

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
        .select('id, title, description, type, is_published, status, created_at')
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
          id: idx + 1, // Deterministic numerical ID for answer tracking
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
      questions: rawQuestions,
      timeLimitSeconds: DEFAULT_TIME_LIMITS[level] || 3000,
      isFromDb: false,
    };
  }

  /**
   * Builds a dynamic, randomized mock exam variant with no-repeat prioritization.
   */
  static buildRandomizedExam(level: JlptLevel): NormalizedExam {
    const set1 = JLPT_MOCK_EXAM_DATA[level] || [];
    const set2 = JLPT_MOCK_EXAM_SET2_DATA[level] || [];
    const set3 = JLPT_MOCK_EXAM_SET3_DATA[level] || [];
    const allPool = [...set1, ...set2, ...set3];

    // Read recently seen question IDs (no-repeat logic)
    let recentQIds: number[] = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jlpt_recent_answered_qids');
        if (raw) recentQIds = JSON.parse(raw);
      }
    } catch {
      // Ignore storage errors
    }

    const recentSet = new Set(recentQIds);

    const partition = (section: 'knowledge' | 'reading' | 'listening', targetCount: number) => {
      const candidates = allPool.filter((q) => q.section === section);
      const unvisited = candidates.filter((q) => !recentSet.has(q.id));
      const visited = candidates.filter((q) => recentSet.has(q.id));

      const shuffledUnvisited = [...unvisited].sort(() => Math.random() - 0.5);
      const shuffledVisited = [...visited].sort(() => Math.random() - 0.5);

      const combined = [...shuffledUnvisited, ...shuffledVisited];
      return combined.slice(0, targetCount);
    };

    const chosenKnowledge = partition('knowledge', 13);
    const chosenReading = partition('reading', 6);
    const chosenListening = partition('listening', 6);

    const questions: ExamQuestion[] = [
      ...chosenKnowledge,
      ...chosenReading,
      ...chosenListening,
    ].map((q, idx) => ({
      ...q,
      id: idx + 1, // Normalized 1..25 sequential ID
    }));

    return {
      id: `builtin_${level.toLowerCase()}_random`,
      title: `JLPT ${level} 🎲 Aqlli Dinamik Variant (Tasodifiy Generator)`,
      description: `Barcha to'plamlardan saralangan, takrorlanmaydigan savollar bilan tuzilgan yangi simulyatsiya.`,
      type: `JLPT ${level}`,
      level,
      questions,
      timeLimitSeconds: DEFAULT_TIME_LIMITS[level] || 3000,
      isFromDb: false,
    };
  }

  /**
   * Persists answered question IDs to avoid repeats in future mock exams.
   */
  static recordAnsweredQuestions(questionIds: number[]): void {
    if (typeof localStorage === 'undefined' || !questionIds || questionIds.length === 0) return;
    try {
      const raw = localStorage.getItem('jlpt_recent_answered_qids');
      const prev: number[] = raw ? JSON.parse(raw) : [];
      const merged = Array.from(new Set([...questionIds, ...prev])).slice(0, 100);
      localStorage.setItem('jlpt_recent_answered_qids', JSON.stringify(merged));
    } catch {
      // Ignore storage errors
    }
  }
}
