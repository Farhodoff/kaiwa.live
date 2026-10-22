# Task 20 — Real Supabase rollout report

**Project:** `qmuimxnknxwarvnkpnlo` (linked)
**Date:** 2026-10-22
**Status:** ✅ PASS (20/20 scenarios)
**Scope:** apply pending exam-workflow migrations to the real project, verify RLS / storage / lifecycle against real PostgREST + Storage, and document the result.

## 1. Environment constraints

| Constraint                                                            | Impact                                                 | Workaround                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `SERVICE_ROLE` key (`sb_secret_…`) returns 401 on REST and auth admin | Cannot create users or bypass RLS with the service key | Test users are created with the anon `signUp` endpoint (auto-confirmed) and roles are assigned with `supabase db query --linked` |
| Docker is not available                                               | `supabase db dump / pull / diff` fail                  | Schema snapshot is captured with SQL queries through `supabase db query --linked -o json`                                        |
| `supabase db query` exits `0` even on SQL errors                      | False-positive applies possible                        | Every apply validates the output for `Failed to run sql query` / `unexpected status`                                             |
| Remote migration history lagged behind the repo                       | ~70 local migrations were unrecorded                   | Only the exam-workflow migrations were applied and then recorded with `supabase migration repair --status applied`               |

## 2. Migrations applied

Each migration was wrapped in `begin; … commit;` and applied with `supabase db query --linked`.

| Version        | File                                         | Status  |
| -------------- | -------------------------------------------- | ------- |
| 20260920000000 | `create_custom_listening_questions.sql`      | applied |
| 20260921000000 | `add_passage_and_listening_entities.sql`     | applied |
| 20260922000000 | `add_exam_content_workflow_status.sql`       | applied |
| 20260923000000 | `add_exam_source_and_license_metadata.sql`   | applied |
| 20261021000000 | `add_exam_import_batches_and_versions.sql`   | applied |
| 20261022000000 | `add_jlpt_question_type_payload.sql`         | applied |
| 20261023000000 | `add_jlpt_timing_configs.sql`                | applied |
| 20261024000000 | `admin_content_quality_audit.sql`            | applied |
| 20261025000000 | `task17_draft_only_import_invariants.sql`    | applied |
| 20261026000000 | `task18_legal_publish_gates.sql`             | applied |
| 20261027000000 | `task19_workflow_transition_enforcement.sql` | applied |
| 20261028000000 | `task20_exam_workflow_rollout.sql`           | applied |
| 20261028000001 | `task20_reviewer_read_policies.sql`          | applied |

`supabase migration list --linked` now reports 39 applied versions (26 pre-existing + 13 new). Migration history was written with:

```bash
supabase migration repair --status applied --linked \
  20260920000000 20260921000000 20260922000000 20260923000000 \
  20261021000000 20261022000000 20261023000000 20261024000000 \
  20261025000000 20261026000000 20261027000000 20261028000000 20261028000001
```

Apply log: `backups/task20/migration_apply_log.json`.

## 3. Schema verification

Snapshots:

- pre: `backups/task20/pre_schema_snapshot.json` / `.sql`
- post: `backups/task20/post_schema_snapshot.json`
- diff: `backups/task20/schema_diff.json`

| Object                 | Pre | Post | Delta                           |
| ---------------------- | --- | ---- | ------------------------------- |
| Columns (public)       | 720 | 838  | +118                            |
| Constraints            | 161 | 191  | +30                             |
| Indexes (public)       | 201 | 234  | +33                             |
| Policies (all schemas) | 249 | 300  | +51 (0 removed in this rollout) |
| Functions              | 19  | 25   | +6                              |
| Triggers               | 6   | 9    | +3                              |
| Storage buckets        | 1   | 2    | +1 (`listening_audios`)         |
| Tables with RLS        | 69  | 77   | +8                              |
| Migrations             | 26  | 39   | +13                             |

New / extended tables:

- `reading_passages`, `listening_audios`, `custom_listening_questions`
- `exam_import_batches`, `exam_import_batch_items`, `exam_content_versions`
- `jlpt_timing_configs`, `exam_workflow_events`
- `exams` (+11 columns: `status`, review/archive audit, source/license metadata)
- `exam_questions` (+14 columns: workflow status, JLPT payload)

New functions: `is_reviewer`, `exam_allowed_next_statuses`, `question_allowed_next_statuses`, `enforce_exam_workflow_transition`, `enforce_question_workflow_transition`, `set_jlpt_timing_config_updated_at`.

New triggers: `trg_exams_workflow_transition`, `trg_exam_questions_workflow_transition`, `update_jlpt_timing_configs_updated_at`.

Bucket `listening_audios`: public read, 25 MiB limit, admin-only writes (reviewer/user uploads rejected).

## 4. Real Supabase E2E results

Suite: `src/services/__tests__/task20/Task20RealSupabase.test.ts`
Command: `TASK20_REAL=1 npx vitest run src/services/__tests__/task20/Task20RealSupabase.test.ts`
Users: `scripts/task20/prepare_real_env.py` → `backups/task20/test_users.json`
Raw results: `backups/task20/e2e_results.json`

| #   | Scenario                                             | Result |
| --- | ---------------------------------------------------- | ------ |
| 1   | Admin creates a draft exam                           | pass   |
| 2   | Normal user cannot SELECT the draft                  | pass   |
| 3   | Normal user cannot INSERT exams                      | pass   |
| 4   | Reviewer can SELECT the draft                        | pass   |
| 5   | Reviewer creates draft exam                          | pass   |
| 6   | Reviewer creates section and question                | pass   |
| 7   | Reviewer cannot flip to `published` via REST         | pass   |
| 8   | Blocked update leaves the exam in `draft`            | pass   |
| 9   | Reviewer cannot INSERT a published exam              | pass   |
| 10  | `ExamWorkflowService` rejects reviewer publish       | pass   |
| 11  | Admin imports a full draft exam (knowledge sections) | pass   |
| 12  | `draft → review → approved → published` lifecycle    | pass   |
| 13  | Published exam becomes visible to normal users       | pass   |
| 14  | Version restore of exam title / content              | pass   |
| 15  | `rollbackBatch` deletes the imported exam            | pass   |
| 16  | Rolled-back exam is no longer public                 | pass   |
| 17  | Admin uploads to `listening_audios`                  | pass   |
| 18  | Admin can list the uploaded object                   | pass   |
| 19  | Reviewer upload is rejected                          | pass   |
| 20  | Normal user upload is rejected                       | pass   |

## 5. Defect found and fixed during the real run

`ExamImportHistoryService.revertToVersion` used to upsert the whole snapshot, including `status` / `is_published`. Restoring a draft snapshot while the exam was published attempted `published → draft`, which the Task 19 trigger correctly rejected:

```
Noto'g'ri exam status o'tishi: "published" → "draft". Ruxsat etilgan o'tishlar: archived
```

Fix: version restore is now content-only. The current workflow fields (`status`, `is_published`, `reviewed_by`, `reviewed_at`, `archived_at`, `rejection_comment`) are read from the live row and preserved during the upsert. Regression coverage was added to `Task16E2E.test.ts` (“preserves the current workflow status when reverting content”).

## 6. Test commands

```bash
# type / lint / format
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
npx prettier --check "src/**/*.{ts,tsx}"

# hermetic suite (real suite auto-skips without TASK20_REAL)
npx vitest run

# real Supabase suite
python3 scripts/task20/prepare_real_env.py
TASK20_REAL=1 npx vitest run src/services/__tests__/task20/Task20RealSupabase.test.ts
```

## 7. Notes / follow-ups

- The remote project still has repository migration files that are not part of the exam workflow (e.g. duplicated `20260726`, `20260813`, `20260819`, `20260824`, `20260827`, `20260828`, `20260905`, `20260918` versions). They were intentionally left untouched; resolve the duplicate-version history separately before a full `db push`.
- Test users and any future rows are created through anon signup because the current `SERVICE_ROLE` secret is invalid. Rotate/repair that key before using admin APIs in CI.
- Storage uploads are tested over the raw Storage REST endpoint in the Vitest (jsdom) environment; `storage-js`'s FormData path is not used because jsdom does not hand Node's `Blob` to the server with the requested MIME type.
