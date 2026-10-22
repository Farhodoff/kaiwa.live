# Task 16 — N3 / N2 / N1 Real-Content End-to-End Report

**Date:** 2026-10-21
**Status:** ✅ PASS (18/18 tests)

## 1. Scope

Verify the complete exam lifecycle with the repository's real JLPT content
(`src/data/jlptMockExamData.ts`) for **N3, N2 and N1**:

import → reading passage → listening audio → AI draft → validation →
review → approved → published → mock exam render → timer → scoring →
mistake vault → skill matrix → export → rollback.

## 2. Environment

| Item          | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Runner        | Vitest + JSDOM                                         |
| Database      | In-memory `fakeSupabase` (`src/utils/fakeSupabase.ts`) |
| AI provider   | Mocked deterministic `callAI`                          |
| Live Supabase | **Not used** (see §7)                                  |

## 3. Test artifacts

- Suite: `src/services/__tests__/task16/Task16E2E.test.ts`
- Fixtures (real content): `src/services/__tests__/task16/contentFixtures.ts`
- Machine-readable results: `docs/reports/TASK16_E2E_RESULTS.json`

Per level the fixture imports **9 real questions** (5 knowledge, 2 reading with
passages, 2 listening with audio/scripts), plus a real reading passage and a
real listening audio record.

## 4. Scenario matrix

| #   | Scenario                              | N3  | N2  | N1  |
| --- | ------------------------------------- | --- | --- | --- |
| 1   | JSON parse + validate (0 errors)      | ✅  | ✅  | ✅  |
| 2   | CSV parse + validate (0 errors)       | ✅  | ✅  | ✅  |
| 3   | Full lifecycle (import → publish)     | ✅  | ✅  | ✅  |
| 4   | CSV full-exam import count parity     | ✅  | ✅  | ✅  |
| 5   | AI draft → validate → import as draft | ✅  | ✅  | ✅  |

Plus:

- ✅ Version snapshot + revert restores the earlier question set.
- ✅ Rollback guards (admin confirmation + admin actor).

### Lifecycle assertions (per level)

1. Full exam import inserts 9 questions across 3 sections; exam stays draft.
2. Reading passage and listening audio are persisted (1 each) with `audio_url`.
3. Publishing is **blocked** while questions are still drafts
   (`validatsiya: tasdiqlanmagan savollar`).
4. `review` → questions bulk-approved → exam `approved`.
5. Exam `published`; `is_published = true`; post-publish validation is valid.
6. `getPublishedJlptExams(level)` includes the exam.
7. `getExamWithQuestions` returns `isFromDb: true`, all 9 questions, and a
   positive `timeLimitSeconds`.
8. `calculateJlptScore` returns a 0–180 score with all three sections and
   exactly `n-1` correct answers for the scripted answer sheet.
9. Wrong answers land in `MistakeVaultService`; reading/listening evidence is
   recorded and reflected by `SkillMatrixService.computeLevelReport`.
10. JSON export matches the imported question count and includes the passage
    and audio; CSV export contains the `correctAnswer` header.
11. `rollbackBatch` removes the whole exam and marks the batch `rolled_back`.

## 5. Defect found and fixed

**TASK16-BUG-01 (high)** — `src/services/ExamBulkImportService.ts`

`parseCsv` lowercases all header names, so the app-generated `correctAnswer`
column became `correctanswer`. The record mapper only read the camelCase key,
so the app's **own CSV template failed validation** with
`To'g'ri javob (correctAnswer) ... ko'rsatilmagan`.

**Fix:** read the lowercased `correctanswer` key as a fallback in the CSV
mapper. Covered by the CSV validation and CSV full-exam tests for all three
levels.

## 6. Quality gates

| Gate                            | Result   |
| ------------------------------- | -------- |
| `npx tsc --noEmit`              | ✅ pass  |
| `npx eslint … --max-warnings 0` | ✅ pass  |
| `npx prettier --check`          | ✅ pass  |
| Task 16 suite                   | ✅ 18/18 |

**Full suite:** 2103/2107 pass. Four slow, load-sensitive tests
(`CustomContentDokkai`, `CustomContentService`, `JlptMockDiagnosticRemediation`,
`Phase19E2ELearningLoop`, plus occasionally `CoachProgressDashboard`) fail only
under high parallelism, in a different combination each run, and pass when run
alone or in pairs. The same flakiness reproduces **without** the Task 16 suite,
so it is pre-existing and unrelated to this change.

## 7. Why live Supabase was not used

The selected environment was the mocked/E2E harness because the live project
was not testable:

- `SERVICE_ROLE` key rejected (`Unregistered API key`).
- ~70 migrations pending on the linked project.
- Live `exams` table only has `id,title,description,type,is_published,created_at`;
  import batch, content version, workflow event and QC tables are absent.

## 8. Limitations

- The harness validates application logic, not real RLS, storage or network
  behavior.
- AI extraction uses a mocked provider response.
- Content is a 9-question/level sample, not the full production bank.
