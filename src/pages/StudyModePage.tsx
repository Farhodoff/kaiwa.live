import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  Volume2,
  Trash2,
  Edit3,
  X,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useStudyData } from '../context/StudyPlannerContext';
import { isUserAdmin } from '../utils/admin';
import { Flashcard } from '../types';
import {
  Rating,
  Grade,
  getPreviewIntervalLabels,
  calculateReview,
  buildDailyStudyQueue,
} from '../utils/srs';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { speakText } from '../utils/audioTts';
import { toast } from '../hooks/use-toast';
import { ErrorNotificationService } from '../services/ErrorNotificationService';
import { PersonalLearningPlanService } from '../services/PersonalLearningPlanService';
import { isFlashcardAnswerCorrect } from '../utils/flashcardMatching';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useFlashcardSwipe } from '../hooks/useFlashcardSwipe';
import { GlobalFlashcardOverrideService } from '../services/GlobalFlashcardOverrideService';
import { cleanCardFront } from '../components/decks/FlashcardStudySession';
import { isFlashcardForLanguage } from '../utils/subjectResolver';

const StudyModePage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, flashcards, subjects, reviewFlashcard, updateFlashcard, deleteFlashcard, loading } =
    useStudyData();
  const isAdmin = isUserAdmin(user);
  const { haptics } = useTelegramWebApp();

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedLanguage = searchParams.get('lang');
  const langFilter: 'ja' | 'en' | null =
    requestedLanguage === 'all'
      ? null
      : requestedLanguage === 'en'
        ? 'en'
        : requestedLanguage === 'ja' || !subjectId
          ? 'ja'
          : null;

  const [accent, setAccent] = useState<'en-GB' | 'en-US' | 'ja-JP'>(() => {
    return langFilter === 'ja' ? 'ja-JP' : 'en-US';
  });

  useEffect(() => {
    if (langFilter === 'ja') {
      setAccent('ja-JP');
    } else if (langFilter === 'en' && accent === 'ja-JP') {
      setAccent('en-US');
    }
  }, [langFilter, accent]);

  const [isQueueInitialized, setIsQueueInitialized] = useState(false);
  const [autoAudio, setAutoAudio] = useState<boolean>(() => {
    return safeLocalStorage.getItem('study_planner_flashcard_auto_audio') === 'true';
  });

  const toggleAutoAudio = () => {
    setAutoAudio((prev) => {
      const next = !prev;
      safeLocalStorage.setItem('study_planner_flashcard_auto_audio', String(next));
      return next;
    });
  };

  const [planTaskCompleted, setPlanTaskCompleted] = useState(false);
  const planTask = (
    location.state as { personalPlanTask?: { planId: string; taskId: string } } | null
  )?.personalPlanTask;

  // Study Mode: 'srs' | 'type'
  const [studyMode, setStudyMode] = useState<'srs' | 'type'>('srs');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typeResult, setTypeResult] = useState<'correct' | 'incorrect' | null>(null);

  // Admin inline editing state
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editGlobal, setEditGlobal] = useState(true);

  const [allAvailableCards, setAllAvailableCards] = useState<Flashcard[]>([]);
  const [batchLimit, setBatchLimit] = useState<'10' | '25' | '50' | 'all'>('25');

  const currentSubject = subjects.find((s) => s.id === subjectId);

  const isCardJapanese = useCallback(
    (card: Flashcard): boolean => isFlashcardForLanguage(card, subjects, 'ja'),
    [subjects],
  );

  const isCardEnglish = useCallback(
    (card: Flashcard): boolean => isFlashcardForLanguage(card, subjects, 'en'),
    [subjects],
  );

  const filterKey = `${subjectId || 'all'}-${langFilter || 'all'}`;
  const lastFilterKeyRef = useRef<string>('');

  useEffect(() => {
    if (flashcards.length > 0) {
      if (filterKey === lastFilterKeyRef.current && isQueueInitialized) {
        return;
      }
      let pool = flashcards;

      // Global study mode defaults to Japanese. Subject-specific routes stay scoped to their deck.
      if (langFilter === 'ja') {
        pool = pool.filter(isCardJapanese);
      } else if (langFilter === 'en') {
        pool = pool.filter(isCardEnglish);
      }

      const scopedCards = subjectId
        ? pool.filter((card: Flashcard) => card.subjectId === subjectId)
        : pool;
      const targetSet = buildDailyStudyQueue(scopedCards, { maxNewCards: 10 });
      setAllAvailableCards(targetSet);
      const limitNum = batchLimit === 'all' ? targetSet.length : parseInt(batchLimit, 10);
      const initialQueue = targetSet.slice(0, limitNum);
      setQueue(initialQueue);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setTypeResult(null);
      setTypedAnswer('');
      setIsQueueInitialized(true);
      lastFilterKeyRef.current = filterKey;
    } else if (flashcards.length === 0 && !loading && !isQueueInitialized) {
      setIsQueueInitialized(true);
      lastFilterKeyRef.current = filterKey;
    }
  }, [
    subjectId,
    flashcards,
    isQueueInitialized,
    loading,
    batchLimit,
    langFilter,
    isCardJapanese,
    isCardEnglish,
    filterKey,
  ]);

  const handleBatchLimitChange = (newLimit: '10' | '25' | '50' | 'all') => {
    setBatchLimit(newLimit);
    let fallbackCards = subjectId
      ? flashcards.filter((c) => c.subjectId === subjectId)
      : flashcards;
    if (langFilter === 'ja') {
      fallbackCards = fallbackCards.filter(isCardJapanese);
    } else if (langFilter === 'en') {
      fallbackCards = fallbackCards.filter(isCardEnglish);
    }
    const eligibleFallback = buildDailyStudyQueue(fallbackCards, { maxNewCards: 10 });
    const pool = allAvailableCards.length > 0 ? allAvailableCards : eligibleFallback;
    const limitNum = newLimit === 'all' ? pool.length : parseInt(newLimit, 10);
    const newQueue = pool.slice(0, limitNum);
    setQueue(newQueue);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setTypeResult(null);
    setTypedAnswer('');
    const actualCount = newQueue.length;
    toast({
      title: '🎯 Sessiya hajmi yangilandi',
      description: `Mashg'ulot uchun ${newLimit === 'all' ? `barcha (${actualCount} ta)` : `${actualCount} ta`} karta belgilandi.`,
    });
  };

  const handleLanguageFilterChange = (newLang: 'ja' | 'en' | null) => {
    const params = new URLSearchParams(location.search);
    if (newLang) {
      params.set('lang', newLang);
    } else {
      params.set('lang', 'all');
    }
    const queryString = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: queryString ? `?${queryString}` : '',
      },
      { replace: true },
    );
  };

  const currentCard = queue[currentCardIndex];

  const completeLinkedPlanTask = async () => {
    if (planTaskCompleted) return;
    const userId = user?.id || 'guest';
    if (planTask?.planId && planTask?.taskId) {
      const updated = await PersonalLearningPlanService.completePlanTask(
        userId,
        planTask.planId,
        planTask.taskId,
      );
      if (updated) setPlanTaskCompleted(true);
      return;
    }
    // Auto-detect active plan's today SRS task if not passed explicitly in location.state
    try {
      const activeGoal = PersonalLearningPlanService.getActiveGoal(userId);
      if (activeGoal) {
        const plan = PersonalLearningPlanService.getLatestWeeklyPlan(userId, activeGoal.id);
        if (plan) {
          const daysOfWeek = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const todayName = daysOfWeek[new Date().getDay()];
          const todayDay = plan.days.find((d) => d.day.toLowerCase() === todayName);
          const srsTask = todayDay?.tasks.find(
            (t) => (t.type === 'srs' || t.sourceType === 'srs') && !t.completed,
          );
          if (srsTask) {
            await PersonalLearningPlanService.completePlanTask(userId, plan.id, srsTask.id);
            setPlanTaskCompleted(true);
          }
        }
      }
    } catch (e) {
      console.warn('Could not auto-complete today SRS task in plan:', e);
    }
  };

  const isJapanese = useMemo(() => {
    if (langFilter === 'ja') return true;
    if (langFilter === 'en') return false;
    if (!currentCard && !currentSubject) return false;
    const cardSubject =
      subjects.find((s) => s.id === (currentCard?.subjectId || subjectId)) || currentSubject;
    const frontText = currentCard?.front || '';
    const backText = currentCard?.back || '';
    const phoneticText = currentCard?.phonetic || '';
    const subjectTitle = cardSubject?.name || '';
    const subjectType = (cardSubject as any)?.type || '';
    const subjectCategory = (cardSubject as any)?.category || '';

    const hasJapaneseChars =
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(
        frontText + backText + phoneticText + subjectTitle,
      );
    const isJlptMeta =
      subjectType.toLowerCase().includes('jlpt') ||
      subjectCategory.toLowerCase().includes('jlpt') ||
      subjectTitle.toLowerCase().includes('jlpt') ||
      subjectTitle.toLowerCase().includes('kanji') ||
      subjectTitle.toLowerCase().includes('yapon') ||
      subjectTitle.toLowerCase().includes('japanese');

    return Boolean(hasJapaneseChars || isJlptMeta);
  }, [currentCard, currentSubject, subjectId, subjects, langFilter]);

  const handleSpeak = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentCard?.front) {
      speakText(currentCard.front, isJapanese ? 'ja-JP' : accent);
    }
  };

  useEffect(() => {
    if (autoAudio && currentCard && !isFinished && !isEditingCard) {
      const timer = setTimeout(() => {
        if (currentCard?.front) {
          speakText(currentCard.front, isJapanese ? 'ja-JP' : accent);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentCardIndex, autoAudio, isFinished, isEditingCard, isJapanese, accent, currentCard]);

  const handleDeleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    if (window.confirm("Admin: Ushbu kartochkani bazadan BUTKUL O'CHIRMOQCHIMISIZ?")) {
      const cardToDeleteId = currentCard.id;
      if (currentCardIndex < queue.length - 1) {
        setQueue((prev) => prev.filter((c) => c.id !== cardToDeleteId));
      } else {
        setQueue((prev) => prev.filter((c) => c.id !== cardToDeleteId));
        setIsFinished(true);
      }
      setIsFlipped(false);
      await deleteFlashcard(cardToDeleteId, true);
      toast({ title: "🗑️ Kartochka bazadan o'chirildi" });
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    setEditFront(currentCard.front || '');
    setEditBack(currentCard.back || '');
    setEditPhonetic((currentCard as any).phonetic || '');
    setEditExample((currentCard as any).example || '');
    setEditGlobal(isAdmin);
    setIsEditingCard(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCard || !editFront.trim() || !editBack.trim()) return;
    try {
      const cleanF = editFront.trim();
      const cleanB = editBack.trim();
      const cleanP = editPhonetic.trim();
      const cleanE = editExample.trim();

      if (currentCard.id) {
        await updateFlashcard(currentCard.id, {
          front: cleanF,
          back: cleanB,
        });
      }

      if (isAdmin && editGlobal) {
        const saved = await GlobalFlashcardOverrideService.saveGlobalOverride(
          {
            word: currentCard.front,
            front: cleanF,
            phonetic: cleanP,
            back: cleanB,
            example: cleanE,
            deck_id:
              (currentCard as any).deckId || (currentCard as any).subjectId || subjectId || null,
          },
          user?.email || 'admin',
        );
        if (saved) {
          toast({
            title: '🌐 Global Baza va JSON Yangilandi',
            description:
              'Fleshkarta barcha foydalanuvchilar, baza va fayllarda muvaffaqiyatli saqlandi!',
          });
        } else {
          toast({
            variant: 'destructive',
            title: '⚠️ Ogohlantirish',
            description:
              "O'zgarish mahalliy keshga saqlandi, ammo serverga ulanishda xatolik bo'ldi.",
          });
        }
      } else {
        toast({ title: "✅ Kartochka to'g'rilandi va saqlandi" });
      }

      // Update local queue state
      setQueue((prev) =>
        prev.map((c, idx) =>
          idx === currentCardIndex || c.id === currentCard.id || c.front === currentCard.front
            ? { ...c, front: cleanF, back: cleanB, phonetic: cleanP, example: cleanE }
            : c,
        ),
      );

      setIsEditingCard(false);
    } catch (err) {
      console.error('Failed to edit flashcard:', err);
      ErrorNotificationService.notifyError({
        title: 'Kartochkani tahrirlashda xatolik',
        message: "O'zgarishlarni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
        error: err,
        retryAction: () => handleSaveEdit(),
      });
    }
  };

  const handleRate = useCallback(
    async (grade: Grade) => {
      if (!currentCard || isProcessing) return;

      // Trigger haptic feedback based on SRS rating
      if (grade === Rating.AGAIN) {
        haptics.notification('warning');
      } else if (grade === Rating.HARD) {
        haptics.impact('medium');
      } else if (grade === Rating.GOOD) {
        haptics.impact('light');
      } else if (grade === Rating.EASY) {
        haptics.notification('success');
      }

      setIsProcessing(true);

      try {
        await reviewFlashcard(currentCard.id, grade, currentCard);
        const xpGained =
          grade === Rating.EASY ? 15 : grade === Rating.GOOD ? 10 : grade === Rating.HARD ? 5 : 2;
        setTotalXpEarned((prev) => prev + xpGained);

        // True Spaced Repetition (SuperMemo): If user struggled (AGAIN / HARD), re-queue at the end
        const shouldRequeue = grade === Rating.AGAIN || grade === Rating.HARD;
        if (shouldRequeue) {
          const reviewResult = calculateReview(
            grade,
            currentCard.interval || 0,
            currentCard.repetitions || 0,
            currentCard.easeFactor || 2.5,
          );
          const updatedCard = {
            ...currentCard,
            interval: reviewResult.interval,
            repetitions: reviewResult.repetitions,
            easeFactor: reviewResult.easeFactor,
            nextReviewDate: reviewResult.nextReviewDate,
          };
          setQueue((prev) => [...prev, updatedCard]);
          toast({
            title:
              grade === Rating.AGAIN ? '🔄 Qayta takrorlash (10 daq)' : '⚡ Qiyin karta (30 daq)',
            description:
              grade === Rating.AGAIN
                ? "Karta sessiya oxirida yana bir bor takrorlash uchun qo'shildi."
                : 'Yaxshiroq eslab qolish uchun sessiya oxirida yana bir bor chiqadi.',
          });
        }

        if (currentCardIndex < queue.length - 1 || shouldRequeue) {
          setIsFlipped(false);
          setCurrentCardIndex((prev) => prev + 1);
          setTypeResult(null);
          setTypedAnswer('');
        } else {
          haptics.notification('success');
          await completeLinkedPlanTask();
          setIsFinished(true);
        }
      } catch (err) {
        console.error('Flashcard review error:', err);
        ErrorNotificationService.notifyError({
          title: 'SRS takrorlashni saqlashda xatolik',
          message: "Kartochka holatini saqlashda uzilish yuz berdi. Qayta urinib ko'ring.",
          error: err,
          retryAction: () => handleRate(grade),
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentCard,
      isProcessing,
      reviewFlashcard,
      currentCardIndex,
      queue.length,
      completeLinkedPlanTask,
      haptics,
    ],
  );

  const handleToggleFlip = useCallback(() => {
    haptics.selection();
    setIsFlipped((prev) => !prev);
  }, [haptics]);

  const {
    isDragging,
    swipeDirection,
    swipeProgress,
    cardStyle,
    handlers: swipeHandlers,
  } = useFlashcardSwipe({
    isFlipped,
    onFlip: handleToggleFlip,
    onSwipeLeft: () => handleRate(Rating.AGAIN),
    onSwipeRight: () => handleRate(Rating.GOOD),
    disabled: isEditingCard || isFinished || isProcessing,
    onHapticThreshold: () => haptics.selection(),
  });

  // Keyboard Shortcuts (Space to flip, 1-4 to rate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingCard || isFinished || isProcessing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(Rating.AGAIN);
        if (e.key === '2') handleRate(Rating.HARD);
        if (e.key === '3') handleRate(Rating.GOOD);
        if (e.key === '4') handleRate(Rating.EASY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingCard, isFinished, isProcessing, isFlipped, handleRate, handleToggleFlip]);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  if (!loading && flashcards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
          <Copy size={48} className="text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-black text-foreground">Fleshkartalar topilmadi</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          O'rganishni boshlash uchun avval lug'at to'plamlaridan karta qo'shing yoki yangi
          fleshkarta yarating.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/vocabulary')}
            variant="outline"
            className="rounded-xl px-6 py-2.5 font-bold"
          >
            Lug'atga o'tish
          </Button>
          <Button
            onClick={() => navigate('/flashcards')}
            variant="outline"
            className="rounded-xl px-6 py-2.5 font-bold"
          >
            To'plamlarni ko'rish
          </Button>
          <Button onClick={() => navigate(-1)} className="rounded-xl px-6 py-2.5 font-bold">
            Rejaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  if (isFinished || (queue.length === 0 && !loading && isQueueInitialized)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-6 text-center animate-in fade-in">
        <div className="mb-2 rounded-full bg-emerald-500/10 p-4 text-emerald-500">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Sessiya yakunlandi! 🎉</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Barcha {queue.length > 0 ? `${queue.length} ta ` : ''}kartochkalar SuperMemo SM-2
            algoritmi bo'yicha takrorlandi. Keyingi takrorlash sanasi avtomatik belgilandi.
          </p>
          {totalXpEarned > 0 && (
            <p className="pt-1 text-lg font-extrabold text-primary">
              +{totalXpEarned} XP to'pladingiz
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => handleBatchLimitChange(batchLimit)}
            className="rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-md"
          >
            🔄 Yana O'rganish ({batchLimit === 'all' ? 'Barchasi' : `${batchLimit} ta`})
          </Button>
          <Button
            onClick={() => navigate('/vocabulary')}
            variant="outline"
            className="rounded-xl px-6 py-2.5 font-bold"
          >
            Lug'atga o'tish
          </Button>
          <Button
            onClick={() => navigate('/flashcards')}
            variant="outline"
            className="rounded-xl px-6 py-2.5 font-bold"
          >
            To'plamlarga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 p-4 pb-[max(2rem,env(safe-area-inset-bottom,24px))] md:p-8">
      {isEditingCard && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-500" />
                <h3 className="text-base font-black text-foreground">Kartochkani tahrirlash</h3>
                {isAdmin && (
                  <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                    <ShieldCheck size={13} /> Admin
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsEditingCard(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-muted-foreground">
                    Yaponcha so'z / Kanji (Front)
                  </label>
                  <input
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 p-2.5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="Old qismi (Front)"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-muted-foreground">
                    O'qilishi / Furigana (Phonetic)
                  </label>
                  <input
                    value={editPhonetic}
                    onChange={(e) => setEditPhonetic(e.target.value)}
                    className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 p-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="Masalan: わたし - watashi"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">
                  O'zbekcha tarjimasi / Ma'nosi (Back)
                </label>
                <textarea
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  rows={2}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 p-2.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="Orqa qismi (Back)"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">
                  Struktura / Misol jumlasi (Example)
                </label>
                <textarea
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  rows={2}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 p-2.5 text-xs font-medium text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="Misol jumlasi yoki grammatik struktura..."
                />
              </div>

              {isAdmin && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10">
                  <input
                    type="checkbox"
                    checked={editGlobal}
                    onChange={(e) => setEditGlobal(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-primary text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <span className="flex items-center gap-1 font-black text-primary">
                      <Globe size={14} /> Umumiy production bazasiga saqlash
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Barcha darsliklar va o'quvchilar uchun global o'zgaradi.
                    </span>
                  </div>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setIsEditingCard(false)}
                  variant="secondary"
                  className="text-xs font-bold"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-primary text-xs font-bold text-primary-foreground shadow-md"
                >
                  Saqlash
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          {/* Mode selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
            <button
              onClick={() => setStudyMode('srs')}
              aria-label="Flashcard SRS"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${studyMode === 'srs' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              🎴 <span className="hidden sm:inline">Flashcard </span>SRS
            </button>
            <button
              onClick={() => setStudyMode('type')}
              aria-label="Yozib Tekshirish"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${studyMode === 'type' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              ✏️ <span className="hidden sm:inline">Yozib </span>Tekshirish
            </button>
          </div>

          {/* Configurable Batch Size Selector */}
          <div className="hidden items-center gap-1 rounded-xl border border-border bg-muted/70 p-1 sm:flex">
            <span className="px-1 text-[10px] font-bold text-muted-foreground">Hajm:</span>
            {(['10', '25', '50', 'all'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleBatchLimitChange(option)}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  batchLimit === option
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={option === 'all' ? "To'plamdagi barcha kartalar" : `${option} ta karta`}
              >
                {option === 'all' ? 'Barchasi' : option}
              </button>
            ))}
          </div>

          {/* Language filter pills (shown in global study mode) */}
          {!subjectId && (
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/70 p-1">
              <button
                onClick={() => handleLanguageFilterChange(null)}
                aria-label="Filter: Barchasi"
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  !langFilter
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Barcha kartalar"
              >
                🌐 <span className="hidden sm:inline">Barchasi</span>
              </button>
              <button
                onClick={() => handleLanguageFilterChange('ja')}
                aria-label="Filter: Yaponcha"
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  langFilter === 'ja'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Faqat yapon tili va JLPT kartalari"
              >
                🇯🇵 <span className="hidden sm:inline">Yaponcha</span>
              </button>
              <button
                onClick={() => handleLanguageFilterChange('en')}
                aria-label="Filter: Inglizcha"
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  langFilter === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Faqat ingliz tili kartalari"
              >
                🇬🇧 <span className="hidden sm:inline">Inglizcha</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Audio Toggle */}
          <button
            onClick={toggleAutoAudio}
            className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-bold transition-all active:scale-95 ${
              autoAudio
                ? 'border-primary/40 bg-primary/10 text-primary shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            title="Karta o'zgarganda talaffuzni avtomatik eshittirish"
          >
            <Volume2 size={13} className={autoAudio ? 'text-primary' : ''} />
            <span className="hidden sm:inline">Auto</span>
            <span className="text-[10px] opacity-75">{autoAudio ? 'ON' : 'OFF'}</span>
          </button>

          {/* Accent / Language Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1">
            {isJapanese ? (
              <span
                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400"
                title="Yapon tili talaffuzi (ja-JP)"
              >
                🇯🇵 JP
              </span>
            ) : (
              <>
                <button
                  onClick={() => setAccent('en-US')}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${accent === 'en-US' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  🇺🇸
                </button>
                <button
                  onClick={() => setAccent('en-GB')}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${accent === 'en-GB' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  🇬🇧
                </button>
              </>
            )}
          </div>

          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
            {currentCardIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {studyMode === 'type' ? (
        <div className="flex min-h-[380px] flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Yozma Javob Berish
            </span>
            <button
              onClick={handleSpeak}
              className="rounded-xl bg-primary/10 p-3 text-primary transition-all hover:bg-primary/20"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="my-6 space-y-4 text-center">
            <h3 className="text-3xl font-extrabold text-foreground">{currentCard?.front}</h3>
            <p className="text-xs text-muted-foreground">
              Ushbu so'z yoki iboraning o'zbekcha/inglizcha ma'nosini yozing:
            </p>
            <input
              type="text"
              value={typedAnswer}
              onChange={(e) => {
                setTypedAnswer(e.target.value);
                setTypeResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (typeResult === 'incorrect') {
                    setTypedAnswer('');
                    setTypeResult(null);
                    if (currentCardIndex < queue.length - 1) {
                      setCurrentCardIndex((i) => i + 1);
                    } else {
                      completeLinkedPlanTask();
                      setIsFinished(true);
                    }
                  } else {
                    if (!typedAnswer.trim() || !currentCard) return;
                    const isCorrect = isFlashcardAnswerCorrect(typedAnswer, currentCard.back);
                    if (isCorrect) {
                      setTypeResult('correct');
                      setTotalXpEarned((x) => x + 25);
                      setTimeout(() => {
                        setTypedAnswer('');
                        setTypeResult(null);
                        if (currentCardIndex < queue.length - 1) {
                          setCurrentCardIndex((i) => i + 1);
                        } else {
                          completeLinkedPlanTask();
                          setIsFinished(true);
                        }
                      }, 1100);
                    } else {
                      setTypeResult('incorrect');
                    }
                  }
                }
              }}
              placeholder="Javobingizni shu yerga yozing va Enter bosing..."
              className={`mx-auto w-full max-w-md rounded-2xl border px-4 py-3 text-center text-base transition-all ${
                typeResult === 'correct'
                  ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-600'
                  : typeResult === 'incorrect'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                    : 'border-border bg-background/50 text-foreground focus:ring-2 focus:ring-primary'
              }`}
              autoFocus
            />
            {typeResult === 'correct' && (
              <p className="animate-bounce text-sm font-bold text-emerald-500">
                ✨ Muvaffaqiyatli! +25 XP
              </p>
            )}
            {typeResult === 'incorrect' && (
              <div className="mx-auto max-w-md rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-left text-xs text-rose-500 animate-in fade-in">
                <span className="block font-bold">To'g'ri ma'nosi:</span>
                <span className="whitespace-pre-line font-medium">{currentCard?.back}</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              if (typeResult === 'incorrect') {
                setTypedAnswer('');
                setTypeResult(null);
                if (currentCardIndex < queue.length - 1) {
                  setCurrentCardIndex((i) => i + 1);
                } else {
                  completeLinkedPlanTask();
                  setIsFinished(true);
                }
              } else {
                if (!typedAnswer.trim() || !currentCard) return;
                const isCorrect = isFlashcardAnswerCorrect(typedAnswer, currentCard.back);
                if (isCorrect) {
                  setTypeResult('correct');
                  setTotalXpEarned((x) => x + 25);
                  setTimeout(() => {
                    setTypedAnswer('');
                    setTypeResult(null);
                    if (currentCardIndex < queue.length - 1) {
                      setCurrentCardIndex((i) => i + 1);
                    } else {
                      completeLinkedPlanTask();
                      setIsFinished(true);
                    }
                  }, 1100);
                } else {
                  setTypeResult('incorrect');
                }
              }
            }}
            className="w-full rounded-2xl py-3 font-bold"
          >
            {typeResult === 'incorrect' ? "Keyingi Kartaga o'tish →" : 'Tekshirish (Enter) →'}
          </Button>
        </div>
      ) : (
        /* Professional 3D Flip Card */
        <div
          data-testid="study-card"
          style={cardStyle}
          {...swipeHandlers}
          className="perspective-1000 relative h-72 cursor-pointer select-none sm:h-96"
        >
          {/* Visual Swipe Badges for Mobile */}
          {isDragging && swipeDirection === 'left' && (
            <div
              className="pointer-events-none absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-2xl border-2 border-rose-500 bg-rose-500/20 px-3.5 py-1.5 text-xs font-black text-rose-500 shadow-lg backdrop-blur-md"
              style={{ opacity: Math.max(0.35, swipeProgress) }}
            >
              <span>🔄</span>
              <span>Qayta (Again)</span>
            </div>
          )}
          {isDragging && swipeDirection === 'right' && (
            <div
              className="pointer-events-none absolute left-4 top-4 z-40 flex items-center gap-1.5 rounded-2xl border-2 border-primary bg-primary/20 px-3.5 py-1.5 text-xs font-black text-primary shadow-lg backdrop-blur-md"
              style={{ opacity: Math.max(0.35, swipeProgress) }}
            >
              <span>👍</span>
              <span>Yaxshi (Good)</span>
            </div>
          )}

          <div
            className={`transform-style-3d relative h-full w-full transition-all duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front Side */}
            <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-8">
              <div className="flex items-center justify-between">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartEdit}
                      title="Admin: Ushbu kartochkani tahrirlash"
                      className="flex items-center gap-1 rounded-xl bg-[#C9A961]/15 p-2 text-xs font-bold text-[#C9A961] shadow-xs transition-all hover:bg-[#C9A961]/25 active:scale-95"
                    >
                      <Edit3 size={14} /> Tahrirlash
                    </button>
                    <button
                      onClick={handleDeleteCard}
                      title="Admin: Ushbu kartochkani bazadan o'chirish"
                      className="flex items-center gap-1 rounded-xl bg-rose-500/10 p-2 text-xs font-bold text-rose-500 shadow-xs transition-all hover:bg-rose-500/20 active:scale-95"
                    >
                      <Trash2 size={14} /> O'chirish
                    </button>
                  </div>
                ) : (
                  <div />
                )}
                <button
                  onClick={handleSpeak}
                  title="Talaffuzni eshitish"
                  className="rounded-2xl bg-primary/10 p-3 text-primary shadow-xs transition-all hover:bg-primary/20 active:scale-95"
                >
                  <Volume2 size={24} />
                </button>
              </div>
              <div className="my-auto text-center">
                <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {cleanCardFront(currentCard?.front)}
                </p>
              </div>
              <p className="text-center text-xs font-medium text-muted-foreground">
                👆 Kartani bosing yoki suring — Javobni ko'rish (Space)
              </p>
            </div>

            {/* Back Side */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl border-2 border-primary/50 bg-gradient-to-br from-[#1A2028] via-[#222B36] to-[#1A2028] p-5 text-foreground shadow-2xl sm:p-8">
              <div className="flex justify-end">
                <button
                  onClick={handleSpeak}
                  className="rounded-2xl border border-border bg-card p-3 text-foreground transition-all hover:bg-muted active:scale-95"
                >
                  <Volume2 size={24} />
                </button>
              </div>
              <div className="custom-scrollbar my-auto max-h-[240px] space-y-3 overflow-y-auto px-2 text-center">
                <div className="whitespace-pre-line text-xl font-black leading-relaxed tracking-wide text-primary md:text-2xl">
                  {currentCard?.back}
                </div>
                {currentCard?.phonetic ? (
                  <p className="text-xs font-semibold text-muted-foreground/90">
                    {currentCard.phonetic}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-muted-foreground">
                    {cleanCardFront(currentCard?.front)}
                  </p>
                )}
                {currentCard?.example && (
                  <div className="mx-auto mt-2 max-w-md rounded-2xl border border-primary/20 bg-primary/10 p-3 text-left shadow-xs">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold text-primary">
                      <span>💬</span>
                      <span>Misol jumla:</span>
                    </div>
                    <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-foreground sm:text-sm">
                      {currentCard.example}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="font-extrabold text-primary sm:hidden">👈 Qayta | Yaxshi 👉</span>
                <span className="hidden sm:inline">SuperMemo SM-2 bo'yicha baholang</span>
                <span>(1-4 tugmalari)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {studyMode === 'srs' && (
        <div>
          {!isFlipped ? (
            <Button
              className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={() => setIsFlipped(true)}
            >
              Javobni ko'rish
            </Button>
          ) : (
            (() => {
              const labels = getPreviewIntervalLabels(
                currentCard?.interval || 0,
                currentCard?.repetitions || 0,
                currentCard?.easeFactor || 2.5,
                false,
              );

              return (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      l: 'Qayta (❌)',
                      v: Rating.AGAIN,
                      sub: `${labels[Rating.AGAIN]} (1)`,
                      c: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20',
                    },
                    {
                      l: 'Qiyin (😐)',
                      v: Rating.HARD,
                      sub: `${labels[Rating.HARD]} (2)`,
                      c: 'bg-[#C9A961]/15 text-[#C9A961] border-[#C9A961]/30 hover:bg-[#C9A961]/25',
                    },
                    {
                      l: 'Yaxshi (🙂)',
                      v: Rating.GOOD,
                      sub: `${labels[Rating.GOOD]} (3)`,
                      c: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
                    },
                    {
                      l: 'Oson (😄)',
                      v: Rating.EASY,
                      sub: `${labels[Rating.EASY]} (4)`,
                      c: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
                    },
                  ].map((b) => (
                    <button
                      key={b.v}
                      disabled={isProcessing}
                      onClick={() => handleRate(b.v)}
                      className={`${b.c} rounded-2xl border p-3.5 text-center text-sm font-extrabold shadow-xs transition-all active:scale-95`}
                    >
                      <div>{b.l}</div>
                      <span className="mt-0.5 block text-[11px] font-medium opacity-80">
                        {b.sub}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};

export default StudyModePage;
