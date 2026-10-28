import { ConversationScenario, ScenarioSessionResult } from '../components/speaking/scenarioTypes';
import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';
import { MINNA_SCENARIOS } from '../data/minnaScenarios';
import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const CUSTOM_SCENARIOS_KEY = 'kaiwa_live_custom_scenarios';
const DELETED_SCENARIOS_KEY = 'kaiwa_live_deleted_scenarios';
const SCENARIO_HISTORY_PREFIX = 'kaiwa_live_scenario_history:';
let _cachedScenarios: ConversationScenario[] | null = null;

const getHistoryKey = (userId?: string | null): string => {
  return `${SCENARIO_HISTORY_PREFIX}${userId || 'anon'}`;
};

const getDeletedIds = (): string[] => {
  try {
    const local =
      typeof window !== 'undefined' ? safeLocalStorage.getItem(DELETED_SCENARIOS_KEY) : null;
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

export class ScenarioService {
  // 0. Synchronous instant getters for 0ms initial render (stale-while-revalidate)
  static getImmediateScenarios(): ConversationScenario[] {
    if (_cachedScenarios && _cachedScenarios.length > 0) {
      return _cachedScenarios;
    }
    let customScenarios: ConversationScenario[] = [];
    try {
      const local =
        typeof window !== 'undefined' ? safeLocalStorage.getItem(CUSTOM_SCENARIOS_KEY) : null;
      if (local) {
        customScenarios = JSON.parse(local);
      }
    } catch {
      // ignore
    }
    const deletedIds = new Set(getDeletedIds());
    _cachedScenarios = [...DEFAULT_SCENARIOS, ...MINNA_SCENARIOS, ...customScenarios].filter(
      (s) => !deletedIds.has(s.id),
    );
    return _cachedScenarios;
  }

  static getImmediateHistory(userId?: string | null): ScenarioSessionResult[] {
    try {
      if (typeof window === 'undefined') return [];
      const key = getHistoryKey(userId);
      const local =
        safeLocalStorage.getItem(key) ||
        (userId ? safeLocalStorage.getItem('kaiwa_live_scenario_history') : null);
      if (local) {
        return JSON.parse(local);
      }
    } catch {
      // ignore
    }
    return [];
  }

  // 1. Get all scenarios (Default + Custom Admin Scenarios)
  static async getScenarios(): Promise<ConversationScenario[]> {
    let customScenarios: ConversationScenario[] = [];
    try {
      const local =
        typeof window !== 'undefined' ? safeLocalStorage.getItem(CUSTOM_SCENARIOS_KEY) : null;
      if (local) {
        customScenarios = JSON.parse(local);
      }
    } catch (e) {
      console.error('Error reading custom scenarios from local storage:', e);
    }

    // Try syncing from Supabase if table exists
    try {
      const { data, error } = await supabase.from('scenarios').select('*');
      if (!error && data && data.length > 0) {
        const dbScenarios: ConversationScenario[] = data.map((item) => ({
          id: item.id,
          language: item.language || (item.title_ja ? 'ja' : item.title_en ? 'en' : 'ja'),
          title_ja: item.title_ja,
          title_en: item.title_en,
          title_uz: item.title_uz,
          emoji: item.emoji || '🗣️',
          difficulty: item.difficulty || (item.title_ja || item.language === 'ja' ? 'N5' : 'B1'),
          category: item.category || 'daily',
          description_uz: item.description_uz || '',
          opening_line_ja: item.opening_line_ja,
          opening_line_en: item.opening_line_en,
          context_prompt: item.context_prompt,
          key_phrases: Array.isArray(item.key_phrases) ? item.key_phrases : [],
          is_custom: true,
          created_at: item.created_at,
        }));

        // Merge unique custom scenarios
        const merged = [...customScenarios];
        for (const dbS of dbScenarios) {
          if (!merged.some((m) => m.id === dbS.id)) {
            merged.push(dbS);
          }
        }
        customScenarios = merged;
        safeLocalStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(customScenarios));
      }
    } catch (e) {
      // Table might not exist yet; gracefully fallback
    }

    const deletedIds = new Set(getDeletedIds());
    _cachedScenarios = [...DEFAULT_SCENARIOS, ...MINNA_SCENARIOS, ...customScenarios].filter(
      (s) => !deletedIds.has(s.id),
    );
    return _cachedScenarios;
  }

  // 2. Add or Update Custom Scenario (Admin)
  static async saveScenario(scenario: ConversationScenario): Promise<void> {
    _cachedScenarios = null;
    // Also remove from deleted set if re-saving
    try {
      const deleted = getDeletedIds().filter((id) => id !== scenario.id);
      safeLocalStorage.setItem(DELETED_SCENARIOS_KEY, JSON.stringify(deleted));
    } catch {
      // ignore
    }

    let customScenarios: ConversationScenario[] = [];
    try {
      const local = safeLocalStorage.getItem(CUSTOM_SCENARIOS_KEY);
      if (local) {
        customScenarios = JSON.parse(local);
      }
    } catch (e) {
      console.error(e);
    }

    const index = customScenarios.findIndex((s) => s.id === scenario.id);
    if (index >= 0) {
      customScenarios[index] = scenario;
    } else {
      customScenarios.push(scenario);
    }

    safeLocalStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(customScenarios));

    // Sync to Supabase table asynchronously
    try {
      await supabase.from('scenarios').upsert({
        id: scenario.id,
        language: scenario.language || (scenario.title_ja ? 'ja' : 'en'),
        title_ja: scenario.title_ja || null,
        title_en: scenario.title_en || null,
        title_uz: scenario.title_uz,
        emoji: scenario.emoji,
        difficulty:
          scenario.difficulty || (scenario.title_ja || scenario.language === 'ja' ? 'N5' : 'B1'),
        category: scenario.category,
        description_uz: scenario.description_uz,
        opening_line_ja: scenario.opening_line_ja || null,
        opening_line_en: scenario.opening_line_en || null,
        context_prompt: scenario.context_prompt,
        key_phrases: scenario.key_phrases,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase scenario sync omitted:', e);
    }
  }

  // 3. Delete Custom Scenario (Admin)
  static async deleteScenario(id: string): Promise<void> {
    _cachedScenarios = null;
    // Track deleted id
    try {
      const deleted = getDeletedIds();
      if (!deleted.includes(id)) {
        deleted.push(id);
        safeLocalStorage.setItem(DELETED_SCENARIOS_KEY, JSON.stringify(deleted));
      }
    } catch {
      // ignore
    }

    let customScenarios: ConversationScenario[] = [];
    try {
      const local = safeLocalStorage.getItem(CUSTOM_SCENARIOS_KEY);
      if (local) {
        customScenarios = JSON.parse(local);
      }
    } catch (e) {
      console.error(e);
    }

    customScenarios = customScenarios.filter((s) => s.id !== id);
    safeLocalStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(customScenarios));

    try {
      await supabase.from('scenarios').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase scenario delete error:', e);
    }
  }

  // 4. Save Session Evaluation Result
  static async saveSessionResult(
    result: ScenarioSessionResult,
    explicitUserId?: string | null,
  ): Promise<void> {
    let userId = explicitUserId || null;
    let userEmail = 'student@kaiwa.live';

    try {
      if (!userId) {
        const sessionRes = await supabase.auth.getSession();
        const sessionUser = sessionRes?.data?.session?.user;
        userId = sessionUser?.id || null;
        userEmail = sessionUser?.email || 'student@kaiwa.live';
      }
    } catch {
      // guest
    }

    const key = getHistoryKey(userId);
    let history: ScenarioSessionResult[] = [];
    try {
      if (typeof window !== 'undefined') {
        const local = safeLocalStorage.getItem(key);
        if (local) {
          history = JSON.parse(local);
        }
      }
    } catch (e) {
      console.error(e);
    }

    history.unshift(result);
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
    }

    if (userId && userId !== 'guest' && userId !== 'anonymous') {
      try {
        const payload: any = {
          user_id: userId,
          user_email: userEmail,
          language: (result as any).language || 'ja',
          topic: result.scenario_title || 'Umumiy suhbat',
          scenario_id: result.scenario_id || 'general_speaking',
          persona_title: result.scenario_title || 'AI Coach',
          fluency_score: result.fluency_score || 80,
          vocabulary_score: result.vocabulary_score || 80,
          grammar_score: result.grammar_score || 80,
          pronunciation_score: result.pronunciation_score || 80,
          overall_score: result.overall_score || 80,
          duration_seconds: result.duration_seconds || 0,
          feedback: result.ai_feedback || '',
          ai_feedback: result.ai_feedback || '',
          transcript: result.transcript || [],
          created_at: result.created_at || new Date().toISOString(),
        };

        // Only attach id if it does not contain invalid string prefix
        if (result.id && !result.id.startsWith('session-')) {
          payload.id = result.id;
        }

        if (result.audio_path) {
          payload.audio_path = result.audio_path;
        }

        const { error: insertErr } = await supabase.from('speaking_sessions').insert(payload);

        if (insertErr) {
          if (insertErr.message.includes('audio_path')) {
            delete payload.audio_path;
            await supabase.from('speaking_sessions').insert(payload);
          } else {
            console.warn(
              '[ScenarioService] speaking_sessions DB insert notice:',
              insertErr.message,
            );
          }
        }

        // 2. Legacy table fallback insertion
        await supabase.from('coach_sessions').insert({
          user_id: userId,
          persona_title: result.scenario_title || 'AI Coach',
          fluency_score: result.fluency_score || 80,
          vocabulary_score: result.vocabulary_score || 80,
          grammar_score: result.grammar_score || 80,
          pronunciation_score: result.pronunciation_score || 80,
          duration_seconds: result.duration_seconds || 0,
          feedback: result.ai_feedback || '',
          created_at: result.created_at || new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase session history insert notice:', e);
      }
    }
  }

  // 5. Get Learning History
  static async getScenarioHistory(
    explicitUserId?: string | null,
  ): Promise<ScenarioSessionResult[]> {
    let userId = explicitUserId || null;

    try {
      if (!userId) {
        if (typeof supabase.auth?.getSession === 'function') {
          const { data: sessionData } = await supabase.auth.getSession();
          userId = sessionData?.session?.user?.id || null;
        }
        if (!userId && typeof supabase.auth?.getUser === 'function') {
          const { data: userData } = await supabase.auth.getUser();
          userId = userData?.user?.id || null;
        }
      }
    } catch {
      // guest
    }

    const history = ScenarioService.getImmediateHistory(userId);

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('speaking_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const dbHistory: ScenarioSessionResult[] = data.map((item) => ({
            id: item.id || `sc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            scenario_id: item.scenario_id || 'custom',
            scenario_title: item.persona_title || item.scenario_title || 'Ssenariy',
            duration_seconds: item.duration_seconds || 0,
            overall_score: item.overall_score || 0,
            fluency_score: item.fluency_score || 0,
            vocabulary_score: item.vocabulary_score || 0,
            grammar_score: item.grammar_score || 0,
            pronunciation_score: item.pronunciation_score || 0,
            ai_feedback: item.feedback || item.ai_feedback || '',
            key_phrases_used: Array.isArray(item.key_phrases_used) ? item.key_phrases_used : [],
            key_phrases_missed: Array.isArray(item.key_phrases_missed)
              ? item.key_phrases_missed
              : [],
            transcript: item.transcript || [],
            created_at: item.created_at,
          }));
          const dbTimes = new Set(dbHistory.map((h) => h.created_at));
          const merged = [...dbHistory, ...history.filter((h) => !dbTimes.has(h.created_at))].slice(
            0,
            50,
          );
          if (typeof window !== 'undefined') {
            safeLocalStorage.setItem(getHistoryKey(userId), JSON.stringify(merged));
          }
          return merged;
        }
      } catch (e) {
        console.warn('Scenario history fetch from DB notice:', e);
      }
    }

    return history;
  }
}
