import { BookOpen, Plus, Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';
import { Subject } from '../types';

const SubjectsPage: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, tasks, flashcards } = useStudyData();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const filteredSubjects = useMemo(() => {
    let result = subjects;

    // Filter by active tab
    if (activeTab === 'active') {
      result = result.filter((s) => !s.isArchived);
    } else {
      result = result.filter((s) => s.isArchived);
    }

    // Filter by search query
    if (!searchQuery.trim()) return result;

    return result.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.description &&
          subject.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [subjects, searchQuery, activeTab]);

  // Calculate progress for a subject
  const getSubjectProgress = (subjectId: string): number => {
    const subjectTasks = tasks.filter((t) => t.subjectId === subjectId);
    const completedTasks = subjectTasks.filter((t) => t.completed || t.status === 'done').length;

    const subjectFlashcards = flashcards.filter((f) => f.subjectId === subjectId);
    const reviewedCards = subjectFlashcards.filter((f) => (f.repetitions || 0) > 0).length;

    const total = subjectTasks.length + subjectFlashcards.length;
    const completed = completedTasks + reviewedCards;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubjectSubmit = async (data: Partial<Subject>) => {
    if (editingSubject) {
      await updateSubject(editingSubject.id, data);
      setSuccessMessage(`"${data.name || editingSubject.name}" fani muvaffaqiyatli yangilandi! ✨`);
    } else {
      const newSub = await addSubject(data);
      setSuccessMessage(
        `"${data.name || newSub?.name || 'Yangi fan'}" fani muvaffaqiyatli yaratildi! 🎉`,
      );
    }
    setIsAdding(false);
    setEditingSubject(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEditClick = (subject: Subject) => {
    setEditingSubject(subject);
    setIsAdding(true);
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingSubject(null);
  };

  const handleToggleArchive = (id: string, isArchived: boolean) => {
    updateSubject(id, { isArchived });
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 3xl:max-w-8xl 3xl:p-12">
      <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">Asosiy yo&apos;l:</span> JLPT darslar va
          fleshkartalar Fleshkartalar sahifasida. Bu fanlar ro&apos;yxati faqat qo&apos;shimcha
          tartib uchun.
        </span>
        <a
          href="/flashcards"
          className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          Fleshkartalarga o&apos;tish
        </a>
      </div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('subjects.title')}</h2>
          <p className="mt-1 text-muted-foreground">{t('subjects.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingSubject(null);
            }}
            className="w-full shrink-0 sm:w-auto"
          >
            <Plus size={20} className="mr-2" /> {t('subjects.addSubject')}
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 duration-300 animate-in fade-in dark:text-emerald-400">
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex w-fit space-x-1 rounded-xl bg-secondary/50 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
        >
          Faol Fanlar
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'archived' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
        >
          Arxivlangan
        </button>
      </div>

      {/* Add/Edit Subject Form */}
      {isAdding && (
        <SubjectForm
          onClose={handleCloseForm}
          onSubmit={handleSubjectSubmit}
          initialData={editingSubject || undefined}
        />
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredSubjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            progress={getSubjectProgress(subject.id)}
            onDelete={deleteSubject}
            onEdit={handleEditClick}
            onToggleArchive={handleToggleArchive}
          />
        ))}

        {subjects.length > 0 && filteredSubjects.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {activeTab === 'archived' && !searchQuery.trim()
              ? "Arxivlangan fanlar yo'q."
              : 'Siz izlagan fan topilmadi.'}
          </div>
        )}

        {subjects.filter((s) => !s.isArchived).length === 0 &&
          activeTab === 'active' &&
          !isAdding && (
            <div className="glass-card col-span-full flex flex-col items-center justify-center rounded-3xl border-dashed p-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen size={40} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Hali fanlar yaratilmagan</h3>
              <p className="mb-8 max-w-sm text-muted-foreground">
                O'qish rejangizni tuzishni boshlash uchun birinchi faningizni qo'shing.
              </p>
              <Button onClick={() => setIsAdding(true)} className="px-8">
                <Plus size={20} className="mr-2" /> Birinchi Fanni Qo'shish
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default SubjectsPage;
