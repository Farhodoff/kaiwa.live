import { formatStudyDate } from '../utils/studyDate';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  ChevronRight,
  Headphones,
  Loader2,
  RotateCcw,
  Target,
} from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { LearningPathEngine } from '../services/LearningPathEngine';
import { NextBestAction } from '../types/learningPath';
import { getStudyFlashcards } from '../utils/flashcardScope';
import { isDue } from '../utils/srs';
import { StudyGoal } from '../components/learning/StudyGoal';

export default function DashboardPage() {
  const { loading, flashcards, subjects, targetLevel, targetGoal, user } = useStudyData();
  const { language } = useLanguage();
  const lang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const level = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5';
  const activeCards = getStudyFlashcards(flashcards, subjects);
  const now = new Date();
  const dueCount = activeCards.filter((card) => isDue(card, now)).length;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setState('loading');
    setNextAction(null);
    LearningPathEngine.getLearningPathState(user?.id || 'default-user', {
      forceLanguage: 'ja',
      skipDailyPlan: true,
      cachedFlashcards: flashcards,
      cachedSubjects: subjects,
    })
      .then((result) => {
        if (!cancelled) {
          setNextAction(result.nextAction);
          setState('success');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, targetLevel, targetGoal, flashcards, subjects, retry]);

  const lessonRoute = `/jlpt?tab=lessons&level=${level}`;
  const isCoreAction =
    nextAction?.route &&
    /^\/(lesson\/|jlpt(?:\?|\/|$)|study-mode(?:\?|\/|$)|flashcards(?:\?|\/|$)|exams(?:\?|\/|$)|roadmap(?:\?|$))/.test(
      nextAction.route,
    ) &&
    !/[?&]tab=(writing|n1_mastery)/.test(nextAction.route) &&
    !/^\/jlpt(?:-writing|\/(?:writing|sakubun))/.test(nextAction.route) &&
    (!/^(?:\/study-mode(?:\?|\/|$)|\/flashcards(?:\/study\/|\?.*study=))/.test(nextAction.route) ||
      activeCards.length > 0);
  const recommendedRoute = isCoreAction ? nextAction!.route : lessonRoute;
  const actionRoute = dueCount > 0 ? '/flashcards?study=all' : recommendedRoute;
  const actionTitle =
    dueCount > 0
      ? lang === 'uz'
        ? `${dueCount} ta kartani takrorlang`
        : lang === 'ja'
          ? `${dueCount}枚のカードを復習`
          : `Review ${dueCount} due cards`
      : isCoreAction
        ? nextAction!.title
        : lang === 'uz'
          ? 'Darsdan boshlaymiz'
          : lang === 'ja'
            ? '次のレッスンに進みましょう'
            : 'Continue your next lesson';
  const today = formatStudyDate(new Date(), lang, true);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="animate-spin text-primary"
          role="status"
          aria-label={lang === 'uz' ? 'Yuklanmoqda' : 'Loading dashboard'}
        />
      </div>
    );

  return (
    <div className="study-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{today}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {lang === 'uz' ? 'Bugun' : lang === 'ja' ? '今日' : 'Today'}
          </h1>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          JLPT {level}
        </span>
      </header>

      <section
        className="relative overflow-hidden rounded-[2rem] bg-primary/[0.06] p-6 sm:p-8 lg:p-10"
        aria-labelledby="next-step-heading"
      >
        <p className="text-sm font-medium text-primary">
          {lang === 'uz'
            ? 'Shundan boshlang'
            : lang === 'ja'
              ? 'ここから始めましょう'
              : 'Start here'}
        </p>
        <h2
          id="next-step-heading"
          className="mt-3 max-w-3xl text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
        >
          {actionTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {dueCount > 0
            ? lang === 'uz'
              ? 'Oldingi so‘zlarni eslab oling, so‘ng yangi darsga o‘ting.'
              : lang === 'ja'
                ? '復習が必要な単語を確認してから、新しい内容に進みましょう。'
                : 'Strengthen the words due for review before moving to new material.'
            : isCoreAction
              ? nextAction?.description || nextAction?.reason?.description
              : lang === 'uz'
                ? 'Darajangizga mos darsni tanlang va qisqa mashq bilan bilimni mustahkamlang.'
                : lang === 'ja'
                  ? 'レベルに合ったレッスンと練習で学びましょう。'
                  : 'Choose a lesson at your level and reinforce it with a short practice.'}
        </p>
        <Link
          to={actionRoute}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          {lang === 'uz'
            ? dueCount > 0
              ? 'Takrorlashni boshlash'
              : 'Boshlash'
            : lang === 'ja'
              ? dueCount > 0
                ? '復習を始める'
                : '始める'
              : dueCount > 0
                ? 'Start review'
                : 'Start'}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        {state === 'loading' && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {lang === 'uz'
              ? 'Shaxsiy tavsiya yuklanmoqda…'
              : lang === 'ja'
                ? 'おすすめを読み込み中…'
                : 'Loading your recommendation…'}
          </p>
        )}
        {state === 'error' && (
          <div role="status" className="mt-4 text-sm text-muted-foreground">
            {lang === 'uz'
              ? 'Shaxsiy tavsiya yuklanmadi. Darslar va takrorlashni ochishingiz mumkin.'
              : lang === 'ja'
                ? 'おすすめを読み込めませんでした。レッスンや復習は利用できます。'
                : 'Your recommendation could not load. Lessons and review are still available.'}
            <button
              onClick={() => setRetry((n) => n + 1)}
              className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
            >
              {lang === 'uz' ? 'Qayta urinish' : lang === 'ja' ? '再試行' : 'Retry'}
            </button>
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="study-order-heading" className="py-2">
          <h2 id="study-order-heading" className="mb-2 text-lg font-semibold">
            {lang === 'uz' ? 'Bugungi reja' : lang === 'ja' ? '今日のプラン' : 'Today’s plan'}
          </h2>
          <ol className="divide-y divide-border/70">
            {[
              {
                icon: RotateCcw,
                route: dueCount > 0 ? '/flashcards?study=all' : '/flashcards',
                title: lang === 'uz' ? 'Takrorlash' : lang === 'ja' ? '復習' : 'Review',
                description:
                  dueCount > 0
                    ? lang === 'uz'
                      ? `${dueCount} ta karta tayyor`
                      : lang === 'ja'
                        ? `復習予定：${dueCount}枚`
                        : `${dueCount} cards due`
                    : lang === 'uz'
                      ? activeCards.length
                        ? 'Hozircha takrorlash vaqti kelmagan'
                        : 'Darslardan kartalar saqlab boshlang'
                      : lang === 'ja'
                        ? 'カード一覧を確認する'
                        : 'Browse your cards',
              },
              {
                icon: BookOpen,
                route: lessonRoute,
                title: lang === 'uz' ? 'Yangi dars' : lang === 'ja' ? 'レッスン' : 'Learn',
                description:
                  lang === 'uz'
                    ? 'Lug‘at, kanji va grammatika'
                    : lang === 'ja'
                      ? '語彙・漢字・文法'
                      : 'Vocabulary, kanji and grammar',
              },
              {
                icon: Headphones,
                route: `/jlpt?tab=listening&level=${level}`,
                title: lang === 'uz' ? 'Tinglash' : lang === 'ja' ? '聴解' : 'Listen',
                description:
                  lang === 'uz'
                    ? 'Tinglang va savollarga javob bering'
                    : lang === 'ja'
                      ? '聞いて問題に答えましょう'
                      : 'Listen and answer questions',
              },
            ].map((item, index) => (
              <li key={item.route}>
                <Link
                  to={item.route}
                  className="group flex min-h-24 items-center gap-3 rounded-xl py-4 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-2"
                >
                  <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                    0{index + 1}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-muted-foreground group-hover:text-primary">
                    <item.icon size={19} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={17}
                    className="shrink-0 text-muted-foreground group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-4">
          <details className="border-b border-border/60">
            <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 py-5 hover:text-primary [&::-webkit-details-marker]:hidden">
              <Target size={20} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">
                {lang === 'uz'
                  ? 'Maqsadni o‘zgartirish'
                  : lang === 'ja'
                    ? '目標を変更'
                    : 'Edit your goal'}
                <span className="mt-1 block text-xs text-muted-foreground">JLPT {level}</span>
              </span>
              <ChevronRight size={17} className="text-muted-foreground" aria-hidden="true" />
            </summary>
            <StudyGoal key={user?.id || 'guest'} />
          </details>
          <Link
            to="/progress"
            className="flex items-start gap-3 py-5 transition-colors hover:text-primary"
          >
            <BarChart3 size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-sm font-medium">
                {lang === 'uz' ? 'Natijalarim' : lang === 'ja' ? '学習結果' : 'My results'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {lang === 'uz'
                  ? 'O‘sish va mashq kerak bo‘lgan mavzular'
                  : lang === 'ja'
                    ? '進捗と復習が必要な分野を確認'
                    : 'Progress and areas to practice'}
              </p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
