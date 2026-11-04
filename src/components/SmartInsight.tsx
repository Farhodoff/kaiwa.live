import { Brain, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import React, { useState, memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudyData } from '../context/StudyPlannerContext';
import { generateStudyInsight } from '../utils/ai';
import { Button } from './ui/Button';
import { StudySession, Subject, Task } from '../types';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../context/LanguageContext';

interface SmartInsightContentProps {
  sessions: StudySession[];
  subjects: Subject[];
  tasks: Task[];
}

const SmartInsightContent: React.FC<SmartInsightContentProps> = memo(
  ({ sessions, subjects, tasks }) => {
    const { language } = useLanguage();
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = useCallback(async () => {
      if (sessions.length < 3 && tasks.length < 3) {
        toast({
          variant: 'destructive',
          title: "Ma'lumotlar kam",
          description:
            "Tahlil uchun kamida 3 ta dars yoki o'qish sessiyasi kerak. Ko'proq shug'ullaning! 📚",
        });
        return;
      }

      setLoading(true);
      try {
        const stats = subjects.map((s) => {
          const subjectSessions = sessions.filter((sess) => sess.subjectId === s.id);
          const hours = subjectSessions.reduce((acc, sess) => acc + sess.duration, 0) / 60;
          const mood =
            subjectSessions.length > 0
              ? subjectSessions.reduce(
                  (acc, sess) => acc + (sess.moodAfter || sess.moodBefore || 3),
                  0,
                ) / subjectSessions.length
              : 3;
          const subjectTasks = tasks.filter((t) => t.subjectId === s.id);
          const completedTasks = subjectTasks.filter((t) => t.completed);
          const progress =
            subjectTasks.length > 0
              ? Math.round((completedTasks.length / subjectTasks.length) * 100)
              : 0;

          return {
            name: s.name,
            subject: s.name,
            hours,
            mood,
            pendingTasks: subjectTasks.length - completedTasks.length,
            masteryScore: 0,
            progress,
            mastery: progress,
          };
        });
        const result = await generateStudyInsight(stats);
        const mdInsight = result.map((r) => `### ${r.subject}\n${r.advice}`).join('\n\n');
        setInsight(mdInsight || "Hozircha yetarli ma'lumot yo'q.");
      } catch (error: unknown) {
        console.error('AI Insight Error:', error);
        toast({
          variant: 'destructive',
          title: 'AI Xizmati',
          description: (error as Error).message || 'AI xizmatida xatolik yuz berdi.',
        });
      } finally {
        setLoading(false);
      }
    }, [sessions, subjects, tasks]);

    return (
      <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
        {/* Decor */}
        <div className="absolute right-0 top-0 p-4 opacity-10">
          <Brain size={150} />
        </div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 animate-pulse rounded-full bg-purple-500 opacity-30 blur-3xl"></div>

        <div className="relative z-10">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="flex items-center gap-3 text-3xl font-bold">
                <Sparkles className="animate-pulse text-yellow-300" size={28} />
                {language === 'ja' ? 'AI スマートぶんせき' : 'AI Aqlli Tahlil'}
              </h2>
              <p className="mt-2 max-w-xl text-lg leading-relaxed text-indigo-100">
                {language === 'ja'
                  ? 'AIが あなたのがくしゅうを ぶんせきして、アドバイスを します。'
                  : "Sun'iy intellekt sizning o'qish odatlaringizni o'rganib, samaradorlikni oshirish bo'yicha shaxsiy maslahatlar beradi."}
              </p>
            </div>
            {!insight && (
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="transform rounded-2xl border-none bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-xl transition-all hover:scale-105 hover:bg-gray-100 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />{' '}
                    {language === 'ja' ? 'ぶんせきちゅう...' : 'Tahlil qilinmoqda...'}
                  </span>
                ) : language === 'ja' ? (
                  '🔍 ぶんせきを スタート'
                ) : (
                  '🔍 Tahlilni Boshlash'
                )}
              </Button>
            )}
          </div>

          {insight && (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-inner backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-yellow-400/20 p-3 text-yellow-300">
                  <Lightbulb size={32} />
                </div>
                <div className="prose prose-lg prose-invert max-w-none">
                  <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setInsight(null)}
                  variant="ghost"
                  className="text-indigo-200 hover:bg-white/10 hover:text-white"
                >
                  {language === 'ja' ? 'とじる' : 'Yopish'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

const SmartInsight: React.FC = () => {
  const { sessions, subjects, tasks } = useStudyData();

  return <SmartInsightContent sessions={sessions} subjects={subjects} tasks={tasks} />;
};

export default SmartInsight;
