import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeakingConversationHistoryService } from '../SpeakingConversationHistoryService';
import { HistoryService } from '../HistoryService';
import { isUuid } from '../../utils/uuid';

describe('SpeakingConversationHistoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does NOT save empty sessions when user never spoke', () => {
    const saved = SpeakingConversationHistoryService.saveSession({
      durationSeconds: 15,
      scenarioTitle: 'Restoran',
      messages: [{ role: 'assistant', content: 'Irasshaimase!' }],
      newWords: [],
    });

    expect(saved).toBeNull();
    expect(SpeakingConversationHistoryService.getSessions()).toHaveLength(0);
  });

  it('saves completed session with client UUID, extracts errors & new words, and triggers server-first sync', async () => {
    const mockSaveServer = vi.spyOn(HistoryService, 'saveSpeakingSession').mockResolvedValue({
      id: 'mock-id',
      language: 'ja',
      persona: 'Restoran',
      createdAt: new Date().toISOString(),
      durationSeconds: 45,
      fluencyScore: 8.5,
      pronunciationScore: 8.0,
      transcript: '[]',
      feedback: '{}',
    });

    const session = SpeakingConversationHistoryService.saveSession({
      durationSeconds: 45,
      scenarioTitle: 'Restoran',
      messages: [
        { role: 'assistant', content: 'Nan-mei-sama desu ka?' },
        {
          role: 'user',
          content: 'Futari ga arimasu',
          corrected: 'Futari desu',
          explanation_uz: "Odam soni aytilganda 'desu' ishlatiladi.",
        },
      ],
      newWords: [{ word: '何名様', reading: 'なんめいさま', translation_uz: 'Necha kishi' }],
    });

    expect(session).not.toBeNull();
    expect(session?.id).toBeDefined();
    expect(isUuid(session!.id)).toBe(true);
    expect(session?.errors).toHaveLength(1);
    expect(session?.errors[0].corrected).toBe('Futari desu');
    expect(session?.newWords).toHaveLength(1);

    expect(mockSaveServer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: session?.id,
        persona: 'Restoran',
        durationSeconds: 45,
      }),
    );
  });

  it('fetches remote sessions and merges them into local storage without duplicates', async () => {
    const remoteId = 'e7b99335-5157-4ea2-8ac9-8f2e2fc0d999';
    vi.spyOn(HistoryService, 'getSpeakingHistory').mockResolvedValue([
      {
        id: remoteId,
        language: 'ja',
        persona: 'Sayohat',
        durationSeconds: 60,
        fluencyScore: 9.0,
        pronunciationScore: 8.5,
        transcript: JSON.stringify([
          { role: 'assistant', content: 'Doko e ikimasu ka?' },
          { role: 'user', content: 'Tokyo e ikimasu' },
        ]),
        feedback: JSON.stringify({
          errors: [],
          newWords: [{ word: '東京', reading: 'とうきょう', translation_uz: 'Tokio' }],
        }),
        createdAt: '2026-10-31T12:00:00Z',
      },
    ]);

    const sessions = await SpeakingConversationHistoryService.fetchSessionsFromServer();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const found = sessions.find((s) => s.id === remoteId);
    expect(found).toBeDefined();
    expect(found?.scenarioTitle).toBe('Sayohat');
    expect(found?.messages).toHaveLength(2);
    expect(found?.newWords[0].word).toBe('東京');
  });
});
