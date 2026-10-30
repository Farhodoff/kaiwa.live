export interface DatabaseEventUpdate {
  title?: string;
  description?: string;
  event_type?: string;
  event_date?: string;
  notify_before_minutes?: number;
  is_notified?: boolean;
  repetition_type?: string;
  repetition_end_date?: string | null;
  repetition_days?: number[] | null;
  google_event_id?: string | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseStudyNoteUpdate {
  subject_id?: string;
  title?: string;
  content?: string;
  updated_at?: string;
}

export interface DatabaseTaskUpdate {
  subject_id?: string;
  goal_id?: string;
  title?: string;
  description?: string;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'done';
  completed?: boolean;
  estimated_minutes?: number;
  updated_at?: string;
}

export interface DatabaseFlashcardUpdate {
  subject_id?: string;
  front?: string;
  back?: string;
  next_review_date?: string;
  ease_factor?: number;
  interval?: number;
  repetitions?: number;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  subject_id?: string;
  goal_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  completed: boolean;
  estimated_minutes?: number;
  created_at: string;
  updated_at?: string;
  google_event_id?: string;
  deleted_at?: string | null;
  srs_lesson_id?: string | null;
  srs_review_date?: string | null;
}

export interface DatabaseFlashcard {
  id: string;
  user_id: string;
  subject_id: string;
  front: string;
  back: string;
  next_review_date: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DatabaseSubject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  schedule: string[];
  teacher_name?: string;
  room_location?: string;
  description?: string;
  icon?: string;
  is_archived?: boolean;
}

export interface DatabaseSession {
  id: string;
  user_id: string;
  subject_id?: string;
  start_time: string;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  mood_before?: number;
  mood_after?: number;
}

export interface DatabaseNote {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  content: string;
  attachments: { name: string; type: 'image' | 'pdf'; url: string }[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStudyNote {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseWhiteboard {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  data?: Record<string, unknown>;
  updated_at: string;
}

export interface DatabaseEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: 'jdu' | 'career' | 'jlpt' | 'personal';
  event_date: string;
  notify_before_minutes: number;
  is_notified: boolean;
  repetition_type: 'none' | 'daily' | 'weekly' | 'monthly';
  repetition_end_date?: string;
  repetition_days?: number[];
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  theme?: 'light' | 'dark';
  notifications_enabled?: boolean;
  total_xp?: number;
  level?: number;
  current_streak?: number;
  last_activity_date?: string;
  google_api_key?: string;
  primary_language?: 'en' | 'ja';
  enabled_languages?: ('en' | 'ja')[];
  target_level?: string;
  target_goal?: string;
  tour_completed?: boolean;
  updated_at?: string;
}

export interface DatabaseCoachSession {
  id: string;
  user_id: string;
  persona_title: string;
  fluency_score: number;
  vocabulary_score: number;
  grammar_score: number;
  pronunciation_score: number;
  feedback: string;
  created_at: string;
}
