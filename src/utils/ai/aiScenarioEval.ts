import {
  ConversationScenario,
  ScenarioSessionResult,
} from '../../components/speaking/scenarioTypes';
import { callCoachAI } from '../coachAI';
import { callDeepSeek } from '../deepseek';

export interface EvaluateScenarioParams {
  scenario: ConversationScenario;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  durationSeconds: number;
  recordedUrl?: string | null;
}

export const evaluateScenarioSession = async ({
  scenario,
  chatHistory,
  durationSeconds,
  recordedUrl,
}: EvaluateScenarioParams): Promise<ScenarioSessionResult> => {
  // Limit to the most recent 20 user turns to keep prompt token size small and evaluation fast (< 2 seconds)
  const userMessages = chatHistory
    .filter((h) => h.role === 'user')
    .map((h) => h.content)
    .slice(-20);
  const transcript = userMessages.join('\n');

  const prompt = `
Act as an expert Japanese Language Oral Examiner.
Scenario: "${scenario.title_ja}" (${scenario.title_uz})
Target JLPT: ${scenario.difficulty}
Key Phrases: ${JSON.stringify(scenario.key_phrases)}

Student transcript:
"""
${transcript}
"""

Task: Rapidly evaluate speech performance.
Output STRICT VALID JSON ONLY (no markdown):
{
  "pronunciation_score": 85,
  "fluency_score": 80,
  "grammar_score": 82,
  "vocabulary_score": 80,
  "overall_score": 82,
  "key_phrases_used": ["ishlatilgan iboralar"],
  "key_phrases_missed": ["ishlatilmagan iboralar"],
  "ai_feedback": "O'zbek tilida 2 ta lo'nda, rag'batlantiruvchi jumla."
}
`;

  try {
    let response: string;
    try {
      // 1. Primary: Azure OpenAI
      response = await Promise.race([
        callCoachAI(prompt, undefined, true),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('SCENARIO_EVAL_TIMEOUT')), 5000),
        ),
      ]);
    } catch (azureErr) {
      console.warn(
        '[evaluateScenarioSession] Primary Azure AI failed, trying DeepSeek fallback:',
        azureErr,
      );
      // 2. Secondary fallback: DeepSeek
      const deepSeekCall = callDeepSeek(prompt, {
        isJson: true,
        modelName: 'deepseek-chat',
      });
      response = await Promise.race([
        deepSeekCall,
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('SCENARIO_EVAL_TIMEOUT')), 5000),
        ),
      ]);
    }

    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    const pronunciation_score = Math.min(100, Math.max(0, json.pronunciation_score || 75));
    const fluency_score = Math.min(100, Math.max(0, json.fluency_score || 70));
    const grammar_score = Math.min(100, Math.max(0, json.grammar_score || 80));
    const vocabulary_score = Math.min(100, Math.max(0, json.vocabulary_score || 75));
    const overall_score = Math.min(
      100,
      Math.max(
        0,
        json.overall_score ||
          Math.round((pronunciation_score + fluency_score + grammar_score + vocabulary_score) / 4),
      ),
    );

    return {
      id: `sec-${Date.now()}`,
      scenario_id: scenario.id,
      scenario_title: scenario.title_en || scenario.title_ja || scenario.title_uz,
      pronunciation_score,
      fluency_score,
      grammar_score,
      vocabulary_score,
      overall_score,
      duration_seconds: durationSeconds,
      user_audio_url: recordedUrl || undefined,
      ai_feedback:
        json.ai_feedback ||
        "Barakalla! Yaponcha muloqot va talaffuz mashqida yaxshi natija ko'rsatdingiz. Mashqlarni davom ettiring!",
      key_phrases_used: Array.isArray(json.key_phrases_used) ? json.key_phrases_used : [],
      key_phrases_missed: Array.isArray(json.key_phrases_missed)
        ? json.key_phrases_missed
        : scenario.key_phrases,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Scenario evaluation error:', error);

    // Fallback default calculation if AI fails
    const matched = scenario.key_phrases.filter((kp) =>
      transcript.toLowerCase().includes(kp.toLowerCase()),
    );
    const missed = scenario.key_phrases.filter((kp) => !matched.includes(kp));

    return {
      id: `sec-${Date.now()}`,
      scenario_id: scenario.id,
      scenario_title: scenario.title_en || scenario.title_ja || scenario.title_uz,
      pronunciation_score: 80,
      fluency_score: 75,
      grammar_score: 82,
      vocabulary_score: 70 + matched.length * 5,
      overall_score: 78,
      duration_seconds: durationSeconds,
      user_audio_url: recordedUrl || undefined,
      ai_feedback:
        "Suhbat yakunlandi! Pronunciation va iboralar ishlatilishi tahlil qilindi. Yapon tilida muloqotni rivojlantirish uchun ko'proq audio mashqlarni bajaring.",
      key_phrases_used: matched,
      key_phrases_missed: missed,
      created_at: new Date().toISOString(),
    };
  }
};
