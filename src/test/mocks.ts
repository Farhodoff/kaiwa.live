import { vi } from 'vitest';

const createMockChain = (
  resolvedValue: { data: unknown; error: unknown } = { data: [], error: null },
) => {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => Promise.resolve(resolvedValue).then(resolve);
      }
      if (typeof target[prop as string] === 'function') {
        return target[prop as string];
      }
      return () => new Proxy(target, handler);
    },
  };

  const mockObj = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return new Proxy(mockObj, handler);
};

export const supabaseMock = {
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user', user_metadata: { full_name: 'Test User' } } },
      error: null,
    }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => createMockChain()),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue(null),
  })),
  removeChannel: vi.fn(),
};

vi.mock('../lib/supabase', () => ({
  supabase: supabaseMock,
}));
