import React from 'react';
import { ArrowRight, BookOpen, Headphones, Mic, PenTool, Sparkles } from 'lucide-react';
import { SkillPillarScore } from '../../services/JlptReadinessService';
import { useLanguage } from '../../context/LanguageContext';

export interface JlptSkillsBreakdownProps {
  pillars: SkillPillarScore[];
  onNavigate?: (route: string) => void;
}

export const JlptSkillsBreakdown: React.FC<JlptSkillsBreakdownProps> = ({
  pillars,
  onNavigate,
}) => {
  const { language } = useLanguage();
  const langKey = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';

  const getPillarRoute = (key: SkillPillarScore['key']): string => {
    switch (key) {
      case 'vocabulary':
        return '/decks';
      case 'kanji':
        return '/jlpt?tab=kanji';
      case 'grammar':
        return '/jlpt?tab=grammar';
      case 'reading':
        return '/jlpt?tab=reading';
      case 'listening':
        return '/jlpt?tab=listening';
      case 'speaking':
        return '/coach';
      case 'moji_goi':
        return '/jlpt?tab=goi';
      default:
        return '/jlpt';
    }
  };

  const getPillarIcon = (key: SkillPillarScore['key']) => {
    switch (key) {
      case 'vocabulary':
      case 'moji_goi':
        return <BookOpen size={18} className="text-indigo-500" />;
      case 'kanji':
        return <PenTool size={18} className="text-amber-500" />;
      case 'grammar':
        return <Sparkles size={18} className="text-rose-500" />;
      case 'reading':
        return <BookOpen size={18} className="text-emerald-500" />;
      case 'listening':
        return <Headphones size={18} className="text-sky-500" />;
      case 'speaking':
        return <Mic size={18} className="text-emerald-500" />;
    }
  };

  const getStatusBadge = (status: SkillPillarScore['status']) => {
    switch (status) {
      case 'mastered':
        return {
          label: language === 'ja' ? 'マスター' : language === 'en' ? 'Mastered' : 'Mukammal',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'proficient':
        return {
          label: language === 'ja' ? '上級' : language === 'en' ? 'Proficient' : 'Kuchli',
          cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        };
      case 'developing':
        return {
          label: language === 'ja' ? '学習中' : language === 'en' ? 'Developing' : "O'rta",
          cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'beginner':
      default:
        return {
          label: language === 'ja' ? '初級' : language === 'en' ? 'Beginner' : "Boshlang'ich",
          cls: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const handleAction = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else if (typeof window !== 'undefined') {
      window.location.assign(route);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black tracking-tight text-foreground sm:text-base">
          {language === 'ja'
            ? 'スキル別 進捗・克服モジュール'
            : language === 'en'
              ? 'Skill Pillars & Direct Action'
              : '5 Ustun Boʻyicha Koʻrsatkichlar & Mashgʻulotlar'}
        </h4>
        <span className="text-xs text-muted-foreground">
          {language === 'ja'
            ? 'タップして直接練習へ'
            : "Tanlab to'g'ridan-to'g'ri mashq qilish mumkin"}
        </span>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          pillars.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
        }`}
      >
        {pillars.map((pillar) => {
          const badge = getStatusBadge(pillar.status);
          const route = getPillarRoute(pillar.key);

          return (
            <div
              key={pillar.key}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                    {getPillarIcon(pillar.key)}
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <h5 className="mt-3 text-xs font-black text-foreground sm:text-sm">
                  {pillar.name[langKey]}
                </h5>

                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="font-bold text-foreground">{pillar.score}%</span>
                  <span className="text-[11px] text-muted-foreground">
                    {pillar.currentCount} / {pillar.targetCount}
                  </span>
                </div>
                {pillar.evidenceState !== 'measured' && (
                  <p className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {pillar.evidenceState === 'estimated'
                      ? language === 'ja'
                        ? '推定値'
                        : language === 'en'
                          ? 'Estimated from related practice'
                          : "Bog'liq mashqlardan taxmin"
                      : language === 'ja'
                        ? '評価データ不足'
                        : language === 'en'
                          ? 'Insufficient assessment data'
                          : 'Baholash maʼlumoti yetarli emas'}
                  </p>
                )}

                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleAction(route)}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2 text-[11px] font-extrabold text-foreground transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
              >
                <span>
                  {language === 'ja' ? '練習する' : language === 'en' ? 'Practice' : 'Mashq qilish'}
                </span>
                <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
