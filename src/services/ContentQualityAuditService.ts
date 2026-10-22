import { supabase } from '../lib/supabase';
import { normalizeJlptQuestionType } from '../types/jlptQuestionType';

export const CONTENT_AUDIT_LEVELS = ['N3', 'N2', 'N1'] as const;
export type ContentAuditLevel = (typeof CONTENT_AUDIT_LEVELS)[number];

export const CONTENT_QUALITY_SKILLS = [
  'vocabulary',
  'grammar',
  'kanji',
  'reading',
  'listening',
] as const;
export type ContentQualitySkill = (typeof CONTENT_QUALITY_SKILLS)[number];

export const CONTENT_WORKFLOW_STATUSES = [
  'draft',
  'review',
  'approved',
  'published',
  'rejected',
] as const;
export type ContentWorkflowStatus = (typeof CONTENT_WORKFLOW_STATUSES)[number];

export const CONTENT_MISSING_FIELDS = [
  'questionText',
  'options',
  'correctAnswer',
  'explanation',
  'passage',
  'audio',
] as const;
export type ContentMissingField = (typeof CONTENT_MISSING_FIELDS)[number];

export type MissingFieldCounts = Record<ContentMissingField, number>;

export interface ContentAuditQuestionInput {
  id: string;
  level: string;
  skill?: ContentQualitySkill | string | null;
  rawType?: string | null;
  sectionType?: string | null;
  questionText?: string | null;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  passageText?: string | null;
  passageId?: string | null;
  audioUrl?: string | null;
  listeningAudioId?: string | null;
  status?: string | null;
  examPublished?: boolean;
  examId?: string | null;
  examTitle?: string | null;
}

export interface ContentAuditAnswerInput {
  questionId: string;
  isCorrect?: boolean | null;
}

export interface ContentQualityDuplicateGroup {
  key: string;
  level: ContentAuditLevel;
  questionIds: string[];
  count: number;
  sampleText: string;
}

export interface ContentSkillCount {
  skill: ContentQualitySkill;
  count: number;
  covered: boolean;
}

export interface ContentAudioAvailability {
  listeningTotal: number;
  withAudio: number;
  missingAudio: number;
  availabilityPercent: number;
}

export interface ContentErrorProneQuestion {
  questionId: string;
  questionText: string;
  level: ContentAuditLevel;
  skill: ContentQualitySkill;
  examTitle: string | null;
  attempts: number;
  wrongCount: number;
  accuracy: number;
  errorRate: number;
}

export interface ContentLevelQualityReport {
  level: ContentAuditLevel;
  totalQuestions: number;
  skillCounts: Record<ContentQualitySkill, number>;
  skillCoverage: ContentSkillCount[];
  coveredSkills: number;
  coveragePercent: number;
  statusCounts: Record<ContentWorkflowStatus, number>;
  missingFields: MissingFieldCounts;
  missingFieldTotal: number;
  duplicateGroups: ContentQualityDuplicateGroup[];
  duplicateQuestionCount: number;
  audio: ContentAudioAvailability;
  topErrorQuestions: ContentErrorProneQuestion[];
}

export interface ContentQualityTotals {
  totalQuestions: number;
  skillCounts: Record<ContentQualitySkill, number>;
  statusCounts: Record<ContentWorkflowStatus, number>;
  missingFields: MissingFieldCounts;
  missingFieldTotal: number;
  duplicateQuestionCount: number;
  audio: ContentAudioAvailability;
  coveredSkills: number;
  coveragePercent: number;
}

export interface ContentQualityReport {
  generatedAt: string;
  levels: ContentLevelQualityReport[];
  totals: ContentQualityTotals;
  topErrorQuestions: ContentErrorProneQuestion[];
  errorStatsAvailable: boolean;
  warnings: string[];
}

interface PreparedQuestion {
  input: ContentAuditQuestionInput;
  level: ContentAuditLevel;
  skill: ContentQualitySkill;
  status: ContentWorkflowStatus;
  fingerprint: string;
  missing: ContentMissingField[];
  hasAudio: boolean;
}

const LEVEL_SET = new Set<string>(CONTENT_AUDIT_LEVELS);
const SKILL_SET = new Set<string>(CONTENT_QUALITY_SKILLS);
const STATUS_SET = new Set<string>(CONTENT_WORKFLOW_STATUSES);
const MAX_LEVEL_ERROR_QUESTIONS = 10;
const MAX_GLOBAL_ERROR_QUESTIONS = 20;

const createSkillCounts = (): Record<ContentQualitySkill, number> => ({
  vocabulary: 0,
  grammar: 0,
  kanji: 0,
  reading: 0,
  listening: 0,
});

const createStatusCounts = (): Record<ContentWorkflowStatus, number> => ({
  draft: 0,
  review: 0,
  approved: 0,
  published: 0,
  rejected: 0,
});

const createMissingCounts = (): MissingFieldCounts => ({
  questionText: 0,
  options: 0,
  correctAnswer: 0,
  explanation: 0,
  passage: 0,
  audio: 0,
});

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0);

const normalizeLevel = (value: unknown): ContentAuditLevel | null => {
  const match = String(value ?? '')
    .toUpperCase()
    .match(/\bN[1-5]\b/);
  const level = match?.[0];
  return level && LEVEL_SET.has(level) ? (level as ContentAuditLevel) : null;
};

const parseOptions = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter((item) => item.trim().length > 0);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter((item) => item.trim().length > 0);
  } catch {
    // Legacy plain-text option list.
  }
  return value
    .split(/\s*\|\s*|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasCorrectAnswer = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const normalizeForDuplicate = (value: unknown): string => {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[「」『』【】\u005B\u005D（）()、。,.!?！？:：;；'"“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Japanese text often varies only by spacing; compare CJK strings without
  // spaces so duplicates are not hidden by full-width spacing differences.
  return /[\u3000-\u30ff\u3400-\u9fff]/.test(normalized)
    ? normalized.replace(/\s+/g, '')
    : normalized;
};

export class ContentQualityAuditService {
  static classifySkill(input: {
    level?: string | null;
    skill?: string | null;
    rawType?: string | null;
    sectionType?: string | null;
  }): ContentQualitySkill {
    if (input.skill && SKILL_SET.has(input.skill)) {
      return input.skill as ContentQualitySkill;
    }

    const type = normalizeJlptQuestionType(input.rawType, input.sectionType);
    if (type.startsWith('reading_')) return 'reading';
    if (type.startsWith('listening_')) return 'listening';
    if (type === 'kanji_reading') return 'kanji';
    if (type === 'grammar_fill_blank' || type === 'sentence_ordering') return 'grammar';
    return 'vocabulary';
  }

  static resolveStatus(input: {
    status?: string | null;
    examPublished?: boolean;
  }): ContentWorkflowStatus {
    if (input.examPublished) return 'published';
    const normalized = String(input.status ?? '')
      .trim()
      .toLowerCase();
    return STATUS_SET.has(normalized) ? (normalized as ContentWorkflowStatus) : 'draft';
  }

  static buildReport(
    questions: ContentAuditQuestionInput[],
    answers: ContentAuditAnswerInput[] = [],
    options: {
      generatedAt?: string;
      errorStatsAvailable?: boolean;
      warnings?: string[];
    } = {},
  ): ContentQualityReport {
    const prepared: PreparedQuestion[] = [];
    for (const question of questions) {
      const level = normalizeLevel(question.level);
      if (!level) continue;

      const skill = this.classifySkill(question);
      const status = this.resolveStatus(question);
      const optionList = parseOptions(question.options);
      const hasPassage = !isBlank(question.passageText) || !isBlank(question.passageId);
      const hasAudio =
        !isBlank(question.audioUrl) ||
        !isBlank(question.listeningAudioId) ||
        Boolean((question as { audioLinked?: boolean }).audioLinked);

      const missing: ContentMissingField[] = [];
      if (isBlank(question.questionText)) missing.push('questionText');
      if (optionList.length < 2) missing.push('options');
      if (!hasCorrectAnswer(question.correctAnswer)) missing.push('correctAnswer');
      if (isBlank(question.explanation)) missing.push('explanation');
      if (skill === 'reading' && !hasPassage) missing.push('passage');
      if (skill === 'listening' && !hasAudio) missing.push('audio');

      prepared.push({
        input: question,
        level,
        skill,
        status,
        fingerprint: normalizeForDuplicate(question.questionText),
        missing,
        hasAudio,
      });
    }

    const errorQuestions = this.buildErrorProneQuestions(prepared, answers);
    const levels = CONTENT_AUDIT_LEVELS.map((level) =>
      this.buildLevelReport(
        level,
        prepared.filter((item) => item.level === level),
        errorQuestions,
      ),
    );

    return {
      generatedAt: options.generatedAt || new Date().toISOString(),
      levels,
      totals: this.aggregateTotals(levels),
      topErrorQuestions: errorQuestions.slice(0, MAX_GLOBAL_ERROR_QUESTIONS),
      errorStatsAvailable: options.errorStatsAvailable !== false,
      warnings: options.warnings || [],
    };
  }

  private static buildLevelReport(
    level: ContentAuditLevel,
    questions: PreparedQuestion[],
    errorQuestions: ContentErrorProneQuestion[],
  ): ContentLevelQualityReport {
    const skillCounts = createSkillCounts();
    const statusCounts = createStatusCounts();
    const missingFields = createMissingCounts();
    let missingFieldTotal = 0;
    let listeningTotal = 0;
    let withAudio = 0;

    for (const question of questions) {
      skillCounts[question.skill] += 1;
      statusCounts[question.status] += 1;
      if (question.missing.length > 0) {
        missingFieldTotal += 1;
        for (const field of question.missing) missingFields[field] += 1;
      }
      if (question.skill === 'listening') {
        listeningTotal += 1;
        if (question.hasAudio) withAudio += 1;
      }
    }

    const duplicateGroups = this.findDuplicateGroups(level, questions);
    const skillCoverage: ContentSkillCount[] = CONTENT_QUALITY_SKILLS.map((skill) => ({
      skill,
      count: skillCounts[skill],
      covered: skillCounts[skill] > 0,
    }));
    const coveredSkills = skillCoverage.filter((item) => item.covered).length;

    return {
      level,
      totalQuestions: questions.length,
      skillCounts,
      skillCoverage,
      coveredSkills,
      coveragePercent: Math.round((coveredSkills / CONTENT_QUALITY_SKILLS.length) * 100),
      statusCounts,
      missingFields,
      missingFieldTotal,
      duplicateGroups,
      duplicateQuestionCount: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
      audio: {
        listeningTotal,
        withAudio,
        missingAudio: Math.max(0, listeningTotal - withAudio),
        availabilityPercent:
          listeningTotal > 0 ? Math.round((withAudio / listeningTotal) * 100) : 0,
      },
      topErrorQuestions: errorQuestions
        .filter((item) => item.level === level)
        .slice(0, MAX_LEVEL_ERROR_QUESTIONS),
    };
  }

  private static findDuplicateGroups(
    level: ContentAuditLevel,
    questions: PreparedQuestion[],
  ): ContentQualityDuplicateGroup[] {
    const groups = new Map<string, PreparedQuestion[]>();
    for (const question of questions) {
      if (!question.fingerprint) continue;
      const list = groups.get(question.fingerprint) || [];
      list.push(question);
      groups.set(question.fingerprint, list);
    }

    return Array.from(groups.entries())
      .filter(([, list]) => list.length > 1)
      .map(([key, list]) => ({
        key,
        level,
        questionIds: list.map((item) => String(item.input.id)),
        count: list.length,
        sampleText: String(list[0].input.questionText || '').slice(0, 160),
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }

  private static buildErrorProneQuestions(
    questions: PreparedQuestion[],
    answers: ContentAuditAnswerInput[],
  ): ContentErrorProneQuestion[] {
    const byId = new Map<string, PreparedQuestion>();
    for (const question of questions) byId.set(String(question.input.id), question);

    const aggregates = new Map<string, { attempts: number; wrongCount: number }>();
    for (const answer of answers) {
      if (answer.isCorrect === null || answer.isCorrect === undefined) continue;
      const questionId = String(answer.questionId ?? '');
      if (!questionId) continue;
      const current = aggregates.get(questionId) || { attempts: 0, wrongCount: 0 };
      current.attempts += 1;
      if (answer.isCorrect === false) current.wrongCount += 1;
      aggregates.set(questionId, current);
    }

    const rows: ContentErrorProneQuestion[] = [];
    for (const [questionId, aggregate] of aggregates) {
      if (aggregate.attempts <= 0 || aggregate.wrongCount <= 0) continue;
      const question = byId.get(questionId);
      if (!question) continue;
      const accuracy = Math.round(
        ((aggregate.attempts - aggregate.wrongCount) / aggregate.attempts) * 100,
      );
      rows.push({
        questionId,
        questionText: String(question.input.questionText || '').slice(0, 220),
        level: question.level,
        skill: question.skill,
        examTitle: question.input.examTitle || null,
        attempts: aggregate.attempts,
        wrongCount: aggregate.wrongCount,
        accuracy,
        errorRate: Math.max(0, 100 - accuracy),
      });
    }

    return rows.sort(
      (a, b) =>
        b.wrongCount - a.wrongCount ||
        b.errorRate - a.errorRate ||
        b.attempts - a.attempts ||
        a.questionId.localeCompare(b.questionId),
    );
  }

  private static aggregateTotals(levels: ContentLevelQualityReport[]): ContentQualityTotals {
    const skillCounts = createSkillCounts();
    const statusCounts = createStatusCounts();
    const missingFields = createMissingCounts();
    let totalQuestions = 0;
    let missingFieldTotal = 0;
    let duplicateQuestionCount = 0;
    let listeningTotal = 0;
    let withAudio = 0;
    let coveredSkills = 0;

    for (const level of levels) {
      totalQuestions += level.totalQuestions;
      missingFieldTotal += level.missingFieldTotal;
      duplicateQuestionCount += level.duplicateQuestionCount;
      listeningTotal += level.audio.listeningTotal;
      withAudio += level.audio.withAudio;
      coveredSkills += level.coveredSkills;
      for (const skill of CONTENT_QUALITY_SKILLS) skillCounts[skill] += level.skillCounts[skill];
      for (const status of CONTENT_WORKFLOW_STATUSES) {
        statusCounts[status] += level.statusCounts[status];
      }
      for (const field of CONTENT_MISSING_FIELDS) {
        missingFields[field] += level.missingFields[field];
      }
    }

    const totalPossibleSkills = levels.length * CONTENT_QUALITY_SKILLS.length;
    return {
      totalQuestions,
      skillCounts,
      statusCounts,
      missingFields,
      missingFieldTotal,
      duplicateQuestionCount,
      audio: {
        listeningTotal,
        withAudio,
        missingAudio: Math.max(0, listeningTotal - withAudio),
        availabilityPercent:
          listeningTotal > 0 ? Math.round((withAudio / listeningTotal) * 100) : 0,
      },
      coveredSkills,
      coveragePercent:
        totalPossibleSkills > 0 ? Math.round((coveredSkills / totalPossibleSkills) * 100) : 0,
    };
  }

  static toJSON(report: ContentQualityReport): string {
    return JSON.stringify(report, null, 2);
  }

  static toCSV(report: ContentQualityReport): string {
    const rows: string[][] = [];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    rows.push(['Bo‘lim', 'Level', 'Skill/Status', 'Qiymat']);
    for (const level of report.levels) {
      rows.push(['Umumiy kontent', level.level, 'Savollar', String(level.totalQuestions)]);
      for (const skill of CONTENT_QUALITY_SKILLS) {
        rows.push(['Skill soni', level.level, skill, String(level.skillCounts[skill])]);
      }
      for (const status of CONTENT_WORKFLOW_STATUSES) {
        rows.push(['Workflow holati', level.level, status, String(level.statusCounts[status])]);
      }
      for (const field of CONTENT_MISSING_FIELDS) {
        rows.push(['Missing field', level.level, field, String(level.missingFields[field])]);
      }
      rows.push([
        'Audio',
        level.level,
        'Mavjudlik',
        `${level.audio.withAudio}/${level.audio.listeningTotal} (${level.audio.availabilityPercent}%)`,
      ]);
      rows.push([
        'Duplicate',
        level.level,
        'Dublikat savollar',
        String(level.duplicateQuestionCount),
      ]);
      rows.push([
        'Coverage',
        level.level,
        'Skill coverage',
        `${level.coveredSkills}/5 (${level.coveragePercent}%)`,
      ]);
      for (const group of level.duplicateGroups) {
        rows.push([
          'Duplicate group',
          level.level,
          group.questionIds.join(' | '),
          group.sampleText,
        ]);
      }
      for (const item of level.topErrorQuestions) {
        rows.push([
          'Xato savol',
          level.level,
          item.questionId,
          `${item.errorRate}% xato / ${item.wrongCount} wrong / ${item.attempts} attempt / ${item.questionText}`,
        ]);
      }
    }
    return rows.map((row) => row.map(escape).join(',')).join('\n');
  }

  static async fetchReport(): Promise<ContentQualityReport> {
    const warnings: string[] = [];
    const [examsRes, sectionsRes, questionsRes, passagesRes, audiosRes, answersRes] =
      await Promise.all([
        supabase.from('exams').select('*'),
        supabase.from('exam_sections').select('*'),
        supabase.from('exam_questions').select('*'),
        supabase.from('reading_passages').select('*'),
        supabase.from('listening_audios').select('*'),
        supabase.from('exam_answers').select('question_id, is_correct'),
      ]);

    if (examsRes.error || sectionsRes.error || questionsRes.error) {
      const message =
        examsRes.error?.message || sectionsRes.error?.message || questionsRes.error?.message;
      throw new Error(`Kontent audit ma’lumotlarini yuklab bo‘lmadi: ${message}`);
    }

    const exams = examsRes.data || [];
    const sections = sectionsRes.data || [];
    const questions = questionsRes.data || [];
    const passages = passagesRes.error ? [] : passagesRes.data || [];
    const audios = audiosRes.error ? [] : audiosRes.data || [];
    if (passagesRes.error)
      warnings.push(`Reading passage ma’lumotlari yuklanmadi: ${passagesRes.error.message}`);
    if (audiosRes.error)
      warnings.push(`Listening audio ma’lumotlari yuklanmadi: ${audiosRes.error.message}`);

    const examById = new Map<string, any>();
    for (const exam of exams) examById.set(String(exam.id), exam);
    const sectionById = new Map<string, any>();
    for (const section of sections) sectionById.set(String(section.id), section);
    const passageById = new Map<string, any>();
    for (const passage of passages) passageById.set(String(passage.id), passage);
    const audioById = new Map<string, any>();
    for (const audio of audios) audioById.set(String(audio.id), audio);

    const inputs: ContentAuditQuestionInput[] = [];
    for (const question of questions) {
      const section = sectionById.get(String(question.section_id));
      const exam = section ? examById.get(String(section.exam_id)) : null;
      if (!exam) continue;
      if (String(exam.status || '').toLowerCase() === 'archived') continue;

      const level = normalizeLevel(exam.type) || normalizeLevel(exam.title);
      if (!level) continue;

      const passage =
        passageById.get(String(question.passage_id)) ||
        passages.find((item: any) => String(item.section_id) === String(question.section_id));
      const audio =
        audioById.get(String(question.listening_audio_id)) ||
        audios.find((item: any) => String(item.section_id) === String(question.section_id));
      const payload =
        question.question_payload && typeof question.question_payload === 'object'
          ? question.question_payload
          : {};
      const rawType = payload.type || question.type;
      const sectionType = `${section?.type || ''} ${section?.title || ''}`;
      const skill = this.classifySkill({ rawType, sectionType });

      inputs.push({
        id: String(question.id),
        level,
        skill,
        rawType,
        sectionType,
        questionText: question.question_text,
        options: question.options,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        passageText: passage?.content || section?.content || '',
        passageId: question.passage_id ? String(question.passage_id) : null,
        audioUrl: audio?.audio_url || section?.audio_url || '',
        listeningAudioId: question.listening_audio_id ? String(question.listening_audio_id) : null,
        status: question.status,
        examPublished:
          String(exam.status || '').toLowerCase() === 'published' || Boolean(exam.is_published),
        examId: String(exam.id),
        examTitle: exam.title || null,
      });
    }

    let answers: ContentAuditAnswerInput[] = [];
    let errorStatsAvailable = true;
    if (answersRes.error) {
      errorStatsAvailable = false;
      warnings.push(`Savol xatolari statistikasi yuklanmadi: ${answersRes.error.message}`);
    } else {
      answers = (answersRes.data || []).map((row: any) => ({
        questionId: String(row.question_id ?? ''),
        isCorrect: row.is_correct,
      }));
    }

    return this.buildReport(inputs, answers, { warnings, errorStatsAvailable });
  }
}
