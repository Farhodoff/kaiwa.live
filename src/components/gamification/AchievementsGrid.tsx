import React, { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { ACHIEVEMENTS_REGISTRY, AchievementService } from '../../services/AchievementService';
import { DailyQuestService } from '../../services/DailyQuestService';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useLanguage } from '../../context/LanguageContext';
import { AchievementCategory, AchievementDefinition } from '../../types/gamification';
import { toast } from '../../hooks/use-toast';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

export const AchievementsGrid: React.FC = () => {
  const { currentStreak, awardXP } = useGamificationStore();
  const { language } = useLanguage();
  const { haptics } = useTelegramWebApp();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [unlockedList, setUnlockedList] = useState(() =>
    AchievementService.getUnlockedAchievements(null),
  );

  const langKey = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';
  const meta = DailyQuestService.getGamificationMeta(null);

  const unlockedMap = new Map(unlockedList.map((u) => [u.id, u]));

  const getMetricCurrentValue = (metric: AchievementDefinition['metric']): number => {
    switch (metric) {
      case 'currentStreak':
        return currentStreak;
      case 'totalFlashcards':
        return meta.flashcardsReviewed;
      case 'totalKanji':
        return meta.kanjiMastered;
      case 'totalListening':
        return meta.listeningQuestionsCompleted;
      case 'totalSpeaking':
        return meta.speakingSessionsCompleted;
      case 'totalPitchAccent':
        return meta.pitchAccentPracticesCompleted;
      case 'mockExamsCompleted':
        return meta.mockExamsCompleted;
      case 'mockExamHighScore':
        return meta.highestMockScore;
      case 'dailyQuestsAllClear':
        return meta.dailyQuestsAllClearCount;
      default:
        return 0;
    }
  };

  const handleClaim = (achId: string) => {
    const res = AchievementService.claimAchievement(achId, null);
    if (res.xpAwarded > 0) {
      awardXP(res.xpAwarded);
      haptics.notification('success');
      toast({
        title:
          language === 'ja'
            ? `+${res.xpAwarded} XP バッジ獲得！`
            : language === 'en'
              ? `+${res.xpAwarded} XP Achievement Claimed!`
              : `+${res.xpAwarded} XP Nishon Bonusi Qabul Qilindi!`,
        description: res.achievement?.title[langKey],
      });
      setUnlockedList(AchievementService.getUnlockedAchievements(null));
    }
  };

  const filteredAchievements = ACHIEVEMENTS_REGISTRY.filter((a) =>
    selectedCategory === 'all' ? true : a.category === selectedCategory,
  );

  const totalAchievements = ACHIEVEMENTS_REGISTRY.length;
  const unlockedCount = unlockedList.length;

  const categories = [
    {
      id: 'all',
      label: language === 'ja' ? 'すべて' : language === 'en' ? 'All' : 'Barchasi',
      icon: '🏆',
    },
    {
      id: 'streak',
      label: language === 'ja' ? 'ストリーク' : language === 'en' ? 'Streak' : 'Streak',
      icon: '🔥',
    },
    {
      id: 'vocabulary',
      label: language === 'ja' ? '語彙・カード' : language === 'en' ? 'Vocabulary' : "So'zlar",
      icon: '📖',
    },
    {
      id: 'kanji',
      label: language === 'ja' ? '漢字' : language === 'en' ? 'Kanji' : 'Kanji',
      icon: '🖌️',
    },
    {
      id: 'listening',
      label: language === 'ja' ? '聴解' : language === 'en' ? 'Listening' : 'Tinglash',
      icon: '🎧',
    },
    {
      id: 'speaking',
      label: language === 'ja' ? 'スピーキング' : language === 'en' ? 'Speaking' : 'Speaking',
      icon: '🎙️',
    },
    {
      id: 'jlpt',
      label: language === 'ja' ? 'JLPT模試' : language === 'en' ? 'JLPT' : 'JLPT & Sinov',
      icon: '📝',
    },
  ];

  return (
    <section className="space-y-6" aria-labelledby="achievements-heading">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 id="achievements-heading" className="text-xl font-semibold tracking-tight">
            {language === 'ja' ? '実績とバッジ' : language === 'en' ? 'Achievements' : 'Yutuqlar'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === 'ja'
              ? '学習を続けて、新しいバッジを集めましょう。'
              : language === 'en'
                ? 'Keep learning and earn your next badge.'
                : 'O‘qishni davom ettiring va yangi nishonlarga erishing.'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="mr-1 text-xl font-semibold tabular-nums text-foreground">
            {unlockedCount}
          </span>
          / {totalAchievements}{' '}
          {language === 'ja' ? '獲得' : language === 'en' ? 'earned' : 'ta ochilgan'}
        </p>
      </header>
      <div
        className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border/60"
        role="group"
        aria-label={
          language === 'ja'
            ? 'バッジの種類'
            : language === 'en'
              ? 'Achievement categories'
              : 'Yutuq yo‘nalishlari'
        }
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-pressed={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id as AchievementCategory | 'all')}
            className={`min-h-11 border-b-2 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid gap-x-10 sm:grid-cols-2">
        {filteredAchievements.map((ach) => {
          const userAch = unlockedMap.get(ach.id);
          const isUnlocked = !!userAch;
          const isClaimed = userAch?.claimed || false;
          const curVal = getMetricCurrentValue(ach.metric);
          const progressPercent = isUnlocked
            ? 100
            : Math.min(100, Math.round((curVal / ach.target) * 100));
          return (
            <article
              key={ach.id}
              className="flex min-w-0 items-start gap-4 border-b border-border/50 py-6"
            >
              <div
                aria-hidden="true"
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${isUnlocked ? 'bg-primary/10' : 'bg-muted/60 grayscale'}`}
              >
                {ach.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h4 className="text-sm font-semibold leading-relaxed">{ach.title[langKey]}</h4>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {ach.description[langKey]}
                </p>
                {isUnlocked ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <CheckCircle2 size={14} />
                      {language === 'ja'
                        ? '達成済み'
                        : language === 'en'
                          ? 'Achieved'
                          : 'Erishildi'}
                    </span>
                    {!isClaimed ? (
                      <button
                        onClick={() => handleClaim(ach.id)}
                        type="button"
                        aria-label={`${ach.title[langKey]}: ${language === 'ja' ? '受取る' : language === 'en' ? 'Claim' : 'Olish'}`}
                        className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Sparkles size={14} />
                        {language === 'ja' ? '受取る' : language === 'en' ? 'Claim' : 'Olish'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {language === 'ja'
                          ? '受取完了'
                          : language === 'en'
                            ? 'Claimed'
                            : 'Qabul qilingan'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={ach.title[langKey]}
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-primary/70 transition-[width]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {curVal} / {ach.target}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
