import { PresetDeck, PresetCard, PresetSubDeck } from '../data/presetDecks';
import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { GlobalFlashcardOverrideService } from './GlobalFlashcardOverrideService';

export interface DeckPart {
  id: string;
  deckId: string;
  level: string;
  partNumber: number;
  title: string;
  cardCount: number;
  cards: PresetCard[];
  isCustomAdminPart?: boolean;
}

export function splitPresetCardsIntoParts(
  deck: PresetDeck,
  cards: PresetCard[],
  chunkSize: number = 100,
): DeckPart[] {
  const categories = new Map<string, PresetCard[]>();
  for (const card of cards) {
    const category = card.category?.trim();
    if (!category) continue;
    const categoryCards = categories.get(category) || [];
    categoryCards.push(card);
    categories.set(category, categoryCards);
  }

  const groupedCards =
    categories.size > 1
      ? Array.from(categories.entries()).map(([title, categoryCards]) => ({
          title,
          cards: categoryCards,
        }))
      : Array.from({ length: Math.ceil(cards.length / chunkSize) }, (_, index) => ({
          title: `${deck.level} — ${index + 1}-Qism`,
          cards: cards.slice(index * chunkSize, (index + 1) * chunkSize),
        }));

  return groupedCards.map((group, index) => ({
    id: `${deck.id}_part_${index + 1}`,
    deckId: deck.id,
    level: deck.level,
    partNumber: index + 1,
    title: `${group.title} (${group.cards.length} ta karta)`,
    cardCount: group.cards.length,
    cards: group.cards,
    isCustomAdminPart: false,
  }));
}

export const PresetDeckService = {
  /**
   * Splits a large preset deck into 100-card Parts (1-Qism, 2-Qism, ... N-Qism)
   * and merges any Admin-created custom parts (N+1-Qism...) dynamically ensuring NO duplicate Part numbers.
   */
  async getDeckParts(deck: PresetDeck, chunkSize: number = 100): Promise<DeckPart[]> {
    const parts: DeckPart[] = [];
    const seenIds = new Set<string>();

    try {
      // 1. Load cards (checking preset_deck_curations first, falling back to deck.loadCards)
      let allCards: PresetCard[] = [];
      try {
        const { data: curated } = await supabase
          .from('preset_deck_curations')
          .select('cards')
          .eq('deck_id', deck.id)
          .maybeSingle();

        if (curated && Array.isArray(curated.cards) && curated.cards.length > 0) {
          allCards = curated.cards;
        }
      } catch (err) {
        console.warn('[PresetDeckService] Curated fetch notice:', err);
      }

      if (allCards.length === 0) {
        allCards = await deck.loadCards();
      }

      // Apply global word/translation/structure overrides
      allCards = GlobalFlashcardOverrideService.applyOverridesToCards(allCards);

      if (allCards && allCards.length > 0) {
        const baseParts = splitPresetCardsIntoParts(deck, allCards, chunkSize);
        for (const part of baseParts) {
          parts.push(part);
          seenIds.add(part.id);
        }
      }

      // Determine highest base part number
      let currentHighestPartNumber =
        parts.length > 0 ? Math.max(...parts.map((p) => p.partNumber)) : 0;

      // 2. Fetch custom Admin-created extension parts from Supabase DB
      const { data: dbAlbums, error } = await supabase
        .from('admin_preset_albums')
        .select('*')
        .eq('level', deck.level);

      if (!error && dbAlbums && dbAlbums.length > 0) {
        dbAlbums.forEach((alb: any) => {
          if (alb.id && !seenIds.has(alb.id)) {
            currentHighestPartNumber++;
            const allocatedPartNumber = currentHighestPartNumber;
            const partId = alb.id;
            seenIds.add(partId);

            parts.push({
              id: partId,
              deckId: deck.id,
              level: deck.level,
              partNumber: allocatedPartNumber,
              title: `${deck.level} — ${allocatedPartNumber}-Qism (${alb.card_count || alb.cards?.length || 0} ta card)`,
              cardCount: alb.card_count || alb.cards?.length || 0,
              cards: GlobalFlashcardOverrideService.applyOverridesToCards(alb.cards || []),
              isCustomAdminPart: true,
            });
          }
        });
      }

      // 3. Also check safeLocalStorage cache for offline/backup custom parts
      const localAlbums = safeLocalStorage.getJSON<PresetSubDeck[]>(
        'study_planner_admin_albums',
        [],
      );
      const matchingLocal = localAlbums.filter((a) => a.level === deck.level);

      matchingLocal.forEach((alb) => {
        if (alb.id && !seenIds.has(alb.id)) {
          currentHighestPartNumber++;
          const allocatedPartNumber = currentHighestPartNumber;
          seenIds.add(alb.id);

          parts.push({
            id: alb.id,
            deckId: deck.id,
            level: deck.level,
            partNumber: allocatedPartNumber,
            title: `${deck.level} — ${allocatedPartNumber}-Qism (${alb.cardCount} ta card)`,
            cardCount: alb.cardCount,
            cards: GlobalFlashcardOverrideService.applyOverridesToCards(alb.cards || []),
            isCustomAdminPart: true,
          });
        }
      });
    } catch (err) {
      console.error('Error building deck parts:', err);
    }

    // Sort strictly by partNumber ascending
    return parts.sort((a, b) => a.partNumber - b.partNumber);
  },

  /**
   * Fetches all Custom Standalone Albums created by Super Admin (from DB + LocalStorage cache)
   */
  async getStandaloneAlbums(): Promise<PresetSubDeck[]> {
    const albumsMap = new Map<string, PresetSubDeck>();

    // 1. Check local storage cache first for instant UI response
    try {
      const localAlbums = safeLocalStorage.getJSON<PresetSubDeck[]>(
        'study_planner_admin_albums',
        [],
      );
      localAlbums
        .filter(
          (a) =>
            a.deckId === 'deck_custom_standalone' ||
            a.id.startsWith('standalone_') ||
            a.level === 'MUSTAQIL' ||
            a.level === 'SPECIAL' ||
            a.level === 'BIZNES',
        )
        .forEach((a) => albumsMap.set(a.id, a));
    } catch (e) {}

    // 2. Fetch from Supabase DB table `admin_preset_albums`
    try {
      const { data: dbAlbums, error } = await supabase.from('admin_preset_albums').select('*');

      if (!error && dbAlbums && dbAlbums.length > 0) {
        dbAlbums
          .filter(
            (alb: any) =>
              alb.deck_id === 'deck_custom_standalone' ||
              (alb.id && String(alb.id).startsWith('standalone_')) ||
              alb.level === 'MUSTAQIL' ||
              alb.level === 'SPECIAL' ||
              alb.level === 'BIZNES',
          )
          .forEach((alb: any) => {
            albumsMap.set(alb.id, {
              id: alb.id,
              deckId: alb.deck_id || 'deck_custom_standalone',
              title: alb.title || 'Mustaqil Albom',
              level: alb.level || 'MUSTAQIL',
              description: alb.description || '',
              partNumber: alb.part_number || 1,
              cardCount: alb.card_count || (Array.isArray(alb.cards) ? alb.cards.length : 0),
              cards: Array.isArray(alb.cards) ? alb.cards : [],
              createdAt: alb.created_at || new Date().toISOString(),
            });
          });
      }
    } catch (err) {
      console.warn('Supabase standalone albums fetch notice:', err);
    }

    const allStandalone = Array.from(albumsMap.values());

    // Update local cache with merged standalone albums
    try {
      const localList = safeLocalStorage.getJSON<PresetSubDeck[]>('study_planner_admin_albums', []);
      const nonStandalone = localList.filter(
        (a) => a.deckId !== 'deck_custom_standalone' && !a.id.startsWith('standalone_'),
      );
      safeLocalStorage.setJSON('study_planner_admin_albums', [...nonStandalone, ...allStandalone]);
    } catch (e) {}

    return allStandalone.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /**
   * Deletes a Standalone Album from DB and Local Cache
   */
  async deleteStandaloneAlbum(id: string): Promise<boolean> {
    try {
      await supabase.from('admin_preset_albums').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete standalone album notice:', e);
    }

    try {
      const localList = safeLocalStorage.getJSON<PresetSubDeck[]>('study_planner_admin_albums', []);
      const updated = localList.filter((a) => a.id !== id);
      safeLocalStorage.setJSON('study_planner_admin_albums', updated);
    } catch (e) {}

    return true;
  },
};
