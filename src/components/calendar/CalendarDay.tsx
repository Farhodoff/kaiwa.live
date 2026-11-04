import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task, Event, EVENT_TYPE_COLORS } from '../../types';
import DraggableTask from './DraggableTask';
import { format } from 'date-fns';

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  events: Event[];
  studyDuration: number; // in minutes
  isCurrentMonth: boolean;
  isToday: boolean;
  onShowMore?: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  tasks,
  events,
  studyDuration,
  isCurrentMonth,
  isToday,
  onShowMore,
}) => {
  // Unique ID for droppable: simple date string YYYY-MM-DD
  const dateId = format(date, 'yyyy-MM-dd');

  const { setNodeRef, isOver } = useDroppable({
    id: dateId,
    data: {
      date,
      type: 'Day',
    },
  });

  // Heatmap Logic
  const getHeatmapColor = (minutes: number) => {
    if (minutes <= 0) return 'bg-transparent';
    if (minutes < 30) return 'bg-indigo-50/50 dark:bg-indigo-900/10';
    if (minutes < 60) return 'bg-indigo-100/50 dark:bg-indigo-900/20'; // Light
    if (minutes < 180) return 'bg-indigo-200/50 dark:bg-indigo-900/40'; // Medium
    return 'bg-indigo-300/50 dark:bg-indigo-900/60'; // High intensity
  };

  const heatmapClass = getHeatmapColor(studyDuration);

  // Task display limit based on screen size (simplified as we don't have a reliable hook here,
  // but we can adjust CSS to hide items on very small heights)
  const DISPLAY_LIMIT = 2; // Reduced for better fit
  const visibleTasks = tasks.slice(0, DISPLAY_LIMIT);

  return (
    <div
      ref={setNodeRef}
      onClick={() => onShowMore?.()} // Allow tapping anywhere on mobile to see details
      className={`relative min-h-[80px] cursor-pointer border border-gray-100 p-1 transition-colors dark:border-gray-700 md:min-h-[120px] md:cursor-default md:p-2 ${isCurrentMonth ? 'bg-white dark:bg-[#1f2937]' : 'bg-gray-50/50 dark:bg-[#111827]/50'} ${heatmapClass} ${isOver ? 'z-10 ring-2 ring-inset ring-indigo-500' : ''} `}
    >
      {/* Header: Date & Mood */}
      <div className="mb-1 flex items-center justify-between md:mb-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold md:h-7 md:w-7 md:text-sm ${isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'} `}
        >
          {date.getDate()}
        </span>

        {studyDuration > 60 && (
          <span
            className="text-xs md:text-base"
            title={`${Math.round(studyDuration / 60)} soat o'qildi`}
          >
            🔥
          </span>
        )}
      </div>

      {/* Tasks & Events List - Hidden or very compact on mobile */}
      <div className="flex min-h-[30px] flex-col gap-0.5 overflow-hidden md:min-h-[60px] md:gap-1">
        <div className="hidden flex-col gap-1 md:flex">
          {visibleTasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </div>

        {/* Mobile indicators (dots) instead of full tasks */}
        <div className="flex flex-wrap gap-0.5 md:hidden">
          {tasks.map((t) => (
            <div key={t.id} className="h-1 w-1 rounded-full bg-indigo-500" />
          ))}
          {events.map((e) => (
            <div key={e.id} className="h-1 w-1 rounded-full bg-purple-500" />
          ))}
        </div>

        {/* Event Badges (Desktop only) */}
        <div className="hidden flex-col gap-1 md:flex">
          {events.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className="truncate rounded border-l-2 px-2 py-1 text-[10px] font-medium shadow-sm"
              style={{
                borderLeftColor: EVENT_TYPE_COLORS[event.eventType],
                backgroundColor: `${EVENT_TYPE_COLORS[event.eventType]}20`,
              }}
            >
              {event.title}
            </div>
          ))}
        </div>

        {/* Show More (Indicator) */}
        {(tasks.length > 0 || events.length > 0) && (
          <div className="mt-auto text-[8px] font-bold text-gray-400 md:hidden">
            {tasks.length + events.length} ta
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDay;
