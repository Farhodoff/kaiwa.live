# KAIWA.LIVE — SECURITY REMEDIATION PLAN

**Date:** November 8, 2026  
**Auditor:** Principal Application Security Engineer & DevSecOps Specialist  
**Target:** Production Hardening & Pre-Release Verification

---

## Remediation Hierarchy

Issues are prioritized based on risk, exploitability, and blast radius:

- **P0 — Critical:** Active remote code execution, unauthenticated data exfiltration, or confirmed leaked production credentials. _(Current Count: 0)_
- **P1 — High:** Broken object/function authorization, privilege escalation, or database RLS bypass.
- **P2 — Medium:** Insecure CORS allowlists, header overflow denial of service, or missing secondary validation.
- **P3 — Low / Defense-in-Depth:** Information leakage in errors, transitive build dependencies, or security header enhancements.

---

## Action Items

### [P0] Critical Vulnerabilities

_No active P0 vulnerabilities verified._

- **GitGuardian Alert Investigation:** The alert on PR #152 (commit `e3afb5483`) was audited and verified as a static analysis false positive on `target.password` (DOM WHATWG URL property check). No production or test secret was compromised.

---

### [P1] High-Risk Items

#### REM-01: Transition `is_admin()` and `is_reviewer()` to Role-Based Authorization

- **Root Cause:** Legacy PostgreSQL functions granted admin access based on string comparison against `jwt ->> 'email'`.
- **Impact:** Any user able to claim or spoof the hardcoded email in dev/staging bypassed database RLS.
- **Remediation:**
  1. Author migration `20261108010000_role_only_admin_authorization.sql`.
  2. Query `public.profiles` for `role IN ('admin', 'superadmin')` or check `auth.role() = 'service_role'`.
  3. Restrict `EXECUTE` privileges to `authenticated, service_role`.
- **Regression Test:** `src/utils/__tests__/security_hardening_deep.test.ts`, `src/utils/__tests__/admin_role_assignment.test.ts`.
- **Status:** **REMEDIATED (Code Complete; Pending Production SQL Migration Application).**
- **Deployment Dependency:** Run SQL migration on live Supabase database after preflight role verification.

#### REM-02: Prevent Author Self-Approval in Curriculum Review Queue

- **Root Cause:** Reviewers could author and approve their own curriculum changes without peer review.
- **Impact:** Risk of unverified Japanese learning content reaching students without dual-custody verification.
- **Remediation:** Added `CONSTRAINT no_self_approval CHECK (reviewed_by IS NULL OR reviewed_by <> created_by)` in `supabase/migrations/20261108000000_curriculum_quality_queue.sql`.
- **Regression Test:** `src/services/__tests__/ContentQualityAuditService.test.ts`.
- **Status:** **REMEDIATED.**

#### REM-03: Eliminate Client-Controlled `user_metadata` for Server Role Checks

- **Root Cause:** Client code could pass `user_metadata: { role: 'admin' }` which is user-editable via standard Supabase Auth SDK.
- **Impact:** Attempted privilege escalation on endpoints accepting client-provided JWT metadata.
- **Remediation:** Serverless endpoints check database roles directly using `hasDatabaseRole(user.id, ['superadmin'])` via service_role client.
- **Regression Test:** `src/utils/__tests__/adminDeleteUser.test.ts`.
- **Status:** **REMEDIATED.**

---

### [P2] Medium-Risk Items

#### REM-04: Restrict CORS Origin Allowlist and Eliminate `*.vercel.app` Wildcard

- **Root Cause:** Origin regex allowed any subdomain on `*.vercel.app`.
- **Impact:** Malicious third-party apps hosted on Vercel could send authenticated cross-origin requests.
- **Remediation:** Replaced with exact allowed origins (`https://kaiwa.live`, `https://www.kaiwa.live`, `https://web.telegram.org`, `capacitor://localhost`, project preview pattern `^https:\/\/kaiwa(-[a-zA-Z0-9_-]+)?\.vercel\.app$`, and explicit `ALLOWED_ORIGINS` env).
- **Regression Test:** `src/utils/__tests__/corsSecurity.test.ts`, `src/utils/__tests__/api_security_hardening.test.ts`.
- **Status:** **REMEDIATED.**

#### REM-05: Prevent HTTP 431 Header Bloat on Speech Token Endpoints

- **Root Cause:** Third-party tracking and session cookies accumulating in browser storage exceeded 8KB request header threshold.
- **Impact:** Inability for authenticated learners to initiate speaking coach sessions.
- **Remediation:** Configured `credentials: 'omit'` on Bearer token requests and implemented client cookie pruning.
- **Regression Test:** `scripts/diagnose-http-431.mjs`, `coachCookieTransport.test.ts`.
- **Status:** **REMEDIATED.**

#### REM-06: Supply Private WebRTC TURN Relays for NAT Traversal

- **Root Cause:** Only public STUN servers are configured by default.
- **Impact:** P2P connection failures for users behind symmetric NAT or enterprise firewalls.
- **Remediation:** Integrated environment configuration in `src/config/webrtc.ts` reading `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL`.
- **Status:** **CODE READY — CONFIGURATION REQUIRED IN PRODUCTION ENV.**

---

### [P3] Low-Risk / Defense-in-Depth Items

#### REM-07: Disable Production Source Maps

- **Root Cause:** Potential exposure of internal source paths and comments in production builds.
- **Remediation:** Ensured `sourcemap: false` is active in `vite.config.ts`. Verified no `.map` artifacts in `build/`.
- **Status:** **REMEDIATED.**

#### REM-08: Transitive Dependency Audit

- **Root Cause:** `deepmerge` vulnerability in build-time dependency `workbox-build` / `vite-plugin-pwa`.
- **Remediation:** Verified zero runtime exposure. Scheduled regular non-breaking package updates.
- **Status:** **MONITORED.**

---

## Deployment & Verification Workflow

```
┌─────────────────────────────────┐
│ 1. Code Review & Test Pass      │ 288 test files passing locally (2,514 tests)
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 2. Preflight Production DB      │ Check public.profiles: ensure admin accounts
│    Account Verification         │ have role='admin' or 'superadmin'
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 3. Apply Supabase SQL Migration │ 20261108010000_role_only_admin_authorization.sql
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 4. Vercel Env Var Verification  │ Verify ALLOWED_ORIGINS, AZURE_SPEECH_KEY,
│                                 │ SUPABASE_SERVICE_ROLE_KEY are set
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 5. Merge PR #152 to main        │ Resolve GitGuardian notice as false positive;
│                                 │ CI triggers automated Vercel deployment
└─────────────────────────────────┘
```
