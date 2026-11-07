import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let envDir: string;

// Execute the server-only plugin natively, without transforming its API imports
// into browser modules or inheriting the developer's real credentials.
function configure(mode = 'development', overrides: Record<string, string> = {}) {
  const env: Record<string, string> = {};
  for (const name of ['PATH', 'HOME', 'TMPDIR', 'SystemRoot']) {
    if (process.env[name]) env[name] = process.env[name];
  }
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import { telegramApiPlugin } from './server/vitePlugin.js';
        globalThis.fetch = () => { throw new Error('Network access is forbidden in this test'); };
        let middlewareCount = 0;
        telegramApiPlugin().configureServer({
          config: { mode: process.argv[1], envDir: process.argv[2] },
          middlewares: { use() { middlewareCount++; } },
        });
        console.log(JSON.stringify({
          middlewareCount,
          url: process.env.VITE_SUPABASE_URL,
          speechKey: process.env.AZURE_SPEECH_KEY,
        }));
      `,
      mode,
      envDir,
    ],
    {
      cwd: process.cwd(),
      env: { ...env, ...overrides },
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const lines = output.trim().split('\n');
  return {
    result: JSON.parse(lines[lines.length - 1]) as {
      middlewareCount: number;
      url?: string;
      speechKey?: string;
    },
    output,
  };
}

beforeEach(() => {
  envDir = mkdtempSync(join(tmpdir(), 'kaiwa-vite-env-'));
});

afterEach(() => {
  rmSync(envDir, { recursive: true, force: true });
});

describe('Telegram Vite plugin environment loading', () => {
  it('parses quoted local values and lets .env.local override .env', () => {
    writeFileSync(
      join(envDir, '.env'),
      'VITE_SUPABASE_URL=https://base.example.com\nSERVICE_ROLE=base-key\n',
    );
    writeFileSync(
      join(envDir, '.env.local'),
      'VITE_SUPABASE_URL="https://local.example.com"\nSERVICE_ROLE=\'local-test-key\'\nAZURE_SPEECH_KEY="speech-test-key"\n',
    );

    const { result, output } = configure();

    expect(result.url).toBe('https://local.example.com');
    expect(result.speechKey).toBe('speech-test-key');
    expect(result.middlewareCount).toBe(1);
    expect(output).not.toContain('local-test-key');
  });

  it('uses the resolved Vite mode and env directory for mode-specific overrides', () => {
    writeFileSync(join(envDir, '.env'), 'SERVICE_ROLE=base-key\n');
    writeFileSync(join(envDir, '.env.local'), 'VITE_SUPABASE_URL=https://local.example.com\n');
    writeFileSync(join(envDir, '.env.staging'), 'VITE_SUPABASE_URL=https://staging.example.com\n');
    writeFileSync(join(envDir, '.env.staging.local'), 'AZURE_SPEECH_KEY="staging-speech-key"\n');

    const { result } = configure('staging');

    expect(result.url).toBe('https://staging.example.com');
    expect(result.speechKey).toBe('staging-speech-key');
    expect(result.middlewareCount).toBe(1);
  });

  it('gives existing process environment values priority over env files', () => {
    writeFileSync(
      join(envDir, '.env.local'),
      'VITE_SUPABASE_URL=https://local.example.com\nSERVICE_ROLE=file-key\n',
    );

    const { result } = configure('development', {
      VITE_SUPABASE_URL: 'https://process.example.com',
      SERVICE_ROLE: 'process-test-key',
    });

    expect(result.url).toBe('https://process.example.com');
    expect(result.middlewareCount).toBe(1);
  });

  it('keeps Coach and Speech routes registered without the Telegram service key', () => {
    writeFileSync(
      join(envDir, '.env'),
      'VITE_SUPABASE_URL="https://local.example.com"\nAZURE_SPEECH_KEY=guest-speech-key\n',
    );

    const { result } = configure();
    expect(result.middlewareCount).toBe(1);
    expect(result.speechKey).toBe('guest-speech-key');
  });
});
