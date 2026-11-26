import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({
  range: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: db.createClient }));
async function request() {
  // @ts-expect-error Serverless handlers are JavaScript modules.
  const handler = (await import('../../../api/seo/ratings.js')).default;
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  await handler({ method: 'GET', headers: {} }, res);
  return res.json.mock.calls[0][0];
}
describe('Ratings are based only on real submissions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SERVICE_ROLE', 'test-server-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    db.createClient.mockReturnValue(db);
    db.from.mockReturnValue(db);
    db.select.mockReturnValue(db);
    db.order.mockReturnValue(db);
  });
  afterEach(() => vi.unstubAllEnvs());
  it('does not manufacture a rating for an empty table', async () => {
    db.range.mockResolvedValue({ data: [], error: null });
    expect(await request()).toMatchObject({ source: 'empty', aggregateRating: null });
  });
  it('averages only valid actual ratings', async () => {
    db.range.mockResolvedValue({
      data: [{ rating: 5 }, { rating: 1 }, { rating: 4 }, { rating: 'bad' }, { rating: null }],
      error: null,
    });
    expect(await request()).toMatchObject({
      source: 'live',
      aggregateRating: { ratingValue: '3.3', ratingCount: 3 },
    });
    expect(db.from).toHaveBeenCalledWith('app_reviews');
    expect(db.select).toHaveBeenCalledWith('rating');
  });
  it('counts all pages instead of adding a baseline or stopping at 1000 reviews', async () => {
    db.range
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, () => ({ rating: 5 })),
        error: null,
      })
      .mockResolvedValueOnce({ data: [{ rating: 1 }], error: null });
    expect((await request()).aggregateRating.ratingCount).toBe(1001);
    expect(db.range).toHaveBeenLastCalledWith(1000, 1999);
  });
  it('does not publish a fallback rating when the query fails', async () => {
    db.range.mockResolvedValue({ data: null, error: { message: 'unavailable' } });
    expect((await request()).aggregateRating).toBeNull();
  });
  it('does not query when server configuration is unavailable', async () => {
    vi.stubEnv('SERVICE_ROLE', '');
    expect((await request()).aggregateRating).toBeNull();
    expect(db.createClient).not.toHaveBeenCalled();
  });
});
