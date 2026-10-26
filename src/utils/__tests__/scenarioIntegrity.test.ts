import { describe, it, expect } from 'vitest';
import { DEFAULT_SCENARIOS } from '../../data/defaultScenarios';

describe('Speaking Conversation Scenarios Integrity Tests', () => {
  it('1. All scenarios in DEFAULT_SCENARIOS must have unique IDs', () => {
    const ids = DEFAULT_SCENARIOS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('2. "business_koushou" must exist exactly once', () => {
    const matches = DEFAULT_SCENARIOS.filter((s) => s.id === 'business_koushou');
    expect(matches.length).toBe(1);
    expect(matches[0].difficulty).toBe('N1');
    expect(matches[0].language).toBe('ja');
  });

  it('3. "shakai_mondai_iken" must have valid snake_case ID without spaces', () => {
    const spaceIdScenario = DEFAULT_SCENARIOS.find((s) => s.id.includes(' '));
    expect(spaceIdScenario).toBeUndefined();

    const shakaiScenario = DEFAULT_SCENARIOS.find((s) => s.id === 'shakai_mondai_iken');
    expect(shakaiScenario).toBeDefined();
    expect(shakaiScenario?.title_ja).toContain('社会問題');
  });

  it('4. All scenario IDs must match snake_case format', () => {
    for (const scenario of DEFAULT_SCENARIOS) {
      expect(scenario.id).toMatch(/^[a-z0-9_]+$/);
      expect(scenario.id).not.toContain(' ');
    }
  });

  it('5. Verify accurate scenario counts (0 English, 34 Japanese = 34 total)', () => {
    const enScenarios = DEFAULT_SCENARIOS.filter((s) => s.language === 'en');
    const jaScenarios = DEFAULT_SCENARIOS.filter((s) => s.language === 'ja' || !s.language);

    expect(enScenarios.length).toBe(0);
    expect(jaScenarios.length).toBe(34);
    expect(DEFAULT_SCENARIOS.length).toBe(34);
  });
});
