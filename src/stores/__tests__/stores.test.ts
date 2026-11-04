import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { useSettingsStore } from '../useSettingsStore';
import { useGamificationStore } from '../useGamificationStore';
import { useSubjectStore } from '../useSubjectStore';
import { useFlashcardStore } from '../useFlashcardStore';
import { useTaskStore } from '../useTaskStore';
import { useNoteStore } from '../useNoteStore';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import type { User } from '@supabase/supabase-js';

vi.mock('../../utils/storage/safeLocalStorage', () => ({
  safeLocalStorage: {
    getJSON: vi.fn(),
    setJSON: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Zustand Stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuthStore', () => {
    it('should set user and cache it', () => {
      const mockUser = { id: 'user-1' } as User;
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(safeLocalStorage.setJSON).toHaveBeenCalledWith('study_planner_user_cache', mockUser);
    });

    it('should clear user and remove cache when user is null', () => {
      const { setUser } = useAuthStore.getState();

      setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
      expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('study_planner_user_cache');
    });

    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('useSettingsStore', () => {
    it('should have correct default settings', () => {
      const settings = useSettingsStore.getState().settings;
      expect(settings.theme).toBe('system');
      expect(settings.notificationsEnabled).toBe(true);
    });

    it('should update settings', () => {
      const { updateSettings } = useSettingsStore.getState();
      updateSettings({ theme: 'dark', dailyStudyGoalMinutes: 120 });

      const settings = useSettingsStore.getState().settings;
      expect(settings.theme).toBe('dark');
      expect(settings.dailyStudyGoalMinutes).toBe(120);
    });
  });

  describe('useGamificationStore', () => {
    it('should award XP and increase level', () => {
      const { awardXP, resetXP } = useGamificationStore.getState();
      resetXP();

      awardXP(600); // Level 1 is usually 0, 400 XP might mean Level 3 (if Math.sqrt(400/100)+1 = 3)

      const state = useGamificationStore.getState();
      expect(state.totalXp).toBe(600);
      expect(state.level).toBeGreaterThan(1);
    });

    it('should calculate rank correctly', () => {
      const { getRank } = useGamificationStore.getState();
      expect(getRank(1)).toBe("Boshlang'ich Talaba");
      expect(getRank(8)).toBe('Professor');
    });
  });

  describe('useSubjectStore', () => {
    it('should set subjects', () => {
      const { setSubjects } = useSubjectStore.getState();
      const mockSubjects = [{ id: 'sub-1', name: 'Math', color: 'red', schedule: [] }];

      setSubjects(mockSubjects);
      expect(useSubjectStore.getState().subjects).toEqual(mockSubjects);
    });
  });

  describe('useFlashcardStore', () => {
    it('should set flashcards', () => {
      const { setFlashcards } = useFlashcardStore.getState();
      const mockFlashcards = [
        {
          id: 'card-1',
          front: 'A',
          back: 'B',
          subjectId: '1',
          nextReviewDate: '2023-01-01',
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
        },
      ];

      setFlashcards(mockFlashcards);
      expect(useFlashcardStore.getState().flashcards).toEqual(mockFlashcards);
    });
  });

  describe('useTaskStore', () => {
    it('should set tasks and events', () => {
      const { setTasks, setEvents } = useTaskStore.getState();

      setTasks([
        {
          id: 'task-1',
          title: 'Task',
          completed: false,
          status: 'todo',
          priority: 'medium',
          createdAt: '2023-01-01',
        },
      ]);
      setEvents([
        {
          id: 'event-1',
          title: 'Event',
          eventType: 'personal',
          eventDate: '2023-01-01',
          notifyBeforeMinutes: 0,
          isNotified: false,
          repetitionType: 'none',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          userId: 'user1',
        },
      ]);

      expect(useTaskStore.getState().tasks.length).toBe(1);
      expect(useTaskStore.getState().events.length).toBe(1);
    });
  });

  describe('useNoteStore', () => {
    it('should set notes, study notes, and whiteboards', () => {
      const { setNotes, setStudyNotes, setWhiteboards } = useNoteStore.getState();

      setNotes([
        {
          id: 'note-1',
          title: 'Note',
          content: '',
          subjectId: '1',
          isPinned: false,
          createdAt: '',
          updatedAt: '',
          attachments: [],
        },
      ]);
      setStudyNotes([
        {
          id: 'sn-1',
          title: 'SNote',
          content: '',
          subjectId: '1',
          userId: 'user-1',
          createdAt: '',
          updatedAt: '',
        },
      ]);
      setWhiteboards([
        { id: 'wb-1', title: 'WB', subjectId: '1', userId: 'user-1', updatedAt: '' },
      ]);

      expect(useNoteStore.getState().notes.length).toBe(1);
      expect(useNoteStore.getState().studyNotes.length).toBe(1);
      expect(useNoteStore.getState().whiteboards.length).toBe(1);
    });
  });
});
