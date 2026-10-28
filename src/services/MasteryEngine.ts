import { SupportedLanguage } from '../types/lesson';
import {
  MasterySkill,
  SkillMastery,
  UserMasteryProfile,
  MasteryTrend,
  MasteryStatus,
} from '../types/mastery';
import {
  LearningEvidence,
  EvidenceCategory,
  resolveCategory,
  computeMasteryImpact,
  LearningActivityType,
} from '../types/learningEvidence';
import { LearningSignalService } from './LearningSignalService';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { supabase } from '../lib/supabase';
import { toDeterministicUUID, generateUUID } from '../utils/uuid';

/** Phase 19: canonical unified evidence record (alias of LearningEvidence). */
export type EvidenceRecord = LearningEvidence;

/**
 * Phase 19 — Centralized, deterministic mastery configuration.
 * All thresholds are defined here; no magic numbers are scattered in logic.
 */
export const MASTERY_CONFIG = {
  /** score < weakThreshold → weak */
  weakThreshold: 50,
  /** score >= proficientThreshold → proficient (unless mastered) */
  proficientThreshold: 70,
  /** score >= masteredThreshold → mastered */
  masteredThreshold: 85,
  /** retention rate (0-100) required for delayed-recall validation. Must match kamchilik.md. */
  retentionThreshold: 80,
  /** mastered additionally requires confidence >= this value */
  masteredMinConfidence: 40,
  /** max evidence records kept per user+language */
  maxEvidenceRecords: 100,
  /** recency decay begins after this many inactive days */
  recencyDecayStartDays: 14,
  /** decay % per day past the start threshold */
  recencyDecayPerDay: 0.5,
  /** maximum recency decay (percentage points) */
  recencyDecayMax: 20,
  /** score floor after penalties/decay */
  minFloorScore: 10,
  /** avg-score difference that marks improving/declining trend */
  trendDelta: 5,
  /** minimum evidence samples required to compute a trend */
  minTrendSamples: 3,
  /** confidence gained per evidence record */
  confidencePerEvidence: 12,
  /** hard confidence ceiling */
  maxConfidence: 100,
  /** mastery score penalty per recorded mistake */
  mistakePenaltyPerMistake: 5,
  /** maximum mistake penalty (percentage points) */
  mistakePenaltyMax: 25,
};

/**
 * Map a score (+ confidence) to the canonical mastery status ladder.
 */
export function statusForScore(score: number, confidence: number): MasteryStatus {
  if (
    score >= MASTERY_CONFIG.masteredThreshold &&
    confidence >= MASTERY_CONFIG.masteredMinConfidence
  ) {
    return 'mastered';
  }
  if (score >= MASTERY_CONFIG.proficientThreshold) return 'proficient';
  if (score >= MASTERY_CONFIG.weakThreshold) return 'developing';
  return 'weak';
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeEvidence(
  userId: string,
  language: SupportedLanguage,
  record: EvidenceRecord,
  skillsList: MasterySkill[],
): EvidenceRecord | null {
  if (!record || !record.skill || !record.timestamp) return null;
  if (!skillsList.includes(record.skill)) return null;

  const recordUserId = record.userId || userId || 'guest';
  const recordLanguage = record.language || language;

  // Never let evidence written through one user/language bucket mutate another user's or language's mastery.
  if (recordUserId !== (userId || 'guest') || recordLanguage !== language) return null;

  const category = resolveCategory(record);
  const score = clampScore(record.score);

  return {
    ...record,
    userId: recordUserId,
    language: recordLanguage,
    score,
    accuracy: typeof record.accuracy === 'number' ? clampScore(record.accuracy) : undefined,
    attempts:
      typeof record.attempts === 'number' && Number.isFinite(record.attempts)
        ? Math.max(1, Math.round(record.attempts))
        : record.attempts,
    category,
    type: category,
    masteryImpact: computeMasteryImpact(record.activityType, score, category),
  };
}

export const MasteryEngine = {
  /**
   * Get the authoritative list of skills for the specified language.
   */
  getSkillsForLanguage(language: SupportedLanguage): MasterySkill[] {
    if (language === 'ja') {
      return ['vocabulary', 'kanji', 'grammar', 'reading', 'listening', 'speaking'];
    }
    return ['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking'];
  },

  /**
   * Phase 19 — Return mastery for a single skill (language-isolated).
   */
  getSkillMastery(
    userId: string = 'guest',
    language: SupportedLanguage = 'en',
    skill: MasterySkill,
  ): SkillMastery {
    const profile = this.calculateMasteryProfile(userId, language);
    return (
      profile.skills[skill] || {
        skill,
        score: 0,
        confidence: 0,
        evidenceCount: 0,
        trend: 'stable',
        status: 'not_started',
        explanation: '',
      }
    );
  },

  /**
   * Retrieve local evidence history for a user and language.
   */
  getUserEvidence(userId: string = 'guest', language: SupportedLanguage = 'en'): EvidenceRecord[] {
    const key = `study_planner_mastery_evidence_${userId}_${language}`;
    const records = safeLocalStorage.getJSON<EvidenceRecord[]>(key, []);
    return Array.isArray(records) ? records : [];
  },

  /**
   * Record a new piece of skill evidence (e.g. quiz result, SRS review, AI evaluation).
   * Implements deterministic idempotency: if an evidence record with the same ID/eventId already exists, it is skipped.
   */
  recordEvidence(
    userId: string = 'guest',
    language: SupportedLanguage,
    record: EvidenceRecord,
  ): void {
    this.recordEvidenceInternal(userId, language, record, false);
  },

  /**
   * Record evidence by stable ID, replacing the previous record with the same ID.
   * Used for lesson completion/result evidence where repeating a lesson must not inflate mastery,
   * but the latest valid result should be reflected.
   */
  upsertEvidence(
    userId: string = 'guest',
    language: SupportedLanguage,
    record: EvidenceRecord,
  ): void {
    this.recordEvidenceInternal(userId, language, record, true);
  },

  recordEvidenceInternal(
    userId: string = 'guest',
    language: SupportedLanguage,
    record: EvidenceRecord,
    replaceExisting: boolean,
  ): void {
    const activeUserId = userId || 'guest';
    const key = `study_planner_mastery_evidence_${activeUserId}_${language}`;
    const existing = this.getUserEvidence(activeUserId, language);
    const skillsList = this.getSkillsForLanguage(language);
    const normalized = normalizeEvidence(activeUserId, language, record, skillsList);

    if (!normalized) {
      console.warn('[MasteryEngine] Rejected invalid or cross-scope mastery evidence.');
      return;
    }

    const recId = normalized.id || normalized.eventId;
    const existingIndex = recId
      ? existing.findIndex((e) => e.id === recId || e.eventId === recId)
      : -1;

    if (existingIndex >= 0) {
      if (replaceExisting) {
        existing[existingIndex] = normalized;
      }
      // Default deterministic idempotency: duplicate IDs are skipped.
      if (!replaceExisting) return;
    } else {
      existing.push(normalized);
    }

    if (existing.length > MASTERY_CONFIG.maxEvidenceRecords) {
      existing.splice(0, existing.length - MASTERY_CONFIG.maxEvidenceRecords);
    }
    safeLocalStorage.setJSON(key, existing);

    // Async write to Supabase
    if (activeUserId && activeUserId !== 'guest') {
      const rawId = normalized.id || normalized.eventId || generateUUID();
      const uuid = toDeterministicUUID(rawId);
      const promise = supabase.from('mastery_evidence').upsert({
        id: uuid,
        user_id: activeUserId,
        language: language,
        skill: normalized.skill,
        activity_type: normalized.activityType || 'quiz',
        lesson_id: normalized.lessonId || null,
        score: normalized.score,
        accuracy: normalized.accuracy ?? null,
        attempts: normalized.attempts ?? null,
        timestamp: normalized.timestamp,
        mastery_impact: normalized.masteryImpact ?? 0,
        category: resolveCategory(normalized),
        source: normalized.source || null,
        details: normalized.details || null,
        metadata: normalized.metadata || {},
      });
      if (promise && typeof promise.then === 'function') {
        promise.then(({ error }) => {
          if (error) {
            console.warn('[MasteryEngine] Failed to write evidence to Supabase:', error);
          }
        });
      }
    }
  },

  /**
   * Phase 19 — Canonical evidence entry point.
   * Derives category and mastery impact deterministically, then records.
   */
  recordEvent(
    userId: string = 'guest',
    language: SupportedLanguage,
    event: LearningEvidence,
  ): void {
    const category: EvidenceCategory = resolveCategory(event);
    const record: LearningEvidence = {
      ...event,
      userId: event.userId || userId,
      language: event.language || language,
      category,
      masteryImpact:
        event.masteryImpact ?? computeMasteryImpact(event.activityType, event.score, category),
      type: category === 'completion' ? 'completion' : 'performance',
    };
    this.recordEvidence(userId, language, record);
  },

  /**
   * Record multiple pieces of skill evidence in batch with idempotency deduplication.
   */
  recordEvidenceBatch(
    userId: string = 'guest',
    language: SupportedLanguage,
    records: EvidenceRecord[],
  ): void {
    if (!records || records.length === 0) return;
    for (const rec of records) {
      this.recordEvidence(userId, language, rec);
    }
  },

  /**
   * Calculate trend from chronological evidence scores.
   */
  calculateTrend(evidence: EvidenceRecord[]): MasteryTrend {
    if (evidence.length < MASTERY_CONFIG.minTrendSamples) {
      return 'stable';
    }

    const mid = Math.floor(evidence.length / 2);
    const firstHalf = evidence.slice(0, mid);
    const secondHalf = evidence.slice(mid);

    const avg1 = firstHalf.reduce((sum, e) => sum + e.score, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((sum, e) => sum + e.score, 0) / secondHalf.length;

    const diff = avg2 - avg1;
    if (diff >= MASTERY_CONFIG.trendDelta) return 'improving';
    if (diff <= -MASTERY_CONFIG.trendDelta) return 'declining';
    return 'stable';
  },

  /**
   * Apply time-based recency decay if inactive for more than 14 days.
   */
  applyRecencyDecay(baseScore: number, lastUpdatedAt?: string, now: Date = new Date()): number {
    if (!lastUpdatedAt) return baseScore;
    const lastTime = new Date(lastUpdatedAt).getTime();
    const diffDays = Math.floor((now.getTime() - lastTime) / (1000 * 60 * 60 * 24));

    if (diffDays > MASTERY_CONFIG.recencyDecayStartDays) {
      const decay = Math.min(
        MASTERY_CONFIG.recencyDecayMax,
        Math.floor(
          (diffDays - MASTERY_CONFIG.recencyDecayStartDays) * MASTERY_CONFIG.recencyDecayPerDay,
        ),
      );
      return Math.max(MASTERY_CONFIG.minFloorScore, baseScore - decay);
    }

    return baseScore;
  },

  /**
   * Compute Mastery for a single skill.
   */
  computeSkillMastery(
    skill: MasterySkill,
    evidence: EvidenceRecord[],
    language: SupportedLanguage,
    supplementary?: { srsRetention?: number; mistakeCount?: number },
  ): SkillMastery {
    const isJa = language === 'ja';
    const performanceEvidence = evidence.filter((e) => resolveCategory(e) !== 'completion');
    const performanceCount = performanceEvidence.length;
    const totalCount = evidence.length;

    if (performanceCount === 0) {
      // Handle cold start with fallback signals if available
      // Phase 8.10: SRS retention seeds Vocabulary AND Kanji (primary JLPT deck skills)
      if (
        (skill === 'vocabulary' || skill === 'kanji') &&
        typeof supplementary?.srsRetention === 'number' &&
        supplementary.srsRetention > 0
      ) {
        const srsScore = supplementary.srsRetention;
        // Phase 19 thresholds: <50 weak, 50-69 developing, 70-84 proficient, 85+ mastered
        const srsStatus: MasteryStatus = statusForScore(srsScore, MASTERY_CONFIG.maxConfidence);
        return {
          skill,
          score: srsScore,
          confidence: 30,
          evidenceCount: totalCount || 1,
          trend: 'stable',
          status: srsStatus,
          explanation: isJa
            ? `SRS fleshkartalarning o'rtacha o'zlashtirish darajasi: ${srsScore}%.`
            : `SRS flashcard average retention: ${srsScore}%.`,
        };
      }

      return {
        skill,
        score: 0,
        confidence: 0,
        evidenceCount: totalCount,
        trend: 'stable',
        status: 'not_started',
        explanation: isJa
          ? `Ushbu ko'nikma bo'yicha hali mashqlar bajarilmagan.`
          : `No practice activity recorded for this skill yet.`,
      };
    }

    // Weighted Average of Performance Evidence (recent evidence weighted more)
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 0; i < performanceEvidence.length; i++) {
      const weight = 1 + i / performanceEvidence.length; // 1.0 to 2.0
      weightedSum += performanceEvidence[i].score * weight;
      totalWeight += weight;
    }

    let rawScore = Math.round(weightedSum / totalWeight);

    // Account for recent mistakes count penalty
    if (supplementary?.mistakeCount && supplementary.mistakeCount > 0) {
      rawScore = Math.max(
        MASTERY_CONFIG.minFloorScore,
        rawScore -
          Math.min(
            MASTERY_CONFIG.mistakePenaltyMax,
            supplementary.mistakeCount * MASTERY_CONFIG.mistakePenaltyPerMistake,
          ),
      );
    }

    const lastRecord = performanceEvidence[performanceEvidence.length - 1];
    const finalScore = this.applyRecencyDecay(rawScore, lastRecord?.timestamp);
    const confidence = Math.min(
      MASTERY_CONFIG.maxConfidence,
      Math.round(totalCount * MASTERY_CONFIG.confidencePerEvidence),
    ); // All activity builds confidence
    const trend = this.calculateTrend(performanceEvidence);

    // Phase 19 canonical thresholds:
    //   < 50  → weak
    //  50–69  → developing
    //  70–84  → proficient
    //   85+   → mastered (requires confidence >= 40 to prevent premature promotion)
    let status: MasteryStatus = 'not_started';
    status = statusForScore(finalScore, confidence);

    const explanation = isJa
      ? `${totalCount} ta natija asosida hisoblandi. Ko'rsatkich: ${finalScore}%, ishonchlilik: ${confidence}%.`
      : `Computed from ${totalCount} evidence points. Skill score: ${finalScore}%, confidence: ${confidence}%.`;

    return {
      skill,
      score: finalScore,
      confidence,
      evidenceCount: totalCount,
      lastUpdatedAt: lastRecord?.timestamp,
      trend,
      status,
      explanation,
    };
  },

  /**
   * Generate the complete UserMasteryProfile.
   */
  calculateMasteryProfile(
    userId: string = 'guest',
    language: SupportedLanguage = 'en',
    supplementary?: { srsRetention?: number },
  ): UserMasteryProfile {
    const skillsList = this.getSkillsForLanguage(language);
    const allEvidence = this.getUserEvidence(userId, language).filter(
      (e) => (e.userId || userId) === userId && (e.language || language) === language,
    );
    const allSignals = LearningSignalService.getSignalsForUser(userId);
    const signals = allSignals.filter((s) => s.userId === userId && s.language === language);

    // Count mistakes by skill if inferred from signals
    const skillMistakes: Record<string, number> = {};
    for (const sig of signals) {
      if (sig.type === 'incorrect_answer' || sig.type === 'repeated_error') {
        const explicitSkill = (sig as any).skill as string | undefined;
        if (explicitSkill && skillsList.includes(explicitSkill as MasterySkill)) {
          skillMistakes[explicitSkill] = (skillMistakes[explicitSkill] || 0) + 1;
        } else {
          const topic = ('prompt' in sig ? sig.prompt || '' : '').toLowerCase();
          if (topic.includes('grammar') || topic.includes('inversion') || topic.includes('verb')) {
            skillMistakes['grammar'] = (skillMistakes['grammar'] || 0) + 1;
          } else if (topic.includes('kanji')) {
            skillMistakes['kanji'] = (skillMistakes['kanji'] || 0) + 1;
          } else if (topic.includes('listening')) {
            skillMistakes['listening'] = (skillMistakes['listening'] || 0) + 1;
          } else if (topic.includes('reading')) {
            skillMistakes['reading'] = (skillMistakes['reading'] || 0) + 1;
          } else {
            skillMistakes['vocabulary'] = (skillMistakes['vocabulary'] || 0) + 1;
          }
        }
      }
    }

    const skills: Record<string, SkillMastery> = {};
    let totalScoreSum = 0;
    let totalConfidenceSum = 0;
    let activeSkillCount = 0;

    for (const skill of skillsList) {
      const skillEvidence = allEvidence.filter((e) => e.skill === skill);
      const mastery = this.computeSkillMastery(skill, skillEvidence, language, {
        srsRetention: supplementary?.srsRetention,
        mistakeCount: skillMistakes[skill] || 0,
      });
      skills[skill] = mastery;

      if (mastery.evidenceCount > 0) {
        totalScoreSum += mastery.score;
        totalConfidenceSum += mastery.confidence;
        activeSkillCount++;
      }
    }

    const overallMasteryScore =
      activeSkillCount > 0 ? Math.round(totalScoreSum / activeSkillCount) : 0;
    const overallConfidence =
      activeSkillCount > 0 ? Math.round(totalConfidenceSum / activeSkillCount) : 0;

    return {
      userId,
      language,
      skills,
      topWeaknesses: [], // Will be populated by WeaknessEngine
      topStrengths: [], // Will be populated by WeaknessEngine
      overallMasteryScore,
      overallConfidence,
      lastCalculatedAt: new Date().toISOString(),
    };
  },

  /**
   * Synchronize mastery evidence records from Supabase database.
   * Performs a one-time migration if database is empty but local storage has evidence data.
   */
  async syncEvidenceFromDB(userId: string, language: SupportedLanguage): Promise<void> {
    if (!userId || userId === 'guest') return;

    try {
      // 1. Fetch from Supabase DB
      const { data: dbEvidence, error } = await supabase
        .from('mastery_evidence')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language);

      if (error) {
        console.warn('[MasteryEngine] Failed to fetch evidence from DB:', error);
        return;
      }

      // 2. Read legacy localStorage cache
      const cacheKey = `study_planner_mastery_evidence_${userId}_${language}`;
      const localEvidence = safeLocalStorage.getJSON<EvidenceRecord[]>(cacheKey, []);

      // 3. If DB is empty, migrate local data to DB
      if ((!dbEvidence || dbEvidence.length === 0) && localEvidence.length > 0) {
        console.log('[MasteryEngine] DB is empty. Migrating legacy local evidence to DB...');
        const dbPayloads = localEvidence.map((item) => {
          const rawId = item.id || item.eventId || generateUUID();
          const uuid = toDeterministicUUID(rawId);
          return {
            id: uuid,
            user_id: userId,
            language: language,
            skill: item.skill,
            activity_type: item.activityType || 'quiz',
            lesson_id: item.lessonId || null,
            score: item.score,
            accuracy: item.accuracy ?? null,
            attempts: item.attempts ?? null,
            timestamp: item.timestamp,
            mastery_impact: item.masteryImpact ?? 0,
            category: resolveCategory(item),
            source: item.source || null,
            details: item.details || null,
            metadata: item.metadata || {},
          };
        });

        const { error: insertError } = await supabase
          .from('mastery_evidence')
          .upsert(dbPayloads, { onConflict: 'id', ignoreDuplicates: true });

        if (insertError) {
          console.error('[MasteryEngine] Migration to DB failed:', insertError);
        } else {
          console.log('[MasteryEngine] Migration of legacy local evidence complete.');
        }
        return;
      }

      // 4. Map DB evidence back to Client EvidenceRecord format
      const mappedDbEvidence: EvidenceRecord[] = (dbEvidence || []).map((row) => ({
        id: row.id,
        eventId: row.id,
        userId: row.user_id,
        language: row.language as SupportedLanguage,
        skill: row.skill as MasterySkill,
        lessonId: row.lesson_id || undefined,
        activityType: row.activity_type as LearningActivityType,
        score: Number(row.score),
        accuracy: row.accuracy !== null ? Number(row.accuracy) : undefined,
        attempts: row.attempts !== null ? Number(row.attempts) : undefined,
        timestamp: row.timestamp,
        masteryImpact: Number(row.mastery_impact),
        category: row.category as EvidenceCategory,
        source: row.source || undefined,
        details: row.details || undefined,
        metadata: row.metadata || undefined,
        type: row.category === 'completion' ? 'completion' : 'performance',
      }));

      // 5. Merge DB and Local records
      const mergedMap = new Map<string, EvidenceRecord>();
      for (const item of mappedDbEvidence) {
        const itemKey = item.id || item.eventId;
        if (itemKey) mergedMap.set(itemKey, item);
      }
      for (const item of localEvidence) {
        const itemKey = item.id || item.eventId;
        if (itemKey && !mergedMap.has(itemKey)) {
          mergedMap.set(itemKey, item);
          const rawId = item.id || item.eventId || generateUUID();
          const uuid = toDeterministicUUID(rawId);
          const promise = supabase.from('mastery_evidence').upsert(
            {
              id: uuid,
              user_id: userId,
              language: language,
              skill: item.skill,
              activity_type: item.activityType || 'quiz',
              lesson_id: item.lessonId || null,
              score: item.score,
              accuracy: item.accuracy ?? null,
              attempts: item.attempts ?? null,
              timestamp: item.timestamp,
              mastery_impact: item.masteryImpact ?? 0,
              category: resolveCategory(item),
              source: item.source || null,
              details: item.details || null,
              metadata: item.metadata || {},
            },
            { onConflict: 'id', ignoreDuplicates: true },
          );
          if (promise && typeof promise.then === 'function') {
            promise.then(() => {});
          }
        }
      }

      const finalMerged = Array.from(mergedMap.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-MASTERY_CONFIG.maxEvidenceRecords);

      safeLocalStorage.setJSON(cacheKey, finalMerged);
    } catch (e) {
      console.warn('[MasteryEngine] Sync error:', e);
    }
  },
};
