import { callSelectedAIProvider } from '../utils/ai/aiCore';

export interface AiEvaluationResult {
  score: number;
  feedback: string;
  criteriaScores?: {
    vocabulary?: number;
    grammar?: number;
    taskAchievement?: number;
    coherence?: number;
    fluency?: number;
    pronunciation?: number;
    naturalness?: number;
    hesitation?: number;
  };
}

const parseAiResponse = (content: string): AiEvaluationResult => {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      feedback: parsed.feedback || cleaned,
      criteriaScores: parsed.criteriaScores || {},
    };
  } catch {
    console.error('Failed to parse AI response as JSON:', cleaned);
    return {
      score: 0,
      feedback: cleaned || 'AI javobini qayta ishlashda xatolik yuz berdi.',
    };
  }
};

export const aiEvaluationService = {
  async evaluateWriting(
    examType: 'IELTS' | 'JLPT',
    promptText: string,
    userResponse: string,
  ): Promise<AiEvaluationResult> {
    const systemPrompt = `You are an expert ${examType} examiner. Evaluate the following writing response based on official ${examType} grading criteria.
    Provide your evaluation in STRICT JSON format with the following structure:
    {
      "score": <number, overall band score or JLPT score out of 60>,
      "feedback": "<detailed text feedback in Uzbek explaining the mistakes and how to improve>",
      "criteriaScores": {
        "vocabulary": <number>,
        "grammar": <number>,
        "taskAchievement": <number>,
        "coherence": <number>
      }
    }
    Return ONLY the JSON object, no markdown, no code fences.`;

    const userMessage = `Prompt/Question:\n${promptText}\n\nUser Response:\n${userResponse}`;

    try {
      const content = await callSelectedAIProvider(userMessage, systemPrompt, true);

      if (!content) {
        throw new Error('AI provayderi javob bermadi.');
      }

      return parseAiResponse(content);
    } catch (error: any) {
      console.error('Error evaluating writing:', error);
      throw new Error(`Writing baholashda xatolik: ${error?.message || "Noma'lum xato"}`);
    }
  },

  async evaluateSpeakingTranscript(
    examType: 'IELTS' | 'JLPT',
    promptText: string,
    transcript: string,
  ): Promise<AiEvaluationResult> {
    const systemPrompt = `You are an expert ${examType} speaking examiner. You are given a transcript of a user's spoken response.
    Evaluate it based on official ${examType} grading criteria for speaking. Focus on vocabulary, grammar, and coherence.
    Provide your evaluation in STRICT JSON format with the following structure:
    {
      "score": <number, overall band score or JLPT score>,
      "feedback": "<detailed text feedback in Uzbek explaining the mistakes, hesitation points, and how to improve>",
      "criteriaScores": {
        "vocabulary": <number, 0-10 or 0-9>,
        "grammar": <number, 0-10 or 0-9>,
        "fluency": <number, 0-10 or 0-9>,
        "pronunciation": <number, 0-10 or 0-9>,
        "naturalness": <number, 0-10 or 0-9>,
        "hesitation": <number, 0-10 or 0-9, higher means less hesitation and better continuous speech>
      }
    }
    Return ONLY the JSON object, no markdown, no code fences.`;

    const userMessage = `Prompt/Question:\n${promptText}\n\nUser Spoken Transcript:\n${transcript}`;

    try {
      const content = await callSelectedAIProvider(userMessage, systemPrompt, true);

      if (!content) {
        throw new Error('AI provayderi javob bermadi.');
      }

      return parseAiResponse(content);
    } catch (error: any) {
      console.error('Error evaluating speaking:', error);
      throw new Error(`Speaking baholashda xatolik: ${error?.message || "Noma'lum xato"}`);
    }
  },
};
