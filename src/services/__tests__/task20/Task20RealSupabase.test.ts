/**
 * Task 20 — real Supabase integration suite.
 *
 * Enabled only with `TASK20_REAL=1`; otherwise the suite is skipped so the
 * regular (fake Supabase) test run stays hermetic. Test users are provisioned
 * by scripts/task20/prepare_real_env.py and stored in
 * backups/task20/test_users.json.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const REAL = process.env.TASK20_REAL === '1';
const usersPath = path.resolve(process.cwd(), 'backups/task20/test_users.json');
const hasUsers = fs.existsSync(usersPath);
const hasEnvUrl = Boolean(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
);

let skipReason = '';
if (REAL) {
  if (!hasUsers) {
    skipReason = `Missing test users at ${usersPath}. Run scripts/task20/prepare_real_env.py or provide secrets.`;
  } else if (!hasEnvUrl) {
    skipReason = 'Missing VITE_SUPABASE_URL environment variable.';
  }
}

if (REAL && skipReason) {
  console.warn(`[Task20RealSupabase] Suite SKIPPED: ${skipReason}`);
}

const canRunReal = REAL && !skipReason;
const describeReal = canRunReal ? describe.sequential : describe.skip;

type Role = 'admin' | 'reviewer' | 'user';

interface TestUser {
  email: string;
  password: string;
  id: string;
}

interface RealContext {
  supabase: any;
  users: Record<Role, TestUser>;
  services: {
    ExamBulkImportService: any;
    ExamImportHistoryService: any;
    ExamWorkflowService: any;
  };
  results: Array<{ name: string; ok: boolean; detail?: string }>;
}

const ctx: Partial<RealContext> = { results: [] };

const actorOf = (role: Role) => ({
  id: ctx.users![role].id,
  email: ctx.users![role].email,
  name: role,
  role,
});

async function signIn(role: Role): Promise<string> {
  const { supabase, users } = ctx as RealContext;
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: users[role].email,
    password: users[role].password,
  });
  if (error) throw new Error(`signIn(${role}) failed: ${error.message}`);
  return data.session.user.email as string;
}

async function optional<T>(name: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const value = await fn();
    ctx.results!.push({ name, ok: true });
    return value;
  } catch (err: any) {
    ctx.results!.push({ name, ok: false, detail: err?.message });
    throw err;
  }
}

function knowledgeQuestions(count = 2): any[] {
  const parsed = ctx.services!.ExamBulkImportService.parseAndValidate(
    JSON.stringify(
      Array.from({ length: count }, (_, index) => ({
        id: `t20-${index + 1}`,
        section: 'knowledge',
        section_name: 'Vocabulary',
        section_type: 'knowledge',
        question: `Task 20 real savol ${index + 1}: 次の言葉の意味は？`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Test izohi',
        level: 'N3',
        difficulty: 'easy',
      })),
    ),
    'json',
    { defaultLevel: 'N3' },
  );
  if (parsed.errorCount > 0) {
    throw new Error(`fixture parse errors: ${JSON.stringify(parsed.audit.errors)}`);
  }
  return parsed.items.map((item: any) => item.validated).filter(Boolean);
}

async function importExam(level: 'N3' | 'N4' = 'N3') {
  const { services, supabase } = ctx as RealContext;
  await signIn('admin');
  await supabase.auth.getSession();
  const result = await services.ExamBulkImportService.importFullExamWithSections(
    {
      title: `Task20 Real ${level} ${Date.now()}`,
      level,
      questions: knowledgeQuestions(),
      copyrightConfirmed: true,
      licenseType: 'original',
    },
    { actor: actorOf('admin'), sourceFormat: 'json' },
  );
  if (!result.examId) throw new Error('import did not create an exam');
  return result as {
    examId: string;
    batchId: string;
    questionIds: string[];
    totalInserted: number;
  };
}

async function deleteExam(examId: string) {
  const { supabase } = ctx as RealContext;
  await signIn('admin');
  await supabase.from('exams').delete().eq('id', examId);
}

beforeAll(async () => {
  if (!REAL) return;

  const usersPath = path.resolve(process.cwd(), 'backups/task20/test_users.json');
  if (!fs.existsSync(usersPath)) {
    throw new Error(
      `Missing ${usersPath}. Run the Task 20 user provisioning script before TASK20_REAL=1.`,
    );
  }

  const [{ supabase }, ExamBulkImportService, ExamImportHistoryService, ExamWorkflowService] =
    await Promise.all([
      import('../../../lib/supabase'),
      import('../../../services/ExamBulkImportService').then((m) => m.ExamBulkImportService),
      import('../../../services/ExamImportHistoryService').then((m) => m.ExamImportHistoryService),
      import('../../../services/ExamWorkflowService').then((m) => m.ExamWorkflowService),
    ]);

  ctx.supabase = supabase;
  ctx.users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  ctx.services = { ExamBulkImportService, ExamImportHistoryService, ExamWorkflowService };
});

afterAll(async () => {
  if (!REAL) return;
  try {
    await ctx.supabase?.auth.signOut();
  } catch {
    // ignore
  }
  const target = path.resolve(process.cwd(), 'backups/task20/e2e_results.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    JSON.stringify({ generatedAt: new Date().toISOString(), results: ctx.results }, null, 2),
  );
});

describeReal('Task 20 · real Supabase RLS, storage and lifecycle', () => {
  it('anonymous/normal users cannot read draft exams', async () => {
    const { supabase } = ctx as RealContext;
    const examId = await optional('admin creates draft exam', async () => {
      await signIn('admin');
      const { data, error } = await supabase
        .from('exams')
        .insert({
          title: `Task20 RLS draft ${Date.now()}`,
          type: 'JLPT N3',
          status: 'draft',
          is_published: false,
          license_type: 'original',
          copyright_confirmed: true,
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    });
    if (!examId) return;

    try {
      await optional('normal user cannot see draft exam', async () => {
        await signIn('user');
        const { data, error } = await supabase
          .from('exams')
          .select('id,title')
          .eq('id', examId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        expect(data).toBeNull();
      });

      await optional('normal user cannot insert exams', async () => {
        await signIn('user');
        const { error } = await supabase
          .from('exams')
          .insert({ title: 'unauthorized', type: 'JLPT N3' });
        expect(error).not.toBeNull();
      });

      await optional('reviewer can read the draft exam', async () => {
        await signIn('reviewer');
        const { data, error } = await supabase
          .from('exams')
          .select('id,status')
          .eq('id', examId)
          .single();
        if (error) throw new Error(error.message);
        expect(data.status).toBe('draft');
      });
    } finally {
      await deleteExam(examId);
    }
  }, 120000);

  it('reviewer can import draft content but cannot publish it', async () => {
    const { supabase, users, services } = ctx as RealContext;
    const stamp = Date.now();
    let examId = '';
    let sectionId = '';

    try {
      await optional('reviewer creates draft exam', async () => {
        await signIn('reviewer');
        const { data, error } = await supabase
          .from('exams')
          .insert({
            title: `Task20 reviewer import ${stamp}`,
            type: 'JLPT N3',
            status: 'draft',
            is_published: false,
            license_type: 'original',
            copyright_confirmed: true,
          })
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        examId = data.id;
      });

      await optional('reviewer creates section and question', async () => {
        const { data, error } = await supabase
          .from('exam_sections')
          .insert({
            exam_id: examId,
            title: 'Vocabulary',
            type: 'knowledge',
            order_index: 0,
          })
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        sectionId = data.id;

        const { error: qErr } = await supabase.from('exam_questions').insert({
          section_id: sectionId,
          question_text: 'Task 20 real reviewer savoli?',
          type: 'multiple_choice',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          order_index: 0,
          status: 'draft',
        });
        if (qErr) throw new Error(qErr.message);
      });

      await optional('reviewer cannot flip exam to published via REST', async () => {
        const { error } = await supabase
          .from('exams')
          .update({ status: 'published', is_published: true })
          .eq('id', examId)
          .select('id');
        expect(error).not.toBeNull();
      });

      await optional('publish attempt leaves exam in draft', async () => {
        const { data } = await supabase
          .from('exams')
          .select('status,is_published')
          .eq('id', examId)
          .single();
        expect(data.status).toBe('draft');
        expect(data.is_published).toBe(false);
      });

      await optional('reviewer cannot insert published exam', async () => {
        const { error } = await supabase.from('exams').insert({
          title: `Task20 reviewer published ${stamp}`,
          type: 'JLPT N3',
          status: 'published',
          is_published: true,
        });
        expect(error).not.toBeNull();
      });

      await optional('reviewer publish is blocked by workflow service', async () => {
        await expect(
          services.ExamWorkflowService.transitionExamStatus(
            examId,
            'published',
            users.reviewer.email,
            undefined,
            'reviewer',
          ),
        ).rejects.toThrow(/faqat admin/);
      });
    } finally {
      if (examId) await deleteExam(examId);
    }
  }, 120000);

  it('admin publish, public visibility, version restore and rollback', async () => {
    const { supabase, users, services } = ctx as RealContext;
    const imported = await optional('admin imports a full draft exam', () => importExam('N3'));
    if (!imported) return;
    const { examId, batchId, questionIds } = imported;
    let fallbackCleanup = true;

    try {
      await optional('review → approved → published lifecycle', async () => {
        await signIn('admin');
        await services.ExamWorkflowService.transitionExamStatus(
          examId,
          'review',
          users.admin.email,
          undefined,
          'admin',
        );
        await services.ExamWorkflowService.bulkTransitionQuestions(
          questionIds,
          'review',
          users.admin.email,
          undefined,
          'admin',
        );
        await services.ExamWorkflowService.bulkTransitionQuestions(
          questionIds,
          'approved',
          users.admin.email,
          undefined,
          'admin',
        );
        await services.ExamWorkflowService.transitionExamStatus(
          examId,
          'approved',
          users.admin.email,
          undefined,
          'admin',
        );
        const publish = await services.ExamWorkflowService.transitionExamStatus(
          examId,
          'published',
          users.admin.email,
          undefined,
          'admin',
        );
        expect(publish.success).toBe(true);
        const { data } = await supabase
          .from('exams')
          .select('status,is_published')
          .eq('id', examId)
          .single();
        expect(data.status).toBe('published');
        expect(data.is_published).toBe(true);
      });

      await optional('published exam becomes visible to normal users', async () => {
        await signIn('user');
        const { data, error } = await supabase
          .from('exams')
          .select('id,status')
          .eq('id', examId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        expect(data?.id).toBe(examId);
      });

      await optional('version snapshot can restore exam title', async () => {
        await signIn('admin');
        const versions = await services.ExamImportHistoryService.listVersions(examId);
        expect(versions.length).toBeGreaterThan(0);
        const snapshot = await services.ExamImportHistoryService.getVersion(versions[0].id);
        const originalTitle = snapshot.snapshot?.exam?.title;
        expect(originalTitle).toBeTruthy();

        const { error } = await supabase
          .from('exams')
          .update({ title: `${originalTitle} (mutated)` })
          .eq('id', examId);
        if (error) throw new Error(error.message);

        await services.ExamImportHistoryService.revertToVersion(snapshot.id, {
          adminConfirmed: true,
          actor: actorOf('admin'),
        });

        const { data } = await supabase.from('exams').select('title').eq('id', examId).single();
        expect(data.title).toBe(originalTitle);
      });

      await optional('import batch rollback removes the exam', async () => {
        const result = await services.ExamImportHistoryService.rollbackBatch(batchId, {
          adminConfirmed: true,
          reason: 'Task 20 real Supabase E2E rollback',
          actor: actorOf('admin'),
        });
        fallbackCleanup = false;
        expect(result.status).toBe('rolled_back');

        const { data } = await supabase.from('exams').select('id').eq('id', examId);
        expect(data || []).toHaveLength(0);

        const { data: batch } = await supabase
          .from('exam_import_batches')
          .select('status')
          .eq('id', batchId)
          .single();
        expect(batch.status).toBe('rolled_back');
      });

      await optional('rolled back exam is no longer visible publicly', async () => {
        await signIn('user');
        const { data } = await supabase.from('exams').select('id').eq('id', examId);
        expect(data || []).toHaveLength(0);
      });
    } finally {
      if (fallbackCleanup) await deleteExam(examId);
    }
  }, 240000);

  it('listening_audios storage policy: admin only', async () => {
    const { supabase } = ctx as RealContext;
    const objectPath = `task20/${Date.now()}.mp3`;
    const bytes = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00]);
    const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const upload = async (target: string) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return fetch(`${baseUrl}/storage/v1/object/listening_audios/${target}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          'Content-Type': 'audio/mpeg',
          'x-upsert': 'true',
        },
        body: bytes,
      });
    };

    try {
      await optional('admin uploads to listening_audios', async () => {
        await signIn('admin');
        const response = await upload(objectPath);
        if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      });

      await optional('admin reads back uploaded object metadata', async () => {
        const { data, error } = await supabase.storage.from('listening_audios').list('task20');
        if (error) throw new Error(error.message);
        expect((data || []).some((item: any) => objectPath.endsWith(item.name))).toBe(true);
      });

      await optional('reviewer cannot upload to listening_audios', async () => {
        await signIn('reviewer');
        const response = await upload(`${objectPath}.reviewer.mp3`);
        expect(response.ok).toBe(false);
      });

      await optional('normal user cannot upload to listening_audios', async () => {
        await signIn('user');
        const response = await upload(`${objectPath}.user.mp3`);
        expect(response.ok).toBe(false);
      });
    } finally {
      await signIn('admin');
      await supabase.storage
        .from('listening_audios')
        .remove([objectPath, `${objectPath}.reviewer.mp3`, `${objectPath}.user.mp3`]);
    }
  }, 180000);
});
