import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCheck,
  Headphones,
  Menu,
  RotateCcw,
  Target,
  X,
} from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import {
  LANDING_LEVELS,
  LandingLevel,
  landingCopy,
  landingLevelCopy,
  landingQuestions,
} from '../data/landingContent';

function SampleExercise({ level }: { level: LandingLevel }) {
  const { language } = useLanguage();
  const c = landingCopy[language];
  const question = landingQuestions[level];
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected === question.correct;
  const checkLabel =
    language === 'uz'
      ? 'Javobni tekshirish'
      : language === 'ja'
        ? '答えを確認する'
        : 'Check my answer';
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (selected !== null) setRevealed(true);
      }}
      className="rounded-3xl border border-border bg-card p-5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
        <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          JLPT {level}
        </span>
        <span className="text-sm text-muted-foreground">{c.sampleInstruction}</span>
      </div>
      <p lang="ja" className="font-japanese py-8 text-xl font-medium leading-loose sm:text-2xl">
        {question.prompt}
      </p>
      <fieldset disabled={revealed}>
        <legend className="sr-only">{c.sampleInstruction}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.options.map((option, index) => (
            <label
              key={option}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${revealed && index === question.correct ? 'border-primary bg-primary/5' : selected === index ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${revealed ? 'cursor-default' : ''}`}
            >
              <input
                type="radio"
                name="sample-answer"
                value={index}
                checked={selected === index}
                onChange={() => setSelected(index)}
                className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
              />
              <span lang="ja" className="font-japanese text-lg">
                {option}
              </span>
              {revealed && index === question.correct && (
                <Check className="ml-auto text-primary" size={18} aria-label={c.correctAnswer} />
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={selected === null || revealed}
        className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-default disabled:opacity-50"
      >
        {checkLabel}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
      {revealed && (
        <div
          role="status"
          className="mt-6 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5"
        >
          <p className="font-semibold">{isCorrect ? c.correct : c.incorrect}</p>
          {!isCorrect && (
            <p className="text-sm">
              {c.correctAnswer}{' '}
              <span lang="ja" className="font-japanese font-semibold">
                {question.options[question.correct]}
              </span>
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {question.explanations[language]}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setRevealed(false);
              }}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <RotateCcw size={15} aria-hidden="true" />
              {c.reset}
            </button>
            <Link
              to={`/jlpt?tab=lessons&level=${level}`}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {c.continueLesson}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{c.sampleNote}</p>
    </form>
  );
}

function StudyPreview() {
  const { language } = useLanguage();
  const c = landingCopy[language];
  const icons = [RotateCcw, BookOpen, Headphones];
  return (
    <div className="relative mx-auto w-full max-w-lg lg:ml-auto lg:mr-0">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            JLPT N5
          </div>
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {c.previewLabel}
          </span>
        </div>
        <div className="py-6">
          <p className="mb-2 text-sm text-muted-foreground">今日の学習</p>
          <h2 className="text-2xl font-semibold tracking-tight">{c.previewTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.previewSubtitle}</p>
        </div>
        <ol className="space-y-3">
          {c.previewTasks.map((task, index) => {
            const Icon = icons[index];
            return (
              <li
                key={task}
                className="flex items-center gap-4 rounded-2xl border border-border p-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{task}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.previewDescriptions[index]}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">0{index + 1}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold text-primary">{c.previewNext}</p>
          <p lang="ja" className="font-japanese mb-1 mt-3 text-xl">
            自己紹介
          </p>
          <p className="text-sm font-medium">{c.previewLesson}</p>
          <Link
            to="/lesson/ja-n5-u1-l1"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {c.previewAction}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <p className="mt-4 px-2 text-xs leading-relaxed text-muted-foreground">{c.previewNote}</p>
    </div>
  );
}

export default function LandingPage() {
  const { language } = useLanguage();
  const c = landingCopy[language];
  const [params, setParams] = useSearchParams();
  const rawLevel = params.get('level')?.toUpperCase();
  const level: LandingLevel = LANDING_LEVELS.includes(rawLevel as LandingLevel)
    ? (rawLevel as LandingLevel)
    : 'N5';
  const levelCopy = landingLevelCopy[language][level];
  const [menuOpen, setMenuOpen] = useState(false);
  const selectLevel = (value: LandingLevel) => {
    const next = new URLSearchParams(window.location.search);
    next.set('level', value);
    setParams(next, { preventScrollReset: true });
  };
  useSEO({
    title: c.seoTitle,
    description: c.description,
    canonical: '/',
    locale: language === 'ja' ? 'ja_JP' : language === 'en' ? 'en_US' : 'uz_UZ',
    keywords: 'JLPT N5 N4 N3 N2 N1, yapon tili, JLPT tayyorgarlik, Minna no Nihongo, kaiwa.live',
  });
  const nav = [
    { href: '#how-it-works', label: c.how },
    { href: '#lessons', label: c.levels },
    { href: '#app', label: c.practice },
    { href: '#faq', label: c.faq },
  ];
  const featureIcons = [BookOpen, RotateCcw, ClipboardCheck, Target];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#landing-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-card focus:p-4"
      >
        {c.skip}
      </a>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Kaiwa Live" className="shrink-0">
            <AppLogo size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label={c.menu}>
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              className="hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold hover:bg-muted sm:inline-flex"
            >
              {c.login}
            </Link>
            <button
              type="button"
              aria-label={c.menu}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border hover:bg-muted lg:hidden"
            >
              {menuOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="landing-mobile-menu"
            aria-label={`${c.menu} — mobile`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMenuOpen(false);
            }}
            className="border-t border-border px-4 py-3 lg:hidden"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary"
            >
              {c.login}
            </Link>
          </nav>
        )}
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <p className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span
                lang="ja"
                className="font-japanese hidden shrink-0 whitespace-nowrap text-primary sm:inline"
              >
                日本語能力試験
              </span>
              <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
              <span>{c.eyebrow}</span>
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight min-[360px]:text-[2.65rem] sm:text-6xl xl:text-7xl">
              {c.headline.map((line, index) => (
                <span key={line} className={`block ${index === 1 ? 'text-primary' : ''}`}>
                  {line}
                  {index < c.headline.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {c.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#lessons"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {c.chooseLevel}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link
                to={`/jlpt?tab=lessons&level=${level}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                {c.sampleLesson}
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{c.noAccount}</p>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-6">
              {c.heroFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                >
                  <Check size={14} className="text-primary" aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          <StudyPreview />
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-border bg-card/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-sm font-medium text-primary">{c.how}</p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.howTitle}
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {c.steps.map((step, index) => (
                <li key={step.title} className="border-t border-border pt-5">
                  <span className="text-sm font-medium tabular-nums text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="mb-3 mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="lessons"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-primary">{c.levels}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.levelsTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {c.levelsDescription}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-5 gap-2" role="group" aria-label={c.chooseLevel}>
            {LANDING_LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={level === item}
                onClick={() => selectLevel(item)}
                className={`min-h-14 rounded-xl border text-base font-semibold transition-colors ${level === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div
            className="mt-4 grid gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-[1fr_1fr] md:gap-12"
            aria-live="polite"
          >
            <div>
              <p className="text-sm font-semibold text-primary">JLPT {level}</p>
              <h3 className="mt-3 text-2xl font-semibold">{levelCopy.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {levelCopy.description}
              </p>
              <Link
                to={`/jlpt?tab=lessons&level=${level}`}
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {level} {c.openLessons}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-medium">{c.levelTopics}</p>
              <ul className="space-y-4">
                {levelCopy.topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    {topic}
                  </li>
                ))}
              </ul>
              <a
                href="#app"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {level} {c.tryLevel}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="app"
          className="scroll-mt-24 border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div className="lg:pt-6">
              <p className="mb-3 text-sm font-medium text-primary">{c.sampleEyebrow}</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {c.sampleTitle}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {c.sampleDescription}
              </p>
              <label htmlFor="sample-level" className="mb-2 mt-6 block text-sm font-medium">
                {c.levels}
              </label>
              <select
                id="sample-level"
                name="sampleLevel"
                value={level}
                onChange={(event) => selectLevel(event.target.value as LandingLevel)}
                className="min-h-11 w-full max-w-48 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              >
                {LANDING_LEVELS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <SampleExercise key={level} level={level} />
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.featuresTitle}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {c.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <Icon size={22} className="mb-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">{c.extras}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {c.extraDescription}
              </p>
            </div>
            <Link
              to="/speaking-coach?lang=ja"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {c.extraLink}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-24 border-t border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">{c.faq}</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {c.faqTitle}
              </h2>
              <Link
                to="/pricing"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {c.pricing}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {c.faqs.map((faq) => (
                <details key={faq.question} className="group py-2">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="pb-5 pr-6 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary/5 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              {c.finalTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {c.finalDescription}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#lessons"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                {c.chooseLevel}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <Link
                to="/register?redirect=/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-medium text-primary hover:underline"
              >
                {c.createAccount}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
          <div>
            <Link to="/" aria-label="Kaiwa Live">
              <AppLogo size="sm" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{c.footer}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Kaiwa Live. {c.copyright}
            </p>
          </div>
          <nav aria-label={c.footer} className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <Link
              to="/jlpt"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              JLPT N5–N1
            </Link>
            <Link
              to="/pricing"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              {c.pricing}
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              {c.login}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
