import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MasteryEngine } from '../MasteryEngine';
import { supabase } from '../../lib/supabase';
import { toDeterministicUUID } from '../../utils/uuid';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { EvidenceRecord } from '../MasteryEngine';

// Fluent/Chainable Supabase Mock
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpsert = vi.fn();
const mockInsert = vi.fn();

const chainableMock = {
  select: mockSelect,
  eq: mockEq,
  upsert: mockUpsert,
  insert: mockInsert,
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

// Make sure the fluent methods return the builder itself
mockSelect.mockReturnValue(chainableMock);
mockEq.mockReturnValue(chainableMock);
mockUpsert.mockReturnValue(chainableMock);
mockInsert.mockReturnValue(chainableMock);

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => chainableMock),
    },
  };
});

const testUserId = 'test-user-id';

describe('MasteryEngine Database Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockEq.mockReturnValue(chainableMock);
  });

  it('should save a recorded evidence record to Supabase', async () => {
    mockUpsert.mockResolvedValue({ error: null });

    const record: EvidenceRecord = {
      id: 'evidence-1',
      skill: 'vocabulary',
      timestamp: new Date().toISOString(),
      score: 80,
      activityType: 'quiz',
    };

    MasteryEngine.recordEvidence(testUserId, 'en', record);

    // Allow async write to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(supabase.from).toHaveBeenCalledWith('mastery_evidence');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: toDeterministicUUID('evidence-1'),
        user_id: testUserId,
        language: 'en',
        skill: 'vocabulary',
        score: 80,
      }),
    );
  });

  it('should sync evidence records from Supabase and cache them', async () => {
    const mockDbData = [
      {
        id: toDeterministicUUID('db-ev-1'),
        user_id: testUserId,
        language: 'en',
        skill: 'vocabulary',
        activity_type: 'quiz',
        score: 90,
        timestamp: new Date().toISOString(),
        category: 'performance',
        mastery_impact: 40,
      },
    ];

    mockEq.mockImplementation((key) => {
      if (key === 'language') {
        return Promise.resolve({ data: mockDbData, error: null });
      }
      return chainableMock;
    });

    await MasteryEngine.syncEvidenceFromDB(testUserId, 'en');

    expect(supabase.from).toHaveBeenCalledWith('mastery_evidence');

    const cacheKey = `study_planner_mastery_evidence_${testUserId}_en`;
    const cached = safeLocalStorage.getJSON<EvidenceRecord[]>(cacheKey, []);
    expect(cached.length).toBe(1);
    expect(cached[0].score).toBe(90);
    expect(cached[0].skill).toBe('vocabulary');
  });

  it('should trigger a migration of legacy localStorage records if Supabase is empty', async () => {
    // Mock empty Supabase DB
    mockEq.mockImplementation((key) => {
      if (key === 'language') {
        return Promise.resolve({ data: [], error: null });
      }
      return chainableMock;
    });
    mockUpsert.mockResolvedValue({ error: null });

    // Add legacy data in localStorage
    const cacheKey = `study_planner_mastery_evidence_${testUserId}_en`;
    const legacyData: EvidenceRecord[] = [
      {
        id: 'legacy-1',
        skill: 'grammar',
        timestamp: new Date().toISOString(),
        score: 75,
        activityType: 'grammar',
      },
    ];
    safeLocalStorage.setJSON(cacheKey, legacyData);

    await MasteryEngine.syncEvidenceFromDB(testUserId, 'en');

    // Verify it selected and then upserted
    expect(supabase.from).toHaveBeenCalledWith('mastery_evidence');
    expect(mockUpsert).toHaveBeenCalled();
  });
});
