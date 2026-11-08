# KAIWA.LIVE — SECURITY TEST MATRIX

**Date:** November 8, 2026  
**Auditor:** Principal Application Security Engineer & DevSecOps Specialist  
**Coverage:** 288 Test Files | 2,514 Automated Tests | 0 Failures

---

## 1. Role-Based Access Control (RBAC) & RLS Matrix

The following matrix documents the expected and verified authorization outcomes across each synthetic role identity.

| Resource / Action                                                     |     Anonymous (Guest)     | Student (Authenticated)  |     Content Reviewer     |      Administrator       |     Super Administrator     | Automated Test Reference                                               |
| :-------------------------------------------------------------------- | :-----------------------: | :----------------------: | :----------------------: | :----------------------: | :-------------------------: | :--------------------------------------------------------------------- |
| **Public Educational Pages** (`/jlpt`, `/speaking-coach`)             |        ALLOW (200)        |       ALLOW (200)        |       ALLOW (200)        |       ALLOW (200)        |         ALLOW (200)         | `e2e/speaking-coach-mocked.spec.ts`                                    |
| **Personal Study Plan & Tasks** (`/dashboard`, `/tasks`)              |   DENY / REDIRECT (302)   | ALLOW (200, Own records) | ALLOW (200, Own records) | ALLOW (200, Own records) |  ALLOW (200, All records)   | `src/utils/__tests__/auth_session_lifecycle_regression.test.ts`        |
| **Student Flashcards & SRS** (`public.flashcards`)                    |    DENY (RLS Blocked)     |  ALLOW (Own `user_id`)   |  ALLOW (Own `user_id`)   |  ALLOW (Own `user_id`)   |     ALLOW (Full Access)     | `src/utils/__tests__/security_and_srs_hardening.test.ts`               |
| **Published Exams** (`is_published = true`)                           |     ALLOW (Read-only)     |  ALLOW (Read & Submit)   |  ALLOW (Read & Submit)   |  ALLOW (Read & Submit)   |    ALLOW (Read & Submit)    | `src/services/__tests__/ExamImportHistoryService.test.ts`              |
| **Draft / Unpublished Exams** (`is_published = false`)                |   DENY (RLS 404/Empty)    |   DENY (RLS 404/Empty)   |   ALLOW (Read & Edit)    |   ALLOW (Full Access)    |     ALLOW (Full Access)     | `src/utils/__tests__/admin_panel_health.test.ts`                       |
| **Curriculum Review Queue** (`public.curriculum_revisions`)           |    DENY (RLS Blocked)     |    DENY (RLS Blocked)    |  ALLOW (Draft / Review)  |  ALLOW (Full Workflow)   |    ALLOW (Full Workflow)    | `supabase/migrations/20261108000000_curriculum_quality_queue.sql`      |
| **Approve Self-Authored Revision**                                    |   DENY (Constraint 403)   |  DENY (Constraint 403)   |  DENY (Constraint 403)   |  DENY (Constraint 403)   | ALLOW (Superadmin override) | `src/services/__tests__/ContentQualityAuditService.test.ts`            |
| **Azure Speech Token Minting** (`POST /api/speech-token`)             |   ALLOW (Guest limits)    |  ALLOW (10m STS Token)   |  ALLOW (10m STS Token)   |  ALLOW (10m STS Token)   |    ALLOW (10m STS Token)    | `src/services/__tests__/azureSpeechAuth.test.ts`                       |
| **DeepSeek AI Proxy** (`POST /api/deepseek`)                          | ALLOW (Daily quota limit) |   ALLOW (Tiered quota)   |   ALLOW (Higher quota)   |   ALLOW (Unrestricted)   |    ALLOW (Unrestricted)     | `src/utils/__tests__/api_security_hardening.test.ts`                   |
| **Admin Panel Route** (`/admin`)                                      |   DENY / REDIRECT (302)   |  DENY / REDIRECT (302)   |        DENY (302)        |       ALLOW (200)        |         ALLOW (200)         | `src/utils/__tests__/router_security_regression.test.ts`               |
| **Update Global Flashcard Card** (`POST /api/admin/update-deck-card`) |        DENY (401)         |        DENY (403)        |        DENY (403)        |       ALLOW (200)        |         ALLOW (200)         | `src/components/decks/__tests__/FlashcardStudySessionQA.test.tsx`      |
| **Admin User Deletion** (`POST /api/admin/delete-user`)               |        DENY (401)         |        DENY (403)        |        DENY (403)        |        DENY (403)        |  ALLOW (200, target!=self)  | `src/utils/__tests__/adminDeleteUser.test.ts`                          |
| **Delete Superadmin Account**                                         |        DENY (403)         |        DENY (403)        |        DENY (403)        |        DENY (403)        |    DENY (403 Protected)     | `src/utils/__tests__/adminDeleteUser.test.ts`                          |
| **Modify User Roles** (`set_profile_role` RPC)                        |      DENY (401/403)       |        DENY (403)        |        DENY (403)        |        DENY (403)        |     ALLOW (Audited RPC)     | `supabase/migrations/20261108010000_role_only_admin_authorization.sql` |

---

## 2. API Endpoint Security Test Matrix

| Endpoint                      | Method |         Expected Auth         |  Input Validation   |     CORS Rule     |     Rate Limiting      |                  Test Status                  |
| :---------------------------- | :----: | :---------------------------: | :-----------------: | :---------------: | :--------------------: | :-------------------------------------------: |
| `/api/speech-token`           | `POST` |    Optional (Auth / Guest)    |    None required    |  Exact Allowlist  |        Enforced        |       **PASS** (`corsSecurity.test.ts`)       |
| `/api/deepseek`               | `POST` |   Optional (Bearer or Anon)   | JSON Payload bounds |  Exact Allowlist  | Enforced (`_quota.js`) |  **PASS** (`api_security_hardening.test.ts`)  |
| `/api/admin/delete-user`      | `POST` |  Bearer (`superadmin` role)   |  UUID format check  |  Exact Allowlist  |       Serverless       |     **PASS** (`adminDeleteUser.test.ts`)      |
| `/api/admin/update-deck-card` | `POST` | Bearer (`admin`/`superadmin`) |  Card schema check  |  Exact Allowlist  |       Serverless       | **PASS** (`FlashcardStudySessionQA.test.tsx`) |
| `/api/_telegram/webhook`      | `POST` |    Secret Token in Header     | Telegram Bot format | Telegram IP Range |    Telegram limits     |       **PASS** (`telegramAuth.test.ts`)       |

---

## 3. Test Suites Mapping

### Authorization & Security Core

- `src/utils/__tests__/admin.test.ts` — 6 tests verifying superadmin identity, English track gating, and email case-insensitivity.
- `src/utils/__tests__/adminDeleteUser.test.ts` — 4 tests verifying `superadmin` role requirements, self-deletion prevention, and untrusted client role rejection.
- `src/utils/__tests__/admin_role_assignment.test.ts` — 10 tests verifying dynamic role assignment, RPC attribution, and immutable audit logs.
- `src/utils/__tests__/admin_panel_health.test.ts` — 6 tests verifying gatekeeper boundaries and whitelist integrity.
- `src/utils/__tests__/api_security_hardening.test.ts` — 9 tests verifying exact CORS origins, untrusted third-party rejection, and daily quotas.
- `src/utils/__tests__/corsSecurity.test.ts` — 7 tests verifying exact allowed origin behavior across production, preview, and localhost.
- `src/utils/__tests__/security_hardening_deep.test.ts` — 9 tests verifying role enforcement without localStorage tampering.
- `src/utils/__tests__/auth_session_lifecycle_regression.test.ts` — 13 tests covering session expiration, logout token purging, and offline data preservation.
- `src/utils/__tests__/router_security_regression.test.ts` — 4 tests verifying navigation guards and redirect parameters.
- `src/utils/__tests__/security_and_production_readiness.test.ts` — 17 tests verifying student data isolation and admin dashboard access.

### Integration & End-to-End

- `e2e/speaking-coach-mocked.spec.ts` — 4 Playwright tests verifying mock Speech SDK lifecycle, microphone permission handling, audio interruption, and single-control UI.
- `e2e/azure-speech-integration.spec.ts` — Real Azure Speech STS token minting and TTS synthesis (Opt-in via `RUN_AZURE_INTEGRATION_TESTS=true` on staging).
- `scripts/diagnose-http-431.mjs` — Diagnostic script validating server tolerance to oversized cookie headers.
