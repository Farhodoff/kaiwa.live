/**
 * Low-Latency Streaming Pipeline for kaiwa.live AI Coach.
 * Streams tokens via SSE and pipelines individual clauses to TTS as soon as
 * a sentence boundary is formed, achieving sub-600ms conversational turn latency.
 */

import { streamDeepSeekTokens } from '../deepseek';
import { buildCoachPrompts, parseCoachResponse, CoachStructuredResponse } from './aiCoach';
import { ConversationScenario } from '../../components/speaking/scenarioTypes';

/**
 * Incrementally extracts clean spoken sentences from a streaming JSON response.
 * Watches for the "reply" or "ttsText" key, extracts sentence clauses immediately
 * when punctuation is encountered, and emits them to the callback in real time.
 */
export class IncrementalReplyExtractor {
  private buffer = '';
  private isInReply = false;
  private isFinished = false;
  private isRawMode = false;
  private replyBuffer = '';
  private emittedSentences: string[] = [];
  private onSentence: (sentence: string, index: number) => void;
  private isJa: boolean;
  private count = 0;

  constructor(isJa: boolean, onSentence: (sentence: string, index: number) => void) {
    this.isJa = isJa;
    this.onSentence = onSentence;
  }

  public feed(token: string): void {
    if (this.isFinished) return;
    this.buffer += token;

    if (!this.isInReply) {
      const trimmed = this.buffer.trimStart();
      // Detect non-JSON response immediately
      if (trimmed.length > 0 && !trimmed.startsWith('{') && !trimmed.startsWith('```')) {
        this.isInReply = true;
        this.isRawMode = true;
        this.replyBuffer = this.buffer;
      } else {
        // Look for `"reply": "` or `"ttsText": "` in JSON
        const replyMatch = this.buffer.match(/"(?:reply|ttsText)"\s*:\s*"/);
        if (replyMatch && replyMatch.index !== undefined) {
          const startPos = replyMatch.index + replyMatch[0].length;
          this.isInReply = true;
          this.replyBuffer = this.buffer.slice(startPos);
        }
      }
    } else {
      this.replyBuffer += token;
    }

    if (this.isInReply) {
      let stringEnd = -1;
      if (!this.isRawMode) {
        for (let i = 0; i < this.replyBuffer.length; i++) {
          if (this.replyBuffer[i] === '"' && (i === 0 || this.replyBuffer[i - 1] !== '\\')) {
            stringEnd = i;
            break;
          }
        }
      }

      const activeSlice =
        stringEnd !== -1 ? this.replyBuffer.slice(0, stringEnd) : this.replyBuffer;

      // Detect sentence boundaries: Japanese (。！？\n, or 、 when clause is >= 12 chars) or Latin (.!?\n)
      const delimiterRegex = this.isJa
        ? /([^\n。！？]+[。！？\n]+|[^\n。！？、]{12,}、)/g
        : /([^\n.!?]+[.!?\n]+(?:\s+|$))/g;

      let match: RegExpExecArray | null;
      let lastIndex = 0;
      while ((match = delimiterRegex.exec(activeSlice)) !== null) {
        const sentence = match[1].trim();
        if (sentence && !this.emittedSentences.includes(sentence)) {
          this.emittedSentences.push(sentence);
          this.onSentence(sentence, this.count++);
        }
        lastIndex = delimiterRegex.lastIndex;
      }

      if (stringEnd !== -1) {
        // Reply field ended
        const remainingClause = activeSlice.slice(lastIndex).trim();
        if (remainingClause && !this.emittedSentences.includes(remainingClause)) {
          this.emittedSentences.push(remainingClause);
          this.onSentence(remainingClause, this.count++);
        }
        this.replyBuffer = '';
        this.isInReply = false;
        this.isFinished = true;
      } else if (lastIndex > 0) {
        this.replyBuffer = activeSlice.slice(lastIndex);
      }
    }
  }

  public flush(): void {
    if (this.isFinished) return;
    const remaining = this.replyBuffer.replace(/["}\]\s]+$/, '').trim();
    if (remaining && !this.emittedSentences.includes(remaining)) {
      this.emittedSentences.push(remaining);
      this.onSentence(remaining, this.count++);
    }
    this.replyBuffer = '';
    this.isFinished = true;
  }

  public getEmittedSentences(): string[] {
    return this.emittedSentences;
  }
}

/**
 * Streams conversation turn from DeepSeek and pipes individual sentence clauses
 * to onSentenceReady in real time for instant audio playback.
 */
export const streamCoachDialogue = async (
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'ja' = 'en',
  persona: string = 'roast',
  scenario?: ConversationScenario | null,
  onSentenceReady?: (sentence: string, index: number) => void,
  signal?: AbortSignal,
  level: string = 'N3',
): Promise<CoachStructuredResponse> => {
  const { systemPrompt, userPrompt } = buildCoachPrompts(
    message,
    history,
    language,
    persona,
    scenario,
    level,
  );

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const isJa = language === 'ja';
  const extractor = onSentenceReady ? new IncrementalReplyExtractor(isJa, onSentenceReady) : null;

  const fullRaw = await streamDeepSeekTokens(
    messages,
    (token) => {
      if (extractor) {
        extractor.feed(token);
      }
    },
    true,
    signal,
  );

  if (extractor) {
    extractor.flush();
  }

  return parseCoachResponse(fullRaw, language);
};
