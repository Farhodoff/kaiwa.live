import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConversationScenario, ScenarioSessionResult } from './scenarioTypes';

interface ScenarioAttemptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ConversationScenario | null;
  attempts: ScenarioSessionResult[];
  onStartScenario: (scenario: ConversationScenario) => void;
}

export const ScenarioAttemptsModal: React.FC<ScenarioAttemptsModalProps> = ({
  isOpen,
  onClose,
  scenario,
  attempts,
  onStartScenario,
}) => {
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  if (!isOpen || !scenario) return null;

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const bestScore =
    sortedAttempts.length > 0 ? Math.max(...sortedAttempts.map((a) => a.overall_score || 0)) : 0;

  const avgScore =
    sortedAttempts.length > 0
      ? Math.round(
          sortedAttempts.reduce((acc, a) => acc + (a.overall_score || 0), 0) /
            sortedAttempts.length,
        )
      : 0;

  const toggleExpand = (id: string) => {
    setExpandedAttemptId((prev) => (prev === id ? null : id));
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 soniya';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m} daq ${s} son`;
    return `${s} soniya`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md duration-200 animate-in fade-in sm:p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-2xl">
              {scenario.emoji || '🗣️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                  {scenario.title_ja || scenario.title_uz}
                </h3>
                <span className="rounded-full border border-[#C9A961]/30 bg-[#C9A961]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#C9A961]">
                  JLPT {scenario.difficulty}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{scenario.title_uz}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-xl p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 border-b border-border/60 bg-muted/20 p-3 sm:px-6">
          <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Jami Urinishlar
            </span>
            <div className="text-lg font-black text-foreground">{sortedAttempts.length} ta</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Eng Yuqori Ball
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {bestScore}%
            </div>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              O'rtacha Ball
            </span>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {avgScore}%
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Urinishlar Tarixi & Foydalanuvchi Javoblari
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Batafsil ko'rish uchun urinish ustiga bosing
            </span>
          </div>

          {sortedAttempts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Sparkles size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-semibold">Bu ssenariy bo'yicha hali suhbat qilinmagan.</p>
              <p className="mt-1 text-xs">Birinchi suhbatni boshlang va natijangizni saqlang!</p>
            </div>
          ) : (
            sortedAttempts.map((attempt, idx) => {
              const isExpanded =
                expandedAttemptId === attempt.id || (sortedAttempts.length === 1 && idx === 0);
              const attemptNumber = sortedAttempts.length - idx;
              const transcript = attempt.transcript || [];
              const userTurns = transcript.filter((t) => t.role === 'user');

              return (
                <div
                  key={attempt.id || idx}
                  className="rounded-2xl border border-border/70 bg-card p-3.5 transition-all duration-200 hover:border-border sm:p-4"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(attempt.id)}
                    className="flex cursor-pointer items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                        #{attemptNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {attempt.overall_score}% ball
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ({formatDuration(attempt.duration_seconds)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Calendar size={11} />
                          <span>{formatDate(attempt.created_at)}</span>
                          <span>•</span>
                          <span>{userTurns.length} ta javob berilgan</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          attempt.overall_score >= 80
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : attempt.overall_score >= 60
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {attempt.overall_score >= 80
                          ? 'Ajoyib'
                          : attempt.overall_score >= 60
                            ? 'Yaxshi'
                            : 'Qoniqarsiz'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded Detailed View */}
                  {isExpanded && (
                    <div className="mt-3.5 space-y-3.5 border-t border-border/60 pt-3 duration-200 animate-in fade-in">
                      {/* Sub-scores */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <span className="text-[9px] uppercase text-muted-foreground">
                            Talaffuz
                          </span>
                          <div className="text-xs font-bold text-foreground">
                            {attempt.pronunciation_score}%
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <span className="text-[9px] uppercase text-muted-foreground">
                            Ravonlik
                          </span>
                          <div className="text-xs font-bold text-foreground">
                            {attempt.fluency_score}%
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <span className="text-[9px] uppercase text-muted-foreground">
                            Grammatika
                          </span>
                          <div className="text-xs font-bold text-foreground">
                            {attempt.grammar_score}%
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <span className="text-[9px] uppercase text-muted-foreground">Lug'at</span>
                          <div className="text-xs font-bold text-foreground">
                            {attempt.vocabulary_score}%
                          </div>
                        </div>
                      </div>

                      {/* AI Feedback */}
                      {attempt.ai_feedback && (
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs leading-relaxed text-foreground">
                          <div className="mb-1 flex items-center gap-1.5 font-bold text-indigo-500">
                            <Sparkles size={13} />
                            <span>AI Tahlili & Xulosasi:</span>
                          </div>
                          {attempt.ai_feedback}
                        </div>
                      )}

                      {/* Key Phrases Used / Missed */}
                      {(attempt.key_phrases_used?.length > 0 ||
                        attempt.key_phrases_missed?.length > 0) && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Kalit Iboralar Tahlili:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {attempt.key_phrases_used?.map((kp, kIdx) => (
                              <span
                                key={kIdx}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                              >
                                <CheckCircle2 size={10} />
                                {kp}
                              </span>
                            ))}
                            {attempt.key_phrases_missed?.map((kp, kIdx) => (
                              <span
                                key={kIdx}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-500"
                              >
                                <AlertCircle size={10} />
                                {kp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student's Actual Answers / Transcript */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <MessageSquare size={12} />
                          <span>Foydalanuvchi Aytgan Gaplar (Suhbat Transkripti):</span>
                        </div>

                        {transcript.length === 0 ? (
                          <p className="rounded-lg bg-muted/30 p-2 text-xs text-muted-foreground">
                            Ushbu urinish uchun transkript saqlanmagan.
                          </p>
                        ) : (
                          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2.5">
                            {transcript.map((msg, mIdx) => {
                              const isUser = msg.role === 'user';
                              return (
                                <div
                                  key={mIdx}
                                  className={`rounded-lg p-2 text-xs ${
                                    isUser
                                      ? 'ml-3 border border-primary/20 bg-primary/10 text-foreground'
                                      : 'mr-3 border border-border/40 bg-card text-muted-foreground'
                                  }`}
                                >
                                  <div className="mb-0.5 text-[9px] font-bold uppercase opacity-75">
                                    {isUser ? '👤 Sizning javobingiz:' : '🤖 Coach (Yuki Sensei):'}
                                  </div>
                                  <p className="font-medium text-foreground">{msg.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/30 p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Yopish
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartScenario(scenario);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Qayta Mashq Qilish</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAttemptsModal;
