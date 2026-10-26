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
  const { settings, updateSettings } = useStudyData();
  const { language } = useLanguage();

  const activeTab = searchParams.get('tab') || 'lessons';
  const [showCanvasPractice, setShowCanvasPractice] = useState(false);

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 overflow-x-hidden p-3 pb-28 sm:p-4 sm:pb-24 md:space-y-8 md:p-8">
      {/* Header — Desktop only; mobile already has top header with title */}
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xs md:block md:p-6">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="font-display text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {language === 'ja' ? '日本語マスターハブ' : 'JLPT Master Hub'}
          </h1>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            {/* Furigana & Romaji Controls */}
            <div className="hidden items-center rounded-xl border border-border bg-muted/50 p-1 md:flex">
              <button
                onClick={() => updateSettings({ showFurigana: !settings.showFurigana })}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.showFurigana
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Languages size={13} />
                <span>Furigana</span>
                <span className="text-[10px] opacity-75">
                  {settings.showFurigana ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => updateSettings({ showRomaji: !settings.showRomaji })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.showRomaji
                    ? 'border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Romaji</span>
                <span className="ml-1 text-[10px] opacity-75">
                  {settings.showRomaji ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reading controls for mobile — desktop header is hidden on small screens */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {language === 'ja' ? '読み方' : "O'qish"}
        </span>
        <div className="flex items-center rounded-xl border border-border bg-muted/50 p-1">
          <button
            onClick={() => updateSettings({ showFurigana: !settings.showFurigana })}
            aria-pressed={settings.showFurigana}
            className={`flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              settings.showFurigana
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            <Languages size={13} />
            <span>がな</span>
          </button>
          <button
            onClick={() => updateSettings({ showRomaji: !settings.showRomaji })}
            aria-pressed={settings.showRomaji}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              settings.showRomaji
                ? 'border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            }`}
          >
            <span>Romaji</span>
          </button>
        </div>
      </div>

      {/* Tabs Strip — Clean, Single-Row, Minimalist Navigation */}
      <div className="border-b border-border/80 px-1 pb-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleTabChange('lessons')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'lessons'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookOpen size={15} />
            <span>{language === 'ja' ? 'レッスン' : 'Darsliklar'}</span>
          </button>

          <button
            onClick={() => handleTabChange('grammar')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'grammar'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Sparkles size={15} />
            <span>{language === 'ja' ? '文法' : 'Bunpou'}</span>
          </button>

          <button
            onClick={() => handleTabChange('kanji')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'kanji'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <GraduationCap size={15} />
            <span>{language === 'ja' ? '漢字' : 'Kanji'}</span>
          </button>

          <button
            onClick={() => handleTabChange('goi')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'goi'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Languages size={15} />
            <span>{language === 'ja' ? '語彙' : 'Goi'}</span>
          </button>

          <button
            onClick={() => handleTabChange('reading')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'reading'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <FileText size={15} />
            <span>{language === 'ja' ? '読解' : 'Dokkai'}</span>
          </button>

          <button
            onClick={() => handleTabChange('listening')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'listening'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Headphones size={15} />
            <span>{language === 'ja' ? '聴解' : 'Choukai'}</span>
          </button>

          <button
            onClick={() => handleTabChange('writing')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'writing'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <FileText size={15} />
            <span>{language === 'ja' ? '作文' : 'Sakubun'}</span>
          </button>

          <button
            onClick={() => handleTabChange('mock')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mock'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Target size={15} />
            <span>{language === 'ja' ? 'JLPT模擬' : 'JLPT Exam'}</span>
          </button>

          <button
            onClick={() => handleTabChange('mistakes')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mistakes'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookOpen size={15} />
            <span>{language === 'ja' ? '間違いノート' : 'Xatolar daftari'}</span>
          </button>

          <button
            onClick={() => handleTabChange('n1_mastery')}
            className={`flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'n1_mastery'
                ? 'border border-primary/30 bg-primary/10 font-black text-primary shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Crown size={15} className="text-amber-500" />
            <span>{language === 'ja' ? 'N1至高マスター' : 'N1 Mastery (社説・敬語)'}</span>
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
            <MinnaLessonsExplorer />
          </div>
        )}

        {/* Tab 1: Bunpou (Grammar) Master */}
        {activeTab === 'grammar' && (
          <div className="space-y-6 animate-in fade-in">
            <JlptGrammarKanjiMaster initialTab="grammar" />
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
              <JlptGrammarKanjiMaster initialTab="kanji" />
            </div>
          </div>
        )}

        {/* Tab 3: Goi (Vocabulary) Master */}
        {activeTab === 'goi' && (
          <div className="space-y-6 animate-in fade-in">
            <JlptGrammarKanjiMaster initialTab="goi" />
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
