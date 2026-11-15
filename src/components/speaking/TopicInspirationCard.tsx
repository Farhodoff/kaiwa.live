import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Volume2, Sparkles } from 'lucide-react';
import { ConversationScenario } from './scenarioTypes';
import { getScenarioExampleSentences } from '../../data/scenarioExampleSentences';
import { cleanJapaneseTTS } from '../../utils/ai/aiCoach';

interface TopicInspirationCardProps {
  activeScenario: ConversationScenario | null;
  language?: 'en' | 'ja';
}

export const TopicInspirationCard: React.FC<TopicInspirationCardProps> = ({
  activeScenario,
  language = 'ja',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const examples = getScenarioExampleSentences(
    activeScenario?.id,
    activeScenario?.category,
    activeScenario?.key_phrases,
  );

  const playAudio = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const isJa = language === 'ja' || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
      const clean = isJa ? cleanJapaneseTTS(text) : text.trim();
      if (!clean) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = isJa ? 'ja-JP' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('TTS play error:', e);
    }
  };

  return (
    <div className="mx-3 mt-1.5 transition-all duration-200 md:mx-5">
      {!isExpanded ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-700 transition-all hover:border-amber-500/50 hover:bg-amber-500/20 active:scale-95 dark:text-amber-300"
            title="Mavzuga oid namunaviy gaplarni ochish"
            aria-expanded="false"
          >
            <Lightbulb size={13} className="text-amber-500 group-hover:animate-bounce" />
            <span>Namunaviy gaplar (Ilhomlanish)</span>
            <ChevronDown size={13} className="text-amber-500/70" />
          </button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-card/95 p-3.5 shadow-md backdrop-blur-md duration-200 animate-in fade-in sm:p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                <Lightbulb size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground sm:text-sm">
                  💡 Namunaviy gaplar va Ilhomlanish
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {activeScenario
                    ? `"${activeScenario.title_uz || activeScenario.title_ja}" mavzusi bo'yicha tavsiya etilgan jumlalar:`
                    : 'Erkin suhbat uchun tavsiya etilgan fikr bildirish namunalari:'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-expanded="true"
            >
              <ChevronUp size={13} />
              <span>Yopish</span>
            </button>
          </div>

          {/* List of Sentences */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {examples.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5 transition hover:border-amber-500/30 hover:bg-muted/60"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-xs font-bold leading-snug text-foreground">{item.ja}</p>
                    <button
                      type="button"
                      onClick={() => playAudio(item.ja)}
                      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Ovozli eshitish"
                      aria-label="Namuna gapni eshitish"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground">{item.romaji}</p>
                  <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    🇺🇿 {item.uz}
                  </p>
                </div>

                {item.starterPromptUz && (
                  <div className="mt-2 flex items-center gap-1 border-t border-border/40 pt-1.5 text-[9px] text-muted-foreground">
                    <Sparkles size={10} className="shrink-0 text-amber-500" />
                    <span className="truncate">{item.starterPromptUz}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            💡 <span className="font-medium">Maslahat:</span> Ushbu gaplarni to‘g‘ridan-to‘g‘ri
            takrorlash o‘rniga, ularni o‘z vaziyatingiz va fikringizga moslashtirib gapiring.
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicInspirationCard;
