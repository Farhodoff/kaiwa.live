import React, { useMemo } from 'react';
import { AlertTriangle, Clock3, Target } from 'lucide-react';
import { TimedSkillAssessmentService } from '../../services/TimedSkillAssessmentService';

const label: Record<string, string> = {
  vocabulary: 'Lug‘at',
  grammar: 'Grammatika',
  reading: 'O‘qish',
  listening: 'Tinglash',
};

export const JlptWeaknessDashboard: React.FC = () => {
  const summaries = useMemo(() => TimedSkillAssessmentService.summarize(), []);
  const observed = summaries.filter((summary) => summary.accuracy !== null);
  const weakest = [...observed].sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))[0];
  const slowest = [...observed].sort(
    (a, b) => (b.averageDurationMs ?? 0) - (a.averageDurationMs ?? 0),
  )[0];

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Target className="text-primary" size={20} />
        <div>
          <h2 className="font-black">JLPT zaiflik tahlili</h2>
          <p className="text-xs text-muted-foreground">
            Faqat qayd qilingan vaqtli urinishlardan hisoblanadi. Bu rasmiy JLPT scaled score emas.
          </p>
        </div>
      </div>
      {observed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Hali vaqtli baholash maʼlumoti yo‘q. Mock yoki skill mashqini bajaring.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-sm">
              <AlertTriangle size={16} className="mb-1 text-rose-500" />
              Eng ko‘p xato: <b>{label[weakest.skill]}</b> ({weakest.accuracy}%)
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-sm">
              <Clock3 size={16} className="mb-1 text-amber-500" />
              Eng sekin: <b>{label[slowest.skill]}</b> (
              {Math.round((slowest.averageDurationMs ?? 0) / 1000)} soniya)
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {summaries.map((summary) => (
              <div key={summary.skill} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex justify-between font-bold">
                  <span>{label[summary.skill]}</span>
                  <span>
                    {summary.accuracy === null ? 'Maʼlumot yetarli emas' : `${summary.accuracy}%`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.attempts} urinish · {summary.skipped} o‘tkazib yuborilgan · so‘nggi 10
                  ta: {summary.recentAccuracy ?? '—'}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
