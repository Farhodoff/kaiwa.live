import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Brain,
  AlertTriangle,
  Play,
  RotateCcw,
  ListTodo,
  ChevronRight,
  GraduationCap,
  Layers,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Flashcard } from '../../types';
import {
  SpacedRepetitionEngine,
  LessonReviewItem,
  FlashcardReviewForecastItem,
  SrsQueueSummary,
} from '../../services/SpacedRepetitionEngine';
import { Rating, Grade } from '../../utils/srs';
import { toast } from '../../hooks/use-toast';
import { Button } from '../ui/Button';

interface SpacedRepetitionScheduleProps {
  flashcards: Flashcard[];
  userId?: string;
  onStartFlashcardReview?: (subjectId?: string) => void;
  firstDueSubjectId?: string | null;
}

export const SpacedRepetitionSchedule: React.FC<SpacedRepetitionScheduleProps> = ({
  flashcards,
  userId = 'guest',
  onStartFlashcardReview,
  firstDueSubjectId,
}) => {
  const navigate = useNavigate();
  const [lessonReviews, setLessonReviews] = useState<LessonReviewItem[]>([]);
  const [lessonFilter, setLessonFilter] = useState<'all' | 'due' | 'upcoming'>('all');
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [quickRatingLessonId, setQuickRatingLessonId] = useState<string | null>(null);

  // Load lesson reviews from local engine
  const reloadLessonReviews = () => {
    const list = SpacedRepetitionEngine.getLessonReviews(userId);
    setLessonReviews(list);
  };

  useEffect(() => {
    reloadLessonReviews();
  }, [userId]);

  // Flashcards queue metrics
  const queueSummary: SrsQueueSummary = useMemo(() => {
    return SpacedRepetitionEngine.getFlashcardQueueSummary(flashcards);
  }, [flashcards]);

  // 7-day forecast
  const forecast: FlashcardReviewForecastItem[] = useMemo(() => {
    return SpacedRepetitionEngine.getFlashcardReviewForecast(flashcards, 7);
  }, [flashcards]);

  // Filtered lesson reviews
  const filteredLessonReviews = useMemo(() => {
    if (lessonFilter === 'due') {
      return lessonReviews.filter((r) => r.status === 'overdue' || r.status === 'due_today');
    }
    if (lessonFilter === 'upcoming') {
      return lessonReviews.filter((r) => r.status === 'upcoming');
    }
    return lessonReviews;
  }, [lessonReviews, lessonFilter]);

  // Due lesson count
  const dueLessonCount = useMemo(() => {
    return lessonReviews.filter((r) => r.status === 'overdue' || r.status === 'due_today').length;
  }, [lessonReviews]);

  // Handle task sync to Study Planner
  const handleSyncToTasks = async () => {
    setIsSyncingTasks(true);
    try {
      const created = await SpacedRepetitionEngine.generateReviewTasks(userId);
      if (created.length > 0) {
        toast({
          title: "Vazifalar qo'shildi! 📅",
          description: `${created.length} ta dars takrorlash vazifasi rejalashtiruvchiga muvaffaqiyatli qo'shildi.`,
        });
      } else {
        toast({
          title: 'Barchasi dolzarb! ✨',
          description: 'Bugungi barcha takrorlash vazifalari allaqachon jadvalingizda mavjud.',
        });
      }
    } catch (err) {
      console.error('Task sync failed:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik yuz berdi',
        description: 'Vazifalarni saqlashda xatolik yuz berdi.',
      });
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Quick SM-2 rating for a lesson
  const handleRateLesson = (lessonId: string, grade: Grade) => {
    SpacedRepetitionEngine.recordLessonReview(userId, lessonId, grade);
    reloadLessonReviews();
    setQuickRatingLessonId(null);

    const gradeLabels: Record<number, string> = {
      [Rating.AGAIN]: 'Qaytadan (1 kun)',
      [Rating.HARD]: 'Qiyin (eslab qolindi)',
      [Rating.GOOD]: 'Yaxshi (interval uzaytirildi)',
      [Rating.EASY]: "Oson (a'lo daraja)",
    };

    toast({
      title: 'Takrorlash qayd etildi! 🎯',
      description: `Dars uchun yangi interval: ${gradeLabels[grade] || 'Saqlandi'}.`,
    });
  };

  return (
    <div className="space-y-8 duration-300 animate-in fade-in">
      {/* ======================================================== */}
      {/* 1. HERO & FLASHCARD SRS STATUS */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-5 shadow-xs sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles size={13} />
              <span>MF2M / SM-2 Algoritmi</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Spaced Repetition Tizimi
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Ebbinghaus unutilish egri chizig'i asosida so'zlar va darslarni optimal vaqtda
              takrorlab, uzoq muddatli xotiraga mustahkamlang.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {queueSummary.totalDueCount > 0 && onStartFlashcardReview && (
              <Button
                variant="default"
                size="lg"
                onClick={() => onStartFlashcardReview(firstDueSubjectId || undefined)}
                className="gap-2 rounded-2xl text-sm font-black shadow-lg shadow-primary/25"
              >
                <Play size={16} fill="currentColor" />
                <span>Kartochkalarni Takrorlash ({queueSummary.totalDueCount})</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={handleSyncToTasks}
              disabled={isSyncingTasks}
              className="gap-2 rounded-2xl border-border/80 bg-card/60 text-sm font-black hover:bg-muted/60"
            >
              <ListTodo size={16} />
              <span>{isSyncingTasks ? "Bog'lanmoqda..." : 'Rejaga Vazifa Qilish'}</span>
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Overdue */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 transition-all hover:bg-rose-500/10">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-[11px] font-black uppercase tracking-wider">Kechikkan</span>
              <AlertTriangle size={16} />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400 sm:text-3xl">
              {queueSummary.overdueCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Tezkor e'tibor talab</p>
          </div>

          {/* Due Today */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:bg-amber-500/10">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-[11px] font-black uppercase tracking-wider">Bugun Rejada</span>
              <Clock size={16} />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl">
              {queueSummary.dueTodayCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Bugungi takrorlash</p>
          </div>

          {/* New Cards */}
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 transition-all hover:bg-sky-500/10">
            <div className="flex items-center justify-between text-sky-500">
              <span className="text-[11px] font-black uppercase tracking-wider">Yangi So'zlar</span>
              <Layers size={16} />
            </div>
            <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400 sm:text-3xl">
              {queueSummary.newCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Hali boshlanmagan</p>
          </div>

          {/* Retention Rate */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all hover:bg-emerald-500/10">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-[11px] font-black uppercase tracking-wider">Esda Qolish</span>
              <Brain size={16} />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {queueSummary.averageRetentionRate}%
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Ebbinghaus barqarorligi</p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 7-DAY FLASHCARD REVIEW FORECAST */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h3 className="text-lg font-black tracking-tight text-foreground">
              7 Kunlik Takrorlash Prognozi
            </h3>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Kelgusi kunlarda kutilayotgan kartochkalar
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
          {forecast.map((item) => (
            <div
              key={item.date}
              className={`flex flex-col items-center justify-between rounded-2xl border p-3.5 text-center transition-all ${
                item.isToday
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/80 bg-card hover:border-primary/40'
              }`}
            >
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {item.dayLabel}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                {item.date.slice(5)}
              </div>
              <div
                className={`my-3 text-xl font-black ${
                  item.isToday
                    ? 'text-primary'
                    : item.dueCount > 0
                      ? 'text-foreground'
                      : 'text-muted-foreground/40'
                }`}
              >
                {item.dueCount}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  item.isToday
                    ? 'bg-primary text-primary-foreground'
                    : item.dueCount > 0
                      ? 'bg-secondary text-foreground'
                      : 'bg-muted/40 text-muted-foreground'
                }`}
              >
                {item.isToday ? 'Bugun' : `${item.dueCount} ta`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. AUTOMATED LESSON REVIEWS (DARSLAR JADVALI) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" />
              <h3 className="text-lg font-black tracking-tight text-foreground">
                Darslarni Takrorlash Jadvali (Avtomatik SM-2)
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tugatgan darslaringiz o'zlashtirish foiziga ko'ra avtomatik takrorlash vaqti bilan
              jadvalga kiritiladi.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card p-1">
            <button
              onClick={() => setLessonFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                lessonFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Barchasi ({lessonReviews.length})
            </button>
            <button
              onClick={() => setLessonFilter('due')}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                lessonFilter === 'due'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Kechikkan / Bugun ({dueLessonCount})
            </button>
            <button
              onClick={() => setLessonFilter('upcoming')}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                lessonFilter === 'upcoming'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rejadagi darslar
            </button>
          </div>
        </div>

        {/* Empty state */}
        {filteredLessonReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center sm:p-12">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap size={28} />
            </div>
            <h4 className="text-base font-black text-foreground">
              {lessonFilter === 'due'
                ? "Bugun uchun takrorlanadigan darslar yo'q! 🎉"
                : 'Hozircha dars takrorlashlari mavjud emas'}
            </h4>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Darslarni o'qib, yakuniy testlarni topshirganingizdan so'ng, tizim unutilish egri
              chizig'iga ko'ra avtomatik tarzda takrorlash jadvalini shakllantiradi.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jlpt')}
                className="gap-2 rounded-xl"
              >
                <span>Darslarga O'tish</span>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLessonReviews.map((review) => {
              const isOverdue = review.status === 'overdue';
              const isToday = review.status === 'due_today';
              const isQuickRating = quickRatingLessonId === review.lessonId;

              return (
                <div
                  key={review.lessonId}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-4 shadow-xs transition-all sm:p-5 ${
                    isOverdue
                      ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                      : isToday
                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                        : 'border-border/80 bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top status & badge bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-secondary-foreground">
                          {review.language === 'ja' ? '🇯🇵 ' : '🇬🇧 '}
                          {review.level}
                        </span>
                        <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {review.repetitions}-takrorlash
                        </span>
                      </div>

                      {/* Status indicator */}
                      {isOverdue && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">
                          <Flame size={12} />
                          Kechikkan
                        </span>
                      )}
                      {isToday && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                          <Clock size={12} />
                          Bugun
                        </span>
                      )}
                      {!isOverdue && !isToday && (
                        <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Rejada
                        </span>
                      )}
                    </div>

                    {/* Lesson Title */}
                    <div>
                      <h4 className="line-clamp-1 text-sm font-black text-foreground transition-colors group-hover:text-primary sm:text-base">
                        {review.lessonTitle}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Calendar size={12} />
                        <span>Reja: {review.dueDate}</span>
                        <span>•</span>
                        <span>Interval: {review.interval} kun</span>
                      </div>
                    </div>

                    {/* SRS & Mastery metrics */}
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/40 p-2.5 text-xs">
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          Test natijasi
                        </div>
                        <div className="font-black text-foreground">
                          {review.quizScorePercentage}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          Xotira ehtimoli
                        </div>
                        <div className="font-black text-emerald-600 dark:text-emerald-400">
                          {review.retentionProbability}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-4 border-t border-border/40 pt-3">
                    {isQuickRating ? (
                      <div className="space-y-2 animate-in fade-in">
                        <div className="text-center text-[11px] font-bold text-muted-foreground">
                          Ushbu darsni qanday esladingiz?
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => handleRateLesson(review.lessonId, Rating.AGAIN)}
                            className="rounded-xl bg-rose-500/10 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-500/20"
                          >
                            Qayta (1k)
                          </button>
                          <button
                            onClick={() => handleRateLesson(review.lessonId, Rating.HARD)}
                            className="rounded-xl bg-amber-500/10 py-2 text-[10px] font-black text-amber-500 hover:bg-amber-500/20"
                          >
                            Qiyin
                          </button>
                          <button
                            onClick={() => handleRateLesson(review.lessonId, Rating.GOOD)}
                            className="rounded-xl bg-primary/10 py-2 text-[10px] font-black text-primary hover:bg-primary/20"
                          >
                            Yaxshi
                          </button>
                          <button
                            onClick={() => handleRateLesson(review.lessonId, Rating.EASY)}
                            className="rounded-xl bg-emerald-500/10 py-2 text-[10px] font-black text-emerald-500 hover:bg-emerald-500/20"
                          >
                            Oson
                          </button>
                        </div>
                        <button
                          onClick={() => setQuickRatingLessonId(null)}
                          className="w-full pt-1 text-center text-[10px] text-muted-foreground hover:underline"
                        >
                          Bekor qilish
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isOverdue || isToday ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => navigate(`/lesson/${review.lessonId}`)}
                          className="flex-1 gap-1.5 rounded-xl text-xs font-black"
                        >
                          <Play size={13} fill="currentColor" />
                          <span>Darsni Takrorlash</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickRatingLessonId(review.lessonId)}
                          className="rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          title="Tezkor baholash (SM-2 intervalini yangilash)"
                        >
                          <RotateCcw size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
