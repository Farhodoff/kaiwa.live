import React from 'react';
import { X, Calendar } from 'lucide-react';
import { Task, Event, EVENT_TYPE_COLORS } from '../../types';
import DraggableTask from './DraggableTask';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  events: Event[];
  studyDuration: number;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  tasks,
  events,
  studyDuration,
}) => {
  if (!isOpen || !date) return null;

  const formattedDate = format(date, 'd MMMM yyyy, eeee', { locale: uz });
  const studyHours = Math.floor(studyDuration / 60);
  const studyMinutes = studyDuration % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Calendar className="text-indigo-600" size={24} />
              {formattedDate}
            </h3>
            {studyDuration > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                📚 O'qilgan vaqt: {studyHours > 0 && `${studyHours} soat `}
                {studyMinutes} daqiqa
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 overflow-y-auto p-6">
          {/* Tasks Section */}
          {tasks.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                ✅ Vazifalar
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({tasks.length})
                </span>
              </h4>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Events Section */}
          {events.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                📅 Tadbirlar
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({events.length})
                </span>
              </h4>
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700/50"
                    style={{
                      borderLeftColor: EVENT_TYPE_COLORS[event.eventType],
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {event.repetitionType !== 'none' && <span className="text-xs">🔁</span>}
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h5>
                        </div>
                        {event.description && (
                          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>🕐 {format(new Date(event.eventDate), 'HH:mm')}</span>
                          {event.repetitionType !== 'none' && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-600">
                              Takrorlanuvchi
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.eventType] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && events.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">📭</div>
              <p className="text-gray-500 dark:text-gray-400">
                Ushbu kun uchun vazifa yoki tadbir yo'q
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white transition-all hover:shadow-lg"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailsModal;
