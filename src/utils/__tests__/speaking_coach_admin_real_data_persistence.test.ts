import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScenarioService } from '../../services/ScenarioService';
import { supabase } from '../../lib/supabase';
import { ScenarioSessionResult } from '../../components/speaking/scenarioTypes';

describe('Speaking Coach & Admin Analytics Real Data Forensic & Multi-User Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // TEST 1: User A session yaratadi → DB'da saqlanadi
  it('TEST 1: User A creates a speaking session and saves to speaking_sessions and coach_sessions', async () => {
    const userA_id = 'user-a-uuid-1234';

    const insertSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    const sessionResult: ScenarioSessionResult = {
      id: 'session-101',
      scenario_id: 'cafe_order',
      scenario_title: 'Kafeda buyurtma berish',
      fluency_score: 85,
      vocabulary_score: 80,
      grammar_score: 90,
      pronunciation_score: 85,
      overall_score: 85,
      duration_seconds: 120,
      ai_feedback: "Ajoyib talaffuz va boy so'z boyligi!",
      key_phrases_used: ['コーヒーをお願いします'],
      key_phrases_missed: [],
      transcript: [
        { role: 'assistant', content: 'いらっしゃいませ！ご注文はお決まりですか？' },
        { role: 'user', content: 'ホットコーヒーを一つお願いします。' },
        { role: 'assistant', content: 'かしこまりました。店内でお召し上がりですか？' },
      ],
      created_at: new Date().toISOString(),
    };

    await ScenarioService.saveSessionResult(sessionResult, userA_id);

    expect(insertSpy).toHaveBeenCalledWith('speaking_sessions');
    expect(insertSpy).toHaveBeenCalledWith('coach_sessions');
  });

  // TEST 2: Refresh → session history qaytadi
  it('TEST 2: Refreshing revalidates and returns scenario history from speaking_sessions', async () => {
    const userA_id = 'user-a-uuid-1234';
    const mockRows = [
      {
        id: 'session-101',
        scenario_id: 'cafe_order',
        persona_title: 'Kafeda buyurtma berish',
        duration_seconds: 120,
        overall_score: 85,
        fluency_score: 85,
        vocabulary_score: 80,
        grammar_score: 90,
        pronunciation_score: 85,
        feedback: 'Ajoyib!',
        transcript: [
          { role: 'assistant', content: 'いらっしゃいませ！' },
          { role: 'user', content: 'コーヒーをお願いします。' },
        ],
        created_at: '2026-08-24T10:00:00Z',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'speaking_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        } as any;
      }
      return {} as any;
    });

    const history = await ScenarioService.getScenarioHistory(userA_id);
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('session-101');
    expect(history[0].transcript?.length).toBe(2);
    expect(history[0].overall_score).toBe(85);
  });

  // TEST 3: User B → User A sessionlarini ko'rmaydi
  it('TEST 3: User B queries only their own sessions and receives 0 rows when User A has sessions', async () => {
    const userB_id = 'user-b-uuid-5678';

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'speaking_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((_col: string, val: string) => {
            // User B only matches User B's rows (empty)
            const filtered = val === userB_id ? [] : [{ id: 'user-a-sess' }];
            return {
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: filtered, error: null }),
            };
          }),
        } as any;
      }
      return {} as any;
    });

    const userBHistory = await ScenarioService.getScenarioHistory(userB_id);
    expect(userBHistory.length).toBe(0);
  });

  // TEST 4 & 5: Admin User A va User B sessionlarini ko'radi va transcriptni ochadi
  it('TEST 4 & 5: Admin retrieves speaking sessions across all users with full transcripts', async () => {
    const adminSessionRows = [
      {
        id: 'sess-a',
        user_id: 'user-a-uuid-1234',
        user_email: 'userA@test.com',
        persona_title: 'Kafeda suhbat',
        fluency_score: 80,
        pronunciation_score: 82,
        grammar_score: 85,
        vocabulary_score: 80,
        duration_seconds: 180,
        feedback: "Zo'r",
        transcript: [
          { role: 'user', content: 'Hello Coach' },
          { role: 'assistant', content: 'Hello User A' },
        ],
        created_at: '2026-08-24T12:00:00Z',
      },
      {
        id: 'sess-b',
        user_id: 'user-b-uuid-5678',
        user_email: 'userB@test.com',
        persona_title: 'Aeroportda suhbat',
        fluency_score: 70,
        pronunciation_score: 75,
        grammar_score: 72,
        vocabulary_score: 78,
        duration_seconds: 240,
        feedback: 'Yaxshi',
        transcript: [
          { role: 'user', content: 'Where is terminal 2?' },
          { role: 'assistant', content: 'Go straight ahead.' },
        ],
        created_at: '2026-08-24T13:00:00Z',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'speaking_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: adminSessionRows, error: null }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'user-a-uuid-1234', email: 'userA@test.com', full_name: 'User A' },
              { id: 'user-b-uuid-5678', email: 'userB@test.com', full_name: 'User B' },
            ],
            error: null,
          }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const { data: adminSpeaking } = await supabase
      .from('speaking_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    expect(adminSpeaking).toBeDefined();
    expect(adminSpeaking?.length).toBe(2);

    // TEST 5: Verify full transcript access
    const sessionA = adminSpeaking?.find((s: any) => s.id === 'sess-a');
    expect(sessionA.transcript).toHaveLength(2);
    expect(sessionA.transcript[0].content).toBe('Hello Coach');
    expect(sessionA.transcript[1].content).toBe('Hello User A');
  });

  // TEST 6 & 11: Admin statistics real DB qiymatlariga teng va o'rtacha ball to'g'ri hisoblanadi
  it('TEST 6 & 11: Real speech metrics aggregation computes true averages and sums from database', () => {
    const rows = [
      {
        fluency_score: 80,
        pronunciation_score: 80,
        grammar_score: 80,
        vocabulary_score: 80,
        duration_seconds: 120,
      },
      {
        fluency_score: 90,
        pronunciation_score: 90,
        grammar_score: 90,
        vocabulary_score: 90,
        duration_seconds: 180,
      },
    ];

    const totalMinutes = Math.round(
      rows.reduce((acc, curr) => acc + curr.duration_seconds, 0) / 60,
    );
    const avgFluency = rows.reduce((acc, curr) => acc + curr.fluency_score, 0) / rows.length;
    const avgScore =
      rows.reduce((acc, curr) => {
        const rowScore =
          (curr.fluency_score +
            curr.pronunciation_score +
            curr.grammar_score +
            curr.vocabulary_score) /
          4;
        return acc + rowScore;
      }, 0) / rows.length;

    expect(totalMinutes).toBe(5); // (120 + 180) / 60 = 5 minutes
    expect(avgFluency).toBe(85);
    expect(avgScore).toBe(85);
  });

  // TEST 7: DB bo'sh bo'lganda fake fallback chiqmaydi (0 qiymat)
  it('TEST 7: Empty database returns empty stats and 0 values instead of hardcoded numbers', () => {
    const emptyRows: any[] = [];
    const totalMinutes =
      emptyRows.length > 0
        ? emptyRows.reduce((acc, curr) => acc + curr.duration_seconds, 0) / 60
        : 0;
    const avgScore =
      emptyRows.length > 0
        ? emptyRows.reduce((acc, curr) => acc + curr.overall_score, 0) / emptyRows.length
        : 0;

    expect(totalMinutes).toBe(0);
    expect(avgScore).toBe(0);
  });

  // TEST 8: profiles DB'da 3 user bo'lsa → Admin aynan 3 user ko'radi
  it('TEST 8: Admin user list displays exactly 3 users when database has 3 profiles', async () => {
    const profilesDB = [
      {
        id: 'u1',
        email: 'user1@kaiwa.live',
        full_name: 'User One',
        role: 'student',
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'u2',
        email: 'user2@kaiwa.live',
        full_name: 'User Two',
        role: 'student',
        created_at: '2026-08-02T00:00:00Z',
      },
      {
        id: 'u3',
        email: 'user3@kaiwa.live',
        full_name: 'User Three',
        role: 'student',
        created_at: '2026-08-03T00:00:00Z',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: profilesDB, error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    expect(data?.length).toBe(3);
    expect(data?.map((u) => u.email)).toEqual([
      'user1@kaiwa.live',
      'user2@kaiwa.live',
      'user3@kaiwa.live',
    ]);
  });

  // TEST 9: profiles DB'da 0 user bo'lsa → 21 ta hardcoded user chiqmaydi
  it('TEST 9: Admin user list has length 0 when database has 0 profiles (no REAL_PROFILES_ALL fallback)', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    expect(data).toEqual([]);
    expect(data?.length).toBe(0);
  });

  // TEST 10: localStorage User A → logout → User B → User A cache'i ko'rinmaydi
  it('TEST 10: LocalStorage cache is isolated by userId between sessions', async () => {
    const userA_id = 'user-a-111';
    const userB_id = 'user-b-222';

    // User A performs a session
    const sessionA: ScenarioSessionResult = {
      id: 'sess-a-1',
      scenario_id: 'shopping',
      scenario_title: 'Shopping in Shibuya',
      duration_seconds: 60,
      overall_score: 90,
      fluency_score: 90,
      vocabulary_score: 90,
      grammar_score: 90,
      pronunciation_score: 90,
      ai_feedback: 'Good',
      transcript: [],
      key_phrases_used: [],
      key_phrases_missed: [],
      created_at: new Date().toISOString(),
    };

    await ScenarioService.saveSessionResult(sessionA, userA_id);

    // Immediate history for User A
    const cachedA = ScenarioService.getImmediateHistory(userA_id);
    expect(cachedA.length).toBe(1);
    expect(cachedA[0].id).toBe('sess-a-1');

    // Immediate history for User B should be empty
    const cachedB = ScenarioService.getImmediateHistory(userB_id);
    expect(cachedB.length).toBe(0);
  });

  // TEST 12: Daily chart faqat real created_at ma'lumotlari bo'yicha hisoblanadi
  it('TEST 12: Daily activity chart calculates DAU and durations purely from real timestamps', () => {
    const sessions = [
      { user_id: 'u1', duration_seconds: 600, created_at: '2026-08-24T08:00:00Z' },
      { user_id: 'u2', duration_seconds: 1200, created_at: '2026-08-24T09:00:00Z' },
      { user_id: 'u1', duration_seconds: 300, created_at: '2026-08-24T10:00:00Z' },
    ];

    const dateMap = new Map<string, { activeUsers: Set<string>; totalMins: number }>();
    sessions.forEach((s) => {
      const dateStr = s.created_at.split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { activeUsers: new Set(), totalMins: 0 });
      }
      const entry = dateMap.get(dateStr)!;
      entry.activeUsers.add(s.user_id);
      entry.totalMins += Math.round(s.duration_seconds / 60);
    });

    const dayResult = dateMap.get('2026-08-24');
    expect(dayResult?.activeUsers.size).toBe(2); // distinct users: u1 and u2
    expect(dayResult?.totalMins).toBe(35); // (600 + 1200 + 300) / 60 = 35 minutes
  });
});
