export interface Goal {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO Date
  progress: number; // 0-100
  color?: string; // Optional - default to indigo if not set
  priority?: Priority;
  createdAt?: string;
  completed?: boolean;
}

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  goalId?: string; // Optional link to a goal
  subjectId?: string; // Optional link to a subject
  link?: string; // Optional URL resource
  dueDate?: string;
  deadline?: string; // Synonymous with dueDate in some legacy logic, keeping for compat
  startTime?: string;
  endTime?: string;
  createdAt: string;
  googleEventId?: string;
  deletedAt?: string;
  srsLessonId?: string;
  srsReviewDate?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  schedule: string[]; // e.g., ["Mon 10:00", "Wed 14:00"]
  goal?: string;
  description?: string;
  teacherName?: string;
  roomLocation?: string;
  icon?: string;
  isArchived?: boolean;
}

export interface StudySession {
  id: string;
  subjectId?: string;
  startTime: string;
  duration: number; // in minutes
  type: 'focus' | 'break';
  completed: boolean;
  moodBefore?: number; // 1-5
  moodAfter?: number; // 1-5
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string; // Markdown
  attachments: { name: string; type: 'image' | 'pdf'; url: string }[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  googleEventId?: string;
}

export interface StudyNote {
  id: string;
  subjectId: string;
  userId: string;
  title: string;
  content: string; // Markdown
  createdAt: string;
  updatedAt: string;
  googleEventId?: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  // SRS Fields
  nextReviewDate: string; // ISO
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  deletedAt?: string;
  phonetic?: string;
  example?: string;
}

export const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export interface WhiteboardMetadata {
  id: string;
  subjectId: string;
  userId: string;
  title: string;
  updatedAt: string;
}

export type EventType = 'jdu' | 'career' | 'jlpt' | 'personal' | 'google';
export type RepetitionType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventType: EventType;
  eventDate: string; // ISO DateTime
  notifyBeforeMinutes: number;
  isNotified: boolean;
  repetitionType: RepetitionType;
  repetitionEndDate?: string; // Optional end date for recurring events
  repetitionDays?: number[]; // For weekly: which days (0=Sunday, 6=Saturday)
  createdAt: string;
  updatedAt: string;
  googleEventId?: string;
}

export interface CoachSession {
  id: string;
  personaTitle: string;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  feedback: string;
  createdAt: string;
}

export const EVENT_TYPE_COLORS = {
  jdu: '#3b82f6', // Blue
  career: '#f59e0b', // Amber
  jlpt: '#10b981', // Green
  personal: '#6366f1', // Indigo
  google: '#ea4335', // Google Red
};

export const EVENT_TYPE_LABELS = {
  jdu: '🎓 JDU (Akademik)',
  career: '💼 Karyera',
  jlpt: '🇯🇵 JLPT',
  personal: '🏠 Shaxsiy',
  google: '🔍 Google',
};

export const REPETITION_LABELS = {
  none: 'Bir marta',
  daily: 'Har kuni',
  weekly: 'Har hafta',
  monthly: 'Har oy',
};

export const WEEKDAY_LABELS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
