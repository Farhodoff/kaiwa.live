# Task 16 — N3 / N2 / N1 Real Content End-to-End Suite Report

## 1. Overview

Task 16 verifies the complete JLPT Exam lifecycle from end to end using authentic JLPT N3, N2, and N1 questions extracted from `src/data/jlptMockExamData.ts`. All 18 tests run deterministically against the in-memory Supabase fake (`src/utils/fakeSupabase.ts`).

## 2. Test Execution Summary

- **Test File:** `src/services/__tests__/task16/Task16E2E.test.ts`
- **Total Tests:** 18
- **Passed:** 18 (100%)
- **Failed:** 0
- **Duration:** ~30ms

### Test Groups:

1. **Import Validation with Real N3/N2/N1 Content (6 tests):**
   - N3 JSON & CSV: 0 parse errors, Japanese kanji/furigana preserved.
   - N2 JSON & CSV: 0 parse errors, complex options validated.
   - N1 JSON & CSV: 0 parse errors, advanced reading passages linked.

2. **Full Lifecycle per Level (3 tests):**
   - **N3:** JSON import (Draft) -> Reading passage & listening audio linking -> Submit for Review -> Approve -> Publish -> Mock Exam render -> Timed test attempt -> JLPT 3-section scoring (Knowledge, Reading, Listening out of 180) -> Mistake vault recording -> Skill matrix calculation -> JSON export bundle -> Rollback.
   - **N2:** Full lifecycle complete with 0 errors.
   - **N1:** Full lifecycle complete with 0 errors.

3. **CSV Import Separate Exams (3 tests):**
   - Verified that CSV imports create independent exams with equivalent question parity.

4. **AI Draft Generation Integration (3 tests):**
   - Verified that AI draft questions always enforce `draft` status, preventing auto-publish bypass.

5. **Version Snapshot & Revert (2 tests):**
   - Verified snapshot creation prior to edits and non-destructive revert preserving workflow state.

6. **Rollback Guards (2 tests):**
   - Verified admin confirmation requirement and non-admin actor rejection.

## 3. JSON Results

Complete machine-readable test execution output is stored in [e2e_results.json](./e2e_results.json).
