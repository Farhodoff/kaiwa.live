/**
 * ListeningAudioSyncService.ts
 * Real-time Speech-to-Script Audio Synchronization & Karaoke Subtitles Engine for JLPT Choukai.
 * Provides line-by-line playback orchestration, multi-speaker voice pitch control (male/female),
 * sentence jumping, and loop/shadowing capabilities.
 */

import { DialogueLine } from '../data/jlpt/listening_data';
import { cleanJapaneseTTS } from '../utils/ai';
import { stopAllAudio } from '../utils/audioTts';

export type SpeakerGender = 'male' | 'female' | 'neutral';

export interface LineTimeSegment {
  start: number;
  end: number;
}

export interface DialoguePlaybackState {
  isPlaying: boolean;
  currentLineIndex: number;
  totalLines: number;
  speed: number;
  isLoopingLine: boolean;
}

export interface SequentialPlaybackController {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  jumpToLine: (index: number) => void;
  prevLine: () => void;
  nextLine: () => void;
  setLooping: (isLooping: boolean) => void;
  getCurrentIndex: () => number;
}

export class ListeningAudioSyncService {
  /**
   * Automatically parses raw script text into structured DialogueLine elements
   */
  static parseScriptToDialogue(script: string): DialogueLine[] {
    const lines: DialogueLine[] = [];
    const rawLines = script.split('\n');
    let idx = 1;

    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      let speaker = 'ナレーション';
      let speakerRoleUz = 'Boshlovchi';
      let gender: SpeakerGender = 'neutral';
      let text = trimmed;

      if (trimmed.includes('：')) {
        const parts = trimmed.split('：');
        speaker = parts[0].trim();
        text = parts.slice(1).join('：').trim();
      } else if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        speaker = parts[0].trim();
        text = parts.slice(1).join(':').trim();
      }

      if (
        [
          '男',
          '男の人',
          '男性',
          '男の学生',
          '男子学生',
          '息子',
          '彼',
          '山田',
          '田中',
          '鈴木',
          '課長',
          '部長',
          '社長',
          '役員',
          'チーフ',
        ].includes(speaker)
      ) {
        gender = 'male';
        speakerRoleUz = 'Erkak / Xodim';
      } else if (
        [
          '女',
          '女の人',
          '女性',
          '女の学生',
          '女子学生',
          '母',
          '母親',
          '彼女',
          '佐藤',
          '住人',
          '女性社員',
        ].includes(speaker)
      ) {
        gender = 'female';
        speakerRoleUz = 'Ayol';
      } else if (
        [
          '先生',
          '教授',
          '講師',
          '学者',
          '有識者',
          '評論家',
          '弁護士',
          '専門家',
          '研究者',
          '医師',
          '医者',
        ].includes(speaker)
      ) {
        gender = 'male';
        speakerRoleUz = "Mutaxassis / O'qituvchi";
      } else if (['学生', '生徒'].includes(speaker)) {
        gender = 'neutral';
        speakerRoleUz = 'Talaba';
      } else if (
        ['店員', '店長', '係員', '係の人', 'フロント', '薬剤師', 'ガイド', '看護師'].includes(
          speaker,
        )
      ) {
        gender = 'neutral';
        speakerRoleUz = 'Xodim / Sotuvchi';
      } else if (['アナウンサー', 'アナウンス', '司会', 'リポーター'].includes(speaker)) {
        gender = 'neutral';
        speakerRoleUz = "E'lon / Diktor";
      } else if (speaker === 'あなた') {
        gender = 'neutral';
        speakerRoleUz = 'Siz';
      }

      lines.push({
        id: `line_${idx++}`,
        speaker,
        speakerRoleUz,
        gender,
        japanese: text,
      });
    }

    return lines;
  }

  /**
   * Returns gender-specific voice pitch for natural multi-speaker dialogues
   */
  static getPitchForGender(gender: SpeakerGender): number {
    switch (gender) {
      case 'male':
        return 0.85; // Deep, masculine pitch
      case 'female':
        return 1.18; // Higher feminine pitch
      default:
        return 1.0; // Standard neutral announcer pitch
    }
  }

  /**
   * Synthesizes and plays a single dialogue line with custom pitch and speed
   */
  static playLine(
    line: DialogueLine,
    speed: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void,
  ): SpeechSynthesisUtterance | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.();
      return null;
    }

    stopAllAudio();
    window.speechSynthesis.cancel();

    const cleanText = cleanJapaneseTTS(line.japanese);
    if (!cleanText) {
      onEnd?.();
      return null;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = Math.max(0.6, Math.min(1.8, speed));
    utterance.pitch = this.getPitchForGender(line.gender || 'neutral');

    // Match Japanese voice with speaker gender if available
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const jaVoices = voices.filter((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
        if (jaVoices.length > 0) {
          const gender = line.gender || 'neutral';
          let matchedVoice: SpeechSynthesisVoice | undefined;
          if (gender === 'male') {
            matchedVoice = jaVoices.find(
              (v) =>
                v.name.includes('Otoya') ||
                v.name.includes('Hattori') ||
                v.name.includes('Male') ||
                v.name.includes('Ichiro') ||
                v.name.includes('Keita'),
            );
          } else if (gender === 'female') {
            matchedVoice = jaVoices.find(
              (v) =>
                v.name.includes('Kyoko') ||
                v.name.includes('Haruka') ||
                v.name.includes('Female') ||
                v.name.includes('Ayumi') ||
                v.name.includes('Nanami'),
            );
          }
          utterance.voice = matchedVoice || jaVoices[0];
        }
      }
    } catch {}

    let hasEnded = false;
    let watchdogTimer: any = null;

    const safeEnd = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      onEnd?.();
    };

    utterance.onstart = () => {
      // Calculate realistic max duration: 350ms per character divided by speed + 2.5s buffer
      const estimatedDurationMs = Math.max(2500, (cleanText.length * 350) / speed);
      watchdogTimer = setTimeout(() => {
        console.warn('[ListeningAudioSyncService] Watchdog timer fired for line utterance');
        safeEnd();
      }, estimatedDurationMs + 2500);

      onStart?.();
    };

    utterance.onend = () => {
      safeEnd();
    };

    utterance.onerror = (e) => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      console.warn('[ListeningAudioSyncService] Line utterance error:', e);
      onError?.();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  /**
   * Pre-warms or unlocks Web SpeechSynthesis on user gesture
   */
  static unlockSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        silent.lang = 'ja-JP';
        window.speechSynthesis.speak(silent);
      } catch {}
    }
  }

  /**
   * Plays the full dialogue sequentially, emitting real-time line index changes
   */
  static startSequentialPlayback(
    lines: DialogueLine[],
    options: {
      startIndex?: number;
      speed?: number;
      isLoopingLine?: boolean;
      onLineStart: (lineIndex: number) => void;
      onStateChange: (isPlaying: boolean) => void;
      onComplete: () => void;
    },
  ): SequentialPlaybackController {
    let currentIndex = options.startIndex ?? 0;
    let isStopped = false;
    let isPaused = false;
    let speed = options.speed ?? 1.0;
    let isLooping = options.isLoopingLine ?? false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const playNext = () => {
      if (isStopped) return;
      if (currentIndex < 0) currentIndex = 0;
      if (currentIndex >= lines.length) {
        options.onStateChange(false);
        options.onComplete();
        return;
      }

      const currentLine = lines[currentIndex];
      options.onLineStart(currentIndex);
      options.onStateChange(true);

      this.playLine(
        currentLine,
        speed,
        () => {},
        () => {
          if (isStopped) return;
          if (isLooping) {
            // Replay same line
            timeoutId = setTimeout(playNext, 300);
          } else {
            currentIndex++;
            timeoutId = setTimeout(playNext, 400); // 400ms natural conversational pause between speakers
          }
        },
        () => {
          if (isStopped) return;
          currentIndex++;
          playNext();
        },
      );
    };

    playNext();

    const controller: SequentialPlaybackController = {
      stop: () => {
        isStopped = true;
        if (timeoutId) clearTimeout(timeoutId);
        stopAllAudio();
        options.onStateChange(false);
      },
      pause: () => {
        isPaused = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.pause();
        }
        options.onStateChange(false);
      },
      resume: () => {
        if (isPaused && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          isPaused = false;
          window.speechSynthesis.resume();
          options.onStateChange(true);
        } else {
          isPaused = false;
          playNext();
        }
      },
      setSpeed: (newSpeed: number) => {
        speed = newSpeed;
      },
      jumpToLine: (index: number) => {
        if (isStopped) return;
        if (timeoutId) clearTimeout(timeoutId);
        stopAllAudio();
        currentIndex = Math.max(0, Math.min(lines.length - 1, index));
        playNext();
      },
      prevLine: () => {
        controller.jumpToLine(currentIndex - 1);
      },
      nextLine: () => {
        controller.jumpToLine(currentIndex + 1);
      },
      setLooping: (loop: boolean) => {
        isLooping = loop;
      },
      getCurrentIndex: () => currentIndex,
    };

    return controller;
  }

  /**
   * Calculates precise time segments (start, end) for each dialogue line.
   * If lines have explicit startTime and endTime, those are respected.
   * Otherwise, calculates proportional segmentation based on Japanese phonetic/mora length,
   * natural conversational gaps between speakers, and audio duration.
   */
  static calculateLineTimeSegments(
    lines: Array<{ japanese: string; startTime?: number; endTime?: number }>,
    totalDuration: number = 0,
  ): LineTimeSegment[] {
    if (!lines || lines.length === 0) return [];

    // Check if ALL lines have explicit timestamps
    const allExplicit = lines.every(
      (l) => typeof l.startTime === 'number' && typeof l.endTime === 'number',
    );
    if (allExplicit) {
      return lines.map((l) => ({
        start: l.startTime!,
        end: l.endTime!,
      }));
    }

    // If total duration is unknown, missing, or zero, estimate realistic seconds
    if (!totalDuration || isNaN(totalDuration) || totalDuration <= 0) {
      let currentSec = 0.5; // slight initial lead-in
      return lines.map((l) => {
        if (typeof l.startTime === 'number' && typeof l.endTime === 'number') {
          return { start: l.startTime, end: l.endTime };
        }
        const textLen = l.japanese.replace(/[\s\n。、！？,.!?]/g, '').length;
        const lineDuration = Math.max(1.8, Math.min(8.0, textLen * 0.18 + 0.6));
        const seg: LineTimeSegment = {
          start: Math.round(currentSec * 100) / 100,
          end: Math.round((currentSec + lineDuration) * 100) / 100,
        };
        currentSec += lineDuration + 0.4; // 400ms inter-line gap
        return seg;
      });
    }

    // Proportionally distribute based on mora/character weights across available totalDuration
    // JLPT & Minna audio usually has a 1.2s - 2.5s lead-in for chimes or narrator prompt
    const leadIn = totalDuration >= 12 ? Math.min(2.5, totalDuration * 0.08) : 0.6;
    const tailOut = Math.min(1.5, totalDuration * 0.05);
    const availableDialogueTime = Math.max(1.0, totalDuration - leadIn - tailOut);

    // Calculate line weights
    const weights = lines.map((l: any) => {
      const lineStr = (l.japanese || l.text || '').toString();
      const cleanLen = lineStr.replace(/[\s\n。、！？,.!?]/g, '').length;
      return Math.max(5, cleanLen);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const pausePerLine =
      lines.length > 1 ? Math.min(0.45, (availableDialogueTime * 0.15) / (lines.length - 1)) : 0;
    const netSpeakingTime = Math.max(
      0.5,
      availableDialogueTime - pausePerLine * (lines.length - 1),
    );

    let currentSec = leadIn;
    const segments: LineTimeSegment[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (typeof line.startTime === 'number' && typeof line.endTime === 'number') {
        segments.push({
          start: line.startTime,
          end: line.endTime,
        });
        currentSec = line.endTime + pausePerLine;
      } else {
        const lineDuration = (weights[i] / totalWeight) * netSpeakingTime;
        const start = Math.round(currentSec * 100) / 100;
        const end = Math.min(totalDuration, Math.round((currentSec + lineDuration) * 100) / 100);
        segments.push({ start, end });
        currentSec = end + pausePerLine;
      }
    }

    return segments;
  }

  /**
   * Determines the currently active dialogue line index given the playback currentTime.
   * Handles inter-line pauses smoothly to avoid subtitle flicker.
   */
  static getActiveLineIndex(
    lines: Array<{ japanese: string; startTime?: number; endTime?: number }>,
    currentTime: number,
    totalDuration: number = 0,
  ): number | null {
    if (!lines || lines.length === 0) return null;

    const segments = this.calculateLineTimeSegments(lines, totalDuration);
    if (segments.length === 0) return null;

    // If currentTime is before the first segment
    if (currentTime < segments[0].start) {
      return 0;
    }

    // Find matching segment
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (currentTime >= seg.start && currentTime <= seg.end) {
        return i;
      }

      // Check if currentTime is in the brief pause between this line and the next line
      if (i < segments.length - 1) {
        const nextSeg = segments[i + 1];
        if (currentTime > seg.end && currentTime < nextSeg.start) {
          // Mid-gap: remain on current line until 60% of the gap has elapsed, then anticipate next line
          const midPoint = seg.end + (nextSeg.start - seg.end) * 0.6;
          return currentTime >= midPoint ? i + 1 : i;
        }
      }
    }

    // If currentTime is past the last segment, remain on last line until complete
    if (currentTime >= segments[segments.length - 1].end) {
      return segments.length - 1;
    }

    return null;
  }

  /**
   * Gets the start timestamp in seconds for a specific line index to enable instant seek
   */
  static getLineStartTime(
    lines: Array<{ japanese: string; startTime?: number; endTime?: number }>,
    lineIndex: number,
    totalDuration: number = 0,
  ): number {
    if (!lines || lineIndex < 0 || lineIndex >= lines.length) return 0;
    const segments = this.calculateLineTimeSegments(lines, totalDuration);
    return segments[lineIndex]?.start ?? 0;
  }

  /**
   * Formats seconds into MM:SS display format
   */
  static formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

export default ListeningAudioSyncService;
