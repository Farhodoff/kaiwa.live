import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  Home,
  Menu,
  MessageSquare,
  Mic,
  Settings as SettingsIcon,
  Shield,
  BarChart3,
  Star,
  Radio,
  Sun,
  Moon,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SessionCompleteModal } from './SessionCompleteModal';
import { RatingReviewModal } from './feedback';
import { useRatingModalStore } from '../stores';
import { useLanguage } from '../context/LanguageContext';
import { useStudyData } from '../context/StudyPlannerContext';
import { useTheme } from '../hooks/useTheme';
import { isAdminEmail, isUserAdmin } from '../utils/admin';
import { AnimatePresence, motion } from 'framer-motion';
import { Sheet, SheetContent } from './ui/sheet';
import { Button } from './ui/Button';
import { AppLogo } from './AppLogo';
import { UzbekistanFlag, JapanFlag, UKFlag } from './common/FlagIcons';
import ErrorBoundary from './ErrorBoundary';
import { GlobalAnnouncementBanner } from './GlobalAnnouncementBanner';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

const Layout: React.FC = () => {
  const { isKeyboardOpen } = useKeyboardOffset();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('study_planner_sidebar_collapsed');
    return saved === 'true';
  });
  const previousSidebarState = useRef<boolean | null>(null);
  const isSpeakingRoute =
    location.pathname === '/speaking-coach' || location.pathname === '/speaking';

  useEffect(() => {
    if (isSpeakingRoute) {
      if (previousSidebarState.current === null) {
        previousSidebarState.current = isCollapsed;
        if (!isCollapsed) setIsCollapsed(true);
      }
      return;
    }

    if (previousSidebarState.current !== null) {
      const previousState = previousSidebarState.current;
      previousSidebarState.current = null;
      if (isCollapsed !== previousState) setIsCollapsed(previousState);
    }
  }, [isSpeakingRoute, isCollapsed]);

  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useStudyData();
  const displayEmail = user?.email || '';
  const isAdmin = Boolean(
    isUserAdmin(user) || (displayEmail && isAdminEmail(displayEmail, (user as any)?.role)),
  );

  const isRatingOpen = useRatingModalStore((s) => s.isOpen);
  const isRatingSubmitting = useRatingModalStore((s) => s.isSubmitting);
  const closeRatingModal = useRatingModalStore((s) => s.closeModal);
  const openRatingModal = useRatingModalStore((s) => s.openModal);
  const submitRatingReview = useRatingModalStore((s) => s.submitReview);
  const initialRating = useRatingModalStore((s) => s.initialRating);
  const initialCategory = useRatingModalStore((s) => s.initialCategory);

  // Telegram WebApp Native BackButton Integration (Supported in WebApp 6.1+)
  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
    if (!tg?.BackButton) return;
    if (typeof tg.isVersionAtLeast === 'function' && !tg.isVersionAtLeast('6.1')) return;

    const isTopLevel = location.pathname === '/' || location.pathname === '/jlpt';
    if (isTopLevel) {
      try {
        tg.BackButton.hide();
      } catch {}
    } else {
      try {
        tg.BackButton.show();
      } catch {}

      const handleTgBack = () => {
        navigate(-1);
      };

      try {
        tg.BackButton.onClick(handleTgBack);
      } catch {}

      return () => {
        try {
          tg.BackButton.offClick(handleTgBack);
        } catch {}
      };
    }
  }, [location.pathname, navigate]);

  const isFullScreenPage = React.useMemo(() => {
    const fullScreenPaths = [
      '/speaking-coach',
      '/speaking',
      '/room',
      '/jlpt/listening',
      '/study-mode',
      '/lesson/',
      '/exams/',
    ];
    return fullScreenPaths.some((p) => location.pathname.startsWith(p));
  }, [location.pathname]);

  const navItems: NavItem[] = useMemo(() => {
    const isJa = language === 'ja';
    const isEn = language === 'en';
    // 100% Japanese (JLPT) Navigation — Dashboard is canonical home (single entry)
    return [
      { name: isJa ? 'ホーム' : isEn ? 'Home' : 'Bosh sahifa', path: '/dashboard', icon: Home },
      { name: isJa ? 'JLPTマスター' : 'JLPT Master', path: '/jlpt', icon: BookOpen },
      {
        name: isJa ? '会話シナリオ' : isEn ? 'Scenarios' : 'Ssenariylar',
        path: '/scenarios?lang=ja',
        icon: MessageSquare,
      },
      {
        name: isJa ? 'AIスピーキング' : isEn ? 'Speaking Coach' : 'Speaking',
        path: '/speaking-coach?lang=ja',
        icon: Mic,
      },
      {
        name: isJa ? 'モノローグ' : 'Monolog',
        path: '/monologue',
        icon: Radio,
      },
      {
        name: isJa ? '復習・フラッシュカード' : isEn ? 'Review' : 'Takrorlash',
        path: '/flashcards',
        icon: Copy,
      },
      { name: isJa ? '進捗・分析' : 'Progress', path: '/progress', icon: BarChart3 },
      {
        name: isJa ? 'レベル診断' : isEn ? 'Diagnostic' : 'Diagnostika',
        path: '/diagnostic',
        icon: Compass,
      },
    ];
  }, [language]);

  const cycleLanguage = () => {
    if (language === 'uz') setLanguage('ja');
    else if (language === 'ja') setLanguage('en');
    else setLanguage('uz');
  };

  const renderLanguageFlagAndCode = (flagClass: string) => {
    if (language === 'uz') {
      return (
        <>
          <UzbekistanFlag className={flagClass} />
          <span>UZ</span>
        </>
      );
    }
    if (language === 'ja') {
      return (
        <>
          <JapanFlag className={flagClass} />
          <span>JA</span>
        </>
      );
    }
    return (
      <>
        <UKFlag className={flagClass} />
        <span>EN</span>
      </>
    );
  };

  const getPageTitle = () => {
    const isJa = language === 'ja';
    const isEn = language === 'en';
    const found = navItems.find((item) => item.path === location.pathname);
    if (found) return found.name;
    if (location.pathname.startsWith('/scenarios')) return isJa ? '会話シナリオ' : 'Scenarios';
    if (location.pathname.startsWith('/speaking-coach'))
      return isJa ? 'AIスピーキング' : 'Speaking';
    if (location.pathname.startsWith('/monologue')) return isJa ? 'モノローグ' : 'Monolog';
    if (location.pathname === '/jlpt') return isJa ? 'JLPTマスター' : 'JLPT Master';
    if (location.pathname === '/dashboard') return isJa ? 'ホーム' : isEn ? 'Home' : 'Bosh sahifa';
    if (location.pathname === '/progress')
      return isJa
        ? '学習進捗 & アナリティクス'
        : isEn
          ? 'Study Statistics & Progress'
          : "O'quv Statistikasi & Progress";
    if (location.pathname === '/admin')
      return isJa
        ? 'システム管理者ダッシュボード'
        : isEn
          ? 'Super Admin Dashboard'
          : 'Super Admin Paneli';
    if (location.pathname === '/personal-plan')
      return isJa ? '個人学習プラン' : isEn ? 'My Study Plan' : 'Shaxsiy Rejam';
    if (location.pathname === '/settings') return isJa ? '設定' : isEn ? 'Settings' : 'Sozlamalar';
    return 'kaiwa.live';
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => {
    return (
      <div className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3.5 py-3">
        {navItems.map((item) => {
          const itemPathname = item.path.split('?')[0];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClick}
              aria-label={item.name}
              className={({ isActive }) => {
                const active =
                  isActive ||
                  location.pathname === itemPathname ||
                  (itemPathname === '/dashboard' && location.pathname === '/');
                return `group relative flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary/10 font-bold text-primary shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`;
              }}
              title={isCollapsed ? item.name : ''}
            >
              {({ isActive }) => {
                const active =
                  isActive ||
                  location.pathname === itemPathname ||
                  (itemPathname === '/dashboard' && location.pathname === '/');
                return (
                  <>
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute left-0 h-6 w-1.5 rounded-r-full bg-primary"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon
                      size={19}
                      className={`shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'group-hover:scale-105'} ${active ? 'text-primary' : 'text-muted-foreground'}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {!isCollapsed && (
                      <span className="truncate font-medium tracking-tight">{item.name}</span>
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full max-w-[100vw] flex-col overflow-hidden bg-background font-sans text-foreground transition-colors duration-300 md:flex-row">
      {/* Mobile Header (Hidden on immersive fullscreen activity pages) */}
      {!isFullScreenPage && (
        <header className="glass-card relative z-30 flex items-center justify-between border-b px-3.5 py-2 pt-[max(env(safe-area-inset-top),0.5rem)] md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <AppLogo size="sm" showText={false} />
            <h1 className="text-gradient truncate pb-0.5 pr-1 text-base font-bold">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-muted/70 text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
              title={isDark ? "Yorug' rejim (Light mode)" : "Qorong'u rejim (Dark mode)"}
              aria-label="Mavzuni almashtirish"
            >
              {isDark ? (
                <Sun size={15} className="text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon size={15} className="text-indigo-400 transition-transform hover:-rotate-12" />
              )}
            </button>

            <button
              type="button"
              onClick={cycleLanguage}
              className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/80 px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
              title={
                language === 'uz'
                  ? '日本語 (JA)'
                  : language === 'ja'
                    ? 'English (EN)'
                    : "O'zbekcha (UZ)"
              }
            >
              {renderLanguageFlagAndCode('h-2.5 w-3.5')}
            </button>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`relative hidden translate-x-0 flex-col md:flex ${isCollapsed ? 'w-20' : 'w-64'} z-30 border-r border-border/70 bg-card/95 backdrop-blur-md transition-all duration-300 ease-in-out`}
      >
        {/* Logo Area */}
        <div
          className={`flex h-16 items-center px-4 py-3 ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-border bg-card`}
        >
          <AppLogo size="md" collapsed={isCollapsed} />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground md:flex"
            aria-label={isCollapsed ? 'Sidebar-ni ochish' : 'Sidebar-ni yopish'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation Links */}
        <NavLinks />

        {/* Bottom Section: Settings, Theme & Admin */}
        <div className="space-y-2 border-t border-border/60 bg-card/80 p-3.5">
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex w-full items-center ${isCollapsed ? 'justify-center' : ''} gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'border border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-xs'
                    : 'border border-rose-500/20 text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-400'
                }`
              }
              title={isCollapsed ? 'Admin Panel' : ''}
            >
              <Shield size={16} className="shrink-0 text-rose-500" />
              {!isCollapsed && <span>{language === 'ja' ? '管理コンソール' : 'Admin Panel'}</span>}
            </NavLink>
          )}

          {/* Quick Rate App & Feedback Button */}
          <button
            type="button"
            onClick={() => openRatingModal()}
            className={`flex w-full items-center ${isCollapsed ? 'justify-center' : ''} gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 shadow-xs transition-all hover:bg-amber-500/20 active:scale-95 dark:text-amber-400`}
            title={
              language === 'ja'
                ? 'アプリを評価・フィードバック'
                : language === 'en'
                  ? 'Rate & Feedback (5★)'
                  : 'Ilovani baholash (5★)'
            }
          >
            <Star size={16} className="shrink-0 fill-amber-400 text-amber-500" />
            {!isCollapsed && (
              <span>
                {language === 'ja' ? 'アプリ評価' : language === 'en' ? 'Rate App' : 'Baholash'}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex flex-1 items-center ${isCollapsed ? 'justify-center' : ''} gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 font-bold text-primary shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`
              }
              title={
                isCollapsed
                  ? language === 'ja'
                    ? '設定'
                    : language === 'en'
                      ? 'Settings'
                      : 'Sozlamalar'
                  : ''
              }
            >
              <SettingsIcon size={16} className="shrink-0" />
              {!isCollapsed && (
                <span className="truncate">
                  {language === 'ja' ? '設定' : language === 'en' ? 'Settings' : 'Sozlamalar'}
                </span>
              )}
            </NavLink>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/80 p-2 text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
              title={isDark ? "Yorug' rejim (Light mode)" : "Qorong'u rejim (Dark mode)"}
              aria-label="Mavzuni almashtirish"
            >
              {isDark ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-indigo-400" />
              )}
            </button>

            {/* Language Cycle Button */}
            <button
              onClick={cycleLanguage}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border/80 bg-muted/80 px-2 py-1.5 text-[11px] font-bold text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
              title={
                language === 'uz'
                  ? '日本語に切り替え (Switch to Japanese)'
                  : language === 'ja'
                    ? 'Switch to English'
                    : "O'zbek tiliga o'tish"
              }
            >
              {renderLanguageFlagAndCode('h-2.5 w-3.5')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex w-full max-w-full flex-1 flex-col overflow-hidden bg-background">
        {!isFullScreenPage && <GlobalAnnouncementBanner />}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            // Lift content above the virtual keyboard (var set by useKeyboardOffset).
            // marginBottom stacks with the class padding instead of overriding it.
            style={{ marginBottom: 'var(--keyboard-offset, 0px)' }}
            className={`w-full max-w-full overflow-x-hidden ${
              isFullScreenPage
                ? 'flex h-full flex-col overflow-hidden'
                : 'h-full overflow-y-auto pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:pb-8'
            }`}
          >
            <ErrorBoundary inline={true} key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isFullScreenPage && (
        <nav
          aria-label="Mobil asosiy navigatsiya"
          className={`glass-card fixed bottom-0 z-40 flex w-full items-center justify-around border-t border-border bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-md transition-transform duration-200 md:hidden ${
            isKeyboardOpen ? 'pointer-events-none translate-y-full' : 'translate-y-0'
          }`}
        >
          {[
            {
              name: language === 'ja' ? 'ホーム' : language === 'en' ? 'Home' : 'Bosh sahifa',
              path: '/dashboard',
              icon: Home,
            },
            {
              name: 'JLPT',
              path: '/jlpt',
              icon: BookOpen,
            },
            { name: t('nav.aiCoach') || 'Speaking', path: '/speaking-coach', icon: Mic },
            {
              name: language === 'ja' ? '復習' : language === 'en' ? 'Review' : 'Takrorlash',
              path: '/flashcards',
              icon: Copy,
            },
            {
              name: language === 'ja' ? '進捗' : language === 'en' ? 'Progress' : 'Progress',
              path: '/progress',
              icon: BarChart3,
            },
          ].map((item) => {
            const isItemActive =
              location.pathname.startsWith(item.path) ||
              (item.path === '/dashboard' && location.pathname === '/') ||
              (item.path === '/speaking-coach' && location.pathname.startsWith('/speaking')) ||
              (item.path === '/flashcards' &&
                (location.pathname.startsWith('/flashcards') ||
                  location.pathname.startsWith('/study-mode')));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.name}
                aria-current={isItemActive ? 'page' : undefined}
                className={`flex h-12 w-14 cursor-pointer flex-col items-center justify-center rounded-xl p-1 transition-all duration-200 active:scale-95 ${
                  isItemActive
                    ? 'bg-primary/10 font-bold text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={20} className="mb-1" strokeWidth={isItemActive ? 2.5 : 2} />
                <span className="max-w-full truncate text-[10px] font-medium leading-none">
                  {item.name}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Barcha bo'limlar"
            className={`flex h-12 w-14 cursor-pointer flex-col items-center justify-center rounded-xl p-1 transition-all duration-200 active:scale-95 ${
              isSidebarOpen
                ? 'bg-primary/10 font-bold text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Menu size={20} className="mb-1" />
            <span className="text-[10px] font-medium leading-none">
              {language === 'ja' ? 'すべて' : 'Barchasi'}
            </span>
          </button>
        </nav>
      )}

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="flex w-72 flex-col bg-card p-0">
          <div className="flex h-16 items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <AppLogo size="sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks onClick={() => setSidebarOpen(false)} />
          </div>
          <div className="space-y-2 border-t border-border/60 bg-card/80 p-3.5">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                openRatingModal();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 active:scale-95 dark:text-amber-400"
            >
              <Star size={16} className="shrink-0 fill-amber-400 text-amber-500" />
              <span>
                {language === 'ja'
                  ? 'アプリを評価する'
                  : language === 'en'
                    ? 'Rate App'
                    : 'Ilovani baholash'}
              </span>
            </button>

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'border border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-xs'
                      : 'border border-rose-500/20 text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-400'
                  }`
                }
              >
                <Shield size={16} className="shrink-0 text-rose-500" />
                <span>Admin Panel</span>
              </NavLink>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              <NavLink
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 font-bold text-primary shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`
                }
              >
                <SettingsIcon size={16} className="shrink-0" />
                <span>
                  {language === 'ja' ? '設定' : language === 'en' ? 'Settings' : 'Sozlamalar'}
                </span>
              </NavLink>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/80 p-2 text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
                title={isDark ? "Yorug' rejim (Light mode)" : "Qorong'u rejim (Dark mode)"}
                aria-label="Mavzuni almashtirish"
              >
                {isDark ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-indigo-400" />
                )}
              </button>

              <button
                onClick={cycleLanguage}
                className="flex shrink-0 items-center gap-1 rounded-xl border border-border/80 bg-muted/80 px-2 py-2 text-[11px] font-bold text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground active:scale-95"
                title={
                  language === 'uz'
                    ? '日本語に切り替え (Switch to Japanese)'
                    : language === 'ja'
                      ? 'Switch to English'
                      : "O'zbek tiliga o'tish"
                }
              >
                {renderLanguageFlagAndCode('h-2.5 w-3.5')}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Modals */}
      <SessionCompleteModal />
      <RatingReviewModal
        isOpen={isRatingOpen}
        onClose={closeRatingModal}
        onSubmit={submitRatingReview}
        isSubmitting={isRatingSubmitting}
        initialRating={initialRating}
        initialCategory={initialCategory}
      />
    </div>
  );
};

export default Layout;
