import { beforeEach, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { auth }, supabaseAnonKey: 'public-fixture' }));

const session = (access_token: string) => ({
  data: { session: { access_token, user: { id: 'fixture-user' } } },
  error: null,
});
const issued = () => Response.json({ token: 'speech-fixture', region: 'test' });
const rejected = () => new Response(null, { status: 401 });

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  auth.getSession.mockResolvedValue(session('original-fixture'));
  auth.refreshSession.mockResolvedValue(session('refreshed-fixture'));
});

async function setup() {
  const { AzureSpeechService: service } = await import('../AzureSpeechService');
  return { service, request: vi.spyOn(globalThis, 'fetch') };
}

it('uses the session bearer for an authenticated request', async () => {
  const { service, request } = await setup();
  request.mockResolvedValueOnce(issued());
  expect(await service.getSpeechToken()).toBeTruthy();
  expect(service.getAuthState()).toBe('authenticated');
  expect(request.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer original-fixture' });
});

it('shares a single refresh and retries with the new user bearer', async () => {
  const { service, request } = await setup();
  request.mockResolvedValueOnce(rejected()).mockResolvedValueOnce(issued());
  expect(await Promise.all([service.getSpeechToken(), service.getSpeechToken(true)])).toEqual([
    expect.objectContaining({ region: 'test' }),
    expect.objectContaining({ region: 'test' }),
  ]);
  expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(2);
  expect(request.mock.calls[1][1]?.headers).toEqual({ Authorization: 'Bearer refreshed-fixture' });
});

it.each(['refresh failure', 'repeated 401'])(
  'stops after %s without guest downgrade',
  async (failure) => {
    const { service, request } = await setup();
    request.mockResolvedValueOnce(rejected()).mockResolvedValueOnce(rejected());
    if (failure === 'refresh failure') {
      auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('fixture'),
      });
    }
    expect(await service.getSpeechToken()).toBeNull();
    expect(service.getAuthState()).toBe('session_expired');
    expect(service.getLastConnectionError()).toMatch(/qayta kiring/);
    auth.getSession.mockResolvedValue({ data: { session: null } });
    service.clearTokenCache();
    expect(await service.getSpeechToken()).toBeNull();
    expect(request).toHaveBeenCalledTimes(failure === 'refresh failure' ? 1 : 2);
  },
);

it('uses the explicit guest route when no session exists', async () => {
  const { service, request } = await setup();
  auth.getSession.mockResolvedValue({ data: { session: null } });
  request.mockResolvedValueOnce(issued());
  expect(await service.getSpeechToken()).toBeTruthy();
  expect(service.getAuthState()).toBe('anonymous');
  expect(request.mock.calls[0][0]).toBe('/api/speech-token?mode=guest');
  expect(auth.refreshSession).not.toHaveBeenCalled();
});

it.each(['timeout', '503'])('reports %s as a service error', async (failure) => {
  const { service, request } = await setup();
  if (failure === 'timeout')
    request.mockRejectedValueOnce(new DOMException('fixture', 'TimeoutError'));
  else request.mockResolvedValueOnce(new Response(null, { status: 503 }));
  expect(await service.getSpeechToken()).toBeNull();
  expect(service.getAuthState()).toBe('error');
  expect(auth.refreshSession).not.toHaveBeenCalled();
});
