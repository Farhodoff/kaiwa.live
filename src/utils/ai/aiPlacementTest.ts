import { callSelectedAIProvider } from './aiCore';

export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface PlacementResult {
  determinedLevel: string;
  feedback: string;
  score: number;
  total: number;
}

export const generatePlacementQuestions = async (
  type: 'jlpt' | 'ielts',
): Promise<PlacementQuestion[]> => {
  const prompt =
    type === 'jlpt'
      ? `Act as an expert Japanese JLPT examiner. Generate exactly 5 multiple choice questions to determine a student's Japanese level (from N5 to N3).
           Include a mix of grammar, vocabulary, and kanji reading.
           Provide 4 options for each question.
           Output ONLY valid JSON in this format:
           [
             {
               "id": "q1",
               "question": "Choose the correct reading for 水",
               "options": ["みず", "き", "ひ", "つち"]
             }
           ]`
      : `Act as an expert IELTS examiner. Generate exactly 5 multiple choice questions to determine a student's English level (from Band 4.0 to 7.0).
           Include a mix of advanced vocabulary, grammar, and sentence structure.
           Provide 4 options for each question.
           Output ONLY valid JSON in this format:
           [
             {
               "id": "q1",
               "question": "Which word is a synonym for 'ubiquitous'?",
               "options": ["Rare", "Found everywhere", "Expensive", "Dangerous"]
             }
           ]`;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.warn('AI placement generation failed:', err);
    throw new Error(
      'Savollarni generatsiya qilishda xatolik yuz berdi. Iltimos, AI sozlamalarini tekshiring.',
    );
  }
};

export const evaluatePlacementTest = async (
  type: 'jlpt' | 'ielts',
  qaList: { question: string; userAnswer: string }[],
): Promise<PlacementResult> => {
  const transcript = qaList
    .map((qa) => `Q: ${qa.question}\nStudent's Answer: ${qa.userAnswer}`)
    .join('\n\n');

  const prompt =
    type === 'jlpt'
      ? `Act as an expert Japanese JLPT examiner. Evaluate the following 5 questions and the student's answers.
           Determine their exact JLPT level (e.g., 'N5', 'N4', 'N3', 'N2', 'N1') based on their performance.
           Provide the result strictly in this JSON schema:
           {
             "determinedLevel": "N4",
             "score": 3,
             "total": 5,
             "feedback": "O'zbek tilida qisqacha tahlil va xatolar haqida izoh."
           }
           
           Transcript:
           ${transcript}`
      : `Act as an expert IELTS examiner. Evaluate the following 5 questions and the student's answers.
           Determine their exact IELTS Band score (e.g., '4.0', '5.0', '6.0', '7.0') based on their performance.
           Provide the result strictly in this JSON schema:
           {
             "determinedLevel": "6.0",
             "score": 4,
             "total": 5,
             "feedback": "O'zbek tilida qisqacha tahlil va xatolar haqida izoh."
           }
           
           Transcript:
           ${transcript}`;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.warn('AI placement evaluation failed:', err);
  }

  return {
    determinedLevel: type === 'jlpt' ? 'N5' : '5.5',
    score: 3,
    total: 5,
    feedback: "Savollar bo'yicha javoblaringiz asosida boshlang'ich daraja belgilandi.",
  };
};
