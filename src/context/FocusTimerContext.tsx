import React, { createContext, useContext } from 'react';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { FocusState } from '../types/focus';
import { useStudyData } from './StudyPlannerContext';
import { FocusMode } from '../types/focus';

interface FocusTimerContextType {
  focusState: FocusState;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: FocusMode) => void;
  setCustomTime: (seconds: number) => void;
  setFocusSubject: (id: string) => void;
  setFocusTask: (id: string | null) => void;
  setBgSound: (sound: string) => void;
  setMuted: (muted: boolean) => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export const FocusTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // notificationsEnabled comes from StudyPlannerContext
  const { settings } = useStudyData();
  const notificationsEnabled = settings.notificationsEnabled;

  const timerControls = useFocusTimer(notificationsEnabled);

  return <FocusTimerContext.Provider value={timerControls}>{children}</FocusTimerContext.Provider>;
};

export const useFocusTimerContext = (): FocusTimerContextType => {
  const context = useContext(FocusTimerContext);
  if (!context) {
    return {
      focusState: {
        mode: 'focus',
        timeLeft: 1500,
        isActive: false,
        selectedSubjectId: null,
        selectedTaskId: null,
        bgSound: 'none',
        isMuted: false,
        isSessionCompleted: false,
      },
      startTimer: () => {},
      pauseTimer: () => {},
      resetTimer: () => {},
      switchMode: () => {},
      setCustomTime: () => {},
      setFocusSubject: () => {},
      setFocusTask: () => {},
      setBgSound: () => {},
      setMuted: () => {},
    };
  }
  return context;
};
