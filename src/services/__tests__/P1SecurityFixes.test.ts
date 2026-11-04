/**
 * P1 security regression tests (second-round audit, 2026-08-25).
 *
 * Covers the 20260825000000_p1_security_fixes.sql migration and the
 * accompanying client/server code fixes:
 *  - leftover open policies dropped (user_notifications, profiles, messages)
 *  - subscription tier no longer owner-writable
 *  - storage upload policy enforces per-user folders + audio type
 *  - API keys never persisted to profiles / auth metadata
 *  - mermaid runs in strict mode; print window escapes HTML
 */
/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { escapeHtml } from '../../utils/escapeHtml';

const projectRoot = path.resolve(__dirname, '../../..');

function readProject(rel: string): string {
  return readFileSync(path.join(projectRoot, rel), 'utf-8');
}

describe('P1 migration (20260825000000_p1_security_fixes.sql)', () => {
  const migration = readProject('supabase/migrations/20260825000000_p1_security_fixes.sql');

  it('drops the leftover user_notifications open INSERT policy (R2-01)', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Admins can insert notifications"');
  });

  it('closes anon read on profiles and purges stored google_api_key values (R2-02)', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Users can view all profiles"');
    expect(migration).toContain('Authenticated read basic profiles');
    expect(migration).toContain('SET google_api_key = NULL');
  });

  it('guards profiles INSERT against role=self-admin (R2-09)', () => {
    expect(migration).toMatch(
      /Users can insert own profile[\s\S]*?WITH CHECK \(auth\.uid\(\) = id AND role = 'user'\)/,
    );
  });

  it('prevents owners from changing their own tier (R2-04)', () => {
    expect(migration).toMatch(
      /Owner or admin update subscription[\s\S]*?tier = \(SELECT s\.tier FROM public\.user_subscriptions s WHERE s\.id = auth\.uid\(\)\)/,
    );
  });

  it('revokes increment_xp from anon/authenticated (R2-10)', () => {
    expect(migration).toContain('REVOKE EXECUTE ON FUNCTION public.increment_xp');
  });

  it('pins search_path on cleanup_expired_telegram_codes', () => {
    expect(migration).toMatch(/cleanup_expired_telegram_codes\(\)[\s\S]*?SET search_path = public/);
  });

  it('restricts admin_daily_stats to admins (R2-17)', () => {
    expect(migration).toMatch(/admin_daily_stats[\s\S]*?WHERE is_admin\(\)/);
  });

  it('restricts the messages read to authenticated users (R2-16)', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can view messages"');
    expect(migration).toContain('Authenticated can view messages');
  });

  it('storage upload enforces per-user folder + audio type (R2-06)', () => {
    expect(migration).toMatch(
      /Users can upload speaking audio[\s\S]*?\(storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text[\s\S]*?LIKE '%\.webm'/,
    );
  });

  it('storage admin policies use is_admin() instead of the dead JWT role claim', () => {
    expect(migration).toMatch(/Admin Insert Access[\s\S]*?bucket_id = 'exams' AND is_admin\(\)/);
    expect(migration).toMatch(/Admin Update Access[\s\S]*?bucket_id = 'exams' AND is_admin\(\)/);
    expect(migration).toMatch(/Admin Delete Access[\s\S]*?bucket_id = 'exams' AND is_admin\(\)/);
  });

  it('admin_preset_albums writes are admin-only (R2-07)', () => {
    expect(migration).toContain('Admins manage preset albums');
  });
});

describe('client-side P1 fixes', () => {
  it('third-party diagram engines are fully decommissioned to prevent HTML injection and bloat', () => {
    const pkg = readProject('package.json');
    expect(pkg).not.toContain('"mermaid"');
    expect(pkg).not.toContain('"tldraw"');
  });

  it('StudyPlannerContext never writes API keys to profiles or auth metadata', () => {
    const src = readProject('src/context/StudyPlannerContext.tsx');
    expect(src).not.toMatch(/from\('profiles'\)[\s\S]{0,200}google_api_key/);
    expect(src).not.toMatch(/updateUser\([\s\S]*?googleApiKey/);
    expect(src).not.toMatch(/updateUser\([\s\S]*?deepseekApiKey/);
    expect(src).not.toMatch(/updateUser\([\s\S]*?coachApiKey/);
  });

  it('useSubscription no longer performs client-side tier upgrades', () => {
    const src = readProject('src/hooks/useSubscription.ts');
    expect(src).not.toMatch(/from\('user_subscriptions'\)[\s\S]{0,300}(upsert|tier:\s*newTier)/);
    expect(src).not.toContain('upgradeTier');
  });

  it('SessionReportModal escapes all print-window interpolations', () => {
    const src = readProject('src/components/speaking/SessionReportModal.tsx');
    expect(src).toContain("import { escapeHtml } from '../../utils/escapeHtml'");
    for (const field of ['report.overall_feedback', 'g.original', 'g.corrected', 'v.suggested']) {
      expect(src).toContain(`escapeHtml(${field})`);
    }
  });
});

describe('escapeHtml utility', () => {
  it('escapes all HTML-special characters', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(escapeHtml("a'b&c<d>e")).toBe('a&#39;b&amp;c&lt;d&gt;e');
  });

  it('handles null/undefined/numbers safely', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('daily-notifications edge function auth gate', () => {
  it('requires an Authorization header before any send loop', () => {
    const src = readProject('supabase/functions/daily-notifications/index.ts');
    const authGatePos = src.indexOf('Missing Authorization header');
    const sendLoopPos = src.indexOf('telegram_users');
    expect(authGatePos).toBeGreaterThan(-1);
    expect(sendLoopPos).toBeGreaterThan(authGatePos);
  });
});

describe('api/deepseek.js rate limit hardening', () => {
  it('applies IP rate limiting to guest/anonymous paths', () => {
    const src = readProject('api/deepseek.js');
    expect(src).toMatch(/const ipRate = await checkRateLimit\(req, null\)/);
  });

  it('clamps client-controlled max_tokens', () => {
    const src = readProject('api/deepseek.js');
    expect(src).toMatch(/payload\.max_tokens = Math\.min\(/);
  });
});
