import { supabase } from '../lib/supabase';
import { toDeterministicUUID } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export interface MigrationSummary {
  speakingSessions: number;
  diagnosticResults: number;
  speakingErrors: number;
  studySessions: number;
  learningGoals: number;
}

export class DataMigrationService {
  private static isMigrating = false;

  /**
   * Scans all local storage keys and syncs unsaved data into Supabase PostgreSQL.
   */
  public static async migrateAllLocalDataToDB(userId: string): Promise<MigrationSummary> {
    const summary: MigrationSummary = {
      speakingSessions: 0,
      diagnosticResults: 0,
      speakingErrors: 0,
      studySessions: 0,
      learningGoals: 0,
    };

    if (!userId || userId === 'guest' || userId === 'local_user' || this.isMigrating) {
      return summary;
    }

    this.isMigrating = true;

    try {
      // 1. Migrate Speaking Coach & Scenario Sessions
      summary.speakingSessions = await this.migrateSpeakingSessions(userId);

      // 2. Migrate Diagnostic Results
      summary.diagnosticResults = await this.migrateDiagnosticResults(userId);

      // 3. Migrate Error Vault (Mistake Bank)
      summary.speakingErrors = await this.migrateSpeakingErrors(userId);

      // 4. Migrate Study / Focus Sessions
      summary.studySessions = await this.migrateStudySessions(userId);

      // 5. Migrate Personal Goals
      summary.learningGoals = await this.migratePersonalGoals(userId);

      if (Object.values(summary).some((v) => v > 0)) {
        console.info(
          '[DataMigrationService] Successfully migrated local data to Supabase DB:',
          summary,
        );
      }
    } catch (err) {
      console.warn('[DataMigrationService] Migration notice:', err);
    } finally {
      this.isMigrating = false;
    }

    return summary;
  }

  /**
   * Migrates speaking coach sessions and scenario history to `speaking_sessions` table
   */
  private static async migrateSpeakingSessions(userId: string): Promise<number> {
    let count = 0;
    const sessionsToInsert: any[] = [];

    if (typeof window === 'undefined') return 0;

    try {
      // A. study_planner_speaking_coach_sessions
      const rawCoach = localStorage.getItem('study_planner_speaking_coach_sessions');
      if (rawCoach) {
        const parsed = JSON.parse(rawCoach);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const rawId = item.id || `coach_${item.createdAt || item.created_at || Date.now()}`;
            sessionsToInsert.push({
              id: toDeterministicUUID(String(rawId)),
              user_id: userId,
              persona_title: item.personaTitle || item.persona || 'Speaking Muloqot',
              topic: item.personaTitle || item.persona || 'Speaking Muloqot',
              fluency_score: Number(item.fluencyScore || item.fluency_score) || 0,
              pronunciation_score: Number(item.pronunciationScore || item.pronunciation_score) || 0,
              grammar_score: Number(item.grammarScore || item.grammar_score) || 0,
              vocabulary_score: Number(item.vocabularyScore || item.vocabulary_score) || 0,
              overall_score:
                Number(
                  item.overallScore ||
                    item.overall_score ||
                    item.fluencyScore ||
                    item.fluency_score,
                ) || 0,
              duration_seconds: Number(item.durationSeconds || item.duration_seconds) || 120,
              feedback: item.feedback || '',
              ai_feedback: item.feedback || '',
              transcript: Array.isArray(item.transcript) ? item.transcript : [],
              language: item.language || 'ja',
              created_at: item.createdAt || item.created_at || new Date().toISOString(),
            });
          }
        }
      }

      // B. Scoped scenario histories
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('study_planner_scenario_history_') ||
            k.startsWith('study_planner_speaking_history_'))
        ) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  const rawId = item.id || `sc_${item.created_at || item.createdAt || Date.now()}`;
                  sessionsToInsert.push({
                    id: toDeterministicUUID(String(rawId)),
                    user_id: userId,
                    scenario_id: item.scenario_id,
                    persona_title: item.scenario_title || item.persona_title || 'Ssenariy Muloqot',
                    topic: item.scenario_title || item.persona_title || 'Ssenariy Muloqot',
                    fluency_score: Number(item.fluency_score || item.fluencyScore) || 0,
                    pronunciation_score:
                      Number(item.pronunciation_score || item.pronunciationScore) || 0,
                    grammar_score: Number(item.grammar_score || item.grammarScore) || 0,
                    vocabulary_score: Number(item.vocabulary_score || item.vocabularyScore) || 0,
                    overall_score: Number(item.overall_score || item.overallScore) || 0,
                    duration_seconds: Number(item.duration_seconds || item.durationSeconds) || 120,
                    feedback: item.ai_feedback || item.feedback || '',
                    ai_feedback: item.ai_feedback || item.feedback || '',
                    transcript: Array.isArray(item.transcript) ? item.transcript : [],
                    language: item.language || 'ja',
                    created_at: item.created_at || item.createdAt || new Date().toISOString(),
                  });
                }
              }
            } catch {}
          }
        }
      }

      // Deduplicate by ID
      const uniqueMap = new Map<string, any>();
      sessionsToInsert.forEach((s) => uniqueMap.set(s.id, s));
      const uniqueList = Array.from(uniqueMap.values());

      if (uniqueList.length > 0) {
        const { error } = await supabase
          .from('speaking_sessions')
          .upsert(uniqueList, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) {
          count = uniqueList.length;
        }
      }
    } catch (e) {
      console.warn('[DataMigrationService] speaking sessions migration notice:', e);
    }

    return count;
  }

  /**
   * Migrates local diagnostic test results to `diagnostic_results` table
   */
  private static async migrateDiagnosticResults(userId: string): Promise<number> {
    let count = 0;
    const resultsToInsert: any[] = [];

    if (typeof window === 'undefined') return 0;

    try {
      const languages = ['ja', 'en'];
      for (const lang of languages) {
        const key = `study_planner_diag_result_${userId}_${lang}`;
        const raw =
          localStorage.getItem(key) ||
          localStorage.getItem(`study_planner_diag_result_guest_${lang}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.overallScore === 'number') {
              const resultId = parsed.id
                ? toDeterministicUUID(String(parsed.id))
                : toDeterministicUUID(`diag_${userId}_${lang}_${parsed.completedAt || Date.now()}`);
              resultsToInsert.push({
                id: resultId,
                user_id: userId,
                language: lang,
                score: parsed.overallScore,
                estimated_level: parsed.diagnosticLevel || parsed.recommendedStartLevel || 'A1',
                confidence: parsed.overallConfidence || 0,
                weaknesses: parsed.weaknesses || [],
                strengths: parsed.strengths || [],
                breakdown: parsed.skills || {},
                created_at: parsed.completedAt || new Date().toISOString(),
              });
            }
          } catch {}
        }
      }

      if (resultsToInsert.length > 0) {
        const { error } = await supabase
          .from('diagnostic_results')
          .upsert(resultsToInsert, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) {
          count = resultsToInsert.length;
        }
      }
    } catch (e) {
      console.warn('[DataMigrationService] diagnostic migration notice:', e);
    }

    return count;
  }

  /**
   * Migrates error vault mistakes to `speaking_errors` table
   */
  private static async migrateSpeakingErrors(userId: string): Promise<number> {
    let count = 0;
    if (typeof window === 'undefined') return 0;

    try {
      const raw = localStorage.getItem('study_planner_error_vault');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const payloads = parsed.map((item) => ({
            id: toDeterministicUUID(String(item.id || item.verbatim)),
            user_id: userId,
            language: item.language || 'ja',
            verbatim: item.verbatim,
            correction: item.correction,
            explanation: item.explanation || '',
            category: item.category || 'grammar',
            times_reviewed: item.timesReviewed || 0,
            created_at: item.timestamp || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error } = await supabase
            .from('speaking_errors')
            .upsert(payloads, { onConflict: 'id', ignoreDuplicates: true });
          if (!error) {
            count = payloads.length;
          }
        }
      }
    } catch (e) {
      console.warn('[DataMigrationService] error vault migration notice:', e);
    }

    return count;
  }

  /**
   * Migrates cached study sessions to `study_sessions` table
   */
  private static async migrateStudySessions(userId: string): Promise<number> {
    let count = 0;
    try {
      const cached = safeLocalStorage.getJSON<any[]>('study_planner_sessions_cache', []);
      if (cached && cached.length > 0) {
        const payloads = cached.map((s) => ({
          id: toDeterministicUUID(String(s.id)),
          user_id: userId,
          duration: s.duration || 0,
          type: s.type || 'focus',
          completed: !!s.completed,
          mood_before: s.moodBefore || undefined,
          mood_after: s.moodAfter || undefined,
          subject_id: s.subjectId || undefined,
          start_time: s.startTime || new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('study_sessions')
          .upsert(payloads, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) {
          count = payloads.length;
        }
      }
    } catch (e) {
      console.warn('[DataMigrationService] study sessions migration notice:', e);
    }

    return count;
  }

  /**
   * Migrates personal learning goals to `learning_goals` table
   */
  private static async migratePersonalGoals(userId: string): Promise<number> {
    let count = 0;
    if (typeof window === 'undefined') return 0;

    try {
      const goalsToInsert: any[] = [];
      const langs = ['ja', 'en'];

      for (const lang of langs) {
        const key = `study_planner_personal_goal_${userId}_${lang}`;
        const raw =
          localStorage.getItem(key) ||
          localStorage.getItem(`study_planner_personal_goal_guest_${lang}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.targetLevel) {
              goalsToInsert.push({
                id: parsed.id
                  ? toDeterministicUUID(String(parsed.id))
                  : toDeterministicUUID(`goal_${userId}_${lang}`),
                user_id: userId,
                language: lang,
                target_level: parsed.targetLevel,
                goal_type: parsed.goalType || (lang === 'ja' ? 'jlpt' : 'ielts'),
                daily_study_minutes: parsed.dailyStudyMinutes || 30,
                target_exam_date: parsed.targetExamDate || null,
                created_at: parsed.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          } catch {}
        }
      }

      if (goalsToInsert.length > 0) {
        const { error } = await supabase
          .from('learning_goals')
          .upsert(goalsToInsert, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) {
          count = goalsToInsert.length;
        }
      }
    } catch (e) {
      console.warn('[DataMigrationService] personal goals migration notice:', e);
    }

    return count;
  }
}
