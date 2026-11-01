import { callSelectedAIProvider } from './aiCore';
import { parseAIError } from './aiConfig';

export interface JlptStudyPlanDay {
  day: number;
  title: string;
  focusArea: 'Kanji' | 'Vocabulary' | 'Grammar' | 'Reading' | 'Listening' | 'Speaking';
  tasks: string[];
  pomodoroTargetMinutes: number;
  vocabularyList?: { word: string; meaning: string; reading?: string; example?: string }[];
  grammarNotes?: { rule: string; explanation: string; example?: string }[];
  kanjiList?: { kanji: string; meaning: string; onyomi?: string; kunyomi?: string }[];
}

export interface JlptStudyPlanResult {
  headline: string;
  summary: string;
  dailyPlan: JlptStudyPlanDay[];
  recommendedTips: string[];
}

function enrichJlptPlanWithConcreteContent(
  aiDailyPlan: JlptStudyPlanDay[],
  algorithmicDailyPlan: JlptStudyPlanDay[],
): JlptStudyPlanDay[] {
  return aiDailyPlan.map((dayItem, idx) => {
    const algoItem =
      algorithmicDailyPlan[idx % algorithmicDailyPlan.length] || algorithmicDailyPlan[0];

    const vocabularyList =
      dayItem.vocabularyList && dayItem.vocabularyList.length > 0
        ? dayItem.vocabularyList
        : algoItem.vocabularyList;

    const grammarNotes =
      dayItem.grammarNotes && dayItem.grammarNotes.length > 0
        ? dayItem.grammarNotes
        : algoItem.grammarNotes;

    const kanjiList =
      dayItem.kanjiList && dayItem.kanjiList.length > 0 ? dayItem.kanjiList : algoItem.kanjiList;

    return {
      ...dayItem,
      vocabularyList,
      grammarNotes,
      kanjiList,
    };
  });
}

export const generateJlptStudyPlan = async (
  currentLevel: any,
  targetLevel: any,
  durationDays: number = 30,
  planType: string = 'general',
  specialGoal?: string,
): Promise<JlptStudyPlanResult> => {
  const prompt = `
      Act as an elite Japanese Language JLPT Academic Director & Curriculum Planner.
      Generate a ${durationDays}-day hyper-structured study plan for a student.

      Student Profile:
      - Current Japanese Level: ${currentLevel}
      - Target Level: ${targetLevel}
      - Plan Type: ${planType}
      ${specialGoal ? `- Specific Goal: "${specialGoal}"` : ''}

      Output Requirements:
      Return STRICTLY a JSON object with this exact schema:
      {
        "headline": "Short motivational headline in Uzbek",
        "summary": "2-sentence high level strategy overview in Uzbek",
        "recommendedTips": ["Tip 1 in Uzbek", "Tip 2 in Uzbek", "Tip 3 in Uzbek"],
        "dailyPlan": [
          {
            "day": 1,
            "title": "Day title in Uzbek (e.g., N4 Grammatika va N3 Kanji takrorlash)",
            "focusArea": "Grammar",
            "tasks": [
              "Task 1 in Uzbek",
              "Task 2 in Uzbek",
              "Task 3 in Uzbek"
            ],
            "pomodoroTargetMinutes": 60,
            "vocabularyList": [
              { "word": "勉強", "reading": "べんきょう", "meaning": "O'qish/o'rganish", "example": "毎日日本語を勉強します。" }
            ],
            "grammarNotes": [
              { "rule": "〜てもいいです", "explanation": "Ruxsat so'rash yoki berish iborasi", "example": "入ってもいいですか。" }
            ],
            "kanjiList": [
              { "kanji": "学", "meaning": "O'quv/bilim", "onyomi": "ガク", "kunyomi": "まな・ぶ" }
            ]
          }
        ]
      }

      CRITICAL CONSTRAINTS:
      1. Provide exactly ${Math.min(durationDays, 7)} daily entries in "dailyPlan" array (representing the first intensive week cycle).
      2. focusArea MUST be one of: "Kanji", "Vocabulary", "Grammar", "Reading", "Listening", "Speaking".
      3. All text descriptions, titles, tasks, explanations, and meanings MUST be written in natural, fluent Uzbek (O'zbekcha).
      4. ONLY return valid JSON. No markdown backticks, no explanations.
    `;

  const { generateAlgorithmicJlptPlan } = await import('../curriculum/jlptAlgorithmicPlanner');
  const algorithmicDailyPlan = await generateAlgorithmicJlptPlan(
    currentLevel,
    targetLevel,
    durationDays,
    planType,
    specialGoal,
  );

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(cleanedText);
    const dailyPlanRaw = parsed.dailyPlan || parsed.daily_plan || parsed.plan;
    const finalDailyPlan =
      Array.isArray(dailyPlanRaw) && dailyPlanRaw.length > 0
        ? enrichJlptPlanWithConcreteContent(dailyPlanRaw, algorithmicDailyPlan)
        : algorithmicDailyPlan;

    return {
      headline: parsed.headline || `${targetLevel} Darajasiga Intensiv Tayyorgarlik Rejasi 🎯`,
      summary:
        parsed.summary ||
        `${currentLevel} darajadan ${targetLevel} darajaga erishish uchun ${durationDays} kunlik maxsus o'quv dasturi.`,
      recommendedTips: parsed.recommendedTips || [
        'Har kuni kamida 30 daqiqa yapon tilida audiolar tinglang.',
        'Har bir yangi kanjini misol jumlalar bilan birga yod oling.',
        "Haftada bir marta o'tilgan barcha grammatik qoidalarni qayta takrorlang.",
      ],
      dailyPlan: finalDailyPlan,
    };
  } catch (err: any) {
    console.error('AI JLPT Plan Generation error:', err);
    throw new Error(parseAIError(err));
  }
};
