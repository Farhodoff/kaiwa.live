import { describe, it, expect } from 'vitest';
import { buildCoachPrompts, getJlptLevelPromptBoundary } from '../aiCoach';
import { ConversationScenario } from '../../../components/speaking/scenarioTypes';

describe('AI Coach JLPT Level Calibration & Prompt Engineering', () => {
  it('correctly generates strict N5 pedagogical boundary with forbidden Keigo and grammar', () => {
    const boundary = getJlptLevelPromptBoundary('N5', 'ja', 'gentle');
    expect(boundary).toContain('JLPT N5 (BEGINNER / 初級1) STRICT BOUNDARY');
    expect(boundary).toContain('〜です, 〜じゃありません');
    expect(boundary).toContain('NO Keigo / Sonkeigo / Kenjougo');
    expect(boundary).toContain('MAXIMUM 1 to 2 very short sentences');
  });

  it('calibrates roast persona appropriately for N5 without demanding N2/N1', () => {
    const boundary = getJlptLevelPromptBoundary('N5', 'ja', 'roast');
    expect(boundary).toContain('N5 ROAST STYLE');
    expect(boundary).toContain('DO NOT demand N2/N1 grammar');
    expect(boundary).not.toContain('Band 8.5+');
  });

  it('injects N5 level boundary into buildCoachPrompts when level is N5', () => {
    const { systemPrompt } = buildCoachPrompts(
      'こんにちは、わたしは留学生です。',
      [],
      'ja',
      'roast',
      null,
      'N5',
    );

    expect(systemPrompt).toContain('Target Level: N5');
    expect(systemPrompt).toContain('JLPT N5 (BEGINNER / 初級1) STRICT BOUNDARY');
    expect(systemPrompt).toContain('NO Keigo / Sonkeigo / Kenjougo');
    expect(systemPrompt).not.toContain('必ず高度な表現（N2/N1レベル');
  });

  it('respects scenario difficulty when scenario is provided', () => {
    const n5Scenario: ConversationScenario = {
      id: 'test_n5',
      language: 'ja',
      title_ja: 'テストシナリオ',
      title_uz: 'Test',
      emoji: '🎌',
      difficulty: 'N5',
      category: 'daily',
      description_uz: 'Test N5',
      opening_line_ja: 'こんにちは！',
      context_prompt: 'N5 test prompt',
      key_phrases: ['こんにちは'],
      is_custom: false,
    };

    const { systemPrompt } = buildCoachPrompts(
      'はじめまして',
      [],
      'ja',
      'gentle',
      n5Scenario,
      'N3', // user level is N3, but scenario is N5
    );

    // Scenario difficulty N5 should prevail
    expect(systemPrompt).toContain('Target Level: N5');
    expect(systemPrompt).toContain('JLPT N5 (BEGINNER / 初級1) STRICT BOUNDARY');
    expect(systemPrompt).toContain('【🚨 絶対遵守: JLPT N5 初級会話ルール — 超シンプル化】');
    expect(systemPrompt).toContain('接客敬語・尊敬語・謙譲語');
  });

  it('injects N4 scenario roleplay boundary when N4 scenario is provided', () => {
    const n4Scenario: ConversationScenario = {
      id: 'test_n4',
      language: 'ja',
      title_ja: 'レストラン',
      title_uz: 'Restoran',
      emoji: '🍣',
      difficulty: 'N4',
      category: 'daily',
      description_uz: 'Test N4',
      opening_line_ja: 'いらっしゃいませ！',
      context_prompt: '和食レストランのスタッフ',
      key_phrases: ['おすすめは何ですか'],
      is_custom: false,
    };

    const { systemPrompt } = buildCoachPrompts('こんにちは', [], 'ja', 'gentle', n4Scenario, 'N4');

    expect(systemPrompt).toContain('Target Level: N4');
    expect(systemPrompt).toContain('【🚨 絶対遵守: JLPT N4 初級会話ルール】');
  });

  it('correctly provides N4 boundary when N4 level is specified', () => {
    const boundary = getJlptLevelPromptBoundary('N4', 'ja', 'roast');
    expect(boundary).toContain('JLPT N4 (UPPER BEGINNER / 初級2) BOUNDARY');
    expect(boundary).toContain('〜なければなりません');
    expect(boundary).toContain('〜たり〜たりします');
  });

  it('allows natural free conversation without N5 restrictions in default casual mode', () => {
    const { systemPrompt } = buildCoachPrompts(
      '最近どんな映画を見ましたか？',
      [],
      'ja',
      'casual',
      null,
    );

    expect(systemPrompt).toContain('Target Level: Free Conversation (フリートーク・自由会話)');
    expect(systemPrompt).toContain('NATURAL FREE CONVERSATION');
    expect(systemPrompt).not.toContain('JLPT N5 (BEGINNER / 初級1) STRICT BOUNDARY');
    expect(systemPrompt).not.toContain('NO Keigo / Sonkeigo / Kenjougo');
  });

  it('correctly provides free natural conversation boundary when FREE level is requested', () => {
    const boundary = getJlptLevelPromptBoundary('FREE', 'ja', 'casual');
    expect(boundary).toContain('NATURAL FREE CONVERSATION (フリートーク・自由会話)');
    expect(boundary).not.toContain('CRITICAL PEDAGOGICAL LAW — JLPT N5');
  });
});
