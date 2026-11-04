import { FileText, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { useStudyData } from '../context/StudyPlannerContext';
import { useFontPreference } from '../hooks/useFontPreference';
import { StudyNote } from '../types';
import FontSelector from './FontSelector';
import { Button } from './ui/Button';
import { toast } from '../hooks/use-toast';

interface SubjectNotesProps {
  subjectId: string;
}

const SubjectNotes: React.FC<SubjectNotesProps> = ({ subjectId }) => {
  const { studyNotes, addStudyNote, updateStudyNote, deleteStudyNote } = useStudyData();
  const { font } = useFontPreference();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mode: 'write' or 'preview'
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Ensure studyNotes is defined before filtering
  const subjectNotes = (studyNotes || []).filter((n) => n.subjectId === subjectId);

  const startEditing = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsCreating(false);
    setMode('write'); // Reset to write mode
  };

  const startCreating = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setIsCreating(true);
    setMode('write'); // Start in write mode
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setIsCreating(false);
    setMode('write');
  };

  const saveNote = () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Sarlavha yozing!' });
      return;
    }

    if (isCreating) {
      addStudyNote({
        subjectId,
        title,
        content,
      });
    } else if (editingNoteId) {
      updateStudyNote(editingNoteId, {
        title,
        content,
      });
    }
    cancelEdit();
  };

  // Editor View - Tab-Based UI
  if (isCreating || editingNoteId) {
    return (
      <div className="dark:bg-dark-card flex h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700">
        {/* Header with Tabs */}
        <div className="rounded-t-2xl border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <input
              className="mr-4 flex-1 bg-transparent text-lg font-bold text-gray-900 placeholder-gray-400 outline-none dark:text-white"
              placeholder="Mavzu sarlavhasi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={cancelEdit}
                className="text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </Button>
              <FontSelector />
              <Button
                onClick={saveNote}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Save size={20} className="mr-2" /> Saqlash
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex w-fit rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            <button
              onClick={() => setMode('write')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                mode === 'write'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ✏️ Yozish
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                mode === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              👁️ Ko'rish
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 overflow-hidden p-6 ${
            font === 'sans' ? 'font-sans' : font === 'serif' ? 'font-serif' : 'font-mono'
          }`}
        >
          {mode === 'write' ? (
            /* EDIT MODE */
            <textarea
              className="h-full w-full resize-none rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-200 dark:focus:ring-blue-400"
              placeholder="Markdown formatida yozing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck="false"
            />
          ) : (
            /* PREVIEW MODE */
            <div className="h-full w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <Markdown>{content || "*Natija shu yerda ko'rinadi*"}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fanga oid konspektlar</h3>
        <Button
          onClick={startCreating}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" /> Yangi Konspekt
        </Button>
      </div>

      {subjectNotes.length === 0 ? (
        <div className="dark:bg-dark-card rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center dark:border-gray-700">
          <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Hozircha konspektlar yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {subjectNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => startEditing(note)}
              className="dark:bg-dark-card group relative cursor-pointer rounded-xl border border-gray-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg dark:border-gray-700 dark:hover:border-blue-800"
            >
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStudyNote(note.id);
                  }}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="mb-2 font-bold text-gray-900 dark:text-white">{note.title}</h4>
              <p className="line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                {note.content}
              </p>
              <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectNotes;
