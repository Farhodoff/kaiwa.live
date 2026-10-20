import { GlobalFlashcardOverrideService } from '../services/GlobalFlashcardOverrideService';

export interface PresetCard {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  category?: string;
}

export interface PresetDeck {
  id: string;
  title: string;
  description: string;
  language: 'ja';
  level: 'JLPT N5' | 'JLPT N4' | 'JLPT N3' | 'JLPT N2' | 'JLPT N1';
  badgeColor: string;
  icon: string;
  cardCount: number;
  isPremiumOnly?: boolean;
  loadCards: () => Promise<PresetCard[]>;
}

export interface PresetSubDeck {
  id: string;
  deckId: string;
  title: string;
  level: string;
  description?: string;
  badgeColor?: string;
  icon?: string;
  partNumber: number;
  cardCount: number;
  cards: PresetCard[];
  createdAt: string;
}

async function loadAndApplyOverrides(
  importPromise: Promise<{ default: any }>,
): Promise<PresetCard[]> {
  const data = await importPromise;
  try {
    return GlobalFlashcardOverrideService.applyOverridesToCards(data.default as PresetCard[]);
  } catch {
    return data.default as PresetCard[];
  }
}

export const PRESET_DECKS: PresetDeck[] = [
  {
    id: 'deck_minna_shokyu1',
    title: "🌸 Minna no Nihongo Shokyu 1 (1–25 Darslar To'liq Lug'ati)",
    description:
      "Minna no Nihongo Shokyu 1 darsligining barcha 25 ta darsidan 1,111 ta so'z va iboralar to'plami (O'zbekcha tarjima va grammatik belgilar bilan).",
    language: 'ja',
    level: 'JLPT N5',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🌸',
    cardCount: 1111,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/minna_shokyu1.json')),
  },
  {
    id: 'deck_minna_shokyu2',
    title: "🌿 Minna no Nihongo Shokyu 2 (26–50 Darslar To'liq Lug'ati)",
    description:
      "Minna no Nihongo Shokyu 2 darsligining barcha 25 ta darsidan 451 ta so'z va iboralar to'plami (O'zbekcha tarjima va grammatik belgilar bilan).",
    language: 'ja',
    level: 'JLPT N4',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🌿',
    cardCount: 451,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/minna_shokyu2.json')),
  },
  {
    id: 'deck_jlpt_n5',
    title: '🌸 JLPT N5 Master Deck (Minna & Try)',
    description:
      "Minna no Nihongo Uzbek translation, Kanji Master va Try N5 darsliklaridan 218 ta tayanch kanji va so'zlar.",
    language: 'ja',
    level: 'JLPT N5',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '🌸',
    cardCount: 218,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/jlpt_n5.json')),
  },
  {
    id: 'deck_n5_test_bank',
    title: '📝 JLPT N5 Amaliy Test Banki (Original 70 Savol)',
    description:
      "Haqiqiy rasmiy JLPT imtihon kitobidan olingan 70 ta amaliy test savollari (Kanji o'qilishi, yozilishi, so'z tanlash, zarra va gap tuzish hamda qisqa dokkai).",
    language: 'ja',
    level: 'JLPT N5',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '📝',
    cardCount: 70,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n5_test_bank.json')),
  },
  {
    id: 'deck_jlpt_n4',
    title: '🎌 JLPT N4 Master Deck (Shin Kanzen & Goi 1211)',
    description: "Shin Kanzen Master, Minna no Nihongo va 1211 ta N4 tayanch Kanji hamda so'zlar.",
    language: 'ja',
    level: 'JLPT N4',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '🎌',
    cardCount: 1211,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/jlpt_n4.json')),
  },
  {
    id: 'deck_kanji_master_n4',
    title: '🥋 Kanji Master N4 (207 Iyeroglif & Tematik Birikmalar)',
    description:
      "Rasmiy Kanji Master N4 darsligining barcha 9 ta bobi bo'yicha 207 ta tayanch iyeroglif, ularning on/kun o'qilishlari, chizishlar soni va hayotiy birikmalari to'plami.",
    language: 'ja',
    level: 'JLPT N4',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '🥋',
    cardCount: 207,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/kanji_master_n4.json')),
  },
  {
    id: 'deck_n4_500_mon',
    title: '🎯 JLPT N4 500 Mon Savollar Banki (文字・語彙・文法 84)',
    description:
      "Shin Nihongo 500 Mon N4 darsligidan kanji, leksika va grammatika bo'yicha 3 talik blokli intensiv mashqlar va o'zbekcha sharhlar.",
    language: 'ja',
    level: 'JLPT N4',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '🎯',
    cardCount: 84,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n4_500_mon.json')),
  },
  {
    id: 'deck_jlpt_n3',
    title: '🏮 JLPT N3 Master Deck (Shin Kanzen & Goi 2233)',
    description: "Shin Kanzen Master, Somatome va 2233 ta N3 tayanch so'zlar.",
    language: 'ja',
    level: 'JLPT N3',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: '🏮',
    cardCount: 2233,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/jlpt_n3.json')),
  },
  {
    id: 'deck_n3_confusing_grammar',
    title: "⚡ JLPT N3 Chalg'ituvchi Grammatika (対比・識別 45)",
    description:
      "Shin Kanzen Master va Mimi Kara Oboeru darsliklaridan talabalarni eng ko'p chalg'itadigan grammatik juftliklar (わけではない vs わけがない, どころではない vs どころか va h.k.).",
    language: 'ja',
    level: 'JLPT N3',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    icon: '⚡',
    cardCount: 45,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n3_confusing_grammar.json')),
  },
  {
    id: 'deck_n3_500_mon',
    title: '🎯 JLPT N3 500 Mon Savollar Banki (文字・語彙・文法 60)',
    description:
      "Shin Nihongo 500 Mon N3 kitobidan kanji, leksika va grammatika bo'yicha tematik mashg'ulotlar va o'zbekcha sharhlar.",
    language: 'ja',
    level: 'JLPT N3',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: '🎯',
    cardCount: 60,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n3_500_mon.json')),
  },
  {
    id: 'deck_n3_thematic_vocab',
    title: '📖 JLPT N3 Tematik Leksika Master (テーマ別 語彙 699)',
    description:
      "12 ta hayotiy mavzu (Ish va kasb, his-tuyg'ular, jamiyat, taomlar, xarakter, tabiat) bo'yicha 699 ta muhim N3 so'zlari va namunaviy gaplar to'plami.",
    language: 'ja',
    level: 'JLPT N3',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    icon: '📖',
    cardCount: 699,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n3_thematic_vocab.json')),
  },
  {
    id: 'deck_jlpt_n2',
    title: '🗾 JLPT N2 Master Deck (Shin Kanzen & Goi 4632)',
    description: "Shin Kanzen Master, Sou Matome va 4632 ta N2 tayanch so'zlar.",
    language: 'ja',
    level: 'JLPT N2',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: '🗾',
    cardCount: 4632,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/jlpt_n2.json')),
  },
  {
    id: 'deck_n2_collocations',
    title: '🎯 JLPT N2 Shin Kanzen Collocations (連語・連用形 55)',
    description:
      "Shin Kanzen Master Goi darsligidan eng ko'p imtihonda tushadigan 55 ta fe'l-ot turg'un birikmalari (Collocations) va namunaviy gaplar.",
    language: 'ja',
    level: 'JLPT N2',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🎯',
    cardCount: 55,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n2_collocations.json')),
  },
  {
    id: 'deck_n2_500_mon',
    title: '🎯 JLPT N2 500 Mon Savollar Banki (文字・語彙・文法 24)',
    description:
      "Shin Nihongo 500 Mon N2 rasmiy darsligidan kanji, leksika va grammatika bo'yicha 3 talik blokli intensiv mashqlar va o'zbekcha sharhlar.",
    language: 'ja',
    level: 'JLPT N2',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🎯',
    cardCount: 24,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n2_500_mon.json')),
  },
  {
    id: 'deck_jlpt_n1',
    title: '👑 JLPT N1 Master Deck (Shin Kanzen & Goi 3542)',
    description:
      "N1 Shin Kanzen, Sou Matome va rasmiy JLPT korpusidan 3542 ta oliy darajadagi akademik va adabiy so'zlar.",
    language: 'ja',
    level: 'JLPT N1',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: '👑',
    cardCount: 3542,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/jlpt_n1.json')),
  },
  {
    id: 'deck_n1_yojijukugo',
    title: '📜 JLPT N1 Yojijukugo Master (四字熟語 49)',
    description:
      "Kanji Master N1 va Sou Matome darsliklaridagi eng muhim 49 ta to'rt iyeroglifli aforizm va idiomalar (O'zbekcha sharh va misollar bilan).",
    language: 'ja',
    level: 'JLPT N1',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '📜',
    cardCount: 49,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n1_yojijukugo.json')),
  },
  {
    id: 'deck_n1_500_mon',
    title: '🎯 JLPT N1 500 Mon Savollar Banki (文字・語彙・文法 24)',
    description:
      "Shin Nihongo 500 Mon N1 va Nihongo no Mori N1 darsliklaridan kanji, akademik leksika va oliy grammatika bo'yicha 3 talik blokli intensiv mashqlar.",
    language: 'ja',
    level: 'JLPT N1',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: '🎯',
    cardCount: 24,
    isPremiumOnly: false,
    loadCards: () => loadAndApplyOverrides(import('./decks/n1_500_mon.json')),
  },
];
