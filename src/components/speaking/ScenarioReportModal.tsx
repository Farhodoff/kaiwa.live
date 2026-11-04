import React, { useState } from 'react';
import { ScenarioSessionResult } from './scenarioTypes';
import { VoicePlaybackBar } from './VoicePlaybackBar';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { toast } from '../../hooks/use-toast';

interface ScenarioReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScenarioSessionResult | null;
  isLoading: boolean;
  recordedUrl?: string | null;
  durationSeconds?: number;
  isPlayingRecorded?: boolean;
  audioProgressRecorded?: number;
  onPlayRecorded?: () => void;
  onPauseRecorded?: () => void;
  onRetry?: () => void;
}

export const ScenarioReportModal: React.FC<ScenarioReportModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  recordedUrl,
  durationSeconds = 0,
  isPlayingRecorded = false,
  audioProgressRecorded = 0,
  onPlayRecorded,
  onPauseRecorded,
  onRetry,
}) => {
  const { addFlashcardsBatch } = useStudyData();
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportToFlashcards = async () => {
    if (!result) return;
    const phrases = [...(result.key_phrases_missed || []), ...(result.key_phrases_used || [])];
    if (phrases.length === 0) {
      toast({
        title: "ℹ️ Iboralar yo'q",
        description: 'Fleshkartaga saqlash uchun kalit iboralar topilmadi.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const cards = phrases.map((p) => ({
        front: `🇯🇵 Scenario Iborasi (${result.scenario_title}):\n"${p}"`,
        back: `✨ Kontekst: ${result.scenario_title}\n\n💡 Tavsiya: ${result.ai_feedback.substring(0, 150)}...`,
        subjectId: '00000000-0000-4000-8000-000000000001', // JLPT Master
      }));

      // Deduplicate
      const uniqueCards = cards.filter(
        (c, i, self) => i === self.findIndex((x) => x.front === c.front),
      );
      await addFlashcardsBatch(uniqueCards);

      toast({
        title: '🎴 Fleshkartalar Yaratildi!',
        description: `${uniqueCards.length} ta yaponcha iboralar Anki SM-2 Fleshkartalariga saqlandi.`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Fleshkartalarga eksport qilishda xatolik yuz berdi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getGrade = (score: number) => {
    if (score >= 90)
      return { label: 'S (A`lo)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    if (score >= 80)
      return {
        label: 'A (Juda yaxshi)',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      };
    if (score >= 70)
      return {
        label: 'B (Yaxshi)',
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      };
    return { label: 'C (Qoniqarli)', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
  };

  const grade = result ? getGrade(result.overall_score) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={18} />
        </button>
        {isLoading || !result ? (
          <div className="space-y-4 py-16 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h3 className="text-base font-extrabold text-foreground">
              AI Scenario va Pronunciation Tahlil qilinmoqda...
            </h3>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
              Talaffuzingiz, yaponcha key iboralar ishlatilishi va grammatikangiz AI tomonidan
              baholanmoqda.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <span className="rounded-full border border-[#C9A961]/20 bg-[#C9A961]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C9A961]">
                  Suhbat Natijasi
                </span>
                <h2 className="mt-1 text-xl font-extrabold text-foreground">
                  {result.scenario_title}
                </h2>
              </div>
              {grade && (
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-extrabold ${grade.color}`}
                >
                  <Award size={18} />
                  <span>{grade.label}</span>
                </div>
              )}
            </div>

            {/* Audio Playback of Student Voice */}
            {recordedUrl && onPlayRecorded && onPauseRecorded && (
              <VoicePlaybackBar
                recordedUrl={recordedUrl}
                durationSeconds={durationSeconds}
                isPlaying={isPlayingRecorded}
                audioProgress={audioProgressRecorded}
                onPlay={onPlayRecorded}
                onPause={onPauseRecorded}
              />
            )}

            {/* Score Dashboard Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">🎤 Talaffuz</span>
                <div className="mt-1 text-2xl font-black text-primary">
                  {result.pronunciation_score}
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${result.pronunciation_score}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">⚡ Silliqlik</span>
                <div className="mt-1 text-2xl font-black text-emerald-400">
                  {result.fluency_score}
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${result.fluency_score}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">📖 Grammatika</span>
                <div className="mt-1 text-2xl font-black text-[#C9A961]">
                  {result.grammar_score}
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#C9A961]"
                    style={{ width: `${result.grammar_score}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">💬 Lug'at</span>
                <div className="mt-1 text-2xl font-black text-amber-400">
                  {result.vocabulary_score}
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${result.vocabulary_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Key Phrases Checklist */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles size={14} className="text-[#C9A961]" />
                <span>Scenario Kalit Iboralari Tekshiruvi</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.key_phrases_used.map((phrase, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400"
                  >
                    <CheckCircle2 size={13} />
                    <span>{phrase}</span>
                  </span>
                ))}
                {result.key_phrases_missed.map((phrase, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400"
                  >
                    <XCircle size={13} />
                    <span>{phrase}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* AI Coach Feedback */}
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-[#C9A961]">
                <Sparkles size={14} />
                <span>AI Coach Xulosasi va Tavsiyalari</span>
              </h4>
              <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">
                {result.ai_feedback}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleExportToFlashcards}
                disabled={isExporting}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
              >
                <Layers size={14} />
                <span>{isExporting ? 'Saqlanmoqda...' : 'Iboralardan Fleshkarta Yaratish 🎴'}</span>
              </button>

              <div className="flex items-center gap-2">
                {onRetry && (
                  <button
                    onClick={() => {
                      onClose();
                      onRetry();
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
                  >
                    <RotateCcw size={14} />
                    <span>Qayta Mashq Qilish</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                  <span>Yopish va Saqlash</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
