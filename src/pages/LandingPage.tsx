import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Menu,
  Moon,
  Sun,
  X,
  Mic,
  Volume2,
  Flame,
  BookOpen,
  MessageSquare,
  Check,
  Lock,
} from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { UzbekistanFlag, JapanFlag } from '../components/common/FlagIcons';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

/* ------------------------------------------------------------------ */
/*  Animated Section Wrapper                                          */
/* ------------------------------------------------------------------ */
const FadeIn: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  offsetY?: number;
  direction?: 'y' | 'x';
}> = ({ children, className = '', delay = 0, offsetY = 24, direction = 'y' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const initial = direction === 'y' ? { opacity: 0, y: offsetY } : { opacity: 0, x: offsetY };
  const animate = direction === 'y' ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 };
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Phone Mockup with 3D Tilt & Typing Bubble (Hero)                  */
/* ------------------------------------------------------------------ */
const HeroPhoneMockup: React.FC = () => {
  const [isTranslating, setIsTranslating] = useState(true);

  return (
    <div className="mx-auto flex w-full max-w-[340px] select-none justify-center [perspective:1200px] sm:max-w-[360px]">
      <motion.div
        initial={{ opacity: 0, y: 30, rotateY: -12, rotateX: 4 }}
        animate={{ opacity: 1, y: 0, rotateY: -6, rotateX: 2 }}
        whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative flex h-[620px] w-full flex-col justify-between overflow-hidden rounded-[44px] border border-border bg-card p-4 shadow-2xl"
      >
        {/* Phone Notch */}
        <div className="mx-auto mb-2 h-6 w-28 shrink-0 rounded-b-2xl bg-foreground/10" />

        {/* Sensei Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border/80 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-rose-400 text-sm font-bold text-white shadow-sm">
            先
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">Yuki-sensei</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] font-medium text-emerald-500">
              ● onlayn · Restoran mavzusi
            </span>
          </div>
        </div>

        {/* Chat Bubbles */}
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto py-4">
          {/* AI Message 1 */}
          <div className="rounded-bl-xs max-w-[85%] space-y-1 rounded-2xl border border-border bg-muted/80 p-3 text-sm text-foreground">
            <p className="font-japanese text-[15px] leading-relaxed">
              <ruby>
                今日<rt className="text-[10px] text-muted-foreground">きょう</rt>
              </ruby>
              は
              <ruby>
                何<rt className="text-[10px] text-muted-foreground">なに</rt>
              </ruby>
              を
              <ruby>
                食<rt className="text-[10px] text-muted-foreground">た</rt>
              </ruby>
              べますか？
            </p>
            {isTranslating && (
              <span className="block text-[11px] text-muted-foreground">Bugun nima yeysiz?</span>
            )}
          </div>

          {/* User Message */}
          <div className="rounded-br-xs ml-auto max-w-[85%] space-y-1 rounded-2xl bg-primary p-3 text-sm text-primary-foreground shadow-sm">
            <p className="font-japanese text-[15px] leading-relaxed">ラーメンをたべたいです！</p>
            {isTranslating && (
              <span className="block text-[11px] text-primary-foreground/80">
                Ramen yemoqchiman!
              </span>
            )}
          </div>

          {/* AI Message 2 */}
          <div className="rounded-bl-xs max-w-[85%] space-y-1 rounded-2xl border border-border bg-muted/80 p-3 text-sm text-foreground">
            <p className="font-japanese text-[15px] leading-relaxed">
              いいですね！🍜{' '}
              <ruby>
                辛<rt className="text-[10px] text-muted-foreground">から</rt>
              </ruby>
              いのは
              <ruby>
                大丈夫<rt className="text-[10px] text-muted-foreground">だいじょうぶ</rt>
              </ruby>
              ですか？
            </p>
          </div>

          {/* Typing indicator */}
          <div className="rounded-bl-xs inline-flex items-center gap-1.5 rounded-2xl border border-border/60 bg-muted/60 px-3 py-2">
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="flex h-12 shrink-0 items-center justify-between rounded-full border border-border bg-background px-4 text-xs text-muted-foreground shadow-inner">
          <span>Yozing yoki gapiring…</span>
          <button
            onClick={() => setIsTranslating(!isTranslating)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
            title="Ovozli gapirish"
          >
            <Mic size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Product UI Showcase Mockup                                        */
/* ------------------------------------------------------------------ */
const ProductShowcase: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState('N4');
  const [selectedTopic, setSelectedTopic] = useState('🍜 Restoran');
  const [showTranslation, setShowTranslation] = useState(true);
  const [activeHeart, setActiveHeart] = useState<Record<string, boolean>>({ 塩: true });

  const toggleHeart = (word: string) => {
    setActiveHeart((prev) => ({ ...prev, [word]: !prev[word] }));
  };

  const topics = [
    { label: '🍜 Restoran', jp: 'レストラン' },
    { label: '✈️ Aeroport', jp: '空港' },
    { label: '🛍 Do‘kon', jp: '買い物' },
    { label: '🏥 Shifokor', jp: '病院' },
    { label: '💼 Ish suhbati', jp: '面接' },
    { label: '🎌 Erkin suhbat', jp: '自由' },
  ];

  return (
    <div className="grid min-h-[580px] w-full grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-[260px_1fr_300px]">
      {/* LEFT SIDEBAR (Levels & Topics) */}
      <aside className="hidden flex-col gap-5 border-r border-border bg-muted/20 p-5 lg:flex">
        <button className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
          ＋ Yangi suhbat
        </button>

        {/* Level selector */}
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Daraja
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((lvl, idx) => (
              <button
                key={`level-${lvl}-${idx}`}
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-lg border py-1.5 text-xs font-bold transition-all ${
                  selectedLevel === lvl
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="flex-1">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Mavzular
          </div>
          <div className="space-y-1">
            {topics.map((t, idx) => (
              <button
                key={`topic-${t.label}-${idx}`}
                onClick={() => setSelectedTopic(t.label)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  selectedTopic === t.label
                    ? 'bg-primary/15 font-bold text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <span>{t.label}</span>
                <span className="font-japanese text-[11px] opacity-60">{t.jp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="border-t border-border/80 pt-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            So‘nggi
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="cursor-pointer rounded-lg px-2 py-1 hover:bg-muted/40">
              Kecha · Do‘kon
            </div>
            <div className="cursor-pointer rounded-lg px-2 py-1 hover:bg-muted/40">
              Du · O‘zini tanishtirish
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER MAIN CHAT */}
      <main className="flex min-w-0 flex-col bg-background/50">
        {/* Top Coach Bar */}
        <div className="flex items-center gap-3 border-b border-border bg-card/60 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-rose-400 text-xs font-bold text-white shadow-xs">
            先
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span>Yuki-sensei</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {selectedTopic.replace(/^[^\s]+\s*/, '')} · {selectedLevel} · oddiy nutq
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
              <span>Bugun 7/10 daq</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-primary to-rose-400" />
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-black text-amber-500">
              <Flame size={14} className="fill-amber-500" /> 12
            </span>
          </div>
        </div>

        {/* Chat Message Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {/* AI Message 1 */}
          <div className="flex max-w-[90%] items-start gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-rose-400 text-xs font-bold text-white">
              先
            </div>
            <div className="space-y-2">
              <div className="rounded-tl-xs font-japanese rounded-2xl border border-border bg-card p-3.5 text-sm leading-relaxed text-foreground">
                <ruby>
                  今日<rt className="text-[10px] text-muted-foreground">きょう</rt>
                </ruby>
                は
                <ruby>
                  何<rt className="text-[10px] text-muted-foreground">なに</rt>
                </ruby>
                を
                <ruby>
                  食<rt className="text-[10px] text-muted-foreground">た</rt>
                </ruby>
                べますか？
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <button className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 hover:bg-muted/80">
                  <Volume2 size={12} /> Tinglash
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 hover:bg-muted/80"
                >
                  🇺🇿 Tarjima
                </button>
                <button className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 hover:bg-muted/80">
                  🐢 Sekin
                </button>
              </div>
            </div>
          </div>

          {/* User Message + Smart Correction Card */}
          <div className="ml-auto flex max-w-[90%] items-start justify-end gap-3">
            <div className="space-y-2 text-right">
              <div className="rounded-tr-xs font-japanese inline-block rounded-2xl bg-primary p-3.5 text-left text-sm leading-relaxed text-primary-foreground shadow-sm">
                わたしはラーメンをたべたいです。でも、からいはすきじゃない。
              </div>

              {/* Correction Card */}
              <div className="space-y-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-left text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  <span>✏️</span> Tuzatish
                </div>
                <div className="font-japanese text-[13px] leading-relaxed text-foreground">
                  でも、
                  <s className="font-bold text-rose-500 decoration-rose-500 decoration-2">
                    からいは
                  </s>{' '}
                  <u className="border-b-2 border-emerald-500 font-bold text-emerald-500 no-underline">
                    からいのは
                  </u>{' '}
                  すきじゃない
                  <u className="border-b-2 border-emerald-500 font-bold text-emerald-500 no-underline">
                    です
                  </u>
                  。
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Sifatni ot sifatida ishlatganda <b className="text-foreground">の</b> qo‘shiladi:
                  からい → からい<b className="text-foreground">の</b>. Va です bilan muloyimroq
                  bo‘ladi.
                </p>
              </div>
            </div>
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
              F
            </div>
          </div>

          {/* AI Message 2 */}
          <div className="flex max-w-[90%] items-start gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-rose-400 text-xs font-bold text-white">
              先
            </div>
            <div className="space-y-2">
              <div className="rounded-tl-xs font-japanese rounded-2xl border border-border bg-card p-3.5 text-sm leading-relaxed text-foreground">
                いいですね！🍜 じゃあ、
                <ruby>
                  塩<rt className="text-[10px] text-muted-foreground">しお</rt>
                </ruby>
                ラーメンはどうですか？
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <button className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 hover:bg-muted/80">
                  <Volume2 size={12} /> Tinglash
                </button>
                <button className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 hover:bg-muted/80">
                  🇺🇿 Tarjima
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-border bg-card/40 p-4">
          <div className="flex h-12 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs text-muted-foreground shadow-xs">
            <span className="flex-1 truncate">Yozing yoki bosib turib gapiring…</span>
            <span className="hidden items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium sm:inline-flex">
              ⌨️ Romaji
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mic size={16} />
            </span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs hover:opacity-90">
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR (Vocabulary & Weak Spots) */}
      <aside className="hidden flex-col gap-5 border-l border-border bg-muted/20 p-5 lg:flex">
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Yangi so‘zlar · 3
          </div>
          <div className="space-y-2">
            {[
              { word: '辛い', reading: 'からい · karai', meaning: 'achchiq' },
              { word: '塩', reading: 'しお · shio', meaning: 'tuz' },
              {
                word: '大丈夫',
                reading: 'だいじょうぶ · daijoubu',
                meaning: 'yaxshi, muammo yo‘q',
              },
            ].map((item, idx) => (
              <div
                key={`word-${item.word}-${idx}`}
                className="space-y-0.5 rounded-xl border border-border bg-card p-3"
              >
                <div className="font-japanese flex items-center justify-between text-base font-bold text-foreground">
                  <span>{item.word}</span>
                  <button
                    onClick={() => toggleHeart(item.word)}
                    className={`cursor-pointer text-xs ${
                      activeHeart[item.word]
                        ? 'text-rose-500'
                        : 'text-muted-foreground hover:text-rose-400'
                    }`}
                  >
                    {activeHeart[item.word] ? '♥' : '♡'}
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground">{item.reading}</div>
                <div className="text-xs font-medium text-foreground/80">{item.meaning}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Spots */}
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span>⚠️</span> Zaif joylar
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              の nominalizatsiya
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              は / が
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              て-forma
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="mt-auto border-t border-border/80 pt-3 text-center text-xs text-muted-foreground">
          Aniqlik bugun: <b className="font-bold text-emerald-500">84% ↑</b>
        </div>
      </aside>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                 */
/* ------------------------------------------------------------------ */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLessonTab, setSelectedLessonTab] = useState('N5');

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = safeLocalStorage.getItem('study_planner_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      safeLocalStorage.setItem('study_planner_theme', next ? 'dark' : 'light');
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  useSEO({
    title: t('landing.seoTitle'),
    description: t('landing.seoDescription'),
    canonical: '/',
    keywords: t('landing.seoKeywords'),
  });

  const isJa = language === 'ja';
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: t('landing.navFeatures'), target: 'features' },
    { label: t('landing.navSpeaking'), target: 'app' },
    { label: t('landing.navRoadmap'), target: 'lessons' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
      {/* ======== NAVBAR ======== */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo */}
          <AppLogo size="md" />

          {/* Center: Nav links (desktop) */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link, idx) => (
              <button
                key={`nav-desktop-${link.target}-${idx}`}
                onClick={() => scrollTo(link.target)}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Language switcher (Segmented Desktop) */}
            <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
              <button
                onClick={() => setLanguage('uz')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  language === 'uz'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Oʻzbek tiliga o'tish"
              >
                <UzbekistanFlag className="h-2.5 w-4" />
                <span>UZ</span>
              </button>
              <button
                onClick={() => setLanguage('ja')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  language === 'ja'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="日本語に切り替え"
              >
                <JapanFlag className="h-2.5 w-4" />
                <span>JA</span>
              </button>
            </div>

            {/* Theme switch */}
            <button
              onClick={toggleTheme}
              className="cursor-pointer rounded-lg border border-border p-2 text-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
              title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-muted-foreground" />
              )}
            </button>

            {/* Login (desktop) */}
            <button
              onClick={() => navigate('/login')}
              className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:block"
            >
              {t('landing.navLogin')}
            </button>

            {/* CTA (desktop) */}
            <button
              onClick={() => navigate('/register')}
              className="hidden cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all duration-200 hover:scale-[1.03] hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-95 md:flex"
            >
              <span>{t('landing.navCta')}</span>
              <ArrowRight size={15} />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-2 px-4 py-4">
              {navLinks.map((link, idx) => (
                <button
                  key={`nav-mobile-${link.target}-${idx}`}
                  onClick={() => scrollTo(link.target)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {link.label}
                </button>
              ))}

              {/* Mobile Lang & Theme Row */}
              <div className="flex flex-col gap-2 border-t border-border pb-1 pt-2">
                <div className="flex items-center rounded-xl border border-border bg-card p-1">
                  <button
                    onClick={() => setLanguage('uz')}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                      language === 'uz'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UzbekistanFlag className="h-2.5 w-4" />
                    <span>Oʻzbekcha</span>
                  </button>
                  <button
                    onClick={() => setLanguage('ja')}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                      language === 'ja'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <JapanFlag className="h-2.5 w-4" />
                    <span>日本語</span>
                  </button>
                </div>

                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  {isDark ? (
                    <Sun size={15} className="text-amber-400" />
                  ) : (
                    <Moon size={15} className="text-muted-foreground" />
                  )}
                  <span>{isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
                </button>
              </div>

              <hr className="border-border" />
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-muted"
              >
                {t('landing.navLogin')}
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                {t('landing.navCta')} <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ======== WATERMARK KANJI ACCENTS ======== */}
      <div className="font-japanese pointer-events-none absolute left-6 top-24 -z-10 select-none text-[260px] font-black leading-none text-foreground opacity-[0.02] sm:text-[340px]">
        話
      </div>
      <div className="font-japanese pointer-events-none absolute right-6 top-[850px] -z-10 select-none text-[220px] font-black leading-none text-foreground opacity-[0.02] sm:text-[300px]">
        語
      </div>

      {/* ======== HERO SECTION ======== */}
      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left Column (Copywriting & CTAs) */}
          <div className="space-y-6 lg:space-y-8">
            {/* Eyebrow */}
            <FadeIn
              offsetY={10}
              delay={0.05}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary"
            >
              <span className="h-2 w-2 shrink-0 animate-ping rounded-full bg-primary" />
              <span>{t('landing.eyebrow')}</span>
            </FadeIn>

            {/* Main Headline */}
            <FadeIn offsetY={16} delay={0.12}>
              <h1
                className={`font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl ${isJa ? 'leading-[1.2]' : 'leading-[1.08]'}`}
              >
                {isJa ? (
                  <>
                    日本語で <br />
                    <em className="relative inline-block not-italic text-primary">話そう。</em>{' '}
                    <br />
                    今日から。
                  </>
                ) : (
                  <>
                    Yapon tilida <br />
                    <em className="relative inline-block not-italic text-primary">
                      gapiring.
                    </em>{' '}
                    <br />
                    Bugundan.
                  </>
                )}
              </h1>
            </FadeIn>

            {/* Description */}
            <FadeIn
              offsetY={14}
              delay={0.2}
              className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t('landing.description')}
            </FadeIn>

            {/* Action Buttons */}
            <FadeIn offsetY={12} delay={0.28} className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 active:scale-95"
              >
                {t('landing.ctaPrimary')}
              </button>
              <button
                onClick={() => scrollTo('app')}
                className="cursor-pointer rounded-xl border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground transition-all duration-200 hover:scale-[1.01] hover:bg-muted active:scale-95"
              >
                {t('landing.ctaSecondary')}
              </button>
            </FadeIn>

            {/* Social Proof */}
            <FadeIn
              offsetY={10}
              delay={0.36}
              className="flex items-center gap-4 pt-2 text-sm text-muted-foreground"
            >
              <div className="flex -space-x-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-indigo-600 text-xs font-bold text-white">
                  A
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-white">
                  M
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-emerald-600 text-xs font-bold text-white">
                  S
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-amber-500 text-xs font-bold text-white">
                  D
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-rose-400 text-xs font-bold text-white">
                  K
                </span>
              </div>
              <div>
                <span className="font-bold text-amber-500">★★★★★</span>{' '}
                <b className="font-bold text-foreground">4.9</b>
              </div>
            </FadeIn>
          </div>

          {/* Right Column (Interactive 3D Phone Mockup) */}
          <FadeIn delay={0.3} className="flex justify-center">
            <HeroPhoneMockup />
          </FadeIn>
        </div>
      </section>

      {/* ======== FEATURES SECTION ======== */}
      <section
        id="features"
        className="border-t border-border/60 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl space-y-14">
          <FadeIn className="mx-auto max-w-2xl space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span>{t('landing.navFeatures')}</span>
              <span className="font-japanese text-sm font-medium text-muted-foreground">特徴</span>
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('landing.featuresSubtitle')}
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <FadeIn delay={0.05}>
              <div className="group relative h-full space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                <span className="font-japanese pointer-events-none absolute -right-3 -top-5 text-8xl font-black text-foreground opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
                  話
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary shadow-xs">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t('landing.featureSpeakingTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('landing.featureSpeakingDesc')}
                </p>
              </div>
            </FadeIn>

            {/* Card 2 */}
            <FadeIn delay={0.12}>
              <div className="group relative h-full space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                <span className="font-japanese pointer-events-none absolute -right-3 -top-5 text-8xl font-black text-foreground opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
                  学
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-500 shadow-xs">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t('landing.featureDiagTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('landing.featureDiagDesc')}
                </p>
              </div>
            </FadeIn>

            {/* Card 3 */}
            <FadeIn delay={0.19}>
              <div className="group relative h-full space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                <span className="font-japanese pointer-events-none absolute -right-3 -top-5 text-8xl font-black text-foreground opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
                  炎
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl text-amber-500 shadow-xs">
                  <Flame size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t('landing.featurePlanTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('landing.featurePlanDesc')}
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ======== 3-STEP FLOW SECTION ======== */}
      <section className="border-y border-border/60 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl space-y-14">
          <FadeIn className="mx-auto max-w-2xl space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span>QANDAY ISHLAYDI</span>
              <span className="font-japanese text-sm font-medium text-muted-foreground">
                使い方
              </span>
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('landing.stepsTitle')}
            </h2>
          </FadeIn>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <FadeIn delay={0.05} className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-background text-lg font-black text-primary shadow-xs">
                1
              </div>
              <span className="font-japanese block text-xs font-semibold text-muted-foreground">
                レベル
              </span>
              <h4 className="text-lg font-bold text-foreground">{t('landing.step1Title')}</h4>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('landing.step1Desc')}
              </p>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={0.12} className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-400 bg-background text-lg font-black text-rose-400 shadow-xs">
                2
              </div>
              <span className="font-japanese block text-xs font-semibold text-muted-foreground">
                テーマ
              </span>
              <h4 className="text-lg font-bold text-foreground">{t('landing.step2Title')}</h4>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('landing.step2Desc')}
              </p>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={0.19} className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-background text-lg font-black text-emerald-500 shadow-xs">
                3
              </div>
              <span className="font-japanese block text-xs font-semibold text-muted-foreground">
                話す
              </span>
              <h4 className="text-lg font-bold text-foreground">{t('landing.step3Title')}</h4>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('landing.step3Desc')}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ======== PRODUCT UI SHOWCASE ======== */}
      <section id="app" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl space-y-12">
          <FadeIn className="mx-auto max-w-2xl space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span>MAHSULOT</span>
              <span className="font-japanese text-sm font-medium text-muted-foreground">会話</span>
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('landing.speakingTitle')}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('landing.speakingSubtitle')}
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <ProductShowcase />
          </FadeIn>
        </div>
      </section>

      {/* ======== JLPT LESSONS ROADMAP SECTION ======== */}
      <section
        id="lessons"
        className="border-y border-border/60 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-5xl space-y-10">
          <FadeIn className="mx-auto max-w-2xl space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span>DARSLAR</span>
              <span className="font-japanese text-sm font-medium text-muted-foreground">授業</span>
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('landing.roadmapTitle')}
            </h2>
          </FadeIn>

          {/* Tabs */}
          <div className="flex justify-center gap-2">
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((tab, idx) => (
              <button
                key={`lesson-tab-${tab}-${idx}`}
                onClick={() => setSelectedLessonTab(tab)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                  selectedLessonTab === tab
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Lesson Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Lesson 1 (Done) */}
            <FadeIn delay={0.05}>
              <div className="relative h-full space-y-4 rounded-2xl border border-emerald-500/40 bg-card p-6 shadow-xs">
                <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-xs">
                  <Check size={14} />
                </div>
                <div className="space-y-1">
                  <div className="font-japanese text-2xl font-bold text-foreground">自己紹介</div>
                  <div className="text-sm text-muted-foreground">O‘zini tanishtirish</div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                  <span>100% o‘zlashtirildi</span>
                </div>
                <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>📖 12 so‘z</span>
                  <span>✎ 5 gap</span>
                  <span>⏱ 8 daq</span>
                </div>
              </div>
            </FadeIn>

            {/* Lesson 2 (In progress) */}
            <FadeIn delay={0.12}>
              <div className="relative h-full space-y-4 rounded-2xl border border-primary/40 bg-card p-6 shadow-xs">
                <div className="space-y-1">
                  <div className="font-japanese text-2xl font-bold text-foreground">
                    レストランで
                  </div>
                  <div className="text-sm text-muted-foreground">Restoranda</div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <span>60% bajarildi</span>
                </div>
                <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>📖 15 so‘z</span>
                  <span>✎ 6 gap</span>
                  <span>⏱ 10 daq</span>
                </div>
              </div>
            </FadeIn>

            {/* Lesson 3 (Locked) */}
            <FadeIn delay={0.19}>
              <div className="relative h-full space-y-4 rounded-2xl border border-border/80 bg-card p-6 opacity-60 shadow-xs">
                <div className="absolute right-4 top-4 text-muted-foreground">
                  <Lock size={18} />
                </div>
                <div className="space-y-1">
                  <div className="font-japanese text-2xl font-bold text-foreground">道を聞く</div>
                  <div className="text-sm text-muted-foreground">Yo‘l so‘rash</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Qulflangan</span>
                </div>
                <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>📖 14 so‘z</span>
                  <span>✎ 5 gap</span>
                  <span>⏱ 9 daq</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ======== FINAL CTA SECTION ======== */}
      <section
        id="final-cta"
        className="border-t border-border/60 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <FadeIn offsetY={20} delay={0.1} className="space-y-3">
            <h2 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('landing.finalCtaTitle')}
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('landing.finalCtaDesc')}
            </p>
          </FadeIn>
          <FadeIn offsetY={12} delay={0.2} className="pt-2">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.03] hover:bg-primary/90 active:scale-95"
            >
              {t('landing.finalCtaButton')}
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ======== FOOTER ======== */}
      <footer className="border-t border-border bg-card/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <AppLogo size="md" />
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t('landing.footerSub')}
              </p>
            </div>

            {/* Links Column 1 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Mahsulot
              </h5>
              <div className="space-y-1.5 text-xs text-muted-foreground sm:text-sm">
                <div>
                  <a href="#app" className="hover:text-foreground">
                    Suhbat
                  </a>
                </div>
                <div>
                  <a href="#lessons" className="hover:text-foreground">
                    Darslar
                  </a>
                </div>
                <div>
                  <a href="/speaking-coach" className="hover:text-foreground">
                    AI Coach
                  </a>
                </div>
              </div>
            </div>

            {/* Links Column 2 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Resurslar
              </h5>
              <div className="space-y-1.5 text-xs text-muted-foreground sm:text-sm">
                <div>
                  <a href="/jlpt" className="hover:text-foreground">
                    JLPT N5–N1
                  </a>
                </div>
                <div>
                  <a href="/decks" className="hover:text-foreground">
                    Lug‘atlar (Decks)
                  </a>
                </div>
              </div>
            </div>

            {/* Links Column 3 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Kompaniya
              </h5>
              <div className="space-y-1.5 text-xs text-muted-foreground sm:text-sm">
                <div>
                  <a href="/pricing" className="hover:text-foreground">
                    100% Bepul
                  </a>
                </div>
                <div>
                  <a href="/login" className="hover:text-foreground">
                    Kirish
                  </a>
                </div>
                <div>
                  <a href="/register" className="hover:text-foreground">
                    Ro‘yxatdan o‘tish
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <span>{t('landing.footerCopy')}</span>
            <span className="font-japanese text-sm font-bold tracking-widest text-muted-foreground">
              日本語を話そう
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
