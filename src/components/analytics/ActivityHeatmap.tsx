import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { StudySession } from '../../types';
import { format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';
import {
  ActivityLoggingService,
  UserLearningActivity,
  ActivityDaySummary,
} from '../../services/ActivityLoggingService';
import { DayActivityDetailModal } from './DayActivityDetailModal';
import { useNavigate } from 'react-router-dom';

interface ActivityHeatmapProps {
  sessions?: StudySession[];
  activities?: UserLearningActivity[];
  onStartFlashcards?: () => void;
  onStartSpeaking?: () => void;
}

interface HeatmapDay {
  date: Date;
  dateStr: string;
  minutes: number;
  xp: number;
  itemsCount: number;
  level: number;
  summary: ActivityDaySummary;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  day: HeatmapDay | null;
}

const WEEKDAY_NAMES_UZ: Record<number, string> = {
  0: 'Yakshanba',
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
};

const WEEKDAY_NAMES_JA: Record<number, string> = {
  0: '日曜日',
  1: '月曜日',
  2: '火曜日',
  3: '水曜日',
  4: '木曜日',
  5: '金曜日',
  6: '土曜日',
};

const MONTH_NAMES_UZ: Record<number, string> = {
  0: 'Yanvar',
  1: 'Fevral',
  2: 'Mart',
  3: 'Aprel',
  4: 'May',
  5: 'Iyun',
  6: 'Iyul',
  7: 'Avgust',
  8: 'Sentabr',
  9: 'Oktabr',
  10: 'Noyabr',
  11: 'Dekabr',
};

const MONTH_NAMES_JA: Record<number, string> = {
  0: '1がつ',
  1: '2がつ',
  2: '3がつ',
  3: '4がつ',
  4: '5がつ',
  5: '6がつ',
  6: '7がつ',
  7: '8がつ',
  8: '9がつ',
  9: '10がつ',
  10: '11がつ',
  11: '12がつ',
};

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  sessions = [],
  activities: initialActivities,
  onStartFlashcards,
  onStartSpeaking,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Internal state for activities fetched from Supabase & local cache
  const [activitiesList, setActivitiesList] = useState<UserLearningActivity[]>(
    initialActivities || [],
  );

  useEffect(() => {
    let isMounted = true;
    if (initialActivities && initialActivities.length > 0) {
      setActivitiesList(initialActivities);
    } else {
      ActivityLoggingService.getActivities().then((fetched) => {
        if (isMounted && fetched.length > 0) {
          setActivitiesList(fetched);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialActivities]);

  // Modal State for Day Details
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // 2026 yil to'liq: January - December
  const year2026 = new Date(2026, 0, 1);
  const startDate = startOfYear(year2026);
  const endDate = endOfYear(year2026);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    day: null,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group all activities and legacy study sessions by date
  const days = useMemo(() => {
    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    // Group activities
    const activityMap = ActivityLoggingService.groupActivitiesByDay(activitiesList);

    // Merge sessions if not already in activities
    sessions.forEach((s) => {
      const dateStr = format(new Date(s.startTime), 'yyyy-MM-dd');
      let summary = activityMap.get(dateStr);
      if (!summary) {
        summary = {
          dateStr,
          totalMinutes: 0,
          totalXp: 0,
          totalItems: 0,
          activities: [],
          level: 0,
        };
        activityMap.set(dateStr, summary);
      }

      // Check if session is already recorded as an activity
      const alreadyHasSession = summary.activities.some(
        (a) => a.id === s.id || (a.activityType === 'focus' && a.durationMinutes === s.duration),
      );

      if (!alreadyHasSession) {
        const sessionXp = Math.round((s.duration / 25) * 10);
        summary.totalMinutes += s.duration;
        summary.totalXp += sessionXp;
        summary.totalItems += 1;
        summary.activities.push({
          id: s.id,
          activityType: 'focus',
          activityTitle: language === 'ja' ? '集中セッション' : "Diqqat Mashg'uloti",
          durationMinutes: s.duration,
          itemsCount: 1,
          xpEarned: sessionXp,
          activityDate: dateStr,
          createdAt: s.startTime,
        });
      }
    });

    return interval.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const summary = activityMap.get(dateStr) || {
        dateStr,
        totalMinutes: 0,
        totalXp: 0,
        totalItems: 0,
        activities: [],
        level: 0,
      };

      const score = summary.totalMinutes + Math.round(summary.totalXp / 2) + summary.totalItems * 2;

      let level = 0;
      if (score > 0 && score < 25) level = 1;
      else if (score >= 25 && score < 60) level = 2;
      else if (score >= 60 && score < 120) level = 3;
      else if (score >= 120) level = 4;

      summary.level = level;

      return {
        date,
        dateStr,
        minutes: summary.totalMinutes,
        xp: summary.totalXp,
        itemsCount: summary.totalItems,
        level,
        summary,
      };
    });
  }, [activitiesList, sessions, startDate, endDate, language]);

  // Group days into weeks for the grid
  const weeks = useMemo(() => {
    const result: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = [];

    // Offset to align days of week
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    days.forEach((day) => {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }

    return result;
  }, [days, startDate]);

  const getColor = (level: number, isSelected: boolean) => {
    const borderExtra = isSelected
      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background z-10'
      : '';
    switch (level) {
      case 0:
        return `bg-muted hover:bg-muted-foreground/40 ${borderExtra}`;
      case 1:
        return `bg-primary/25 hover:bg-primary/[0.35] ${borderExtra}`;
      case 2:
        return `bg-primary/[0.45] hover:bg-primary/60 ${borderExtra}`;
      case 3:
        return `bg-primary/70 hover:bg-primary/[0.85] ${borderExtra}`;
      case 4:
        return `bg-primary hover:bg-primary/[0.85] ${borderExtra}`;
      default:
        return `bg-muted ${borderExtra}`;
    }
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, i) => {
      const firstDay = week.find((d) => d !== null);
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ label: format(firstDay.date, 'MMM'), index: i });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  // Tooltip handlers
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, day: HeatmapDay) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setTooltip({
        visible: true,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
        day,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleDayClick = useCallback((day: HeatmapDay) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  }, []);

  // Format tooltip text
  const formatTooltipText = (
    day: HeatmapDay,
  ): { mainActivity: string; subActivity: string; date: string } => {
    const dayOfWeek =
      language === 'ja' ? WEEKDAY_NAMES_JA[day.date.getDay()] : WEEKDAY_NAMES_UZ[day.date.getDay()];
    const monthName =
      language === 'ja' ? MONTH_NAMES_JA[day.date.getMonth()] : MONTH_NAMES_UZ[day.date.getMonth()];
    const dayNum = day.date.getDate();
    const year = day.date.getFullYear();

    const date =
      language === 'ja'
        ? `${year}年 ${monthName} ${dayNum}日 (${dayOfWeek})`
        : `${dayOfWeek}, ${monthName} ${dayNum}, ${year}`;

    if (day.minutes === 0 && day.xp === 0 && day.itemsCount === 0) {
      return {
        mainActivity: language === 'ja' ? '学習なし' : "Faollik yo'q",
        subActivity: language === 'ja' ? 'クリックして詳細' : "Bosib ko'ring",
        date,
      };
    }

    const mainActivity =
      language === 'ja'
        ? `${day.minutes}分 学習 • +${day.xp} XP`
        : `${day.minutes} daqiqa • +${day.xp} XP`;

    const subActivity =
      language === 'ja'
        ? `${day.itemsCount}件のアクティビティ (クリックして詳細)`
        : `${day.itemsCount} ta faoliyat (batafsil ko'rish uchun bosing)`;

    return { mainActivity, subActivity, date };
  };

  const yearRange = '2026';

  return (
    <div ref={containerRef} className="relative min-w-0 py-2 font-sans">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {language === 'ja'
                ? '学習のアクティビティ'
                : language === 'en'
                  ? 'Study activity'
                  : "O'quv Faolligi"}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'ja'
              ? `${yearRange}年 • 各セルをクリックすると当日の詳細が確認できます`
              : language === 'en'
                ? `${yearRange} · Your study days`
                : `${yearRange}-yil · O‘qishga ajratgan kunlaringiz`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{language === 'ja' ? 'すくない' : language === 'en' ? 'Less' : 'Kam'}</span>
          <div className="flex gap-[4px]">
            <div className="h-[12px] w-[12px] rounded-full bg-muted" title="0 faollik" />
            <div className="h-[12px] w-[12px] rounded-full bg-primary/25" title="<25 ball" />
            <div className="h-[12px] w-[12px] rounded-full bg-primary/[0.45]" title="<60 ball" />
            <div className="h-[12px] w-[12px] rounded-full bg-primary/70" title="<120 ball" />
            <div className="h-[12px] w-[12px] rounded-full bg-primary" title="≥120 ball" />
          </div>
          <span>{language === 'ja' ? 'おおい' : language === 'en' ? 'More' : "Ko'p"}</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          {/* Month Labels */}
          <div className="relative ml-[36px] h-6 text-[11px] font-medium text-muted-foreground">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${m.index * 15}px`,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="relative flex gap-3">
            {/* Day Labels */}
            <div className="flex h-[104px] w-7 flex-col justify-between py-1 text-[10px] font-medium text-muted-foreground">
              <span className="leading-none">Mon</span>
              <span className="leading-none">Wed</span>
              <span className="leading-none">Fri</span>
            </div>

            {/* Grid */}
            <div className="flex gap-[4px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[4px]">
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      onMouseEnter={day ? (e) => handleMouseEnter(e, day) : undefined}
                      onMouseLeave={day ? handleMouseLeave : undefined}
                      onClick={day ? () => handleDayClick(day) : undefined}
                      role={day ? 'button' : undefined}
                      tabIndex={day ? (day.dateStr === focusedDate ? 0 : -1) : undefined}
                      onFocus={day ? () => setFocusedDate(day.dateStr) : undefined}
                      aria-label={
                        day
                          ? `${day.dateStr}: ${day.minutes} ${language === 'ja' ? '分' : language === 'en' ? 'minutes' : 'daqiqa'}`
                          : undefined
                      }
                      onKeyDown={
                        day
                          ? (event) => {
                              const offset = {
                                ArrowLeft: -7,
                                ArrowRight: 7,
                                ArrowUp: -1,
                                ArrowDown: 1,
                              }[event.key];
                              if (offset !== undefined) {
                                event.preventDefault();
                                const nextDate = new Date(day.date);
                                nextDate.setDate(nextDate.getDate() + offset);
                                containerRef.current
                                  ?.querySelector<HTMLElement>(
                                    `[data-date="${format(nextDate, 'yyyy-MM-dd')}"]`,
                                  )
                                  ?.focus();
                              }
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleDayClick(day);
                              }
                            }
                          : undefined
                      }
                      data-date={day?.dateStr}
                      className={`h-[11px] w-[11px] rounded-full transition-all duration-200 ${
                        day
                          ? `${getColor(day.level, selectedDay?.dateStr === day.dateStr)} cursor-pointer`
                          : 'cursor-default bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-style Tooltip */}
      {tooltip.visible &&
        tooltip.day &&
        (() => {
          const { mainActivity, subActivity, date } = formatTooltipText(tooltip.day);
          return (
            <div
              ref={tooltipRef}
              className="pointer-events-none absolute z-50 transition-all duration-150"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 8}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="whitespace-nowrap rounded-xl border border-[#3d444d] bg-[#1b1f23] px-3.5 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
                <p className="text-[12px] font-bold leading-tight text-white">{mainActivity}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#C9A961]">{subActivity}</p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{date}</p>
              </div>
              {/* Tooltip Arrow */}
              <div className="flex justify-center">
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #3d444d',
                  }}
                />
              </div>
            </div>
          );
        })()}

      <p className="mt-3 text-sm text-muted-foreground">
        {language === 'ja'
          ? '日付を選ぶと学習の記録を確認できます。'
          : language === 'en'
            ? 'Choose a day to see your study record.'
            : 'Kun ustiga bosib, o‘quv faoliyatingizni ko‘ring.'}
      </p>

      {/* Day Activity Details Modal */}
      <DayActivityDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        daySummary={selectedDay ? selectedDay.summary : null}
        selectedDate={selectedDay ? selectedDay.date : null}
        onStartFlashcards={onStartFlashcards || (() => navigate('/decks'))}
        onStartSpeaking={onStartSpeaking || (() => navigate('/coach'))}
      />
    </div>
  );
};

export default ActivityHeatmap;
