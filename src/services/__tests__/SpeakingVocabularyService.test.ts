import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeakingVocabularyService } from '../SpeakingVocabularyService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
  const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'vocab-1',
              user_id: 'test-user-uuid',
              word: '漠然',
              reading: 'ばくぜん',
              meaning: 'vague, ambiguous',
              example: '漠然とした不安',
              language: 'ja',
              mastery_level: 0,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      }),
    }),
  });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'speaking_vocabularies') {
          return {
            upsert: mockUpsert,
            select: mockSelect,
            delete: mockDelete,
          };
        }
        return {
          upsert: mockUpsert,
          select: mockSelect,
          delete: mockDelete,
        };
      }),
    },
  };
});

describe('SpeakingVocabularyService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save vocabulary item to speaking_vocabularies table and local cache', async () => {
    const item = {
      word: '漠然',
      reading: 'ばくぜん',
      meaning: 'vague, ambiguous',
      example: '漠然とした不安',
    };

    const res = await SpeakingVocabularyService.saveVocabulary(
      'test-user-uuid',
      item,
      'ja',
      'Business Japanese',
    );

    expect(res.success).toBe(true);
    expect(res.record.word).toBe('漠然');
    expect(res.record.reading).toBe('ばくぜん');
    expect(supabase.from).toHaveBeenCalledWith('speaking_vocabularies');
  });

  it('should fetch saved vocabulary items from DB merged with cache', async () => {
    const items = await SpeakingVocabularyService.fetchVocabularies('test-user-uuid', 'ja');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].word).toBe('漠然');
    expect(supabase.from).toHaveBeenCalledWith('speaking_vocabularies');
  });

  it('should delete vocabulary item from DB and cache', async () => {
    const success = await SpeakingVocabularyService.deleteVocabulary(
      'test-user-uuid',
      'vocab-1',
      'ja',
    );
    expect(success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('speaking_vocabularies');
  });
});
