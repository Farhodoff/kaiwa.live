import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus } from '../types';
import { TaskService } from '../services/TaskService';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { isUuid } from '../utils/uuid';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'local_user';
};

const saveTasksToLocalStorage = (taskList: Task[], userId?: string) => {
  try {
    const id = userId || getActiveUserId();
    localStorage.setItem(`study_planner_tasks_${id}`, JSON.stringify(taskList));
    if (id === 'local_user') {
      localStorage.setItem('study_planner_tasks', JSON.stringify(taskList));
    }
  } catch (e) {
    console.warn('Failed to sync tasks to localStorage:', e);
  }
};

const getAuthUserId = async (): Promise<string> => {
  try {
    if (typeof supabase?.auth?.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.id) return data.session.user.id;
      return 'local_user';
    }
    if (typeof supabase?.auth?.getUser === 'function') {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) return data.user.id;
    }
  } catch {}
  return 'local_user';
};

export const useTasks = (onTaskCompleted?: (amount: number) => Promise<void>) => {
  const onTaskCompletedRef = useRef(onTaskCompleted);
  useEffect(() => {
    onTaskCompletedRef.current = onTaskCompleted;
  }, [onTaskCompleted]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const activeId = getActiveUserId();
      const userKey = `study_planner_tasks_${activeId}`;
      const raw = localStorage.getItem(userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      if (activeId === 'local_user') {
        const legacy = localStorage.getItem('study_planner_tasks');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load initial tasks from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    saveTasksToLocalStorage(tasks);
  }, [tasks]);

  const addTask = useCallback(async (taskData: Partial<Task>) => {
    const activeUserId = await getAuthUserId();

    // Optimistic update
    const tempId = taskData.id || `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      userId: activeUserId,
      title: taskData.title || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || new Date().toISOString(),
      completed: false,
      createdAt: new Date().toISOString(),
      ...taskData,
    } as Task;

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === tempId);
      const updated = exists
        ? prev.map((t) => (t.id === tempId ? optimisticTask : t))
        : [...prev, optimisticTask];
      saveTasksToLocalStorage(updated);
      return updated;
    });

    if (activeUserId !== 'local_user') {
      try {
        const newTask = await TaskService.addTask(activeUserId, taskData);
        if (newTask) {
          // Replace temp task with real one
          setTasks((prev) => {
            const updated = prev.map((t) => (t.id === tempId ? newTask : t));
            saveTasksToLocalStorage(updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to add task:', error);
      }
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveTasksToLocalStorage(updated);
      return updated;
    });
    try {
      await TaskService.updateTask(id, updates);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, []);

  const toggleTask = useCallback(async (id: string) => {
    let isNowCompleted = false;
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      isNowCompleted = !task.completed;
      const updated = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: isNowCompleted,
              status: (isNowCompleted ? 'done' : 'todo') as TaskStatus,
            }
          : t,
      );
      saveTasksToLocalStorage(updated);
      return updated;
    });

    try {
      await TaskService.updateTaskStatus(id, isNowCompleted ? 'done' : 'todo', isNowCompleted);
      if (isNowCompleted && onTaskCompletedRef.current) {
        await onTaskCompletedRef.current(50);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    const completed = status === 'done' || status === 'completed';

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, status: status as TaskStatus, completed } : t,
      );
      saveTasksToLocalStorage(updated);
      return updated;
    });

    try {
      await TaskService.updateTaskStatus(id, status, completed);
      if (completed && onTaskCompletedRef.current) {
        await onTaskCompletedRef.current(50);
      }

      // Bidirectional sync with Personal Learning Plan
      if (id.startsWith('plan_task_') || id.includes('plan_')) {
        const cleanTaskId = id.replace('plan_task_', '');
        // Check all cached plans for this task
        const rawPlans = localStorage.getItem('study_planner_weekly_plans');
        if (rawPlans) {
          try {
            const parsedPlans = JSON.parse(rawPlans);
            if (Array.isArray(parsedPlans)) {
              let modified = false;
              const updatedPlans = parsedPlans.map((plan) => {
                const dayMatch = plan.days?.some((d: any) =>
                  d.tasks?.some((t: any) => t.id === cleanTaskId || t.id === id),
                );
                if (!dayMatch) return plan;
                modified = true;
                return {
                  ...plan,
                  days: plan.days.map((d: any) => ({
                    ...d,
                    tasks: d.tasks.map((t: any) => {
                      if (t.id === cleanTaskId || t.id === id) {
                        return { ...t, completed, status: completed ? 'completed' : 'pending' };
                      }
                      return t;
                    }),
                  })),
                };
              });
              if (modified) {
                localStorage.setItem('study_planner_weekly_plans', JSON.stringify(updatedPlans));
              }
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }, []);

  const deleteTask = useCallback(async (id: string, permanent = false) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTasksToLocalStorage(updated);
      return updated;
    });
    try {
      await TaskService.deleteTask(id, permanent);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, []);

  const restoreTask = useCallback(async (id: string) => {
    try {
      await TaskService.restoreTask(id);
      const userId = await getAuthUserId();
      if (userId !== 'local_user') {
        const updatedTasks = await TaskService.fetchTasks(userId);
        setTasks(updatedTasks);
        saveTasksToLocalStorage(updatedTasks);
      }
    } catch (error) {
      console.error('Failed to restore task:', error);
    }
  }, []);

  const addTasksBatch = useCallback(async (tasksData: Partial<Task>[]) => {
    const userId = await getAuthUserId();
    if (userId === 'local_user') return [];

    try {
      const newTasks = await TaskService.addTasksBatch(userId, tasksData);
      if (newTasks.length > 0) {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const filteredNew = newTasks.filter((t) => !existingIds.has(t.id));
          const updated = [...prev, ...filteredNew];
          saveTasksToLocalStorage(updated);
          return updated;
        });
      }
      return newTasks;
    } catch (error) {
      console.error('Failed to add tasks batch:', error);
      return [];
    }
  }, []);

  const setTasksState = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasksToLocalStorage(newTasks);
  }, []);

  return {
    tasks,
    setTasks: setTasksState,
    addTask,
    addTasksBatch,
    updateTask,
    toggleTask,
    updateTaskStatus,
    deleteTask,
    restoreTask,
  };
};
