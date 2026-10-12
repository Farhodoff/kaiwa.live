import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { initTelegramAuth, getTelegramWebAppUser, isTelegramWebApp } from '../utils/telegramAuth';
import {
  Flame,
  Zap,
  BookOpen,
  Layers,
  Mic,
  FileCheck2,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore, useGamificationInfo, useSettingsStore } from '../stores';

export const TelegramMiniAppPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore((s) => s.user);

  // If explicitly requested to redirect immediately
  const shouldAutoRedirect = searchParams.get('redirect') === 'true';

  const [tgUser, setTgUser] = useState(() => getTelegramWebAppUser());

  useEffect(() => {
    initTelegramAuth();
    const detected = getTelegramWebAppUser();
    if (detected) {
      setTgUser(detected);
    }

    // Telegram WebApp viewport initialization
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) {
          tg.setHeaderColor(tg.colorScheme === 'light' ? '#ffffff' : '#0f172a');
        }
      } catch (err) {
        console.warn('[TelegramMiniApp] WebApp init error:', err);
      }
    }

    if (shouldAutoRedirect) {
      navigate('/jlpt', { replace: true });
    }
  }, [shouldAutoRedirect, navigate]);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } catch {}
  };

  const displayName =
    tgUser?.first_name ||
    authUser?.user_metadata?.first_name ||
    authUser?.user_metadata?.full_name ||
    "O'quvchi";

  const username = tgUser?.username || authUser?.user_metadata?.username;
  const avatarUrl = tgUser?.photo_url || authUser?.user_metadata?.avatar_url;

  const { totalXp, currentStreak } = useGamificationInfo();
  const settings = useSettingsStore((s) => s.settings);
  const streakDays = currentStreak || 1;
  const displayXp = totalXp || 120;
  const targetLevel = (settings as any)?.targetLevel || 'N5';

  const quickActions = [
    {
      id: 'lesson',
      title: 'Bugungi Dars',
      desc: 'Minna darsini davom eting',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      badge: targetLevel,
      route: '/jlpt?tab=lessons',
    },
    {
      id: 'flashcards',
      title: 'SRS Fleshkartalar',
      desc: 'Lugat va ierarxik takrorlash',
      icon: Layers,
      color: 'from-amber-500 to-orange-600',
      badge: '5 daq',
      route: '/flashcards',
    },
    {
      id: 'speaking',
      title: 'Yuki AI Speaking',
      desc: 'Real ovozli yaponcha muloqot',
      icon: Mic,
      color: 'from-rose-500 to-pink-600',
      badge: 'Live',
      route: '/speaking',
    },
    {
      id: 'quiz',
      title: 'JLPT Tezkor Quiz',
      desc: 'Bilimingizni sinab koring',
      icon: FileCheck2,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Mini',
      route: '/jlpt',
    },
  ];

  const handleActionClick = (route: string) => {
    triggerHaptic('medium');
    navigate(route);
  };

  const handleOpenFullWeb = () => {
    triggerHaptic('light');
    navigate('/jlpt');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md select-none flex-col justify-between bg-background p-4 text-foreground duration-200 animate-in fade-in sm:p-6">
      {/* Top Header Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-12 w-12 rounded-2xl border-2 border-indigo-500/30 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-black text-white shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black leading-tight text-foreground sm:text-lg">
                  Konnichiwa, {displayName}!
                </h1>
                <Sparkles size={14} className="fill-amber-400 text-amber-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                {username ? `@${username}` : 'Nihongo Talk Mini App'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-500">
              <Flame size={14} className="fill-amber-500" /> {streakDays} kun
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-500">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Daraja
              </span>
              <p className="text-sm font-black text-foreground">JLPT {targetLevel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Jami Tajriba
              </span>
              <p className="text-sm font-black text-foreground">{displayXp} XP</p>
            </div>
          </div>
        </div>

        {/* Weekly Consistency Progress Bar */}
        <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-extrabold text-foreground">
              🔥 Haftalik Sur'at
            </span>
            <span className="text-[11px] font-bold text-indigo-500">
              {streakDays} kunlik ketma-ketlik
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 pt-1">
            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((day, idx) => {
              const isPastOrToday = idx < Math.min(7, streakDays);
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`h-2 w-full rounded-full transition-all ${
                      isPastOrToday
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-xs'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                  <span className="text-[9px] font-bold text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Drills Section */}
        <div className="space-y-2.5 pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Tezkor Amallar
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleActionClick(action.route)}
                  className="group flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition-all duration-150 hover:border-indigo-500/40 hover:bg-muted/60 active:scale-[0.97]"
                >
                  <div className="flex w-full items-start justify-between">
                    <div
                      className={`rounded-xl bg-gradient-to-br p-2.5 ${action.color} text-white shadow-md transition-transform group-hover:scale-105`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {action.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold text-foreground transition-colors group-hover:text-indigo-500">
                      {action.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Switch to Full Web App */}
      <div className="space-y-2 pb-2 pt-6">
        <button
          type="button"
          onClick={handleOpenFullWeb}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-black text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-[0.98] sm:text-sm"
        >
          <span>To'liq Veb Platformani Ochish</span>
          <ChevronRight size={16} />
        </button>

        <p className="text-center text-[10px] text-muted-foreground">
          {isTelegramWebApp()
            ? '⚡ Telegram WebApp orqali sinxronlashtirildi'
            : '🌐 Nihongo Talk Mobile Rejimida ishlamoqda'}
        </p>
      </div>
    </div>
  );
};

export default TelegramMiniAppPage;
