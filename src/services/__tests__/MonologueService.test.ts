import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonologueService, PRESET_MONOLOGUE_TOPICS } from '../MonologueService';
import * as aiCore from '../../utils/ai/aiCore';

describe('MonologueService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides preset monologue topics with JLPT levels and questions', () => {
    const topics = MonologueService.getPresetTopics();
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((t) => t.category === 'mensetsu')).toBe(true);
    expect(topics.some((t) => t.category === 'ryuugaku')).toBe(true);
  });

  it('filters preset topics by category and level', () => {
    const mensetsuTopics = MonologueService.getPresetTopics('mensetsu');
    expect(mensetsuTopics.every((t) => t.category === 'mensetsu')).toBe(true);

    const n3Topics = MonologueService.getPresetTopics('mensetsu', 'N3');
    expect(n3Topics.every((t) => t.level === 'N3')).toBe(true);
  });

  it('generates dynamic Mensetsu topic with PREP answer guidance', async () => {
    const mockAiResponse = JSON.stringify({
      id: 'dynamic_123',
      title: '志望動機',
      titleUz: 'Nega bizning kompaniya?',
      category: 'mensetsu',
      level: 'N2',
      promptQuestionJa:
        '当社（とうしゃ）で働（はたら）きたい理由（りゆう）を詳（くわ）しく教（おし）えてください。',
      promptQuestionUz: 'Kompaniyamizda ishlashni xohlashingiz sababini batafsil tushuntiring.',
      answerGuidance: "PREP qoidasiga ko'ra 3-4 gapda sabab va shaxsiy tajribangizni tushuntiring.",
      hints: ['高い技術力', '自己成長'],
    });

    vi.spyOn(aiCore, 'callAI').mockResolvedValue(mockAiResponse);

    const topic = await MonologueService.generateDynamicTopic('N2', 'mensetsu');
    expect(topic.category).toBe('mensetsu');
    expect(topic.level).toBe('N2');
    expect(topic.promptQuestionJa).toContain('当社');
    expect(topic.answerGuidance).toContain('PREP');
  });

  it('analyzes monologue speech, polishing Japanese, furigana readings, and coach advice', async () => {
    const mockAiResponse = JSON.stringify({
      originalTranscript: 'nihon de hatarakitai desu gijutsu ga takai kara',
      polishedJapanese:
        '日本の高い技術力に魅力を感じ、自分のスキルを活かして貢献したいと考えております。',
      readingWithFurigana:
        '日本（にほん）の高（たか）い技術力（ぎじゅつりょく）に魅力（みりょく）を感（かん）じ、自分（じぶん）のスキルを活（い）かして貢献（こうけん）したいと考（かんが）えております。',
      uzbekTranslation:
        'Yaponiyaning yuqori texnologiyalari meni o‘ziga tortdi va o‘z bilimlarimni qo‘llab hissa qo‘shishni xohlayman.',
      coachFeedback:
        'Intervyu uchun juda yaxshi fikr. Sababni aytgach, o‘z sohangizdan 1 ta aniq misol qo‘shsangiz yanada ishonchli chiqadi.',
      accuracyScore: 72,
      keyGrammarPoints: [
        {
          structure: '〜と考えております',
          meaningUz: '...deb o‘ylamoqdaman (rasmiy Keigo)',
          exampleJa: '貢献したいと考えております。',
          exampleReading: '貢献（こうけん）したいと考（かんが）えております。',
        },
      ],
      suggestedVocab: [
        {
          kanji: '貢献',
          reading: 'こうけん',
          romaji: 'kouken',
          meaningUz: "hissa qo'shish",
        },
      ],
      encouragement: 'Ajoyib urinish! Intervyu uslubida davom eting.',
    });

    vi.spyOn(aiCore, 'callAI').mockResolvedValue(mockAiResponse);

    const topic = PRESET_MONOLOGUE_TOPICS[0];
    const userSpoken = 'nihon de hatarakitai desu gijutsu ga takai kara';

    const result = await MonologueService.analyzeMonologueSpeech(topic, userSpoken);

    expect(result.polishedJapanese).toContain('貢献');
    expect(result.readingWithFurigana).toContain('（こうけん）');
    expect(result.uzbekTranslation).toContain('hissa');
    expect(result.coachFeedback).toContain('Intervyu');
    expect(result.accuracyScore).toBe(72);
  });

  it('throws an error if transcript is empty', async () => {
    const topic = PRESET_MONOLOGUE_TOPICS[0];
    await expect(MonologueService.analyzeMonologueSpeech(topic, '   ')).rejects.toThrow(
      "Transkript bo'sh",
    );
  });
});
