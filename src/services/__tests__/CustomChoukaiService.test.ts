import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomContentService } from '../CustomContentService';
import { JlptListeningQuestion } from '../../data/jlpt/listening_data';

describe('CustomContentService - Choukai Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('adds, retrieves, updates, and deletes custom Choukai listening questions', async () => {
    const sampleQuestion: Omit<JlptListeningQuestion, 'id'> = {
      level: 'N3',
      type: 'task',
      titleUz: 'Temir yo‘l vokzalida',
      audioUrl: 'https://example.com/audio/n3_vokzal.mp3',
      script:
        '駅で 女の人と 駅員が 話しています。\n女：東京行きの 新幹線は 何番線ですか？\n駅員：3番線です。',
      questionText: '女の人は 何番線の ホームへ 行きますか？',
      questionTextUz: 'Ayol kishi nechanchi platformaga boradi?',
      options: ['1番線', '2番線', '3番線', '4番線'],
      optionsUz: ['1-platforma', '2-platforma', '3-platforma', '4-platforma'],
      correctAnswer: 2,
      explanationUzbek: 'Stansiya xodimi 3-platformani aniq aytdi.',
      tipUzbek: 'Raqamlarga e’tibor bering.',
    };

    // 1. Add question
    const created = await CustomContentService.addCustomChoukaiQuestion(sampleQuestion);
    expect(created.id).toBeDefined();
    expect(created.titleUz).toBe('Temir yo‘l vokzalida');

    // 2. Retrieve questions
    let list = CustomContentService.getCustomChoukaiQuestions();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].level).toBe('N3');

    // 3. Update question
    const updated = await CustomContentService.updateCustomChoukaiQuestion(created.id, {
      titleUz: 'Yangilangan Vokzal Dialogi',
      correctAnswer: 1,
    });
    expect(updated).toBe(true);

    list = CustomContentService.getCustomChoukaiQuestions();
    expect(list[0].titleUz).toBe('Yangilangan Vokzal Dialogi');
    expect(list[0].correctAnswer).toBe(1);

    // 4. Merge questions with base list
    const baseList: JlptListeningQuestion[] = [
      {
        id: 'base_1',
        level: 'N3',
        type: 'point',
        titleUz: 'Baza savoli',
        script: 'テスト会話',
        questionText: 'ベース質問',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanationUzbek: 'Izoh',
      },
    ];

    const merged = CustomContentService.mergeChoukaiQuestions(baseList);
    expect(merged.length).toBe(2);
    // Custom item takes precedence and appears first
    expect(merged[0].id).toBe(created.id);
    expect(merged[1].id).toBe('base_1');

    // 5. Delete question
    const deleted = await CustomContentService.deleteCustomChoukaiQuestion(created.id);
    expect(deleted).toBe(true);

    list = CustomContentService.getCustomChoukaiQuestions();
    expect(list.length).toBe(0);
  }, 35000);
});
