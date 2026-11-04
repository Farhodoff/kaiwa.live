import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { isPublicPreviewActive, MOCK_PREVIEW_USER } from '../config/previewMode';
import { isTelegramWebApp, initTelegramAuth } from '../utils/telegramAuth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const getInitialUser = (): User | null => {
  const cached = safeLocalStorage.getJSON<User | null>('study_planner_user_cache', null);
  if (cached) return cached;
  if (isPublicPreviewActive()) return MOCK_PREVIEW_USER as unknown as User;
  if (typeof window !== 'undefined' && isTelegramWebApp()) {
    const tgAuth = initTelegramAuth();
    if (tgAuth?.user) return tgAuth.user;
  }
  return null;
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  loading:
    isPublicPreviewActive() ||
    (typeof window !== 'undefined' && isTelegramWebApp() && Boolean(initialUser))
      ? false
      : true,
  setUser: (user) => {
    if (user) {
      safeLocalStorage.setJSON('study_planner_user_cache', user);
    } else {
      safeLocalStorage.removeItem('study_planner_user_cache');
    }
    set({ user });
  },
  setLoading: (loading) => set({ loading }),
}));
