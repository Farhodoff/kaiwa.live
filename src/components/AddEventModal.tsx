import React, { useState } from 'react';
import { X, Calendar, Clock, Bell, Repeat } from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import {
  EventType,
  RepetitionType,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  REPETITION_LABELS,
  WEEKDAY_LABELS,
} from '../types';
import { format } from 'date-fns';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, defaultDate }) => {
  const { addEvent } = useStudyData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('personal');
  const [eventDate, setEventDate] = useState(
    defaultDate
      ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [notifyBefore, setNotifyBefore] = useState(60);
  const [repetitionType, setRepetitionType] = useState<RepetitionType>('none');
  const [repetitionEndDate, setRepetitionEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await addEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventType,
        eventDate: new Date(eventDate).toISOString(),
        notifyBeforeMinutes: notifyBefore,
        repetitionType,
        repetitionEndDate: repetitionEndDate
          ? new Date(repetitionEndDate).toISOString()
          : undefined,
        repetitionDays: repetitionType === 'weekly' ? selectedDays : undefined,
      });

      // Reset
      setTitle('');
      setDescription('');
      setEventType('personal');
      setEventDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setNotifyBefore(60);
      setRepetitionType('none');
      setRepetitionEndDate('');
      setSelectedDays([]);
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Calendar className="text-indigo-600" size={24} />
            Yangi Tadbir Qo'shish
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto p-6"
        >
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tadbir Nomi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: JLPT N2 So'z Yodlash"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tur
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${eventType === type ? 'border-opacity-100 shadow-md' : 'border-gray-300 opacity-60 dark:border-gray-600'}`}
                  style={{
                    borderColor: eventType === type ? EVENT_TYPE_COLORS[type] : undefined,
                    backgroundColor:
                      eventType === type ? `${EVENT_TYPE_COLORS[type]}15` : undefined,
                  }}
                >
                  {EVENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock size={16} />
              Sana va Vaqt *
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Repetition */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Repeat size={16} />
              Takrorlanish
            </label>
            <select
              value={repetitionType}
              onChange={(e) => {
                setRepetitionType(e.target.value as RepetitionType);
                if (e.target.value === 'none') {
                  setRepetitionEndDate('');
                  setSelectedDays([]);
                }
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {(Object.keys(REPETITION_LABELS) as RepetitionType[]).map((type) => (
                <option key={type} value={type}>
                  {REPETITION_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Day Selection */}
          {repetitionType === 'weekly' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kunlar
              </label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`rounded p-2 text-xs font-medium transition-all ${
                      selectedDays.includes(index)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Repetition End Date */}
          {repetitionType !== 'none' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tugash Sanasi (Ixtiyoriy)
              </label>
              <input
                type="date"
                value={repetitionEndDate}
                onChange={(e) => setRepetitionEndDate(e.target.value)}
                min={format(new Date(eventDate), 'yyyy-MM-dd')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tavsif (Ixtiyoriy)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notification */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Bell size={16} />
              Eslatish
            </label>
            <select
              value={notifyBefore}
              onChange={(e) => setNotifyBefore(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={10}>10 daqiqa oldin</option>
              <option value={30}>30 daqiqa oldin</option>
              <option value={60}>1 soat oldin</option>
              <option value={1440}>1 kun oldin</option>
              <option value={10080}>1 hafta oldin</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
