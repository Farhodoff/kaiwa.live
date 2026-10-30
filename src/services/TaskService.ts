import { supabase } from '../lib/supabase';
import { Task, TaskStatus, Priority } from '../types';
import { DatabaseTask, DatabaseTaskUpdate } from '../types/supabase-types';
import { GoogleCalendarService } from './GoogleCalendarService';
import { isUuid, generateUUID } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { logger } from '../utils/logger';

const sanitizeSubjectId = (id?: string | null): string | null => {
  if (!id) return null;
  if (isUuid(id)) return id;
  if (id === 'sub_jlpt_master') return '00000000-0000-4000-8000-000000000001';
  if (id === 'sub_ielts_master') return '00000000-0000-4000-8000-000000000002';
  if (id === 'sub_it_programming') return '00000000-0000-4000-8000-000000000003';
  if (id === 'sub_general_notes') return '00000000-0000-4000-8000-000000000004';
  return null;
};

const getTaskCacheKey = (userId?: string) => `study_planner_tasks_${userId || 'local_user'}`;

export const TaskService = {
  async fetchTasks(userId: string): Promise<Task[]> {
    const cacheKey = getTaskCacheKey(userId);
    if (!userId || !isUuid(userId)) {
      return safeLocalStorage.getJSON<Task[]>(
        cacheKey,
        safeLocalStorage.getJSON<Task[]>('study_planner_tasks', []),
      );
    }

    try {
      let { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error && (error.code === '42703' || error.message?.includes('deleted_at'))) {
        const retry = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const dbTasks = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        completed: t.completed,
        status: t.status as TaskStatus,
        priority: t.priority as Priority,
        subjectId: t.subject_id,
        goalId: t.goal_id,
        dueDate: t.due_date,
        deadline: t.due_date,
        createdAt: t.created_at,
        googleEventId: t.google_event_id,
        deletedAt: t.deleted_at || undefined,
        srsLessonId: t.srs_lesson_id || undefined,
        srsReviewDate: t.srs_review_date || undefined,
      })) as Task[];

      // Merge with local tasks scoped to this user so offline changes are preserved without cross-user leakage
      const localTasks = safeLocalStorage
        .getJSON<Task[]>(cacheKey, [])
        .filter((t) => !t.userId || t.userId === userId);
      const dbTaskIds = new Set(dbTasks.map((t) => t.id));
      const missingLocalTasks = localTasks.filter((t) => !dbTaskIds.has(t.id));
      const allMergedTasks = [...dbTasks, ...missingLocalTasks];

      safeLocalStorage.setJSON(cacheKey, allMergedTasks);
      safeLocalStorage.setJSON('study_planner_tasks', allMergedTasks);

      return allMergedTasks;
    } catch (error: any) {
      if (
        error?.message &&
        !error.message.includes('Offline') &&
        !error.message.includes('Network')
      ) {
        logger.warn('TaskService', `Fetch tasks warning: ${error.message}`);
      }
      return safeLocalStorage.getJSON<Task[]>(
        cacheKey,
        safeLocalStorage.getJSON<Task[]>('study_planner_tasks', []),
      );
    }
  },

  async addReviewTask(
    userId: string,
    taskData: Partial<Task> & { srsLessonId: string; srsReviewDate: string },
  ): Promise<Task | null> {
    if (!taskData.srsLessonId.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(taskData.srsReviewDate)) {
      throw new Error('SRS task requires a lesson ID and review date.');
    }

    const localTask: Task = {
      id: generateUUID(),
      userId,
      title: taskData.title || '',
      dueDate: taskData.dueDate,
      status: 'todo',
      priority: taskData.priority || 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      srsLessonId: taskData.srsLessonId,
      srsReviewDate: taskData.srsReviewDate,
    };
    if (!isUuid(userId)) return localTask;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: localTask.title,
        due_date: localTask.dueDate,
        status: localTask.status,
        priority: localTask.priority,
        completed: false,
        srs_lesson_id: taskData.srsLessonId,
        srs_review_date: taskData.srsReviewDate,
      })
      .select()
      .single();

    // Only this specific uniqueness violation is a successful idempotent no-op.
    if (error?.code === '23505' && String(error.message).includes('tasks_srs_review_unique')) {
      return null;
    }
    if (error) throw error;
    if (!data) throw new Error('SRS task insert returned no saved task.');

    const task: Task = {
      ...localTask,
      id: data.id,
      title: data.title,
      dueDate: data.due_date,
      deadline: data.due_date,
      completed: data.completed,
      status: data.status as TaskStatus,
      createdAt: data.created_at,
    };

    // External side effects must happen only after winning the database insert race.
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.provider_token && task.dueDate) {
        const googleEventId = await GoogleCalendarService.createEvent(session.provider_token, task);
        if (googleEventId) {
          const { error: calendarError } = await supabase
            .from('tasks')
            .update({ google_event_id: googleEventId })
            .eq('id', task.id)
            .eq('user_id', userId);
          if (calendarError) throw calendarError;
          task.googleEventId = googleEventId;
        }
      }
    } catch (calendarError) {
      logger.warn('TaskService', 'SRS task saved, but calendar sync failed', calendarError);
    }
    return task;
  },

  async addTask(userId: string, taskData: Partial<Task>): Promise<Task | null> {
    const validSubjectId = sanitizeSubjectId(taskData.subjectId) || undefined;
    const validGoalId = (isUuid(taskData.goalId) ? taskData.goalId : undefined) || undefined;

    const dbTask: Omit<DatabaseTask, 'id' | 'created_at'> & { id?: string } = {
      user_id: userId,
      title: taskData.title || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      completed: !!taskData.completed,
      due_date: taskData.deadline || taskData.dueDate,
      goal_id: validGoalId,
      subject_id: validSubjectId,
    };

    // 1. Google Calendar Integration
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.provider_token && (taskData.dueDate || taskData.deadline)) {
        const googleEventId = await GoogleCalendarService.createEvent(
          session.provider_token,
          taskData,
        );
        if (googleEventId) {
          dbTask.google_event_id = googleEventId;
        }
      }
    } catch (calErr) {
      logger.debug('TaskService', 'Google Calendar event creation bypassed', calErr);
    }

    try {
      let { data, error } = await supabase.from('tasks').insert(dbTask).select().single();

      if (error) {
        // Retry without subject/goal if foreign key constraint triggered
        const minimalDbTask = {
          user_id: userId,
          title: taskData.title || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          completed: !!taskData.completed,
          due_date: taskData.deadline || taskData.dueDate,
        };
        const retry = await supabase.from('tasks').insert(minimalDbTask).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const returnedData = data as DatabaseTask;
      return {
        id: returnedData.id,
        title: returnedData.title,
        completed: returnedData.completed,
        status: returnedData.status as TaskStatus,
        priority: returnedData.priority as Priority,
        goalId: returnedData.goal_id,
        subjectId: returnedData.subject_id || taskData.subjectId,
        dueDate: returnedData.due_date,
        deadline: returnedData.due_date,
        createdAt: returnedData.created_at,
        googleEventId: returnedData.google_event_id,
        deletedAt: returnedData.deleted_at || undefined,
      };
    } catch (error) {
      console.warn('Add task notice (local fallback retained):', error);
      return {
        id: taskData.id || generateUUID(),
        title: taskData.title || '',
        completed: !!taskData.completed,
        status: (taskData.status || 'todo') as TaskStatus,
        priority: (taskData.priority || 'medium') as Priority,
        goalId: taskData.goalId,
        subjectId: taskData.subjectId,
        dueDate: taskData.deadline || taskData.dueDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  },

  async addTasksBatch(userId: string, tasksData: Partial<Task>[]): Promise<Task[]> {
    const dbTasks = tasksData.map((taskData) => {
      const dbTask: Omit<DatabaseTask, 'id' | 'created_at'> & { id?: string } = {
        user_id: userId,
        title: taskData.title || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        completed: !!taskData.completed,
        due_date: taskData.deadline || taskData.dueDate,
        goal_id: (isUuid(taskData.goalId) ? taskData.goalId : undefined) || undefined,
        subject_id: sanitizeSubjectId(taskData.subjectId) || undefined,
      };
      return dbTask;
    });

    try {
      const { data, error } = await supabase.from('tasks').insert(dbTasks).select();

      if (error) throw error;
      if (!data) return [];

      return (data as DatabaseTask[]).map((returnedData) => ({
        id: returnedData.id,
        title: returnedData.title,
        completed: returnedData.completed,
        status: returnedData.status as TaskStatus,
        priority: returnedData.priority as Priority,
        goalId: returnedData.goal_id,
        subjectId: returnedData.subject_id,
        dueDate: returnedData.due_date,
        deadline: returnedData.due_date,
        createdAt: returnedData.created_at,
        googleEventId: returnedData.google_event_id,
        deletedAt: returnedData.deleted_at || undefined,
      })) as Task[];
    } catch (error) {
      console.warn('Add tasks batch notice:', error);
      return [];
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('google_event_id')
        .eq('id', id)
        .maybeSingle();
      if (taskData?.google_event_id) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.provider_token) {
          await GoogleCalendarService.updateEvent(
            session.provider_token,
            taskData.google_event_id,
            updates,
          ).catch(() => {});
        }
      }
    } catch {
      // Ignore optional google_event_id query failures in offline/anonymous mode
    }

    try {
      const dbUpdates: DatabaseTaskUpdate = {};
      if (updates.subjectId) dbUpdates.subject_id = updates.subjectId;
      if (updates.goalId) dbUpdates.goal_id = updates.goalId;
      if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
      if (updates.deadline) dbUpdates.due_date = updates.deadline;
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

      const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  },

  async updateTaskStatus(id: string, status: string, completed: boolean): Promise<void> {
    await this.updateTask(id, { status: status as TaskStatus, completed });
  },

  async deleteTask(id: string, permanent = false): Promise<void> {
    let googleEventId: string | null = null;
    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('google_event_id')
        .eq('id', id)
        .maybeSingle();
      googleEventId = taskData?.google_event_id || null;
    } catch {
      // Ignore optional google_event_id fetch error
    }

    if (permanent) {
      // Google Calendar Sync
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.provider_token && googleEventId) {
        await GoogleCalendarService.deleteEvent(session.provider_token, googleEventId).catch(
          () => {},
        );
      }

      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Delete task error:', error);
        throw error;
      }
    } else {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Soft delete task error:', error);
        throw error;
      }
    }
  },

  async restoreTask(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('tasks').update({ deleted_at: null }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Restore task error:', error);
      throw error;
    }
  },
};
