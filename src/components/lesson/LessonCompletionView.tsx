import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, ArrowRight, Home, Layers, AlertCircle, Calendar } from 'lucide-react';
import { Lesson, UserLessonProgress } from '../../types/lesson';
import { LessonService } from '../../services/LessonService';
import { SpacedRepetitionEngine } from '../../services/SpacedRepetitionEngine';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface LessonCompletionViewProps {
  lesson: Lesson;
  userId?: string;
  scoreData?: {
    score: number;
    total: number;
    percentage: number;
  };
  progress?: UserLessonProgress | null;
  newCardsCount?: number;
  mistakesCount?: number;
  onExit: () => void;
}

export const LessonCompletionView: React.FC<LessonCompletionViewProps> = ({
  lesson,
  userId,
  scoreData,
  progress,
  newCardsCount = 0,
  mistakesCount = 0,
  onExit,
}) => {
  const navigate = useNavigate();
  const nextLesson = LessonService.getNextLesson(lesson.id);
  const { haptics } = useTelegramWebApp();

  const reviewItem = useMemo(() => {
    return SpacedRepetitionEngine.getLessonReviewItem(userId || 'guest', lesson.id);
  }, [userId, lesson.id]);

  useEffect(() => {
    haptics.notification('success');
  }, []);

  const handleContinue = () => {
    if (nextLesson) {
      navigate(`/lesson/${nextLesson.id}`);
    } else {
      navigate('/jlpt');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-1 py-4 text-center duration-300 animate-in fade-in sm:px-4 sm:py-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
        <Trophy size={30} />
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-primary">
          {lesson.language === 'ja'
            ? `🇯🇵 JLPT ${lesson.level || 'N3'} O'quv Darsi`
            : `🇬🇧 English ${lesson.level || 'B2'} Lesson`}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dars yakunlandi</h1>
        <p className="text-sm text-muted-foreground">
          «{lesson.title}» darsini muvaffaqiyatli yakunladingiz.
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-4">
        <div className="space-y-1 px-2">
          <div className="text-[11px] font-medium text-muted-foreground">Umumiy natija</div>
          <div className="text-lg font-bold tabular-nums text-primary">
            {scoreData ? `${scoreData.score}/${scoreData.total}` : '—'}
          </div>
        </div>

        <div className="space-y-1 px-2">
          <div className="text-[11px] font-medium text-muted-foreground">Bosqichlar</div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {lesson.steps.length}/{lesson.steps.length}
          </div>
        </div>

        <div className="space-y-1 px-2">
          <div className="text-[11px] font-medium text-muted-foreground">XP</div>
          <div className="flex items-center justify-center gap-1 text-lg font-bold text-amber-500">
            <Zap size={14} />
            <span>+50 XP</span>
          </div>
        </div>
      </div>

      {progress?.stepResults && (
        <section className="text-left" aria-label="Bosqichlar bo‘yicha natija">
          <h2 className="mb-2 text-base font-semibold">Bosqichlar natijasi</h2>
          <dl className="divide-y divide-border">
            {lesson.steps.map((step) => {
              const result = progress.stepResults?.[step.id];
              return (
                <div key={step.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt>{step.title}</dt>
                  <dd className="shrink-0 font-semibold tabular-nums">
                    {step.type === 'learn'
                      ? 'O‘rganildi'
                      : result
                        ? `${result.score}/${result.total} · ${result.percentage}%`
                        : '—'}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Umumiy foiz barcha mashq va testlardagi to‘g‘ri javoblar yig‘indisidan hisoblanadi.
          </p>
        </section>
      )}

      {/* Automated SRS & Learning Signals Notice */}
      <div className="space-y-2 text-left">
        {newCardsCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-400">
            <div className="shrink-0 rounded-xl bg-emerald-500/20 p-2 text-emerald-500">
              <Layers size={18} />
            </div>
            <div className="text-xs">
              <div className="font-black">
                {newCardsCount} ta yangi so'z Fleshkartalarga qo'shildi
              </div>
              <div className="text-muted-foreground">
                SM-2 interval algoritmi orqali takrorlash rejalashtirildi.
              </div>
            </div>
          </div>
        )}

        {mistakesCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-600 dark:text-amber-400">
            <div className="shrink-0 rounded-xl bg-amber-500/20 p-2 text-amber-500">
              <AlertCircle size={18} />
            </div>
            <div className="text-xs">
              <div className="font-black">{mistakesCount} ta xato qayd etildi</div>
              <div className="text-muted-foreground">
                Keyingi amaliy mashg'ulotlarda ko'proq e'tibor beriladi.
              </div>
            </div>
          </div>
        )}

        {reviewItem && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-primary">
            <div className="shrink-0 rounded-xl bg-primary/20 p-2 text-primary">
              <Calendar size={18} />
            </div>
            <div className="text-xs">
              <div className="font-black">
                Darsni qayta ko'rish: {reviewItem.dueDate} ({reviewItem.interval} kundan keyin)
              </div>
              <div className="text-muted-foreground">
                SM-2 algoritmi {reviewItem.quizScorePercentage}% test ballingizga ko'ra optimal
                takrorlash vaqtini belgiladi.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {nextLesson ? (
          <button
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90"
          >
            <span>Keyingi Darsga O'tish</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
            ✨ Siz joriy modul bo'yicha barcha darslarni yakunladingiz!
          </div>
        )}

        <button
          onClick={onExit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-xs font-bold text-foreground transition-all hover:bg-secondary"
        >
          <Home size={14} />
          <span>Bosh Sahifaga Qaytish</span>
        </button>
      </div>
    </div>
  );
};
