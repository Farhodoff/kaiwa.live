import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, PRIORITY_COLORS } from '../../types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface DraggableTaskProps {
  task: Task;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
      type: 'Task',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none', // Required for Pointer Sensors
    zIndex: isDragging ? 1000 : 1,
  };

  const isCompleted = task.status === 'done' || task.completed;
  const isExam =
    task.title.toLowerCase().includes('exam') || task.title.toLowerCase().includes('imtihon');
  const isInterview =
    task.title.toLowerCase().includes('interview') || task.title.toLowerCase().includes('suhbat');

  // Dynamic Styles based on type
  const borderColor = isExam
    ? '#ef4444'
    : isInterview
      ? '#8b5cf6'
      : PRIORITY_COLORS[task.priority] || '#cbd5e1';
  const bgColor = isCompleted ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700';
  const textColor = isCompleted
    ? 'text-gray-400 dark:text-gray-500'
    : 'text-gray-900 dark:text-gray-100';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative mb-1.5 rounded-lg border-l-4 p-2 text-xs shadow-sm transition-all hover:shadow-md ${bgColor} ${isCompleted ? 'line-through' : ''} select-none`}
      style={{
        ...style,
        borderLeftColor: borderColor,
      }}
    >
      <div className={`flex items-start gap-1.5 ${textColor}`}>
        <div className="mt-0.5 shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={12} className="text-green-500" />
          ) : (
            <Circle size={12} className="text-gray-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-0.5 truncate font-medium leading-tight">
            {isExam && '🔴 '} {isInterview && '💼 '} {task.title}
          </p>

          {task.startTime && !isCompleted && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock size={10} />
              <span>
                {new Date(task.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableTask;
