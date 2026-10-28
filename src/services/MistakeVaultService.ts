import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export type MistakeSource = 'lesson' | 'quiz' | 'sentence_order' | 'mock_exam';
export type MistakeCategory = 'grammar' | 'kanji' | 'vocab' | 'reading' | 'listening';
export type MistakeLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface DistractorAnalysisItem {
  option: string;
  reasonUzbek: string;
  isCorrect?: boolean;
}

export interface JlptMistakeItem {
  id: string;
  userId?: string;
  source: MistakeSource;
  level: MistakeLevel;
  category: MistakeCategory;
  title?: string;
  questionText: string;
  passageText?: string;
  audioUrl?: string;
  options: string[];
  userAnswer: number | string;
  correctAnswer: number | string;
  explanationUzbek: string;
  ruleBroken?: string;
  distractorAnalysis?: DistractorAnalysisItem[];
  timestamp: string;
  reviewCount: number;
  status: 'unresolved' | 'mastered';
}

const STORAGE_KEY_PREFIX = 'study_planner_jlpt_mistakes_';

export class MistakeVaultService {
  private static getStorageKey(userId?: string | null): string {
    if (userId) return `${STORAGE_KEY_PREFIX}${userId}`;
    const cachedUser = safeLocalStorage.getJSON<{ id?: string }>('study_planner_user_cache', {});
    if (cachedUser?.id) return `${STORAGE_KEY_PREFIX}${cachedUser.id}`;
    return `${STORAGE_KEY_PREFIX}guest`;
  }

  /**
   * Get all recorded mistakes for active user
   */
  public static getMistakes(userId?: string | null): JlptMistakeItem[] {
    if (typeof window === 'undefined') return [];
    return safeLocalStorage.getJSON<JlptMistakeItem[]>(this.getStorageKey(userId), []);
  }

  /**
   * Save a single mistake
   */
  public static recordMistake(
    item: Omit<JlptMistakeItem, 'id' | 'timestamp' | 'reviewCount' | 'status'>,
    userId?: string | null,
  ): JlptMistakeItem {
    const list = this.getMistakes(userId);
    const existingIdx = list.findIndex(
      (m) => m.questionText === item.questionText && m.level === item.level,
    );

    const newItem: JlptMistakeItem = {
      ...item,
      id:
        existingIdx !== -1
          ? list[existingIdx].id
          : `mstk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      reviewCount: existingIdx !== -1 ? list[existingIdx].reviewCount + 1 : 0,
      status: 'unresolved',
    };

    let updated: JlptMistakeItem[];
    if (existingIdx !== -1) {
      updated = [...list];
      updated[existingIdx] = newItem;
    } else {
      updated = [newItem, ...list].slice(0, 300); // Keep last 300 mistakes
    }

    safeLocalStorage.setJSON(this.getStorageKey(userId), updated);
    return newItem;
  }

  /**
   * Record multiple mistakes in bulk
   */
  public static recordBatch(
    items: Omit<JlptMistakeItem, 'id' | 'timestamp' | 'reviewCount' | 'status'>[],
    userId?: string | null,
  ): void {
    if (!items || items.length === 0) return;
    const list = this.getMistakes(userId);
    const updated = [...list];

    for (const item of items) {
      const existingIdx = updated.findIndex(
        (m) => m.questionText === item.questionText && m.level === item.level,
      );
      const entry: JlptMistakeItem = {
        ...item,
        id:
          existingIdx !== -1
            ? updated[existingIdx].id
            : `mstk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        reviewCount: existingIdx !== -1 ? updated[existingIdx].reviewCount + 1 : 0,
        status: 'unresolved',
      };
      if (existingIdx !== -1) {
        updated[existingIdx] = entry;
      } else {
        updated.unshift(entry);
      }
    }

    safeLocalStorage.setJSON(this.getStorageKey(userId), updated.slice(0, 300));
  }

  /**
   * Mark a mistake as mastered (solved successfully in re-test)
   */
  public static markAsMastered(id: string, userId?: string | null): boolean {
    const list = this.getMistakes(userId);
    const target = list.find((m) => m.id === id);
    if (!target) return false;

    target.status = 'mastered';
    target.reviewCount += 1;
    target.timestamp = new Date().toISOString();

    safeLocalStorage.setJSON(this.getStorageKey(userId), list);
    return true;
  }

  /**
   * Delete mistake item
   */
  public static deleteMistake(id: string, userId?: string | null): void {
    const list = this.getMistakes(userId);
    const updated = list.filter((m) => m.id !== id);
    safeLocalStorage.setJSON(this.getStorageKey(userId), updated);
  }

  /**
   * Clear all mastered mistakes
   */
  public static clearMastered(userId?: string | null): void {
    const list = this.getMistakes(userId);
    const updated = list.filter((m) => m.status !== 'mastered');
    safeLocalStorage.setJSON(this.getStorageKey(userId), updated);
  }

  /**
   * Get stats summary
   */
  public static getStats(userId?: string | null): {
    total: number;
    unresolved: number;
    mastered: number;
    byLevel: Record<MistakeLevel, number>;
    byCategory: Record<MistakeCategory, number>;
  } {
    const list = this.getMistakes(userId);
    const byLevel: Record<MistakeLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    const byCategory: Record<MistakeCategory, number> = {
      grammar: 0,
      kanji: 0,
      vocab: 0,
      reading: 0,
      listening: 0,
    };

    let unresolved = 0;
    let mastered = 0;

    for (const item of list) {
      if (item.status === 'mastered') {
        mastered++;
      } else {
        unresolved++;
      }
      if (byLevel[item.level] !== undefined) {
        byLevel[item.level]++;
      }
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      }
    }

    return {
      total: list.length,
      unresolved,
      mastered,
      byLevel,
      byCategory,
    };
  }

  /**
   * Get all currently unresolved mistakes for remedial training
   */
  public static getUnresolvedMistakes(
    userId?: string | null,
    category?: MistakeCategory,
  ): JlptMistakeItem[] {
    const list = this.getMistakes(userId);
    return list.filter((m) => {
      const matchStatus = m.status === 'unresolved';
      const matchCat = category ? m.category === category : true;
      return matchStatus && matchCat;
    });
  }

  /**
   * Get count of unresolved mistakes broken down by category for score penalty calculation
   */
  public static getUnresolvedCountByCategory(
    userId?: string | null,
  ): Record<MistakeCategory, number> {
    const list = this.getUnresolvedMistakes(userId);
    const counts: Record<MistakeCategory, number> = {
      grammar: 0,
      kanji: 0,
      vocab: 0,
      reading: 0,
      listening: 0,
    };
    for (const item of list) {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    }
    return counts;
  }

  /**
   * Infers the broken grammar rule, particle rule, or vocabulary condition for a mistake.
   */
  public static inferRuleBroken(item: JlptMistakeItem): string {
    if (item.ruleBroken && item.ruleBroken.trim()) {
      return item.ruleBroken;
    }

    const text = `${item.questionText} ${item.explanationUzbek || ''}`;

    // Common JLPT Grammar and Particle Rules
    if (
      /[をにでへとがはも]/.test(text) &&
      /zarracha|particle|qo'shimcha/i.test(item.explanationUzbek || '')
    ) {
      return 'Zarrachalar uyg‘unligi (Particles: は/が/を/に/で/と/へ)';
    }
    if (/てはいけない|てはだめ/i.test(text)) {
      return '〜てはいけない (Taqiqlash qoidasi - Prohibitive form)';
    }
    if (/なければならない|なくてはいけない/i.test(text)) {
      return '〜なければならない (Majburiyat / Qat’iy shart)';
    }
    if (/てもいい|てもかまわない/i.test(text)) {
      return '〜てもいい (Ruxsat berish / Permission)';
    }
    if (/ほうがいい/i.test(text)) {
      return '〜ほうがいい (Maslahat va tavsiya berish - Advice)';
    }
    if (/たら|なら|ば|と/i.test(text) && /shart|agar|bo'lsa/i.test(item.explanationUzbek || '')) {
      return 'Shart mayllari (Conditionals: 〜たら / 〜ば / 〜なら / 〜と)';
    }
    if (
      /られる|させる|させられる/i.test(text) &&
      /passiv|majhul|orttirma/i.test(item.explanationUzbek || '')
    ) {
      return 'Majhul / Orttirma nisbat (Passive & Causative: 受身・使役)';
    }
    if (
      /敬語|いらっしゃる|おっしゃる|くださる|いただく|まいる/i.test(text) ||
      /hurmat|keigo/i.test(item.explanationUzbek || '')
    ) {
      return 'Hurmat nutqi (Keigo: Sonkeigo & Kenjougo)';
    }
    if (item.category === 'kanji') {
      return 'Kanji o‘qilish va chalg‘ituvchi o‘xshash radikallar (Onyomi vs Kunyomi)';
    }
    if (item.category === 'vocab') {
      return 'Kontekstual sinonimlar va mos keluvchi fe’l/ot birikmalari (Collocation)';
    }
    if (item.category === 'reading') {
      return 'Matn mantiqi va asosiy fikrni ajratib olish (Reading Inference)';
    }
    if (item.category === 'listening') {
      return 'Kalit so‘zlarni ilg‘ash va tezkor javob (Listening Key Cues)';
    }

    return `${item.level} Grammatik qoida va bog‘lovchilar formulasi`;
  }

  /**
   * Generates a detailed breakdown for every distractor (incorrect option) explaining
   * why it was misleading and why it violates the Japanese grammatical/contextual requirement.
   */
  public static getDistractorAnalysis(item: JlptMistakeItem): DistractorAnalysisItem[] {
    if (item.distractorAnalysis && item.distractorAnalysis.length > 0) {
      return item.distractorAnalysis;
    }

    if (!item.options || item.options.length === 0) {
      return [];
    }

    const correctIdx = typeof item.correctAnswer === 'number' ? item.correctAnswer : -1;
    const correctText = correctIdx >= 0 ? item.options[correctIdx] : String(item.correctAnswer);

    return item.options.map((opt, idx) => {
      const isCorrect = idx === correctIdx || opt === correctText;
      if (isCorrect) {
        return {
          option: opt,
          isCorrect: true,
          reasonUzbek:
            item.explanationUzbek ||
            `✅ To‘g‘ri javob: Gapning ma’nosi, zamoni va grammatik talabiga to‘liq mos keladi.`,
        };
      }

      // Contextual reason generation based on user's wrong choice vs standard distractors
      const isUserChoice =
        idx === item.userAnswer ||
        opt ===
          (typeof item.userAnswer === 'number' ? item.options[item.userAnswer] : item.userAnswer);

      let reason = `Ushbu variant kontekstga yoki grammatik qolipga mos kelmaydi.`;

      if (/[をにでへとがはも]/.test(opt) && opt.length <= 2) {
        reason = `❌ Noto‘g‘ri zarracha: Fe’l yoki ot bilan bu zarrachani qo‘llash semantik va sintaktik xatolik hosil qiladi.`;
      } else if (/ない|ません|なかった/.test(opt) && !/ない|ません/.test(correctText)) {
        reason = `❌ Inkor shakl xatoligi: Gap ijobiy tasdiqni talab qiladi, inkor shakl ma’noni teskariga o‘zgartiradi.`;
      } else if (/ます|ました|ません/.test(opt) && !/ます|ました/.test(correctText)) {
        reason = `❌ Xushmuomalalik (polite form) nomutanosibligi: Gap o‘rtasidagi bog‘lovchi oddiy (plain/dictionary) shaklni talab qiladi.`;
      } else if (/た|だ/.test(opt) && !/た|だ/.test(correctText)) {
        reason = `❌ Zamon xatosi: O‘tgan zamon shakli ushbu qolipga mos kelmaydi, hozirgi-kelasi zamon yoki lug‘aviy shakl kerak.`;
      } else if (item.category === 'kanji') {
        reason = `❌ O‘qilish yoki radikal chalkashligi: Ushbu so‘z kontekstida berilgan kanjining o‘qilishi bu emas.`;
      } else if (item.category === 'vocab') {
        reason = `❌ Ma’nodosh, ammo noto‘g‘ri nuans: Ushbu fe’l/ot gapdagi subyekt yoki obyekt bilan tabiiy birikma hosil qilmaydi.`;
      }

      if (isUserChoice) {
        reason += ` (Siz tanlagan chalg‘ituvchi variant)`;
      }

      return {
        option: opt,
        isCorrect: false,
        reasonUzbek: reason,
      };
    });
  }

  /**
   * Generates a targeted remedial drill item based on the student's mistake.
   */
  public static generateRemedialDrill(item: JlptMistakeItem): JlptMistakeItem {
    const drillId = `drill_${item.id}_${Date.now()}`;
    const rule = this.inferRuleBroken(item);

    return {
      ...item,
      id: drillId,
      title: `[Qayta Mashq] ${rule}`,
      reviewCount: item.reviewCount + 1,
      ruleBroken: rule,
      distractorAnalysis: this.getDistractorAnalysis(item),
    };
  }
}
