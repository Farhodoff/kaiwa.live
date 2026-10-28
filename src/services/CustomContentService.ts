import type { JlptKanjiItem, JlptGrammarItem, JlptVocabItem } from '../data/jlptGrammarKanji';
import type { JlptGrammarQuestion } from '../data/jlpt/grammar_data';
import type { JlptListeningQuestion } from '../data/jlpt/listening_data';
import type { JlptReadingPassage } from '../data/jlptReadingData';
import { JLPT_READING_PASSAGES } from '../data/jlptReadingData';
import { getAllN1ReadingPassages } from '../data/n1AdvancedContent';
import { supabase } from '../lib/supabase';

import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const CUSTOM_KANJI_KEY = 'study_planner_custom_admin_kanji';
const CUSTOM_GRAMMAR_KEY = 'study_planner_custom_admin_grammar';
const CUSTOM_QUIZ_KEY = 'study_planner_custom_admin_quiz_questions';
const CUSTOM_CHOUKAI_KEY = 'study_planner_custom_admin_choukai_questions';
const CUSTOM_DOKKAI_KEY = 'study_planner_custom_admin_dokkai_passages';

export const VALID_JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type JlptLevel = (typeof VALID_JLPT_LEVELS)[number];

export function parseJlptLevel(val: unknown, fallback: JlptLevel = 'N5'): JlptLevel {
  return typeof val === 'string' && (VALID_JLPT_LEVELS as readonly string[]).includes(val)
    ? (val as JlptLevel)
    : fallback;
}

export interface BulkImportResult {
  added: number;
  updated: number;
  failed: number;
}

export class CustomContentService {
  /**
   * Synchronize custom content from Supabase to local storage
   */
  static async syncFromSupabase(): Promise<{
    kanjiCount: number;
    grammarCount: number;
    quizCount: number;
    choukaiCount: number;
    dokkaiCount: number;
  }> {
    let kanjiCount = 0;
    let grammarCount = 0;
    let quizCount = 0;
    let choukaiCount = 0;
    let dokkaiCount = 0;

    try {
      const [kRes, gRes, qRes, cRes, dRes] = await Promise.allSettled([
        supabase.from('custom_kanji').select('*'),
        supabase.from('custom_grammar').select('*'),
        supabase.from('custom_quiz_questions').select('*'),
        supabase.from('custom_listening_questions').select('*'),
        supabase.from('custom_reading_passages').select('*'),
      ]);

      if (kRes.status === 'fulfilled' && kRes.value.data && Array.isArray(kRes.value.data)) {
        const remoteK: JlptKanjiItem[] = kRes.value.data.map((r: any) => ({
          id: r.id,
          kanji: r.kanji,
          level: r.level,
          onyomi: r.onyomi || '-',
          kunyomi: r.kunyomi || '-',
          meaningUz: r.meaning_uz,
          strokeCount: r.stroke_count || 1,
          examples: Array.isArray(r.examples) ? r.examples : [],
        }));

        const localK = this.getCustomKanji();
        const mergedMap = new Map<string, JlptKanjiItem>();
        // Remote takes precedent
        remoteK.forEach((item) => mergedMap.set(item.id || item.kanji, item));
        // Keep local if not yet in remote
        localK.forEach((item) => {
          const key = item.id || item.kanji;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });

        const combined = Array.from(mergedMap.values());
        safeLocalStorage.setJSON(CUSTOM_KANJI_KEY, combined);
        kanjiCount = combined.length;
      }

      if (gRes.status === 'fulfilled' && gRes.value.data && Array.isArray(gRes.value.data)) {
        const remoteG: JlptGrammarItem[] = gRes.value.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          level: r.level,
          romaji: r.romaji || '',
          meaningUz: r.meaning_uz,
          structure: r.structure || '',
          examples: Array.isArray(r.examples) ? r.examples : [],
        }));

        const localG = this.getCustomGrammar();
        const mergedMap = new Map<string, JlptGrammarItem>();
        remoteG.forEach((item) => mergedMap.set(item.id || item.title, item));
        localG.forEach((item) => {
          const key = item.id || item.title;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });

        const combined = Array.from(mergedMap.values());
        safeLocalStorage.setJSON(CUSTOM_GRAMMAR_KEY, combined);
        grammarCount = combined.length;
      }

      if (qRes.status === 'fulfilled' && qRes.value.data && Array.isArray(qRes.value.data)) {
        const remoteQ: JlptGrammarQuestion[] = qRes.value.data.map((r: any) => ({
          id: r.id,
          level: r.level || 'N5',
          pattern: r.pattern || '',
          questionText: r.question_text || r.questionText || '',
          options: Array.isArray(r.options) ? r.options : [],
          correctAnswer:
            typeof r.correct_answer === 'number'
              ? r.correct_answer
              : typeof r.correctAnswer === 'number'
                ? r.correctAnswer
                : 0,
          explanationUzbek: r.explanation_uzbek || r.explanationUzbek || '',
        }));

        const localQ = this.getCustomQuizQuestions();
        const mergedMap = new Map<string | number, JlptGrammarQuestion>();
        remoteQ.forEach((item) => mergedMap.set(item.id || item.questionText, item));
        localQ.forEach((item) => {
          const key = item.id || item.questionText;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });

        const combined = Array.from(mergedMap.values());
        safeLocalStorage.setJSON(CUSTOM_QUIZ_KEY, combined);
        quizCount = combined.length;
      }

      if (cRes.status === 'fulfilled' && cRes.value.data && Array.isArray(cRes.value.data)) {
        const remoteC: JlptListeningQuestion[] = cRes.value.data.map((r: any) => ({
          id: r.id,
          level: r.level || 'N5',
          type: r.type || 'task',
          titleUz: r.title_uz || r.titleUz || '',
          audioUrl: r.audio_url || r.audioUrl || '',
          script: r.script || '',
          questionText: r.question_text || r.questionText || '',
          questionTextUz: r.question_text_uz || r.questionTextUz || '',
          options: Array.isArray(r.options) ? r.options : [],
          optionsUz: Array.isArray(r.options_uz) ? r.options_uz : [],
          correctAnswer:
            typeof r.correct_answer === 'number'
              ? r.correct_answer
              : typeof r.correctAnswer === 'number'
                ? r.correctAnswer
                : 0,
          explanationUzbek: r.explanation_uzbek || r.explanationUzbek || '',
          tipUzbek: r.tip_uzbek || r.tipUzbek || '',
        }));

        const localC = this.getCustomChoukaiQuestions();
        const mergedMap = new Map<string | number, JlptListeningQuestion>();
        remoteC.forEach((item) => mergedMap.set(item.id || item.questionText, item));
        localC.forEach((item) => {
          const key = item.id || item.questionText;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });

        const combined = Array.from(mergedMap.values());
        safeLocalStorage.setJSON(CUSTOM_CHOUKAI_KEY, combined);
        choukaiCount = combined.length;
      }

      if (dRes.status === 'fulfilled' && dRes.value.data && Array.isArray(dRes.value.data)) {
        const remoteD: JlptReadingPassage[] = dRes.value.data.map((r: any) => ({
          id: r.id,
          level: r.level || 'N5',
          title: r.title || '',
          passageType: r.passage_type || r.passageType || 'short',
          japaneseContent: r.japanese_content || r.japaneseContent || '',
          uzbekTranslation: r.uzbek_translation || r.uzbekTranslation || '',
          recommendedTimeMinutes: r.recommended_time_minutes || r.recommendedTimeMinutes || 5,
          questions: Array.isArray(r.questions) ? r.questions : [],
        }));

        const localD = this.getCustomReadingPassages();
        const mergedMap = new Map<string, JlptReadingPassage>();
        remoteD.forEach((item) => mergedMap.set(item.id, item));
        localD.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });

        const combined = Array.from(mergedMap.values());
        safeLocalStorage.setJSON(CUSTOM_DOKKAI_KEY, combined);
        dokkaiCount = combined.length;
      }
    } catch (e) {
      console.warn('[CustomContentService] syncFromSupabase fallback to local:', e);
    }

    return { kanjiCount, grammarCount, quizCount, choukaiCount, dokkaiCount };
  }

  /**
   * Get all custom admin Kanji
   */
  static getCustomKanji(): JlptKanjiItem[] {
    try {
      const data = safeLocalStorage.getJSON<JlptKanjiItem[]>(CUSTOM_KANJI_KEY, []);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or insert custom Kanji
   */
  static async saveCustomKanji(item: JlptKanjiItem): Promise<boolean> {
    try {
      const current = this.getCustomKanji();
      const existingIdx = current.findIndex((k) => k.id === item.id || k.kanji === item.kanji);

      let updated: JlptKanjiItem[];
      const itemId =
        item.id || (existingIdx >= 0 ? current[existingIdx].id : `custom-k-${Date.now()}`);
      const preparedItem: JlptKanjiItem = { ...item, id: itemId };

      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = preparedItem;
      } else {
        updated = [preparedItem, ...current];
      }

      safeLocalStorage.setJSON(CUSTOM_KANJI_KEY, updated);

      // Try syncing to Supabase
      try {
        await (supabase.from('custom_kanji') as any).upsert([
          {
            id: preparedItem.id,
            kanji: preparedItem.kanji,
            level: preparedItem.level,
            onyomi: preparedItem.onyomi || '-',
            kunyomi: preparedItem.kunyomi || '-',
            meaning_uz: preparedItem.meaningUz,
            stroke_count: preparedItem.strokeCount || 1,
            examples: preparedItem.examples || [],
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch {
        // Table might not exist or offline
      }

      return true;
    } catch (e) {
      console.error('Error saving custom kanji:', e);
      return false;
    }
  }

  /**
   * Update existing custom Kanji by ID
   */
  static async updateCustomKanji(id: string, partial: Partial<JlptKanjiItem>): Promise<boolean> {
    try {
      const current = this.getCustomKanji();
      const idx = current.findIndex((k) => k.id === id);
      if (idx < 0) return false;

      const updatedItem: JlptKanjiItem = {
        ...current[idx],
        ...partial,
        id, // preserve ID
      };

      current[idx] = updatedItem;
      safeLocalStorage.setJSON(CUSTOM_KANJI_KEY, [...current]);

      try {
        await (supabase.from('custom_kanji') as any)
          .update({
            kanji: updatedItem.kanji,
            level: updatedItem.level,
            onyomi: updatedItem.onyomi,
            kunyomi: updatedItem.kunyomi,
            meaning_uz: updatedItem.meaningUz,
            stroke_count: updatedItem.strokeCount,
            examples: updatedItem.examples,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch {
        // ignore
      }

      return true;
    } catch (e) {
      console.error('Error updating custom kanji:', e);
      return false;
    }
  }

  /**
   * Delete custom Kanji
   */
  static async deleteCustomKanji(idOrKanji: string): Promise<boolean> {
    try {
      const current = this.getCustomKanji();
      const filtered = current.filter((k) => k.id !== idOrKanji && k.kanji !== idOrKanji);
      safeLocalStorage.setJSON(CUSTOM_KANJI_KEY, filtered);

      try {
        await (supabase.from('custom_kanji') as any)
          .delete()
          .or(`id.eq.${idOrKanji},kanji.eq.${idOrKanji}`);
      } catch {
        // ignore
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bulk import Kanji items
   */
  static async bulkImportKanji(items: Partial<JlptKanjiItem>[]): Promise<BulkImportResult> {
    let added = 0;
    let updated = 0;
    let failed = 0;

    const current = this.getCustomKanji();
    const map = new Map<string, JlptKanjiItem>(current.map((k) => [k.kanji, k]));
    const toUpsertDb: any[] = [];

    for (const raw of items) {
      if (!raw.kanji || !raw.kanji.trim() || !raw.meaningUz || !raw.meaningUz.trim()) {
        failed++;
        continue;
      }

      const kanjiChar = raw.kanji.trim();
      const existing = map.get(kanjiChar);
      const isUpdate = !!existing;

      const item: JlptKanjiItem = {
        id: existing
          ? existing.id
          : `custom-k-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kanji: kanjiChar,
        level: raw.level || 'N5',
        onyomi: raw.onyomi?.trim() || '-',
        kunyomi: raw.kunyomi?.trim() || '-',
        meaningUz: raw.meaningUz.trim(),
        strokeCount: Number(raw.strokeCount) || 1,
        examples: Array.isArray(raw.examples) ? raw.examples : [],
      };

      map.set(kanjiChar, item);
      if (isUpdate) updated++;
      else added++;

      toUpsertDb.push({
        id: item.id,
        kanji: item.kanji,
        level: item.level,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
        meaning_uz: item.meaningUz,
        stroke_count: item.strokeCount,
        examples: item.examples,
        updated_at: new Date().toISOString(),
      });
    }

    safeLocalStorage.setJSON(CUSTOM_KANJI_KEY, Array.from(map.values()));

    if (toUpsertDb.length > 0) {
      try {
        await (supabase.from('custom_kanji') as any).upsert(toUpsertDb);
      } catch {
        // ignore
      }
    }

    return { added, updated, failed };
  }

  /**
   * Parse delimited text or JSON for Kanji bulk import
   * Formats supported:
   * 1. JSON string: [{"kanji": "猫", "level": "N5", "meaningUz": "Mushuk"}]
   * 2. Pipe delimited: Kanji | Level | Onyomi | Kunyomi | Meaning | Strokes
   * 3. Dash delimited: Kanji - Meaning
   */
  static parseKanjiInput(text: string): Partial<JlptKanjiItem>[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Try parsing as JSON first
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.map((item: any) => ({
          kanji: item.kanji || item.char || item.character || '',
          level: parseJlptLevel(item.level),
          onyomi: item.onyomi || item.on || '-',
          kunyomi: item.kunyomi || item.kun || '-',
          meaningUz: item.meaningUz || item.meaning_uz || item.meaning || item.tarjima || '',
          strokeCount: Number(item.strokeCount || item.stroke_count || item.strokes || 1),
          examples: Array.isArray(item.examples) ? item.examples : [],
        }));
      } catch {
        // Fall back to line parser
      }
    }

    // Line parser
    const lines = trimmed.split('\n');
    const result: Partial<JlptKanjiItem>[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        const kanji = parts[0] || '';
        const level = parseJlptLevel(parts[1]);
        const onyomi = parts[2] || '-';
        const kunyomi = parts[3] || '-';
        const meaningUz = parts[4] || '';
        const strokeCount = parts[5] ? Number(parts[5]) || 1 : 1;

        if (kanji && meaningUz) {
          result.push({ kanji, level, onyomi, kunyomi, meaningUz, strokeCount, examples: [] });
        }
      } else if (line.includes('-')) {
        const [k, m] = line.split('-').map((p) => p.trim());
        if (k && m) {
          result.push({
            kanji: k,
            level: 'N5',
            onyomi: '-',
            kunyomi: '-',
            meaningUz: m,
            strokeCount: 1,
            examples: [],
          });
        }
      } else if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim());
        if (parts[0] && parts[1]) {
          result.push({
            kanji: parts[0],
            level: parseJlptLevel(parts[2]),
            onyomi: parts[3] || '-',
            kunyomi: parts[4] || '-',
            meaningUz: parts[1],
            strokeCount: 1,
            examples: [],
          });
        }
      }
    }

    return result;
  }

  /**
   * Get all custom admin Grammar rules
   */
  static getCustomGrammar(): JlptGrammarItem[] {
    try {
      const data = safeLocalStorage.getJSON<JlptGrammarItem[]>(CUSTOM_GRAMMAR_KEY, []);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or insert custom Grammar rule
   */
  static async saveCustomGrammar(item: JlptGrammarItem): Promise<boolean> {
    try {
      const current = this.getCustomGrammar();
      const existingIdx = current.findIndex((g) => g.id === item.id || g.title === item.title);

      let updated: JlptGrammarItem[];
      const itemId =
        item.id || (existingIdx >= 0 ? current[existingIdx].id : `custom-g-${Date.now()}`);
      const preparedItem: JlptGrammarItem = { ...item, id: itemId };

      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = preparedItem;
      } else {
        updated = [preparedItem, ...current];
      }

      safeLocalStorage.setJSON(CUSTOM_GRAMMAR_KEY, updated);

      try {
        await (supabase.from('custom_grammar') as any).upsert([
          {
            id: preparedItem.id,
            title: preparedItem.title,
            level: preparedItem.level,
            romaji: preparedItem.romaji || '',
            meaning_uz: preparedItem.meaningUz,
            structure: preparedItem.structure || '',
            examples: preparedItem.examples || [],
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch {
        // ignore
      }

      return true;
    } catch (e) {
      console.error('Error saving custom grammar:', e);
      return false;
    }
  }

  /**
   * Update existing custom Grammar by ID
   */
  static async updateCustomGrammar(
    id: string,
    partial: Partial<JlptGrammarItem>,
  ): Promise<boolean> {
    try {
      const current = this.getCustomGrammar();
      const idx = current.findIndex((g) => g.id === id);
      if (idx < 0) return false;

      const updatedItem: JlptGrammarItem = {
        ...current[idx],
        ...partial,
        id, // preserve ID
      };

      current[idx] = updatedItem;
      safeLocalStorage.setJSON(CUSTOM_GRAMMAR_KEY, [...current]);

      try {
        await (supabase.from('custom_grammar') as any)
          .update({
            title: updatedItem.title,
            level: updatedItem.level,
            romaji: updatedItem.romaji,
            meaning_uz: updatedItem.meaningUz,
            structure: updatedItem.structure,
            examples: updatedItem.examples,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch {
        // ignore
      }

      return true;
    } catch (e) {
      console.error('Error updating custom grammar:', e);
      return false;
    }
  }

  /**
   * Delete custom Grammar
   */
  static async deleteCustomGrammar(idOrTitle: string): Promise<boolean> {
    try {
      const current = this.getCustomGrammar();
      const filtered = current.filter((g) => g.id !== idOrTitle && g.title !== idOrTitle);
      safeLocalStorage.setJSON(CUSTOM_GRAMMAR_KEY, filtered);

      try {
        await (supabase.from('custom_grammar') as any)
          .delete()
          .or(`id.eq.${idOrTitle},title.eq.${idOrTitle}`);
      } catch {
        // ignore
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bulk import Grammar items
   */
  static async bulkImportGrammar(items: Partial<JlptGrammarItem>[]): Promise<BulkImportResult> {
    let added = 0;
    let updated = 0;
    let failed = 0;

    const current = this.getCustomGrammar();
    const map = new Map<string, JlptGrammarItem>(current.map((g) => [g.title, g]));
    const toUpsertDb: any[] = [];

    for (const raw of items) {
      if (!raw.title || !raw.title.trim() || !raw.meaningUz || !raw.meaningUz.trim()) {
        failed++;
        continue;
      }

      const patternTitle = raw.title.trim();
      const existing = map.get(patternTitle);
      const isUpdate = !!existing;

      const item: JlptGrammarItem = {
        id: existing
          ? existing.id
          : `custom-g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: patternTitle,
        level: raw.level || 'N5',
        romaji: raw.romaji?.trim() || '',
        meaningUz: raw.meaningUz.trim(),
        structure: raw.structure?.trim() || '',
        examples: Array.isArray(raw.examples) ? raw.examples : [],
      };

      map.set(patternTitle, item);
      if (isUpdate) updated++;
      else added++;

      toUpsertDb.push({
        id: item.id,
        title: item.title,
        level: item.level,
        romaji: item.romaji,
        meaning_uz: item.meaningUz,
        structure: item.structure,
        examples: item.examples,
        updated_at: new Date().toISOString(),
      });
    }

    safeLocalStorage.setJSON(CUSTOM_GRAMMAR_KEY, Array.from(map.values()));

    if (toUpsertDb.length > 0) {
      try {
        await (supabase.from('custom_grammar') as any).upsert(toUpsertDb);
      } catch {
        // ignore
      }
    }

    return { added, updated, failed };
  }

  /**
   * Parse delimited text or JSON for Grammar bulk import
   * Formats supported:
   * 1. JSON string
   * 2. Pipe delimited: Pattern | Level | Romaji | Structure | Meaning
   * 3. Dash delimited: Pattern - Meaning
   */
  static parseGrammarInput(text: string): Partial<JlptGrammarItem>[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Try parsing as JSON first
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.map((item: any) => ({
          title: item.title || item.pattern || item.grammar || '',
          level: parseJlptLevel(item.level),
          romaji: item.romaji || '',
          meaningUz: item.meaningUz || item.meaning_uz || item.meaning || item.tarjima || '',
          structure: item.structure || item.formula || '',
          examples: Array.isArray(item.examples) ? item.examples : [],
        }));
      } catch {
        // Fall back to line parser
      }
    }

    const lines = trimmed.split('\n');
    const result: Partial<JlptGrammarItem>[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        const title = parts[0] || '';
        const level = parseJlptLevel(parts[1]);
        const romaji = parts[2] || '';
        const structure = parts[3] || '';
        const meaningUz = parts[4] || '';

        if (title && meaningUz) {
          result.push({ title, level, romaji, structure, meaningUz, examples: [] });
        }
      } else if (line.includes('-')) {
        const [pattern, meaning] = line.split('-').map((p) => p.trim());
        if (pattern && meaning) {
          result.push({
            title: pattern,
            level: 'N5',
            romaji: '',
            structure: '',
            meaningUz: meaning,
            examples: [],
          });
        }
      } else if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim());
        if (parts[0] && parts[1]) {
          result.push({
            title: parts[0],
            level: parseJlptLevel(parts[2]),
            romaji: parts[3] || '',
            structure: parts[4] || '',
            meaningUz: parts[1],
            examples: [],
          });
        }
      }
    }

    return result;
  }

  /**
   * Export all custom content as a JSON string
   */
  static exportBackupJSON(): string {
    const kanji = this.getCustomKanji();
    const grammar = this.getCustomGrammar();
    const quiz = this.getCustomQuizQuestions();
    const choukai = this.getCustomChoukaiQuestions();
    const dokkai = this.getCustomReadingPassages();
    const payload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      counts: {
        kanji: kanji.length,
        grammar: grammar.length,
        quiz: quiz.length,
        choukai: choukai.length,
        dokkai: dokkai.length,
      },
      kanji,
      grammar,
      quiz,
      choukai,
      dokkai,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import from full JSON backup
   */
  static async importBackupJSON(jsonStr: string): Promise<{
    kanjiResult: BulkImportResult;
    grammarResult: BulkImportResult;
    quizResult: BulkImportResult;
    choukaiResult: BulkImportResult;
    dokkaiResult: BulkImportResult;
  }> {
    try {
      const data = JSON.parse(jsonStr);
      const kanjiList = Array.isArray(data.kanji) ? data.kanji : [];
      const grammarList = Array.isArray(data.grammar) ? data.grammar : [];
      const quizList = Array.isArray(data.quiz) ? data.quiz : [];
      const choukaiList = Array.isArray(data.choukai) ? data.choukai : [];
      const dokkaiList = Array.isArray(data.dokkai) ? data.dokkai : [];

      const kanjiResult = await this.bulkImportKanji(kanjiList);
      const grammarResult = await this.bulkImportGrammar(grammarList);
      const quizResult = await this.bulkImportQuizQuestions(quizList);
      const choukaiResult = await this.bulkImportChoukaiQuestions(choukaiList);
      const dokkaiResult = await this.bulkImportReadingPassages(dokkaiList);

      return { kanjiResult, grammarResult, quizResult, choukaiResult, dokkaiResult };
    } catch {
      return {
        kanjiResult: { added: 0, updated: 0, failed: 0 },
        grammarResult: { added: 0, updated: 0, failed: 0 },
        quizResult: { added: 0, updated: 0, failed: 0 },
        choukaiResult: { added: 0, updated: 0, failed: 0 },
        dokkaiResult: { added: 0, updated: 0, failed: 0 },
      };
    }
  }

  /**
   * Merge base kanji with custom kanji (Strictly Deduplicated)
   */
  static mergeKanji(baseList: JlptKanjiItem[]): JlptKanjiItem[] {
    const custom = this.getCustomKanji();
    const seenKanji = new Set<string>();
    const seenId = new Set<string>();
    const result: JlptKanjiItem[] = [];

    // Custom items take precedence
    for (const item of custom) {
      const char = item.kanji.trim();
      if (!char || seenKanji.has(char) || seenId.has(item.id)) continue;
      seenKanji.add(char);
      seenId.add(item.id);
      result.push(item);
    }

    // Append base items if not already present
    for (const item of baseList) {
      const char = item.kanji.trim();
      if (!char || seenKanji.has(char) || seenId.has(item.id)) continue;
      seenKanji.add(char);
      seenId.add(item.id);
      result.push(item);
    }

    return result;
  }

  /**
   * Merge base grammar with custom grammar (Strictly Deduplicated by ID & Cleaned Title)
   */
  static mergeGrammar(baseList: JlptGrammarItem[]): JlptGrammarItem[] {
    const custom = this.getCustomGrammar();
    const seenId = new Set<string>();
    const seenTitle = new Set<string>();
    const result: JlptGrammarItem[] = [];

    const cleanTitle = (t: string) =>
      t
        .replace(/\s*\([^)]*\)/g, '') // remove (romaji)
        .replace(/[〜~・\s()（）]/g, '')
        .toLowerCase();

    // Custom items take precedence
    for (const item of custom) {
      const key = cleanTitle(item.title);
      if (!key || seenId.has(item.id) || seenTitle.has(key)) continue;
      seenId.add(item.id);
      seenTitle.add(key);
      result.push(item);
    }

    // Append base items if not already present
    for (const item of baseList) {
      const key = cleanTitle(item.title);
      if (!key || seenId.has(item.id) || seenTitle.has(key)) continue;
      seenId.add(item.id);
      seenTitle.add(key);
      result.push(item);
    }

    return result;
  }

  /**
   * Merge base vocab with custom vocab (Strictly Deduplicated by ID & Word+Reading)
   */
  static mergeVocab(baseList: JlptVocabItem[]): JlptVocabItem[] {
    const seenId = new Set<string>();
    const seenWord = new Set<string>();
    const result: JlptVocabItem[] = [];

    for (const item of baseList) {
      const key = `${item.word}_${item.reading}`.toLowerCase();
      if (!item.id || seenId.has(item.id) || seenWord.has(key)) continue;
      seenId.add(item.id);
      seenWord.add(key);
      result.push(item);
    }

    return result;
  }

  // ==================== QUIZ QUESTIONS ====================

  /**
   * Get all custom admin Quiz questions
   */
  static getCustomQuizQuestions(): JlptGrammarQuestion[] {
    try {
      const data = safeLocalStorage.getJSON<JlptGrammarQuestion[]>(CUSTOM_QUIZ_KEY, []);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or insert custom Quiz question
   */
  static async saveCustomQuizQuestion(item: JlptGrammarQuestion): Promise<boolean> {
    try {
      const current = this.getCustomQuizQuestions();
      const existingIdx = current.findIndex(
        (q) =>
          (item.id !== undefined && q.id === item.id) ||
          q.questionText.trim().toLowerCase() === item.questionText.trim().toLowerCase(),
      );

      let updated: JlptGrammarQuestion[];
      const itemId =
        item.id || (existingIdx >= 0 ? current[existingIdx].id : `custom-q-${Date.now()}`);
      const preparedItem: JlptGrammarQuestion = { ...item, id: itemId };

      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = preparedItem;
      } else {
        updated = [preparedItem, ...current];
      }

      safeLocalStorage.setJSON(CUSTOM_QUIZ_KEY, updated);

      try {
        await (supabase.from('custom_quiz_questions') as any).upsert([
          {
            id: preparedItem.id,
            level: preparedItem.level,
            pattern: preparedItem.pattern || '',
            question_text: preparedItem.questionText,
            options: preparedItem.options || [],
            correct_answer: preparedItem.correctAnswer,
            explanation_uzbek: preparedItem.explanationUzbek || '',
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch {
        // Table might not exist or offline
      }

      return true;
    } catch (e) {
      console.error('Error saving custom quiz question:', e);
      return false;
    }
  }

  /**
   * Update existing custom Quiz question by ID
   */
  static async updateCustomQuizQuestion(
    id: number | string,
    partial: Partial<JlptGrammarQuestion>,
  ): Promise<boolean> {
    try {
      const current = this.getCustomQuizQuestions();
      const idx = current.findIndex((q) => q.id === id);
      if (idx < 0) return false;

      const updatedItem: JlptGrammarQuestion = {
        ...current[idx],
        ...partial,
        id,
      };

      current[idx] = updatedItem;
      safeLocalStorage.setJSON(CUSTOM_QUIZ_KEY, [...current]);

      try {
        await (supabase.from('custom_quiz_questions') as any)
          .update({
            level: updatedItem.level,
            pattern: updatedItem.pattern,
            question_text: updatedItem.questionText,
            options: updatedItem.options,
            correct_answer: updatedItem.correctAnswer,
            explanation_uzbek: updatedItem.explanationUzbek,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch {
        // ignore
      }

      return true;
    } catch (e) {
      console.error('Error updating custom quiz question:', e);
      return false;
    }
  }

  /**
   * Delete custom Quiz question
   */
  static async deleteCustomQuizQuestion(id: number | string): Promise<boolean> {
    try {
      const current = this.getCustomQuizQuestions();
      const filtered = current.filter((q) => q.id !== id);
      safeLocalStorage.setJSON(CUSTOM_QUIZ_KEY, filtered);

      try {
        await (supabase.from('custom_quiz_questions') as any).delete().eq('id', id);
      } catch {
        // ignore
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bulk import Quiz items
   */
  static async bulkImportQuizQuestions(
    items: Partial<JlptGrammarQuestion>[],
  ): Promise<BulkImportResult> {
    let added = 0;
    let updated = 0;
    let failed = 0;

    const current = this.getCustomQuizQuestions();
    const map = new Map<string, JlptGrammarQuestion>(
      current.map((q) => [q.questionText.trim().toLowerCase(), q]),
    );
    const toUpsertDb: any[] = [];

    for (const raw of items) {
      if (
        !raw.questionText ||
        !raw.questionText.trim() ||
        !Array.isArray(raw.options) ||
        raw.options.length < 2
      ) {
        failed++;
        continue;
      }

      const qText = raw.questionText.trim();
      const key = qText.toLowerCase();
      const existing = map.get(key);
      const isUpdate = !!existing;

      const item: JlptGrammarQuestion = {
        id: existing
          ? existing.id
          : `custom-q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        level: (['N5', 'N4', 'N3', 'N2', 'N1'].includes(raw.level as any)
          ? raw.level
          : 'N5') as any,
        pattern: raw.pattern?.trim() || '',
        questionText: qText,
        options: raw.options.map((o) => String(o).trim()),
        correctAnswer:
          typeof raw.correctAnswer === 'number' &&
          raw.correctAnswer >= 0 &&
          raw.correctAnswer < raw.options.length
            ? raw.correctAnswer
            : 0,
        explanationUzbek: raw.explanationUzbek?.trim() || '',
      };

      map.set(key, item);
      if (isUpdate) updated++;
      else added++;

      toUpsertDb.push({
        id: item.id,
        level: item.level,
        pattern: item.pattern,
        question_text: item.questionText,
        options: item.options,
        correct_answer: item.correctAnswer,
        explanation_uzbek: item.explanationUzbek,
        updated_at: new Date().toISOString(),
      });
    }

    safeLocalStorage.setJSON(CUSTOM_QUIZ_KEY, Array.from(map.values()));

    if (toUpsertDb.length > 0) {
      try {
        await (supabase.from('custom_quiz_questions') as any).upsert(toUpsertDb);
      } catch {
        // ignore
      }
    }

    return { added, updated, failed };
  }

  /**
   * Parse delimited text or JSON for Quiz bulk import
   */
  static parseQuizInput(text: string): Partial<JlptGrammarQuestion>[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.map((item: any) => ({
          level: parseJlptLevel(item.level),
          pattern: item.pattern || '',
          questionText: item.questionText || item.question_text || item.question || '',
          options: Array.isArray(item.options) ? item.options : [],
          correctAnswer:
            typeof item.correctAnswer === 'number'
              ? item.correctAnswer
              : typeof item.correct_answer === 'number'
                ? item.correct_answer
                : 0,
          explanationUzbek:
            item.explanationUzbek || item.explanation_uzbek || item.explanation || '',
        }));
      } catch {
        // fallback to line parsing
      }
    }

    const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
    const result: Partial<JlptGrammarQuestion>[] = [];

    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('//')) continue;
      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        const qText = parts[0] || '';
        const opts = (parts[1] || '')
          .split(/[,/]/)
          .map((o) => o.trim())
          .filter(Boolean);
        let correctIdx = 0;
        if (parts[2]) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) {
            if (num >= 1 && num <= opts.length && !parts[2].startsWith('0')) {
              correctIdx = num - 1;
            } else if (num >= 0 && num < opts.length) {
              correctIdx = num;
            }
          }
        }
        const expl = parts[3] || '';
        const rawLvl = parts[4]?.toUpperCase();
        const level = parseJlptLevel(rawLvl);
        const pattern = parts[5] || '';

        if (qText && opts.length >= 2) {
          result.push({
            questionText: qText,
            options: opts,
            correctAnswer: correctIdx,
            explanationUzbek: expl,
            level,
            pattern,
          });
        }
      }
    }

    return result;
  }

  /**
   * Merge base quiz questions with custom quiz questions (Strictly Deduplicated)
   */
  static mergeQuizQuestions(baseList: JlptGrammarQuestion[]): JlptGrammarQuestion[] {
    const custom = this.getCustomQuizQuestions();
    const seenId = new Set<string | number>();
    const seenText = new Set<string>();
    const result: JlptGrammarQuestion[] = [];

    const normalize = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();

    // Custom items take precedence
    for (const item of custom) {
      const normText = normalize(item.questionText);
      if (!normText || seenId.has(item.id) || seenText.has(normText)) continue;
      seenId.add(item.id);
      seenText.add(normText);
      result.push(item);
    }

    // Append base items if not already present
    for (const item of baseList) {
      const normText = normalize(item.questionText);
      if (!normText || seenId.has(item.id) || seenText.has(normText)) continue;
      seenId.add(item.id);
      seenText.add(normText);
      result.push(item);
    }

    return result;
  }

  // =========================================================================
  // CHOUKAI (LISTENING) QUESTION CRUD & STORAGE
  // =========================================================================

  /**
   * Get all custom Choukai questions from local storage
   */
  static getCustomChoukaiQuestions(): JlptListeningQuestion[] {
    try {
      const data = safeLocalStorage.getJSON<JlptListeningQuestion[]>(CUSTOM_CHOUKAI_KEY, []);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Add a new custom Choukai listening question
   */
  static async addCustomChoukaiQuestion(
    question: Omit<JlptListeningQuestion, 'id'> & { id?: number | string },
  ): Promise<JlptListeningQuestion> {
    const current = this.getCustomChoukaiQuestions();
    const id =
      question.id || `custom_choukai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newItem: JlptListeningQuestion = {
      ...question,
      id,
    };

    current.unshift(newItem);
    safeLocalStorage.setJSON(CUSTOM_CHOUKAI_KEY, current);

    // Sync to Supabase
    try {
      await (supabase.from('custom_listening_questions') as any).upsert({
        id,
        level: newItem.level,
        type: newItem.type,
        title_uz: newItem.titleUz || '',
        audio_url: newItem.audioUrl || null,
        script: newItem.script,
        question_text: newItem.questionText,
        question_text_uz: newItem.questionTextUz || '',
        options: newItem.options,
        options_uz: newItem.optionsUz || [],
        correct_answer: newItem.correctAnswer,
        explanation_uzbek: newItem.explanationUzbek || '',
        tip_uzbek: newItem.tipUzbek || '',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(
        '[CustomContentService] Supabase choukai insert failed, kept in local storage:',
        e,
      );
    }

    return newItem;
  }

  /**
   * Update existing custom Choukai question
   */
  static async updateCustomChoukaiQuestion(
    id: number | string,
    partial: Partial<JlptListeningQuestion>,
  ): Promise<boolean> {
    try {
      const current = this.getCustomChoukaiQuestions();
      const idx = current.findIndex((q) => q.id === id);
      if (idx < 0) return false;

      const updatedItem: JlptListeningQuestion = {
        ...current[idx],
        ...partial,
        id,
      };

      current[idx] = updatedItem;
      safeLocalStorage.setJSON(CUSTOM_CHOUKAI_KEY, [...current]);

      try {
        await (supabase.from('custom_listening_questions') as any)
          .update({
            level: updatedItem.level,
            type: updatedItem.type,
            title_uz: updatedItem.titleUz || '',
            audio_url: updatedItem.audioUrl || null,
            script: updatedItem.script,
            question_text: updatedItem.questionText,
            question_text_uz: updatedItem.questionTextUz || '',
            options: updatedItem.options,
            options_uz: updatedItem.optionsUz || [],
            correct_answer: updatedItem.correctAnswer,
            explanation_uzbek: updatedItem.explanationUzbek || '',
            tip_uzbek: updatedItem.tipUzbek || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch {
        // ignore offline
      }

      return true;
    } catch (e) {
      console.error('Error updating custom choukai question:', e);
      return false;
    }
  }

  /**
   * Delete custom Choukai question
   */
  static async deleteCustomChoukaiQuestion(id: number | string): Promise<boolean> {
    try {
      const current = this.getCustomChoukaiQuestions();
      const filtered = current.filter((q) => q.id !== id);
      safeLocalStorage.setJSON(CUSTOM_CHOUKAI_KEY, filtered);

      try {
        await (supabase.from('custom_listening_questions') as any).delete().eq('id', id);
      } catch {
        // ignore offline
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bulk import Choukai listening questions
   */
  static async bulkImportChoukaiQuestions(
    questions: JlptListeningQuestion[],
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = { added: 0, updated: 0, failed: 0 };
    for (const q of questions) {
      if (!q.questionText || !q.script) {
        result.failed++;
        continue;
      }
      try {
        await this.addCustomChoukaiQuestion(q);
        result.added++;
      } catch {
        result.failed++;
      }
    }
    return result;
  }

  /**
   * Upload an authentic Choukai audio file to Supabase Storage
   */
  static async uploadChoukaiAudioFile(
    file: File,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `choukai_${Date.now()}_${cleanName}`;

      const { data, error } = await supabase.storage
        .from('listening_audios')
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: true,
          contentType: file.type || 'audio/mpeg',
        });

      if (error) {
        console.warn('[CustomContentService] Storage upload error:', error);
        return { success: false, error: error.message };
      }

      const { data: publicData } = supabase.storage
        .from('listening_audios')
        .getPublicUrl(data.path);

      return { success: true, url: publicData.publicUrl };
    } catch (err: any) {
      console.error('[CustomContentService] Audio upload exception:', err);
      return { success: false, error: err?.message || 'Yuklashda kutilmagan xatolik yuz berdi' };
    }
  }

  /**
   * Merge base Choukai questions with custom Choukai questions (Deduplicated)
   */
  static mergeChoukaiQuestions(baseList: JlptListeningQuestion[]): JlptListeningQuestion[] {
    const custom = this.getCustomChoukaiQuestions();
    const seenId = new Set<string | number>();
    const seenText = new Set<string>();
    const result: JlptListeningQuestion[] = [];

    const normalize = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();

    // Custom items take precedence
    for (const item of custom) {
      const normText = normalize(item.questionText);
      if (!normText || seenId.has(item.id) || seenText.has(normText)) continue;
      seenId.add(item.id);
      seenText.add(normText);
      result.push(item);
    }

    // Append base items if not already present
    for (const item of baseList) {
      const normText = normalize(item.questionText);
      if (!normText || seenId.has(item.id) || seenText.has(normText)) continue;
      seenId.add(item.id);
      seenText.add(normText);
      result.push(item);
    }

    return result;
  }

  // ==================== DOKKAI (READING) PASSAGES ====================

  /**
   * Get all custom admin Dokkai reading passages
   */
  static getCustomReadingPassages(): JlptReadingPassage[] {
    try {
      const data = safeLocalStorage.getJSON<JlptReadingPassage[]>(CUSTOM_DOKKAI_KEY, []);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or update custom Dokkai reading passage
   */
  static async saveCustomReadingPassage(item: JlptReadingPassage): Promise<boolean> {
    try {
      const current = this.getCustomReadingPassages();
      const existingIdx = current.findIndex(
        (p) => p.id === item.id || p.title.trim().toLowerCase() === item.title.trim().toLowerCase(),
      );

      let updated: JlptReadingPassage[];
      const itemId =
        item.id || (existingIdx >= 0 ? current[existingIdx].id : `custom-dokkai-${Date.now()}`);
      const preparedItem: JlptReadingPassage = { ...item, id: itemId };

      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = preparedItem;
      } else {
        updated = [preparedItem, ...current];
      }

      safeLocalStorage.setJSON(CUSTOM_DOKKAI_KEY, updated);

      try {
        await (supabase.from('custom_reading_passages') as any).upsert([
          {
            id: preparedItem.id,
            level: preparedItem.level,
            title: preparedItem.title,
            passage_type: preparedItem.passageType,
            japanese_content: preparedItem.japaneseContent,
            uzbek_translation: preparedItem.uzbekTranslation,
            recommended_time_minutes: preparedItem.recommendedTimeMinutes,
            questions: preparedItem.questions,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch {
        // Safe offline fallback
      }

      return true;
    } catch (e) {
      console.error('Error saving custom reading passage:', e);
      return false;
    }
  }

  /**
   * Delete a custom Dokkai reading passage
   */
  static async deleteCustomReadingPassage(id: string): Promise<boolean> {
    try {
      const current = this.getCustomReadingPassages();
      const filtered = current.filter((p) => p.id !== id);
      safeLocalStorage.setJSON(CUSTOM_DOKKAI_KEY, filtered);

      try {
        await (supabase.from('custom_reading_passages') as any).delete().eq('id', id);
      } catch {
        // Safe offline fallback
      }

      return true;
    } catch (e) {
      console.error('Error deleting custom reading passage:', e);
      return false;
    }
  }

  /**
   * Bulk import Dokkai reading passages
   */
  static async bulkImportReadingPassages(
    passages: JlptReadingPassage[],
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = { added: 0, updated: 0, failed: 0 };
    for (const p of passages) {
      if (!p.title || !p.japaneseContent || !p.level) {
        result.failed++;
        continue;
      }
      const isNew = !this.getCustomReadingPassages().some((existing) => existing.id === p.id);
      const success = await this.saveCustomReadingPassage(p);
      if (success) {
        if (isNew) result.added++;
        else result.updated++;
      } else {
        result.failed++;
      }
    }
    return result;
  }

  /**
   * Merge base reading passages with custom reading passages (Deduplicated, Custom overrides Base by ID or title)
   */
  static getMergedReadingPassages(level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): JlptReadingPassage[] {
    const custom = this.getCustomReadingPassages();
    const seenId = new Set<string>();
    const seenTitle = new Set<string>();
    const result: JlptReadingPassage[] = [];

    const normalize = (t: string) =>
      t
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    // Custom items take precedence
    for (const item of custom) {
      const normTitle = normalize(item.title);
      if (!normTitle || seenId.has(item.id) || seenTitle.has(normTitle)) continue;
      seenId.add(item.id);
      seenTitle.add(normTitle);
      result.push(item);
    }

    // Base items and N1 advanced passages appended if not overridden
    const baseAndN1Passages = [...JLPT_READING_PASSAGES, ...getAllN1ReadingPassages()];
    for (const item of baseAndN1Passages) {
      const normTitle = normalize(item.title);
      if (!normTitle || seenId.has(item.id) || seenTitle.has(normTitle)) continue;
      seenId.add(item.id);
      seenTitle.add(normTitle);
      result.push(item);
    }

    if (level) {
      return result.filter((p) => p.level === level);
    }
    return result;
  }
}
