import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataMigrationService } from '../DataMigrationService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({
    upsert: mockUpsert,
    insert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  });
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123', email: 'test@example.com' } },
        }),
      },
    },
  };
});

describe('DataMigrationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should ignore guest or invalid user IDs', async () => {
    const res = await DataMigrationService.migrateAllLocalDataToDB('guest');
    expect(res.speakingSessions).toBe(0);
    expect(res.diagnosticResults).toBe(0);
  });

  it('should migrate speaking coach sessions to speaking_sessions table', async () => {
    const mockSessions = [
      {
        id: 'coach_123',
        personaTitle: 'Sensei Kenji',
        fluencyScore: 85,
        pronunciationScore: 80,
        feedback: 'Good pitch accent',
        transcript: [{ speaker: 'user', text: 'Konnichiwa' }],
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('study_planner_speaking_coach_sessions', JSON.stringify(mockSessions));

    const res = await DataMigrationService.migrateAllLocalDataToDB('test-user-123');
    expect(res.speakingSessions).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('speaking_sessions');
  });

  it('should migrate diagnostic results to diagnostic_results table', async () => {
    const mockDiag = {
      id: 'diag_123',
      overallScore: 78,
      diagnosticLevel: 'N3',
      overallConfidence: 85,
      weaknesses: ['Particle wa vs ga'],
      strengths: ['Kanji N4'],
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('study_planner_diag_result_test-user-123_ja', JSON.stringify(mockDiag));

    const res = await DataMigrationService.migrateAllLocalDataToDB('test-user-123');
    expect(res.diagnosticResults).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('diagnostic_results');
  });

  it('should migrate error vault mistakes to speaking_errors table', async () => {
    const mockErrors = [
      {
        id: 'err_1',
        verbatim: 'I am go to school',
        correction: 'I go to school',
        category: 'grammar',
        language: 'en',
      },
    ];
    localStorage.setItem('study_planner_error_vault', JSON.stringify(mockErrors));

    const res = await DataMigrationService.migrateAllLocalDataToDB('test-user-123');
    expect(res.speakingErrors).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('speaking_errors');
  });
});
