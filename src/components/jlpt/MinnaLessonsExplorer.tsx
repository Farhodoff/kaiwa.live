import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Play,
  Search,
  MessageSquare,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { MINNA_N5_LESSONS } from '../../data/curriculum/minnaN5Lessons';
import { MINNA_N4_LESSONS } from '../../data/curriculum/minnaN4Lessons';
import { JAPANESE_N3_LESSONS } from '../../data/curriculum/japaneseN3';
import { JAPANESE_N2_LESSONS } from '../../data/curriculum/japaneseN2';
import { JAPANESE_N1_LESSONS } from '../../data/curriculum/japaneseN1';
import { LessonService } from '../../services/LessonService';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { Lesson } from '../../types/lesson';

export type JlptLevel = 'n5' | 'n4' | 'n3' | 'n2' | 'n1';

interface MinnaLessonsExplorerProps {
  initialLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

const UNIT_TABS_N5 = [
  { id: 'all', title: 'Barcha Darslar (1–25)', titleJa: 'すべての課 (1–25)' },
  { id: 'mondai_listening', title: '🎧 Mondai Tinglash (1–25)', titleJa: '🎧 問題 聴解テスト' },
  { id: 'ja-minna-u1', title: 'Unit 1: 1–5 Darslar (Tanishuv & Harakat)', titleJa: '第1課〜第5課' },
  {
    id: 'ja-minna-u2',
    title: 'Unit 2: 6–10 Darslar (Hayot & Mavjudlik)',
    titleJa: '第6課〜第10課',
  },
  {
    id: 'ja-minna-u3',
    title: 'Unit 3: 11–15 Darslar (Sanoq & Te-shakli)',
    titleJa: '第11課〜第15課',
  },
  {
    id: 'ja-minna-u4',
    title: 'Unit 4: 16–20 Darslar (Ketma-ketlik & Futsuugo)',
    titleJa: '第16課〜第20課',
  },
  { id: 'ja-minna-u5', title: 'Unit 5: 21–25 Darslar (Fikr & Shart)', titleJa: '第21課〜第25課' },
];

const UNIT_TABS_N4 = [
  { id: 'all', title: 'Barcha Darslar (26–50)', titleJa: 'すべての課 (26–50)' },
  { id: 'mondai_listening', title: '🎧 Mondai Tinglash (26–50)', titleJa: '🎧 問題 聴解テスト' },
  { id: 'ja-minna-u6', title: 'Unit 6: 26–30 Darslar (Holat & Izoh)', titleJa: '第26課〜第30課' },
  { id: 'ja-minna-u7', title: 'Unit 7: 31–35 Darslar (Reja & Shart)', titleJa: '第31課〜第35課' },
  {
    id: 'ja-minna-u8',
    title: "Unit 8: 36–40 Darslar (Ko'nikma & Sabab)",
    titleJa: '第36課〜第40課',
  },
  { id: 'ja-minna-u9', title: 'Unit 9: 41–45 Darslar (Hadya & Maqsad)', titleJa: '第41課〜第45課' },
  {
    id: 'ja-minna-u10',
    title: 'Unit 10: 46–50 Darslar (Keigo & Nisbatlar)',
    titleJa: '第46課〜第50課',
  },
];

const UNIT_TABS_N3 = [
  { id: 'all', title: 'Barcha Darslar (1–30)', titleJa: 'すべての課 (1–30)' },
  {
    id: 'ja-n3-u1',
    title: 'Unit 1: Passive & Causative (受身・使役)',
    titleJa: '第1章：受身・使役',
  },
  {
    id: 'ja-n3-u2',
    title: 'Unit 2: Decisions & Habits (決定・習慣)',
    titleJa: '第2章：決定・習慣',
  },
  {
    id: 'ja-n3-u3',
    title: 'Unit 3: Keigo & Business (敬語・ビジネス)',
    titleJa: '第3章：敬語・実務',
  },
  {
    id: 'ja-n3-u4',
    title: 'Unit 4: Advanced Reasoning (論理・対比)',
    titleJa: '第4章：論理・対比',
  },
  { id: 'ja-n3-u5', title: 'Unit 5: Kanji & Reading (漢字・読解)', titleJa: '第5章：漢字・読解' },
  {
    id: 'ja-n3-u6',
    title: 'Unit 6: Capstone Mastery (総合演習・試験対策)',
    titleJa: '第6章：総合演習',
  },
];

const UNIT_TABS_N2 = [
  { id: 'all', title: 'Barcha Darslar (1–30)', titleJa: 'すべての課 (1–30)' },
  {
    id: 'ja-n2-u1',
    title: 'Unit 1: Connectors & Progression (接続・変化)',
    titleJa: '第1章：接続・変化',
  },
  {
    id: 'ja-n2-u2',
    title: 'Unit 2: Professional Japanese & Applied Skills (実務日本語・応用)',
    titleJa: '第2章：実務日本語・応用',
  },
  {
    id: 'ja-n2-u3',
    title: 'Unit 3: N2 Advanced Grammar (重要文法・表現)',
    titleJa: '第3章：重要文法',
  },
  {
    id: 'ja-n2-u4',
    title: 'Unit 4: Reading & Listening in Social Context (社会読解・聴解)',
    titleJa: '第4章：社会読解・聴解',
  },
  {
    id: 'ja-n2-u5',
    title: 'Unit 5: N2 Kanji & Vocabulary (漢字・重要語彙)',
    titleJa: '第5章：漢字・語彙',
  },
  {
    id: 'ja-n2-u6',
    title: 'Unit 6: Final Assessment & N1 Bridge (総復習・N1架け橋)',
    titleJa: '第6章：総仕上げ',
  },
];

const UNIT_TABS_N1 = [
  { id: 'all', title: 'Barcha Darslar (1–30)', titleJa: 'すべての課 (1–30)' },
  {
    id: 'ja-n1-u1',
    title: 'Unit 1: Classical & Literary Grammar (文語・格調表現)',
    titleJa: '第1章：古典・文語',
  },
  {
    id: 'ja-n1-u2',
    title: 'Unit 2: Academic Vocabulary & Discourse (学術語彙・論理構成)',
    titleJa: '第2章：学術語彙',
  },
  {
    id: 'ja-n1-u3',
    title: 'Unit 3: Cause, Trigger & Consequence (起因・不可避・即時)',
    titleJa: '第3章：起因・即時',
  },
  {
    id: 'ja-n1-u4',
    title: 'Unit 4: Extreme States & Nuances (極限・評価・限定)',
    titleJa: '第4章：極限・評価',
  },
  {
    id: 'ja-n1-u5',
    title: 'Unit 5: Advanced Kanji & Grammar Synthesis (学術漢字・四字熟語)',
    titleJa: '第5章：漢字・熟語',
  },
  {
    id: 'ja-n1-u6',
    title: 'Unit 6: Dokkai & Ultimate Capstone (社会評論・N1卒業検定)',
    titleJa: '第6章：総仕上げ',
  },
];

const SCENARIO_MAP_BY_LESSON_NUMBER: Record<number, string> = {
  1: 'minna_l1_hajimemashite',
  2: 'minna_l2_honno_kimochi',
  3: 'minna_l3_kore_wo_kudasai',
  4: 'minna_l4_nanji_kara',
  5: 'minna_l5_koushien',
  6: 'minna_l6_isshoni_ikimasenka',
  10: 'minna_l10_chiri_so_su',
  14: 'minna_l14_umeda_made',
  26: 'minna_l26_advice',
  27: 'minna_l27_ability',
  28: 'minna_l28_nagara',
  30: 'minna_l30_junbi',
  32: 'minna_l32_byoki',
  37: 'minna_l37_ukemi',
  49: 'minna_l49_sonkeigo',
  50: 'minna_l50_kenjougo',
};

const SCENARIO_MAP_BY_UNIT: Record<string, string> = {
  'ja-n3-u1': 'byouin',
  'ja-n3-u2': 'gakko_no_ichinichi',
  'ja-n3-u3': 'business_koushou',
  'ja-n3-u4': 'gakko_soudan',
  'ja-n3-u5': 'ryokou_toukou',
  'ja-n3-u6': 'restaurant_kinenbi',
  'ja-n2-u1': 'presentation_kekka',
  'ja-n2-u2': 'torihikisaki_denwa_keigo',
  'ja-n2-u3': 'shakai_mondai_iken',
  'ja-n2-u4': 'shokuba_email_followup',
  'ja-n2-u5': 'shokuba_teammeeting',
  'ja-n2-u6': 'mensetsu_it',
  'ja-n1-u1': 'shakai_mondai_iken',
  'ja-n1-u2': 'presentation_kekka',
  'ja-n1-u3': 'business_koushou',
  'ja-n1-u4': 'torihikisaki_denwa_keigo',
  'ja-n1-u5': 'shokuba_email_followup',
  'ja-n1-u6': 'mensetsu_it',
};

const LEVEL_CONFIGS = {
  n5: {
    key: 'n5' as JlptLevel,
    name: 'JLPT N5',
    tabLabel: '🌸 初級1 (N5)',
    subLabel: '1–25 Darslar',
    badge: "🌸 JLPT N5 Boshlang'ich Darslik Bazasidan",
    title: '🌸 みんなの日本語 初級1 (Minna no Nihongo 1–25 Darslar)',
    description:
      "Yapon tilining eng mashhur darsligi bo'yicha 25 ta to'liq dars. 1,135 ta so'z, 144 ta grammatika qoidasi, o'zbekcha izohlar, interaktiv mashqlar va sinov testlari bilan bosqichma-bosqich o'rganing.",
    badgeClass: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    bannerGradient:
      'border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent',
    progressBarGradient: 'bg-gradient-to-r from-rose-500 to-amber-500',
    numberBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-500',
    totalLessons: 25,
  },
  n4: {
    key: 'n4' as JlptLevel,
    name: 'JLPT N4',
    tabLabel: '🌿 初級2 (N4)',
    subLabel: '26–50 Darslar',
    badge: "🌿 JLPT N4 O'rta-Boshlang'ich Darslik Bazasidan",
    title: '🌿 みんなの日本語 初級2 (Minna no Nihongo 26–50 Darslar)',
    description:
      "Minna no Nihongo Shokyu 2 bo'yicha 25 ta to'liq dars. Potensial, majhul, majburiy nisbat, keigo hurmat tili, 450+ yangi so'z, o'zbekcha tushuntirishlar va sinov testlari bilan N4 darajasini to'liq o'zlashtiring.",
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bannerGradient:
      'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
    progressBarGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    numberBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-500',
    totalLessons: 25,
  },
  n3: {
    key: 'n3' as JlptLevel,
    name: 'JLPT N3',
    tabLabel: '🏮 中級 (N3)',
    subLabel: '30 Dars',
    badge: "🏮 JLPT N3 O'rta Daraja Darslik Bazasidan (Shin Kanzen & Sou Matome)",
    title: "🏮 新完全マスター＆総まとめ N3 (30 ta To'liq Dars)",
    description:
      "JLPT N3 imtihoni uchun 30 ta tayanch dars. Murakkab passiv-kausativ (Ukemi/Shieki), rasmiy biznes yapon tili (Keigo), sabab-oqibat va publitsistik matnlarni tushunish ko'nikmalari.",
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bannerGradient:
      'border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent',
    progressBarGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    numberBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500',
    totalLessons: 30,
  },
  n2: {
    key: 'n2' as JlptLevel,
    name: 'JLPT N2',
    tabLabel: '🗾 上級 (N2)',
    subLabel: '30 Dars',
    badge: "🗾 JLPT N2 Yuqori-O'rta Daraja Bazasidan (Shin Kanzen Master)",
    title: "🗾 新完全マスター＆総まとめ N2 (30 ta To'liq Dars)",
    description:
      "JLPT N2 oliy darajasi uchun 30 ta intensiv dars. Korporativ muloqot, gazeta va maqolalar tahlili, ilmiy bog'lovchilar, rasmiy taqdimot va nutq qoidalari.",
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    bannerGradient:
      'border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent',
    progressBarGradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    numberBadgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500',
    totalLessons: 30,
  },
  n1: {
    key: 'n1' as JlptLevel,
    name: 'JLPT N1',
    tabLabel: '👑 最上級 (N1)',
    subLabel: '30 Dars',
    badge: '👑 JLPT N1 Oliy Master Daraja (Shin Kanzen & Sou Matome N1)',
    title: '👑 新完全マスター＆総まとめ N1 (30 ta Mukammal Dars)',
    description:
      "Yapon tilining eng yuqori akademik va professional cho'qqisi. Mumtoz adabiy grammatika (文語), akademik ilmiy matnlar tahlili, rasmiy davlat va biznes muzokaralari hamda falsafiy esselar.",
    badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    bannerGradient:
      'border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent',
    progressBarGradient: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    numberBadgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    iconColor: 'text-purple-500',
    totalLessons: 30,
  },
};

export const MinnaLessonsExplorer: React.FC<MinnaLessonsExplorerProps> = ({ initialLevel }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useStudyData();
  const { language } = useLanguage();

  const urlLevel = searchParams.get('level')?.toLowerCase();

  const resolveInitialLevel = (): JlptLevel => {
    if (initialLevel) return initialLevel.toLowerCase() as JlptLevel;
    if (urlLevel && ['n5', 'n4', 'n3', 'n2', 'n1'].includes(urlLevel)) return urlLevel as JlptLevel;
    return 'n5';
  };

  const [activeLevel, setActiveLevel] = useState<JlptLevel>(resolveInitialLevel);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync if url level changes
  useEffect(() => {
    if (urlLevel && ['n5', 'n4', 'n3', 'n2', 'n1'].includes(urlLevel)) {
      setActiveLevel(urlLevel as JlptLevel);
      setSelectedUnit('all');
    }
  }, [urlLevel]);

  const currentLessons: Lesson[] = useMemo(() => {
    switch (activeLevel) {
      case 'n5':
        return MINNA_N5_LESSONS;
      case 'n4':
        return MINNA_N4_LESSONS;
      case 'n3':
        return JAPANESE_N3_LESSONS;
      case 'n2':
        return JAPANESE_N2_LESSONS;
      case 'n1':
        return JAPANESE_N1_LESSONS;
      default:
        return MINNA_N5_LESSONS;
    }
  }, [activeLevel]);

  const currentUnitTabs = useMemo(() => {
    switch (activeLevel) {
      case 'n5':
        return UNIT_TABS_N5;
      case 'n4':
        return UNIT_TABS_N4;
      case 'n3':
        return UNIT_TABS_N3;
      case 'n2':
        return UNIT_TABS_N2;
      case 'n1':
        return UNIT_TABS_N1;
      default:
        return UNIT_TABS_N5;
    }
  }, [activeLevel]);

  // Map progress for each lesson in current level
  const lessonProgressMap = useMemo(() => {
    const map: Record<string, { completed: boolean; score?: number }> = {};
    for (const l of currentLessons) {
      const prog = LessonService.getLessonProgress(user?.id || '', l.id);
      map[l.id] = {
        completed: prog?.isCompleted || false,
        score: prog?.quizScore?.percentage,
      };
    }
    return map;
  }, [user?.id, currentLessons]);

  const completedCount = useMemo(() => {
    return Object.values(lessonProgressMap).filter((p) => p.completed).length;
  }, [lessonProgressMap]);

  const filteredLessons = useMemo(() => {
    return currentLessons.filter((lesson) => {
      // Unit filter
      if (selectedUnit !== 'all') {
        if (selectedUnit === 'mondai_listening') {
          const hasMondai = lesson.steps.some(
            (s) =>
              s.id.includes('s4') ||
              s.title.toLowerCase().includes('tinglash') ||
              s.title.toLowerCase().includes('mondai'),
          );
          if (!hasMondai) return false;
        } else if (lesson.unitId !== selectedUnit) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = lesson.title.toLowerCase().includes(query);
        const inDesc = lesson.description.toLowerCase().includes(query);
        const inSubtitle =
          lesson.steps[0]?.learnData?.subtitle?.toLowerCase().includes(query) || false;
        const inGrammar = lesson.steps[0]?.learnData?.grammarRules?.some((rule) =>
          `${rule.pattern} ${rule.meaning}`.toLowerCase().includes(query),
        );
        return (
          inTitle || inDesc || inSubtitle || inGrammar || String(lesson.lessonNumber) === query
        );
      }

      return true;
    });
  }, [currentLessons, selectedUnit, searchQuery]);

  const cfg = LEVEL_CONFIGS[activeLevel];

  const resolveScenarioId = (lesson: Lesson): string => {
    if (activeLevel === 'n5' || activeLevel === 'n4') {
      return SCENARIO_MAP_BY_LESSON_NUMBER[lesson.lessonNumber] || '';
    }
    return SCENARIO_MAP_BY_UNIT[lesson.unitId] || '';
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 5-Level Switcher: N5, N4, N3, N2, N1 */}
      <div className="scrollbar-none flex touch-pan-x items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card/60 p-1.5 backdrop-blur-sm sm:w-fit sm:gap-2">
        {(['n5', 'n4', 'n3', 'n2', 'n1'] as JlptLevel[]).map((lvl) => {
          const lCfg = LEVEL_CONFIGS[lvl];
          const isActive = activeLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => {
                setActiveLevel(lvl);
                setSelectedUnit('all');
                setSearchQuery('');
                const newParams = new URLSearchParams(searchParams);
                newParams.set('level', lvl);
                setSearchParams(newParams, { replace: true });
              }}
              aria-pressed={isActive}
              className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3.5 sm:py-2 sm:text-sm ${
                isActive
                  ? 'border border-border bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <span className="sm:hidden">{lCfg.name}</span>
              <span className="hidden sm:inline">{lCfg.tabLabel}</span>
              <span
                className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-black sm:inline ${
                  isActive ? lCfg.badgeClass : 'bg-muted text-muted-foreground'
                }`}
              >
                {lCfg.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Course Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-xs transition-colors duration-300 sm:rounded-3xl sm:p-6 ${cfg.bannerGradient}`}
      >
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <div
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:inline-flex sm:px-3 sm:py-1 sm:text-xs ${cfg.badgeClass}`}
            >
              <Sparkles size={12} />
              <span>{cfg.badge}</span>
            </div>
            <h2 className="text-sm font-bold leading-snug text-foreground sm:text-2xl sm:font-black">
              {cfg.title}
            </h2>
            <p className="hidden max-w-2xl text-xs leading-relaxed text-muted-foreground sm:block sm:text-sm">
              {cfg.description}
            </p>
          </div>

          {/* Stats card */}
          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card/80 p-2.5 sm:rounded-2xl sm:p-3.5">
            <div
              className={`hidden items-center justify-center rounded-lg text-base sm:flex sm:h-12 sm:w-12 sm:rounded-xl sm:text-xl ${cfg.numberBadgeClass}`}
            >
              🎓
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground sm:text-xs">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>O'zlashtirish:</span>
              </div>
              <div className="text-sm font-black text-foreground sm:text-lg">
                {completedCount} / {cfg.totalLessons}{' '}
                <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                  dars
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 sm:mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground sm:text-xs">
            <span>Umumiy {cfg.name} Jarayoni</span>
            <span>{Math.round((completedCount / cfg.totalLessons) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full transition-all duration-500 ${cfg.progressBarGradient}`}
              style={{ width: `${(completedCount / cfg.totalLessons) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Unit Selector Tabs */}
        <div className="scrollbar-none flex touch-pan-x items-center gap-1.5 overflow-x-auto pb-1">
          {currentUnitTabs.map((tab) => {
            const isActive = selectedUnit === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedUnit(tab.id)}
                aria-pressed={isActive}
                className={`flex min-h-[44px] shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? 'scale-[1.02] bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <span>{language === 'ja' ? tab.titleJa : tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            aria-label="Dars yoki grammatikani qidirish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dars yoki qoidani qidirish..."
            className="focus:outline-hidden w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filteredLessons.length} ta dars ko‘rsatilmoqda
      </p>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLessons.map((lesson) => {
          const prog = lessonProgressMap[lesson.id];
          const vocabCount = lesson.steps[0]?.learnData?.vocabulary?.length || 0;
          const grammarRules = lesson.steps[0]?.learnData?.grammarRules || [];
          const subtitle = lesson.steps[0]?.learnData?.subtitle || '';
          const scenarioId = resolveScenarioId(lesson);

          return (
            <div
              key={lesson.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
            >
              <div>
                {/* Header badges */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${cfg.numberBadgeClass}`}
                    >
                      {lesson.lessonNumber}
                    </span>
                    <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      JLPT {lesson.level}
                    </span>
                  </div>

                  {prog?.completed ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>{prog.score ? `${prog.score}%` : 'Tugallandi'}</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      ~{lesson.estimatedDurationMinutes || 20} daqiqa
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 text-sm font-bold leading-relaxed text-foreground transition-colors group-hover:text-primary sm:text-base">
                  {lesson.title}
                </h3>
                {subtitle && (
                  <p className="mt-0.5 line-clamp-1 font-mono text-xs font-medium text-muted-foreground/80">
                    {subtitle}
                  </p>
                )}

                {/* Description & Key Grammar Rules */}
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {lesson.description}
                </p>

                {/* Meta stats: vocab & grammar count */}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} className={cfg.iconColor} />
                    <span>{vocabCount} ta so'z</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>{grammarRules.length} ta qoida</span>
                  </span>
                  {(activeLevel === 'n5' || activeLevel === 'n4') && (
                    <span className="flex items-center gap-1 font-bold text-rose-500 dark:text-rose-400">
                      <Headphones size={12} />
                      <span>Tinglash</span>
                    </span>
                  )}
                </div>

                {/* Grammar tags preview */}
                {grammarRules.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {grammarRules.slice(0, 3).map((g, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-foreground/80"
                      >
                        {g.pattern.length > 25 ? `${g.pattern.slice(0, 25)}...` : g.pattern}
                      </span>
                    ))}
                    {grammarRules.length > 3 && (
                      <span className="rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        +{grammarRules.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
                <button
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  aria-label={`${lesson.title}: ${prog?.completed ? 'qayta o‘qish' : 'darsni boshlash'}`}
                  className="flex h-10 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
                >
                  <Play size={13} fill="currentColor" />
                  <span className="truncate">
                    {prog?.completed ? "Qayta O'qish" : 'Darsni Boshlash'}
                  </span>
                </button>

                {(activeLevel === 'n5' || activeLevel === 'n4') && (
                  <button
                    onClick={() => navigate(`/lesson/${lesson.id}?step=mondai`)}
                    title="Tinglash mashqini ochish"
                    aria-label={`${lesson.title}: tinglash mashqi`}
                    className="flex h-10 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-bold text-rose-600 transition-all hover:bg-rose-500/20 active:scale-95 dark:text-rose-400"
                  >
                    <Headphones size={14} />
                    <span>Tinglash</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    navigate(
                      scenarioId
                        ? `/speaking-coach?lang=ja&scenario=${scenarioId}`
                        : '/speaking-coach?lang=ja',
                    )
                  }
                  title="AI Speaking Coach bilan suhbat"
                  aria-label={`${lesson.title}: Speaking Coach`}
                  className="flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                >
                  <MessageSquare size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLessons.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Qidiruvingiz bo'yicha darslar topilmadi.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedUnit('all');
            }}
            className="mt-4 min-h-[44px] rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Filtrlarni tozalash
          </button>
        </div>
      )}
    </div>
  );
};

export default MinnaLessonsExplorer;
