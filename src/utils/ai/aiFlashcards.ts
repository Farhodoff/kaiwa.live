import { aiCache, parseAIError } from './aiConfig';
import { callSelectedAIProvider } from './aiCore';

/**
 * Generates flashcards using kaiwa.live DeepSeek engine.
 * Supports batching for large counts to prevent output truncation and token waste.
 */
export const generateFlashcardsWithAI = async (
  topic: string,
  count: number = 5,
  _userKey?: string,
  previousQuestions: string[] = [],
): Promise<{ front: string; back: string }[]> => {
  // Check Cache first
  const cacheKey = `flashcards-${topic}-${count}`;
  if (aiCache.has(cacheKey)) {
    console.log(`[AI Cache] Returning cached flashcards for: ${topic}`);
    return aiCache.get(cacheKey) as { front: string; back: string }[];
  }

  // Batching logic: split into batches of 50 for stability
  if (count > 50) {
    const batches = [];
    let remaining = count;
    while (remaining > 0) {
      batches.push(Math.min(remaining, 50));
      remaining -= 50;
    }

    console.log(`[AI Batching] Splitting ${count} cards into ${batches.length} batches...`);
    const allCards: { front: string; back: string }[] = [];
    const generatedQuestions: string[] = [];
    for (const batchCount of batches) {
      const batchResult = await generateFlashcardsWithAI(
        topic,
        batchCount,
        _userKey,
        generatedQuestions,
      );
      allCards.push(...batchResult);
      generatedQuestions.push(...batchResult.map((c) => c.front));
      if (batches.length > 1) await new Promise((r) => setTimeout(r, 300));
    }

    const uniqueCardsMap = new Map();
    for (const card of allCards) {
      if (card && card.front && !uniqueCardsMap.has(card.front.toLowerCase())) {
        uniqueCardsMap.set(card.front.toLowerCase(), card);
      }
    }
    const merged = Array.from(uniqueCardsMap.values());

    aiCache.set(cacheKey, merged);
    return merged;
  }

  const prompt = `
      Topic: "${topic}"
      Task: Create ${count} high-quality, educational flashcards about this topic.
      Language: Detect the language of the topic and use it for the flashcards (e.g., if topic is in Uzbek, flashcards should be in Uzbek).
      Output Format: A VALID JSON array of objects. Each object must have "front" and "back" keys.
      ${previousQuestions.length > 0 ? `CRITICAL CONSTRAINT: Do NOT generate flashcards with these questions (they are already generated):\n${previousQuestions.map((q) => `- ${q}`).join('\n')}\n` : ''}
      Example: [{"front": "What is 2+2?", "back": "4"}]
      Constraint: ONLY return the JSON array. Do not include any markdown formatting, preamble, or explanation.
      Constraint 2: ALL flashcards must be completely unique and cover different aspects of the topic.
    `;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (!Array.isArray(json)) throw new Error('Invalid response format from AI Provider');

    const result = json.slice(0, count).map((item: unknown) => {
      const card = item as { front?: string; back?: string };
      return {
        front: String(card.front || ''),
        back: String(card.back || ''),
      };
    });

    aiCache.set(cacheKey, result);
    return result;
  } catch (error: unknown) {
    console.error('AI Flashcard Error:', error);
    throw new Error(parseAIError(error));
  }
};

/**
 * Generates flashcards based on a specific study note (markdown content) via selected AI.
 */
export const generateFlashcardsFromNote = async (
  noteContent: string,
  count: number = 5,
  _userKey?: string,
): Promise<{ front: string; back: string }[]> => {
  const prompt = `
      Note Content: "${noteContent.substring(0, 4000)}"
      Task: Create ${count} educational flashcards based EXACTLY on the information in the note above.
      Language: Use the same language as the note content (Uzbek or English).
      Output Format: A VALID JSON array of objects with "front" and "back" keys.
      Constraint: ONLY return the JSON array. No preamble or markdown.
    `;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const json = JSON.parse(cleanedText);

    if (!Array.isArray(json)) throw new Error('Invalid response format from AI Provider');

    return json.slice(0, count).map((item: unknown) => {
      const card = item as { front?: string; back?: string };
      return {
        front: String(card.front || ''),
        back: String(card.back || ''),
      };
    });
  } catch (error: unknown) {
    console.error('AI Flashcards from Note Error:', error);
    throw new Error(parseAIError(error));
  }
};
