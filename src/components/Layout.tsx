import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Home,
  Menu,
  MessageSquare,
  Mic,
  Settings as SettingsIcon,
  BarChart3,
  Radio,
  ClipboardCheck,
} from 'lucide-react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RatingReviewModal } from './feedback';
import { useRatingModalStore } from '../stores';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { Button } from './ui/Button';
import { AppLogo } from './AppLogo';
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
  const { language } = useLanguage();
  const isRatingOpen = useRatingModalStore((s) => s.isOpen);
  const isRatingSubmitting = useRatingModalStore((s) => s.isSubmitting);
  const closeRatingModal = useRatingModalStore((s) => s.closeModal);
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
    return [
      { name: isJa ? '今日' : isEn ? 'Today' : 'Bugun', path: '/dashboard', icon: Home },
      { name: isJa ? 'レッスン' : isEn ? 'Lessons' : 'Darslar', path: '/jlpt', icon: BookOpen },
      { name: isJa ? '復習' : isEn ? 'Review' : 'Takrorlash', path: '/flashcards', icon: Copy },
      {
        name: isJa ? '模擬試験' : isEn ? 'Exams' : 'Imtihonlar',
        path: '/exams',
        icon: ClipboardCheck,
      },
      {
        name: isJa ? '学習結果' : isEn ? 'Results' : 'Natijalar',
        path: '/progress',
        icon: BarChart3,
      },
    ];
  }, [language]);

  const isNavActive = (path: string) => {
    const pathname = path.split('?')[0];
    if (path === '/speaking-coach?lang=ja')
      return ['/speaking-coach', '/speaking'].includes(location.pathname);
    if (path === '/jlpt') {
      return (
        location.pathname.startsWith('/lesson/') ||
        location.pathname === '/roadmap' ||
        ['/jlpt/vocabulary', '/jlpt/kanji', '/jlpt/grammar'].includes(location.pathname) ||
        (location.pathname === '/jlpt' &&
          !['mock', 'mistakes', 'insights'].includes(
            new URLSearchParams(location.search).get('tab') || '',
          ))
      );
    }
    if (path === '/exams')
      return (
        location.pathname.startsWith('/exams') ||
        (location.pathname === '/jlpt' &&
          new URLSearchParams(location.search).get('tab') === 'mock')
      );
    if (path === '/flashcards')
      return (
        location.pathname.startsWith('/flashcards') || location.pathname.startsWith('/study-mode')
      );
    return location.pathname === pathname || (path === '/dashboard' && location.pathname === '/');
  };

  const getPageTitle = () => {
    const isJa = language === 'ja';
    const isEn = language === 'en';
    const topicTitles: Record<string, string> = {
      '/jlpt/vocabulary': isJa ? '語彙' : isEn ? 'Vocabulary' : 'Lug‘at',
      '/jlpt/kanji': isJa ? '漢字' : 'Kanji',
      '/jlpt/grammar': isJa ? '文法' : isEn ? 'Grammar' : 'Grammatika',
    };
    if (topicTitles[location.pathname]) return topicTitles[location.pathname];
    const found = navItems.find((item) => isNavActive(item.path));
    if (found) return found.name;
    if (location.pathname.startsWith('/scenarios')) return isJa ? '会話シナリオ' : 'Scenarios';
    if (location.pathname.startsWith('/speaking-coach'))
      return isJa ? 'AIスピーキング' : 'Speaking';
    if (location.pathname.startsWith('/monologue')) return isJa ? 'モノローグ' : 'Monolog';
    if (location.pathname === '/jlpt') return 'JLPT';
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
    if (location.pathname === '/settings') return isJa ? '設定' : isEn ? 'Settings' : 'Sozlamalar';
    return 'kaiwa.live';
  };

  const NavLinks = ({
    onClick,
    expanded = false,
  }: {
    onClick?: () => void;
    expanded?: boolean;
  }) => {
    const collapsed = isCollapsed && !expanded;
    const sidebarItems: NavItem[] = [
      ...navItems,
      {
        path: '/speaking-coach?lang=ja',
        icon: Mic,
        name: language === 'ja' ? 'AI会話' : language === 'en' ? 'AI conversation' : 'AI suhbat',
      },
      {
        path: '/scenarios?lang=ja',
        icon: MessageSquare,
        name: language === 'ja' ? 'シナリオ' : language === 'en' ? 'Scenarios' : 'Ssenariylar',
      },
      {
        path: '/monologue',
        icon: Radio,
        name: language === 'ja' ? 'モノローグ' : language === 'en' ? 'Monologue' : 'Monolog',
      },
    ];
    return (
      <nav
        aria-label={
          language === 'ja'
            ? 'メインメニュー'
            : language === 'en'
              ? 'Main menu'
              : 'Asosiy bo‘limlar'
        }
        className="sidebar-navigation scrollbar-hide flex-1 overflow-y-auto"
      >
        {sidebarItems.map((item) => {
          const active = isNavActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClick}
              className="app-sidebar-link"
              data-active={active}
              data-collapsed={collapsed}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
              title={item.name}
            >
              <item.icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className="shrink-0"
                aria-hidden="true"
              />
              {!collapsed && <span className="min-w-0 truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full max-w-[100vw] flex-col overflow-hidden bg-background font-sans text-foreground transition-colors duration-300 md:flex-row">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-4 focus:text-foreground"
        >
          {language === 'uz'
            ? 'Asosiy mazmunga o‘tish'
            : language === 'ja'
              ? '本文へスキップ'
              : 'Skip to main content'}
        </a>
        {/* Mobile Header (Hidden on immersive fullscreen activity pages) */}
        {!isFullScreenPage && (
          <header className="glass-card relative z-30 flex items-center justify-between border-b px-3.5 py-2 pt-[max(env(safe-area-inset-top),0.5rem)] md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label={
                  language === 'uz'
                    ? 'Barcha bo‘limlar'
                    : language === 'ja'
                      ? 'メニューを開く'
                      : 'Open menu'
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
              <AppLogo size="sm" showText={false} />
              <p className="truncate pb-0.5 pr-1 text-base font-bold">{getPageTitle()}</p>
            </div>
          </header>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`relative hidden shrink-0 translate-x-0 flex-col md:flex ${isCollapsed ? 'w-16' : 'w-52'} z-30 border-r border-border/70 bg-card/95 backdrop-blur-md transition-all duration-300 ease-in-out`}
        >
          {/* Logo Area */}
          <div
            className={`flex shrink-0 items-center ${isCollapsed ? 'flex-col gap-1.5 px-2 py-2.5' : 'h-[60px] justify-between px-3 py-2'} border-b border-border bg-card`}
          >
            <AppLogo size="sm" showText={false} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden shrink-0 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground md:flex ${isCollapsed ? 'h-8 w-10' : ''}`}
              aria-label={isCollapsed ? 'Sidebar-ni ochish' : 'Sidebar-ni yopish'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>

          {/* Navigation Links */}
          <NavLinks />

          {/* Bottom Section: Settings */}
          <div
            className={`shrink-0 space-y-2 border-t border-border/60 bg-card/80 ${isCollapsed ? 'px-2 py-2.5' : 'p-2.5'}`}
          >
            <div
              className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col [&>*]:min-h-9 [&>*]:w-full [&>*]:justify-center' : ''}`}
            >
              <NavLink
                to="/settings"
                className="app-sidebar-link w-full"
                data-active={location.pathname === '/settings'}
                data-collapsed={isCollapsed}
                aria-label={
                  language === 'ja' ? '設定' : language === 'en' ? 'Settings' : 'Sozlamalar'
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
            {navItems.map((item) => {
              const isItemActive = isNavActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.name}
                  aria-current={isItemActive ? 'page' : undefined}
                  className={`flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl px-0.5 py-1 transition-colors duration-200 active:scale-95 ${
                    isItemActive
                      ? 'bg-primary/10 font-bold text-primary shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon size={20} className="mb-1" strokeWidth={isItemActive ? 2.5 : 2} />
                  <span className="max-w-full text-[11px] font-medium leading-none sm:text-xs">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* Mobile Drawer (Sheet) */}
        <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="flex w-64 max-w-[85vw] flex-col bg-card p-0"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">
              {language === 'uz' ? 'Barcha bo‘limlar' : language === 'ja' ? 'メニュー' : 'Menu'}
            </SheetTitle>
            <div className="flex h-16 items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <AppLogo size="sm" showText={false} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks expanded onClick={() => setSidebarOpen(false)} />
            </div>
            <div className="space-y-2 border-t border-border/60 bg-card/80 p-3.5">
              <div className="flex items-center gap-1.5 pt-1">
                <NavLink
                  to="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="app-sidebar-link w-full"
                  data-active={location.pathname === '/settings'}
                >
                  <SettingsIcon size={16} className="shrink-0" />
                  <span>
                    {language === 'ja' ? '設定' : language === 'en' ? 'Settings' : 'Sozlamalar'}
                  </span>
                </NavLink>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Global Modals */}
        <RatingReviewModal
          isOpen={isRatingOpen}
          onClose={closeRatingModal}
          onSubmit={submitRatingReview}
          isSubmitting={isRatingSubmitting}
          initialRating={initialRating}
          initialCategory={initialCategory}
        />
      </div>
    </MotionConfig>
  );
};

export default Layout;
