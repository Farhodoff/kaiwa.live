import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  Volume2,
  CheckCircle2,
  GraduationCap,
  Flame,
  Plus,
  Check,
  Play,
  ArrowRight,
  Star,
  Layers,
} from 'lucide-react';
import type { JlptGrammarItem, JlptKanjiItem, JlptVocabItem } from '../../data/jlptGrammarKanji';
import type { JlptGrammarQuestion } from '../../data/jlpt/grammar_data';
import { speakText } from '../../utils/audioTts';
import { useStudyData } from '../../context/StudyPlannerContext';
import { FuriganaText } from './FuriganaText';
import { lazyWithRetry } from '../../utils/lazyRetry';

const KanjiStrokeOrderModal = lazyWithRetry(() =>
  import('./KanjiStrokeOrderModal').then((m) => ({ default: m.KanjiStrokeOrderModal })),
);
const ConfusingKanjiComparator = lazyWithRetry(() =>
  import('./ConfusingKanjiComparator').then((m) => ({ default: m.ConfusingKanjiComparator })),
);
import { useJlptMastery, MasteryStatus } from '../../hooks/useJlptMastery';
import { HistoryService } from '../../services/HistoryService';
import { useLanguage } from '../../context/LanguageContext';
import { getOrEnsureLanguageSubject } from '../../utils/subjectResolver';
import { useSearchParams } from 'react-router-dom';
import { CustomContentService } from '../../services/CustomContentService';
import { SENTENCE_ORDERING_QUESTIONS } from '../../data/jlpt/sentence_ordering_data';
import { SentenceOrderingQuestion } from './SentenceOrderingQuestion';
import { MistakeVaultService, MistakeLevel } from '../../services/MistakeVaultService';
import { ActivityLoggingService } from '../../services/ActivityLoggingService';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface JlptGrammarKanjiMasterProps {
  initialTab?: 'grammar' | 'kanji' | 'goi' | 'quiz' | 'confusing';
}

export const JlptGrammarKanjiMaster: React.FC<JlptGrammarKanjiMasterProps> = ({
  initialTab = 'grammar',
}) => {
  const { haptics } = useTelegramWebApp();
  const [searchParams] = useSearchParams();
  const urlLevel = searchParams.get('level')?.toUpperCase();
  const initialLevel: 'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' =
    urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel) ? (urlLevel as any) : 'ALL';

  const { user, addFlashcardsBatch, subjects, addSubject, awardXP, addSession } = useStudyData();
  const { getItemStatus, setItemStatus, getStatsForLevel } = useJlptMastery();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'grammar' | 'kanji' | 'goi' | 'quiz' | 'confusing'>(
    initialTab,
  );
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(
    initialLevel,
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1', 'ALL'].includes(urlLevel)) {
      setSelectedLevel(urlLevel as any);
    }
  }, [urlLevel]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MasteryStatus>('ALL');

  // Lazy load data
  const [grammarData, setGrammarData] = useState<JlptGrammarItem[]>([]);
  const [kanjiData, setKanjiData] = useState<JlptKanjiItem[]>([]);
  const [vocabData, setVocabData] = useState<JlptVocabItem[]>([]);
  const [grammarQuestions, setGrammarQuestions] = useState<JlptGrammarQuestion[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Load dataset corresponding to activeTab on-demand (grammar, kanji, quiz)
  useEffect(() => {
    let isMounted = true;
    const loadTabDataset = async () => {
      try {
        if (activeTab === 'grammar' && grammarData.length === 0) {
          const gkModule = await import('../../data/jlptGrammarKanji');
          if (isMounted) setGrammarData(gkModule.JLPT_GRAMMAR_DATA);
        } else if (activeTab === 'kanji' && kanjiData.length === 0) {
          setTabLoading(true);
          const kanjiDbModule = await import('../../data/jlptKanjiDatabase');
          if (isMounted) setKanjiData(kanjiDbModule.JLPT_KANJI_DATABASE);
        } else if (activeTab === 'quiz' && grammarQuestions.length === 0) {
          setTabLoading(true);
          const questionsModule = await import('../../data/jlpt/grammar_data');
          if (isMounted) setGrammarQuestions(questionsModule.JLPT_GRAMMAR_QUESTIONS);
        }
      } catch (err) {
        console.error('Failed to load JLPT dataset for ' + activeTab, err);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
          setTabLoading(false);
        }
      }
    };
    loadTabDataset();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Fast progressive on-demand vocab loader when Goi tab or level changes
  useEffect(() => {
    if (activeTab !== 'goi') return;
    let isMounted = true;
    const fetchVocabForLevel = async () => {
      try {
        setTabLoading(true);
        const vocabModule = await import('../../data/jlptVocabData');
        if (selectedLevel === 'ALL') {
          // Instant initial paint: load N5 first (<50ms) so user never sees a stalled screen
          const n5 = await vocabModule.loadVocabByLevel('N5');
          if (!isMounted) return;
          setVocabData(n5);
          setTabLoading(false);

          // Stream N4 and N3 in the background seamlessly
          const [n4, n3] = await Promise.all([
            vocabModule.loadVocabByLevel('N4'),
            vocabModule.loadVocabByLevel('N3'),
          ]);
          if (isMounted) {
            setVocabData([...n5, ...n4, ...n3]);
          }
        } else {
          // Single level on-demand (N5, N4, N3, N2, or N1)
          const data = await vocabModule.loadVocabByLevel(selectedLevel);
          if (isMounted) {
            setVocabData(data);
            setTabLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load vocab for level', err);
        if (isMounted) setTabLoading(false);
      }
    };
    fetchVocabForLevel();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedLevel]);

  // Background prefetch for instant tab switching when idle
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (kanjiData.length === 0) {
          const m = await import('../../data/jlptKanjiDatabase');
          setKanjiData(m.JLPT_KANJI_DATABASE);
        }
      } catch {
        // Non-blocking prefetch
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [kanjiData.length]);

  // Stroke Modal State
  const [strokeModalKanji, setStrokeModalKanji] = useState<JlptKanjiItem | null>(null);

  // Saved Flashcard Items Notification State
  const [savedCardIds, setSavedCardIds] = useState<string[]>([]);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [missedQuizQuestions, setMissedQuizQuestions] = useState<JlptGrammarQuestion[]>([]);
  const [quizFlashcardsSaved, setQuizFlashcardsSaved] = useState(false);
  const [quizMode, setQuizMode] = useState<'standard' | 'sentence_order'>('standard');
  const [soIndex, setSoIndex] = useState(0);

  const soQuestions = useMemo(() => {
    if (selectedLevel === 'ALL') return SENTENCE_ORDERING_QUESTIONS;
    return SENTENCE_ORDERING_QUESTIONS.filter((q) => q.level === selectedLevel);
  }, [selectedLevel]);

  // Merge databases (loaded dynamically) + Admin Custom Content
  const baseGrammar: JlptGrammarItem[] = grammarData;
  const baseKanji: JlptKanjiItem[] = kanjiData;
  const baseVocab: JlptVocabItem[] = vocabData;

  const grammarSource = useMemo(
    () => CustomContentService.mergeGrammar(baseGrammar),
    [baseGrammar],
  );
  const kanjiSource = useMemo(() => CustomContentService.mergeKanji(baseKanji), [baseKanji]);
  const vocabSource = useMemo(() => CustomContentService.mergeVocab(baseVocab), [baseVocab]);
  const quizSource = useMemo(
    () => CustomContentService.mergeQuizQuestions(grammarQuestions),
    [grammarQuestions],
  );

  // Progressive display pagination state (36 cards initial paint for 60fps responsiveness)
  const [vocabDisplayCount, setVocabDisplayCount] = useState(36);
  const [kanjiDisplayCount, setKanjiDisplayCount] = useState(36);

  // Reset pagination on filter or tab change
  useEffect(() => {
    setVocabDisplayCount(36);
    setKanjiDisplayCount(36);
  }, [activeTab, selectedLevel, searchQuery, statusFilter]);

  // Filter Grammar Items (Memoized)
  const filteredGrammar = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return grammarSource.filter((item) => {
      const matchesLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      if (!matchesLevel) return false;
      const itemStatus = getItemStatus(item.id);
      const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.meaningUz.toLowerCase().includes(query) ||
        item.romaji.toLowerCase().includes(query)
      );
    });
  }, [grammarSource, selectedLevel, searchQuery, statusFilter, getItemStatus]);

  // Filter Kanji Items (Memoized)
  const filteredKanji = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return kanjiSource.filter((item) => {
      const matchesLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      if (!matchesLevel) return false;
      const itemStatus = getItemStatus(item.id);
      const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        item.kanji.includes(query) ||
        item.meaningUz.toLowerCase().includes(query) ||
        item.onyomi.toLowerCase().includes(query) ||
        item.kunyomi.toLowerCase().includes(query)
      );
    });
  }, [kanjiSource, selectedLevel, searchQuery, statusFilter, getItemStatus]);

  // Filter Vocab Items (Memoized)
  const filteredVocab = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vocabSource.filter((item) => {
      const matchesLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      if (!matchesLevel) return false;
      const itemStatus = getItemStatus(item.id);
      const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        item.word.toLowerCase().includes(query) ||
        item.reading.toLowerCase().includes(query) ||
        item.romaji.toLowerCase().includes(query) ||
        item.meaningUz.toLowerCase().includes(query)
      );
    });
  }, [vocabSource, selectedLevel, searchQuery, statusFilter, getItemStatus]);

  // Progressive slices for silky-smooth rendering
  const visibleVocab = useMemo(
    () => filteredVocab.slice(0, vocabDisplayCount),
    [filteredVocab, vocabDisplayCount],
  );

  const visibleKanji = useMemo(
    () => filteredKanji.slice(0, kanjiDisplayCount),
    [filteredKanji, kanjiDisplayCount],
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const handlePlayAudio = (text: string) => {
    haptics.impact('light');
    speakText(text, 'ja-JP');
  };

  // Direct Export to Flashcards
  const handleExportToFlashcard = async (
    item: JlptGrammarItem | JlptKanjiItem | JlptVocabItem,
    type: 'grammar' | 'kanji' | 'vocab',
  ) => {
    haptics.notification('success');
    const subjectId = await getOrEnsureLanguageSubject(subjects, addSubject, 'ja');

    let frontText = '';
    let backText = '';

    if (type === 'grammar') {
      const g = item as JlptGrammarItem;
      frontText = `[${g.level} Grammar] ${g.title}\nStruktura: ${g.structure}`;
      backText = `🇺🇿 Ma'nosi: ${g.meaningUz}\n\nMisol:\n${g.examples[0]?.ja || ''}\n(${g.examples[0]?.romaji || ''})\n${g.examples[0]?.uz || ''}`;
    } else if (type === 'kanji') {
      const k = item as JlptKanjiItem;
      frontText = `[${k.level} Kanji] ${k.kanji}`;
      backText = `Onyomi: ${k.onyomi}\nKunyomi: ${k.kunyomi}\n\nMa'nosi: ${k.meaningUz}\n\nMisol: ${k.examples[0]?.word || ''} (${k.examples[0]?.reading || ''}) — ${k.examples[0]?.meaning || ''}`;
    } else {
      const v = item as JlptVocabItem;
      frontText = `[${v.level} Goi] ${v.word} (${v.reading})\n${v.romaji}`;
      backText = `🇺🇿 Ma'nosi: ${v.meaningUz}${v.partOfSpeech ? `\nTurkum: ${v.partOfSpeech}` : ''}\n\nMisol:\n${v.examples[0]?.ja || ''}\n(${v.examples[0]?.romaji || ''})\n${v.examples[0]?.uz || ''}`;
    }

    await addFlashcardsBatch([
      {
        subjectId,
        front: frontText,
        back: backText,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
      },
    ]);

    setSavedCardIds((prev) => [...prev, item.id]);
  };

  // Calculate level stats
  const currentActiveList =
    activeTab === 'grammar' ? grammarSource : activeTab === 'kanji' ? kanjiSource : vocabSource;
  const currentLevelItems =
    selectedLevel === 'ALL'
      ? currentActiveList
      : currentActiveList.filter((i) => i.level === selectedLevel);
  const levelStats = getStatsForLevel(currentLevelItems);

  const quizQuestions: JlptGrammarQuestion[] =
    selectedLevel === 'ALL' ? quizSource : quizSource.filter((q) => q.level === selectedLevel);

  const handleAnswerQuiz = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const currentQ = quizQuestions[quizIndex];
    if (index === currentQ.correctAnswer) {
      haptics.notification('success');
      setScore((prev) => prev + 1);
      setItemStatus(`jlpt_${currentQ.level}_${currentQ.id}`, 'mastered');
    } else {
      haptics.notification('warning');
      setMissedQuizQuestions((prev) => [...prev, currentQ]);
      setItemStatus(`jlpt_${currentQ.level}_${currentQ.id}`, 'hard');
    }
  };

  const handleNextQuiz = async () => {
    haptics.selection();
    setSelectedOption(null);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
      haptics.notification('success');
      try {
        if (awardXP && score > 0) {
          awardXP(score * 20);
        }
        if (addSession) {
          const quizSubjectId = await getOrEnsureLanguageSubject(subjects, addSubject, 'ja');
          addSession({
            duration: Math.max(3, Math.round(quizQuestions.length * 1.5)),
            type: 'focus',
            completed: true,
            subjectId: quizSubjectId || undefined,
            startTime: new Date().toISOString(),
          });
        }
        HistoryService.saveMockExam({
          examType: 'jlpt',
          level: selectedLevel === 'ALL' ? 'N3' : selectedLevel,
          score,
          totalQuestions: quizQuestions.length,
          bandScore: Math.round((score / (quizQuestions.length || 1)) * 180),
        });

        // Log to ActivityLoggingService
        ActivityLoggingService.logActivity(
          {
            activityType: 'quiz',
            activityTitle: `JLPT Grammatika Sinovi (${selectedLevel === 'ALL' ? 'Aralash' : selectedLevel})`,
            durationMinutes: Math.max(3, Math.round(quizQuestions.length * 1.5)),
            itemsCount: quizQuestions.length,
            xpEarned: 0, // already awarded via awardXP above
            metadata: {
              score,
              totalQuestions: quizQuestions.length,
              level: selectedLevel,
              bandScore: Math.round((score / (quizQuestions.length || 1)) * 180),
            },
          },
          user?.id,
        ).catch((err) => console.warn('[JlptGrammarMaster] Activity logging warning:', err));

        if (missedQuizQuestions.length > 0) {
          MistakeVaultService.recordBatch(
            missedQuizQuestions.map((q) => ({
              userId: user?.id,
              source: 'quiz',
              level: (q.level || 'N3') as MistakeLevel,
              category: 'grammar',
              title: `[JLPT ${q.level}] ${q.pattern}`,
              questionText: q.questionText,
              options: q.options,
              userAnswer: -1,
              correctAnswer: q.correctAnswer,
              explanationUzbek: q.explanationUzbek || '',
            })),
            user?.id,
          );
        }
      } catch (e) {
        console.warn('Failed to save JLPT quiz score:', e);
      }
    }
  };

  const handleCreateFlashcardsFromMistakes = async () => {
    if (missedQuizQuestions.length === 0 || quizFlashcardsSaved) return;
    haptics.notification('success');
    const subjectId = await getOrEnsureLanguageSubject(subjects, addSubject, 'ja');
    const cards = missedQuizQuestions.map((q) => ({
      subjectId,
      front: `[JLPT ${q.level} Grammar] ${q.pattern}\n\n${q.questionText}`,
      back: `To'g'ri javob: ${q.options[q.correctAnswer]}\n\n🇺🇿 Tahlil: ${q.explanationUzbek}`,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    }));
    await addFlashcardsBatch(cards);
    setQuizFlashcardsSaved(true);
  };

  const resetQuiz = () => {
    haptics.impact('light');
    setQuizIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsQuizCompleted(false);
    setMissedQuizQuestions([]);
    setQuizFlashcardsSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner — Sumi-e & Hanko */}
      <div className="relative max-w-full overflow-hidden rounded-2xl border border-border bg-card p-2.5 shadow-xs sm:p-4 md:rounded-3xl md:p-8">
        {/* Desktop Top Header Info */}
        <div className="hidden flex-col justify-between gap-6 md:flex md:flex-row md:items-center">
          <div>
            <div className="badge-gold mb-3">
              <Sparkles className="h-3.5 w-3.5" />{' '}
              {language === 'ja'
                ? 'こうしき きょうかしょ＆テストの データベース'
                : 'Rasmiy Darsliklar & Imtihonlar Bazasi'}
            </div>
            <h1 className="flex items-center gap-3 font-display text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {language === 'ja'
                ? 'JLPT ぶんぽう・かんじ・ごい マスター'
                : 'JLPT Grammar, Kanji & Goi Master'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {language === 'ja'
                ? 'N5〜N1の こうしき ぶんぽう、かんじ、ごい。かきじゅん アニメーション、ふりがな ひょうじ、ワンクリックで たんごちょうへ ほぞんできます！'
                : "N5-N1 rasmiy darsliklar va imtihonlar bazasi. Kanji Stroke Order animatsiyalari, Goi lug'at boyligi, Furigana o'qilishlari hamda 1-Bosing bilan Flashcards eksporti!"}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3.5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {language === 'ja' ? '学習データ数' : 'Baza hajmi'}
              </div>
              <div className="flex items-center gap-1.5 text-lg font-black text-foreground">
                <span>
                  {grammarSource.length} {language === 'ja' ? '文法項目' : 'Qoida'}
                </span>{' '}
                •{' '}
                <span className="text-rose-600 dark:text-rose-400">
                  {kanjiSource.length} {language === 'ja' ? '漢字' : 'Kanji'}
                </span>{' '}
                •{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {vocabSource.length} {language === 'ja' ? '語彙' : 'Goi'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="scrollbar-none flex touch-pan-x items-center gap-1.5 overflow-x-auto md:mt-6 md:border-t md:border-border md:pt-4">
          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('grammar');
            }}
            className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 ${
              activeTab === 'grammar'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>
              {language === 'ja'
                ? `文法マスター (${grammarSource.length})`
                : `Grammatika (${grammarSource.length})`}
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('kanji');
            }}
            className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 ${
              activeTab === 'kanji'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>
              {language === 'ja' ? `漢字 (${kanjiSource.length})` : `Kanji (${kanjiSource.length})`}
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('goi');
            }}
            className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 ${
              activeTab === 'goi'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>
              {language === 'ja' ? `語彙 (${vocabSource.length})` : `Goi (${vocabSource.length})`}
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('quiz');
              setQuizIndex(0);
              setSelectedOption(null);
              setScore(0);
              setIsQuizCompleted(false);
            }}
            className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 ${
              activeTab === 'quiz'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>
              {language === 'ja'
                ? `テスト (${quizSource.length})`
                : `Test Banki (${quizSource.length})`}
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('confusing');
            }}
            className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 ${
              activeTab === 'confusing'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{language === 'ja' ? '類似漢字' : "O'xshash Kanjilar"}</span>
          </button>
        </div>
      </div>

      {/* Level & Search Controls (for Grammar & Kanji & Goi) */}
      {activeTab !== 'quiz' && activeTab !== 'confusing' && (
        <div className="max-w-full space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            {/* Level Pills */}
            <div className="scrollbar-none flex max-w-full touch-pan-x items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    haptics.selection();
                    setSelectedLevel(lvl);
                  }}
                  className={`shrink-0 cursor-pointer touch-manipulation select-none whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    selectedLevel === lvl
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {lvl === 'ALL' ? (language === 'ja' ? 'すべて' : 'BARCHASI') : lvl}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'grammar'
                    ? language === 'ja'
                      ? '文法・キーワード・意味で検索...'
                      : 'Grammatika, romaji yoki uzbekcha izlash...'
                    : activeTab === 'kanji'
                      ? language === 'ja'
                        ? '漢字・読み方・意味で検索...'
                        : "Kanji iyeroglif, o'qilishi yoki ma'nosi..."
                      : language === 'ja'
                        ? '単語・読み方・意味で検索...'
                        : "So'z, romaji yoki uzbekcha ma'nosi..."
                }
                className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Mastery Filter & Progress Bar */}
          <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 md:flex-row md:items-center">
            {/* Status Filter buttons */}
            <div className="flex max-w-full flex-wrap items-center gap-1.5 text-xs">
              <span className="mr-1 shrink-0 font-medium text-muted-foreground">
                {language === 'ja' ? '習得状況:' : 'Holat:'}
              </span>
              {(['ALL', 'mastered', 'learned', 'hard', 'unlearned'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL'
                    ? language === 'ja'
                      ? 'すべて'
                      : 'Barchasi'
                    : st === 'mastered'
                      ? language === 'ja'
                        ? '✓ 習得済み'
                        : ' Mustahkamlandi'
                      : st === 'learned'
                        ? language === 'ja'
                          ? '📖 学習中'
                          : " O'rganildi"
                        : st === 'hard'
                          ? language === 'ja'
                            ? '⚡ 苦手・復習'
                            : ' Qiyin'
                          : language === 'ja'
                            ? '✨ 未学習'
                            : ' Yangi'}
                </button>
              ))}
            </div>

            {/* Progress Bar Widget */}
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {language === 'ja' ? '進捗率' : 'Progress'} (
                {selectedLevel === 'ALL' && language === 'ja' ? 'すべて' : selectedLevel}):{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {levelStats.percentage}%
                </span>{' '}
                ({levelStats.mastered + levelStats.learned}/{levelStats.total})
              </div>
              <div className="h-2.5 w-32 overflow-hidden rounded-full border border-border bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${levelStats.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: GRAMMAR LIST */}
      {activeTab === 'grammar' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredGrammar.map((item) => {
            const status = getItemStatus(item.id);
            const isExported = savedCardIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/40 sm:p-5"
              >
                <div>
                  {/* Level Badge & Audio */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      {item.level}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePlayAudio(item.title)}
                        className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Yaponcha talaffuz"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExportToFlashcard(item, 'grammar')}
                        className={`rounded-xl border p-2 transition ${
                          isExported
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Flashcards'ga saqlash"
                      >
                        {isExported ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Rule Title & Furigana */}
                  <h3 className="font-japanese mb-1.5 text-xl font-bold tracking-tight text-foreground transition group-hover:text-primary sm:text-2xl">
                    <FuriganaText text={item.title} />
                  </h3>
                  <div className="mb-2 font-mono text-xs text-amber-600 dark:text-amber-400">
                    {item.romaji}
                  </div>

                  {/* Structure & Uzbek Meaning */}
                  <div className="mb-3 space-y-1 rounded-xl border border-border bg-muted/30 p-2.5">
                    <div className="text-xs font-semibold text-foreground">
                      <span className="text-rose-600 dark:text-rose-400">Formula:</span>{' '}
                      {item.structure}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-emerald-600 dark:text-emerald-400">🇺🇿 Ma'nosi:</span>{' '}
                      {item.meaningUz}
                    </div>
                  </div>

                  {/* Example Sentences */}
                  {item.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="mb-2.5 space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3 sm:p-3.5"
                    >
                      <div className="font-japanese flex items-start justify-between gap-2 text-base font-medium leading-relaxed text-foreground sm:text-lg">
                        <span className="flex-1">
                          <FuriganaText text={ex.ja} />
                        </span>
                        <button
                          onClick={() => handlePlayAudio(ex.ja)}
                          className="mt-0.5 shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Tinglash"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-xs italic text-muted-foreground">{ex.romaji}</div>
                      <div className="text-xs text-foreground/90 sm:text-sm">{ex.uz}</div>
                    </div>
                  ))}
                </div>

                {/* Status Toggle Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                  <span className="shrink-0 text-muted-foreground">
                    {language === 'ja' ? 'おぼえかた:' : 'Mustahkamlash:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setItemStatus(item.id, 'hard')}
                      className={`rounded-lg border px-2 py-1 transition ${
                        status === 'hard'
                          ? 'border-rose-500/30 bg-rose-500/15 font-bold text-rose-600 dark:text-rose-400'
                          : 'border-border bg-muted/30 text-muted-foreground hover:text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {language === 'ja' ? 'むずかしい 🔴' : 'Qiyin 🔴'}
                    </button>
                    <button
                      onClick={() => setItemStatus(item.id, 'learned')}
                      className={`rounded-lg border px-2 py-1 transition ${
                        status === 'learned'
                          ? 'border-emerald-500/30 bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'border-border bg-muted/30 text-muted-foreground hover:text-emerald-600'
                      }`}
                    >
                      {language === 'ja' ? 'がくしゅうずみ 🟢' : "O'rganildi 🟢"}
                    </button>
                    <button
                      onClick={() => setItemStatus(item.id, 'mastered')}
                      className={`rounded-lg border px-2 py-1 transition ${
                        status === 'mastered'
                          ? 'border-amber-500/30 bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                          : 'border-border bg-muted/30 text-muted-foreground hover:text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {language === 'ja' ? 'おぼえた ⚡' : 'Mukammal ⚡'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: KANJI LIST */}
      {activeTab === 'kanji' && tabLoading && (
        <div className="flex flex-col items-center justify-center space-y-3 p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {language === 'ja' ? '漢字データを読み込んでいます...' : 'Kanji bazasi yuklanmoqda...'}
          </p>
        </div>
      )}
      {activeTab === 'kanji' && !tabLoading && filteredKanji.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">
            {language === 'ja'
              ? '一致する漢字が見つかりませんでした'
              : "Qidiruv bo'yicha mos keluvchi kanji topilmadi"}
          </p>
        </div>
      )}
      {activeTab === 'kanji' && !tabLoading && filteredKanji.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleKanji.map((item) => {
              const status = getItemStatus(item.id);
              const isExported = savedCardIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/40 sm:p-5"
                >
                  <div>
                    {/* Level Badge & Actions */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        {item.level} • {item.strokeCount} {language === 'ja' ? 'かく' : 'chiziq'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePlayAudio(item.kanji)}
                          className="rounded-xl border border-border bg-muted/60 p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title={language === 'ja' ? 'おんせい' : 'Talaffuz'}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            haptics.selection();
                            setStrokeModalKanji(item);
                          }}
                          className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
                          title="Stroke Order Animation"
                        >
                          <Play className="h-3.5 w-3.5" />{' '}
                          {language === 'ja' ? 'かきじゅん' : 'Chizish'}
                        </button>
                        <button
                          onClick={() => handleExportToFlashcard(item, 'kanji')}
                          className={`rounded-xl border p-1.5 transition ${
                            isExported
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={
                            language === 'ja' ? 'たんごカードへ ほぞん' : "Flashcards'ga saqlash"
                          }
                        >
                          {isExported ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Kanji Large Render */}
                    <div className="mb-4 flex items-center gap-4">
                      <div
                        onClick={() => setStrokeModalKanji(item)}
                        className="font-japanese flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted/40 text-4xl font-black text-rose-600 shadow-inner transition hover:scale-105 dark:text-rose-400"
                      >
                        {item.kanji}
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-bold text-foreground">{item.meaningUz}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-bold text-amber-600 dark:text-amber-400">On:</span>{' '}
                          {item.onyomi}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Kun:
                          </span>{' '}
                          {item.kunyomi}
                        </div>
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3">
                      {item.examples.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-japanese font-semibold text-foreground">
                            {ex.word} ({ex.reading})
                          </span>
                          <span className="text-muted-foreground">{ex.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                    <span className="shrink-0 text-muted-foreground">
                      {language === 'ja' ? 'じょうたい:' : 'Holat:'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setItemStatus(item.id, 'hard')}
                        className={`rounded-lg border px-2 py-0.5 transition ${
                          status === 'hard'
                            ? 'border-rose-500/30 bg-rose-500/15 font-bold text-rose-600 dark:text-rose-400'
                            : 'border-border bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {language === 'ja' ? 'むずかしい 🔴' : 'Qiyin 🔴'}
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, 'mastered')}
                        className={`rounded-lg border px-2 py-0.5 transition ${
                          status === 'mastered'
                            ? 'border-amber-500/30 bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                            : 'border-border bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {language === 'ja' ? 'おぼえた ⚡' : 'Mukammal ⚡'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleKanji.length < filteredKanji.length && (
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
              <button
                onClick={() =>
                  setKanjiDisplayCount((prev) => Math.min(prev + 36, filteredKanji.length))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:bg-muted/50"
              >
                <span>{language === 'ja' ? 'さらに読み込む (+36)' : "Ko'proq yuklash (+36)"}</span>
              </button>
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? `${visibleKanji.length} / ${filteredKanji.length} 件を表示中`
                  : `${visibleKanji.length} / ${filteredKanji.length} ta kanji ko'rsatilmoqda`}
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 3: GOI (VOCABULARY) LIST */}
      {activeTab === 'goi' && tabLoading && (
        <div className="flex flex-col items-center justify-center space-y-3 p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {language === 'ja' ? '語彙データを読み込んでいます...' : "Lug'at bazasi yuklanmoqda..."}
          </p>
        </div>
      )}
      {activeTab === 'goi' && !tabLoading && filteredVocab.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">
            {language === 'ja'
              ? '一致する語彙が見つかりませんでした'
              : "Qidiruv bo'yicha mos keluvchi so'z topilmadi"}
          </p>
        </div>
      )}
      {activeTab === 'goi' && !tabLoading && filteredVocab.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVocab.map((item) => {
              const status = getItemStatus(item.id);
              const isExported = savedCardIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/40"
                >
                  <div>
                    {/* Level Badge & Actions */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.level}
                        </span>
                        {item.partOfSpeech && (
                          <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePlayAudio(item.reading || item.word)}
                          className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title={language === 'ja' ? 'おんせい' : 'Talaffuz'}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExportToFlashcard(item, 'vocab')}
                          className={`rounded-xl border p-2 transition ${
                            isExported
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={
                            language === 'ja' ? 'たんごカードへ ほぞん' : "Flashcards'ga saqlash"
                          }
                        >
                          {isExported ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Word & Furigana */}
                    <h3 className="font-japanese mb-1 text-2xl font-bold tracking-tight text-foreground transition group-hover:text-primary">
                      <FuriganaText
                        text={
                          item.word !== item.reading && !item.word.includes('[')
                            ? `${item.word}[${item.reading}]`
                            : item.word
                        }
                      />
                    </h3>
                    <div className="mb-2 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {item.romaji}
                    </div>

                    {/* Meaning */}
                    <div className="mb-3 space-y-1 rounded-xl border border-border bg-muted/30 p-2.5">
                      <div className="text-xs font-semibold text-foreground">
                        <span className="text-emerald-600 dark:text-emerald-400">🇺🇿 Ma'nosi:</span>{' '}
                        {item.meaningUz}
                      </div>
                    </div>

                    {/* Examples */}
                    {item.examples && item.examples.length > 0 && (
                      <div className="space-y-1.5">
                        {item.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3"
                          >
                            <div className="font-japanese flex items-start justify-between gap-2 text-sm font-medium leading-relaxed text-foreground sm:text-base">
                              <span className="flex-1">
                                <FuriganaText text={ex.ja} />
                              </span>
                              <button
                                onClick={() => handlePlayAudio(ex.ja)}
                                className="mt-0.5 shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                title="Tinglash"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {ex.romaji && (
                              <div className="text-[11px] italic text-muted-foreground">
                                {ex.romaji}
                              </div>
                            )}
                            <div className="text-xs text-foreground/90">{ex.uz}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                    <span className="shrink-0 text-muted-foreground">
                      {language === 'ja' ? 'おぼえかた:' : 'Mustahkamlash:'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setItemStatus(item.id, 'hard')}
                        className={`rounded-lg border px-2 py-1 transition ${
                          status === 'hard'
                            ? 'border-rose-500/30 bg-rose-500/15 font-bold text-rose-600 dark:text-rose-400'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {language === 'ja' ? 'むずかしい 🔴' : 'Qiyin 🔴'}
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, 'learned')}
                        className={`rounded-lg border px-2 py-1 transition ${
                          status === 'learned'
                            ? 'border-emerald-500/30 bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-emerald-600'
                        }`}
                      >
                        {language === 'ja' ? 'がくしゅうずみ 🟢' : "O'rganildi 🟢"}
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, 'mastered')}
                        className={`rounded-lg border px-2 py-1 transition ${
                          status === 'mastered'
                            ? 'border-amber-500/30 bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {language === 'ja' ? 'おぼえた ⚡' : 'Mukammal ⚡'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleVocab.length < filteredVocab.length && (
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
              <button
                onClick={() =>
                  setVocabDisplayCount((prev) => Math.min(prev + 36, filteredVocab.length))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:bg-muted/50"
              >
                <span>{language === 'ja' ? 'さらに読み込む (+36)' : "Ko'proq yuklash (+36)"}</span>
              </button>
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? `${visibleVocab.length} / ${filteredVocab.length} 件を表示中`
                  : `${visibleVocab.length} / ${filteredVocab.length} ta so'z ko'rsatilmoqda`}
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 4: QUIZ MODE */}
      {activeTab === 'quiz' && tabLoading && (
        <div className="flex flex-col items-center justify-center space-y-3 p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {language === 'ja'
              ? 'クイズデータを読み込んでいます...'
              : 'Test savollari yuklanmoqda...'}
          </p>
        </div>
      )}
      {activeTab === 'quiz' && !tabLoading && (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Sub-mode Switcher: Standard Quiz vs Sentence Ordering */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setQuizMode('standard');
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  quizMode === 'standard'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📝 Standart Test
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setQuizMode('sentence_order');
                  setSoIndex(0);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  quizMode === 'sentence_order'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-current" /> ★ Gap tartibi (文の組み立て)
              </button>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {quizMode === 'standard'
                ? `Jami: ${quizQuestions.length} ta savol`
                : `Jami: ${soQuestions.length} ta savol`}
            </span>
          </div>

          {/* Level Switcher for Quiz */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-3 shadow-xs">
            <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => {
                const count =
                  quizMode === 'standard'
                    ? lvl === 'ALL'
                      ? quizSource.length
                      : quizSource.filter((q) => q.level === lvl).length
                    : lvl === 'ALL'
                      ? SENTENCE_ORDERING_QUESTIONS.length
                      : SENTENCE_ORDERING_QUESTIONS.filter((q) => q.level === lvl).length;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      haptics.selection();
                      setSelectedLevel(lvl);
                      setQuizIndex(0);
                      setSoIndex(0);
                      setSelectedOption(null);
                      setScore(0);
                      setIsQuizCompleted(false);
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      selectedLevel === lvl
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'border border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {lvl === 'ALL' ? (language === 'ja' ? 'すべて' : 'BARCHASI') : lvl} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {quizMode === 'sentence_order' ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs md:p-8">
              {soQuestions.length === 0 ? (
                <div className="space-y-3 py-10 text-center">
                  <div className="text-3xl">⭐</div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedLevel} darajasida gap tartibi savollari mavjud emas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Iltimos, boshqa darajani tanlang yoki Barchasi (ALL) tugmasini bosing.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>
                      Savol {soIndex + 1} / {soQuestions.length} ({soQuestions[soIndex]?.level})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={soIndex === 0}
                        onClick={() => {
                          haptics.selection();
                          setSoIndex((prev) => Math.max(0, prev - 1));
                        }}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold hover:bg-muted disabled:opacity-40"
                      >
                        ← Oldingi
                      </button>
                      <button
                        type="button"
                        disabled={soIndex >= soQuestions.length - 1}
                        onClick={() => {
                          haptics.selection();
                          setSoIndex((prev) => Math.min(soQuestions.length - 1, prev + 1));
                        }}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold hover:bg-muted disabled:opacity-40"
                      >
                        Keyingi →
                      </button>
                    </div>
                  </div>

                  <SentenceOrderingQuestion
                    key={soQuestions[soIndex].id}
                    question={soQuestions[soIndex]}
                    onNext={() => {
                      if (soIndex + 1 < soQuestions.length) {
                        setSoIndex((prev) => prev + 1);
                      } else {
                        setSoIndex(0);
                      }
                    }}
                    onComplete={(isCorrect) => {
                      if (isCorrect) {
                        awardXP(25);
                        ActivityLoggingService.logActivity(
                          {
                            activityType: 'quiz',
                            activityTitle: `JLPT Gap Tartibi (★) - ${soQuestions[soIndex]?.level || 'N3'}`,
                            durationMinutes: 2,
                            itemsCount: 1,
                            xpEarned: 0,
                            metadata: {
                              questionId: soQuestions[soIndex]?.id,
                              level: soQuestions[soIndex]?.level,
                              isCorrect: true,
                            },
                          },
                          user?.id,
                        ).catch((err) =>
                          console.warn('[JlptGrammarMaster] Activity logging warning:', err),
                        );
                      } else {
                        const curQ = soQuestions[soIndex];
                        if (curQ) {
                          MistakeVaultService.recordMistake(
                            {
                              userId: user?.id,
                              source: 'sentence_order',
                              level: (curQ.level || 'N3') as MistakeLevel,
                              category: 'grammar',
                              title: `★ Gap tartibini tuzish (${curQ.level})`,
                              questionText: `${curQ.prefix} [1] [2] [3] [4] ${curQ.suffix}`,
                              options: curQ.fragments,
                              userAnswer: 'Noto‘g‘ri tartib',
                              correctAnswer: curQ.starPosition,
                              explanationUzbek:
                                curQ.explanationUzbek ||
                                `To'g'ri tartib: ${curQ.correctOrder.map((i) => curQ.fragments[i]).join(' ')}`,
                            },
                            user?.id,
                          );
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs md:p-8">
              {quizQuestions.length === 0 ? (
                <div className="space-y-3 py-10 text-center">
                  <div className="text-3xl">📭</div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedLevel} darajasida hali test savollari yo‘q
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Admin paneldagi <strong>Test & Savollar</strong> bo‘limi orqali yangi test
                    savollarini qo‘shishingiz mumkin.
                  </p>
                </div>
              ) : !isQuizCompleted ? (
                <>
                  <div className="flex items-center justify-between border-b border-border pb-3 text-xs font-semibold text-muted-foreground">
                    <span>
                      Savol {quizIndex + 1} / {quizQuestions.length} (
                      {quizQuestions[quizIndex]?.level})
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      Joriy Ball: {score}
                    </span>
                  </div>

                  <h3 className="font-japanese text-lg font-bold leading-relaxed text-foreground sm:text-xl">
                    <span className="mr-2 font-mono font-bold text-primary">
                      問{quizIndex + 1}.
                    </span>
                    {quizQuestions[quizIndex]?.questionText}
                  </h3>

                  <div className="space-y-3">
                    {quizQuestions[quizIndex]?.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === quizQuestions[quizIndex].correctAnswer;

                      let btnClass =
                        'group w-full text-left p-4 rounded-2xl border text-sm sm:text-base font-medium transition-all flex items-center justify-between ';
                      let badgeClass =
                        'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border border-current/25 shrink-0 ';

                      if (selectedOption === null) {
                        btnClass +=
                          'bg-muted/30 border-border hover:border-primary/40 text-foreground';
                      } else if (isCorrect) {
                        btnClass +=
                          'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold';
                        badgeClass = 'bg-emerald-500 text-white border-transparent ';
                      } else if (isSelected) {
                        btnClass +=
                          'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold';
                        badgeClass = 'bg-rose-500 text-white border-transparent ';
                      } else {
                        btnClass += 'bg-muted/20 border-border text-muted-foreground opacity-60';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerQuiz(idx)}
                          className={btnClass}
                        >
                          <span className="flex items-center gap-3">
                            <span className={badgeClass}>{idx + 1}</span>
                            <span className="font-japanese text-sm font-medium leading-relaxed sm:text-base">
                              {opt}
                            </span>
                          </span>
                          {selectedOption !== null && isCorrect && (
                            <CheckCircle2 className="ml-2 h-5 w-5 shrink-0 text-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="animate-fadeIn space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="text-xs font-medium text-muted-foreground">
                        💡 <span className="font-bold text-foreground">Tushuntirish:</span>{' '}
                        {quizQuestions[quizIndex]?.explanationUzbek}
                      </div>
                      <button
                        onClick={handleNextQuiz}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                      >
                        Keyingi Savol <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-5 py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    🏆
                  </div>
                  <h3 className="font-display text-2xl font-black text-foreground">
                    Test Yakunlandi!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Siz {quizQuestions.length} ta savoldan{' '}
                    <span className="font-bold text-amber-600 dark:text-amber-400">{score} ta</span>{' '}
                    to'g'ri javob berdingiz. (+{score * 20} XP)
                  </p>

                  {missedQuizQuestions.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={handleCreateFlashcardsFromMistakes}
                        disabled={quizFlashcardsSaved}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold shadow-xs transition-all ${
                          quizFlashcardsSaved
                            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {quizFlashcardsSaved ? (
                          <>
                            <Check className="h-4 w-4" /> Xatolar Fleshkartalarga Qo'shildi!
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" /> {missedQuizQuestions.length} ta Xatolarni
                            Fleshkartaga Aylantirish (Anki SRS)
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={resetQuiz}
                      className="rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold text-foreground transition hover:bg-muted/80"
                    >
                      Qayta Boshlash
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confusing Kanji Comparison Tab */}
      {activeTab === 'confusing' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="border-3 h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
            </div>
          }
        >
          <div className="animate-in fade-in">
            <ConfusingKanjiComparator />
          </div>
        </Suspense>
      )}

      {/* Kanji Stroke Order Modal */}
      {strokeModalKanji && (
        <Suspense fallback={null}>
          <KanjiStrokeOrderModal
            kanji={strokeModalKanji.kanji}
            meaningUz={strokeModalKanji.meaningUz}
            onyomi={strokeModalKanji.onyomi}
            kunyomi={strokeModalKanji.kunyomi}
            strokeCount={strokeModalKanji.strokeCount}
            level={strokeModalKanji.level}
            isOpen={!!strokeModalKanji}
            onClose={() => setStrokeModalKanji(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default JlptGrammarKanjiMaster;
