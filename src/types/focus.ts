export type FocusMode = 'focus' | 'short_break' | 'long_break';

export interface FocusState {
  mode: FocusMode;
  timeLeft: number;
  isActive: boolean;
  selectedSubjectId: string | null;
  selectedTaskId: string | null;
  bgSound: string;
  isMuted: boolean;
  isSessionCompleted: boolean;
}
