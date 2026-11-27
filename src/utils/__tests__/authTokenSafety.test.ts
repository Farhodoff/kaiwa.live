import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_BEARER_TOKEN_BYTES,
  isOversizedJwt,
  pruneBloatedAuthMetadata,
  resetCleanedMetadataCacheForTests,
  resolveSafeApiBearerToken,
  shouldRetryWithAnonKey,
} from '../authTokenSafety';
import { callCoachAI, streamCoachTokens } from '../coachAI';
import { AzureSpeechService } from '../../services/AzureSpeechService';

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: authMock },
  supabaseAnonKey: 'anon-public-key',
  supabaseUrl: 'https://example.supabase.co',
}));

describe('authTokenSafety & HTTP 494 resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetCleanedMetadataCacheForTests();
    localStorage.clear();
    AzureSpeechService.clearTokenCache();
    authMock.getSession.mockReset();
    authMock.refreshSession.mockReset();
    authMock.updateUser.mockReset();
  });

  it('flags oversized JWTs and resolves safe anon bearer fallback', () => {
    const normalJwt = 'eyJ.normal.token';
    const hugeJwt = 'x'.repeat(MAX_BEARER_TOKEN_BYTES + 10);

    expect(isOversizedJwt(normalJwt)).toBe(false);
    expect(isOversizedJwt(hugeJwt)).toBe(true);

    expect(resolveSafeApiBearerToken(normalJwt, 'anon-public-key')).toEqual({
      token: normalJwt,
      isUserToken: true,
    });
    expect(resolveSafeApiBearerToken(hugeJwt, 'anon-public-key')).toEqual({
      token: 'anon-public-key',
      isUserToken: false,
    });
    expect(shouldRetryWithAnonKey(494)).toBe(true);
    expect(shouldRetryWithAnonKey(431)).toBe(true);
    expect(shouldRetryWithAnonKey(500)).toBe(false);
  });

  it('prunes bloated user_metadata keys while preserving localStorage data and refreshes session', async () => {
    authMock.updateUser.mockResolvedValueOnce({ error: null });
    authMock.refreshSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    const session = {
      access_token: 'short-token',
      user: {
        id: 'user-123',
        user_metadata: {
          full_name: 'Farhod',
          learning_signals: [{ id: 'sig-1', topic: 'kanji' }],
          lesson_progress: { 'ja-n5-u1-l1': { lessonId: 'ja-n5-u1-l1', isCompleted: true } },
          jlpt_mastery: { kanji_1: 'mastered' },
          jlpt_user_target: { targetLevel: 'N3', rebalanceHistory: [{ date: '2026-11-01' }] },
        },
      },
    } as any;

    const cleaned = await pruneBloatedAuthMetadata(session, { auth: authMock });
    expect(cleaned).toBe(true);
    expect(authMock.updateUser).toHaveBeenCalledWith({
      data: {
        learning_signals: null,
        lesson_progress: null,
        jlpt_mastery: null,
        jlpt_user_target: { targetLevel: 'N3' },
      },
    });
    expect(authMock.refreshSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('study_planner_learning_signals_user-123')).toContain('sig-1');
    expect(localStorage.getItem('study_planner_lesson_progress_user-123_ja-n5-u1-l1')).toContain(
      'ja-n5-u1-l1',
    );
    expect(localStorage.getItem('jlpt_mastery_status_v1')).toContain('kanji_1');
  });

  it('retries callCoachAI and streamCoachTokens with anonKey on HTTP 494', async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: { access_token: 'medium-user-jwt' } },
    });

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('REQUEST_HEADER_TOO_LARGE', { status: 494 }))
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { content: 'はい、大丈夫です。' } }] }),
      )
      .mockResolvedValueOnce(new Response('REQUEST_HEADER_TOO_LARGE', { status: 494 }))
      .mockResolvedValueOnce(Response.json({ reply: '元気ですか？' }));

    const coachReply = await callCoachAI('こんにちは');
    expect(coachReply).toBe('はい、大丈夫です。');

    const streamed = await streamCoachTokens([{ role: 'user', content: 'こんにちは' }], vi.fn());
    expect(streamed).toBe('元気ですか？');
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(new Headers(fetchSpy.mock.calls[1][1]?.headers).get('Authorization')).toBe(
      'Bearer anon-public-key',
    );
    expect(new Headers(fetchSpy.mock.calls[3][1]?.headers).get('Authorization')).toBe(
      'Bearer anon-public-key',
    );
  });

  it('falls back to guest speech token immediately when user JWT exceeds safe header size', async () => {
    const hugeJwt = 'z'.repeat(MAX_BEARER_TOKEN_BYTES + 100);
    authMock.getSession.mockResolvedValue({
      data: { session: { access_token: hugeJwt, user: { id: 'user-123' } } },
    });

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ token: 'speech-ok', region: 'swedencentral' }));

    const tokenRes = await AzureSpeechService.getSpeechToken(true);
    expect(tokenRes?.token).toBe('speech-ok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/speech-token?mode=guest');
    expect(new Headers(fetchSpy.mock.calls[0][1]?.headers).get('Authorization')).toBe(
      'Bearer anon-public-key',
    );
  });
});
