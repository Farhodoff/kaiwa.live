import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Volume2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Search,
  BookOpen,
  GitCompare,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import {
  PitchAccentService,
  PitchAccentInfo,
  PitchType,
  MoraPitch,
} from '../../services/PitchAccentService';
import { speakText } from '../../utils/audioTts';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { DailyQuestService } from '../../services/DailyQuestService';
import { ActivityLoggingService } from '../../services/ActivityLoggingService';

interface PitchAccentTrainerProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardXP?: (amount: number) => Promise<void> | void;
}

type TrainerTab = 'types' | 'pairs' | 'quiz';

const TYPE_CONFIG: Record<
  PitchType,
  { name: string; kanji: string; badge: string; color: string; descUz: string; example: string }
> = {
  heiban: {
    name: 'Heiban (Tekis)',
    kanji: '平板型 ⓪',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    color: 'text-emerald-500',
    descUz:
      "1-bo'g'in past, 2-bo'g'in va keyingilari baland aytiladi. Eng asosiysi: gapda zarracha (が, は, を) qo'shilganda ham ohang tushmaydi, baland qoladi.",
    example: 'nihon (日本 ⓪), tomodachi (友達 ⓪), sakana (魚 ⓪)',
  },
  atamadaka: {
    name: 'Atamadaka (Boshida baland)',
    kanji: '頭高型 ①',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
    color: 'text-rose-500',
    descUz:
      "Faqat birinchi bo'g'in baland aytiladi va darhol pastga tushadi (accent drop). Barcha keyingi bo'g'inlar va qo'shiladigan zarrachalar past ohangda bo'ladi.",
    example: "hon (本 ①), ame (雨 ① - yomg'ir), inu (犬 ① - it)",
  },
  nakadaka: {
    name: "Nakadaka (O'rtada baland)",
    kanji: '中高型 ②/③',
    badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500',
    color: 'text-indigo-500',
    descUz:
      "1-bo'g'in past boshlanadi, so'zning o'rtasidagi ma'lum bir bo'g'inga kelib ko'tariladi va undan keyin yana pastga tushadi.",
    example: 'tamago (卵 ② - tuxum), hikouki (飛行機 ③ - samolyot)',
  },
  odaka: {
    name: 'Odaka (Oxirida baland)',
    kanji: '尾高型',
    badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500',
    color: 'text-cyan-500',
    descUz:
      "1-bo'g'in past, so'zning eng oxirgi bo'g'inigacha ko'tariladi. Lekin Heiban'dan farqli ravishda: orqasidan zarracha qo'shilsa, zarracha pastga tushadi.",
    example: "hana (花 ② - gul), hashi (橋 ② - ko'prik), otoko (男 ③ - erkak)",
  },
};

/**
 * Compact visual representation of Mora Pitch Steps
 */
const PitchCurveDisplay: React.FC<{ morae: MoraPitch[]; compact?: boolean }> = ({
  morae,
  compact = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-around rounded-xl border border-border/60 bg-muted/20 ${
        compact ? 'px-2 py-3' : 'px-3 py-5'
      }`}
    >
      {/* High/Low guide lines */}
      <div className="pointer-events-none absolute inset-x-3 top-3 border-b border-dashed border-primary/20" />
      <div className="pointer-events-none absolute inset-x-3 bottom-5 border-b border-dashed border-muted-foreground/20" />

      {morae.map((m, idx) => {
        const nextMora = morae[idx + 1];
        return (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            {/* Pitch Dot */}
            <div
              className={`flex items-center justify-center rounded-full font-black shadow-xs transition-all ${
                compact ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs'
              } ${
                m.isHigh
                  ? '-translate-y-2 border-2 border-primary bg-primary text-primary-foreground shadow-primary/30'
                  : 'translate-y-1 border-2 border-border bg-card text-muted-foreground'
              }`}
            >
              {m.isHigh ? 'H' : 'L'}
            </div>

            {/* Downstep drop marker */}
            {m.isDrop && (
              <div
                className={`absolute font-black text-rose-500 ${
                  compact ? '-top-4 text-[10px]' : '-top-5 text-xs'
                }`}
              >
                ▼
              </div>
            )}

            {/* Mora Character */}
            <div className={`flex flex-col items-center ${compact ? 'mt-2' : 'mt-3'}`}>
              <span className={`font-extrabold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                {m.mora}
              </span>
            </div>

            {/* Connecting line to next mora */}
            {nextMora && (
              <div
                className="pointer-events-none absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2 bg-primary/30"
                style={{
                  transform: `translateY(${m.isHigh ? '-8px' : '4px'}) rotate(${
                    m.isHigh && !nextMora.isHigh
                      ? '25deg'
                      : !m.isHigh && nextMora.isHigh
                        ? '-25deg'
                        : '0deg'
                  })`,
                  transformOrigin: 'left center',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const PitchAccentTrainer: React.FC<PitchAccentTrainerProps> = ({
  isOpen,
  onClose,
  onAwardXP,
}) => {
  const { haptics } = useTelegramWebApp();
  const [activeTab, setActiveTab] = useState<TrainerTab>('types');
  const [selectedType, setSelectedType] = useState<PitchType>('heiban');
  const [searchQuery, setSearchQuery] = useState('');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<PitchAccentInfo[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<PitchType | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Minimal pairs
  const minimalPairs = useMemo(() => PitchAccentService.getMinimalPairs(), []);

  // All dictionary words
  const allWords = useMemo(() => PitchAccentService.getAllDictionaryWords(), []);

  // Filtered words for types tab
  const filteredWords = useMemo(() => {
    let list = PitchAccentService.getWordsByPitchType(selectedType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          (w.kanji && w.kanji.toLowerCase().includes(q)) ||
          w.reading.toLowerCase().includes(q) ||
          w.romaji.toLowerCase().includes(q) ||
          (w.meaningUz && w.meaningUz.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [selectedType, searchQuery]);

  // Start new quiz round
  const startNewQuiz = () => {
    haptics.impact('medium');
    const items = PitchAccentService.getRandomPitchQuiz(5);
    setQuizQuestions(items);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setQuizScore(0);
    setIsQuizFinished(false);
    setXpAwarded(false);
  };

  useEffect(() => {
    if (isOpen && quizQuestions.length === 0) {
      startNewQuiz();
    }
  }, [isOpen]);

  const currentQuizItem = quizQuestions[quizIndex];

  const handleSelectAnswer = (type: PitchType) => {
    if (isAnswerRevealed || !currentQuizItem) return;
    setSelectedAnswer(type);
    setIsAnswerRevealed(true);
    const isCorrect = type === currentQuizItem.pitchType;
    if (isCorrect) {
      haptics.notification('success');
      setQuizScore((prev) => prev + 1);
    } else {
      haptics.notification('warning');
    }
  };

  const handleNextQuestion = async () => {
    if (quizIndex + 1 < quizQuestions.length) {
      haptics.selection();
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      setIsQuizFinished(true);
      haptics.notification('success');

      if (!xpAwarded && onAwardXP) {
        setXpAwarded(true);
        try {
          await onAwardXP(15);
        } catch {
          // Ignore XP award failure
        }
      }

      // Update Daily Quests & Gamification Meta
      try {
        DailyQuestService.incrementMetaCounter(undefined, 'pitchAccentPracticesCompleted', 1);
        DailyQuestService.recordQuestProgress('speaking', 1);
      } catch (e) {
        console.warn('[PitchAccentTrainer] DailyQuest error:', e);
      }

      // Record Activity in ActivityLoggingService
      try {
        await ActivityLoggingService.logActivity({
          activityType: 'speaking',
          activityTitle: "Pitch Accent Studio Mashg'uloti",
          durationMinutes: 3,
          itemsCount: quizQuestions.length,
          xpEarned: onAwardXP ? 0 : 15,
          metadata: {
            quizScore,
            totalQuestions: quizQuestions.length,
            accuracy: Math.round((quizScore / (quizQuestions.length || 1)) * 100),
          },
        });
      } catch (e) {
        console.warn('[PitchAccentTrainer] Activity logging error:', e);
      }
    }
  };

  const handlePlayTTS = (text: string) => {
    haptics.impact('light');
    speakText(text, 'ja-JP');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-md duration-200 animate-in fade-in sm:p-4">
      <div className="flex h-[92vh] max-h-[850px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl duration-200 animate-in zoom-in-95 2xl:max-w-5xl 3xl:max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/15 p-2 text-primary shadow-xs sm:p-2.5">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                  Pitch Accent Studio (アクセント・スタジオ)
                </h3>
                <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary sm:inline-flex">
                  Tokyo Standarti
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Yapon tilining baland va past ohanglari (4 ta asosiy qolip) va minimal juftliklar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Yopish"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/40 px-3 sm:px-5">
          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('types');
            }}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
              activeTab === 'types'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={16} />
            <span>4 Ohang Turlari</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
              {allWords.length} so'z
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('pairs');
            }}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
              activeTab === 'pairs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitCompare size={16} />
            <span>Minimal Juftliklar</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
              {minimalPairs.length} juft
            </span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('quiz');
            }}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
              activeTab === 'quiz'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Headphones size={16} />
            <span>Quloq Mashqi (Quiz)</span>
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-extrabold text-primary">
              +15 XP
            </span>
          </button>
        </div>

        {/* Tab 1: Types & Dictionary */}
        {activeTab === 'types' && (
          <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-4 sm:p-5">
            {/* Pitch Type Selector Chips */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(TYPE_CONFIG) as PitchType[]).map((type) => {
                const conf = TYPE_CONFIG[type];
                const count = PitchAccentService.getWordsByPitchType(type).length;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      haptics.selection();
                      setSelectedType(type);
                    }}
                    className={`flex cursor-pointer flex-col items-start rounded-2xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? `${conf.badge} border-primary shadow-sm ring-1 ring-primary/40`
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-xs font-black">{conf.kanji}</span>
                    <span className="w-full truncate text-[11px] font-bold text-foreground">
                      {conf.name}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold opacity-75">
                      {count} ta so'z
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation of Selected Pitch Type */}
            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-black text-foreground">
                <Sparkles size={14} className={TYPE_CONFIG[selectedType].color} />
                <span>{TYPE_CONFIG[selectedType].name} Qoidasi va Zarrachalar:</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {TYPE_CONFIG[selectedType].descUz}
              </p>
              <div className="pt-1 text-[11px] text-muted-foreground/90">
                <span className="font-bold text-foreground">Misollar: </span>
                {TYPE_CONFIG[selectedType].example}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ushbu turdagi so'zni qidiring (kanji, kana, uzbekcha)..."
                className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Words List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredWords.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Hech qanday so'z topilmadi.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filteredWords.map((item) => (
                    <div
                      key={item.word}
                      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-xs transition-all hover:border-primary/40"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-foreground">
                              {item.kanji || item.word}
                            </span>
                            <span className="text-xs font-bold text-primary">{item.reading}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              [{item.pitchPatternNumber}]
                            </span>
                          </div>
                          {item.meaningUz && (
                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                              {item.meaningUz}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handlePlayTTS(item.reading || item.word)}
                          className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 p-2 text-primary transition-all hover:bg-primary/20"
                          title="Talaffuzni tinglash"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>

                      {/* Mora Step Visualization */}
                      <PitchCurveDisplay morae={item.morae} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Minimal Pairs (Homophones) */}
        {activeTab === 'pairs' && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary">
                <Sparkles size={16} />
                <span>Minimal Juftliklar Nima Uchun Muhim?</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Yapon tilida bir xil o'qiladigan lekin pitch accent ohangi bilan butunlay boshqa
                ma'no beruvchi so'zlar ko'p. Masalan, <b>雨 (yomg'ir)</b> boshida baland bo'lsa,{' '}
                <b>飴 (shirinlik)</b> tekis aytiladi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {minimalPairs.map((pair) => {
                const info1 = PitchAccentService.getPitchAccent(pair.word1.kanji);
                const info2 = PitchAccentService.getPitchAccent(pair.word2.kanji);

                return (
                  <div
                    key={pair.id}
                    className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"
                  >
                    {/* Header reading */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          O'qilishi:
                        </span>
                        <span className="text-base font-black text-primary">{pair.reading}</span>
                      </div>
                      <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        Homofon Kontrasti
                      </span>
                    </div>

                    {/* Word 1 vs Word 2 Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Word 1 */}
                      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-black text-foreground">
                              {pair.word1.kanji}
                            </span>
                            <span className="ml-2 text-xs font-semibold text-muted-foreground">
                              {pair.word1.meaningUz}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePlayTTS(pair.word1.kanji)}
                            className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 p-2 text-primary hover:bg-primary/25"
                            title="Tinglash"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              TYPE_CONFIG[pair.word1.pitchType].badge
                            }`}
                          >
                            {TYPE_CONFIG[pair.word1.pitchType].kanji}
                          </span>
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {pair.word1.formula}
                          </span>
                        </div>
                        <PitchCurveDisplay morae={info1.morae} compact />
                      </div>

                      {/* Word 2 */}
                      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-black text-foreground">
                              {pair.word2.kanji}
                            </span>
                            <span className="ml-2 text-xs font-semibold text-muted-foreground">
                              {pair.word2.meaningUz}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePlayTTS(pair.word2.kanji)}
                            className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 p-2 text-primary hover:bg-primary/25"
                            title="Tinglash"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              TYPE_CONFIG[pair.word2.pitchType].badge
                            }`}
                          >
                            {TYPE_CONFIG[pair.word2.pitchType].kanji}
                          </span>
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {pair.word2.formula}
                          </span>
                        </div>
                        <PitchCurveDisplay morae={info2.morae} compact />
                      </div>
                    </div>

                    {/* Contrast note */}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs leading-relaxed text-muted-foreground">
                      💡 <b>Eslab qoling:</b> {pair.contrastExplanationUz}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Ear Quiz */}
        {activeTab === 'quiz' && (
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
            {!isQuizFinished && currentQuizItem ? (
              <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-between space-y-6">
                {/* Progress bar */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>
                      Savol {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <span className="font-black text-primary">Ball: {quizScore}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question Audio Card */}
                <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-border bg-muted/40 p-6 text-center sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Talaffuzni tinglang va qolipini toping:
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePlayTTS(currentQuizItem.reading || currentQuizItem.word)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/15 px-6 py-3.5 text-primary shadow-lg transition-all hover:scale-105 hover:bg-primary/25"
                  >
                    <Volume2 size={24} />
                    <span className="text-base font-black">Ovozni Tinglash</span>
                  </button>

                  <div className="pt-2">
                    <span className="text-3xl font-black tracking-wide text-foreground sm:text-4xl">
                      {currentQuizItem.kanji || currentQuizItem.word}
                    </span>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">
                      {currentQuizItem.reading} ({currentQuizItem.romaji})
                    </div>
                    {currentQuizItem.meaningUz && (
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        {currentQuizItem.meaningUz}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(TYPE_CONFIG) as PitchType[]).map((type) => {
                    const conf = TYPE_CONFIG[type];
                    const isSelected = selectedAnswer === type;
                    const isCorrect = currentQuizItem.pitchType === type;

                    let btnStyle = 'border-border bg-card hover:bg-muted/60 text-foreground';
                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-500/20 text-emerald-500 font-black';
                      } else if (isSelected) {
                        btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-500 font-bold';
                      } else {
                        btnStyle = 'border-border bg-card/40 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={type}
                        disabled={isAnswerRevealed}
                        onClick={() => handleSelectAnswer(type)}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all disabled:cursor-default ${btnStyle}`}
                      >
                        <span className="text-xs font-bold text-muted-foreground">
                          {conf.kanji}
                        </span>
                        <span className="mt-0.5 text-sm font-extrabold">{conf.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Revealed Answer & Next Button */}
                {isAnswerRevealed && (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-4 duration-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedAnswer === currentQuizItem.pitchType ? (
                          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
                            <CheckCircle2 size={18} />
                            <span>To'g'ri javob!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-black text-rose-500">
                            <XCircle size={18} />
                            <span>
                              Noto'g'ri. To'g'ri qolip:{' '}
                              {TYPE_CONFIG[currentQuizItem.pitchType].name}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleNextQuestion}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90"
                      >
                        <span>
                          {quizIndex + 1 < quizQuestions.length
                            ? 'Keyingi savol'
                            : "Natijani ko'rish"}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <PitchCurveDisplay morae={currentQuizItem.morae} compact />

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {currentQuizItem.ruleExplanationUz}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz Finished View */
              <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center space-y-5 text-center">
                <div className="rounded-full border-2 border-primary/30 bg-primary/10 p-4 text-primary shadow-xl">
                  <Award size={48} />
                </div>

                <div>
                  <h4 className="text-xl font-black text-foreground">Mashq Yakunlandi!</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    5 ta savoldan {quizScore} tasiga to'g'ri javob berdingiz.
                  </p>
                </div>

                {xpAwarded && (
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-extrabold text-amber-500">
                    <Sparkles size={16} />
                    <span>+15 XP tajriba bali berildi!</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={startNewQuiz}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
                  >
                    <RotateCcw size={16} />
                    <span>Yana sinab ko'rish</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="cursor-pointer rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PitchAccentTrainer;
