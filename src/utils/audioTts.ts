/**
 * Web Speech API + Network Fallback Text-to-Speech Pronunciation Helper for Flashcards and UI
 */

import { cleanJapaneseTTS } from './ai/aiCoach';
import { fetchTTSAudioBlob } from '../hooks/useTTS';

let globalAudioPlayer: HTMLAudioElement | null = null;
let globalObjectUrl: string | null = null;

export function stopAllAudio(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (globalAudioPlayer) {
    try {
      globalAudioPlayer.pause();
    } catch {}
    globalAudioPlayer = null;
  }
  if (globalObjectUrl) {
    try {
      URL.revokeObjectURL(globalObjectUrl);
    } catch {}
    globalObjectUrl = null;
  }
}

export function speakJapaneseText(text: string, rate?: number): void {
  speakText(text, 'ja-JP', rate);
}

export function speakText(text: string, accent: string = 'en-US', rate?: number): void {
  stopAllAudio();

  const hasJapaneseChars =
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(text) ||
    accent === 'ja-JP';
  const textToSpeak = hasJapaneseChars
    ? cleanJapaneseTTS(text)
    : text.replace(/[*_#`~]/g, '').trim();

  if (!textToSpeak) return;

  const targetLang = hasJapaneseChars ? 'ja-JP' : accent;
  const isJa = hasJapaneseChars || accent.startsWith('ja');

  const playWebSpeech = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      (typeof (window as any).SpeechSynthesisUtterance === 'undefined' &&
        typeof SpeechSynthesisUtterance === 'undefined')
    )
      return;
    try {
      const UtteranceClass = (window as any).SpeechSynthesisUtterance || SpeechSynthesisUtterance;
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;
      if (voices && voices.length > 0) {
        matchedVoice = voices.find(
          (v) =>
            (v.lang === targetLang || v.lang.startsWith(isJa ? 'ja' : 'en')) &&
            (v.name.includes('Google') ||
              v.name.includes('Kyoko') ||
              v.name.includes('Otoya') ||
              v.name.includes('Haruka') ||
              v.name.includes('Hattori')),
        );

        if (!matchedVoice) {
          matchedVoice = voices.find(
            (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]),
          );
        }
      }

      const utterance = new UtteranceClass(textToSpeak);
      utterance.lang = targetLang;
      utterance.rate = rate ?? (targetLang.startsWith('ja') ? 0.9 : 0.85);
      utterance.pitch = 1.0;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[audioTts] Web Speech error:', err);
    }
  };

  // Helper to play network audio with offline Web Speech fallback
  const playNetworkFallback = async () => {
    try {
      const blob = await fetchTTSAudioBlob(textToSpeak.slice(0, 200), isJa ? 'ja' : 'en');
      if (!blob) {
        playWebSpeech();
        return;
      }

      const url = URL.createObjectURL(blob);
      globalObjectUrl = url;
      const audio = new Audio(url);
      if (rate) audio.playbackRate = rate;
      globalAudioPlayer = audio;
      audio.onended = () => {
        if (globalObjectUrl === url) {
          URL.revokeObjectURL(url);
          globalObjectUrl = null;
        }
        globalAudioPlayer = null;
      };
      audio.onerror = () => {
        if (globalObjectUrl === url) {
          URL.revokeObjectURL(url);
          globalObjectUrl = null;
        }
        globalAudioPlayer = null;
        playWebSpeech();
      };
      audio.play().catch(() => {
        playWebSpeech();
      });
    } catch (e) {
      console.warn('[audioTts] Network fallback error:', e);
      playWebSpeech();
    }
  };

  // For Japanese or when browser synth is unavailable, use High Quality Network Google TTS
  if (isJa || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playNetworkFallback();
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  let matchedVoice = null;
  if (voices && voices.length > 0) {
    matchedVoice = voices.find(
      (v) =>
        (v.lang === targetLang || v.lang.startsWith(isJa ? 'ja' : 'en')) &&
        (v.name.includes('Google') ||
          v.name.includes('Kyoko') ||
          v.name.includes('Otoya') ||
          v.name.includes('Haruka') ||
          v.name.includes('Hattori')),
    );

    if (!matchedVoice) {
      matchedVoice = voices.find(
        (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]),
      );
    }
  }

  // Web Speech API execution with resilient network fallback

  try {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;
    utterance.rate = targetLang.startsWith('ja') ? 0.9 : 0.85;
    utterance.pitch = 1.0;

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    let speakStart = 0;
    utterance.onstart = () => {
      speakStart = Date.now();
    };

    utterance.onend = () => {
      const elapsed = Date.now() - speakStart;
      if (textToSpeak.length > 3 && speakStart > 0 && elapsed < 120) {
        console.warn('[audioTts] Web Speech dropped audio, falling back to network.');
        playNetworkFallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn('[audioTts] Utterance error, falling back to network:', e.error);
      playNetworkFallback();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[audioTts] Exception in speak, falling back to network:', err);
    playNetworkFallback();
  }
}
