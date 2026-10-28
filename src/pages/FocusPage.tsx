import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useFocusTimerContext } from '../context/FocusTimerContext';
import { useLanguage } from '../context/LanguageContext';
import FocusControls from '../components/focus/FocusControls';
import FocusTimer from '../components/focus/FocusTimer';
import { PersonalLearningPlanService } from '../services/PersonalLearningPlanService';
import { LearningSignalService } from '../services/LearningSignalService';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

const FocusPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    addSession,
    awardXP,
    tasks: _tasks,
    updateTaskStatus,
    user,
    primaryLanguage,
  } = useStudyData();
  const {
    focusState,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    setCustomTime,
    setFocusTask,
  } = useFocusTimerContext();
  const { language } = useLanguage();
  const { haptics } = useTelegramWebApp();

  const [activeDurationMins, setActiveDurationMins] = useState<number>(25);

  // Ringtone State
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Calculated Progress
  const progress =
    ((activeDurationMins * 60 - focusState.timeLeft) / (activeDurationMins * 60)) * 100;

  const saveSession = useCallback(async () => {
    let taskCompleted = false;

    if (focusState.selectedTaskId) {
      if (window.confirm('Tanlangan vazifani tugatdingizmi?')) {
        await updateTaskStatus(focusState.selectedTaskId, 'done');
        taskCompleted = true;
      }
    }

    addSession({
      subjectId: focusState.selectedSubjectId || undefined,
      startTime: new Date(Date.now() - activeDurationMins * 60 * 1000).toISOString(),
      duration: activeDurationMins,
      type: 'focus',
      completed: true,
    });

    // Dynamic XP Award: 10 XP per minute completed
    await awardXP(activeDurationMins * 10);

    // Sync with Learning Activity Log & Gamification Quests
    try {
      await ActivityLoggingService.logActivity(
        {
          activityType: 'focus',
          activityTitle: `${activeDurationMins} daqiqalik Pomodoro Fokus`,
          durationMinutes: activeDurationMins,
          itemsCount: 1,
          xpEarned: 0,
          metadata: {
            mode: focusState.mode,
            taskId: focusState.selectedTaskId,
          },
        },
        user?.id,
      );
    } catch (e) {
      console.warn('[FocusPage] Activity logging warning:', e);
    }

    // Sync with Personal Learning Plan & Learning Signals
    const activeUserId = user?.id || 'guest';
    const activeGoal = PersonalLearningPlanService.getActiveGoal(activeUserId);
    if (activeGoal && activeGoal.status === 'active') {
      LearningSignalService.recordSignal({
        id: `focus_session_${Date.now()}`,
        type: 'completed_lesson',
        language: activeGoal.language || primaryLanguage || 'en',
        userId: activeUserId,
        timestamp: new Date().toISOString(),
        lessonId: focusState.selectedTaskId || 'focus_pomodoro',
        level: activeGoal.currentLevel || 'A1',
        score: activeDurationMins,
        total: activeGoal.dailyMinutes || 45,
        percentage: Math.min(
          100,
          Math.round((activeDurationMins / (activeGoal.dailyMinutes || 45)) * 100),
        ),
        newCardsCreated: 0,
        mistakesCount: 0,
      }).catch(() => {});
    }

    if (taskCompleted) setFocusTask(null);
  }, [
    activeDurationMins,
    addSession,
    awardXP,
    focusState.mode,
    focusState.selectedSubjectId,
    focusState.selectedTaskId,
    primaryLanguage,
    setFocusTask,
    updateTaskStatus,
    user?.id,
  ]);

  const handleTimerEnd = useCallback(() => {
    haptics.notification('success');
    if (focusState.mode === 'focus') {
      saveSession();
    }
    resetTimer();
  }, [focusState.mode, resetTimer, haptics, saveSession]);

  // Watch for timer completion via focusState
  useEffect(() => {
    if (focusState.timeLeft === 0 && !focusState.isActive) {
      handleTimerEnd();
    }
  }, [focusState.timeLeft, focusState.isActive, handleTimerEnd]);

  const handleStartClick = () => {
    haptics.impact('medium');
    if (focusState.isActive) {
      pauseTimer();
      return;
    }
    startTimer();
  };

  const handleSelectDuration = (mins: number) => {
    haptics.selection();
    setActiveDurationMins(mins);
    setCustomTime(mins * 60);
  };

  return (
    <div className="relative mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center space-y-4 p-3.5 pb-20 sm:space-y-6 sm:p-4 md:p-8 md:pb-8">
      <audio
        ref={ringtoneRef}
        src="https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3"
      />

      {/* Mode & Deep Work Duration Switcher */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex rounded-2xl border border-border/50 bg-muted/50 p-1">
          <button
            onClick={() => {
              haptics.selection();
              switchMode('focus');
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${focusState.mode === 'focus' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {language === 'ja' ? '集中' : 'Fokus'}
          </button>
          <button
            onClick={() => {
              haptics.selection();
              switchMode('short_break');
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${focusState.mode === 'short_break' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {language === 'ja' ? '小休憩' : 'Qisqa'}
          </button>
          <button
            onClick={() => {
              haptics.selection();
              switchMode('long_break');
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${focusState.mode === 'long_break' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {language === 'ja' ? '大休憩' : 'Uzun'}
          </button>
        </div>

        {/* Deep Work Custom Duration Presets */}
        {focusState.mode === 'focus' && (
          <div className="flex max-w-xs flex-wrap items-center justify-center gap-1.5 animate-in fade-in sm:max-w-none sm:gap-2">
            {[
              { mins: 25, label: '25m' },
              { mins: 60, label: '60m' },
              { mins: 90, label: '90m' },
              { mins: 120, label: '120m' },
            ].map((p) => (
              <button
                key={p.mins}
                disabled={focusState.isActive}
                onClick={() => handleSelectDuration(p.mins)}
                className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all sm:text-xs ${
                  activeDurationMins === p.mins
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <FocusTimer
        timeLeft={focusState.timeLeft}
        progress={progress}
        mode={focusState.mode}
        isActive={focusState.isActive}
      />

      <FocusControls
        isActive={focusState.isActive}
        onToggle={handleStartClick}
        onReset={() => {
          haptics.impact('light');
          resetTimer();
        }}
      />

      {/* Live Study Room Card */}
      <div className="mt-8 w-full max-w-md rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Users size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-foreground sm:text-sm">
                {language === 'ja'
                  ? 'オンライン自習室 (Live Room)'
                  : "Jonli O'quv Xonasi (Study Room)"}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {language === 'ja'
                  ? '仲間と一緒に勉強・ホワイトボード共有'
                  : "Boshqalar bilan birga o'qish va oq doska"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/room/library')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>{language === 'ja' ? '入室' : 'Kirish'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusPage;
