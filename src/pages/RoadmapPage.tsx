import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Play,
  AlertTriangle,
  FastForward,
  Trophy,
  BookOpen,
  Clock,
  Compass,
  ArrowRight,
  X,
} from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { LearningOrchestrator } from '../services/LearningOrchestrator';
import { RoadmapService } from '../services/RoadmapService';
import { LearningRoadmap, RoadmapLevelNode, RoadmapLessonNode } from '../types/curriculum';

const RoadmapPage: React.FC = () => {
  useSEO({
    title: "Yapon Tili O'quv Yo'l Xaritasi (N5 dan N1 gacha)",
    description:
      "Yapon tilini noldan o'rganuvchilar va JLPT imtihoniga tayyorlanuvchilar uchun bosqichma-bosqich tizimli o'quv yo'l xaritasi (Roadmap).",
    canonical: '/roadmap',
    keywords:
      "yapon tili roadmap, yapon tili noldan reja, JLPT N5 N4 N3 N2 N1 o'quv rejasi, yapon tili qanday o'rganiladi, kaiwa.live",
  });

  const { targetLevel, targetGoal, flashcards, user } = useStudyData();
  const effectiveLang = 'ja' as const;
  const { language } = useLanguage();
  const isUz = language !== 'en';

  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [lockedModalLesson, setLockedModalLesson] = useState<RoadmapLessonNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    LearningOrchestrator.getUserLearningState(user?.id, {
      forceLanguage: effectiveLang,
      cachedFlashcards: flashcards,
    })
      .then((state) => {
        if (isMounted) {
          const rm = RoadmapService.getLearningRoadmap(state);
          setRoadmap(rm);
          setSelectedLevel(rm.currentLevelCode);
        }
      })
      .catch((err) => {
        console.warn('[RoadmapPage] Error loading roadmap:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveLang, targetLevel, targetGoal, flashcards.length, user?.id]);

  if (loading || !roadmap) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const activeLevelData: RoadmapLevelNode | undefined =
    roadmap.levels.find((l) => l.code === selectedLevel) ||
    roadmap.activeLevelNode ||
    roadmap.levels[0];
  const nextRecommendedLesson = RoadmapService.getNextRecommendedLesson(roadmap);

  const getStatusBadge = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} />
            {score ? `${score}%` : isUz ? 'Tugatilgan' : 'Completed'}
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex animate-pulse items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Play size={13} />
            {isUz ? 'Jarayonda' : 'In Progress'}
          </span>
        );
      case 'current':
        return (
          <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Compass size={13} />
            {isUz ? 'Joriy Dars' : 'Current'}
          </span>
        );
      case 'weak':
        return (
          <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <AlertTriangle size={13} />
            {isUz ? "Zaif Ko'nikma" : 'Needs Practice'}
          </span>
        );
      case 'skipped':
        return (
          <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <FastForward size={13} />
            {isUz ? "O'tkazilgan" : 'Skipped'}
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <Lock size={13} />
            {isUz ? 'Qulflangan' : 'Locked'}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 duration-200 animate-in fade-in md:p-8">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl">🇯🇵</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                Japanese JLPT Roadmap
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                • {roadmap.targetGoal}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {isUz ? "Shaxsiy O'quv Yo'l Xaritasi" : 'Personalized Learning Roadmap'}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isUz
                ? `Hozirgi bosqichingiz: ${roadmap.currentLevelCode}. Maqsadingiz: ${roadmap.targetLevelCode}.`
                : `Current level: ${roadmap.currentLevelCode}. Target destination: ${roadmap.targetLevelCode}.`}
            </p>
            <div className="pt-1">
              <Link
                to="/diagnostic"
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
              >
                <span>🎯</span>
                <span>{isUz ? 'Diagnostik Test Topshirish' : 'Take Placement Test'}</span>
              </Link>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4 px-6">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Trophy size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {isUz ? "Umumiy O'quv Dasturi" : 'Overall Curriculum'}
              </div>
              <div className="text-2xl font-black text-foreground">
                {roadmap.overallProgressPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Milestones Timeline */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Compass size={16} />
          {isUz ? 'Bosqichlar (Levels)' : 'Curriculum Milestones'}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {roadmap.levels.map((lvl) => {
            const isSelected = lvl.code === selectedLevel;
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.code)}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'scale-[1.02] border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">{lvl.code}</span>
                  {lvl.status === 'completed' && (
                    <CheckCircle2
                      size={16}
                      className={isSelected ? 'text-white' : 'text-emerald-500'}
                    />
                  )}
                  {lvl.status === 'current' && (
                    <Compass
                      size={16}
                      className={isSelected ? 'animate-spin text-white' : 'text-[#C9A961]'}
                    />
                  )}
                  {lvl.status === 'locked' && (
                    <Lock
                      size={14}
                      className={isSelected ? 'text-white/60' : 'text-muted-foreground'}
                    />
                  )}
                </div>
                <div>
                  <div className="line-clamp-1 text-xs font-bold opacity-90">{lvl.title}</div>
                  <div className="mb-1.5 text-[11px] opacity-75">
                    {lvl.progressPercentage}% {isUz ? 'bajarildi' : 'complete'}
                  </div>
                  <div
                    className={`h-1.5 w-full overflow-hidden rounded-full ${isSelected ? 'bg-white/25' : 'bg-secondary'}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-white' : 'bg-primary'}`}
                      style={{ width: `${lvl.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Level Deep View */}
      {activeLevelData && (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-foreground">
                  {activeLevelData.code} — {activeLevelData.title}
                </span>
                {getStatusBadge(activeLevelData.status)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{activeLevelData.description}</p>
            </div>
          </div>

          {/* Active Units & Lessons Tree */}
          <div className="space-y-6">
            {activeLevelData.units.map((unit) => (
              <div key={unit.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <BookOpen size={16} className="text-primary" />
                    {unit.title}
                  </h4>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {unit.progressPercentage}%
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {unit.lessons.map((lesson) => {
                    const isLocked = lesson.status === 'locked';
                    const isRecommended =
                      nextRecommendedLesson?.id === lesson.id &&
                      lesson.status !== 'completed' &&
                      !isLocked;
                    return (
                      <div
                        key={lesson.id}
                        className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-all ${
                          isRecommended
                            ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/40'
                            : lesson.status === 'current' || lesson.status === 'in_progress'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : isLocked
                                ? 'border-border/40 bg-secondary/20 opacity-70'
                                : 'glass-card border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                                {lesson.skill}
                              </span>
                              {isRecommended && (
                                <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
                                  🎯 {isUz ? 'Tavsiya' : 'Next'}
                                </span>
                              )}
                            </div>
                            {getStatusBadge(lesson.status, lesson.score)}
                          </div>
                          <h5 className="line-clamp-1 text-sm font-bold text-foreground">
                            {lesson.title}
                          </h5>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/40 pt-2">
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Clock size={12} /> ~{lesson.estimatedMinutes} daq
                          </span>

                          {isLocked ? (
                            <button
                              onClick={() => setLockedModalLesson(lesson)}
                              className="flex items-center gap-1 p-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                              <Lock size={12} /> {isUz ? 'Qulflangan' : 'Locked'}
                            </button>
                          ) : lesson.isContentAvailable === false ? (
                            <span className="rounded-xl bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                              {isUz ? 'Tez orada' : 'Coming soon'}
                            </span>
                          ) : (
                            <Link
                              to={lesson.route}
                              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                isRecommended ||
                                lesson.status === 'current' ||
                                lesson.status === 'in_progress'
                                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                                  : 'bg-secondary text-foreground hover:bg-secondary/80'
                              }`}
                            >
                              <span>
                                {lesson.status === 'completed'
                                  ? isUz
                                    ? "Qayta Ko'rish"
                                    : 'Review'
                                  : isUz
                                    ? 'Boshlash'
                                    : 'Start'}
                              </span>
                              <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Lesson Explanation Modal */}
      {lockedModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md space-y-4 rounded-3xl border border-border p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <Lock size={20} />
                <h3 className="text-base font-bold text-foreground">
                  {isUz ? 'Ushbu Dars Qulflangan' : 'Lesson Locked'}
                </h3>
              </div>
              <button
                onClick={() => setLockedModalLesson(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {lockedModalLesson.lockReason ||
                (isUz
                  ? 'Ushbu darsni ochish uchun avval oldingi mavzular va testlarni muvaffaqiyatli yakunlashingiz kerak.'
                  : 'You must complete prerequisite topics before accessing this lesson.')}
            </p>

            <button
              onClick={() => setLockedModalLesson(null)}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              {isUz ? 'Tushundim' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
