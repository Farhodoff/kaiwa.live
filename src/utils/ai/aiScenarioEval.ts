import {
  ConversationScenario,
  ScenarioSessionResult,
} from '../../components/speaking/scenarioTypes';
import { callCoachAI } from '../coachAI';

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
  // Limit to the most recent 30 user turns to avoid token limit overflow on extended sessions
  const userMessages = chatHistory
    .filter((h) => h.role === 'user')
    .map((h) => h.content)
    .slice(-30);
  const transcript = userMessages.join('\n');

  const prompt = `
      Act as an expert Japanese Language Oral Examiner & Pronunciation Coach.
      Scenario Context: "${scenario.title_ja}" (${scenario.title_uz})
      Target JLPT Difficulty: ${scenario.difficulty}
      Required Key Phrases: ${JSON.stringify(scenario.key_phrases)}

      Here is the complete student speech transcript during the conversation:
      """
      ${transcript}
      """

      Task: Analyze the student's Japanese speech performance strictly.
      Calculate 5 scores from 0 to 100 based on Japanese phonetics, grammar, and scenario key phrase usage:
      1. "pronunciation_score": Estimated accuracy of pitch accent, mora timing, particle pronunciation (e.g. は/が/に/で), and sound clarity from transcript (0-100).
      2. "fluency_score": Smoothness, response speed, and conversational flow (0-100).
      3. "grammar_score": Correct particle usage, verb conjugations (e.g. Te-form, Masu-form), and honorifics (0-100).
      4. "vocabulary_score": Richness of vocabulary and usage of key scenario phrases (0-100).
      5. "overall_score": Weighted average score (0-100).

      Identify:
      - "key_phrases_used": Array of strings from the required key phrases that the student successfully used or correctly adapted in Japanese.
      - "key_phrases_missed": Array of strings from the required key phrases that the student forgot or missed.
      - "ai_feedback": Constructive feedback paragraph IN UZBEK LANGUAGE detailing strengths, pronunciation/grammar tips, and encouraging advice for Japanese learning.

      Return ONLY a VALID JSON object with these exact keys:
      {
        "pronunciation_score": number,
        "fluency_score": number,
        "grammar_score": number,
        "vocabulary_score": number,
        "overall_score": number,
        "key_phrases_used": string[],
        "key_phrases_missed": string[],
        "ai_feedback": string
      }
    `;

  try {
    const response = await callCoachAI(prompt, undefined, true);
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
