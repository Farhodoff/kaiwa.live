import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { uz } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  X,
} from 'lucide-react';
import { Task, Subject, Goal } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface TaskCalendarViewProps {
  tasks: Task[];
  subjects: Subject[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (taskData: Partial<Task>) => void;
}

// Draggable Task Item inside Calendar Day
const CalendarTaskItem: React.FC<{
  task: Task;
  subject?: Subject;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}> = ({ task, subject, onToggle, onDelete, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // If clicked on checkbox or delete, don't trigger parent
        e.stopPropagation();
        onClick();
      }}
      className={`group relative flex cursor-grab select-none items-center justify-between gap-1.5 rounded-lg border p-1.5 text-xs transition-all active:cursor-grabbing ${
        isDragging ? 'scale-95 border-dashed border-primary opacity-40' : ''
      } ${
        task.completed
          ? 'border-border/50 bg-muted/40 text-muted-foreground line-through opacity-70'
          : 'border-border bg-card text-foreground shadow-xs hover:border-primary/40 hover:bg-muted/60'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
        >
          {task.completed ? (
            <CheckCircle2 size={13} className="text-emerald-500" />
          ) : (
            <Circle size={13} className="hover:text-primary" />
          )}
        </button>

        {subject && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: subject.color || '#6366f1' }}
            title={subject.name}
          />
        )}

        <span className="truncate text-[11px] font-medium leading-tight">{task.title}</span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
        title="O'chirish"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
};

// Droppable Day Cell
const CalendarDayCell: React.FC<{
  date: Date;
  tasks: Task[];
  subjects: Subject[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenDayModal: (date: Date) => void;
  onQuickAddTask: (date: Date) => void;
}> = ({
  date,
  tasks,
  subjects,
  isCurrentMonth,
  isToday,
  onToggleTask,
  onDeleteTask,
  onOpenDayModal,
  onQuickAddTask,
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { date },
  });

  const DISPLAY_LIMIT = 3;
  const visibleTasks = tasks.slice(0, DISPLAY_LIMIT);
  const extraCount = tasks.length - DISPLAY_LIMIT;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onOpenDayModal(date)}
      className={`group relative flex min-h-[90px] cursor-pointer flex-col justify-between rounded-2xl border p-2 transition-all md:min-h-[120px] ${
        isCurrentMonth
          ? 'border-border bg-card/70 hover:border-primary/50'
          : 'border-border/40 bg-muted/10 opacity-40 hover:opacity-80'
      } ${
        isToday
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-2 ring-primary/80'
          : ''
      } ${isOver ? 'border-primary bg-primary/10 ring-2 ring-primary' : ''}`}
    >
      {/* Cell Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black transition-all ${
            isToday
              ? 'bg-primary text-primary-foreground shadow-xs'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground'
          }`}
        >
          {date.getDate()}
        </span>

        <div className="flex items-center gap-1">
          {tasks.length > 0 && (
            <span className="py-0.2 rounded-md bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
              {tasks.filter((t) => t.completed).length}/{tasks.length}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddTask(date);
            }}
            className="rounded-md bg-primary/10 p-1 text-primary opacity-0 transition-all hover:bg-primary/20 group-hover:opacity-100"
            title="Vazifa qo'shish"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {visibleTasks.map((task) => {
          const subject = subjects.find((s) => s.id === task.subjectId);
          return (
            <CalendarTaskItem
              key={task.id}
              task={task}
              subject={subject}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
              onClick={() => onOpenDayModal(date)}
            />
          );
        })}

        {extraCount > 0 && (
          <div className="rounded-md bg-primary/10 px-1.5 py-0.5 text-center text-[10px] font-bold text-primary hover:underline">
            + yana {extraCount} ta
          </div>
        )}
      </div>
    </div>
  );
};

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  subjects,
  goals,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
}) => {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal state for viewing/editing a specific day
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskSubject, setQuickTaskSubject] = useState('');
  const [quickTaskGoal, setQuickTaskGoal] = useState('');

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  // Active dragged task
  const activeTask = useMemo(() => tasks.find((t) => t.id === activeTaskId), [activeTaskId, tasks]);

  // Month generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Filter tasks by date & status
  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((task) => {
      const targetDate = (task.dueDate || task.deadline || task.startTime || '').split('T')[0];
      if (targetDate !== dateStr) return false;

      if (filterStatus === 'pending') return !task.completed;
      if (filterStatus === 'completed') return task.completed;
      return true;
    });
  };

  // Month statistics
  const monthStats = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    const monthTasks = tasks.filter((t) => {
      const d = (t.dueDate || t.deadline || t.startTime || '').split('T')[0];
      return d.startsWith(monthStr);
    });

    const total = monthTasks.length;
    const completed = monthTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, rate };
  }, [tasks, currentMonth]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (over && active.id) {
      const newDateStr = over.id as string; // 'yyyy-MM-dd'
      onUpdateTask(active.id as string, {
        dueDate: newDateStr,
      });
    }
  };

  // Quick Add handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !selectedDate) return;

    onAddTask({
      title: quickTaskTitle.trim(),
      priority: 'medium',
      dueDate: format(selectedDate, 'yyyy-MM-dd'),
      subjectId: quickTaskSubject || undefined,
      goalId: quickTaskGoal || undefined,
    });

    setQuickTaskTitle('');
  };

  const weekDayNames = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="glass-card flex flex-col justify-between gap-4 rounded-3xl border-border p-4 md:flex-row md:items-center md:p-5">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary shadow-xs">
            <CalendarIcon size={20} />
          </div>

          <div>
            <h3 className="text-xl font-black capitalize tracking-tight text-foreground">
              {format(currentMonth, 'LLLL yyyy', { locale: language === 'en' ? undefined : uz })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {monthStats.total > 0
                ? `${monthStats.total} ta vazifadan ${monthStats.completed} tasi bajarildi (${monthStats.rate}%)`
                : 'Bu oy uchun rejalar'}
            </p>
          </div>

          <div className="ml-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-xl border border-border bg-card p-2 text-foreground transition-all hover:bg-muted"
              title="Oldingi oy"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-xl border border-border bg-card p-2 text-foreground transition-all hover:bg-muted"
              title="Keyingi oy"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 self-start rounded-xl border border-border bg-muted/60 p-1 md:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-background font-black text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Barchasi ({monthStats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500 font-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kutilayotgan ({monthStats.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 font-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Bajarilgan ({monthStats.completed})
          </button>
        </div>
      </div>

      {/* Calendar Drag Context & Grid */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="glass-card space-y-3 rounded-3xl border-border p-3 md:p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {weekDayNames.map((name, i) => (
              <div
                key={name}
                className={`rounded-lg py-1.5 text-xs font-black uppercase tracking-wider ${
                  i >= 5 ? 'text-rose-400/80' : 'text-muted-foreground'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {calendarDays.map((date) => {
              const dateTasks = getTasksForDate(date);
              const isCurrent = isSameMonth(date, currentMonth);
              const isTodayDate = isSameDay(date, new Date());

              return (
                <CalendarDayCell
                  key={date.toISOString()}
                  date={date}
                  tasks={dateTasks}
                  subjects={subjects}
                  isCurrentMonth={isCurrent}
                  isToday={isTodayDate}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onOpenDayModal={(d) => {
                    setSelectedDate(d);
                  }}
                  onQuickAddTask={(d) => {
                    setSelectedDate(d);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Drag Overlay Preview */}
        <DragOverlay>
          {activeTask ? (
            <div className="flex max-w-[200px] items-center gap-2 rounded-xl border-2 border-primary bg-card p-2 text-xs font-bold text-foreground shadow-2xl">
              <Sparkles size={14} className="text-primary" />
              <span className="truncate">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Day Detail & Quick Add Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg space-y-6 overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-black capitalize text-foreground">
                    {format(selectedDate, 'd MMMM yyyy, eeee', {
                      locale: language === 'en' ? undefined : uz,
                    })}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Kunlik vazifalar ro'yxati va tezkor rejalashtirish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Task Add Form for this day */}
            <form
              onSubmit={handleQuickAdd}
              className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4"
            >
              <span className="flex items-center gap-1.5 text-xs font-black text-foreground">
                <Plus size={14} className="text-primary" />
                Ushbu kunga yangi vazifa qo'shish:
              </span>

              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Vazifa nomi..."
                className="focus:outline-hidden w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  value={quickTaskSubject}
                  onChange={(e) => setQuickTaskSubject(e.target.value)}
                  className="focus:outline-hidden rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Fanga bog'lash</option>
                  {subjects
                    .filter((s) => !s.isArchived)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>

                <select
                  value={quickTaskGoal}
                  onChange={(e) => setQuickTaskGoal(e.target.value)}
                  className="focus:outline-hidden rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Maqsadga bog'lash</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                Qo'shish
              </button>
            </form>

            {/* Day Tasks List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rejalashtirilgan vazifalar ({getTasksForDate(selectedDate).length}):
              </span>

              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Ushbu kunga hali hech qanday vazifa rejalashtirilmagan.
                </div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {getTasksForDate(selectedDate).map((task) => {
                    const subject = subjects.find((s) => s.id === task.subjectId);
                    const goal = goals.find((g) => g.id === task.goalId);

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                          task.completed
                            ? 'border-border/60 bg-muted/30 opacity-60'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onToggleTask(task.id)}
                            className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                          >
                            {task.completed ? (
                              <CheckCircle2 size={18} className="text-emerald-500" />
                            ) : (
                              <Circle size={18} />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-bold ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                            >
                              {task.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              {subject && (
                                <span
                                  className="py-0.2 rounded-md border px-2 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: subject.color + '15',
                                    color: subject.color,
                                    borderColor: subject.color + '30',
                                  }}
                                >
                                  {subject.name}
                                </span>
                              )}
                              {goal && (
                                <span className="py-0.2 rounded-md bg-primary/10 px-2 text-[10px] font-bold text-primary">
                                  🎯 {goal.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendarView;
