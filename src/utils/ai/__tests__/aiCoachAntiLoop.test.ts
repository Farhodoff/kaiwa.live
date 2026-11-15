import { describe, it, expect } from 'vitest';
import { buildCoachPrompts } from '../aiCoach';
import { MINNA_SCENARIOS } from '../../../data/minnaScenarios';
import { N3_SCENARIOS } from '../../../data/n3Scenarios';
import { N2_SCENARIOS } from '../../../data/n2Scenarios';
import { N1_SCENARIOS } from '../../../data/n1Scenarios';

describe('AI Coach Anti-Loop & Conversational Progression Verification', () => {
  it('injects strict anti-loop and progression rules into system prompt for Japanese', () => {
    const { systemPrompt } = buildCoachPrompts(
      'いいえ、甲子園へ行きません。',
      [
        { role: 'assistant', content: 'はい、駅員です。どこへ行きますか？乗り場はこちらですよ。' },
        { role: 'user', content: 'いいえ、甲子園へ行きません。' },
      ],
      'ja',
      'casual',
      null,
      'N5',
    );

    // Verify anti-loop rules are present
    expect(systemPrompt).toContain('質問の反復禁止');
    expect(systemPrompt).toContain('絶対に繰り返してはいけません');
    expect(systemPrompt).toContain('否定・不一致への柔軟な対応');
    expect(systemPrompt).toContain('会話を必ず前進させる');
    expect(systemPrompt).toContain('KEY PHRASES（重要語彙）の正しい扱い');
  });

  it('prevents duplicate student current message in conversation history context', () => {
    const currentMsg = 'いいえ、行きません';
    const history = [
      { role: 'assistant' as const, content: 'どこへ行きますか？' },
      { role: 'user' as const, content: currentMsg },
    ];

    const { userPrompt } = buildCoachPrompts(currentMsg, history, 'ja', 'casual', null, 'N5');

    // The userPrompt should have the current message isolated in "Student's current message"
    // and historyText should NOT duplicate the user message inside "Conversation History"
    const historySection = userPrompt.split("Student's current message:")[0];

    // History section should only have the assistant's previous message
    expect(historySection).toContain('Coach: どこへ行きますか？');
    expect(historySection).not.toContain('Student: いいえ、行きません');

    // And the current message is clearly presented once
    expect(userPrompt).toContain(`Student's current message:\n      "${currentMsg}"`);
  });

  it('verifies that Minna Lesson 5 scenario includes progressive stages and handles "No/Negative" replies', () => {
    const l5Scenario = MINNA_SCENARIOS.find((s) => s.id === 'minna_l5_koushien');
    expect(l5Scenario).toBeDefined();

    const { systemPrompt } = buildCoachPrompts(
      'いいえ、行きません',
      [],
      'ja',
      'casual',
      l5Scenario,
      'N5',
    );

    expect(systemPrompt).toContain('進行ステップ');
    expect(systemPrompt).toContain('目的地の確認');
    expect(systemPrompt).toContain('柔軟に目的地を聞いてください');
  });

  it('verifies all 50 Minna no Nihongo lessons (Shokyu 1 & 2, Lessons 1–50) are present and have progressive steps', () => {
    for (let i = 1; i <= 50; i++) {
      const scenario = MINNA_SCENARIOS.find((s) => s.id.startsWith(`minna_l${i}_`));
      expect(scenario, `Minna lesson ${i} scenario should exist`).toBeDefined();
      expect(scenario?.context_prompt).toContain('進行ステップ');
    }
  });

  it('verifies all 30 JLPT N3 lessons are present and have progressive steps', () => {
    expect(N3_SCENARIOS.length).toBe(30);
    for (let i = 1; i <= 30; i++) {
      const scenario = N3_SCENARIOS.find((s) => s.id.startsWith(`n3_l${i}_`));
      expect(scenario, `N3 lesson ${i} scenario should exist`).toBeDefined();
      expect(scenario?.context_prompt).toContain('進行ステップ');
      expect(scenario?.difficulty).toBe('N3');
    }
  });

  it('verifies all 30 JLPT N2 lessons are present and have progressive steps', () => {
    expect(N2_SCENARIOS.length).toBe(30);
    for (let i = 1; i <= 30; i++) {
      const scenario = N2_SCENARIOS.find((s) => s.id.startsWith(`n2_l${i}_`));
      expect(scenario, `N2 lesson ${i} scenario should exist`).toBeDefined();
      expect(scenario?.context_prompt).toContain('進行ステップ');
      expect(scenario?.difficulty).toBe('N2');
    }
  });

  it('verifies all 30 JLPT N1 lessons are present and have progressive steps', () => {
    expect(N1_SCENARIOS.length).toBe(30);
    for (let i = 1; i <= 30; i++) {
      const scenario = N1_SCENARIOS.find((s) => s.id.startsWith(`n1_l${i}_`));
      expect(scenario, `N1 lesson ${i} scenario should exist`).toBeDefined();
      expect(scenario?.context_prompt).toContain('進行ステップ');
      expect(scenario?.difficulty).toBe('N1');
    }
  });
});
