import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { SUBJECT_ICONS } from './constants';
import { Subject } from '../../types';

interface SubjectFormProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    color: string;
    icon: string;
    schedule: string[];
  }) => void;
  initialData?: Subject;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#8b5cf6');
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || 'book');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name,
      description: description.trim() || undefined,
      icon: selectedIcon,
      color,
      schedule: initialData?.schedule || [],
    });
  };

  return (
    <div className="glass-card mb-8 rounded-2xl p-6 duration-300 animate-in slide-in-from-top-4">
      <h3 className="mb-4 text-lg font-bold text-foreground">
        {initialData ? 'Fanni Tahrirlash' : 'Yangi Fan'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fan Nomi</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-foreground outline-none backdrop-blur-sm focus:ring-2 focus:ring-primary"
              placeholder="masalan, Backend Development"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rang</label>
            <div className="flex gap-2">
              {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-gray-400 ring-offset-2 dark:ring-gray-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tavsif</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-2 text-foreground outline-none backdrop-blur-sm focus:ring-2 focus:ring-primary"
            placeholder="Fan haqida qisqacha ma'lumot..."
          />
          <div className="text-right text-xs text-muted-foreground">{description.length}/100</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Belgi (Ikonka)</label>
          <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
            {SUBJECT_ICONS.map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedIcon(id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition-all ${
                  selectedIcon === id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                title={label}
              >
                <Icon
                  size={20}
                  className={selectedIcon === id ? 'text-primary' : 'text-muted-foreground'}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            Bekor qilish
          </button>
          <Button type="submit">{initialData ? 'Yangilash' : 'Saqlash'}</Button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
