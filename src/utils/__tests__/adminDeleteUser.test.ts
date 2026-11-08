import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error Serverless JavaScript handler has no declaration.
import handler from '../../../api/admin/delete-user.js';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  getUser: vi.fn(),
  deleteUser: vi.fn(),
  profile: vi.fn(),
}));
vi.mock('../../../api/_auth.js', () => ({
  verifyAuth: mocks.verify,
  hasDatabaseRole: vi.fn(async (_userId, roles) => {
    const verified = await mocks.verify();
    return Boolean(
      verified?.user?.app_metadata?.role && roles.includes(verified.user.app_metadata.role),
    );
  }),
}));
vi.mock('../../../api/_cors.js', () => ({ setCorsHeaders: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { admin: { getUserById: mocks.getUser, deleteUser: mocks.deleteUser } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
  }),
}));

afterEach(() => vi.unstubAllEnvs());

const actorId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const targetId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

async function request(userId = targetId) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };
  await handler({ method: 'POST', body: { userId } }, res);
  return res.status.mock.calls[0]?.[0];
}

describe('Admin user deletion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only');
    mocks.verify.mockResolvedValue({ user: { id: actorId, app_metadata: { role: 'superadmin' } } });
    mocks.getUser.mockResolvedValue({ data: { user: { id: targetId } } });
    mocks.profile.mockResolvedValue({ data: { role: 'student' } });
    mocks.deleteUser.mockResolvedValue({ error: null });
  });

  it('rejects untrusted client-editable roles', async () => {
    mocks.verify.mockResolvedValue({
      user: { id: actorId, user_metadata: { role: 'superadmin' } },
    });
    expect(await request()).toBe(403);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it('rejects self-deletion and protected admin accounts', async () => {
    expect(await request(actorId)).toBe(403);
    mocks.profile.mockResolvedValue({ data: { role: 'admin' } });
    expect(await request()).toBe(403);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the verified target account', async () => {
    expect(await request()).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith(targetId);
  });

  it('reports a database failure', async () => {
    mocks.deleteUser.mockResolvedValue({ error: { message: 'foreign key' } });
    expect(await request()).toBe(502);
  });
});
