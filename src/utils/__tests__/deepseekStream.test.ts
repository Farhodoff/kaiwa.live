import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamDeepSeekTokens } from '../deepseek';
vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'public-test-key',
}));
vi.mock('../../lib/consoleFilter', () => ({ purgeOversizedCookies: vi.fn() }));
afterEach(() => vi.restoreAllMocks());
const encode = (content: string) =>
  new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
describe('DeepSeek live network stream', () => {
  it('emits the first token before the response closes and preserves split UTF-8/SSE chunks', async () => {
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        source = c;
      },
    });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
      );
    const onToken = vi.fn();
    let finished = false;
    const result = streamDeepSeekTokens([{ role: 'user', content: 'こんにちは' }], onToken).then(
      (value) => {
        finished = true;
        return value;
      },
    );
    const first = encode('こんにちは。');
    // Split inside a multibyte Japanese character as well as inside an SSE frame.
    source.enqueue(first.slice(0, first.length - 8));
    source.enqueue(first.slice(first.length - 8));
    await vi.waitFor(() => expect(onToken).toHaveBeenCalledWith('こんにちは。'));
    expect(finished).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/deepseek',
      expect.objectContaining({ method: 'POST' }),
    );
    source.enqueue(encode('元気ですか？'));
    source.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
    source.close();
    expect(await result).toBe('こんにちは。元気ですか？');
  });
  it('accepts a legacy wrapped SSE response', async () => {
    const raw = new TextDecoder().decode(encode('こんにちは。'));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ raw }));
    expect(await streamDeepSeekTokens([], vi.fn())).toBe('こんにちは。');
  });
  it('rejects empty or erroneous responses instead of leaving a silent live session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ choices: [] }));
    await expect(streamDeepSeekTokens([], vi.fn())).rejects.toThrow('AI_EMPTY_RESPONSE');
  });
});
