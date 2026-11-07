import React, { createContext, useContext } from 'react';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { FocusState } from '../types/focus';
import { useOptionalStudyData } from './StudyPlannerContext';
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
  // Safe consumption of StudyPlannerContext: during Vite HMR or isolated rendering,
  // StudyPlannerContext may be undefined/remounting. Fallback gracefully instead of crashing.
  const studyData = useOptionalStudyData();
  const notificationsEnabled = studyData?.settings?.notificationsEnabled ?? true;

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
