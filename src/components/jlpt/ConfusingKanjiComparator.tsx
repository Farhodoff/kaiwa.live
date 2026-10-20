import React, { useState, useMemo } from 'react';
import { Volume2, CheckCircle2, XCircle, Lightbulb, ArrowRight, Search } from 'lucide-react';
import { CONFUSING_KANJI_PAIRS } from '../../data/kanji/confusingKanjiDatabase';
import { useLanguage } from '../../context/LanguageContext';
import { speakJapaneseText } from '../../utils/audioTts';

export const ConfusingKanjiComparator: React.FC = () => {
  const { language } = useLanguage();
  const isJa = language === 'ja';

  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'study' | 'quiz'>('study');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const filteredPairs = useMemo(() => {
    return CONFUSING_KANJI_PAIRS.filter((p) => {
      const matchLvl = selectedLevel === 'ALL' || p.level === selectedLevel;
      const matchQuery =
        !searchQuery.trim() ||
        p.kanjiA.char.includes(searchQuery) ||
        p.kanjiB.char.includes(searchQuery) ||
        p.kanjiA.meaningUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kanjiB.meaningUz.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLvl && matchQuery;
    });
  }, [selectedLevel, searchQuery]);

  const currentQuizItem = filteredPairs[quizIndex] || filteredPairs[0];

  const handlePlayAudio = (text: string) => {
    speakJapaneseText(text);
  };

  const handleSelectAnswer = (char: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(char);
    setShowExplanation(true);
    if (char === currentQuizItem.practiceQuestion.correctChar) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex < filteredPairs.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Finished
      setQuizIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-lg font-black text-amber-500">
                ⛩️
              </span>
              <h3 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                {isJa ? '類似漢字・混同対策コンパレータ' : "Chalg'ituvchi Kanjilar Taqqosi"}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isJa
                ? '部首・意味・用例の違いを視覚的に比較し、試験での取りこぼしを防ぐ'
                : "Bir-biriga o'xshash kanjilarning radikallari, ma'nolari va birikmalarini taqqoslash"}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1">
            <button
              onClick={() => setActiveMode('study')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeMode === 'study'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📖 {isJa ? '学習' : "O'rganish"}
            </button>
            <button
              onClick={() => {
                setActiveMode('quiz');
                setQuizIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setQuizScore(0);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeMode === 'quiz'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚡ {isJa ? 'テスト' : 'Test'}
            </button>
          </div>
        </div>

        {/* Level Filters & Search */}
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedLevel(lvl);
                  setQuizIndex(0);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  selectedLevel === lvl
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder={isJa ? '漢字・意味で検索...' : "Kanji yoki ma'no..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* MODE 1: Study / Comparison Cards */}
      {activeMode === 'study' && (
        <div className="space-y-4">
          {filteredPairs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              Mos kanji juftliklari topilmadi.
            </div>
          ) : (
            filteredPairs.map((pair) => (
              <div
                key={pair.id}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs transition-all hover:border-primary/40"
              >
                {/* Pair Header Banner */}
                <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2.5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                      {pair.level}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      Taqqos: {pair.kanjiA.char} vs {pair.kanjiB.char}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    Radikallar: {pair.kanjiA.radical.split(' ')[0]} vs{' '}
                    {pair.kanjiB.radical.split(' ')[0]}
                  </span>
                </div>

                {/* Side by side comparison */}
                <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  {/* Kanji A */}
                  <div className="space-y-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-japanese text-4xl font-black text-foreground sm:text-5xl">
                          {pair.kanjiA.char}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {pair.kanjiA.meaningUz}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {pair.kanjiA.reading}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(pair.kanjiA.char)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>

                    <div className="space-y-1 rounded-xl border border-border bg-muted/20 p-2.5 text-xs">
                      <div className="font-bold text-foreground">
                        Radikal: <span className="text-primary">{pair.kanjiA.radical}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {pair.kanjiA.radicalMeaning}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Eng muhim birikmalar:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pair.kanjiA.commonCompounds.map((comp, idx) => (
                          <span
                            key={idx}
                            className="font-japanese rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold text-foreground"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Kanji B */}
                  <div className="space-y-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-japanese text-4xl font-black text-foreground sm:text-5xl">
                          {pair.kanjiB.char}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {pair.kanjiB.meaningUz}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {pair.kanjiB.reading}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(pair.kanjiB.char)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>

                    <div className="space-y-1 rounded-xl border border-border bg-muted/20 p-2.5 text-xs">
                      <div className="font-bold text-foreground">
                        Radikal: <span className="text-primary">{pair.kanjiB.radical}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {pair.kanjiB.radicalMeaning}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Eng muhim birikmalar:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pair.kanjiB.commonCompounds.map((comp, idx) => (
                          <span
                            key={idx}
                            className="font-japanese rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold text-foreground"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Difference & Mnemonic Footer */}
                <div className="border-t border-border bg-muted/10 p-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <div className="space-y-1 text-xs">
                      <div>
                        <strong className="text-foreground">Asosiy Farq: </strong>
                        <span className="text-muted-foreground">{pair.keyDifference.uz}</span>
                      </div>
                      <div>
                        <strong className="text-foreground">Eslab Qolish Qoidasi: </strong>
                        <span className="italic text-muted-foreground">"{pair.mnemonic.uz}"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODE 2: Discrimination & Dictation Quiz */}
      {activeMode === 'quiz' && currentQuizItem && (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                {currentQuizItem.level}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Savol {quizIndex + 1} / {filteredPairs.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                To'g'ri: {quizScore}
              </span>
              <button
                onClick={() => handlePlayAudio(currentQuizItem.practiceQuestion.sentence)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted active:scale-95"
              >
                <Volume2 size={14} />
                <span>Audioni tinglash</span>
              </button>
            </div>
          </div>

          {/* Question Sentence */}
          <div className="space-y-3 py-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nuqtalar o'rniga mos kanjini tanlang:
            </span>
            <div className="font-japanese text-2xl font-black text-foreground sm:text-3xl">
              {currentQuizItem.practiceQuestion.sentence}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {currentQuizItem.practiceQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQuizItem.practiceQuestion.correctChar;

              let btnCls = 'border-border bg-card text-foreground hover:border-primary/50';
              if (selectedAnswer !== null) {
                if (isCorrect) {
                  btnCls =
                    'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                } else if (isSelected) {
                  btnCls = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400';
                } else {
                  btnCls = 'border-border bg-muted/20 text-muted-foreground opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`font-japanese flex flex-col items-center justify-center rounded-2xl border p-4 text-2xl font-black transition-all active:scale-95 ${btnCls}`}
                >
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {showExplanation && (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4 animate-in fade-in">
              <div className="flex items-center gap-2">
                {selectedAnswer === currentQuizItem.practiceQuestion.correctChar ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      To'g'ri javob!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-rose-500" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Noto'g'ri. To'g'ri kanji: {currentQuizItem.practiceQuestion.correctChar}
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-foreground">
                {currentQuizItem.practiceQuestion.explanationUz}
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextQuiz}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-90 active:scale-95"
                >
                  <span>
                    {quizIndex < filteredPairs.length - 1 ? 'Keyingi savol' : 'Qayta boshlash'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
