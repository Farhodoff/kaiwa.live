import { describe, it, expect, vi, beforeEach } from 'vitest';
import webhookHandler from '../../../api/_telegram/webhook.js';
import notifyDailyHandler from '../../../api/_telegram/notify-daily.js';
import telegramService from '../TelegramService';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        if (table === 'telegram_link_codes') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(async () => {
              return {
                data: {
                  id: 'code_rec_123',
                  code: 'KAIZ01',
                  user_id: 'user_uuid_123',
                  used: false,
                  expires_at: new Date(Date.now() + 3600000).toISOString(),
                },
                error: null,
              };
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }

        if (table === 'telegram_users') {
          const userObj = {
            id: 'tg_user_1',
            user_id: 'user_uuid_123',
            telegram_id: 998877,
            chat_id: 998877,
            telegram_first_name: 'Farhod',
            notifications_enabled: true,
          };
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            maybeSingle: vi.fn().mockResolvedValue({ data: userObj, error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            then: (resolve: any) => resolve({ data: [userObj], error: null }),
          };
          return chain;
        }

        if (table === 'user_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(async () => {
              return {
                data: {
                  id: 'user_uuid_123',
                  tier: 'pro',
                  ai_credits: 250,
                  valid_until: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days left
                },
                error: null,
              };
            }),
          };
        }

        if (table === 'tasks') {
          const taskChain: any = {
            select: vi.fn(() => taskChain),
            eq: vi.fn(() => taskChain),
            neq: vi.fn(() => taskChain),
            order: vi.fn(() => taskChain),
            limit: vi.fn().mockImplementation(async () => {
              return {
                data: [
                  { id: 'task_1', title: 'JLPT N3 Kanji 20 cards', completed: false },
                  { id: 'task_2', title: 'Speaking Coach IELTS Part 2', completed: true },
                ],
                error: null,
              };
            }),
            then: (resolve: any) =>
              resolve({
                data: [
                  { id: 'task_1', title: 'JLPT N3 Kanji 20 cards', completed: false },
                  { id: 'task_2', title: 'Speaking Coach IELTS Part 2', completed: true },
                ],
                error: null,
              }),
          };
          return taskChain;
        }

        const defaultChain: any = {
          select: vi.fn(() => defaultChain),
          eq: vi.fn(() => defaultChain),
          neq: vi.fn(() => defaultChain),
          lte: vi.fn(() => defaultChain),
          gte: vi.fn(() => defaultChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: null, count: 0, error: null }),
        };
        return defaultChain;
      }),
    })),
  };
});

// Helper mock response
function createMockRes() {
  const res: any = {
    headers: {},
    statusCode: 200,
    setHeader: (k: string, v: string) => {
      res.headers[k] = v;
    },
    status: (s: number) => {
      res.statusCode = s;
      return res;
    },
    json: (d: any) => {
      res.data = d;
      return res;
    },
    end: () => res,
  };
  return res;
}

describe('Telegram Webhook & Notifications End-to-End Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
    process.env.SERVICE_ROLE = 'mock-service-role-key';
    process.env.VITE_SUPABASE_URL = 'https://qmuimxnknxwarvnkpnlo.supabase.co';
    // Mock global fetch for Telegram API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 101 } }),
    } as any);
  });

  it('1. handles OPTIONS preflight and non-POST methods correctly', async () => {
    const optionsRes = createMockRes();
    await webhookHandler({ method: 'OPTIONS', headers: {} } as any, optionsRes);
    expect(optionsRes.statusCode).toBe(204);

    const getRes = createMockRes();
    await webhookHandler({ method: 'GET', headers: {} } as any, getRes);
    expect(getRes.statusCode).toBe(405);
  });

  it('2. verifies account linking when user submits /start KAIZ01', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 1,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod', username: 'farhod_dev' },
          text: '/start KAIZ01',
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Tabriklaymiz, Farhod!'),
      }),
    );
  });

  it('3. responds with subscription status when user requests /subscription', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 2,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod' },
          text: '/subscription',
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('100% Bepul'),
      }),
    );
  });

  it('4. responds with active tasks when user requests /plan', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 3,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod' },
          text: '/plan',
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('JLPT N3 Kanji 20 cards'),
      }),
    );
  });

  it('5. handles interactive quiz callback queries', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        callback_query: {
          id: 'cb_query_1',
          data: 'quiz_0_0',
          message: {
            chat: { id: 998877 },
          },
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('answerCallbackQuery'),
      expect.any(Object),
    );
  });

  it('6. formats study reminders and subscription alerts via TelegramService', async () => {
    const reminderSpy = vi.spyOn(telegramService, 'sendNotification').mockResolvedValue(true);

    const okReminder = await telegramService.sendStudyReminder(
      '00000000-0000-0000-0000-000000000001',
      3,
      5,
    );
    expect(okReminder).toBe(true);
    expect(reminderSpy).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.stringContaining('5 kun'),
    );

    const okAlert = await telegramService.sendSubscriptionAlert(
      '00000000-0000-0000-0000-000000000001',
      'pro',
      2,
    );
    expect(okAlert).toBe(true);
    expect(reminderSpy).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.stringContaining('PRO'),
    );
  });

  it('7. dispatches daily notifications to linked users via notify-daily handler', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
    };

    await notifyDailyHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(res.data).toMatchObject({ success: true });
    // Verify that daily notification includes daily kanji and reply_markup
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Bugungi Kanji'),
      }),
    );
  });

  it('8. handles inline queries and returns rich quiz, kanji and vocab articles', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        inline_query: {
          id: 'iq_test_123',
          from: { id: 998877, first_name: 'Farhod' },
          query: 'kanji',
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('answerInlineQuery'),
      expect.objectContaining({
        body: expect.stringContaining('iq_test_123'),
      }),
    );
  });

  it('9. handles /kanji and /vocab commands with learning cards', async () => {
    const res1 = createMockRes();
    const req1 = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 10,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod' },
          text: '/kanji',
        },
      },
    };
    await webhookHandler(req1 as any, res1);
    expect(res1.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('KUN KANJISI'),
      }),
    );

    const res2 = createMockRes();
    const req2 = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 11,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod' },
          text: '/vocab',
        },
      },
    };
    await webhookHandler(req2 as any, res2);
    expect(res2.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining("KUN SO'ZI"),
      }),
    );
  });

  it('10. handles /streak command returning user streak and XP stats', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: {},
      body: {
        message: {
          message_id: 12,
          chat: { id: 998877 },
          from: { id: 998877, first_name: 'Farhod' },
          text: '/streak',
        },
      },
    };

    await webhookHandler(req as any, res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Kunlik Streak'),
      }),
    );
  });

  it('11. handles kanji_random and vocab_random callback queries', async () => {
    const res1 = createMockRes();
    const req1 = {
      method: 'POST',
      headers: {},
      body: {
        callback_query: {
          id: 'cb_kanji_rnd',
          data: 'kanji_random',
          message: { chat: { id: 998877 } },
        },
      },
    };
    await webhookHandler(req1 as any, res1);
    expect(res1.statusCode).toBe(200);

    const res2 = createMockRes();
    const req2 = {
      method: 'POST',
      headers: {},
      body: {
        callback_query: {
          id: 'cb_vocab_rnd',
          data: 'vocab_random',
          message: { chat: { id: 998877 } },
        },
      },
    };
    await webhookHandler(req2 as any, res2);
    expect(res2.statusCode).toBe(200);
  });

  it('12. sends daily quiz reminder via telegramService', async () => {
    const reminderSpy = vi.spyOn(telegramService, 'sendNotification').mockResolvedValue(true);
    const ok = await telegramService.sendDailyQuizReminder(
      '00000000-0000-0000-0000-000000000001',
      '日 (Quyosh)',
      '頑張る (Tirishmoq)',
      7,
    );
    expect(ok).toBe(true);
    expect(reminderSpy).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.stringContaining('7 kun'),
    );
  });
});
