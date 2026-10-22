/**
 * Task 16 — N3/N2/N1 real-content end-to-end suite.
 *
 * Runs the whole exam lifecycle on an in-memory Supabase fake (JSDOM):
 *   JSON import -> CSV import -> passage/audio import -> AI draft ->
 *   validation -> review -> approved -> published -> mock exam render ->
 *   timer + scoring -> mistake vault + skill matrix -> export -> rollback.
 *
 * Content comes from the repository's real JLPT dataset
 * (`src/data/jlptMockExamData.ts`).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});
vi.mock('../../../utils/ai/aiCore', () => ({ callAI: vi.fn() }));

import { callAI } from '../../../utils/ai/aiCore';
import { fakeSupabase } from '../../../utils/fakeSupabase';
import { ExamBulkImportService, type ValidatedQuestion } from '../../ExamBulkImportService';
import { ExamImportHistoryService, type ImportActor } from '../../ExamImportHistoryService';
import { ExamWorkflowService } from '../../ExamWorkflowService';
import { ExamService } from '../../ExamService';
import { ReadingPassageService } from '../../ReadingPassageService';
import { ListeningAudioService } from '../../ListeningAudioService';
import { MistakeVaultService } from '../../MistakeVaultService';
import { MasteryEngine } from '../../MasteryEngine';
import { SkillMatrixService } from '../../SkillMatrixService';
import { ExamAiExtractorService } from '../../ExamAiExtractorService';
import { calculateJlptScore } from '../../../utils/jlptScoring';
import {
  LEVELS,
  buildAiDraftResponse,
  buildCsvPayload,
  buildJsonPayload,
  buildListeningAudio,
  buildRawQuestions,
  buildReadingPassage,
  type Level,
} from './contentFixtures';

const ADMIN: ImportActor = { id: 'admin-user-id', email: 'fsoyilov@gmail.com', name: 'Admin' };

function validatedFrom(raw: string, format: 'json' | 'csv', level: Level): ValidatedQuestion[] {
  const result = ExamBulkImportService.parseAndValidate(raw, format, { defaultLevel: level });
  expect(result.errorCount, `parse errors: ${JSON.stringify(result.audit.errors)}`).toBe(0);
  return result.items
    .map((item) => item.validated)
    .filter((q): q is ValidatedQuestion => q !== null);
}

async function importFullExam(level: Level, format: 'json' | 'csv' = 'json') {
  const raw = format === 'json' ? buildJsonPayload(level) : buildCsvPayload(level);
  const questions = validatedFrom(raw, format, level);
  const result = await ExamBulkImportService.importFullExamWithSections(
    {
      title: `JLPT ${level} E2E Real Content Exam`,
      level,
      questions,
      copyrightConfirmed: true,
    },
    { actor: ADMIN, sourceFormat: format },
  );
  return { ...result, questions };
}

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-user-id',
    email: 'fsoyilov@gmail.com',
    user_metadata: { full_name: 'Admin' },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Task 16 · import validation with real N3/N2/N1 content', () => {
  for (const level of LEVELS) {
    it(`${level}: JSON payload parses, validates with 0 errors and Japanese content`, () => {
      const result = ExamBulkImportService.parseAndValidate(buildJsonPayload(level), 'json', {
        defaultLevel: level,
      });
      expect(result.isValid).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.detectedSections).toEqual(
        expect.arrayContaining(['knowledge', 'reading', 'listening']),
      );
      const first = result.items[0].validated!;
      expect(first.question_text.length).toBeGreaterThan(0);
      expect(first.options.length).toBeGreaterThanOrEqual(2);
    });

    it(`${level}: CSV payload parses and validates with 0 errors`, () => {
      const result = ExamBulkImportService.parseAndValidate(buildCsvPayload(level), 'csv', {
        defaultLevel: level,
      });
      expect(result.errorCount).toBe(0);
      expect(result.totalCount).toBe(buildRawQuestions(level).length);
    });
  }
});

describe('Task 16 · full lifecycle per level', () => {
  for (const level of LEVELS) {
    it(`${level}: import -> passage/audio -> review -> approved -> published -> mock exam -> scoring -> export -> rollback`, async () => {
      // 1. JSON import (draft)
      const imported = await importFullExam(level, 'json');
      expect(imported.totalInserted).toBeGreaterThanOrEqual(3);
      expect(imported.batchId).toBeTruthy();

      const exams = fakeSupabase.__table('exams');
      expect(exams).toHaveLength(1);
      expect(exams[0].is_published).toBe(false);

      // 2. Reading passage + listening audio import
      const passage = buildReadingPassage(level);
      const createdPassage = await ReadingPassageService.create(imported.examId, {
        title: passage.title,
        content: passage.content,
      });
      expect(createdPassage.exam_id).toBe(imported.examId);
      expect(fakeSupabase.__table('reading_passages')).toHaveLength(1);

      const audio = buildListeningAudio(level);
      const createdAudio = await ListeningAudioService.create(imported.examId, {
        title: audio.title,
        transcript: audio.transcript,
        uz_translation: audio.uzTranslation,
      });
      await ListeningAudioService.update(createdAudio.id, { audio_url: audio.audioUrl });
      const audios = fakeSupabase.__table('listening_audios');
      expect(audios).toHaveLength(1);
      expect(audios[0].audio_url).toBe(audio.audioUrl);

      // 3. Publish must be blocked while questions are still drafts
      const blocked = await ExamWorkflowService.validateForPublish(imported.examId);
      expect(blocked.isValid).toBe(false);
      expect(blocked.errors.join(' ')).toMatch(/tasdiqlanmagan/);

      // 4. Review -> approve questions -> approved
      await ExamWorkflowService.transitionExamStatus(imported.examId, 'review', ADMIN.email!);
      await ExamWorkflowService.bulkTransitionQuestions(
        imported.questionIds!,
        'review',
        ADMIN.email!,
      );
      await ExamWorkflowService.bulkTransitionQuestions(
        imported.questionIds!,
        'approved',
        ADMIN.email!,
      );
      const approvedCount = fakeSupabase
        .__table('exam_questions')
        .filter((q) => q.status === 'approved').length;
      expect(approvedCount).toBe(imported.questionIds!.length);
      await ExamWorkflowService.transitionExamStatus(imported.examId, 'approved', ADMIN.email!);
      expect(fakeSupabase.__table('exams')[0].status).toBe('approved');

      // 5. Published
      const publishResult = await ExamWorkflowService.transitionExamStatus(
        imported.examId,
        'published',
        ADMIN.email!,
      );
      expect(publishResult.success).toBe(true);
      expect(publishResult.validation?.isValid).toBe(true);
      const publishedExam = fakeSupabase.__table('exams')[0];
      expect(publishedExam.status).toBe('published');
      expect(publishedExam.is_published).toBe(true);

      // 6. Mock exam shows the questions + correct timer
      const published = await ExamService.getPublishedJlptExams(level);
      expect(published.some((e) => e.id === imported.examId)).toBe(true);

      const normalized = await ExamService.getExamWithQuestions(imported.examId);
      expect(normalized.isFromDb).toBe(true);
      expect(normalized.questions.length).toBe(imported.questionIds!.length);
      expect(normalized.timeLimitSeconds).toBeGreaterThan(0);
      expect(normalized.questions.every((q) => q.options.length >= 2)).toBe(true);

      // 7. Scoring — answer all but the last question correctly
      const userAnswers: Record<string, number> = {};
      normalized.questions.forEach((q, idx) => {
        userAnswers[q.id] =
          idx === normalized.questions.length - 1
            ? (q.correctAnswer + 1) % q.options.length
            : q.correctAnswer;
      });
      const report = calculateJlptScore(
        level,
        normalized.questions.map((q) => ({
          id: q.id,
          section: q.section,
          correctAnswer: q.correctAnswer,
        })),
        userAnswers,
      );
      expect(report.totalScore).toBeGreaterThan(0);
      expect(report.totalScore).toBeLessThanOrEqual(180);
      expect(report.correctTotal).toBe(normalized.questions.length - 1);
      expect(Object.keys(report.sections)).toEqual(['knowledge', 'reading', 'listening']);

      // 8. Mistake vault + skill matrix update
      const userId = `user-${level}`;
      const wrong = normalized.questions.filter((q) => userAnswers[q.id] !== q.correctAnswer);
      MistakeVaultService.recordBatch(
        wrong.map((q) => ({
          userId,
          source: 'mock_exam' as const,
          level: level as any,
          category: (q.section === 'reading'
            ? 'reading'
            : q.section === 'listening'
              ? 'listening'
              : 'vocab') as any,
          title: `JLPT ${level} Mock — ${q.section}`,
          questionText: q.questionText,
          options: q.options,
          userAnswer: userAnswers[q.id],
          correctAnswer: q.correctAnswer,
          explanationUzbek: q.explanationUzbek,
        })),
        userId,
      );
      expect(MistakeVaultService.getMistakes(userId)).toHaveLength(wrong.length);

      const beforeEvidence = MasteryEngine.getUserEvidence(userId, 'ja').length;
      MasteryEngine.recordEvidence(userId, 'ja', {
        id: `jlpt_mock_${level}_reading_${Date.now()}`,
        skill: 'reading',
        score: report.sections.reading.percentage,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Dokkai: ${report.sections.reading.score}/60`,
        type: 'performance',
      });
      MasteryEngine.recordEvidence(userId, 'ja', {
        id: `jlpt_mock_${level}_listening_${Date.now()}`,
        skill: 'listening',
        score: report.sections.listening.percentage,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Choukai: ${report.sections.listening.score}/60`,
        type: 'performance',
      });
      expect(MasteryEngine.getUserEvidence(userId, 'ja').length).toBeGreaterThan(beforeEvidence);

      const matrix = SkillMatrixService.computeLevelReport(level, userId);
      expect(matrix.level).toBe(level);
      expect(matrix.skills.reading).toBeTruthy();
      expect(matrix.skills.listening).toBeTruthy();
      expect(matrix.generatedAt).toBeTruthy();

      // 9. Export JSON + CSV
      const bundleJson = await ExamImportHistoryService.exportExamAsJson(imported.examId);
      const bundle = JSON.parse(bundleJson);
      expect(bundle.exam.id).toBe(imported.examId);
      expect(bundle.sections.length).toBeGreaterThan(0);
      const exportedQuestionCount = bundle.sections.reduce(
        (sum: number, s: any) => sum + s.questions.length,
        0,
      );
      expect(exportedQuestionCount).toBe(imported.questionIds!.length);
      expect(bundle.readingPassages).toHaveLength(1);
      expect(bundle.listeningAudios).toHaveLength(1);

      const csv = await ExamImportHistoryService.exportExamAsCsv(imported.examId);
      expect(csv.split('\n')[0]).toContain('correctAnswer');
      expect(csv).toContain(level);

      // 10. Rollback — full-exam batch removes the whole exam
      const rollback = await ExamImportHistoryService.rollbackBatch(imported.batchId!, {
        adminConfirmed: true,
        reason: `Task 16 ${level} E2E cleanup`,
        actor: ADMIN,
      });
      expect(rollback.status).toBe('rolled_back');
      expect(fakeSupabase.__table('exams').some((e) => e.id === imported.examId)).toBe(false);
      const batch = fakeSupabase
        .__table('exam_import_batches')
        .find((b) => b.id === imported.batchId);
      expect(batch?.status).toBe('rolled_back');
    });
  }
});

describe('Task 16 · CSV import creates a separate published-ready exam', () => {
  for (const level of LEVELS) {
    it(`${level}: CSV import persists the same question count as JSON`, async () => {
      const imported = await importFullExam(level, 'csv');
      expect(imported.totalInserted).toBe(buildRawQuestions(level).length);
      expect(fakeSupabase.__table('exam_questions')).toHaveLength(imported.totalInserted);
    });
  }
});

describe('Task 16 · AI draft generation feeds the import pipeline', () => {
  for (const level of LEVELS) {
    it(`${level}: AI draft questions are validated and importable as drafts only`, async () => {
      (callAI as any).mockResolvedValue(buildAiDraftResponse(level));

      const aiResult = await ExamAiExtractorService.extractQuestions({
        text: 'これはAI抽出テスト用の十分に長いJLPT問題テキストです。選択肢と正解を含みます。',
        defaultLevel: level,
      });
      expect(aiResult.isDraft).toBe(true);
      expect(aiResult.questions.length).toBeGreaterThan(0);
      expect(aiResult.questions.every((q) => q.is_published === false)).toBe(true);

      const validation = ExamBulkImportService.validateQuestions(aiResult.questions, {
        expectedLevel: level,
      });
      const valid = validation.items
        .map((i) => i.validated)
        .filter((q): q is ValidatedQuestion => q !== null);
      expect(valid.length).toBe(aiResult.questions.length);

      const importResult = await ExamBulkImportService.importFullExamWithSections(
        {
          title: `JLPT ${level} AI Draft`,
          level,
          questions: valid,
          copyrightConfirmed: true,
        },
        { actor: ADMIN, sourceFormat: 'ai' },
      );
      expect(importResult.totalInserted).toBe(valid.length);
      expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);
    });
  }
});

describe('Task 16 · version snapshot + revert', () => {
  it('reverts an exam to an earlier snapshot, restoring questions while preserving workflow status', async () => {
    const imported = await importFullExam('N3', 'json');
    const sections = fakeSupabase.__table('exam_sections');
    const knowledgeSection = sections.find((s) => s.type === 'knowledge') || sections[0];

    const v1 = (await ExamImportHistoryService.listVersions(imported.examId)).find(
      (v) => v.version_number === 1,
    );
    expect(v1).toBeTruthy();

    const extra: ValidatedQuestion = {
      question_text: '追加の問題です。正しい選択肢を選んでください。',
      type: 'multiple_choice',
      options: ['正解', '不正解A', '不正解B', '不正解C'],
      correct_answer: '正解',
      correct_index: 0,
      explanation: '追加テスト用.',
      passage: null,
      level: 'N3',
      section_name: 'knowledge',
      section_type: 'knowledge',
      question_type: 'grammar_fill_blank',
      question_payload: {},
    };
    await ExamBulkImportService.importQuestionsToSection(knowledgeSection.id, [extra], {
      actor: ADMIN,
    });
    const afterAdd = fakeSupabase.__table('exam_questions').length;
    expect(afterAdd).toBe(imported.questionIds!.length + 1);
    expect((await ExamImportHistoryService.listVersions(imported.examId)).length).toBeGreaterThan(
      1,
    );

    // Simulate published status prior to revert
    const exam = fakeSupabase.__table('exams').find((e) => e.id === imported.examId)!;
    exam.status = 'published';
    exam.is_published = true;

    const revert = await ExamImportHistoryService.revertToVersion(v1!.id, {
      adminConfirmed: true,
      actor: ADMIN,
    });
    expect(revert.examId).toBe(imported.examId);
    expect(fakeSupabase.__table('exam_questions').length).toBe(imported.questionIds!.length);

    // Verify workflow status was preserved during content revert
    const after = fakeSupabase.__table('exams').find((e) => e.id === imported.examId)!;
    expect(after.status).toBe('published');
    expect(after.is_published).toBe(true);
  });
});

describe('Task 16 · rollback guards', () => {
  it('refuses rollback without admin confirmation', async () => {
    const imported = await importFullExam('N2', 'json');
    await expect(
      ExamImportHistoryService.rollbackBatch(imported.batchId!, { adminConfirmed: false }),
    ).rejects.toThrow(/admin tasdig/i);
  });

  it('refuses rollback for a non-admin actor', async () => {
    const imported = await importFullExam('N2', 'json');
    fakeSupabase.__rpcResults.is_admin = { data: false, error: null };
    await expect(
      ExamImportHistoryService.rollbackBatch(imported.batchId!, {
        adminConfirmed: true,
        actor: { id: 'u2', email: 'user@example.com', name: 'User' },
      }),
    ).rejects.toThrow();
    fakeSupabase.__rpcResults.is_admin = { data: true, error: null };
  });
});
