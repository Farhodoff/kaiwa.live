import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import Layout from './components/Layout';
import { StudyPlannerProvider } from './context/StudyPlannerContext';
import { FocusTimerProvider } from './context/FocusTimerContext';
import { LanguageProvider } from './context/LanguageContext';
import { supabase } from './lib/supabase';
import { PushNotificationPrompt } from './components/pwa/PushNotificationPrompt';
import { Toaster } from './components/ui/toaster';
import { GlobalFlashcardOverrideService } from './services/GlobalFlashcardOverrideService';
import { lazyWithRetry } from './utils/lazyRetry';

const CalendarPage = lazyWithRetry(() => import('./pages/CalendarPage'));
const DecksPage = lazyWithRetry(() => import('./pages/DecksPage'));
const FlashcardForm = lazyWithRetry(() => import('./pages/FlashcardForm'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const StudyRoomPage = lazyWithRetry(() => import('./pages/StudyRoomPage'));
const SubjectDetailPage = lazyWithRetry(() => import('./pages/SubjectDetailPage'));
const SubjectsPage = lazyWithRetry(() => import('./pages/SubjectsPage'));
const AdminDashboardPage = lazyWithRetry(() => import('./pages/AdminDashboardPage'));
const SpeakingCoachPage = lazyWithRetry(() => import('./pages/SpeakingCoachPage'));
const MonologuePage = lazyWithRetry(() =>
  import('./pages/MonologuePage').then((m) => ({ default: m.MonologuePage })),
);
const JlptHubPage = lazyWithRetry(() => import('./pages/JlptHubPage'));
const PricingPage = lazyWithRetry(() =>
  import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })),
);
const ExamsManager = lazyWithRetry(() => import('./pages/admin/ExamsManager'));
const QuestionEditor = lazyWithRetry(() => import('./pages/admin/QuestionEditor'));
const ExamTake = lazyWithRetry(() => import('./pages/exams/ExamTake'));
const LessonPlayerPage = lazyWithRetry(() => import('./pages/LessonPlayerPage'));
const RoadmapPage = lazyWithRetry(() => import('./pages/RoadmapPage'));
const DiagnosticPage = lazyWithRetry(() =>
  import('./pages/DiagnosticPage').then((m) => ({ default: m.DiagnosticPage })),
);
const PersonalPlanPage = lazyWithRetry(() =>
  import('./pages/PersonalPlanPage').then((m) => ({ default: m.PersonalPlanPage })),
);
const StudyModePage = lazyWithRetry(() => import('./pages/StudyModePage'));
const ScenarioPickerPage = lazyWithRetry(() =>
  import('./pages/ScenarioPickerPage').then((m) => ({ default: m.ScenarioPickerPage })),
);
const ProgressPage = lazyWithRetry(() => import('./pages/ProgressPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const AuthPage = lazyWithRetry(() => import('./pages/AuthPage'));
const TelegramMiniAppPage = lazyWithRetry(() => import('./pages/TelegramMiniAppPage'));

import { isUserAdmin } from './utils/admin';
import { useAuthStore } from './stores';
import { safeLocalStorage } from './utils/storage/safeLocalStorage';
import { isPublicPreviewActive, MOCK_PREVIEW_SESSION } from './config/previewMode';
import { isTelegramWebApp, initTelegramAuth } from './utils/telegramAuth';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [checkingDb, setCheckingDb] = useState(false);
  const [isDbAdmin, setIsDbAdmin] = useState<boolean | null>(null);

  const cachedUser = safeLocalStorage.getJSON<any>('study_planner_user_cache', null);
  const effectiveUser = user || cachedUser;
  const isPreview = isPublicPreviewActive();

  useEffect(() => {
    if (isPreview) return;
    if (!effectiveUser?.id) return;
    if (isUserAdmin(effectiveUser)) {
      setIsDbAdmin(true);
      return;
    }
    let isMounted = true;
    setCheckingDb(true);

    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setCheckingDb(false);
        setIsDbAdmin(false);
      }
    }, 1500);

    supabase
      .from('profiles')
      .select('role')
      .eq('id', effectiveUser.id)
      .single()
      .then(
        ({ data }) => {
          if (!isMounted) return;
          clearTimeout(safetyTimer);
          if (data?.role === 'admin' || data?.role === 'superadmin') {
            setIsDbAdmin(true);
            const updated = { ...effectiveUser, role: data.role };
            useAuthStore.getState().setUser(updated);
            safeLocalStorage.setJSON('study_planner_user_cache', updated);
          } else {
            setIsDbAdmin(false);
          }
          setCheckingDb(false);
        },
        () => {
          if (isMounted) {
            clearTimeout(safetyTimer);
            setIsDbAdmin(false);
            setCheckingDb(false);
          }
        },
      );
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [effectiveUser?.id, isPreview]);

  if (isPreview) {
    return <>{children}</>;
  }

  if ((loading && !effectiveUser) || checkingDb) {
    return <PageLoader />;
  }
  if (isUserAdmin(effectiveUser) || isDbAdmin === true) {
    return <>{children}</>;
  }
  if (isDbAdmin === false || !isUserAdmin(effectiveUser)) {
    return <Navigate to="/jlpt" replace />;
  }
  return <>{children}</>;
};

// Loading component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
    </div>
  </div>
);

import UnauthRouter from './components/UnauthRouter';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => {
    if (isPublicPreviewActive()) {
      return MOCK_PREVIEW_SESSION as unknown as Session;
    }
    if (typeof window !== 'undefined' && isTelegramWebApp()) {
      const tgAuth = initTelegramAuth();
      if (tgAuth?.session) {
        return tgAuth.session;
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem('study_planner_user_cache');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed && parsed.email) {
            return {
              access_token: 'cached-token',
              token_type: 'bearer',
              expires_in: 360000,
              refresh_token: 'cached-refresh',
              user: parsed,
            } as unknown as Session;
          }
        }
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth-token') || key.includes('supabase.auth.token'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (
                parsed &&
                (parsed.access_token ||
                  (parsed.currentSession && parsed.currentSession.access_token))
              ) {
                return parsed.currentSession || parsed;
              }
            }
          }
        }
      } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !session && !isPublicPreviewActive());

  useEffect(() => {
    // Initialize global flashcard dictionary overrides for all users (online/offline)
    GlobalFlashcardOverrideService.initGlobalOverrides().catch(() => {});

    // Safety timeout: Never leave the UI stuck on "Yuklanmoqda..."
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    supabase.auth
      .getSession()
      .then(({ data: { session: fetchedSession } }) => {
        clearTimeout(safetyTimer);
        if (fetchedSession) {
          setSession(fetchedSession);
        } else if (isTelegramWebApp()) {
          const tgAuth = initTelegramAuth();
          if (tgAuth?.session) {
            setSession(tgAuth.session);
          }
        } else if (isPublicPreviewActive()) {
          setSession(MOCK_PREVIEW_SESSION as unknown as Session);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        clearTimeout(safetyTimer);
        console.warn('Session check aborted/failed:', err);
        if (isTelegramWebApp()) {
          const tgAuth = initTelegramAuth();
          if (tgAuth?.session) {
            setSession(tgAuth.session);
          }
        } else if (isPublicPreviewActive()) {
          setSession(MOCK_PREVIEW_SESSION as unknown as Session);
        }
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
      } else if (isTelegramWebApp()) {
        const tgAuth = initTelegramAuth();
        if (tgAuth?.session) {
          setSession(tgAuth.session);
        }
      } else if (isPublicPreviewActive()) {
        setSession(MOCK_PREVIEW_SESSION as unknown as Session);
      }
    });

    const handleStorageAuth = (e: StorageEvent) => {
      if (
        e.key &&
        (e.key.includes('auth-token') || e.key.includes('supabase.auth.token')) &&
        !e.newValue
      ) {
        if (isPublicPreviewActive()) {
          setSession(MOCK_PREVIEW_SESSION as unknown as Session);
        } else {
          setSession(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageAuth);

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageAuth);
    };
  }, []);
  if (isLoading) {
    return <PageLoader />;
  }

  if (!session && !isPublicPreviewActive()) {
    return (
      <LanguageProvider>
        <UnauthRouter />
      </LanguageProvider>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <StudyPlannerProvider>
          <FocusTimerProvider>
            <BrowserRouter>
              <div className="relative h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="landing" element={<LandingPage />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route
                        path="admin"
                        element={
                          <AdminRoute>
                            <AdminDashboardPage />
                          </AdminRoute>
                        }
                      />
                      <Route path="roadmap" element={<RoadmapPage />} />
                      <Route path="personal-plan" element={<PersonalPlanPage />} />
                      <Route path="diagnostic" element={<DiagnosticPage />} />
                      <Route path="lesson/:lessonId" element={<LessonPlayerPage />} />
                      <Route path="speaking-coach" element={<SpeakingCoachPage />} />
                      <Route path="monologue" element={<MonologuePage />} />
                      <Route
                        path="speaking"
                        element={<Navigate to="/speaking-coach?lang=ja" replace />}
                      />
                      {/* IELTS Legacy Routes -> Redirect to JLPT */}
                      <Route path="ielts/*" element={<Navigate to="/jlpt" replace />} />
                      <Route path="ielts" element={<Navigate to="/jlpt" replace />} />
                      <Route path="ielts-writing" element={<Navigate to="/jlpt" replace />} />
                      <Route path="jlpt" element={<JlptHubPage />} />
                      <Route path="scenarios" element={<ScenarioPickerPage />} />
                      <Route
                        path="coach"
                        element={<Navigate to="/speaking-coach?lang=ja" replace />}
                      />
                      <Route
                        path="jlpt-speaking"
                        element={<Navigate to="/speaking-coach?lang=ja" replace />}
                      />
                      <Route
                        path="jlpt-writing"
                        element={<Navigate to="/jlpt?tab=writing" replace />}
                      />
                      <Route path="minna" element={<Navigate to="/jlpt?tab=lessons" replace />} />
                      <Route path="lessons" element={<Navigate to="/jlpt?tab=lessons" replace />} />
                      <Route
                        path="curriculum"
                        element={<Navigate to="/jlpt?tab=lessons" replace />}
                      />
                      <Route
                        path="jlpt/lessons"
                        element={<Navigate to="/jlpt?tab=lessons" replace />}
                      />
                      <Route
                        path="jlpt/listening"
                        element={<Navigate to="/jlpt?tab=listening" replace />}
                      />
                      <Route
                        path="jlpt/grammar"
                        element={<Navigate to="/jlpt?tab=grammar" replace />}
                      />
                      <Route
                        path="jlpt/grammar-quiz"
                        element={<Navigate to="/jlpt?tab=grammar" replace />}
                      />
                      <Route
                        path="jlpt/writing"
                        element={<Navigate to="/jlpt?tab=writing" replace />}
                      />
                      <Route
                        path="jlpt/sakubun"
                        element={<Navigate to="/jlpt?tab=writing" replace />}
                      />
                      <Route
                        path="jlpt/reading"
                        element={<Navigate to="/jlpt?tab=reading" replace />}
                      />
                      <Route
                        path="jlpt/mock-exam"
                        element={<Navigate to="/jlpt?tab=mock" replace />}
                      />
                      <Route path="exams" element={<Navigate to="/jlpt?tab=mock" replace />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="subjects" element={<SubjectsPage />} />
                      <Route path="subjects/:id" element={<SubjectDetailPage />} />
                      <Route path="plan" element={<Navigate to="/personal-plan" replace />} />
                      <Route path="goals" element={<Navigate to="/personal-plan" replace />} />
                      <Route path="tasks" element={<Navigate to="/personal-plan" replace />} />
                      <Route path="focus" element={<Navigate to="/dashboard" replace />} />
                      <Route path="ai" element={<Navigate to="/speaking-coach" replace />} />
                      <Route path="flashcards" element={<DecksPage />} />
                      <Route path="deck" element={<Navigate to="/flashcards" replace />} />
                      <Route path="decks" element={<Navigate to="/flashcards" replace />} />
                      <Route path="deck/:id" element={<Navigate to="/flashcards" replace />} />
                      <Route path="decks/:id" element={<Navigate to="/flashcards" replace />} />
                      <Route path="flashcards/new" element={<FlashcardForm />} />
                      <Route path="study-mode" element={<StudyModePage />} />
                      <Route path="study-mode/:subjectId" element={<StudyModePage />} />
                      <Route path="flashcards/study/:subjectId" element={<StudyModePage />} />
                      <Route path="progress" element={<ProgressPage />} />
                      <Route path="vocabulary" element={<Navigate to="/flashcards" replace />} />
                      <Route path="pricing" element={<PricingPage />} />
                      <Route path="room/:roomId" element={<StudyRoomPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="twa" element={<TelegramMiniAppPage />} />
                      <Route path="telegram-app" element={<TelegramMiniAppPage />} />
                      <Route
                        path="admin/exams"
                        element={
                          <AdminRoute>
                            <ExamsManager />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="admin/exams/:id"
                        element={
                          <AdminRoute>
                            <QuestionEditor />
                          </AdminRoute>
                        }
                      />
                      <Route path="exams/:id" element={<ExamTake />} />
                    </Route>
                    <Route path="/auth/reset-password" element={<AuthPage />} />
                    <Route path="/reset-password" element={<AuthPage />} />
                    <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/register" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
                <GlobalAudioPlayer />

                <PushNotificationPrompt />

                <Toaster />
              </div>
            </BrowserRouter>
          </FocusTimerProvider>
        </StudyPlannerProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
