/**
 * JlptTimingConfigService
 *
 * Manages official JLPT section timing configuration per level (N5-N1),
 * with Supabase persistence and local storage fallback caching.
 */

import { supabase } from '../lib/supabase';
import { isUserAdmin } from '../utils/admin';
import {
  JlptLevel,
  JlptTimingBlockConfig,
  JlptTimingConfig,
  getDefaultTimingConfig,
  normalizeTimingConfig,
} from '../utils/jlptExamTiming';

const TIMING_CONFIG_CACHE_KEY = 'jlpt_timing_config_cache_v1';
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface TimingConfigRow {
  level: JlptLevel;
  config: unknown;
}

function readCache(): JlptTimingConfig {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(TIMING_CONFIG_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(config: JlptTimingConfig): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TIMING_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {}
}

export const JlptTimingConfigService = {
  getCachedConfig(): JlptTimingConfig {
    return readCache();
  },

  /** Loads all level overrides. Falls back to the local cache, then defaults. */
  async loadConfig(): Promise<JlptTimingConfig> {
    try {
      const { data, error } = await supabase
        .from('jlpt_timing_configs')
        .select('level, config')
        .in('level', LEVELS);

      if (error) throw error;

      const loaded: JlptTimingConfig = {};
      ((data || []) as TimingConfigRow[]).forEach((row) => {
        const normalized = normalizeTimingConfig(
          row.level,
          Array.isArray(row.config) ? (row.config as JlptTimingBlockConfig[]) : null,
        );
        if (normalized) loaded[row.level] = normalized;
      });
      writeCache(loaded);
      return loaded;
    } catch (error) {
      const cached = readCache();
      if (Object.keys(cached).length > 0) return cached;
      if (import.meta.env.DEV) {
        console.warn('JlptTimingConfigService: using built-in timing defaults', error);
      }
      return {};
    }
  },

  async getLevelConfig(level: JlptLevel): Promise<JlptTimingBlockConfig[]> {
    const all = await this.loadConfig();
    return all[level] || getDefaultTimingConfig(level);
  },

  async saveLevelConfig(
    level: JlptLevel,
    config: JlptTimingBlockConfig[],
    user?: unknown,
  ): Promise<JlptTimingBlockConfig[]> {
    if (!isUserAdmin(user)) {
      throw new Error('Faqat adminlar JLPT vaqt konfiguratsiyasini o‘zgartira oladi.');
    }

    const normalized = normalizeTimingConfig(level, config);
    if (!normalized) {
      throw new Error('Vaqt konfiguratsiyasi bo‘sh yoki noto‘g‘ri.');
    }

    const { error } = await supabase.from('jlpt_timing_configs').upsert(
      {
        level,
        config: normalized,
        updated_by: (user as { id?: string })?.id || null,
      },
      { onConflict: 'level' },
    );

    if (error) throw error;

    const cached = readCache();
    cached[level] = normalized;
    writeCache(cached);
    return normalized;
  },

  async resetLevelConfig(level: JlptLevel): Promise<JlptTimingBlockConfig[]> {
    const defaults = getDefaultTimingConfig(level);
    const cached = readCache();
    cached[level] = defaults;
    writeCache(cached);
    return defaults;
  },
};
