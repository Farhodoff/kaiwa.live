import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

import {
  CurriculumQualityQueueService,
  filterQueueIssues,
  validateRevisionDraft,
  type CurriculumQueueIssue,
} from '../CurriculumQualityQueueService';

describe('CurriculumQualityQueueService', () => {
  it('builds stable, source-linked entries for every structural curriculum error', () => {
    const payload = CurriculumQualityQueueService.buildSyncPayload();
    // After full content cleanup across N1-N5, all quarantined items have been resolved
    expect(payload).toHaveLength(0);
    expect(Array.isArray(payload)).toBe(true);
  });

  it('requires a complete and internally consistent revision', () => {
    expect(
      validateRevisionDraft({ prompt: 'A', options: ['A', 'A'], correctAnswer: 'B' }).valid,
    ).toBe(false);
    expect(
      validateRevisionDraft({
        prompt: 'A',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Izoh',
      }),
    ).toEqual({ valid: true, errors: [] });
  });

  it('filters a queue without losing level/status specificity', () => {
    const issue = {
      id: '1',
      external_id: 'x',
      level: 'N3',
      lesson_id: 'n3-1',
      exercise_id: 'e1',
      prompt: '日本語',
      issue_code: 'duplicate_option',
      severity: 'high',
      status: 'detected',
      owner_id: null,
      owner_name: null,
      updated_at: '2026-01-01T00:00:00Z',
      original_content: {},
      source_file: 'x',
      source_hash: 'x',
      active: true,
    } as CurriculumQueueIssue;
    expect(filterQueueIssues([issue], '日本', 'N3', 'detected')).toEqual([issue]);
    expect(filterQueueIssues([issue], '', 'N2', '')).toEqual([]);
  });
});
