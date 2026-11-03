import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error Serverless JavaScript entry point has no declaration file.
import handler from '../../../api/deepseek.js';
vi.mock('../../../api/_auth.js', () => ({
  verifyAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user', role: 'user' } }),
}));
vi.mock('../../../api/_rateLimit.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('../../../api/_quota.js', () => ({
  checkDailyQuota: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('../../../api/_cors.js', () => ({ setCorsHeaders: vi.fn() }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('AI gateway SSE forwarding', () => {
  it('sends a token to the client while the upstream response is still open', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'server-side-test-key');
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        source = c;
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
    );
    const res: any = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      json: vi.fn(),
      flushHeaders: vi.fn(),
    };
    res.status = vi.fn(() => res);
    const pending = handler(
      {
        method: 'POST',
        headers: {},
        body: {
          model: 'deepseek-chat',
          stream: true,
          messages: [{ role: 'user', content: 'こんにちは' }],
        },
      },
      res,
    );
    source.enqueue(
      new TextEncoder().encode('data: {"choices":[{"delta":{"content":"こんにちは"}}]}\n\n'),
    );
    await vi.waitFor(() => expect(res.write).toHaveBeenCalledOnce());
    expect(res.end).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream; charset=utf-8');
    source.close();
    await pending;
    expect(res.end).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });
});
