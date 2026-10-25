/**
 * Task 15 — admin panel production security checks.
 *
 * Verifies the exam import hardening end-to-end:
 *  - admin/reviewer import gating and admin-only publishing
 *  - upload size + format validation (PDF / JSON / CSV / TXT / audio)
 *  - published-question immutability for non-admins
 *  - import rate limiting
 *  - error sanitization (no secrets leak to UI/logs)
 *  - RLS policy assertions for exam content + import audit tables
 */
/// <reference types="node" />
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  canImportExamContent,
  canPublishExamContent,
  canMutatePublishedQuestion,
  createImportRateLimiter,
  detectImportUploadKind,
  sanitizeImportError,
  validateImportUpload,
  IMPORT_UPLOAD_LIMITS,
} from '../examImportSecurity';

const projectRoot = path.resolve(__dirname, '../../..');

function readProject(rel: string): string {
  return readFileSync(path.join(projectRoot, rel), 'utf-8');
}

describe('import role gating', () => {
  it('allows admin, superadmin and reviewer roles', () => {
    for (const role of ['admin', 'superadmin', 'reviewer', 'reviewer ']) {
      expect(canImportExamContent('someone@example.com', role)).toBe(true);
    }
  });

  it('allows the owner/admin emails regardless of role', () => {
    expect(canImportExamContent('fsoyilov@gmail.com', null)).toBe(true);
    expect(canImportExamContent('admin@kaiwa.live', null)).toBe(true);
    expect(canImportExamContent('admin@nihongo-talk.jp', null)).toBe(true);
    expect(canImportExamContent('FSOYILOV@gmail.com', 'authenticated')).toBe(true);
  });

  it('denies regular users and anonymous callers', () => {
    expect(canImportExamContent('user@example.com', 'user')).toBe(false);
    expect(canImportExamContent('user@example.com', 'authenticated')).toBe(false);
    expect(canImportExamContent(null, null)).toBe(false);
    expect(canImportExamContent(undefined, undefined)).toBe(false);
  });

  it('restricts publishing to admins only, not reviewers', () => {
    expect(canPublishExamContent('someone@example.com', 'admin')).toBe(true);
    expect(canPublishExamContent('someone@example.com', 'superadmin')).toBe(true);
    expect(canPublishExamContent('someone@example.com', 'reviewer')).toBe(false);
    expect(canPublishExamContent('fsoyilov@gmail.com', null)).toBe(true);
    expect(canPublishExamContent('user@example.com', 'user')).toBe(false);
  });
});

describe('published question immutability', () => {
  it('lets reviewers edit drafts but not published content', () => {
    const email = 'reviewer@example.com';
    expect(canMutatePublishedQuestion(false, email, 'reviewer')).toBe(true);
    expect(canMutatePublishedQuestion(true, email, 'reviewer')).toBe(false);
  });

  it('lets admins edit published content', () => {
    expect(canMutatePublishedQuestion(true, 'someone@example.com', 'admin')).toBe(true);
    expect(canMutatePublishedQuestion(true, 'fsoyilov@gmail.com', null)).toBe(true);
  });

  it('blocks anonymous callers from mutating anything', () => {
    expect(canMutatePublishedQuestion(false, null, null)).toBe(false);
    expect(canMutatePublishedQuestion(true, null, null)).toBe(false);
  });
});

describe('upload size and format validation', () => {
  const pdf = { name: 'exam.pdf', size: 5 * 1024 * 1024, type: 'application/pdf' };

  it('detects supported file kinds', () => {
    expect(detectImportUploadKind(pdf)).toBe('pdf');
    expect(detectImportUploadKind({ name: 'q.json', size: 1, type: '' })).toBe('json');
    expect(detectImportUploadKind({ name: 'q.csv', size: 1, type: '' })).toBe('csv');
    expect(detectImportUploadKind({ name: 'q.txt', size: 1, type: '' })).toBe('text');
    expect(detectImportUploadKind({ name: 'a.webm', size: 1, type: 'audio/webm' })).toBe('audio');
    expect(
      detectImportUploadKind({ name: 'virus.exe', size: 1, type: 'application/x-msdownload' }),
    ).toBeNull();
  });

  it('accepts a normal PDF within limits', () => {
    expect(validateImportUpload(pdf)).toMatchObject({ valid: true, kind: 'pdf' });
  });

  it('rejects an oversized PDF (>20MB)', () => {
    const big = { name: 'exam.pdf', size: 21 * 1024 * 1024, type: 'application/pdf' };
    const result = validateImportUpload(big, 'pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/juda katta/);
  });

  it('rejects spoofed extensions with a wrong MIME type', () => {
    const spoof = { name: 'exam.pdf', size: 1024, type: 'application/x-msdownload' };
    const result = validateImportUpload(spoof, 'pdf');
    expect(result.valid).toBe(false);
  });

  it('rejects empty files and unsupported formats', () => {
    expect(validateImportUpload({ name: 'exam.pdf', size: 0, type: 'application/pdf' }).valid).toBe(
      false,
    );
    expect(validateImportUpload({ name: 'payload.exe', size: 1024, type: '' }).valid).toBe(false);
  });

  it('enforces per-kind caps (audio 25MB)', () => {
    expect(IMPORT_UPLOAD_LIMITS.audio.maxBytes).toBe(25 * 1024 * 1024);
    expect(
      validateImportUpload({ name: 'a.webm', size: 26 * 1024 * 1024, type: 'audio/webm' }).valid,
    ).toBe(false);
    expect(
      validateImportUpload({ name: 'a.webm', size: 1 * 1024 * 1024, type: 'audio/webm' }).valid,
    ).toBe(true);
  });
});

describe('import rate limiter', () => {
  let limiter: ReturnType<typeof createImportRateLimiter>;

  beforeEach(() => {
    limiter = createImportRateLimiter({ max: 3, windowMs: 1000 });
  });

  it('allows up to max hits then blocks', () => {
    expect(limiter.check('user-1', 0).allowed).toBe(true);
    expect(limiter.check('user-1', 1).allowed).toBe(true);
    expect(limiter.check('user-1', 2).allowed).toBe(true);
    const blocked = limiter.check('user-1', 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('keys limits per user', () => {
    limiter.check('user-1', 0);
    limiter.check('user-1', 1);
    limiter.check('user-1', 2);
    expect(limiter.check('user-1', 3).allowed).toBe(false);
    expect(limiter.check('user-2', 3).allowed).toBe(true);
  });

  it('frees the window after it expires', () => {
    for (let i = 0; i < 3; i++) limiter.check('user-1', i);
    expect(limiter.check('user-1', 3).allowed).toBe(false);
    expect(limiter.check('user-1', 1001).allowed).toBe(true);
  });

  it('reset clears stored hits', () => {
    for (let i = 0; i < 3; i++) limiter.check('user-1', i);
    limiter.reset('user-1');
    expect(limiter.check('user-1', 3).allowed).toBe(true);
  });
});

describe('error sanitization', () => {
  it('redacts AI/OpenAI/Bearer/DB secrets', () => {
    const msg =
      'failed AIzaSyABCDEFGHIJKLMNOP with sk-abcdefghijklmnop and Bearer abc.def.ghi password postgres://user:secret@host/db';
    const out = sanitizeImportError(msg);
    expect(out).not.toContain('AIzaSyABCDEFGHIJKLMNOP');
    expect(out).not.toContain('sk-abcdefghijklmnop');
    expect(out).not.toContain('secret@host');
    expect(out).toContain('[REDACTED');
  });

  it('redacts raw JWTs and service-role references', () => {
    const mockHeader = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
    const mockPayload = Buffer.from('{"role":"service_role"}').toString('base64url');
    const jwt = `${mockHeader}.${mockPayload}.testsignature12345`;
    const out = sanitizeImportError(`token ${jwt} service_role`);
    expect(out).not.toContain(mockHeader);
    expect(out).not.toMatch(/service_role/);
  });

  it('strips stack traces and handles non-string errors safely', () => {
    const err = new Error('boom\n    at Object.<anonymous> (/app/secret.ts:1:1)');
    expect(sanitizeImportError(err)).toBe('boom');
    expect(sanitizeImportError(null)).toBe("Noma'lum xatolik");
    expect(sanitizeImportError({ message: 'sk-abcdefghijklmnop' })).not.toContain(
      'sk-abcdefghijklmnop',
    );
  });
});

describe('Task 15 RLS + integration assertions', () => {
  const modal = readProject('src/components/admin/ExamBulkImportModal.tsx');
  const examsManager = readProject('src/pages/admin/ExamsManager.tsx');
  const questionEditor = readProject('src/pages/admin/QuestionEditor.tsx');

  it('modal enforces the import and rate-limit guards before running', () => {
    expect(modal).toContain("from '../../utils/examImportSecurity'");
    expect(modal).toMatch(/if \(!canImport\)/);
    expect(modal).toMatch(/examImportRateLimiter\.check/);
    expect(modal).toMatch(/sanitizeImportError/);
    expect(modal).toMatch(/validateImportUpload/);
  });

  it('Task 17: the bulk import window has no publish path at all', () => {
    // Draft-only model: the import window can never publish content.
    expect(modal).not.toMatch(/handleExecuteImport\(true\)/);
    expect(modal).not.toMatch(/isPublished:\s*publish/);
    expect(modal).not.toMatch(/Tasdiqlash \(/);
    expect(modal).toMatch(/Draft sifatida saqlash/);
    expect(modal).toMatch(/Publish qilish uchun review kerak/);
  });

  it('Task 17: publishing is admin-only and lives in the workflow service', () => {
    const workflow = readProject('src/services/ExamWorkflowService.ts');
    expect(workflow).toMatch(/canPublishExamContent/);
    expect(workflow).toMatch(/faqat admin uchun ruxsat etilgan/);
  });

  it('both admin pages pass the authenticated identity into the modal', () => {
    expect(examsManager).toContain('currentUserEmail={user?.email}');
    expect(questionEditor).toContain('currentUserEmail={user?.email}');
  });

  it('exam content writes are admin-only in RLS (published content immutable)', () => {
    const migration = readProject('supabase/migrations/20260728120000_fix_exams_rls_policies.sql');
    for (const table of ['exam_questions', 'exam_sections', 'exams']) {
      expect(migration).toMatch(
        new RegExp(`CREATE POLICY "${table}_insert"[\\s\\S]*?WITH CHECK \\(is_admin\\(\\)\\)`),
      );
      expect(migration).toMatch(
        new RegExp(`CREATE POLICY "${table}_update"[\\s\\S]*?USING \\(is_admin\\(\\)\\)`),
      );
      expect(migration).toMatch(
        new RegExp(`CREATE POLICY "${table}_delete"[\\s\\S]*?USING \\(is_admin\\(\\)\\)`),
      );
    }
  });

  it('import audit/version tables are admin-only', () => {
    const migration = readProject(
      'supabase/migrations/20261021000000_add_exam_import_batches_and_versions.sql',
    );
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    for (const table of [
      'exam_import_batches',
      'exam_import_batch_items',
      'exam_content_versions',
    ]) {
      expect(migration).toMatch(
        new RegExp(`${table}[\\s\\S]*?USING \\(public\\.is_admin\\(\\)\\)`),
      );
    }
  });

  it('storage upload policies gate admin buckets with is_admin(), not JWT role claims', () => {
    const migration = readProject('supabase/migrations/20260825000000_p1_security_fixes.sql');
    expect(migration).toMatch(/Admin Insert Access[\s\S]*?bucket_id = 'exams' AND is_admin\(\)/);
    expect(migration).toMatch(/Users can upload speaking audio[\s\S]*?auth\.uid\(\)/);
  });
});
