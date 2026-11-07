import { afterEach, expect, it, vi } from 'vitest';
// @ts-expect-error - Edge serverless module has no TypeScript declaration.
import handler from '../../../api/speech-token.js';

afterEach(() => vi.unstubAllEnvs());

it.each([
  ['https://kaiwa.live', true],
  ['https://kaiwa-preview.vercel.app', true],
  ['https://unrelated.vercel.app', false],
  ['https://kaiwa.live.example.invalid', false],
  ['https://kaiwa-preview.vercel.app.example.invalid', false],
  ['http://localhost:5173', false],
  ['', false],
])('applies the exact origin allowlist to %s', async (origin, allowed) => {
  vi.stubEnv('ALLOWED_ORIGINS', 'https://kaiwa-preview.vercel.app');
  vi.stubEnv('VERCEL_ENV', 'preview');
  const headers = origin ? { Origin: origin } : undefined;
  const url = 'https://kaiwa.live/api/speech-token';
  const preflight = await handler(new Request(url, { method: 'OPTIONS', headers }));
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get('vary')).toBe('Origin');
  expect(preflight.headers.get('access-control-allow-origin')).toBe(allowed ? origin : null);
  expect(preflight.headers.get('access-control-allow-headers')).toBe(
    allowed ? 'Content-Type, Authorization, apikey' : null,
  );
  expect((await handler(new Request(url, { headers }))).status).toBe(401);
});
