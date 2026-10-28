import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { FlashcardService } from '../FlashcardService';
import { SpeakingVocabularyService } from '../SpeakingVocabularyService';
import { CoachVocabularyItem } from '../../components/speaking/speakingTypes';

describe('Speaking Flashcards Database Persistence Audit', () => {
  const mockUserId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. FlashcardService.addFlashcardsBatch correctly inserts flashcards into Supabase flashcards table', async () => {
    const upsertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'card-uuid-1',
            user_id: mockUserId,
            subject_id: 'subject-uuid-1',
            front: '面接\n【めんせつ】',
            back: "📌 O'zbekcha: Suhbat, intervyu\n🌐 English: Job interview",
            next_review_date: new Date().toISOString(),
            ease_factor: 2.5,
            interval: 0,
            repetitions: 0,
          },
        ],
        error: null,
      }),
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'flashcards') {
        return {
          upsert: upsertSpy,
        } as any;
      }
      return {} as any;
    });

    const result = await FlashcardService.addFlashcardsBatch(mockUserId, [
      {
        front: '面接\n【めんせつ】',
        back: "📌 O'zbekcha: Suhbat, intervyu\n🌐 English: Job interview",
        subjectId: 'subject-uuid-1',
      },
    ]);

    expect(supabase.from).toHaveBeenCalledWith('flashcards');
    expect(upsertSpy).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].front).toContain('面接');
    expect(result[0].back).toContain("O'zbekcha: Suhbat, intervyu");
  });

  it('2. SpeakingVocabularyService.saveVocabulary correctly inserts recommended word into speaking_vocabularies table', async () => {
    const vocabUpsertSpy = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'speaking_vocabularies') {
        return {
          upsert: vocabUpsertSpy,
        } as any;
      }
      return {} as any;
    });

    const item: CoachVocabularyItem = {
      word: '志望動機',
      reading: 'しぼうどうき',
      meaning: 'Ishga topshirish sababi / maqsadi (Reason for applying)',
      example: '志望動機を話してください',
    };

    const res = await SpeakingVocabularyService.saveVocabulary(
      mockUserId,
      item,
      'ja',
      'IT Job Interview',
    );

    expect(res.success).toBe(true);
    expect(res.record.word).toBe('志望動機');
    expect(res.record.meaning).toContain('Ishga topshirish sababi');
    expect(supabase.from).toHaveBeenCalledWith('speaking_vocabularies');
    expect(vocabUpsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUserId,
        word: '志望動機',
        language: 'ja',
      }),
      { onConflict: 'id', ignoreDuplicates: false },
    );
  });

  it('3. Anonymous/Guest user flashcards safely persist to local cache without crashing', async () => {
    const result = await FlashcardService.addFlashcardsBatch('local_user', [
      {
        front: '注文',
        back: "📌 O'zbekcha: Buyurtma",
      },
    ]);

    expect(result.length).toBe(1);
    expect(result[0].front).toBe('注文');

    const cached = FlashcardService.fetchFlashcards('local_user');
    expect((await cached).length).toBe(1);
  });
});
