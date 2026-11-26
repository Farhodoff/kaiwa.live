import type { ReactNode } from 'react';
import { BookOpen, FileText, GraduationCap, Headphones, Languages, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { JLPT_STUDY_LEVELS, resolveStudyLevel, studyAreaHref } from '../../utils/jlptStudyRoutes';

export function JlptStudyShell({
  area,
  title,
  children,
}: {
  area: string;
  title: string;
  children: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const { settings, updateSettings, targetLevel } = useStudyData();
  const { language } = useLanguage();
  const level = resolveStudyLevel(params.get('level'), targetLevel);
  return (
    <div className="study-page">
      <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={
              language === 'uz' ? 'JLPT darajasi' : language === 'ja' ? 'JLPTレベル' : 'JLPT level'
            }
          >
            {JLPT_STUDY_LEVELS.map((item) => (
              <button
                key={item}
                aria-pressed={level === item}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('level', item);
                  setParams(next);
                }}
                className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${level === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            aria-pressed={settings.showFurigana}
            onClick={() => updateSettings({ showFurigana: !settings.showFurigana })}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium transition-colors ${settings.showFurigana ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Furigana <span className="text-xs">{settings.showFurigana ? 'ON' : 'OFF'}</span>
          </button>
          <button
            aria-pressed={settings.showRomaji}
            onClick={() => updateSettings({ showRomaji: !settings.showRomaji })}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium transition-colors ${settings.showRomaji ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Romaji <span className="text-xs">{settings.showRomaji ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>
      <nav
        aria-label={
          language === 'uz' ? 'O‘quv yo‘nalishlari' : language === 'ja' ? '学習分野' : 'Study areas'
        }
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {[
          { area: 'lessons', icon: BookOpen, uz: 'Darsliklar', en: 'Lessons', ja: 'レッスン' },
          { area: 'goi', icon: Languages, uz: 'Lug‘at', en: 'Vocabulary', ja: '語彙' },
          { area: 'kanji', icon: GraduationCap, uz: 'Kanji', en: 'Kanji', ja: '漢字' },
          { area: 'grammar', icon: Sparkles, uz: 'Grammatika', en: 'Grammar', ja: '文法' },
          { area: 'reading', icon: FileText, uz: 'O‘qish', en: 'Reading', ja: '読解' },
          { area: 'listening', icon: Headphones, uz: 'Tinglash', en: 'Listening', ja: '聴解' },
        ].map((item) => (
          <Link
            key={item.area}
            to={studyAreaHref(item.area, level, params)}
            aria-current={area === item.area ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${area === item.area ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
          >
            <item.icon size={17} aria-hidden="true" />
            {item[language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz']}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
