import React from 'react';
import { Briefcase, Home, Mic, Plane, Utensils } from 'lucide-react';
import { KaiwaOrbCharacter } from '../character/KaiwaOrbCharacter';

interface CoachWelcomeScreenProps {
  promptSuggestions?: { title: string; text: string; icon: string }[];
  onStartSession: (topic?: string) => void;
}

const TOPICS = [
  { label: 'Kundalik hayot', icon: Home },
  { label: 'Sayohat', icon: Plane },
  { label: 'Restoran', icon: Utensils },
  { label: 'Ish', icon: Briefcase },
];

export const CoachWelcomeScreen: React.FC<CoachWelcomeScreenProps> = ({
  promptSuggestions = [],
  onStartSession,
}) => {
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-y-auto px-4 pb-5 pt-3 text-center sm:px-8 sm:pb-8">
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <p className="mb-2 text-sm font-medium tracking-wide text-white/80">Erkin suhbat</p>
        <button
          type="button"
          onClick={() => onStartSession(selectedTopic || undefined)}
          aria-label="Gapirishni boshlash"
          className="group relative flex flex-col items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95"
        >
          <KaiwaOrbCharacter size={140} state="idle" interactive={false} />
          <span className="-mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-slate-950/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur transition-all group-hover:border-primary group-hover:bg-primary/25">
            <Mic size={14} className="text-primary transition-transform group-hover:scale-110" />
            <span>Gapirish</span>
          </span>
        </button>
      </div>

      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-left shadow-xl backdrop-blur-md sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-white sm:text-base">Ssenariylar</h2>
          <span className="text-xs text-slate-300/75">
            Xohlaganingizni tanlang yoki erkin gapiring
          </span>
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {TOPICS.slice(0, Math.min(4, promptSuggestions.length)).map((topic, index) => {
            const topicTitle = promptSuggestions[index]?.title;
            const TopicIcon = topic.icon;
            const isSelected = selectedTopic === topicTitle;
            return (
              <button
                key={topicTitle || topic.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedTopic(isSelected ? null : topicTitle || topic.label)}
                className={`flex min-h-12 min-w-[148px] shrink-0 items-center gap-2.5 rounded-xl border px-3 text-left text-xs font-medium transition sm:min-w-0 sm:text-sm ${
                  isSelected
                    ? 'border-primary/70 bg-primary/15 text-white'
                    : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <TopicIcon size={17} className="shrink-0 text-primary" aria-hidden="true" />
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
