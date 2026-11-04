import React, { useMemo, memo } from 'react';
import { SvgLineChart } from '../ui/SvgCharts';
import { CoachSession } from '../../types';
import { Bot, MessageSquare, TrendingUp } from 'lucide-react';

interface CoachAnalyticsProps {
  sessions: CoachSession[];
}

const CoachAnalytics: React.FC<CoachAnalyticsProps> = memo(({ sessions }) => {
  // We want the oldest first for the chart, so reverse the array since it comes newest first
  const chartData = useMemo(() => {
    return [...sessions].reverse().map((s) => {
      const date = new Date(s.createdAt);
      return {
        name: `${date.getDate()}/${date.getMonth() + 1}`,
        Fluency: s.fluencyScore,
        Vocabulary: s.vocabularyScore,
        Grammar: s.grammarScore,
        Pronunciation: s.pronunciationScore,
        FullDate: date.toLocaleString(),
      };
    });
  }, [sessions]);

  const recentFeedback = useMemo(() => {
    // Just take the top 3 latest sessions that have feedback
    return sessions.filter((s) => s.feedback && s.feedback.trim() !== '').slice(0, 3);
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="col-span-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1f2937]">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Bot size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Coach Natijalari</h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Hali AI Coach bilan suhbat o'tkazmagansiz. Speaking bo'limida mashq qilib ko'ring!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#1f2937]">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <TrendingUp size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          AI Coach O'sish Grafiklari
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <div className="h-72 w-full">
            <SvgLineChart
              data={chartData}
              xKey="name"
              series={[
                { dataKey: 'Fluency', stroke: '#6366f1', name: 'Fluency' },
                { dataKey: 'Vocabulary', stroke: '#10b981', name: 'Vocabulary' },
                { dataKey: 'Grammar', stroke: '#f59e0b', name: 'Grammar' },
                { dataKey: 'Pronunciation', stroke: '#ec4899', name: 'Pronunciation' },
              ]}
              height={270}
              unit="ball"
            />
          </div>
        </div>

        {/* Feedback Section */}
        <div className="flex flex-col lg:col-span-1">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <MessageSquare size={16} />
            So'nggi Tavsiyalar
          </h4>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {recentFeedback.map((session, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {session.personaTitle}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="line-clamp-4 text-sm text-gray-600 dark:text-gray-300">
                  {session.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CoachAnalytics;
