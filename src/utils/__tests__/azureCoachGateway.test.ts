import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error Serverless JavaScript endpoint has no declaration file.
import handler from '../../../api/coach.js';
vi.mock('../../../api/_auth.js', () => ({
  verifyAuth: vi.fn().mockResolvedValue({
    user: { id: 'learner', role: 'authenticated', app_metadata: { role: 'user' } },
  }),
  getBearerToken: () => 'session',
  SUPABASE_ANON_KEY: 'public',
}));
vi.mock('../../../api/_rateLimit.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('../../../api/_quota.js', () => ({
  MAX_REQUEST_SIZE_BYTES: 25 * 1024,
  checkDailyQuota: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('../../../api/_cors.js', () => ({ setCorsHeaders: vi.fn() }));
function response() {
  const res: any = {
    setHeader: vi.fn(),
    json: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    flushHeaders: vi.fn(),
  };
  res.status = vi.fn(() => res);
  return res;
}
const req = {
  method: 'POST',
  body: { model: 'deepseek-chat', messages: [{ role: 'user', content: '今日は本を読みました。' }] },
};
beforeEach(() => {
  vi.stubEnv('AZURE_OPENAI_ENDPOINT', 'https://kaiwa-chat-live.openai.azure.com');
  vi.stubEnv('AZURE_OPENAI_API_KEY', 'azure-test-secret');
  vi.stubEnv('AZURE_OPENAI_DEPLOYMENT', 'kaiwa-coach');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('Azure-only coach gateway', () => {
  it('rejects an oversized request before calling Azure with a distinct status', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const res = response();
    await handler(
      {
        ...req,
        body: { messages: [{ role: 'user', content: '日'.repeat(9000) }] },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'REQUEST_TOO_LARGE' } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the configured Azure deployment and never accepts a client-selected provider', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json({ choices: [{ message: { content: 'いいですね！何の本ですか？' } }] }),
      );
    const res = response();
    await handler(req, res);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      'https://kaiwa-chat-live.openai.azure.com/openai/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ 'api-key': 'azure-test-secret' }),
      }),
    );
    const payload = JSON.parse(fetch.mock.calls[0][1]!.body as string);
    expect(payload.model).toBe('kaiwa-coach');
    expect(res.setHeader).toHaveBeenCalledWith('X-AI-Provider', 'azure-openai');
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('azure-test-secret');
  });
  it('does not fall back to DeepSeek when Azure is unavailable', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ error: 'denied' }, { status: 401 }));
    const res = response();
    await handler(req, res);
    expect(fetch).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(503);
  });
  it('returns a clear configuration error without sending any provider request', async () => {
    vi.stubEnv('AZURE_OPENAI_API_KEY', '');
    const fetch = vi.spyOn(globalThis, 'fetch');
    const res = response();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('forwards streaming tokens before Azure closes the answer', async () => {
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        source = c;
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
    );
    const res = response();
    const pending = handler({ ...req, body: { ...req.body, stream: true } }, res);
    source.enqueue(
      new TextEncoder().encode('data: {"choices":[{"delta":{"content":"はい。"}}]}\n\n'),
    );
    await vi.waitFor(() => expect(res.write).toHaveBeenCalledOnce());
    expect(res.end).not.toHaveBeenCalled();
    source.close();
    await pending;
    expect(res.end).toHaveBeenCalledOnce();
  });
});
