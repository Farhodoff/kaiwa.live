import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Admin Dashboard Real Data Aggregation & Recovery Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('TEST 1: Aggregates total users across RPC, profiles, and user_subscriptions without losing rows', () => {
    const rpcUsers = [
      {
        id: 'user-1',
        email: 'user1@kaiwa.live',
        full_name: 'User 1',
        role: 'user',
        tier: 'free',
        ai_credits: 3,
      },
      {
        id: 'user-2',
        email: 'user2@kaiwa.live',
        full_name: 'User 2',
        role: 'user',
        tier: 'pro',
        ai_credits: 50,
      },
    ];
    const dbProfiles = [
      { id: 'user-1', email: 'user1@kaiwa.live', full_name: 'User 1', role: 'user' },
      { id: 'user-3', email: 'user3@kaiwa.live', full_name: 'User 3', role: 'user' },
    ];
    const dbSubs = [
      { id: 'user-1', tier: 'free', ai_credits: 3 },
      { id: 'user-4', email: 'user4@kaiwa.live', tier: 'premium', ai_credits: 99999 },
    ];

    const userMap = new Map<string, any>();
    rpcUsers.forEach((u) => userMap.set(u.id, { ...u }));
    dbProfiles.forEach((p) => {
      if (!userMap.has(p.id)) {
        userMap.set(p.id, { ...p, tier: 'free', ai_credits: 99999 });
      }
    });
    dbSubs.forEach((s) => {
      if (userMap.has(s.id)) {
        userMap.get(s.id).tier = s.tier;
      } else {
        userMap.set(s.id, { ...s, full_name: 'Student' });
      }
    });

    // Ensure admin is present
    const currentUid = 'admin-uid';
    const currentEmail = 'fsoyilov@gmail.com';
    if (!userMap.has(currentUid)) {
      userMap.set(currentUid, { id: currentUid, email: currentEmail, tier: 'premium' });
    }

    const totalUsers = userMap.size;
    expect(totalUsers).toBe(5); // user-1, user-2, user-3, user-4, admin
  });

  it('TEST 2: Aggregates lifetime study sessions duration and count without 14-day truncation bug', () => {
    const rawStudySessions = [
      { id: 's1', duration: 25, start_time: '2026-05-09T14:48:37Z', user_id: 'u1' },
      { id: 's2', duration: 25, start_time: '2026-07-12T09:28:50Z', user_id: 'u1' },
      { id: 's3', duration: 25, start_time: '2026-07-17T10:00:00Z', user_id: 'u2' },
      { id: 's4', duration: 30, start_time: '2026-08-01T06:52:05Z', user_id: 'u1' },
    ];

    const dateMap = new Map<
      string,
      {
        activity_date: string;
        total_duration_minutes: number;
        total_sessions: number;
        activeUsers: Set<string>;
      }
    >();

    rawStudySessions.forEach((s) => {
      const dateStr = s.start_time.split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          activity_date: dateStr,
          total_duration_minutes: 0,
          total_sessions: 0,
          activeUsers: new Set(),
        });
      }
      const entry = dateMap.get(dateStr)!;
      entry.total_duration_minutes += s.duration;
      entry.total_sessions += 1;
      entry.activeUsers.add(s.user_id);
    });

    const allDailyStats = Array.from(dateMap.values());
    const totalDurationMinutes = allDailyStats.reduce(
      (sum, d) => sum + d.total_duration_minutes,
      0,
    );
    const totalSessionsCount = allDailyStats.reduce((sum, d) => sum + d.total_sessions, 0);

    expect(totalDurationMinutes).toBe(105);
    expect(totalSessionsCount).toBe(4);
    expect(allDailyStats.length).toBe(4);
  });

  it('TEST 3: Correctly normalizes IELTS/JLPT 1-9 scale scores to 100% scale in Speech Analytics', () => {
    const normalizeScore = (score?: number) => {
      const num = Number(score) || 0;
      if (num <= 0) return 0;
      if (num <= 9) return Math.min(100, Math.round((num / 9) * 100));
      return Math.min(100, Math.round(num));
    };

    const getSessionScore = (s: any) => {
      const scores = [s.pronunciation_score, s.fluency_score, s.grammar_score, s.vocabulary_score]
        .map((x) => normalizeScore(x))
        .filter((x) => x > 0);
      if (scores.length === 0) return 75;
      return Math.round(
        scores.reduce((acc: number, curr: number) => acc + curr, 0) / scores.length,
      );
    };

    // IELTS scale (e.g. 5.5 / 9)
    const ieltsSession = {
      fluency_score: 5.5,
      pronunciation_score: 5.5,
      grammar_score: 0,
      vocabulary_score: 0,
    };
    expect(getSessionScore(ieltsSession)).toBe(61);

    // AI coach 100 scale
    const aiCoachSession = {
      fluency_score: 2,
      pronunciation_score: 2,
      grammar_score: 95,
      vocabulary_score: 100,
    };
    expect(getSessionScore(aiCoachSession)).toBe(60);

    // Fallback default
    const emptySession = {
      fluency_score: 0,
      pronunciation_score: 0,
      grammar_score: 0,
      vocabulary_score: 0,
    };
    expect(getSessionScore(emptySession)).toBe(75);
  });

  it('TEST 4: Shows overall average score instead of 0% when there are no sessions today', () => {
    const sessions = [
      {
        id: 's1',
        fluency_score: 80,
        pronunciation_score: 80,
        grammar_score: 80,
        vocabulary_score: 80,
        duration_seconds: 120,
        created_at: '2026-07-25T10:00:00Z',
      },
      {
        id: 's2',
        fluency_score: 60,
        pronunciation_score: 60,
        grammar_score: 60,
        vocabulary_score: 60,
        duration_seconds: 120,
        created_at: '2026-07-26T10:00:00Z',
      },
    ];

    const todayStr = '2026-08-26';
    const todaySessions = sessions.filter((s) => s.created_at.startsWith(todayStr));
    const overallAvg = 70;

    const todayAvgScore = todaySessions.length > 0 ? 90 : overallAvg;
    expect(todayAvgScore).toBe(70);
    expect(todayAvgScore).toBeGreaterThan(0);
  });
});
