import { Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { lazyWithRetry } from '../utils/lazyRetry';
import { JlptStudyShell } from '../components/jlpt/JlptStudyShell';
import { JLPT_TOPIC_PATHS, resolveStudyLevel, isStudyTopic } from '../utils/jlptStudyRoutes';

const MinnaLessonsExplorer = lazyWithRetry(() => import('../components/jlpt/MinnaLessonsExplorer'));
const N1AdvancedMasteryHub = lazyWithRetry(() =>
  import('../components/jlpt/N1AdvancedMasteryHub').then((m) => ({
    default: m.N1AdvancedMasteryHub,
  })),
);
const JlptReadingPage = lazyWithRetry(() =>
  import('./JlptReadingPage').then((m) => ({ default: m.JlptReadingPage })),
);
const JlptListeningMockPage = lazyWithRetry(() =>
  import('./JlptListeningMockPage').then((m) => ({ default: m.JlptListeningMockPage })),
);

export const JlptHubPage = () => {
  const [params] = useSearchParams();
  const { targetLevel } = useStudyData();
  const { language } = useLanguage();
  const requestedTab = params.get('tab') || 'lessons';
  const area = ['lessons', 'reading', 'listening', 'n1_mastery'].includes(requestedTab)
    ? requestedTab
    : 'lessons';
  const level = resolveStudyLevel(params.get('level'), targetLevel);
  const title = language === 'uz' ? 'Darslar' : language === 'ja' ? 'レッスン' : 'Lessons';
  useSEO({ title: 'JLPT N5–N1 — ' + title, canonical: '/jlpt' });
  const destination =
    (isStudyTopic(requestedTab) ? JLPT_TOPIC_PATHS[requestedTab] : null) ||
    (requestedTab === 'writing'
      ? '/jlpt?tab=lessons'
      : requestedTab === 'mock'
        ? '/exams'
        : requestedTab === 'mistakes'
          ? '/flashcards?tab=mistakes'
          : requestedTab === 'insights'
            ? '/progress?tab=skills'
            : null);
  if (destination) {
    const [path, query] = destination.split('?');
    const next = new URLSearchParams(params);
    next.delete('tab');
    next.set('level', level);
    new URLSearchParams(query).forEach((value, key) => next.set(key, value));
    return <Navigate to={`${path}?${next}`} replace />;
  }
  return (
    <JlptStudyShell area={area} title={title}>
      <Suspense
        fallback={
          <p role="status">
            {language === 'uz' ? 'Yuklanmoqda…' : language === 'ja' ? '読み込み中…' : 'Loading…'}
          </p>
        }
      >
        {area === 'lessons' && <MinnaLessonsExplorer initialLevel={level} hideLevelSwitcher />}
        {area === 'reading' && <JlptReadingPage />}
        {area === 'listening' && <JlptListeningMockPage />}
        {area === 'n1_mastery' && <N1AdvancedMasteryHub />}
      </Suspense>
    </JlptStudyShell>
  );
};
export default JlptHubPage;
