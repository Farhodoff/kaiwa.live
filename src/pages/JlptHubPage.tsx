import React, { Suspense, useState } from 'react';
import {
  Target,
  FileText,
  BookOpen,
  Languages,
  Headphones,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { lazyWithRetry } from '../utils/lazyRetry';
import { JlptWeaknessDashboard } from '../components/analytics/JlptWeaknessDashboard';

const MinnaLessonsExplorer = lazyWithRetry(() => import('../components/jlpt/MinnaLessonsExplorer'));
const JlptGrammarKanjiMaster = lazyWithRetry(
  () => import('../components/jlpt/JlptGrammarKanjiMaster'),
);
const KanjiCanvasPractice = lazyWithRetry(() => import('../components/jlpt/KanjiCanvasPractice'));
const N1AdvancedMasteryHub = lazyWithRetry(() =>
  import('../components/jlpt/N1AdvancedMasteryHub').then((m) => ({
    default: m.N1AdvancedMasteryHub,
  })),
);

const JlptReadingPage = lazyWithRetry(() =>
  import('./JlptReadingPage').then((m) => ({ default: m.JlptReadingPage })),
);
const JlptListeningMockPage = lazyWithRetry(() =>
  import('./JlptListeningMockPage').then((m) => ({ default: m.JlptListeningMockPage })),
);
const JlptWritingPage = lazyWithRetry(() =>
  import('./JlptWritingPage').then((m) => ({ default: m.JlptWritingPage })),
);
const JlptMockExamPage = lazyWithRetry(() =>
  import('./JlptMockExamPage').then((m) => ({ default: m.JlptMockExamPage })),
);
const JlptMistakeNotebook = lazyWithRetry(() =>
  import('../components/jlpt/JlptMistakeNotebook').then((m) => ({
    default: m.JlptMistakeNotebook,
  })),
);

export const JlptHubPage: React.FC = () => {
  useSEO({
    title: 'JLPT N5–N1 Tayyorgarlik Markazi (Kanji, Grammatika, Choukai, Mocks)',
    description:
      "Yapon tili JLPT N5 dan N1 gacha bo'lgan to'liq o'quv dasturi. 1000+ interaktiv Kanji yozish animatsiyasi, grammatika viktorinalari, eshitish (Choukai) va 180 ballik rasmiy mock imtihonlar.",
    canonical: '/jlpt',
    keywords:
      "JLPT N5 N4 N3 N2 N1, yapon tili o'rganish, yapon tili noldan, Minna no Nihongo o'zbekcha, Kanji yozish mashqi, JLPT mock exam, Choukai eshitish testi, kaiwa.live",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, updateSettings, targetLevel, setPrimaryFocus } = useStudyData();
  const { language } = useLanguage();

  const activeTab = searchParams.get('tab') || 'lessons';
  const rawLevel = searchParams.get('level')?.toUpperCase();
  const activeLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' =
    rawLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(rawLevel)
      ? (rawLevel as any)
      : targetLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel.toUpperCase())
        ? (targetLevel.toUpperCase() as any)
        : 'N5';

  const [showCanvasPractice, setShowCanvasPractice] = useState(false);

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  const handleLevelChange = (lvl: 'N5' | 'N4' | 'N3' | 'N2' | 'N1') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('level', lvl);
    setSearchParams(newParams);
    try {
      setPrimaryFocus('ja', lvl);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 overflow-x-hidden p-3 pb-28 sm:p-4 sm:pb-24 md:space-y-8 md:p-8 3xl:max-w-8xl 3xl:p-12">
      {/* Unified Top Bar: Title 'JLPT', Level Selector & Reading Controls in ONE clean row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-black tracking-tight text-foreground sm:text-2xl">
            JLPT
          </h1>
          <div className="h-5 w-[1px] bg-border" />
          {/* Level Selector Pills */}
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => {
              const isSelected = activeLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => handleLevelChange(lvl)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[34px] items-center justify-center rounded-lg px-2.5 text-xs font-black transition-all active:scale-95 sm:px-3 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Furigana & Romaji Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={() => updateSettings({ showFurigana: !settings.showFurigana })}
            aria-pressed={settings.showFurigana}
            className={`flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              settings.showFurigana
                ? 'border border-primary/30 bg-primary/15 text-primary'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Languages size={13} />
            <span>Furigana</span>
            <span className="text-[10px] opacity-75">{settings.showFurigana ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={() => updateSettings({ showRomaji: !settings.showRomaji })}
            aria-pressed={settings.showRomaji}
            className={`flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              settings.showRomaji
                ? 'border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Romaji</span>
            <span className="text-[10px] opacity-75">{settings.showRomaji ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Strip — Clean, Single-Row Navigation */}
      <div className="border-b border-border/80 pb-1">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => handleTabChange('lessons')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'lessons'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <BookOpen size={14} />
            <span>{language === 'ja' ? 'レッスン' : 'Darsliklar'}</span>
          </button>

          <button
            onClick={() => handleTabChange('grammar')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'grammar'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Sparkles size={14} />
            <span>{language === 'ja' ? '文法' : 'Grammatika'}</span>
          </button>

          <button
            onClick={() => handleTabChange('kanji')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'kanji'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <GraduationCap size={14} />
            <span>{language === 'ja' ? '漢字' : 'Kanji'}</span>
          </button>

          <button
            onClick={() => handleTabChange('goi')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'goi'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Languages size={14} />
            <span>{language === 'ja' ? '語彙' : 'Lug‘at'}</span>
          </button>

          <button
            onClick={() => handleTabChange('reading')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'reading'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <FileText size={14} />
            <span>{language === 'ja' ? '読解' : 'O‘qish'}</span>
          </button>

          <button
            onClick={() => handleTabChange('listening')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'listening'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Headphones size={14} />
            <span>{language === 'ja' ? '聴解' : 'Tinglash'}</span>
          </button>

          <button
            onClick={() => handleTabChange('writing')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'writing'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <FileText size={14} />
            <span>{language === 'ja' ? '作文' : 'Yozish'}</span>
          </button>

          <button
            onClick={() => handleTabChange('mock')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mock'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Target size={14} />
            <span>{language === 'ja' ? 'JLPT模擬' : 'JLPT imtihoni'}</span>
          </button>

          <button
            onClick={() => handleTabChange('mistakes')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mistakes'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <BookOpen size={14} />
            <span>{language === 'ja' ? '間違いノート' : 'Xatolar daftari'}</span>
          </button>

          <button
            onClick={() => handleTabChange('insights')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'insights'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Target size={14} />
            <span>{language === 'ja' ? '弱点分析' : 'Zaiflik tahlili'}</span>
          </button>

          <button
            onClick={() => handleTabChange('n1_mastery')}
            className={`flex min-h-[38px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'n1_mastery'
                ? 'border border-primary/30 bg-primary/10 font-black text-primary shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Crown size={14} className="text-amber-500" />
            <span>{language === 'ja' ? 'N1マスター' : 'N1 Mastery'}</span>
          </button>
        </div>
      </div>

      {/* Tab Views */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <div className="border-3 h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          </div>
        }
      >
        {/* Tab 0: Minna no Nihongo Shokyu 1 Lessons (1–25) */}
        {activeTab === 'lessons' && (
          <div className="animate-in fade-in">
            <MinnaLessonsExplorer initialLevel={activeLevel} hideLevelSwitcher={true} />
          </div>
        )}

        {/* Tab 1: Bunpou (Grammar) Master */}
        {activeTab === 'grammar' && (
          <div className="space-y-6 animate-in fade-in">
            <JlptGrammarKanjiMaster initialTab="grammar" initialLevel={activeLevel} />
          </div>
        )}

        {/* Tab 2: Kanji Canvas & Master */}
        {activeTab === 'kanji' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Collapsible Kanji Canvas Banner */}
            <div className="rounded-2xl border border-border bg-card p-3 shadow-xs transition-all sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base sm:h-10 sm:w-10 sm:text-lg">
                    ✍️
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground sm:text-sm">
                      {language === 'ja'
                        ? '漢字の手書き練習 (Canvas)'
                        : "Qo'lda Kanji yozib mashq qilish"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                      {language === 'ja'
                        ? '書き順をなぞって覚える'
                        : 'Iyeroglif chizish va yozish mashqi'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCanvasPractice((prev) => !prev)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
                >
                  {showCanvasPractice ? (
                    <>
                      <ChevronUp size={14} /> {language === 'ja' ? '閉じる' : 'Yopish'}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> {language === 'ja' ? '練習する' : 'Ochish'}
                    </>
                  )}
                </button>
              </div>

              {showCanvasPractice && (
                <div className="mt-4 border-t border-border/60 pt-4 duration-200 animate-in fade-in slide-in-from-top-2">
                  <KanjiCanvasPractice />
                </div>
              )}
            </div>

            <div>
              <JlptGrammarKanjiMaster initialTab="kanji" initialLevel={activeLevel} />
            </div>
          </div>
        )}

        {/* Tab 3: Goi (Vocabulary) Master */}
        {activeTab === 'goi' && (
          <div className="space-y-6 animate-in fade-in">
            <JlptGrammarKanjiMaster initialTab="goi" initialLevel={activeLevel} />
          </div>
        )}

        {/* Tab 4: Dokkai (Reading) */}
        {activeTab === 'reading' && (
          <div className="animate-in fade-in">
            <JlptReadingPage />
          </div>
        )}

        {/* Tab 5: Choukai (Listening) */}
        {activeTab === 'listening' && (
          <div className="animate-in fade-in">
            <JlptListeningMockPage />
          </div>
        )}

        {/* Tab 6: Sakubun (Writing) */}
        {activeTab === 'writing' && (
          <div className="animate-in fade-in">
            <JlptWritingPage />
          </div>
        )}

        {/* Tab 7: Full Mock Exam */}
        {activeTab === 'mock' && (
          <div className="animate-in fade-in">
            <JlptMockExamPage />
          </div>
        )}

        {/* Tab 8: Mistake Notebook */}
        {activeTab === 'mistakes' && (
          <div className="animate-in fade-in">
            <JlptMistakeNotebook />
          </div>
        )}
        {activeTab === 'insights' && <JlptWeaknessDashboard />}
        {activeTab === 'n1_mastery' && (
          <div className="animate-in fade-in">
            <N1AdvancedMasteryHub />
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default JlptHubPage;
