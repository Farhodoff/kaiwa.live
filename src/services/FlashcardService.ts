import { supabase } from '../lib/supabase';
import { Flashcard } from '../types';
import { generateUUID, isUuid, toDeterministicUUID } from '../utils/uuid';
import { PRESET_DECKS } from '../data/presetDecks';
import { GlobalFlashcardOverrideService } from './GlobalFlashcardOverrideService';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const CACHE_KEY_PREFIX = 'study_planner_flashcards_cache_';

export const getLocalFlashcardCache = (userId: string): Flashcard[] => {
  const cards = safeLocalStorage.getJSON<Flashcard[] | null>(CACHE_KEY_PREFIX + userId, null);
  if (cards && Array.isArray(cards)) return cards;
  if (userId === 'guest' || userId === 'local_user') {
    const altKey = userId === 'guest' ? 'local_user' : 'guest';
    const altCards = safeLocalStorage.getJSON<Flashcard[] | null>(CACHE_KEY_PREFIX + altKey, null);
    if (altCards && Array.isArray(altCards)) return altCards;
  }
  return [];
};

export const setLocalFlashcardCache = (userId: string, cards: Flashcard[]): void => {
  safeLocalStorage.setJSON(CACHE_KEY_PREFIX + userId, cards);
  if (userId === 'guest' || userId === 'local_user') {
    safeLocalStorage.setJSON(CACHE_KEY_PREFIX + 'guest', cards);
    safeLocalStorage.setJSON(CACHE_KEY_PREFIX + 'local_user', cards);
  }
};

const KNOWN_JLPT_FIXES: Record<string, string> = {
  表記: "ひょうき (hyōki)\n\n📌 Ma'nosi: Yozuv, Imlo, Belgilash (Notation / Writing)\n\n💬 Misol: 「正しい表記で書く」 (To'g'ri imlo bilan yozmoq)",
  '表記 [N4]':
    "ひょうき (hyōki)\n\n📌 Ma'nosi: Yozuv, Imlo, Belgilash (Notation / Writing)\n\n💬 Misol: 「正しい表記で書く」 (To'g'ri imlo bilan yozmoq)",
  スミス:
    "スミス (Sumisu)\n\n📌 Ma'nosi: Smit / Smith (Xorijiy ism / familiya)\n\n💬 Misol: 「スミスさんは学生です」 (Smit bobi talabadir)",
  'スミス [N4]':
    "スミス (Sumisu)\n\n📌 Ma'nosi: Smit / Smith (Xorijiy ism / familiya)\n\n💬 Misol: 「スミスさんは学生です」 (Smit bobi talabadir)",
  案内: "あんない (annai)\n\n📌 Ma'nosi: Yo'l ko'rsatish, E'lon qilish (Guidance / Information)\n\n💬 Misol: 「街を案内する」 (Shaharni ko'rsatib aylantirmoq)",
  '案内 [N4]':
    "あんない (annai)\n\n📌 Ma'nosi: Yo'l ko'rsatish, E'lon qilish (Guidance / Information)\n\n💬 Misol: 「街を案内する」 (Shaharni ko'rsatib aylantirmoq)",
  意見: "いけん (iken)\n\n📌 Ma'nosi: Fikr, Mulohaza (Opinion / View)\n\n💬 Misol: 「自分の意見を言う」 (O'z fikrini aytmoq)",
  '意見 [N4]':
    "いけん (iken)\n\n📌 Ma'nosi: Fikr, Mulohaza (Opinion / View)\n\n💬 Misol: 「自分の意見を言う」 (O'z fikrini aytmoq)",
  意味: "いみ (imi)\n\n📌 Ma'nosi: Ma'no, Mazmun (Meaning / Sense)\n\n💬 Misol: 「言葉の意味を調べる」 (So'z ma'nosini qidirmoq)",
  '意味 [N4]':
    "いみ (imi)\n\n📌 Ma'nosi: Ma'no, Mazmun (Meaning / Sense)\n\n💬 Misol: 「言葉の意味を調べる」 (So'z ma'nosini qidirmoq)",
  注意: "ちゅうい (chuui)\n\n📌 Ma'nosi: E'tibor berish, Ogohlantirish (Attention / Caution)\n\n💬 Misol: 「車に注意する」 (Mashinaga e'tiborli bo'lmoq)",
  '注意 [N4]':
    "ちゅうい (chuui)\n\n📌 Ma'nosi: E'tibor berish, Ogohlantirish (Attention / Caution)\n\n💬 Misol: 「車に注意する」 (Mashinaga e'tiborli bo'lmoq)",
};

export function cleanJapaneseOcrText(text: string): string {
  if (!text) return text;
  return text
    .replace(/^\d+\s*/, '') // Remove OCR leading numbers "6 "
    .replace(/\([a-d]/gi, '（　t）') // Replace OCR markers "(a" with clean brackets
    .replace(/([一-龯ぁ-んァ-ヶ])\s+([一-龯ぁ-んァ-ヶ])/g, '$1$2') // Fix OCR spaces inside words
    .replace(/([一-龯ぁ-んァ-ヶ])\s+([一-龯ぁ-んァ-ヶ])/g, '$1$2')
    .replace(/^[a-d]\s*/gi, '') // Fix leading choice letters "b"
    .replace(/\)\s*$/g, '')
    .trim();
}

export function sanitizeCardContent(card: Flashcard): { card: Flashcard; wasModified: boolean } {
  if (!card.back && !card.front) return { card, wasModified: false };
  let front = card.front || '';
  let back = card.back || '';
  let wasModified = false;

  // 0. Check global overrides from Admin / Super Admin
  const overridden = GlobalFlashcardOverrideService.applyOverrideToCard({ front, back } as any);
  if (overridden.front !== front || overridden.back !== back) {
    front = overridden.front;
    back = overridden.back;
    wasModified = true;
  }

  const frontClean = front.trim();

  // 1. Fix known single word cards
  if (KNOWN_JLPT_FIXES[frontClean]) {
    back = KNOWN_JLPT_FIXES[frontClean];
    wasModified = true;
  }

  // 2. Fix OCR fill-in-the-blank questions e.g. "6 た くさん 買 い物 したので、 お金 が (aなよくし ました"
  if (front.includes('買い物') || front.includes('お金') || front.match(/^\d+\s*た/)) {
    front = 'たくさん買い物したので、お金が（　　）ました。';
    back =
      "なくなりました (Nakunarimashita)\n\n📌 Ma'nosi: Yo'qolmoq, Tugamoq (To run out of money)\n\n💬 To'liq gap: 「たくさん買い物したので、お金がなくなりました。」\n(Juda ko'p xarid qildim, shuning uchun pulim tugab qoldi.)";
    wasModified = true;
  } else {
    // Clean OCR noise from front
    const cleanedFront = cleanJapaneseOcrText(front);
    if (cleanedFront !== front) {
      front = cleanedFront;
      wasModified = true;
    }

    // Clean OCR noise from back
    if (
      back.includes('darsligidan olingan') ||
      back.includes('Vocabulary Item') ||
      back.includes('Example: ""')
    ) {
      back = back
        .replace(/JLPT N\d darsligidan olingan lug'at iborasi\.?/gi, '')
        .replace(/JLPT N\d Vocabulary Item/gi, '')
        .replace(/Example: ""/gi, '')
        .replace(/Misol: ""/gi, '')
        .trim();

      if (!back) {
        back = "JLPT yaponcha lug'at so'zi / iyeroglifi";
      }
      wasModified = true;
    } else {
      const cleanedBack = cleanJapaneseOcrText(back);
      if (cleanedBack !== back) {
        back = cleanedBack;
        wasModified = true;
      }
    }
  }

  if (wasModified) {
    return { card: { ...card, front, back }, wasModified: true };
  }
  return { card, wasModified: false };
}

export const FlashcardService = {
  async fetchFlashcards(userId: string): Promise<Flashcard[]> {
    if (!userId || userId === 'guest' || userId === 'local_user') {
      return getLocalFlashcardCache(userId || 'guest');
    }

    const dbUserId = isUuid(userId) ? userId : toDeterministicUUID(userId);
    const localCached = getLocalFlashcardCache(userId);
    let dbCards: Flashcard[] = [];
    let isNetworkError = false;

    try {
      let { data, error } = await supabase.from('flashcards').select('*').eq('user_id', dbUserId);

      if (error) {
        isNetworkError = true;
      }

      if (!error && data) {
        const rawCards = data as unknown as import('../types/supabase-types').DatabaseFlashcard[];
        const activeCards = rawCards.filter((c) => !c.deleted_at);

        dbCards = activeCards.map((c) => ({
          id: c.id,
          subjectId: c.subject_id,
          front: c.front,
          back: c.back,
          nextReviewDate: c.next_review_date,
          easeFactor: c.ease_factor,
          interval: c.interval,
          repetitions: c.repetitions,
          deletedAt: c.deleted_at || undefined,
        })) as Flashcard[];
      }
    } catch (error: any) {
      console.warn('[fetchFlashcards] Network/Offline Exception:', error?.message || error);
      isNetworkError = true;
    }

    // If network error occurred or empty DB returned, try caches
    if (isNetworkError || dbCards.length === 0) {
      // Prefer localStorage cache (instant, synchronous)
      if (localCached.length > 0) {
        return localCached;
      }
      // If both caches are empty and it's a network error, return empty
      if (isNetworkError) return [];
    }

    const dbCardIds = new Set(dbCards.map((c) => c.id));
    const missingLocalCards = localCached.filter((c) => !dbCardIds.has(c.id) && !c.deletedAt);

    // Sync missing local cards to DB if authenticated and online (safe chunks)
    if (dbCards.length > 0 && missingLocalCards.length > 0 && !isNetworkError) {
      this.addFlashcardsBatch(userId, missingLocalCards.slice(0, 50)).catch((err) => {
        console.warn('[fetchFlashcards] Background sync missing cards warning:', err);
      });
    }

    const rawMerged = [...dbCards, ...missingLocalCards];

    // Sanitize any corrupted placeholder cards in memory
    const sanitizedMerged: Flashcard[] = rawMerged.map((card) => {
      const { card: cleanCard } = sanitizeCardContent(card);
      return cleanCard;
    });

    if (sanitizedMerged.length === 0 && !isNetworkError) {
      try {
        const autoSeededCards: Partial<Flashcard>[] = [];
        const jlptPresetDecks = PRESET_DECKS.filter((d) => d.language === 'ja');
        for (const deck of jlptPresetDecks.slice(0, 1)) {
          const cards = await deck.loadCards();
          if (cards && cards.length > 0) {
            cards.slice(0, 50).forEach((c) => {
              autoSeededCards.push({
                subjectId: 'a0000000-0000-0000-0000-000000000001',
                front: c.front,
                back: `${c.back} ${c.phonetic ? `(${c.phonetic})` : ''} ${c.example ? `\nExample: "${c.example}"` : ''}`.trim(),
                nextReviewDate: new Date().toISOString(),
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
              });
            });
          }
        }

        if (autoSeededCards.length > 0) {
          const savedSeeded = await this.addFlashcardsBatch(userId, autoSeededCards);
          if (savedSeeded.length > 0) {
            setLocalFlashcardCache(userId, savedSeeded);
            return savedSeeded;
          }
        }
      } catch (e) {
        console.warn('[fetchFlashcards] Auto-seeding error:', e);
      }
    }

    setLocalFlashcardCache(userId, sanitizedMerged);
    return sanitizedMerged;
  },

  async addFlashcard(userId: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> {
    const tempId = cardData.id || `temp-${Date.now()}`;
    if (!userId || userId === 'guest' || userId === 'local_user') {
      const finalCard: Flashcard = {
        id: tempId,
        subjectId: cardData.subjectId || '',
        front: cardData.front || '',
        back: cardData.back || '',
        nextReviewDate: cardData.nextReviewDate || new Date().toISOString(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        deletedAt: undefined,
      };
      const currentCache = getLocalFlashcardCache(userId || 'local_user');
      setLocalFlashcardCache(userId || 'local_user', [
        ...currentCache.filter((c) => c.id !== tempId),
        finalCard,
      ]);
      return finalCard;
    }

    const dbUserId = isUuid(userId) ? userId : toDeterministicUUID(userId);
    const dbCard: Record<string, any> = {
      user_id: dbUserId,
      subject_id:
        cardData.subjectId && cardData.subjectId.trim().length > 0 ? cardData.subjectId : null,
      front: cardData.front,
      back: cardData.back,
      next_review_date: new Date().toISOString(),
      ease_factor: 2.5,
      interval: 0,
      repetitions: 0,
    };
    // Only include id if it's an existing DB card
    if (cardData.id) {
      dbCard.id = cardData.id;
    }

    try {
      const upsertOp = supabase.from('flashcards').upsert(dbCard);
      let { data, error } =
        typeof (upsertOp as any)?.select === 'function'
          ? await (upsertOp as any).select().single()
          : await upsertOp;

      if (error) {
        // If foreign key error or UUID syntax error on subject_id, retry with subject_id = null
        if (
          error.code === '23503' ||
          error.code === '22P02' ||
          error.message?.includes('subject_id')
        ) {
          const retryOp = supabase.from('flashcards').upsert({ ...dbCard, subject_id: null });
          const retry =
            typeof (retryOp as any)?.select === 'function'
              ? await (retryOp as any).select().single()
              : await retryOp;

          if (!retry.error && retry.data) {
            data = retry.data;
            error = null;
          }
        }
      }

      const returnedCard = (data || dbCard) as import('../types/supabase-types').DatabaseFlashcard;
      const finalCard: Flashcard = {
        id: returnedCard.id || tempId,
        subjectId: returnedCard.subject_id || dbCard.subject_id || '',
        front: returnedCard.front || dbCard.front || '',
        back: returnedCard.back || dbCard.back || '',
        nextReviewDate: returnedCard.next_review_date || dbCard.next_review_date,
        easeFactor: returnedCard.ease_factor || 2.5,
        interval: returnedCard.interval || 0,
        repetitions: returnedCard.repetitions || 0,
        deletedAt: returnedCard.deleted_at || undefined,
      };

      const currentCache = getLocalFlashcardCache(userId);
      const filteredCache = currentCache.filter((c) => c.id !== finalCard.id);
      setLocalFlashcardCache(userId, [...filteredCache, finalCard]);

      return finalCard;
    } catch (error: any) {
      console.error('[addFlashcard] ❌ Exception during insert:', error?.message || error);
      const fallback: Flashcard = {
        id: tempId,
        subjectId: dbCard.subject_id || '',
        front: dbCard.front || '',
        back: dbCard.back || '',
        nextReviewDate: dbCard.next_review_date,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };
      const currentCache = getLocalFlashcardCache(userId);
      setLocalFlashcardCache(userId, [...currentCache.filter((c) => c.id !== tempId), fallback]);
      return fallback;
    }
  },

  async addFlashcardsBatch(userId: string, cardsData: Partial<Flashcard>[]): Promise<Flashcard[]> {
    if (!userId || userId === 'guest' || userId === 'local_user') {
      const finalCards: Flashcard[] = cardsData.map((c) => ({
        id: c.id && !c.id.startsWith('temp_') ? c.id : generateUUID(),
        subjectId: c.subjectId && c.subjectId.trim().length > 0 ? c.subjectId : '',
        front: c.front || '',
        back: c.back || '',
        nextReviewDate: c.nextReviewDate || new Date().toISOString(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      }));
      const currentCache = getLocalFlashcardCache(userId || 'local_user');
      const merged = [...currentCache];
      for (const fc of finalCards) {
        if (!merged.some((x) => x.id === fc.id)) merged.push(fc);
      }
      setLocalFlashcardCache(userId || 'local_user', merged);
      return finalCards;
    }

    const dbUserId = isUuid(userId) ? userId : toDeterministicUUID(userId);
    const tempCards = cardsData.map((c) => {
      const cardId = c.id && !c.id.startsWith('temp_') && isUuid(c.id) ? c.id : generateUUID();
      const card: Record<string, any> = {
        id: cardId,
        user_id: dbUserId,
        subject_id: c.subjectId && isUuid(c.subjectId) ? c.subjectId : null,
        front: c.front,
        back: c.back,
        next_review_date: c.nextReviewDate || new Date().toISOString(),
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
      };
      return card;
    });

    try {
      const chunkSize = 100;
      const insertedCards: Flashcard[] = [];

      for (let i = 0; i < tempCards.length; i += chunkSize) {
        let chunk = tempCards.slice(i, i + chunkSize);
        const upsertOp = supabase.from('flashcards').upsert(chunk, { onConflict: 'id' });
        let { data, error } =
          typeof (upsertOp as any)?.select === 'function'
            ? await (upsertOp as any).select()
            : await upsertOp;

        // If error due to subject_id foreign key constraint (23503) or invalid UUID (22P02), retry with subject_id = null
        if (
          error &&
          (error.code === '23503' ||
            error.code === '22P02' ||
            error.message?.includes('subject_id'))
        ) {
          const sanitizedChunk = chunk.map((c) => ({ ...c, subject_id: null }));
          const retryOp = supabase.from('flashcards').upsert(sanitizedChunk, { onConflict: 'id' });
          const retry =
            typeof (retryOp as any)?.select === 'function'
              ? await (retryOp as any).select()
              : await retryOp;
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('[addFlashcardsBatch] ❌ Chunk DB insert error:', error.message);
        }

        const resultRows = data && data.length > 0 ? data : chunk;
        insertedCards.push(
          ...((resultRows as any[]).map((c) => ({
            id: c.id || generateUUID(),
            subjectId: c.subject_id || c.subjectId || '',
            front: c.front,
            back: c.back,
            nextReviewDate: c.next_review_date || c.nextReviewDate,
            easeFactor: c.ease_factor || c.easeFactor || 2.5,
            interval: c.interval || 0,
            repetitions: c.repetitions || 0,
          })) as Flashcard[]),
        );
      }

      const currentCache = getLocalFlashcardCache(userId);
      const mergedCache = [
        ...currentCache,
        ...insertedCards.filter((ic) => !currentCache.some((cc) => cc.id === ic.id)),
      ];
      setLocalFlashcardCache(userId, mergedCache);

      return insertedCards;
    } catch (err) {
      console.error('[addFlashcardsBatch] Exception:', err);
      const fallback = tempCards.map((c) => ({
        id: c.id || generateUUID(),
        subjectId: c.subject_id || '',
        front: c.front,
        back: c.back,
        nextReviewDate: c.next_review_date,
        easeFactor: c.ease_factor,
        interval: c.interval,
        repetitions: c.repetitions,
      })) as Flashcard[];

      const currentCache = getLocalFlashcardCache(userId);
      setLocalFlashcardCache(userId, [...currentCache, ...fallback]);
      return fallback;
    }
  },

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<void> {
    const dbUpdates: import('../types/supabase-types').DatabaseFlashcardUpdate = {};

    if (updates.nextReviewDate) dbUpdates.next_review_date = updates.nextReviewDate;
    if (updates.front) dbUpdates.front = updates.front;
    if (updates.back) dbUpdates.back = updates.back;
    if (updates.easeFactor) dbUpdates.ease_factor = updates.easeFactor;
    if (updates.interval !== undefined) dbUpdates.interval = updates.interval;
    if (updates.repetitions !== undefined) dbUpdates.repetitions = updates.repetitions;
    if (updates.subjectId) dbUpdates.subject_id = updates.subjectId;

    const { error } = await supabase.from('flashcards').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('Update flashcard error:', error);
      throw error;
    }
  },

  async deleteFlashcard(id: string, permanent = false): Promise<void> {
    if (permanent) {
      try {
        const { error } = await supabase.from('flashcards').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Delete flashcard error:', error);
        throw error;
      }
    } else {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Soft delete flashcard error:', error);
        throw error;
      }
    }
  },

  async restoreFlashcard(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('flashcards').update({ deleted_at: null }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Restore flashcard error:', error);
      throw error;
    }
  },

  async importFlashcards(
    userId: string,
    subjectId: string,
    cards: { front: string; back: string; example?: string }[],
  ): Promise<Flashcard[]> {
    const dbCards = cards.map((c) => ({
      user_id: userId,
      subject_id: subjectId && subjectId.trim().length > 0 ? subjectId : null,
      front: c.front,
      back: (c.back + (c.example ? `\n\nMisol: ${c.example}` : '')).trim(),
      next_review_date: new Date().toISOString(),
      ease_factor: 2.5,
      interval: 0,
      repetitions: 0,
    }));

    const chunkSize = 50;
    const insertedCards: Flashcard[] = [];

    for (let i = 0; i < dbCards.length; i += chunkSize) {
      let chunk = dbCards.slice(i, i + chunkSize);
      let { data, error } = await supabase
        .from('flashcards')
        .upsert(chunk, { ignoreDuplicates: true })
        .select();

      // Retry without subject_id if foreign key or UUID syntax error occurs
      if (
        error &&
        (error.code === '23503' || error.code === '22P02' || error.message?.includes('subject_id'))
      ) {
        const sanitizedChunk = chunk.map((c) => ({ ...c, subject_id: null }));
        const retry = await supabase
          .from('flashcards')
          .upsert(sanitizedChunk, { ignoreDuplicates: true })
          .select();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('[importFlashcards] ❌ DB import chunk error:', error.message);
      }

      const resultRows = data && data.length > 0 ? data : chunk;
      insertedCards.push(
        ...((resultRows as any[]).map((c) => ({
          id: c.id || generateUUID(),
          subjectId: c.subject_id || c.subjectId || '',
          front: c.front,
          back: c.back,
          nextReviewDate: c.next_review_date || c.nextReviewDate,
          easeFactor: c.ease_factor || c.easeFactor || 2.5,
          interval: c.interval || 0,
          repetitions: c.repetitions || 0,
        })) as Flashcard[]),
      );
    }

    const currentCache = getLocalFlashcardCache(userId);
    const mergedCache = [
      ...currentCache,
      ...insertedCards.filter((ic) => !currentCache.some((cc) => cc.id === ic.id)),
    ];
    setLocalFlashcardCache(userId, mergedCache);

    return insertedCards;
  },
};
