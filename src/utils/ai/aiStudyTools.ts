import { aiCache, parseAIError } from './aiConfig';
import { callSelectedAIProvider } from './aiCore';

export interface SmartResource {
  title: string;
  type: 'video' | 'article' | 'book' | 'course';
  description: string;
  link: string;
}

export interface FullStudyPlan {
  schedule: {
    title: string;
    dayOffset: number;
    duration: number;
    description?: string;
  }[];
  resources: SmartResource[];
}

export interface ExtractedVocabItem {
  front: string;
  back: string;
  word?: string;
  reading?: string;
  meaning?: string;
  phonetic?: string;
  example?: string;
}

export const extractVocabularyFromText = async (
  text: string,
  _userKey?: string,
): Promise<ExtractedVocabItem[]> => {
  const prompt = `
      Extract key educational vocabulary items (words, terms, kanji/phrases) from this text:
      "${text.substring(0, 4000)}"
      
      Output Format: VALID JSON ARRAY of objects:
      [
        {
          "word": "So'z yoki atama",
          "reading": "O'qilish yoki romaji (agar bo'lsa)",
          "meaning": "Ma'nosi (O'zbekcha)",
          "example": "Namuna jumla (agar bo'lsa)"
        }
      ]
      Constraint: ONLY return valid JSON.
    `;
  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleaned);
    if (Array.isArray(json)) {
      return json.map((item: any) => ({
        front: String(item.front || item.word || item.term || ''),
        back: String(item.back || item.meaning || ''),
        word: String(item.word || item.front || ''),
        meaning: String(item.meaning || item.back || ''),
        reading: item.reading ? String(item.reading) : undefined,
        phonetic: item.phonetic || item.reading ? String(item.phonetic || item.reading) : undefined,
        example: item.example ? String(item.example) : undefined,
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export interface AITimetableScheduleItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  dayOffset: number;
  timeStr: string;
  subject: string;
  topic: string;
  durationMinutes: number;
}

export const generateAITimetable = async (
  goalDescription: string,
  dailyHours: number = 3,
  daysCount: number = 7,
  _userKey?: string,
): Promise<AITimetableScheduleItem[]> => {
  const prompt = `
      Goal: "${goalDescription}"
      Daily Available Hours: ${dailyHours} hours
      Days Count: ${daysCount} days
      
      Task: Generate a realistic, structured daily study schedule for the student in Uzbek.
      Output Format: VALID JSON ARRAY:
      [
        {
          "dayOffset": 0,
          "timeStr": "09:00 - 10:30",
          "subject": "Fan nomi",
          "topic": "O'rganiladigan mavzu",
          "durationMinutes": 90
        }
      ]
      Constraint: ONLY return valid JSON.
    `;
  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleaned);
    if (Array.isArray(json)) {
      const today = new Date();
      return json.map((item: any, idx: number) => {
        const dayOffset = Math.min(daysCount - 1, Math.max(0, parseInt(item.dayOffset) || 0));
        const targetDate = new Date(today.valueOf() + dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];
        return {
          id: `schedule_${idx + 1}`,
          title: String(item.title || item.topic || item.subject || 'Dars seansi'),
          description: String(item.description || item.topic || ''),
          date: String(item.date || dateStr),
          startTime: String(item.startTime || item.timeStr?.split('-')[0]?.trim() || '09:00'),
          dayOffset,
          timeStr: String(item.timeStr || '09:00 - 10:30'),
          subject: String(item.subject || 'Dars'),
          topic: String(item.topic || 'Mavzu'),
          durationMinutes: parseInt(item.durationMinutes || item.duration) || 60,
        };
      });
    }
    return [];
  } catch {
    return [];
  }
};

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  correctAnswer: any;
  explanation: string;
}

export const generateExamWithAI = async (
  topic: string,
  param2?: any,
  param3?: any,
  _param4?: any,
  _userKey?: string,
): Promise<ExamQuestion[]> => {
  let questionCount = typeof param2 === 'number' ? param2 : typeof param3 === 'number' ? param3 : 5;
  let difficulty = typeof param3 === 'string' ? param3 : 'medium';
  let extraContext = typeof param2 === 'string' ? param2 : '';

  const prompt = `
      Topic: "${topic}"
      ${extraContext ? `Context: "${extraContext.substring(0, 3000)}"` : ''}
      Question Count: ${questionCount}
      Difficulty: ${difficulty}
      Language: Uzbek (O'zbek tili)
      
      Task: Create a mock exam test.
      Output Format: VALID JSON ARRAY:
      [
        {
          "id": "q1",
          "question": "Savol matni?",
          "options": ["A", "B", "C", "D"],
          "answerIndex": 0,
          "correctAnswer": 0,
          "explanation": "To'g'ri javob izohi"
        }
      ]
      Constraint: ONLY return valid JSON.
    `;
  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (Array.isArray(json)) {
      return json.map((item: any, idx: number) => {
        const options = Array.isArray(item.options)
          ? item.options.map(String)
          : ['A', 'B', 'C', 'D'];
        const answerIndex =
          typeof item.answerIndex === 'number'
            ? item.answerIndex
            : typeof item.correctAnswer === 'number'
              ? item.correctAnswer
              : 0;
        return {
          id: `q_${idx + 1}`,
          question: String(item.question || 'Savol'),
          options,
          answerIndex,
          correctAnswer: answerIndex,
          explanation: String(item.explanation || ''),
        };
      });
    }
    return [];
  } catch {
    return [];
  }
};

export const generateMindMapWithAI = async (topic: string, _userKey?: string): Promise<string> => {
  const prompt = `
      Topic: "${topic}"
      Task: Generate a Mermaid.js diagram definition (graph TD or mindmap) explaining this topic hierarchical structure in Uzbek.
      Constraint: ONLY return valid Mermaid markup string starting with \`graph TD\` or \`mindmap\`. No markdown block wraps.
    `;
  try {
    const response = await callSelectedAIProvider(prompt, undefined, false);
    return response
      .replace(/```mermaid/g, '')
      .replace(/```/g, '')
      .trim();
  } catch {
    return `graph TD\n    A[${topic}] --> B[Asosiy tushunchalar]`;
  }
};

export const generateSmartResources = async (
  subjectName: string,
  topicCount: number = 3,
  _userKey?: string,
): Promise<SmartResource[]> => {
  const cacheKey = `smart-resources-${subjectName}-${topicCount}`;
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey) as SmartResource[];
  }

  const prompt = `
      Subject: "${subjectName}"
      Task: Recommend ${topicCount} high-quality, practical learning resources (YouTube videos, free online courses, authoritative articles, or classic books) specifically for mastering this subject.
      Language: Uzbek for titles/descriptions, valid HTTP URLs for links (e.g. https://youtube.com, https://coursera.org, https://khanacademy.org).
      
      Output Format: A VALID JSON array of objects with keys:
      - "title": string (resource title in Uzbek)
      - "type": one of ["video", "article", "book", "course"]
      - "description": string (short 1-sentence summary of why it's useful in Uzbek)
      - "link": string (a valid web URL)
      
      Constraint: ONLY return the JSON array. No preamble or markdown formatting.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (!Array.isArray(json)) throw new Error('Invalid response format from AI Provider');

    const result: SmartResource[] = json.map((item: any) => ({
      title: String(item.title || 'Resurs'),
      type: ['video', 'article', 'book', 'course'].includes(item.type) ? item.type : 'article',
      description: String(item.description || ''),
      link: String(item.link || 'https://google.com'),
    }));

    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Smart Resources Error:', error);
    throw new Error(parseAIError(error));
  }
};

export const generateStudyInsight = async (
  subjectsStats: { name: string; hours: number; progress: number; mastery: number }[],
  _userKey?: string,
): Promise<{ subject: string; advice: string }[]> => {
  const prompt = `
      Student Statistics:
      ${JSON.stringify(subjectsStats, null, 2)}
      
      Task: Act as an expert AI Study Mentor. Analyze the student's study time, completion progress, and mastery scores across subjects.
      Generate 2-3 personalized, actionable advice items (insights) to help them balance their weak areas and maintain momentum.
      Language: Uzbek (O'zbek tili).
      
      Output Format: A VALID JSON array of objects:
      [
        {
          "subject": "Fan nomi (masalan, Matematika)",
          "advice": "Tavsiya matni (masalan, So'nggi haftada o'zlashtirish 45% ga tushdi, har kuni 25 daqiqa Pomodoro bag'ishlang.)"
        }
      ]
      Constraint: ONLY return the JSON array. No markdown backticks or preamble.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (Array.isArray(json)) {
      return json.map((item) => ({
        subject: String(item.subject || 'Umumiy'),
        advice: String(item.advice || "O'qish jadvalingizni muntazam davom ettiring."),
      }));
    }
    return [];
  } catch (error: any) {
    console.error('generateStudyInsight error:', error);
    throw new Error(parseAIError(error));
  }
};

export const generateAutoSchedule = async (
  subjects: { id: string; name: string; targetHoursPerWeek?: number }[],
  daysAhead: number = 7,
  _userKey?: string,
): Promise<{ title: string; dayOffset: number; duration: number; description?: string }[]> => {
  const prompt = `
      Subjects List: ${JSON.stringify(subjects)}
      Planning Window: Next ${daysAhead} days.
      
      Task: Create a balanced, realistic daily study timetable for a student for the next ${daysAhead} days.
      Distribute study time among the provided subjects intelligently.
      
      Output Format: A VALID JSON array of objects:
      [
        {
          "title": "Subject Name + Study Topic (e.g. Fizika - Dinamika qonunlari)",
          "dayOffset": 0 (0 for today, 1 for tomorrow, up to ${daysAhead - 1}),
          "duration": 45 (in minutes),
          "description": "Short action note in Uzbek"
        }
      ]
      Constraint: ONLY return valid JSON.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (Array.isArray(json)) {
      return json.map((item: any) => ({
        title: String(item.title || 'Dars seansi'),
        dayOffset: Math.min(daysAhead - 1, Math.max(0, parseInt(item.dayOffset) || 0)),
        duration: parseInt(item.duration) || 30,
        description: item.description ? String(item.description) : undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Auto Schedule Error:', error);
    return [];
  }
};

export const generateFullStudyPlan = async (
  topicOrSubjects: any,
  daysAhead: number = 7,
  _hoursPerDay: number = 2,
  _level?: string,
  _learningStyle?: string,
  _userKey?: string,
): Promise<FullStudyPlan> => {
  let subjects = Array.isArray(topicOrSubjects)
    ? topicOrSubjects
    : [{ id: '1', name: String(topicOrSubjects || "O'quv reja") }];
  const schedule = await generateAutoSchedule(subjects, daysAhead, _userKey);
  const mainSubject = subjects[0]?.name || "Umumiy o'quv reja";
  const resources = await generateSmartResources(mainSubject, 3, _userKey);

  return { schedule, resources };
};

export const generateQuizQuestions = async (
  topic: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  _userKey?: string,
): Promise<
  { id: string; question: string; options: string[]; answerIndex: number; explanation: string }[]
> => {
  const prompt = `
      Topic: "${topic}"
      Count: ${count} questions
      Difficulty: ${difficulty}
      Language: Uzbek (O'zbek tili)
      
      Task: Generate ${count} multiple-choice quiz questions to test knowledge on this topic.
      Output Format: A VALID JSON array of objects:
      [
        {
          "id": "q1",
          "question": "Savol matni?",
          "options": ["Variant A", "Variant B", "Variant C", "Variant D"],
          "answerIndex": 0,
          "explanation": "Nega aynan shu javob to'g'riligi haqida qisqa tushuntirish"
        }
      ]
      Constraint: ONLY return the JSON array.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (Array.isArray(json)) {
      return json.map((item: any, idx: number) => ({
        id: `q_${idx + 1}`,
        question: String(item.question || 'Savol'),
        options: Array.isArray(item.options) ? item.options.map(String) : ['A', 'B', 'C', 'D'],
        answerIndex: typeof item.answerIndex === 'number' ? item.answerIndex : 0,
        explanation: String(item.explanation || ''),
      }));
    }
    return [];
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    throw new Error(parseAIError(error));
  }
};
