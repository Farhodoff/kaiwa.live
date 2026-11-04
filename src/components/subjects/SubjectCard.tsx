import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Subject } from '../../types';
import { getIconComponent } from './constants';

interface SubjectCardProps {
  subject: Subject;
  progress: number;
  onDelete: (id: string) => void;
  onEdit: (subject: Subject) => void;
  onToggleArchive: (id: string, isArchived: boolean) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  progress,
  onDelete,
  onEdit,
  onToggleArchive,
}) => {
  const IconComponent = getIconComponent(subject.icon);

  return (
    <div
      className="group relative overflow-hidden rounded-xl p-4 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${subject.color}dd 0%, ${subject.color}aa 100%)`,
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm dark:bg-black/20"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="absolute right-0 top-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit(subject);
            }}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Tahrirlash"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (window.confirm("Fanni o'chirasizmi?")) onDelete(subject.id);
            }}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title="O'chirish"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleArchive(subject.id, !subject.isArchived);
            }}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title={subject.isArchived ? 'Arxivdan chiqarish' : 'Arxivlash'}
          >
            {subject.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </button>
        </div>

        <Link to={`/subjects/${subject.id}`} className="block">
          {/* Icon Circle - Smaller */}
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-md">
            <IconComponent size={24} className="text-white" />
          </div>

          {/* Text Content */}
          <h3 className="mb-2 truncate text-base font-semibold text-white">{subject.name}</h3>

          {subject.description && (
            <p className="mb-3 line-clamp-2 text-xs leading-tight text-white/80">
              {subject.description}
            </p>
          )}

          {/* Progress Bar - Thinner */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/90">
              <span>O'zlashtirish</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </Link>
      </div>

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: subject.color }}
      ></div>
    </div>
  );
};

export default SubjectCard;
