import { practiceResult } from '../utils/practiceResult';
import { formatStudyDate } from '../utils/studyDate';
import { Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { AssessmentSummary } from '../components/learning/AssessmentSummary';
import { HistoryService, MockExamItem } from '../services/HistoryService';
import { lazyWithRetry } from '../utils/lazyRetry';

const ActivityHeatmap = lazyWithRetry(() => import('../components/analytics/ActivityHeatmap'));
const FlashcardAnalytics = lazyWithRetry(
  () => import('../components/analytics/FlashcardAnalytics'),
);
const AchievementsGrid = lazyWithRetry(() =>
  import('../components/gamification/AchievementsGrid').then((m) => ({
    default: m.AchievementsGrid,
  })),
);

export default function ProgressPage() {
  const { user, sessions, flashcards, targetLevel } = useStudyData();
  const { language } = useLanguage();
  const lang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';
  const [params] = useSearchParams();
  const activeTab =
    params.get('tab') === 'history'
      ? 'history'
      : params.get('tab') === 'activity'
        ? 'activity'
        : 'skills';
  const [history, setHistory] = useState<MockExamItem[]>([]);
  const [historyState, setHistoryState] = useState<'loading' | 'success' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const level = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5';
  useEffect(() => {
    let cancelled = false;
    setHistory([]);
    setHistoryState('loading');
    HistoryService.getMockExamsHistory()
      .then((items) => {
        if (!cancelled) {
          setHistory(
            items
              .filter(
                (item) =>
                  item.examType === 'jlpt' &&
                  item.level?.toUpperCase().match(/N[1-5]/)?.[0] === level &&
                  Number.isFinite(item.score) &&
                  item.score >= 0 &&
                  Number.isFinite(item.totalQuestions) &&
                  item.totalQuestions > 0,
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          );
          setHistoryState('success');
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, level, retry]);
  const latest = history[0];
  const latestResult = latest ? practiceResult(latest) : null;
  const previous = history
    .slice(1)
    .find((item) => latestResult?.basis && practiceResult(item).basis === latestResult.basis);
  const formatDate = (date: string) => formatStudyDate(new Date(date), lang);
  return (
    <div className="study-page">
      <header>
        <p className="mb-2 text-sm font-medium text-primary">JLPT {level}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {lang === 'uz' ? 'Natijalar' : lang === 'ja' ? '学習結果' : 'Results'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {lang === 'uz'
            ? 'Natijalaringiz va mashq qilish kerak bo‘lgan yo‘nalishlar.'
            : lang === 'ja'
              ? '上達した分野と、復習が必要な分野を確認しましょう。'
              : 'See where you are improving and what needs more practice.'}
        </p>
      </header>
      <section
        className="flex flex-wrap items-center justify-between gap-5 border-y border-border/60 py-6"
        aria-labelledby="latest-exam-heading"
      >
        <div>
          <h2 id="latest-exam-heading" className="text-lg font-semibold">
            {lang === 'uz'
              ? 'Oxirgi sinov natijasi'
              : lang === 'ja'
                ? '最新の練習結果'
                : 'Latest practice result'}
          </h2>
          <div
            className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {historyState === 'loading' ? (
              lang === 'uz' ? (
                'Natijalar yuklanmoqda…'
              ) : lang === 'ja' ? (
                '結果を読み込み中…'
              ) : (
                'Loading results…'
              )
            ) : historyState === 'error' ? (
              <>
                {lang === 'uz'
                  ? 'Natijalar yuklanmadi.'
                  : lang === 'ja'
                    ? '結果を読み込めませんでした。'
                    : 'Results could not load.'}
                <button
                  className="ml-2 min-h-11 text-primary hover:underline"
                  onClick={() => setRetry((n) => n + 1)}
                >
                  {lang === 'uz' ? 'Qayta urinish' : lang === 'ja' ? '再試行' : 'Retry'}
                </button>
              </>
            ) : latest ? (
              <>
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {latestResult?.label}
                </span>
                <span>{formatDate(latest.createdAt)}</span>
                {previous && (
                  <span className="tabular-nums">
                    {latest.score - previous.score > 0 ? '+' : ''}
                    {latest.score - previous.score}{' '}
                    {lang === 'uz'
                      ? 'ball oldingi sinovga nisbatan'
                      : lang === 'ja'
                        ? '点（前回比）'
                        : 'points from the previous exam'}
                  </span>
                )}
              </>
            ) : lang === 'uz' ? (
              'Hali sinov natijasi yo‘q. Birinchi test bilan boshlang.'
            ) : lang === 'ja' ? (
              '模擬試験の結果はまだありません。最初の試験を受けましょう。'
            ) : (
              'No exam results yet. Start with your first practice exam.'
            )}
          </div>
          {latest && (
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === 'uz'
                ? 'Bu mashq natijasi, rasmiy JLPT bahosi emas.'
                : lang === 'ja'
                  ? 'このアプリの模擬試験の得点です。公式JLPTの結果ではありません。'
                  : 'A saved practice result. Older results with unknown scoring formats show only their saved value.'}
            </p>
          )}
        </div>
        <Link
          to={`/exams?level=${level}`}
          className="inline-flex min-h-11 items-center rounded-full bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {lang === 'uz'
            ? 'Sinov imtihonini ochish →'
            : lang === 'ja'
              ? '模擬試験を開く →'
              : 'Open practice exams →'}
        </Link>
      </section>
      <nav
        className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border/60"
        aria-label={
          lang === 'uz' ? 'Natija bo‘limlari' : lang === 'ja' ? '学習結果の項目' : 'Result sections'
        }
      >
        {[
          { tab: 'skills', uz: 'Ko‘nikmalar', en: 'Skills', ja: '分野別' },
          { tab: 'history', uz: 'Imtihonlar tarixi', en: 'Exam history', ja: '試験履歴' },
          { tab: 'activity', uz: 'O‘qish odati', en: 'Study activity', ja: '学習記録' },
        ].map((tab) => (
          <Link
            key={tab.tab}
            to={`?tab=${tab.tab}`}
            aria-current={activeTab === tab.tab ? 'page' : undefined}
            className={`inline-flex min-h-12 items-center border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab[lang]}
          </Link>
        ))}
      </nav>
      {activeTab === 'skills' && <AssessmentSummary />}
      {activeTab === 'history' && (
        <section className="space-y-4 py-2">
          <h2 className="text-xl font-semibold">
            {lang === 'uz'
              ? 'JLPT sinovlari'
              : lang === 'ja'
                ? 'JLPT模擬試験'
                : 'JLPT practice exams'}
          </h2>
          {historyState === 'loading' ? (
            <p role="status" className="text-sm text-muted-foreground">
              {lang === 'uz'
                ? 'Natijalar yuklanmoqda…'
                : lang === 'ja'
                  ? '結果を読み込み中…'
                  : 'Loading results…'}
            </p>
          ) : historyState === 'error' ? (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-destructive">
                {lang === 'uz'
                  ? 'Imtihonlar tarixi yuklanmadi.'
                  : lang === 'ja'
                    ? '試験履歴を読み込めませんでした。'
                    : 'Exam history could not load.'}
              </p>
              <button
                onClick={() => setRetry((n) => n + 1)}
                className="min-h-11 text-sm font-medium text-primary hover:underline"
              >
                {lang === 'uz'
                  ? 'Tarixni qayta yuklash'
                  : lang === 'ja'
                    ? '再読み込み'
                    : 'Reload history'}
              </button>
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {lang === 'uz'
                ? 'Natijalar testni tugatganingizdan keyin shu yerda ko‘rinadi.'
                : lang === 'ja'
                  ? '試験を完了すると結果がここに表示されます。'
                  : 'Completed exam results will appear here.'}
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {history.map((exam) => (
                <li
                  key={exam.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="text-sm">
                    <span className="font-medium">JLPT {exam.level}</span>
                    <span className="ml-3 text-muted-foreground">{formatDate(exam.createdAt)}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{practiceResult(exam).label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted-foreground">
            {lang === 'uz' ? 'Yuklanmoqda…' : lang === 'ja' ? '読み込み中…' : 'Loading…'}
          </p>
        }
      >
        {activeTab === 'activity' && <ActivityHeatmap sessions={sessions} />}
        <details
          onToggle={(e) => setShowExtras(e.currentTarget.open)}
          className="border-t border-border/60 pt-5"
        >
          <summary className="min-h-11 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            {lang === 'uz'
              ? 'Kartalar statistikasi va yutuqlar'
              : lang === 'ja'
                ? 'カードの統計と実績'
                : 'Card statistics and achievements'}
          </summary>
          {showExtras && (
            <div className="mt-5 space-y-6">
              <FlashcardAnalytics flashcards={flashcards} />
              <AchievementsGrid />
            </div>
          )}
        </details>
      </Suspense>
    </div>
  );
}
