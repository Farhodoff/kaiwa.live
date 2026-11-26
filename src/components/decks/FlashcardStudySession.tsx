import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Layers,
  Loader2,
  Volume2,
  Trash2,
  Edit3,
  Trophy,
  RotateCcw,
  Keyboard,
  Sparkles,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { isUserAdmin } from '../../utils/admin';
import { Flashcard } from '../../types';
import { ActivityLoggingService } from '../../services/ActivityLoggingService';
import { GlobalFlashcardOverrideService } from '../../services/GlobalFlashcardOverrideService';
import {
  Rating,
  Grade,
  getPreviewIntervalLabels,
  calculateReview,
  sortCardsBySRSPriority,
  isDue,
} from '../../utils/srs';
import { isFlashcardForLanguage } from '../../utils/subjectResolver';
import { getStudyFlashcards } from '../../utils/flashcardScope';
import { speakText } from '../../utils/audioTts';
import { toast } from '../../hooks/use-toast';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useFlashcardSwipe } from '../../hooks/useFlashcardSwipe';
import { FuriganaText } from '../jlpt/FuriganaText';

export function cleanCardFront(front?: string): string {
  if (!front) return '';
  const trimmed = front.trim();
  const knownFixes: Record<string, string> = {
    みず水: '水',
    たまご卵: '卵',
    にく肉: '肉',
    さかな魚: '魚',
    やさい野菜: '野菜',
    くだもの果物: '果物',
    おちゃお茶: 'お茶',
    こうちゃ紅茶: '紅茶',
    ぎゅうにゅう牛乳: '牛乳',
    えいが映画: '映画',
    てがみ手紙: '手紙',
    しゃしん写真: '写真',
    みせ店: '店',
    にわ庭: '庭',
    しゅくだい宿題: '宿題',
    なに何: '何',
    たべます食べます: '食べます',
    のみます飲みます: '飲みます',
    すいます吸います: '吸います',
    みます見ます: '見ます',
    ききます聞きます: '聞きます',
    よみます読みます: '読みます',
    かきます書きます: '書きます',
    かいます買います: '買います',
    とります撮ります: '撮ります',
    あいます会います: '会います',
    あさごはん朝ごはん: '朝ごはん',
    ひるごはん昼ごはん: '昼ごはん',
    ばんごはん晩ごはん: '晩ごはん',
    ときどき時々: '時々',
    動物どうぶつ: '動物',
    馬うま: '馬',
    牧ぼく場じょう: '牧場',
    乾杯かんぱい: '乾杯',
    建物たてもの: '建物',
    転勤てんきん: '転勤',
    日に本ほん: '日本',
    神こう戸べ病びょう院いん: '神戸病院',
    新しん大おお阪さか: '新大阪',
    富ふ士じ山さん: '富士山',
    大おお阪さか城じょう: '大阪城',
    金きん閣かく寺じ: '金閣寺',
    家や賃ちん: '家賃',
    和わ室しつ: '和室',
    押おし入いれ: '押し入れ',
    布ふ団とん: '布団',
    母ははの日ひ: '母の日',
    頑がん張ばります: '頑張ります',
    'どうぞお元げん気きで。': 'どうぞお元気で。',
    '一杯いっぱい飲のみましょう。': '一杯飲みましょう。',
  };
  return knownFixes[trimmed] || trimmed;
}

interface FlashcardStudySessionProps {
  subjectId?: string | null; // null or undefined means 'all due cards'
  onClose: () => void;
  cardLanguage?: 'ja' | 'en';
  onComplete?: () => void;
}

export const FlashcardStudySession: React.FC<FlashcardStudySessionProps> = ({
  subjectId,
  onClose,
  cardLanguage,
  onComplete,
}) => {
  const { user, flashcards, subjects, reviewFlashcard, updateFlashcard, deleteFlashcard, loading } =
    useStudyData();
  const { language } = useLanguage();
  const isJa = language === 'ja';
  const isAdmin = isUserAdmin(user);
  const { isTwa, haptics } = useTelegramWebApp();

  // Prevent background body scrolling while study session modal is active
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const renderPortal = (node: React.ReactNode) => {
    if (typeof document === 'undefined') return <>{node}</>;
    return createPortal(node, document.body);
  };

  // Telegram TWA keyboard viewport handler — track keyboard height so
  // rating buttons stay visible above the soft keyboard
  useEffect(() => {
    if (!isTwa) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const keyboardOffset = window.innerHeight - vv.height;
      document.documentElement.style.setProperty(
        '--twa-keyboard-offset',
        `${Math.max(0, keyboardOffset)}px`,
      );
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
      document.documentElement.style.removeProperty('--twa-keyboard-offset');
    };
  }, [isTwa]);

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [accent, setAccent] = useState<'en-GB' | 'en-US' | 'ja-JP'>('en-US');
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

  // Study Mode: 'srs' | 'type'
  const [studyMode, setStudyMode] = useState<'srs' | 'type'>('srs');
  const [typedAnswer, setTypedAnswer] = useState('');

  // Admin inline editing state
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [deleteArmedFor, setDeleteArmedFor] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editGlobal, setEditGlobal] = useState(true);

  const [milestoneBonusXp, setMilestoneBonusXp] = useState(0);
  const [milestoneBadge, setMilestoneBadge] = useState<string | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const sessionLoggedRef = useRef<boolean>(false);

  const currentSubject = subjects.find((s) => s.id === subjectId);

  useEffect(() => {
    if (isFinished && !sessionLoggedRef.current && reviewedCount > 0) {
      sessionLoggedRef.current = true;
      onComplete?.();
      const durationMins = Math.max(
        1,
        Math.round((Date.now() - sessionStartTimeRef.current) / 60000),
      );
      const isBatchCompleted = queue.length > 0 && currentCardIndex >= queue.length - 1;
      const { milestoneXp, badge } = ActivityLoggingService.calculateFlashcardMilestoneXP(
        reviewedCount,
        isBatchCompleted,
      );

      if (milestoneXp > 0) {
        setMilestoneBonusXp(milestoneXp);
        if (badge) setMilestoneBadge(badge);
        setTotalXpEarned((prev) => prev + milestoneXp);
      }

      const subjectTitle =
        currentSubject?.name || (isJa ? 'フラッシュカード学習' : "Flashcard Mashg'uloti");

      ActivityLoggingService.logActivity({
        activityType: 'flashcards',
        activityTitle: `${subjectTitle} (${reviewedCount} ta so'z)`,
        durationMinutes: durationMins,
        itemsCount: reviewedCount,
        xpEarned: totalXpEarned + milestoneXp,
        metadata: {
          subjectId,
          reviewedCount,
          milestoneBonusXp: milestoneXp,
          badge,
        },
      });
    }
  }, [
    isFinished,
    onComplete,
    reviewedCount,
    queue.length,
    currentCardIndex,
    currentSubject,
    subjectId,
    totalXpEarned,
    isJa,
  ]);

  useEffect(() => {
    if (loading || isQueueInitialized) return;
    const scopedCards = getStudyFlashcards(flashcards, subjects, subjectId || 'all');
    const availableCards = cardLanguage
      ? scopedCards.filter((card) => isFlashcardForLanguage(card, subjects, cardLanguage))
      : scopedCards;
    const now = new Date();
    const due = availableCards.filter((card) => isDue(card, now));
    const targetSet = due.length > 0 ? due : availableCards;
    setQueue(sortCardsBySRSPriority(targetSet).slice(0, 30));
    setIsQueueInitialized(true);
  }, [subjectId, flashcards, subjects, cardLanguage, isQueueInitialized, loading]);

  const currentCard = queue[currentCardIndex];

  const isJapanese = useMemo(() => {
    if (!currentCard && !currentSubject) return false;
    const frontText = currentCard?.front || '';
    const backText = currentCard?.back || '';
    const subjectTitle = currentSubject?.name || '';
    const subjectType = (currentSubject as any)?.type || '';
    const subjectCategory = (currentSubject as any)?.category || '';

    const hasJapaneseChars =
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(
        frontText + backText + subjectTitle,
      );
    const isJlptMeta =
      subjectType.toLowerCase().includes('jlpt') ||
      subjectCategory.toLowerCase().includes('jlpt') ||
      subjectTitle.toLowerCase().includes('jlpt') ||
      subjectTitle.toLowerCase().includes('kanji') ||
      subjectTitle.toLowerCase().includes('yapon');

    return hasJapaneseChars || isJlptMeta;
  }, [currentCard, currentSubject]);

  const handleSpeak = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentCard?.front) {
        speakText(cleanCardFront(currentCard.front), isJapanese ? 'ja-JP' : accent);
      }
    },
    [currentCard, isJapanese, accent],
  );

  useEffect(() => {
    if (autoAudio && currentCard && !isFinished && !isEditingCard) {
      const timer = setTimeout(() => {
        if (currentCard?.front) {
          speakText(cleanCardFront(currentCard.front), isJapanese ? 'ja-JP' : accent);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentCardIndex, autoAudio, isFinished, isEditingCard, isJapanese, accent, currentCard]);

  const handleReview = useCallback(
    async (grade: Grade) => {
      if (!currentCard || isProcessing) return;

      // Haptic feedback based on SRS rating
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
        await reviewFlashcard(currentCard.id, grade);
        const xpGained =
          grade === Rating.EASY ? 15 : grade === Rating.GOOD ? 10 : grade === Rating.HARD ? 5 : 2;
        setTotalXpEarned((prev) => prev + xpGained);
        setReviewedCount((prev) => prev + 1);

        const shouldRequeue = grade === Rating.AGAIN || grade === Rating.HARD;
        if (shouldRequeue) {
          const reviewResult = calculateReview(
            grade,
            currentCard.interval || 0,
            currentCard.repetitions || 0,
            currentCard.easeFactor || 2.5,
          );
          const updatedCard: Flashcard = {
            ...currentCard,
            interval: reviewResult.interval,
            repetitions: reviewResult.repetitions,
            easeFactor: reviewResult.easeFactor,
            nextReviewDate: reviewResult.nextReviewDate,
          };
          setQueue((prev) => [...prev, updatedCard]);
          toast({
            title:
              grade === Rating.AGAIN
                ? isJa
                  ? '🔄 もう一度復習 (10分)'
                  : '🔄 Qayta takrorlash (10 daq)'
                : isJa
                  ? '⚡ 復習キューに追加 (30分)'
                  : '⚡ Qiyin karta (30 daq)',
            description:
              grade === Rating.AGAIN
                ? isJa
                  ? 'セッション最後にもう一度復習します。'
                  : "Karta navbat oxiriga qo'shildi. Sessiya oxirida yana ko'rasiz."
                : isJa
                  ? '定着のためセッション最後にもう一度出題されます。'
                  : 'Mustahkamlash uchun sessiya oxirida yana bir bor takrorlaysiz.',
          });
        }

        if (currentCardIndex < queue.length - 1 || shouldRequeue) {
          setCurrentCardIndex((prev) => prev + 1);
          setIsFlipped(false);
          setTypedAnswer('');
          setIsEditingCard(false);
        } else {
          haptics.notification('success');
          setIsFinished(true);
        }
      } catch (error) {
        console.error('Error reviewing flashcard:', error);
        toast({
          variant: 'destructive',
          title: 'Xatolik',
          description: 'Natijani saqlashda xato yuz berdi',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [currentCard, isProcessing, reviewFlashcard, currentCardIndex, queue.length, haptics, isJa],
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
    onSwipeLeft: () => handleReview(Rating.AGAIN),
    onSwipeRight: () => handleReview(Rating.GOOD),
    disabled: isEditingCard || isFinished || isProcessing,
    onHapticThreshold: () => haptics.selection(),
  });

  // Two-tap delete: first tap arms the button for 3s, second tap deletes.
  // Avoids native window.confirm dialogs which are jarring on mobile.
  const handleDeleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    if (deleteArmedFor !== currentCard.id) {
      setDeleteArmedFor(currentCard.id);
      const armedId = currentCard.id;
      setTimeout(() => {
        setDeleteArmedFor((prev) => (prev === armedId ? null : prev));
      }, 3000);
      return;
    }
    setDeleteArmedFor(null);
    const cardToDeleteId = currentCard.id;
    setQueue((prev) => prev.filter((c) => c.id !== cardToDeleteId));
    if (currentCardIndex >= queue.length - 1) {
      setIsFinished(true);
    }
    setIsFlipped(false);
    await deleteFlashcard(cardToDeleteId);
    toast({ title: "🗑️ Kartochka o'chirildi" });
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

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || !editFront.trim() || !editBack.trim()) return;

    try {
      const cleanF = editFront.trim();
      const cleanB = editBack.trim();
      const cleanP = editPhonetic.trim();
      const cleanE = editExample.trim();

      // 1. Update user card in personal DB if available
      if (currentCard.id) {
        await updateFlashcard(currentCard.id, {
          front: cleanF,
          back: cleanB,
        });
      }

      // 2. If Admin selected Global production database update
      if (isAdmin && editGlobal) {
        const saved = await GlobalFlashcardOverrideService.saveGlobalOverride(
          {
            word: currentCard.front,
            front: cleanF,
            phonetic: cleanP,
            back: cleanB,
            example: cleanE,
            deck_id: (currentCard as any).deckId || currentSubject?.id || null,
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
        toast({ title: '✅ Kartochka yangilandi' });
      }

      setQueue((prev) =>
        prev.map((c) =>
          c.id === currentCard.id || c.front === currentCard.front
            ? { ...c, front: cleanF, back: cleanB, phonetic: cleanP, example: cleanE }
            : c,
        ),
      );
      setIsEditingCard(false);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: "O'zgartirishni saqlashda xato bo'ldi",
      });
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingCard || isFinished || isProcessing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleReview(Rating.AGAIN);
        if (e.key === '2') handleReview(Rating.HARD);
        if (e.key === '3') handleReview(Rating.GOOD);
        if (e.key === '4') handleReview(Rating.EASY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingCard, isFinished, isProcessing, isFlipped, handleReview, handleToggleFlip]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim() || !currentCard) return;
    haptics.selection();
    setIsFlipped(true);
  };

  const previewIntervals = useMemo(() => {
    return getPreviewIntervalLabels(
      currentCard?.interval || 0,
      currentCard?.repetitions || 0,
      currentCard?.easeFactor || 2.5,
      isJa,
    );
  }, [currentCard, isJa]);

  if (!isQueueInitialized) {
    return renderPortal(
      <div className="bg-background/98 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl">
        <div className="space-y-4 text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-primary" />
          <p className="text-sm font-extrabold text-foreground">Kartochkalar tayyorlanmoqda...</p>
        </div>
      </div>,
    );
  }

  if (queue.length === 0) {
    return renderPortal(
      <div className="bg-background/98 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-2xl animate-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Layers size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">
              {isJa ? 'カードがありません' : 'Kartalar topilmadi'}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {currentSubject ? `"${currentSubject.name}" to'plamida` : "Barcha to'plamlarda"}{' '}
              o‘rganish uchun karta yo‘q.
            </p>
          </div>
          <Button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-3 font-black text-primary-foreground"
          >
            To'plamlarga Qaytish
          </Button>
        </div>
      </div>,
    );
  }

  if (isFinished) {
    return renderPortal(
      <div className="bg-background/98 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-2xl animate-in zoom-in-95">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C9A961]/15 text-[#C9A961]">
            <Trophy size={44} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">
              {isJa ? '学習セッション完了！ 🎉' : "Mashg'ulot Yakunlandi! 🎉"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isJa ? (
                <>
                  <strong>{reviewedCount} 枚</strong>のカードを学習し、
                  <strong>+{totalXpEarned} XP</strong> を獲得しました！
                </>
              ) : (
                <>
                  Siz <strong>{reviewedCount} ta</strong> kartochkani muvaffaqiyatli takrorladingiz
                  va <strong>+{totalXpEarned} XP</strong> yutib oldingiz!
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/40 p-4 text-center">
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                {isJa ? '復習済みカード' : 'Takrorlangan'}
              </span>
              <span className="text-xl font-black text-foreground">
                {reviewedCount} {isJa ? '枚' : 'ta'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-[#C9A961]">
                {isJa ? '獲得 XP' : 'Yutilgan XP'}
              </span>
              <span className="text-xl font-black text-[#C9A961]">+{totalXpEarned} XP</span>
            </div>
          </div>

          {milestoneBonusXp > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-400">
                <Sparkles size={16} />
                <span>
                  {isJa
                    ? `マイルストーン達成ボーナス: +${milestoneBonusXp} XP！`
                    : `Katta Qism Yakunlandi: +${milestoneBonusXp} XP Bonusi!`}
                </span>
              </div>
              {milestoneBadge && (
                <p className="mt-1 text-xs font-medium text-amber-300/80">🏅 {milestoneBadge}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                sessionStartTimeRef.current = Date.now();
                sessionLoggedRef.current = false;
                setMilestoneBonusXp(0);
                setMilestoneBadge(null);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setIsFinished(false);
                setReviewedCount(0);
              }}
              variant="secondary"
              className="flex-1 rounded-xl py-3 font-bold"
            >
              <RotateCcw size={16} className="mr-2" /> {isJa ? 'もう一度復習' : "Qayta O'rganish"}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 rounded-xl bg-primary py-3 font-black text-primary-foreground"
            >
              {isJa ? '完了' : 'Tugatish'}
            </Button>
          </div>
        </div>
      </div>,
    );
  }

  const progressPercentage = Math.round((currentCardIndex / queue.length) * 100);

  return renderPortal(
    <div className="bg-background/98 fixed inset-0 z-[100] flex flex-col overflow-y-auto p-3 pb-[max(1.5rem,env(safe-area-inset-bottom,20px))] pt-[max(1rem,env(safe-area-inset-top,16px))] backdrop-blur-2xl sm:p-4 md:p-8">
      {/* Top Bar */}
      <div className="mx-auto mb-4 flex w-full max-w-3xl items-center justify-between gap-2 sm:mb-6 sm:gap-4">
        <button
          onClick={onClose}
          className="flex shrink-0 cursor-pointer touch-manipulation items-center gap-1.5 rounded-xl p-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground active:scale-95"
          aria-label={isJa ? '単語帳一覧に戻る' : "To'plamlarga qaytish"}
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">
            {isJa ? '単語帳一覧に戻る' : "To'plamlarga qaytish"}
          </span>
        </button>

        {/* Progress bar */}
        <div className="min-w-[50px] max-w-xs flex-1 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground sm:text-[11px]">
            <span>
              {currentCardIndex + 1} / {queue.length}
            </span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:h-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#C9A961] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Audio Accent toggle */}
          {!isJapanese && (
            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value as any)}
              className="focus:outline-hidden rounded-xl border border-border bg-muted/60 px-2 py-1 text-[11px] font-bold text-foreground sm:px-2.5 sm:py-1.5 sm:text-xs"
            >
              <option value="en-US">🇺🇸 US</option>
              <option value="en-GB">🇬🇧 UK</option>
            </select>
          )}

          {/* Auto Audio Playback Toggle */}
          <button
            onClick={toggleAutoAudio}
            className={`flex cursor-pointer touch-manipulation items-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-extrabold transition-all sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs ${
              autoAudio
                ? 'border-primary/40 bg-primary/10 text-primary shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            title={
              autoAudio
                ? isJa
                  ? '自動音声: オン'
                  : 'Avtomatik ovoz: Yoqilgan'
                : isJa
                  ? '自動音声: オフ'
                  : 'Avtomatik ovoz: O‘chirilgan'
            }
          >
            <Volume2 size={14} className={autoAudio ? 'animate-pulse text-primary' : ''} />
            <span className="hidden sm:inline">
              {autoAudio ? (isJa ? '音声: オン' : 'Ovoz: On') : isJa ? '音声: オフ' : 'Ovoz: Off'}
            </span>
          </button>

          {/* Study Mode: Flashcard / Typing */}
          <div className="flex rounded-xl border border-border bg-card p-0.5 sm:p-1">
            <button
              onClick={() => setStudyMode('srs')}
              className={`touch-manipulation rounded-lg px-2 py-0.5 text-[10px] font-extrabold transition-all sm:px-2.5 sm:py-1 sm:text-[11px] ${
                studyMode === 'srs'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              {isJa ? 'SRS暗記' : 'SRS'}
            </button>
            <button
              onClick={() => setStudyMode('type')}
              className={`touch-manipulation rounded-lg px-2 py-0.5 text-[10px] font-extrabold transition-all sm:px-2.5 sm:py-1 sm:text-[11px] ${
                studyMode === 'type'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              {isJa ? '入力' : 'Yozma'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Flashcard Stage */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-4">
        {isEditingCard ? (
          <div className="relative flex min-h-[380px] w-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="space-y-3.5 text-left">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="flex items-center gap-2 text-sm font-black text-foreground">
                  <Edit3 size={16} className="text-amber-500" />
                  {isJa ? 'カード編集' : 'Fleshkartani tahrirlash'}
                </span>
                {isAdmin && (
                  <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                    <ShieldCheck size={13} /> Admin
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">
                    {isJa ? '単語・漢字 (Front)' : "So'z / Yaponcha (Front)"}
                  </label>
                  <input
                    type="text"
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 px-3 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">
                    {isJa ? '読み・ふりがな (Phonetic)' : "O'qilishi / Furigana (Phonetic)"}
                  </label>
                  <input
                    type="text"
                    value={editPhonetic}
                    onChange={(e) => setEditPhonetic(e.target.value)}
                    placeholder="Masalan: わたし - watashi"
                    className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 px-3 py-2 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                  {isJa ? '意味・翻訳 (Back)' : "O'zbekcha tarjimasi / Ma'nosi (Back)"}
                </label>
                <textarea
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  rows={2}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                  {isJa
                    ? '例文・文法構造 (Structure & Example)'
                    : 'Struktura / Misol jumlasi (Example)'}
                </label>
                <textarea
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  rows={2}
                  placeholder="Misol jumlasi yoki grammatik izoh..."
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-muted/70 px-3 py-2 text-xs font-medium text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              {isAdmin && (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5 transition-colors hover:bg-primary/10">
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
                      O'zgarish barcha foydalanuvchilar va darsliklar uchun to'liq amal qiladi.
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
                  {isJa ? 'キャンセル' : 'Bekor qilish'}
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-primary text-xs font-bold text-primary-foreground shadow-md"
                >
                  {isJa ? '保存' : 'Saqlash'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="study-card"
            style={cardStyle}
            {...swipeHandlers}
            className="perspective-1000 relative min-h-[300px] w-full cursor-pointer select-none sm:min-h-[340px] md:min-h-[380px]"
          >
            {/* Visual Swipe Badges */}
            {isDragging && swipeDirection === 'left' && (
              <div
                className="pointer-events-none absolute right-3 top-3 z-40 flex items-center gap-1.5 rounded-2xl border-2 border-rose-500 bg-rose-500/20 px-3 py-1 text-xs font-black text-rose-500 shadow-lg backdrop-blur-md sm:right-4 sm:top-4 sm:px-3.5 sm:py-1.5"
                style={{ opacity: Math.max(0.35, swipeProgress) }}
              >
                <span>🔄</span>
                <span>{isJa ? 'もう一度 (Again)' : 'Qayta (Again)'}</span>
              </div>
            )}
            {isDragging && swipeDirection === 'right' && (
              <div
                className="pointer-events-none absolute left-3 top-3 z-40 flex items-center gap-1.5 rounded-2xl border-2 border-primary bg-primary/20 px-3 py-1 text-xs font-black text-primary shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:px-3.5 sm:py-1.5"
                style={{ opacity: Math.max(0.35, swipeProgress) }}
              >
                <span>👍</span>
                <span>{isJa ? '良好 (Good)' : 'Yaxshi (Good)'}</span>
              </div>
            )}

            <div
              className={`transform-style-3d relative h-full min-h-[300px] w-full transition-transform duration-500 sm:min-h-[340px] md:min-h-[380px] ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-2xl transition-all hover:border-primary/40 sm:rounded-3xl sm:p-6 md:p-8">
                {/* Top Card Controls */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-extrabold text-primary sm:px-3 sm:py-1 sm:text-xs">
                    {currentSubject?.name
                      ? currentSubject.name.replace(/\s*\(\d+\s*ta\s*card\)/gi, '')
                      : isJa
                        ? 'SRS 単語カード'
                        : 'SRS Fleshkarta'}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={handleSpeak}
                      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl p-1.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary sm:p-2"
                      title={isJa ? '音声再生 (TTS)' : 'Ovoz chiqarish (TTS)'}
                      aria-label={isJa ? '音声再生 (TTS)' : 'Ovoz chiqarish (TTS)'}
                    >
                      <Volume2 size={18} className="sm:h-5 sm:w-5" />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl p-1.5 text-muted-foreground transition-all hover:bg-[#C9A961]/10 hover:text-[#C9A961] sm:p-2"
                          title={isJa ? '編集' : 'Tahrirlash'}
                          aria-label={isJa ? '編集' : 'Tahrirlash'}
                        >
                          <Edit3 size={16} className="sm:h-[18px] sm:w-[18px]" />
                        </button>
                        <button
                          onClick={handleDeleteCard}
                          aria-label={
                            deleteArmedFor === currentCard?.id
                              ? isJa
                                ? '削除の確認'
                                : "O'chirishni tasdiqlash"
                              : isJa
                                ? '削除'
                                : "O'chirish"
                          }
                          className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl transition-all active:scale-95 ${
                            deleteArmedFor === currentCard?.id
                              ? 'min-w-[44px] bg-rose-600 px-3 text-xs font-bold text-white shadow-md'
                              : 'min-w-[44px] p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 sm:p-2'
                          }`}
                        >
                          {deleteArmedFor === currentCard?.id ? (
                            <span>{isJa ? '本当に削除?' : 'Aniqmi?'}</span>
                          ) : (
                            <Trash2 size={16} className="sm:h-[18px] sm:w-[18px]" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Front Content */}
                <div className="my-auto py-4 text-center sm:py-6">
                  <h3 className="break-words text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    <FuriganaText text={cleanCardFront(currentCard?.front)} />
                  </h3>
                  <p className="flex items-center justify-center gap-1.5 pt-4 text-[11px] font-bold text-muted-foreground/60 sm:pt-6 sm:text-xs">
                    <Keyboard size={14} className="hidden sm:inline" />{' '}
                    {isJa
                      ? 'スペースキーまたはカードをタップ/スワイプして裏返す'
                      : 'Kartani bosing yoki suring (Space)'}
                  </p>
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                  <span>
                    {isJa
                      ? `復習回数: ${currentCard?.repetitions || 0}回`
                      : `Repetitsiya: ${currentCard?.repetitions || 0}`}
                  </span>
                  <span>
                    {isJa
                      ? `学習間隔: ${currentCard?.interval || 0}日`
                      : `Interval: ${currentCard?.interval || 0} kun`}
                  </span>
                </div>
              </div>

              {/* Back Side */}
              <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8">
                {/* Top Card Controls */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 sm:px-3 sm:py-1 sm:text-xs">
                    {isJa ? '解答 (Answer)' : 'Javob'}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={handleSpeak}
                      className="cursor-pointer rounded-xl p-1.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary sm:p-2"
                      title={isJa ? '音声再生 (TTS)' : 'Ovoz chiqarish (TTS)'}
                    >
                      <Volume2 size={18} className="sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                {/* Card Back Content */}
                <div className="my-auto space-y-2.5 py-3 text-center sm:space-y-3 sm:py-4">
                  <p className="break-words text-lg font-black leading-relaxed text-primary sm:text-xl md:text-2xl">
                    {currentCard?.back}
                  </p>
                  {currentCard?.phonetic ? (
                    <p className="break-words text-xs font-semibold text-muted-foreground/90">
                      {currentCard.phonetic}
                    </p>
                  ) : (
                    <p className="break-words text-xs font-semibold text-muted-foreground/80">
                      {cleanCardFront(currentCard?.front)}
                    </p>
                  )}
                  {currentCard?.example && (
                    <div className="mx-auto mt-2 max-w-lg rounded-2xl border border-primary/20 bg-primary/5 p-3 text-left shadow-xs">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold text-primary">
                        <span>💬</span>
                        <span>{isJa ? '例文' : 'Misol jumla:'}</span>
                      </div>
                      <div className="whitespace-pre-line text-xs font-semibold leading-relaxed text-foreground sm:text-sm">
                        <FuriganaText text={currentCard.example} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                  <span className="hidden sm:inline">SM-2 Algoritmi</span>
                  <span className="font-extrabold text-primary sm:hidden">
                    {isJa ? '👈 もう一度 | 良好 👉' : '👈 Qayta | Yaxshi 👉'}
                  </span>
                  <span>
                    {isJa
                      ? `難易度: ${(currentCard?.easeFactor || 2.5).toFixed(2)}`
                      : `Osonlik: ${(currentCard?.easeFactor || 2.5).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing Mode Input Form */}
        {studyMode === 'type' && !isFlipped && (
          <form onSubmit={handleTypeSubmit} className="mt-3 flex w-full gap-2 sm:mt-4">
            <input
              type="text"
              placeholder={isJa ? '意味や読み方を入力...' : 'Tarjimasini yozing...'}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              className="focus:outline-hidden flex-1 rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary sm:px-4 sm:py-3 sm:text-sm"
              autoFocus
            />
            <Button
              type="submit"
              className="rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground sm:px-6 sm:text-sm"
            >
              {isJa ? '判定' : 'Tekshirish'}
            </Button>
          </form>
        )}

        {/* SRS Grading Buttons (Again / Hard / Good / Easy) */}
        {isFlipped && (
          <div
            className="mt-4 grid w-full grid-cols-2 gap-2 duration-200 animate-in slide-in-from-bottom-3 sm:mt-6 sm:gap-3 md:grid-cols-4"
            style={{
              paddingBottom: 'var(--keyboard-offset, var(--twa-keyboard-offset, 0px))',
            }}
          >
            <button
              onClick={() => handleReview(Rating.AGAIN)}
              disabled={isProcessing}
              className="group min-h-[48px] cursor-pointer touch-manipulation select-none rounded-2xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center font-black text-rose-500 transition-all hover:bg-rose-500/20 active:scale-95 sm:p-3.5"
            >
              <span className="mb-0.5 block text-xs font-black leading-tight sm:mb-1 sm:text-sm sm:leading-none">
                {isJa ? 'もう一度 (Again)' : 'Qayta (Again)'}
              </span>
              <span className="block text-[9px] font-semibold opacity-80 sm:text-[10px]">
                <span className="sm:hidden">{previewIntervals[Rating.AGAIN]}</span>
                <span className="hidden sm:inline">{previewIntervals[Rating.AGAIN]} (1)</span>
              </span>
            </button>

            <button
              onClick={() => handleReview(Rating.HARD)}
              disabled={isProcessing}
              className="group min-h-[48px] cursor-pointer touch-manipulation select-none rounded-2xl border border-[#C9A961]/30 bg-[#C9A961]/15 p-2.5 text-center font-black text-[#C9A961] transition-all hover:bg-[#C9A961]/25 active:scale-95 sm:p-3.5"
            >
              <span className="mb-0.5 block text-xs font-black leading-tight sm:mb-1 sm:text-sm sm:leading-none">
                {isJa ? '難しい (Hard)' : 'Qiyin (Hard)'}
              </span>
              <span className="block text-[9px] font-semibold opacity-80 sm:text-[10px]">
                <span className="sm:hidden">{previewIntervals[Rating.HARD]}</span>
                <span className="hidden sm:inline">{previewIntervals[Rating.HARD]} (2)</span>
              </span>
            </button>

            <button
              onClick={() => handleReview(Rating.GOOD)}
              disabled={isProcessing}
              className="group min-h-[48px] cursor-pointer touch-manipulation select-none rounded-2xl border border-primary/30 bg-primary/10 p-2.5 text-center font-black text-primary transition-all hover:bg-primary/20 active:scale-95 sm:p-3.5"
            >
              <span className="mb-0.5 block text-xs font-black leading-tight sm:mb-1 sm:text-sm sm:leading-none">
                {isJa ? '普通 (Good)' : 'Yaxshi (Good)'}
              </span>
              <span className="block text-[9px] font-semibold opacity-80 sm:text-[10px]">
                <span className="sm:hidden">{previewIntervals[Rating.GOOD]}</span>
                <span className="hidden sm:inline">{previewIntervals[Rating.GOOD]} (3)</span>
              </span>
            </button>

            <button
              onClick={() => handleReview(Rating.EASY)}
              disabled={isProcessing}
              className="group min-h-[48px] cursor-pointer touch-manipulation select-none rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center font-black text-emerald-500 transition-all hover:bg-emerald-500/20 active:scale-95 sm:p-3.5"
            >
              <span className="mb-0.5 block text-xs font-black leading-tight sm:mb-1 sm:text-sm sm:leading-none">
                {isJa ? '簡単 (Easy)' : 'Oson (Easy)'}
              </span>
              <span className="block text-[9px] font-semibold opacity-80 sm:text-[10px]">
                <span className="sm:hidden">{previewIntervals[Rating.EASY]}</span>
                <span className="hidden sm:inline">{previewIntervals[Rating.EASY]} (4)</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
  );
};
