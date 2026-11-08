# KAIWA.LIVE — PRODUCTION SECURITY CHECKLIST

**Date:** November 8, 2026  
**Auditor:** Principal Application Security Engineer & DevSecOps Specialist  
**Target:** Production Launch & Deployment Verification

---

## 1. Supabase PostgreSQL & RLS Gate

- [ ] **Preflight Admin Profile Inspection:**
  - Execute preflight SQL query on live Supabase database:
    ```sql
    SELECT id, email, role FROM public.profiles WHERE role IN ('admin', 'superadmin');
    ```
  - Verify that the designated platform superadmin (`fsoyilov@gmail.com`) and appointed admins possess valid records with `role = 'superadmin'` or `role = 'admin'`.

- [ ] **Apply Role-Based Authorization Migration:**
  - Apply `supabase/migrations/20261108010000_role_only_admin_authorization.sql`.
  - Confirm `public.is_admin()`, `public.is_reviewer()`, and `public.is_superadmin()` no longer reference hardcoded email addresses.
  - Confirm `EXECUTE` privileges are revoked from `PUBLIC` and granted strictly to `authenticated, service_role`.

- [ ] **Apply Curriculum Quality Queue Migration:**
  - Apply `supabase/migrations/20261108000000_curriculum_quality_queue.sql`.
  - Verify `no_self_approval` constraint is enforced on `public.curriculum_revisions`.

- [ ] **Verify Search Path Protection:**
  - Confirm all `SECURITY DEFINER` routines have explicit `SET search_path = public, auth` to prevent search-path hijacking attacks.

- [ ] **Verify PostgREST Direct Access:**
  - Verify anonymous clients cannot query `public.profiles` or `public.curriculum_revisions` without passing RLS policies.

---

## 2. Environment Variables & Secret Separation

- [ ] **Vercel Production Environment:**
  - `VITE_SUPABASE_URL`: Configured to production Supabase project (`https://qmuimxnknxwarvnkpnlo.supabase.co`).
  - `VITE_SUPABASE_ANON_KEY`: Configured to production publishable key.
  - `SUPABASE_SERVICE_ROLE_KEY`: Configured strictly in Serverless Function Environment (never prefixed with `VITE_`).
  - `ALLOWED_ORIGINS`: Set to `https://kaiwa.live,https://www.kaiwa.live,https://web.telegram.org`.
  - `AZURE_SPEECH_KEY`: Set to production Azure Speech resource subscription key (never exposed to client).
  - `AZURE_SPEECH_REGION`: Set to active Azure Cognitive Services region (e.g. `eastus`).

- [ ] **WebRTC TURN Relays (Enterprise NAT Traversal):**
  - `VITE_TURN_URLS`: Configured to production TURN endpoints.
  - `VITE_TURN_USERNAME`: Production TURN account username.
  - `VITE_TURN_CREDENTIAL`: Production TURN credential token.

- [ ] **Preview & Development Isolation:**
  - Confirm `SUPABASE_SERVICE_ROLE_KEY` is not exposed in Vercel Preview environments without deployment protection enabled.
  - Confirm client bundles do not include development environment files (`.env.local`).

---

## 3. Vercel Hosting & Network Configuration

- [ ] **Exact Origin CORS Evaluation:**
  - Verify requests from untrusted origins (`https://attacker.com`, `https://untrusted.vercel.app`) are rejected and do not receive `Access-Control-Allow-Origin`.
- [ ] **HTTP 431 Protection:**
  - Confirm `credentials: 'omit'` is enforced on all API endpoints utilizing Bearer token authorization.
- [ ] **Security Headers:**
  - Verify `X-Content-Type-Options: nosniff`.
  - Verify `X-Frame-Options: SAMEORIGIN` (or `frame-ancestors 'self' https://web.telegram.org` for Telegram Mini App).
  - Verify `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] **Source Map Exclusion:**
  - Confirm production assets in `build/assets/` do not contain source map files (`.map`).

---

## 4. GitHub Actions & CI/CD Pipeline Gates

- [ ] **PR #152 GitGuardian Finding Clearance:**
  - Review finding in GitGuardian dashboard: confirm the alert on commit `e3afb5483` was an AST scanner false positive on `target.password`.
  - Mark as "False Positive" or perform a clean squash-merge of `fix/coach-browser-translation` to eliminate the scanner trigger from the main branch history.
  - Do NOT merge PR #152 until explicit approval is granted by the repository owner.
- [ ] **Branch Protection Rules on `main`:**
  - Require status checks to pass before merging:
    - `CI / Quality Gate/E2E`
    - `CI / Quality Gate/Playwright`
    - `CI / Quality Gate/Typecheck`
    - `CI / Quality Gate/Vitest`
    - `CI / Quality Gate/Lint`
  - Require signed commits and linear history (Squash Merge).

---

## 5. Staging Verification Steps Prior to Public Traffic

- [ ] Run automated E2E test suite against staging URL:
  ```bash
  CI=true npx playwright test e2e/speaking-coach-mocked.spec.ts
  ```
- [ ] Optional: Run live Azure Speech synthesis test with designated staging credentials:
  ```bash
  RUN_AZURE_INTEGRATION_TESTS=true \
  AZURE_INTEGRATION_BASE_URL=https://staging.kaiwa.live \
  AZURE_INTEGRATION_SUPABASE_JWT=<staging_test_token> \
  npx playwright test e2e/azure-speech-integration.spec.ts
  ```
- [ ] Verify user session expiry flow: when JWT expires, UI displays a clear "Sessiya muddati tugadi" message without crashing or silently downgrading to guest mode.
- [ ] Verify admin dashboard accessibility for `fsoyilov@gmail.com` and confirm ordinary students are redirected to `/dashboard`.
