export interface ConversationScenario {
  id: string;
  language?: 'en' | 'ja';
  title_ja?: string; // e.g. "レストラン"
  title_en?: string; // e.g. "US Embassy Visa Interview"
  title_uz: string; // e.g. "Restoran" / "AQSH elchixonasi viza suhbati"
  emoji: string; // e.g. "🍣" / "🇺🇸"
  difficulty: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'IELTS';
  category: 'daily' | 'business' | 'travel' | 'social' | 'academic';
  description_uz: string; // e.g. "Restoranda ovqat buyurtma qilish va to'lov qilish suhbati"
  opening_line_ja?: string; // Coach initial message in Japanese
  opening_line_en?: string; // Coach initial message in English
  context_prompt: string; // Prompt for AI system instruction
  key_phrases: string[]; // Expected key vocabulary/phrases
  is_custom?: boolean; // Created by admin
  created_at?: string;
}

export interface ScenarioSessionResult {
  id: string;
  scenario_id: string;
  scenario_title: string;
  pronunciation_score: number; // 0-100
  fluency_score: number; // 0-100
  grammar_score: number; // 0-100
  vocabulary_score: number; // 0-100
  overall_score: number; // 0-100
  duration_seconds: number;
  user_audio_url?: string; // Recorded blob URL for playback
  audio_path?: string; // Storage relative path (e.g. user_id/session_id.webm)
  audio_url?: string; // Storage URL / audio path
  ai_feedback: string;
  key_phrases_used: string[];
  key_phrases_missed: string[];
  transcript?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    translation?: string;
  }>;
  created_at: string;
}
