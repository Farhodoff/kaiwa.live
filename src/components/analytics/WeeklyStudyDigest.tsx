import React, { useMemo, useState, useEffect } from 'react';
import { Flame, Zap, Clock, Mic, Share2, Check, Calendar, Layers, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  ActivityLoggingService,
  UserLearningActivity,
} from '../../services/ActivityLoggingService';
import { useAuthStore, useGamificationInfo } from '../../stores';

export interface WeeklyStudyDigestProps {
  activities?: UserLearningActivity[];
  compact?: boolean;
  onNavigateToDecks?: () => void;
  onNavigateToSpeaking?: () => void;
}

interface DayStat {
  date: Date;
  dateKey: string;
  dayName: string;
  minutes: number;
  xp: number;
  items: number;
  isToday: boolean;
  isActive: boolean;
}

const UZ_DAY_ABBR: Record<string, string> = {
  '0': 'Ya',
  '1': 'Du',
  '2': 'Se',
  '3': 'Ch',
  '4': 'Pa',
  '5': 'Ju',
  '6': 'Sh',
};

export const WeeklyStudyDigest: React.FC<WeeklyStudyDigestProps> = ({
  activities: initialActivities,
  compact = false,
  onNavigateToDecks,
  onNavigateToSpeaking,
}) => {
  const user = useAuthStore((s) => s.user);
  const [activities, setActivities] = useState<UserLearningActivity[]>(initialActivities || []);
  const [selectedDay, setSelectedDay] = useState<DayStat | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!initialActivities) {
      ActivityLoggingService.getActivities(user?.id || null).then((data) => {
        setActivities(data);
      });
    } else {
      setActivities(initialActivities);
    }
  }, [initialActivities, user?.id]);

  const { currentStreak } = useGamificationInfo();
  const streakDays = currentStreak || 1;

  // Build the last 7 days window (from 6 days ago up to today)
  const last7Days: DayStat[] = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const dayMap = ActivityLoggingService.groupActivitiesByDay(activities);

    const days: DayStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      const dayOfWeekIndex = d.getDay().toString();
      const summary = dayMap.get(dateKey);

      const minutes = summary?.totalMinutes || 0;
      const xp = summary?.totalXp || 0;
      const items = summary?.totalItems || 0;

      days.push({
        date: d,
        dateKey,
        dayName: UZ_DAY_ABBR[dayOfWeekIndex] || format(d, 'EEE'),
        minutes,
        xp,
        items,
        isToday: dateKey === todayKey,
        isActive: minutes > 0 || xp > 0 || items > 0,
      });
    }
    return days;
  }, [activities]);

  // Aggregate weekly metrics
  const weeklyTotals = useMemo(() => {
    const sevenDaysKeys = new Set(last7Days.map((d) => d.dateKey));

    const weekActivities = activities.filter((act) => {
      const key = act.activityDate || format(new Date(act.createdAt), 'yyyy-MM-dd');
      return sevenDaysKeys.has(key);
    });

    let minutes = 0;
    let xp = 0;
    let flashcards = 0;
    let speakingSessions = 0;
    let lessons = 0;

    weekActivities.forEach((act) => {
      minutes += act.durationMinutes || 0;
      xp += act.xpEarned || 0;
      if (act.activityType === 'flashcards') flashcards += act.itemsCount || 1;
      if (act.activityType === 'speaking') speakingSessions += 1;
      if (act.activityType === 'lesson') lessons += 1;
    });

    const activeDaysCount = last7Days.filter((d) => d.isActive).length;

    return {
      minutes,
      xp,
      flashcards,
      speakingSessions,
      lessons,
      activeDaysCount,
    };
  }, [activities, last7Days]);

  const maxMinutesInWeek = Math.max(1, ...last7Days.map((d) => d.minutes));

  // Motivational message
  const motivation = useMemo(() => {
    const count = weeklyTotals.activeDaysCount;
    if (count >= 5) {
      return {
        title: "Olov o'chmayapti! 🔥",
        desc: `Haftaning ${count}/7 kunida faol o'rgandingiz. Ajoyib intizom!`,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      };
    }
    if (count >= 3) {
      return {
        title: "Yaxshi sur'at! ⚡",
        desc: `Haftada ${count} kun dars qildingiz. Olovni saqlab qoling!`,
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      };
    }
    return {
      title: 'Yangi boshlanish! 🌱',
      desc: 'Bugun 5 daqiqalik dars bilan haftalik olovni yoqing!',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    };
  }, [weeklyTotals.activeDaysCount]);

  const handleShare = () => {
    const text = [
      `🇯🇵 kaiwa.live — Haftalik O'rganish Hisoboti:`,
      `🔥 Ketma-ketlik: ${streakDays} kun`,
      `⏱️ Jami vaqt: ${weeklyTotals.minutes} daqiqa`,
      `⚡ Olingan tajriba: ${weeklyTotals.xp} XP`,
      `🗂️ Takrorlangan so'zlar: ${weeklyTotals.flashcards} ta`,
      `🎙️ Speaking suhbatlar: ${weeklyTotals.speakingSessions} ta`,
      `Faol kunlar: 7 kundan ${weeklyTotals.activeDaysCount} kunda`,
      `🌐 https://kaiwa.live`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div
      className={`space-y-5 rounded-3xl border border-border bg-card shadow-sm ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 text-white shadow-sm">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-foreground">Haftalik Digest & Sur'at</h3>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-500 dark:text-indigo-400">
                7 kun
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Oxirgi 7 kundagi o'rganish dinamikasi va darslar tahlili.
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
          title="Hisobotni nusxalash"
          aria-label="Hisobotni nusxalash"
        >
          {copiedShare ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-[11px] text-emerald-500">Nusxalandi!</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span className="hidden text-[11px] sm:inline">Nusxa olish</span>
            </>
          )}
        </button>
      </div>

      {/* Motivational Banner */}
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${motivation.color}`}
      >
        <div className="space-y-0.5">
          <p className="text-xs font-black">{motivation.title}</p>
          <p className="text-[11px] text-muted-foreground">{motivation.desc}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-background/80 px-2.5 py-1 text-xs font-black text-foreground shadow-xs">
          <Flame size={14} className="fill-amber-500 text-amber-500" />
          <span>{streakDays} kun</span>
        </div>
      </div>

      {/* 7-Day Visual Activity Bars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold">
            <Calendar size={13} /> Kunlik Faollik (Daqiqalar)
          </span>
          <span className="text-[11px]">{weeklyTotals.activeDaysCount}/7 kun faol</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {last7Days.map((day) => {
            const heightPercent =
              day.minutes > 0
                ? Math.max(18, Math.round((day.minutes / maxMinutesInWeek) * 100))
                : 8;

            const isSelected = selectedDay?.dateKey === day.dateKey;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                    : day.isToday
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/50'
                }`}
                aria-label={`${day.dayName}: ${day.minutes} daqiqa`}
              >
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {day.minutes > 0 ? `${day.minutes}m` : '-'}
                </span>

                <div className="flex h-16 w-full items-end overflow-hidden rounded-xl bg-muted/60 p-1">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all ${
                      day.isActive
                        ? day.isToday
                          ? 'bg-gradient-to-t from-primary to-indigo-400'
                          : 'bg-gradient-to-t from-indigo-500 to-purple-500'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                </div>

                <span
                  className={`text-[11px] font-black ${
                    day.isToday ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {day.dayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection Bar if clicked */}
      {selectedDay && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-muted/50 p-3 text-xs animate-in fade-in">
          <div className="space-y-0.5">
            <span className="font-extrabold text-foreground">
              {format(selectedDay.date, 'd-MMMM, yyyy')} ({selectedDay.dayName})
            </span>
            <p className="text-[11px] text-muted-foreground">
              {selectedDay.minutes} daqiqa dars · {selectedDay.xp} XP to'plandi ·{' '}
              {selectedDay.items} ta element
            </p>
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="text-[11px] font-bold text-indigo-500 hover:underline"
          >
            Yopish
          </button>
        </div>
      )}

      {/* 4 Core Weekly Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="space-y-1 rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={13} className="text-indigo-500" />
            <span>O'qish Vaqti</span>
          </div>
          <p className="text-base font-black text-foreground">
            {weeklyTotals.minutes}{' '}
            <span className="text-xs font-normal text-muted-foreground">daq</span>
          </p>
        </div>

        <div className="space-y-1 rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap size={13} className="text-amber-500" />
            <span>To'plangan XP</span>
          </div>
          <p className="text-base font-black text-foreground">
            {weeklyTotals.xp} <span className="text-xs font-normal text-muted-foreground">XP</span>
          </p>
        </div>

        <div
          onClick={onNavigateToDecks}
          className={`space-y-1 rounded-2xl border border-border bg-card p-3 shadow-xs transition-all ${
            onNavigateToDecks ? 'cursor-pointer hover:border-emerald-500/40 active:scale-95' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Layers size={13} className="text-emerald-500" />
            <span>So'z & Iboralar</span>
          </div>
          <p className="text-base font-black text-foreground">
            {weeklyTotals.flashcards}{' '}
            <span className="text-xs font-normal text-muted-foreground">ta</span>
          </p>
        </div>

        <div
          onClick={onNavigateToSpeaking}
          className={`space-y-1 rounded-2xl border border-border bg-card p-3 shadow-xs transition-all ${
            onNavigateToSpeaking ? 'cursor-pointer hover:border-rose-500/40 active:scale-95' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Mic size={13} className="text-rose-500" />
            <span>AI Speaking</span>
          </div>
          <p className="text-base font-black text-foreground">
            {weeklyTotals.speakingSessions}{' '}
            <span className="text-xs font-normal text-muted-foreground">suhbat</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStudyDigest;
