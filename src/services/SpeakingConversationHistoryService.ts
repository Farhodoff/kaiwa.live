import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { HistoryService } from './HistoryService';
import { generateUUID } from '../utils/uuid';

export interface SpeakingConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  corrected?: string;
  explanation_uz?: string;
}

export interface SpeakingConversationErrorItem {
  original: string;
  corrected: string;
  explanation_uz: string;
}

export interface SpeakingConversationNewWord {
  word: string;
  reading?: string;
  translation_uz: string;
}

export interface SpeakingConversationSession {
  id: string;
  createdAt: string;
  dateFormatted: string;
  durationSeconds: number;
  durationFormatted: string;
  scenarioTitle: string;
  scenarioId?: string;
  messages: SpeakingConversationMessage[];
  errors: SpeakingConversationErrorItem[];
  newWords: SpeakingConversationNewWord[];
}

const STORAGE_KEY = 'kaiwa_speaking_conversations_v2';

export class SpeakingConversationHistoryService {
  static formatDuration(totalSecs: number): string {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      const months = [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentabr',
        'Oktabr',
        'Noyabr',
        'Dekabr',
      ];
      const day = d.getDate();
      const month = months[d.getMonth()] || '';
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}, ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  }

  static getSessions(): SpeakingConversationSession[] {
    try {
      const data = safeLocalStorage.getJSON<SpeakingConversationSession[]>(STORAGE_KEY, []);
      if (!Array.isArray(data)) return [];
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  static saveSession(params: {
    durationSeconds: number;
    scenarioTitle: string;
    scenarioId?: string;
    messages: SpeakingConversationMessage[];
    newWords: SpeakingConversationNewWord[];
  }): SpeakingConversationSession | null {
    const { durationSeconds, scenarioTitle, scenarioId, messages, newWords } = params;

    // Do NOT save if user never spoke (requirement 7: Foydalanuvchi gapirmagan bo'lsa, bo'sh suhbat saqlanmasin)
    const userSpoke = messages.some((m) => m.role === 'user' && m.content.trim().length > 0);
    if (!userSpoke) {
      return null;
    }

    const now = new Date();
    const isoString = now.toISOString();
    const id = generateUUID();

    // Collect errors from user messages
    const errors: SpeakingConversationErrorItem[] = [];
    messages.forEach((m) => {
      if (m.role === 'user' && m.corrected && m.corrected.trim().length > 0) {
        errors.push({
          original: m.content,
          corrected: m.corrected,
          explanation_uz: m.explanation_uz || '',
        });
      }
    });

    const newSession: SpeakingConversationSession = {
      id,
      createdAt: isoString,
      dateFormatted: this.formatDate(isoString),
      durationSeconds,
      durationFormatted: this.formatDuration(durationSeconds),
      scenarioTitle: scenarioTitle || 'Erkin suhbat',
      scenarioId,
      messages: [...messages],
      errors,
      newWords: [...newWords],
    };

    const existing = this.getSessions();
    const updated = [newSession, ...existing].slice(0, 50); // Keep last 50
    safeLocalStorage.setJSON(STORAGE_KEY, updated);

    // Sync to backend history directly (Server-first with offline queue fallback)
    try {
      HistoryService.saveSpeakingSession({
        id: newSession.id,
        language: 'ja',
        persona: scenarioTitle || 'Yapon tili suhbati',
        durationSeconds,
        fluencyScore: errors.length === 0 ? 9.0 : Math.max(5.0, 9.0 - errors.length * 0.8),
        pronunciationScore: 8.0,
        transcript: JSON.stringify(messages),
        feedback: JSON.stringify({ errors, newWords }),
      }).catch((err) => {
        console.warn('[SpeakingConversationHistoryService] Server save notice:', err);
      });
    } catch (e) {
      console.warn('[SpeakingConversationHistoryService] Sync dispatch error:', e);
    }

    return newSession;
  }

  /**
   * Pulls speaking sessions from the server (multi-device sync)
   * and merges them into localStorage without duplicates.
   */
  static async fetchSessionsFromServer(): Promise<SpeakingConversationSession[]> {
    try {
      const serverSessions = await HistoryService.getSpeakingHistory(50);
      if (!serverSessions || serverSessions.length === 0) {
        return this.getSessions();
      }

      const localSessions = this.getSessions();
      const sessionMap = new Map<string, SpeakingConversationSession>();

      // Populate local first
      localSessions.forEach((s) => sessionMap.set(s.id, s));

      // Merge server records
      serverSessions.forEach((remote) => {
        if (!sessionMap.has(remote.id)) {
          let parsedMessages: SpeakingConversationMessage[] = [];
          let parsedErrors: SpeakingConversationErrorItem[] = [];
          let parsedNewWords: SpeakingConversationNewWord[] = [];

          try {
            if (typeof remote.transcript === 'string' && remote.transcript.startsWith('[')) {
              parsedMessages = JSON.parse(remote.transcript);
            }
          } catch {}

          try {
            if (typeof remote.feedback === 'string' && remote.feedback.startsWith('{')) {
              const fb = JSON.parse(remote.feedback);
              if (fb.errors && Array.isArray(fb.errors)) parsedErrors = fb.errors;
              if (fb.newWords && Array.isArray(fb.newWords)) parsedNewWords = fb.newWords;
            }
          } catch {}

          const reconstructed: SpeakingConversationSession = {
            id: remote.id,
            createdAt: remote.createdAt,
            dateFormatted: this.formatDate(remote.createdAt),
            durationSeconds: remote.durationSeconds || 0,
            durationFormatted: this.formatDuration(remote.durationSeconds || 0),
            scenarioTitle: remote.persona || 'Suhbat',
            messages: parsedMessages,
            errors: parsedErrors,
            newWords: parsedNewWords,
          };
          sessionMap.set(remote.id, reconstructed);
        }
      });

      const merged = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      safeLocalStorage.setJSON(STORAGE_KEY, merged);
      return merged;
    } catch (err) {
      console.warn('[SpeakingConversationHistoryService] fetchSessionsFromServer error:', err);
      return this.getSessions();
    }
  }

  static deleteSession(id: string): void {
    const existing = this.getSessions();
    const updated = existing.filter((s) => s.id !== id);
    safeLocalStorage.setJSON(STORAGE_KEY, updated);
  }

  static clearAll(): void {
    safeLocalStorage.setJSON(STORAGE_KEY, []);
  }
}
