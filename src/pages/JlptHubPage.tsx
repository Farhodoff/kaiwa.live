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
  BookMarked,
  Layers,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { lazyWithRetry } from '../utils/lazyRetry';

const MinnaLessonsExplorer = lazyWithRetry(() => import('../components/jlpt/MinnaLessonsExplorer'));
const JlptGrammarKanjiMaster = lazyWithRetry(
  () => import('../components/jlpt/JlptGrammarKanjiMaster'),
);
const KanjiCanvasPractice = lazyWithRetry(() => import('../components/jlpt/KanjiCanvasPractice'));

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
const JlptSkillMatrixView = lazyWithRetry(() =>
  import('../components/analytics/JlptSkillMatrixView').then((m) => ({
    default: m.JlptSkillMatrixView,
  })),
);

export const JlptHubPage: React.FC = () => {
  useSEO({
    title: 'JLPT N5-N1 Tayyorgarlik Markazi (Kanji, Grammatika, Mocks)',
    description:
      "Yapon tili JLPT N5 dan N1 gacha bo'lgan to'liq o'quv dasturi. 1000+ Kanji mashqi, grammatika viktorinalari va rasmiy formatdagi mock imtihonlar.",
    canonical: '/jlpt',
    keywords: "JLPT N5 N4 N3 N2 N1, yapon tili o'rganish O'zbekiston, Kanji mashq, JLPT mock exam",
  });

  const navigate = useNavigate();
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

            {/* Shaxsiy Reja */}
            <button
              onClick={() => navigate('/personal-plan')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
            >
              <Target size={14} className="text-primary" />
              <span>{language === 'ja' ? '個人学習プラン' : "Shaxsiy O'quv Rejam"}</span>
            </button>
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

      {/* Tabs Strip — grouped: Learn vs Practice (same tab params, no route change) */}
      <div className="space-y-2 border-b border-border/80 px-1 pb-3">
        <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {language === 'ja' ? '学習 — まずここ' : "O'rganish — avval bu"}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleTabChange('lessons')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'lessons'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Sparkles size={15} />{' '}
            {language === 'ja' ? '📚 体系的レッスン (N5–N1)' : '📚 Darsliklar (N5–N1)'}
          </button>

          <button
            onClick={() => handleTabChange('grammar')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'grammar'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookOpen size={15} /> {language === 'ja' ? '✍️ 文法' : '✍️ Bunpou (Grammatika)'}
          </button>

          <button
            onClick={() => handleTabChange('kanji')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'kanji'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookOpen size={15} /> {language === 'ja' ? '⛩️ 漢字' : '⛩️ Kanji'}
          </button>

          <button
            onClick={() => handleTabChange('goi')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'goi'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Languages size={15} /> {language === 'ja' ? '📚 語彙' : '📚 Goi (Lug‘at)'}
          </button>
        </div>
        <div className="px-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {language === 'ja' ? '練習・試験 — あとで' : 'Mashq va imtihon — keyin'}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleTabChange('reading')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'reading'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <FileText size={15} /> {language === 'ja' ? '📖 読解' : '📖 Dokkai (O‘qish)'}
          </button>

          <button
            onClick={() => handleTabChange('listening')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'listening'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Headphones size={15} /> {language === 'ja' ? '🎧 聴解' : '🎧 Choukai (Tinglash)'}
          </button>

          <button
            onClick={() => handleTabChange('writing')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'writing'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <FileText size={15} /> {language === 'ja' ? '📝 作文' : '📝 Sakubun (Insho)'}
          </button>

          <button
            onClick={() => handleTabChange('mock')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mock'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <GraduationCap size={15} /> {language === 'ja' ? '🏆 JLPT模擬' : '🏆 JLPT Exam'}
          </button>

          <button
            onClick={() => handleTabChange('mistakes')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'mistakes'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookMarked size={15} /> {language === 'ja' ? '📓 弱点ノート' : '📓 Xatolar daftari'}
          </button>

          <button
            onClick={() => handleTabChange('matrix')}
            className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'matrix'
                ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Layers size={15} /> {language === 'ja' ? '🎯 スキルマトリクス' : '🎯 Skill Matrix'}
          </button>

          <button
            onClick={() => navigate('/flashcards')}
            className="flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-2 whitespace-nowrap rounded-xl border border-dashed border-border px-3.5 py-2.5 text-xs font-bold text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-95"
          >
            🔁 {language === 'ja' ? '復習へ' : 'Takrorlashga'}
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

        {/* Tab 8: Xatolar Daftari (Mistake Notebook) */}
        {activeTab === 'mistakes' && (
          <div className="animate-in fade-in">
            <JlptMistakeNotebook />
          </div>
        )}

        {/* Tab 9: Skill Matrix (7 Ko'nikmalar Matritsasi) */}
        {activeTab === 'matrix' && (
          <div className="animate-in fade-in">
            <JlptSkillMatrixView />
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default JlptHubPage;
