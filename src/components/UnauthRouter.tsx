import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import GlobalAudioPlayer from './GlobalAudioPlayer';
import Layout from './Layout';
import { Toaster } from './ui/toaster';
import { StudyPlannerProvider } from '../context/StudyPlannerContext';
import { FocusTimerProvider } from '../context/FocusTimerContext';
import { lazyWithRetry } from '../utils/lazyRetry';

// Lazy load public and previewable pages
const AuthPage = lazyWithRetry(() => import('../pages/AuthPage'));
const LandingPage = lazyWithRetry(() => import('../pages/LandingPage'));
const DeveloperApiPage = lazyWithRetry(() => import('../pages/DeveloperApiPage'));
const PricingPage = lazyWithRetry(() =>
  import('../pages/PricingPage').then((m) => ({ default: m.PricingPage })),
);
const JlptHubPage = lazyWithRetry(() => import('../pages/JlptHubPage'));
const SpeakingCoachPage = lazyWithRetry(() => import('../pages/SpeakingCoachPage'));
const MonologuePage = lazyWithRetry(() =>
  import('../pages/MonologuePage').then((m) => ({ default: m.MonologuePage })),
);
const ScenarioPickerPage = lazyWithRetry(() => import('../pages/ScenarioPickerPage'));
const LessonPlayerPage = lazyWithRetry(() => import('../pages/LessonPlayerPage'));
const VocabularyBuilderPage = lazyWithRetry(() =>
  import('../pages/VocabularyBuilderPage').then((m) => ({ default: m.VocabularyBuilderPage })),
);
const RoadmapPage = lazyWithRetry(() => import('../pages/RoadmapPage'));
const DiagnosticPage = lazyWithRetry(() =>
  import('../pages/DiagnosticPage').then((m) => ({ default: m.DiagnosticPage })),
);
const DecksPage = lazyWithRetry(() => import('../pages/DecksPage'));
const StudyModePage = lazyWithRetry(() => import('../pages/StudyModePage'));
const FocusPage = lazyWithRetry(() => import('../pages/FocusPage'));
const ExamTake = lazyWithRetry(() => import('../pages/exams/ExamTake'));
const TelegramMiniAppPage = lazyWithRetry(() => import('../pages/TelegramMiniAppPage'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
    </div>
  </div>
);

/**
 * Router used when the user is not authenticated.
 * It provides public access to indexable educational pages, guest lessons, and previewable features.
 */
export const UnauthRouter: React.FC = () => (
  <ErrorBoundary>
    <StudyPlannerProvider>
      <FocusTimerProvider>
        <BrowserRouter>
          <div className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Landing page at root */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />

                {/* Educational pages wrapped in Layout (with sidebar navigation) */}
                <Route element={<Layout />}>
                  <Route path="/jlpt" element={<JlptHubPage />} />
                  <Route path="/speaking-coach" element={<SpeakingCoachPage />} />
                  <Route path="/monologue" element={<MonologuePage />} />
                  <Route
                    path="/speaking"
                    element={<Navigate to="/speaking-coach?lang=ja" replace />}
                  />
                  <Route
                    path="/coach"
                    element={<Navigate to="/speaking-coach?lang=ja" replace />}
                  />
                  <Route path="/scenarios" element={<ScenarioPickerPage />} />
                  <Route
                    path="/jlpt-speaking"
                    element={<Navigate to="/speaking-coach?lang=ja" replace />}
                  />
                  <Route
                    path="/jlpt-writing"
                    element={<Navigate to="/jlpt?tab=writing" replace />}
                  />
                  <Route path="/vocabulary" element={<VocabularyBuilderPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/diagnostic" element={<DiagnosticPage />} />
                  <Route path="/flashcards" element={<DecksPage />} />
                  <Route path="/deck" element={<Navigate to="/flashcards" replace />} />
                  <Route path="/decks" element={<Navigate to="/flashcards" replace />} />
                  <Route path="/deck/:id" element={<Navigate to="/flashcards" replace />} />
                  <Route path="/decks/:id" element={<Navigate to="/flashcards" replace />} />
                  <Route path="/focus" element={<FocusPage />} />

                  {/* JLPT tab aliases */}
                  <Route path="/minna" element={<Navigate to="/jlpt?tab=lessons" replace />} />
                  <Route path="/lessons" element={<Navigate to="/jlpt?tab=lessons" replace />} />
                  <Route
                    path="/jlpt/lessons"
                    element={<Navigate to="/jlpt?tab=lessons" replace />}
                  />
                  <Route
                    path="/jlpt/listening"
                    element={<Navigate to="/jlpt?tab=listening" replace />}
                  />
                  <Route
                    path="/jlpt/grammar"
                    element={<Navigate to="/jlpt?tab=grammar" replace />}
                  />
                  <Route
                    path="/jlpt/grammar-quiz"
                    element={<Navigate to="/jlpt?tab=grammar" replace />}
                  />
                  <Route
                    path="/jlpt/writing"
                    element={<Navigate to="/jlpt?tab=writing" replace />}
                  />
                  <Route
                    path="/jlpt/sakubun"
                    element={<Navigate to="/jlpt?tab=writing" replace />}
                  />
                  <Route
                    path="/jlpt/reading"
                    element={<Navigate to="/jlpt?tab=reading" replace />}
                  />
                  <Route
                    path="/jlpt/mock-exam"
                    element={<Navigate to="/jlpt?tab=mock" replace />}
                  />
                  <Route path="/exams" element={<Navigate to="/jlpt?tab=mock" replace />} />
                  <Route path="/ai" element={<Navigate to="/speaking-coach" replace />} />
                  <Route path="/ielts/*" element={<Navigate to="/jlpt" replace />} />
                  <Route path="/ielts" element={<Navigate to="/jlpt" replace />} />
                  <Route path="/ielts-writing" element={<Navigate to="/jlpt" replace />} />
                </Route>

                {/* Full-screen & Immersive public learning pages */}
                <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
                <Route path="/study-mode" element={<StudyModePage />} />
                <Route path="/study-mode/:subjectId" element={<StudyModePage />} />
                <Route path="/flashcards/study/:subjectId" element={<StudyModePage />} />
                <Route path="/exams/:id" element={<ExamTake />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/developers" element={<DeveloperApiPage />} />
                <Route path="/api-docs" element={<Navigate to="/developers" replace />} />
                <Route path="/twa" element={<TelegramMiniAppPage />} />
                <Route path="/telegram-app" element={<TelegramMiniAppPage />} />

                {/* Auth routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/reset-password" element={<AuthPage />} />
                <Route path="/reset-password" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/admin/login" element={<AuthPage />} />
                <Route path="/admin" element={<AuthPage />} />

                {/* Protected routes requiring login */}
                <Route
                  path="/flashcards/new"
                  element={<Navigate to="/auth?redirect=/flashcards" replace />}
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/auth?redirect=/dashboard" replace />}
                />
                <Route
                  path="/personal-plan"
                  element={<Navigate to="/auth?redirect=/personal-plan" replace />}
                />
                <Route
                  path="/plan"
                  element={<Navigate to="/auth?redirect=/personal-plan" replace />}
                />
                <Route
                  path="/goals"
                  element={<Navigate to="/auth?redirect=/personal-plan" replace />}
                />
                <Route
                  path="/tasks"
                  element={<Navigate to="/auth?redirect=/personal-plan" replace />}
                />
                <Route
                  path="/calendar"
                  element={<Navigate to="/auth?redirect=/calendar" replace />}
                />
                <Route
                  path="/subjects"
                  element={<Navigate to="/auth?redirect=/subjects" replace />}
                />
                <Route
                  path="/subjects/:id"
                  element={<Navigate to="/auth?redirect=/subjects" replace />}
                />
                <Route
                  path="/progress"
                  element={<Navigate to="/auth?redirect=/progress" replace />}
                />
                <Route
                  path="/settings"
                  element={<Navigate to="/auth?redirect=/settings" replace />}
                />
                <Route
                  path="/room/:roomId"
                  element={<Navigate to="/auth?redirect=/jlpt" replace />}
                />
                <Route
                  path="/admin/exams"
                  element={<Navigate to="/auth?redirect=/admin" replace />}
                />
                <Route
                  path="/admin/exams/:id"
                  element={<Navigate to="/auth?redirect=/admin" replace />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            <GlobalAudioPlayer />
            <Toaster />
          </div>
        </BrowserRouter>
      </FocusTimerProvider>
    </StudyPlannerProvider>
  </ErrorBoundary>
);

export default UnauthRouter;
