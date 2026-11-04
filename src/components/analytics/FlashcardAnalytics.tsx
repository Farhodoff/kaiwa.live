import React, { useMemo, memo } from 'react';
import { SvgBarChart, SvgPieChart } from '../ui/SvgCharts';
import { TrendingUp } from 'lucide-react';
import { Flashcard } from '../../types';

interface FlashcardAnalyticsProps {
  flashcards: Flashcard[];
}

const FlashcardAnalytics: React.FC<FlashcardAnalyticsProps> = memo(({ flashcards }) => {
  // Daily Flashcard Reviews (Last 7 days)
  const dailyReviewsData = useMemo(() => {
    const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
    const data = days.map((name, index) => ({ name, cards: 0, dayIndex: index }));

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    flashcards.forEach((card) => {
      if (card.repetitions > 0) {
        const lastReview = new Date(card.nextReviewDate); // Proxy logic
        if (lastReview >= oneWeekAgo && lastReview <= now) {
          const dayIndex = lastReview.getDay();
          data[dayIndex].cards += 1;
        }
      }
    });

    return data;
  }, [flashcards]);

  // Flashcard Status Distribution
  const statusData = useMemo(() => {
    const statuses = {
      mastered: 0, // repetitions >= 10
      learning: 0, // 3 <= repetitions < 10
      new: 0, // repetitions < 3
    };

    flashcards.forEach((card) => {
      if (card.repetitions >= 10) {
        statuses.mastered++;
      } else if (card.repetitions >= 3) {
        statuses.learning++;
      } else {
        statuses.new++;
      }
    });

    return [
      { name: 'Yodlangan', value: statuses.mastered, color: '#10b981' },
      { name: "O'rganilmoqda", value: statuses.learning, color: '#f59e0b' },
      { name: 'Yangi/Qiyin', value: statuses.new, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [flashcards]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Daily Reviews */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
          <TrendingUp size={16} className="text-purple-500" /> Kunlik Fleshkartalar Takrori
        </h3>
        <div className="h-64 w-full">
          <SvgBarChart
            data={dailyReviewsData}
            xKey="name"
            series={[{ dataKey: 'cards', fill: '#a855f7' }]}
            height={240}
            unit="ta karta"
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Oxirgi 7 kunda ko'rib chiqilgan kartalar
        </p>
      </div>

      {/* Status Distribution */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-extrabold text-foreground">
          Fleshkartalar O'zlashtirish Holati
        </h3>
        <div className="flex h-64 w-full items-center justify-center">
          <SvgPieChart data={statusData} height={220} innerRadius={0.55} />
        </div>
      </div>
    </div>
  );
});

export default FlashcardAnalytics;
