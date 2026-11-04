import { parseAIError } from './aiConfig';
import { callSelectedAIProvider } from './aiCore';

export const expandNoteWithAI = async (
  content: string,
  subjectName: string = 'Umumiy',
  _userKey?: string,
): Promise<string> => {
  const prompt = `
      Fan: "${subjectName}"
      Konspekt matni: "${content.substring(0, 4000)}"
      
      Vazifa: Ushbu konspekt matnini o'rganilayotgan fan doirasida kengaytiring va batafsilroq ma'lumotlar bilan boyiting. 
      Qo'shimcha ilmiy faktlar, tushunchalar va aniq misollar qo'shing.
      Format: Markdown formatidan foydalaning.
      Til: O'zbek tili.
      Cheklov: Faqat yangilangan, kengaytirilgan konspekt matnini qaytaring, boshqa hech qanday izoh, sarlavha yoki kirish so'zlarini yozmang.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, false);
    return text ? text.trim() : content;
  } catch (error: unknown) {
    console.error('AI Expand Note Error:', error);
    throw new Error(parseAIError(error));
  }
};

export const summarizeNoteWithAI = async (
  content: string,
  _subjectName?: string,
  _userKey?: string,
): Promise<string> => {
  const prompt = `
      Konspekt matni: "${content.substring(0, 4000)}"
      
      Vazifa: Ushbu konspekt matnining eng muhim va asosiy g'oyalarini qisqa, tushunarli qilib xulosa qiling (Executive Summary).
      Format: Bullet pointlar (nuqtalar) ko'rinishida Markdown formatidan foydalaning.
      Til: O'zbek tili.
      Cheklov: Faqat xulosa matnini qaytaring. Boshqa kirish so'zlar yozmang.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, false);
    return text ? text.trim() : content;
  } catch (error: unknown) {
    console.error('AI Summarize Note Error:', error);
    throw new Error(parseAIError(error));
  }
};

export const fixNoteSpellingWithAI = async (
  content: string,
  _subjectName?: string,
  _userKey?: string,
): Promise<string> => {
  const prompt = `
      Vazifa: Ushbu konspekt matnidagi imlo va grammatik xatolarni to'g'rilab, matnni toza Markdown formatida qaytaring.
      Matn: "${content.substring(0, 4000)}"
      Til: O'zbek tili.
      Cheklov: Faqat to'g'rilangan matnni qaytaring.
    `;
  try {
    const text = await callSelectedAIProvider(prompt, undefined, false);
    return text ? text.trim() : content;
  } catch {
    return content;
  }
};

export const generateQuizFromNote = async (
  content: string,
  questionCount: number = 3,
  _userKey?: string,
): Promise<{ question: string; options: string[]; answerIndex: number; explanation: string }[]> => {
  const prompt = `
      Konspekt matni: "${content.substring(0, 4000)}"
      Vazifa: Ushbu konspekt asosida ${questionCount} ta ko'p variantli (Multiple Choice) test savollari yarating.
      Format: FAQAT QUYIDAGI VALID JSON ARRAY BO'LSIN:
      [
        {
          "question": "Savol matni",
          "options": ["Variant A", "Variant B", "Variant C", "Variant D"],
          "answerIndex": 0,
          "explanation": "Nega ushbu variant to'g'ri ekanligi haqida qisqa tushuntirish"
        }
      ]
      Cheklov: JSON dan tashqari hech qanday matn qaytarmang!
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);
    if (Array.isArray(json)) {
      return json;
    }
    return [];
  } catch (error: unknown) {
    console.error('AI Quiz Error:', error);
    throw new Error(parseAIError(error));
  }
};

export const explainComplexTopic = async (
  topic: string,
  context: string = '',
  _userKey?: string,
): Promise<string> => {
  const prompt = `
      Mavzu: "${topic}"
      ${context ? `Kontekst: "${context.substring(0, 2000)}"` : ''}
      
      Vazifa: Ushbu muloqotdagi murakkab mavzuni xuddi 5 yoshli bolaga tushuntirgandek juda sodda, qiziqarli o'xshatishlar va hayotiy misollar bilan tushuntirib bering (Feynman usulida).
      Til: O'zbek tili.
      Format: Chiroyli Markdown.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, false);
    return text ? text.trim() : 'Mavzuni tushuntirishda xatolik yuz berdi.';
  } catch (error: unknown) {
    console.error('AI Feynman Explain Error:', error);
    throw new Error(parseAIError(error));
  }
};

export const generateSmartSummary = async (
  rawText: string,
  mode: 'key_takeaways' | 'action_items' | 'mindmap_tree' | 'qa_breakdown' = 'key_takeaways',
  _userKey?: string,
): Promise<string> => {
  let modeInstruction = '';
  if (mode === 'key_takeaways') {
    modeInstruction =
      "Eng muhim 5 ta asosiy xulosani 💡 belgilari bilan tartiblangan ro'yxat qiling.";
  } else if (mode === 'action_items') {
    modeInstruction =
      "Ushbu matndan kelib chiqib bajarilishi kerak bo'lgan amaliy vazifalar (Action Items) ro'yxatini 🎯 belgilari bilan chiqaring.";
  } else if (mode === 'mindmap_tree') {
    modeInstruction =
      "Ushbu matn tarkibini iyerarxik Mind-map ko'rinishida (Daraxtsimon ro'yxat) tuzing.";
  } else if (mode === 'qa_breakdown') {
    modeInstruction =
      "Ushbu matn bo'yicha eng ko'p beriladigan 3 ta savol va ularga javob (Q&A) shaklida shakllantiring.";
  }

  const prompt = `
      Boshlang'ich Matn: "${rawText.substring(0, 5000)}"
      
      Vazifa: ${modeInstruction}
      Format: Markdown formatida chiroyli qiling.
      Til: O'zbek tili.
      Cheklov: Faqat tayyorlangan natijani qaytaring.
    `;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, false);
    return response ? response.trim() : 'Xulosa shakllantirishda xatolik yuz berdi.';
  } catch (error) {
    console.error('Smart Summary Error:', error);
    throw new Error(parseAIError(error));
  }
};
