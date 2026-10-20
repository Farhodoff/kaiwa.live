import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  PenTool,
  FileText,
  Headphones,
  Edit3,
  Mic,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import { JlptLevel } from '../../services/JlptReadinessService';
import { MasterySkill, MasteryStatus } from '../../types/mastery';
import { SkillMatrixService } from '../../services/SkillMatrixService';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface JlptSkillMatrixViewProps {
  initialLevel?: JlptLevel;
  onNavigateRoute?: (route: string) => void;
}

export const JlptSkillMatrixView: React.FC<JlptSkillMatrixViewProps> = ({
  initialLevel = 'N5',
  onNavigateRoute,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>(initialLevel);
  const [activeSkill, setActiveSkill] = useState<MasterySkill>('vocabulary');

  const langKey = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';

  const report = useMemo(() => {
    return SkillMatrixService.computeLevelReport(selectedLevel);
  }, [selectedLevel]);

  const handleAction = (route: string) => {
    if (onNavigateRoute) {
      onNavigateRoute(route);
    } else {
      navigate(route);
    }
  };

  const getSkillIcon = (skill: MasterySkill, size = 18) => {
    switch (skill) {
      case 'vocabulary':
        return <BookOpen size={size} className="text-indigo-500" />;
      case 'grammar':
        return <Sparkles size={size} className="text-purple-500" />;
      case 'kanji':
        return <PenTool size={size} className="text-amber-500" />;
      case 'reading':
        return <FileText size={size} className="text-emerald-500" />;
      case 'listening':
        return <Headphones size={size} className="text-sky-500" />;
      case 'writing':
        return <Edit3 size={size} className="text-rose-500" />;
      case 'speaking':
        return <Mic size={size} className="text-teal-500" />;
    }
  };

  const getStatusBadge = (status: MasteryStatus) => {
    switch (status) {
      case 'mastered':
        return {
          label: language === 'ja' ? '完全習得' : language === 'en' ? 'Mastered' : 'Mukammal',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'proficient':
      case 'strong':
        return {
          label: language === 'ja' ? '高習得' : language === 'en' ? 'Proficient' : 'Kuchli',
          cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
      case 'developing':
      case 'learning':
        return {
          label: language === 'ja' ? '発展中' : language === 'en' ? 'Developing' : "O'rta",
          cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'weak':
      case 'not_started':
      default:
        return {
          label:
            language === 'ja' ? '基礎・要練習' : language === 'en' ? 'Focus Area' : 'Mashq zarur',
          cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
    }
  };

  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const allSkills: MasterySkill[] = [
    'vocabulary',
    'grammar',
    'kanji',
    'reading',
    'listening',
    'writing',
    'speaking',
  ];

  const currentSkillData = report.skills[activeSkill];

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-6">
      {/* Header & Level Selector */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                {language === 'ja'
                  ? '7分野 JLPT スキルマトリクス'
                  : language === 'en'
                    ? '7-Pillar JLPT Skill Matrix'
                    : "7 Yo'nalishli JLPT Ko'nikmalar Matritsasi"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? '各レベルにおける7つの重要スキルとマルチフォーマット習得基準'
                  : language === 'en'
                    ? '7 core skills with multi-format testing & 85% mastery benchmarks'
                    : "85% aniqlik mezonlari va ko'p formatli tasdiqlash bilan ko'nikmalar holati"}
              </p>
            </div>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all ${
                selectedLevel === lvl
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Top High-Level Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {language === 'ja'
                ? '全体進捗'
                : language === 'en'
                  ? 'Level Progress'
                  : "Umumiy O'zlashtirish"}
            </span>
            <TrendingUp size={15} className="text-primary" />
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">
            {report.overallCompletionRate}%
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${report.overallCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {language === 'ja'
                ? '完全習得スキル'
                : language === 'en'
                  ? 'Mastered Skills'
                  : 'Mukammal Skilllar'}
            </span>
            <Award size={15} className="text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">
            {report.masteredSkillsCount}{' '}
            <span className="text-xs font-bold text-muted-foreground">/ 7</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {language === 'ja'
              ? '85%以上＆複数形式'
              : language === 'en'
                ? '85%+ & multi-format'
                : '85%+ va multi-format'}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {language === 'ja'
                ? '小項目マスター'
                : language === 'en'
                  ? 'Competencies'
                  : 'Kompetensiyalar'}
            </span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">
            {report.masteredCompetenciesCount}{' '}
            <span className="text-xs font-bold text-muted-foreground">
              / {report.totalCompetenciesCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {language === 'ja'
              ? '詳細チェック基準'
              : language === 'en'
                ? 'Sub-benchmarks'
                : 'Kichik mezonlar'}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {language === 'ja'
                ? '弱点克服'
                : language === 'en'
                  ? 'Priority Area'
                  : 'Zaif Nuqtalar'}
            </span>
            <AlertCircle size={15} className="text-rose-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">
            {report.topWeaknesses.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {language === 'ja'
              ? '強化推奨項目'
              : language === 'en'
                ? 'Recommended drills'
                : 'Tavsiya mashqlar'}
          </div>
        </div>
      </div>

      {/* Weakness Alert if any */}
      {report.topWeaknesses.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Zap size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-foreground">
                {language === 'ja'
                  ? '⚡ 優先復習ポイント: '
                  : language === 'en'
                    ? '⚡ Priority Review: '
                    : '⚡ Eng Muhim Takrorlash: '}
              </span>
              <span className="text-muted-foreground">{report.topWeaknesses[0].reason}</span>
            </div>
            <button
              onClick={() => handleAction(report.topWeaknesses[0].recommendedRoute)}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/20 active:scale-95 dark:text-amber-400"
            >
              <span>
                {language === 'ja' ? '今すぐ強化' : language === 'en' ? 'Practice' : 'Mashq qilish'}
              </span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 7 Skill Selection Tabs */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
        {allSkills.map((sk) => {
          const sData = report.skills[sk];
          const badge = getStatusBadge(sData.status);
          const isActive = activeSkill === sk;

          return (
            <button
              key={sk}
              onClick={() => setActiveSkill(sk)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {getSkillIcon(sk, 16)}
              <span>{sData.title[langKey]}</span>
              <span
                className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${
                  isActive
                    ? 'border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground'
                    : badge.cls
                }`}
              >
                {sData.score}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Skill Deep Dive */}
      {currentSkillData && (
        <div className="space-y-5 rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
          {/* Skill Title & Action Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                {getSkillIcon(activeSkill, 20)}
                <h4 className="text-base font-black text-foreground">
                  {currentSkillData.title[langKey]}
                </h4>
                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                    getStatusBadge(currentSkillData.status).cls
                  }`}
                >
                  {getStatusBadge(currentSkillData.status).label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentSkillData.description[langKey]}
              </p>
            </div>

            <button
              onClick={() => handleAction(currentSkillData.practiceRoute)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-95"
            >
              <span>
                {language === 'ja'
                  ? 'このスキルを鍛える'
                  : language === 'en'
                    ? 'Train Skill'
                    : "Ushbu Ko'nikmani Mashq Qilish"}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Validation Indicators (Multi-Format & SRS Retention) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  currentSkillData.score >= 80
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <TrendingUp size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground">
                  {language === 'ja'
                    ? '習得度スコア'
                    : language === 'en'
                      ? 'Mastery Score'
                      : "O'zlashtirish Balli"}
                </div>
                <div className="font-semibold text-muted-foreground">
                  {currentSkillData.score}% (Maqsad: 85%+)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  currentSkillData.multiFormatPassed
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                <Layers size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground">
                  {language === 'ja'
                    ? '複数形式の検証'
                    : language === 'en'
                      ? 'Multi-Format Valid'
                      : "Ko'p Formatli Tekshiruv"}
                </div>
                <div className="text-muted-foreground">
                  {currentSkillData.multiFormatPassed
                    ? language === 'ja'
                      ? '2形式以上確認済 (達成)'
                      : language === 'en'
                        ? '2+ formats confirmed'
                        : '2+ formatda tasdiqlangan'
                    : language === 'ja'
                      ? '他形式の演習が必要'
                      : language === 'en'
                        ? 'Need 2+ test types'
                        : 'Boshqa formatlar kerak'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  currentSkillData.retentionPassed
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground">
                  {language === 'ja'
                    ? '定着率 (Retention)'
                    : language === 'en'
                      ? 'Retention Rate'
                      : 'Xotirada Saqlanish'}
                </div>
                <div className="font-semibold text-muted-foreground">
                  {currentSkillData.retentionPassed
                    ? language === 'ja'
                      ? '安定 (80%+)'
                      : language === 'en'
                        ? 'Stable (80%+)'
                        : 'Barqaror (80%+)'
                    : language === 'ja'
                      ? '復習を推奨'
                      : language === 'en'
                        ? 'Review suggested'
                        : 'Qayta takrorlash kerak'}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-competencies Table / Cards */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {language === 'ja'
                ? '📋 サブコンピテンシー・詳細達成基準'
                : language === 'en'
                  ? '📋 Sub-Competencies & Benchmark Criteria'
                  : '📋 Kichik Ko‘nikmalar va Mezonlar'}
            </h5>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {currentSkillData.competencies.map((comp) => {
                const compBadge = getStatusBadge(comp.status);
                return (
                  <div
                    key={comp.competencyId}
                    className="shadow-2xs flex flex-col justify-between rounded-xl border border-border bg-card p-3.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {comp.name[langKey]}
                        </span>
                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-black ${compBadge.cls}`}
                        >
                          {compBadge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {comp.description[langKey]}
                      </p>
                    </div>

                    <div className="mt-3 border-t border-border/60 pt-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {language === 'ja'
                            ? '達成度 / 目標: '
                            : language === 'en'
                              ? 'Progress / Goal: '
                              : 'Bajarilgan / Maqsad: '}
                          <strong className="text-foreground">
                            {comp.currentCount} / {comp.targetCount}
                          </strong>
                        </span>
                        <span className="font-bold text-primary">{comp.accuracy}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round((comp.currentCount / comp.targetCount) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{comp.benchmarkRule}</span>
                        {comp.formatsTested.length > 0 && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold">
                            {comp.formatsTested.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
