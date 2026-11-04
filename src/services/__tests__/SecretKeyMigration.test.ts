/**
 * Secret key migration regression tests (2026-08-26).
 *
 * Verifies the legacy service_role → Supabase Secret key (sb_secret_...)
 * migration:
 *  - no edge function reads SUPABASE_SERVICE_ROLE_KEY / SERVICE_ROLE_KEY
 *  - all 4 functions use the shared getSupabaseSecretKey helper
 *  - the helper fails fast and never logs the secret value
 *  - cron SQL templates read the bearer token from the private vault table,
 *    never a hardcoded/placeholder credential
 *  - no secret material reaches the client (src/, public/, build/)
 */
/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../../..');

function readProject(rel: string): string {
  return readFileSync(path.join(projectRoot, rel), 'utf-8');
}

describe('edge functions secret key migration', () => {
  const functions = [
    'telegram-bot',
    'send-telegram-notification',
    'daily-notifications',
    'update-xp',
  ];

  it.each(functions)('%s uses the shared getSupabaseSecretKey helper', (fn) => {
    const src = readProject(`supabase/functions/${fn}/index.ts`);
    expect(src).toContain("from '../_shared/secretKey.ts'");
    expect(src).toContain('getSupabaseSecretKey()');
  });

  it('no function reads the legacy SUPABASE_SERVICE_ROLE_KEY / SERVICE_ROLE_KEY env', () => {
    for (const fn of functions) {
      const src = readProject(`supabase/functions/${fn}/index.ts`);
      expect(src).not.toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
      expect(src).not.toContain('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
      expect(src).not.toContain("Deno.env.get('SERVICE_ROLE_KEY')");
      expect(src).not.toContain('Deno.env.get("SERVICE_ROLE_KEY")');
    }
  });

  it('shared helper fails fast and never logs the secret value', () => {
    const src = readProject('supabase/functions/_shared/secretKey.ts');
    expect(src).toContain('SUPABASE_SECRET_KEYS');
    expect(src).toContain('throw new Error');
    expect(src).not.toMatch(/console\.(log|info|warn|error)\(.*key/i);
  });

  it('admin/trusted-bearer gates are preserved in the gated functions', () => {
    const send = readProject('supabase/functions/send-telegram-notification/index.ts');
    const daily = readProject('supabase/functions/daily-notifications/index.ts');
    for (const src of [send, daily]) {
      // Trusted server-to-server bearer is compared directly against the
      // configured secret key (exact match, either polarity).
      expect(src).toMatch(/token (?:===|!==) SUPABASE_KEY/);
      expect(src).toContain('getUser(token)');
    }
    // update-xp keeps USER JWT auth via auth.getUser(authHeader)
    expect(readProject('supabase/functions/update-xp/index.ts')).toContain(
      'auth.getUser(authHeader',
    );
    // telegram-bot keeps webhook secret validation
    expect(readProject('supabase/functions/telegram-bot/index.ts')).toContain(
      'x-telegram-bot-api-secret-token',
    );
  });
});

describe('cron SQL templates', () => {
  const files = ['supabase/cron_job_setup.sql', 'supabase/cron_max_precision.sql'];

  it.each(files)('%s has no hardcoded credential placeholder', (rel) => {
    const src = readProject(rel);
    expect(src).not.toContain('YOUR_SUPABASE_SERVICE_ROLE_KEY');
    expect(src).not.toMatch(/Bearer sb_secret_/);
    expect(src).toContain('private.edge_auth_tokens');
  });

  it('vault schema is locked down from anon/authenticated', () => {
    const src = readProject('supabase/cron_job_setup.sql');
    expect(src).toContain('REVOKE ALL ON SCHEMA private FROM anon, authenticated');
    expect(src).toContain('REVOKE ALL ON TABLE private.edge_auth_tokens FROM anon, authenticated');
  });
});

describe('client-side secret exposure', () => {
  it('no sb_secret_ or SUPABASE_SECRET_KEYS in src/ or public/', () => {
    const offenders: string[] = [];
    const scan = (dir: string) => {
      const full = path.join(projectRoot, dir);
      if (!existsSync(full)) return;
      for (const entry of readdirSync(full, { withFileTypes: true })) {
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === '__tests__'
        )
          continue;
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) scan(rel);
        else if (/\.(ts|tsx|js|jsx|html)$/.test(entry.name)) {
          const content = readFileSync(path.join(projectRoot, rel), 'utf-8');
          if (/sb_secret_|SUPABASE_SECRET_KEYS/.test(content)) offenders.push(rel);
        }
      }
    };
    scan('src');
    scan('public');
    expect(offenders).toEqual([]);
  });

  it('build bundle contains no sb_secret_ values', () => {
    const buildDir = path.join(projectRoot, 'build/assets');
    if (!existsSync(buildDir)) return; // build optional in CI contexts
    for (const f of readdirSync(buildDir)) {
      if (!f.endsWith('.js')) continue;
      const content = readFileSync(path.join(buildDir, f), 'utf-8');
      expect(content).not.toContain('sb_secret_');
    }
  });
});
