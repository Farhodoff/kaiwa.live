import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartInsight from '../components/SmartInsight';
import StudyStatsCards from '../components/analytics/StudyStatsCards';
import ActivityAnalytics from '../components/analytics/ActivityAnalytics';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import WeeklyStudyDigest from '../components/analytics/WeeklyStudyDigest';
import SubjectAnalytics from '../components/analytics/SubjectAnalytics';
import FlashcardAnalytics from '../components/analytics/FlashcardAnalytics';
import ExamHistoryAnalytics from '../components/analytics/ExamHistoryAnalytics';
import CoachAnalytics from '../components/analytics/CoachAnalytics';
import JlptProgressAnalytics from '../components/analytics/JlptProgressAnalytics';
import { JlptSkillMatrixView } from '../components/analytics/JlptSkillMatrixView';
import { useStudyData } from '../context/StudyPlannerContext';
import Skeleton from '../components/ui/Skeleton';
import ShareCardModal from '../components/ShareCardModal';
import { Share2, BarChart3, Globe2, BookOpen, Trophy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useGamificationInfo } from '../stores';
import { DailyQuestsWidget } from '../components/gamification/DailyQuestsWidget';
import { AchievementsGrid } from '../components/gamification/AchievementsGrid';

const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, subjects, tasks, settings, flashcards, coachSessions, loading } =
    useStudyData();
  const { totalXp, level } = useGamificationInfo();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'language' | 'subjects' | 'achievements'>(
    'overview',
  );
  const [isShareOpen, setIsShareOpen] = useState(false);

  const totalHours = (sessions.reduce((acc, s) => acc + s.duration, 0) / 60).toFixed(1);
  const completedTasks = tasks.filter((t) => t.completed || t.status === 'done').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-28 duration-200 animate-in fade-in sm:pb-24 md:p-8 md:pb-12">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {language === 'ja'
              ? '学習進捗 & アナリティクス'
              : language === 'en'
                ? 'Study Progress & Analytics'
                : "O'quv Statistikasi & Progress"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'ja'
              ? '日々の学習成果、科目別アクティビティ、弱点克服の記録'
              : language === 'en'
                ? 'Daily study performance, activity heatmap, and learning insights'
                : "Kunlik o'rganish natijalari, faollik xaritasi va o'sish ko'rsatkichlari"}
          </p>
        </div>
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <Share2 size={16} />
          <span>{language === 'ja' ? 'シェアする' : language === 'en' ? 'Share' : 'Ulashish'}</span>
        </button>
      </div>

      {/* Smart Insight AI recommendation */}
      <SmartInsight />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton width={40} height={40} className="mb-2 rounded-lg" />
              <Skeleton width={80} height={28} className="mb-1" />
              <Skeleton width={100} height={14} />
            </div>
          ))}
        </div>
      ) : (
        <StudyStatsCards
          totalHours={totalHours}
          completedTasks={completedTasks}
          currentStreak={settings.currentStreak}
          totalXp={totalXp}
          level={level}
        />
      )}

      {/* Tab Navigation */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 size={15} />
          <span>{language === 'ja' ? '総合' : language === 'en' ? 'Overview' : 'Umumiy'}</span>
        </button>
        <button
          onClick={() => setActiveTab('language')}
          className={`flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${
            activeTab === 'language'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Globe2 size={15} />
          <span>
            {language === 'ja' ? '言語・JLPT' : language === 'en' ? 'Language & JLPT' : 'Til, JLPT'}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${
            activeTab === 'subjects'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          }`}
        >
          <BookOpen size={15} />
          <span>{language === 'ja' ? '科目' : language === 'en' ? 'Subjects' : 'Fanlar'}</span>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${
            activeTab === 'achievements'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Trophy size={15} />
          <span>
            {language === 'ja' ? '実績' : language === 'en' ? 'Achievements' : 'Yutuqlar'}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview & Time Activity */}
      {activeTab === 'overview' && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          <WeeklyStudyDigest
            onNavigateToDecks={() => navigate('/decks')}
            onNavigateToSpeaking={() => navigate('/speaking')}
          />
          <ActivityAnalytics sessions={sessions} />
          <ActivityHeatmap
            sessions={sessions}
            onStartFlashcards={() => navigate('/decks')}
            onStartSpeaking={() => navigate('/speaking')}
          />
        </div>
      )}

      {/* Tab 2: Language, JLPT & Coach */}
      {activeTab === 'language' && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          <JlptSkillMatrixView />
          <JlptProgressAnalytics />
          <CoachAnalytics sessions={coachSessions} />
          <ExamHistoryAnalytics />
        </div>
      )}

      {/* Tab 3: Subjects & Flashcards */}
      {activeTab === 'subjects' && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          <SubjectAnalytics subjects={subjects} sessions={sessions} flashcards={flashcards} />
          <FlashcardAnalytics flashcards={flashcards} />
        </div>
      )}

      {/* Tab 4: Achievements & Daily Quests */}
      {activeTab === 'achievements' && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          <DailyQuestsWidget />
          <AchievementsGrid />
        </div>
      )}

      <ShareCardModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
};

export default ProgressPage;
