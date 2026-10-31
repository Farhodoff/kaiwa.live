import { PERSONAS_BY_LANG, CoachPersona } from './PersonaSelector';
import React from 'react';

export type { CoachPersona };
export { PERSONAS_BY_LANG };

export interface CoachCorrection {
  hasError: boolean;
  original?: string;
  corrected?: string;
  explanation?: string;
}

export interface CoachVocabularyItem {
  word: string;
  reading?: string;
  meaning: string;
  example?: string;
  partOfSpeech?: string;
  level?: string;
}

export interface CoachChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  romaji?: string;
  translation?: string;
  showTranslation?: boolean;
  isTranslating?: boolean;
  isEditing?: boolean;
  ttsText?: string;
  correction?: CoachCorrection | null;
  corrected?: string;
  explanation_uz?: string;
  new_words?: { word: string; reading?: string; translation_uz: string }[];
  vocabulary?: CoachVocabularyItem[];
}

export interface CoachPersonaItem {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }> | any;
  color: string;
  gradientBg?: string;
  desc?: string;
  badge?: string;
  emoji?: string;
}
