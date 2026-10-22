/**
 * Task 18 — hard legal gates before publishing.
 *
 * Covers every legal state an exam can be in:
 *  - copyright not confirmed
 *  - restricted license
 *  - missing attribution metadata (source_name / source_url / author)
 *  - malformed source URL
 *  - false "Official JLPT" claim
 *  - official JLPT material without a source URL
 *  - a fully compliant exam (the only publishable state)
 */
/// <reference types="node" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});

import { fakeSupabase } from '../../../utils/fakeSupabase';
import { ExamWorkflowService } from '../../ExamWorkflowService';
import { evaluateLegalGates } from '../../../utils/examLegalGates';

const ADMIN = 'fsoyilov@gmail.com';

interface ExamMetaOverride {
  license_type?: string;
  copyright_confirmed?: boolean;
  source_name?: string | null;
  source_url?: string | null;
  author?: string | null;
  is_official_jlpt?: boolean;
  title?: string;
}

/**
 * Seeds a publish-ready exam (1 knowledge section, 1 approved question) and
 * returns its id. The metadata is what each test varies.
 */
function seedExam(meta: ExamMetaOverride = {}): string {
  const examId = 'exam-legal';
  fakeSupabase.__seed('exams', [
    {
      id: examId,
      title: meta.title ?? 'JLPT N3 Legal Test',
      type: 'JLPT N3',
      status: 'approved',
      is_published: false,
      license_type: meta.license_type ?? 'original',
      copyright_confirmed: meta.copyright_confirmed ?? true,
      source_name: meta.source_name === undefined ? 'Platforma Original' : meta.source_name,
      source_url: meta.source_url === undefined ? null : meta.source_url,
      author: meta.author === undefined ? 'Nihongo Talk' : meta.author,
      is_official_jlpt: meta.is_official_jlpt ?? false,
    },
  ]);
  fakeSupabase.__seed('exam_sections', [
    { id: 'sec-legal', exam_id: examId, title: 'knowledge', type: 'knowledge' },
  ]);
  fakeSupabase.__seed('exam_questions', [
    {
      id: 'q-legal',
      section_id: 'sec-legal',
      question_text: 'これはテストの質問です。',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      status: 'approved',
    },
  ]);
  return examId;
}

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-1',
    email: 'fsoyilov@gmail.com',
    user_metadata: { full_name: 'Admin' },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Task 18 · evaluateLegalGates unit behaviour', () => {
  it('blocks when copyright is not confirmed', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: false,
      licenseType: 'original',
      sourceName: 'Manba',
      author: 'Muallif',
    });
    const gate = gates.find((g) => g.id === 'copyright_not_confirmed');
    expect(gate).toBeTruthy();
    expect(gate?.blocking).toBe(true);
  });

  it('blocks a restricted license and demands explicit legal approval', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'restricted',
      sourceName: 'Manba',
      sourceUrl: 'https://example.com',
      author: 'Muallif',
    });
    const gate = gates.find((g) => g.id === 'restricted_license');
    expect(gate?.blocking).toBe(true);
    expect(gate?.message).toMatch(/huquqiy ruxsat/i);
  });

  it('requires source, author and url for attribution licenses', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'cc-by',
    });
    const ids = gates.filter((g) => g.blocking).map((g) => g.id);
    expect(ids).toContain('missing_source_name');
    expect(ids).toContain('missing_author');
    expect(ids).toContain('missing_source_url');
  });

  it('requires a source name for public-domain material', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'public-domain',
    });
    expect(gates.find((g) => g.id === 'missing_source_name')?.blocking).toBe(true);
  });

  it('only warns about metadata for original platform material', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'original',
    });
    const blocking = gates.filter((g) => g.blocking);
    expect(blocking).toHaveLength(0);
    expect(gates.find((g) => g.id === 'recommended_source_name')?.blocking).toBe(false);
  });

  it('blocks a malformed source URL', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'original',
      sourceUrl: 'not-a-url',
    });
    expect(gates.find((g) => g.id === 'invalid_source_url')?.blocking).toBe(true);
  });

  it('blocks an unverified official JLPT claim', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'original',
      sourceName: 'Random Prep Book',
      sourceUrl: 'https://example.com',
      isOfficialJlpt: true,
    });
    expect(gates.find((g) => g.id === 'official_jlpt_unverified')?.blocking).toBe(true);
  });

  it('requires a source URL for official JLPT material', () => {
    const gates = evaluateLegalGates({
      copyrightConfirmed: true,
      licenseType: 'original',
      sourceName: 'The Japan Foundation',
      isOfficialJlpt: true,
    });
    expect(gates.find((g) => g.id === 'official_missing_source_url')?.blocking).toBe(true);
  });
});

describe('Task 18 · validateForPublish hard blocks', () => {
  it('blocks an exam whose copyright is not confirmed', async () => {
    const examId = seedExam({ copyright_confirmed: false });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => /Mualliflik huquqi tasdiqlanmagan/.test(e))).toBe(true);
  });

  it('blocks an exam with a restricted license', async () => {
    const examId = seedExam({
      license_type: 'restricted',
      source_name: 'Boshqa kitob',
      source_url: 'https://example.com/book',
      author: 'Muallif',
    });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => /restricted/.test(e))).toBe(true);
    expect(res.legalGates?.find((g) => g.id === 'restricted_license')?.blocking).toBe(true);
  });

  it('blocks an exam that is missing source metadata for an attribution license', async () => {
    const examId = seedExam({
      license_type: 'cc-by',
      source_name: null,
      source_url: null,
      author: null,
    });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    const missing = res.legalGates?.filter((g) => g.blocking).map((g) => g.field) ?? [];
    expect(missing).toContain('source_name');
    expect(missing).toContain('source_url');
    expect(missing).toContain('author');
  });

  it('blocks an exam with a malformed source URL', async () => {
    const examId = seedExam({ source_url: 'example.com/no-protocol' });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => /source_url/.test(e))).toBe(true);
  });

  it('blocks a false official JLPT claim', async () => {
    const examId = seedExam({
      is_official_jlpt: true,
      source_name: 'Uchinchi tomon kitobi',
      source_url: 'https://example.com',
    });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    expect(res.legalGates?.find((g) => g.id === 'official_jlpt_unverified')?.blocking).toBe(true);
  });

  it('blocks official JLPT material that has no source URL', async () => {
    const examId = seedExam({
      is_official_jlpt: true,
      source_name: 'The Japan Foundation',
      source_url: null,
    });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.isValid).toBe(false);
    expect(res.legalGates?.find((g) => g.id === 'official_missing_source_url')?.blocking).toBe(
      true,
    );
  });

  it('passes a fully compliant exam', async () => {
    const examId = seedExam({
      license_type: 'cc-by',
      copyright_confirmed: true,
      source_name: 'The Japan Foundation',
      source_url: 'https://jf.or.jp/material',
      author: 'The Japan Foundation',
    });
    const res = await ExamWorkflowService.validateForPublish(examId);

    expect(res.errors).toHaveLength(0);
    expect(res.isValid).toBe(true);
  });
});

describe('Task 18 · publishing is blocked by the legal gates', () => {
  it('refuses to publish an exam without copyright confirmation', async () => {
    const examId = seedExam({ copyright_confirmed: false });

    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'published', ADMIN, undefined, 'superadmin'),
    ).rejects.toThrow(/Nashr qilish rad etildi/);

    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.is_published).toBe(false);
    expect(exam.status).not.toBe('published');
  });

  it('refuses to publish an exam with a restricted license', async () => {
    const examId = seedExam({
      license_type: 'restricted',
      source_name: 'Boshqa kitob',
      source_url: 'https://example.com/book',
      author: 'Muallif',
    });

    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'published', ADMIN, undefined, 'superadmin'),
    ).rejects.toThrow(/Nashr qilish rad etildi/);

    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);
  });

  it('publishes once every legal gate is cleared', async () => {
    const examId = seedExam({
      license_type: 'cc-by',
      copyright_confirmed: true,
      source_name: 'The Japan Foundation',
      source_url: 'https://jf.or.jp/material',
      author: 'The Japan Foundation',
    });

    const res = await ExamWorkflowService.transitionExamStatus(
      examId,
      'published',
      ADMIN,
      undefined,
      'superadmin',
    );

    expect(res.success).toBe(true);
    expect(fakeSupabase.__table('exams')[0].is_published).toBe(true);
    expect(fakeSupabase.__table('exams')[0].status).toBe('published');
  });
});

describe('Task 18 · admin UI surfaces the missing legal fields', () => {
  const projectRoot = path.resolve(__dirname, '../../../..');

  const readProject = (rel: string) => readFileSync(path.join(projectRoot, rel), 'utf-8');

  it('the question editor lists missing legal fields in the validation modal', () => {
    const editor = readProject('src/pages/admin/QuestionEditor.tsx');
    expect(editor).toContain('blockingLegalGates');
    expect(editor).toMatch(/Yetishmayotgan maydonlar/);
    expect(editor).toMatch(/Huquqiy va metadata tekshiruvi/);
    expect(editor).toMatch(/Metadata.ni tahrirlash/);
  });

  it('the bulk import window shows the live legal checklist', () => {
    const modal = readProject('src/components/admin/ExamBulkImportModal.tsx');
    expect(modal).toContain('evaluateLegalGates');
    expect(modal).toMatch(/Yetishmayotgan maydonlar/);
    expect(modal).toMatch(/isLegalFieldMissing/);
  });

  it('the workflow service blocks publishing through the legal gates', () => {
    const workflow = readProject('src/services/ExamWorkflowService.ts');
    expect(workflow).toContain('evaluateLegalGates');
    expect(workflow).toMatch(/if \(gate\.blocking\)/);
  });
});
