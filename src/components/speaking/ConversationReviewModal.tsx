import React, { useState, useMemo } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  MessageSquare,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Calendar,
  Clock,
  User,
  Bot,
  Mic,
} from 'lucide-react';
import { SpeakingSessionItem } from '../../services/HistoryService';
import { speakJapaneseText, speakText, stopAllAudio } from '../../utils/audioTts';
import { ShadowingTrainerModal, ShadowingTarget } from './ShadowingTrainerModal';

export interface ConversationReviewModalProps {
  isOpen: boolean;
  session: SpeakingSessionItem | null;
  onClose: () => void;
}

interface ParsedTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  romaji?: string;
  furigana?: string;
  translation?: string;
  corrections?: Array<{ original?: string; corrected?: string; explanation?: string }>;
}

interface ParsedFeedback {
  overallFeedback?: string;
  grammarCorrections: Array<{ original: string; corrected: string; explanation?: string }>;
  betterVocabulary: Array<{ original: string; suggested: string; context?: string }>;
  strengths: string[];
  areasToImprove: string[];
  scores: {
    overall: number;
    fluency: number;
    pronunciation: number;
    grammar?: number;
    lexical?: number;
  };
}

export const ConversationReviewModal: React.FC<ConversationReviewModalProps> = ({
  isOpen,
  session,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dialog' | 'feedback'>('dialog');
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [shadowingTurn, setShadowingTurn] = useState<ParsedTurn | null>(null);
  const [activeShadowModalTarget, setActiveShadowModalTarget] = useState<ShadowingTarget | null>(
    null,
  );

  // Parse turns from session transcript (supports JSON array or plain text)
  const parsedTurns: ParsedTurn[] = useMemo(() => {
    if (!session || !session.transcript) return [];

    try {
      const parsed = JSON.parse(session.transcript);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: item.id || `turn-${idx}`,
          role: item.role === 'user' ? 'user' : 'assistant',
          text: item.content || item.text || '',
          romaji: item.romaji,
          furigana: item.furigana,
          translation: item.translation,
          corrections: item.corrections || (item.correction ? [item.correction] : undefined),
        }));
      }
    } catch {
      // Plain text fallback (e.g. line-separated "User: ... \n Coach: ...")
    }

    const lines = session.transcript.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line, idx) => {
      const lower = line.toLowerCase();
      const isUser = lower.startsWith('user:') || lower.startsWith('talaba:');
      const text = line.replace(/^(user|coach|ai|talaba|yuki-sensei):\s*/i, '').trim();
      return {
        id: `line-${idx}`,
        role: isUser ? 'user' : 'assistant',
        text: text || line,
      };
    });
  }, [session]);

  // Parse feedback report (supports SessionAnalysisReport JSON or plain text)
  const parsedFeedback: ParsedFeedback = useMemo(() => {
    const defaultFeedback: ParsedFeedback = {
      grammarCorrections: [],
      betterVocabulary: [],
      strengths: [],
      areasToImprove: [],
      scores: {
        overall: session?.fluencyScore || 7.0,
        fluency: session?.fluencyScore || 7.0,
        pronunciation: session?.pronunciationScore || 7.0,
      },
    };

    if (!session || !session.feedback) return defaultFeedback;

    try {
      const parsed = JSON.parse(session.feedback);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          overallFeedback: parsed.overall_feedback || parsed.overallFeedback,
          grammarCorrections: parsed.grammar_corrections || parsed.grammarCorrections || [],
          betterVocabulary: parsed.better_vocabulary || parsed.betterVocabulary || [],
          strengths: parsed.strengths || [],
          areasToImprove: parsed.areas_to_improve || parsed.areasToImprove || [],
          scores: {
            overall: parsed.overall_score ?? session.fluencyScore,
            fluency: parsed.fluency_score ?? session.fluencyScore,
            pronunciation: parsed.pronunciation_score ?? (session.pronunciationScore || 7.0),
            grammar: parsed.grammar_score,
            lexical: parsed.lexical_score,
          },
        };
      }
    } catch {
      // Plain text feedback
    }

    return {
      ...defaultFeedback,
      overallFeedback: session.feedback,
    };
  }, [session]);

  if (!isOpen || !session) return null;

  const isJa = session.language === 'ja';

  const handlePlayAudio = (turn: ParsedTurn) => {
    if (playingTurnId === turn.id) {
      stopAllAudio();
      setPlayingTurnId(null);
      return;
    }

    setPlayingTurnId(turn.id);
    if (isJa) {
      speakJapaneseText(turn.text);
    } else {
      speakText(turn.text, 'en-US');
    }

    // Auto-clear active indicator after estimated speech duration
    const approxDurationMs = Math.max(1500, turn.text.length * 90);
    setTimeout(() => {
      setPlayingTurnId((prev) => (prev === turn.id ? null : prev));
    }, approxDurationMs);
  };

  const handleCopyText = (turn: ParsedTurn) => {
    navigator.clipboard?.writeText(turn.text);
    setCopiedTurnId(turn.id);
    setTimeout(() => {
      setCopiedTurnId(null);
    }, 2000);
  };

  const handleShadowTurn = (turn: ParsedTurn) => {
    setShadowingTurn(turn);
    setActiveShadowModalTarget({
      id: turn.id,
      japanese: turn.text,
      romaji: turn.romaji,
      uzbek: turn.translation,
    });
  };

  const formattedDate = new Date(session.createdAt).toLocaleDateString('uz-UZ', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const durationMins = Math.max(1, Math.round(session.durationSeconds / 60));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-200 animate-in fade-in"
    >
      <div className="flex h-[90vh] max-h-[820px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl duration-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-500 dark:text-indigo-400">
                  <Sparkles size={13} /> {session.persona || 'Yuki-sensei'}
                </span>
                <span className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                  {session.language.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar size={12} /> {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock size={12} /> {durationMins} daq
                </span>
              </div>
              <h2 className="text-lg font-black text-foreground sm:text-xl">
                Suhbat Tahlili & Tarixi
              </h2>
            </div>

            <button
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Score Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs">
              <Award size={15} className="text-indigo-500" />
              <span className="text-muted-foreground">Fluency:</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400">
                {session.fluencyScore.toFixed(1)} / 9.0
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs">
              <Volume2 size={15} className="text-rose-500" />
              <span className="text-muted-foreground">Pronunciation:</span>
              <span className="font-black text-rose-600 dark:text-rose-400">
                {(session.pronunciationScore || 7.0).toFixed(1)} / 9.0
              </span>
            </div>

            {parsedFeedback.scores.grammar !== undefined && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span className="text-muted-foreground">Grammar:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {parsedFeedback.scores.grammar.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-2xl bg-muted/60 p-1">
            <button
              onClick={() => setActiveTab('dialog')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                activeTab === 'dialog'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare size={14} />
              <span>Dialog & Ovoz ({parsedTurns.length} replika)</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                activeTab === 'feedback'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles size={14} />
              <span>AI Tahlili & Xatolar</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'dialog' && (
            <div className="space-y-3">
              {/* Shadowing spotlight bar if selected */}
              {shadowingTurn && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm animate-in fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                        🎙️ Shadowing & Talaffuz Mashqi
                      </span>
                      <p className="text-base font-bold text-foreground sm:text-lg">
                        {shadowingTurn.text}
                      </p>
                      {shadowingTurn.romaji && (
                        <p className="text-xs text-muted-foreground">{shadowingTurn.romaji}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePlayAudio(shadowingTurn)}
                        className="rounded-xl bg-indigo-500 p-2 text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95"
                        title="Tinglash"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setActiveShadowModalTarget({
                            id: shadowingTurn.id,
                            japanese: shadowingTurn.text,
                            romaji: shadowingTurn.romaji,
                            uzbek: shadowingTurn.translation,
                          })
                        }
                        className="rounded-xl bg-primary p-2 text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
                        title="Talaffuzni qaytarib mashq qilish (Shadowing)"
                        aria-label="Mikrofonda gapirish"
                      >
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={() => setShadowingTurn(null)}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                        title="Yopish"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {parsedTurns.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">
                    Ushbu sessiya uchun replikalar saqlanmagan.
                  </p>
                </div>
              ) : (
                parsedTurns.map((turn) => {
                  const isUser = turn.role === 'user';
                  const isPlaying = playingTurnId === turn.id;

                  return (
                    <div
                      key={turn.id}
                      className={`flex gap-3 text-xs sm:text-sm ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        }`}
                      >
                        {isUser ? <User size={15} /> : <Bot size={15} />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[82%] space-y-1.5 rounded-2xl p-3.5 shadow-sm transition-all sm:max-w-[75%] ${
                          isUser
                            ? 'rounded-tr-none bg-indigo-600 text-white'
                            : 'rounded-tl-none border border-border bg-muted/40 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isUser ? 'text-indigo-200' : 'text-muted-foreground'
                            }`}
                          >
                            {isUser ? "Siz (O'quvchi)" : session.persona || 'Yuki-sensei'}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Audio Play Button */}
                            <button
                              onClick={() => handlePlayAudio(turn)}
                              className={`rounded-lg p-1 transition-all active:scale-90 ${
                                isUser
                                  ? 'text-white hover:bg-white/20'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              } ${isPlaying ? 'animate-pulse text-amber-300' : ''}`}
                              title="Ovoz chiqarib o'qish"
                              aria-label="Ovoz chiqarib o'qish"
                            >
                              {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>

                            {/* Practice / Shadow Button */}
                            <button
                              onClick={() => handleShadowTurn(turn)}
                              className={`rounded-lg p-1 transition-all active:scale-90 ${
                                isUser
                                  ? 'text-white hover:bg-white/20'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                              title="Qaytarib mashq qilish (Shadowing)"
                              aria-label="Qaytarib mashq qilish"
                            >
                              <RotateCcw size={13} />
                            </button>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyText(turn)}
                              className={`rounded-lg p-1 transition-all active:scale-90 ${
                                isUser
                                  ? 'text-white hover:bg-white/20'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                              title="Nusxa olish"
                              aria-label="Nusxa olish"
                            >
                              {copiedTurnId === turn.id ? (
                                <Check size={13} className="text-emerald-300" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Main Text */}
                        <p className="whitespace-pre-wrap break-words font-medium leading-relaxed">
                          {turn.text}
                        </p>

                        {/* Romaji or Furigana preview if exists */}
                        {turn.romaji && (
                          <p
                            className={`text-[11px] italic ${
                              isUser ? 'text-indigo-200/90' : 'text-muted-foreground'
                            }`}
                          >
                            {turn.romaji}
                          </p>
                        )}

                        {/* Translation if exists */}
                        {turn.translation && (
                          <p
                            className={`border-t pt-1 text-[11px] ${
                              isUser
                                ? 'border-white/10 text-indigo-100'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {turn.translation}
                          </p>
                        )}

                        {/* In-turn corrections if any */}
                        {turn.corrections && turn.corrections.length > 0 && (
                          <div className="mt-2 space-y-1 rounded-xl bg-black/20 p-2 text-xs">
                            <span className="font-bold text-amber-300">💡 Tavsiya:</span>
                            {turn.corrections.map((corr, cIdx) => (
                              <div key={cIdx} className="text-[11px] text-white/90">
                                {corr.corrected && (
                                  <span className="font-semibold text-emerald-300">
                                    {corr.corrected}
                                  </span>
                                )}
                                {corr.explanation && (
                                  <span className="ml-1 text-white/70">({corr.explanation})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-5">
              {/* Overall AI Feedback Note */}
              {parsedFeedback.overallFeedback && (
                <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                    <Sparkles size={15} className="text-indigo-500" /> Yuki-sensei Umumiy Xulosasi
                  </h4>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {parsedFeedback.overallFeedback}
                  </p>
                </div>
              )}

              {/* Grammar Corrections */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                  <AlertTriangle size={15} className="text-amber-500" /> Grammatik Tuzatishlar (
                  {parsedFeedback.grammarCorrections.length})
                </h4>

                {parsedFeedback.grammarCorrections.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span>
                      Ushbu sessiyada jiddiy grammatik xatolar qayd etilmadi! Barakalla! 🎉
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {parsedFeedback.grammarCorrections.map((item, idx) => (
                      <div
                        key={idx}
                        className="space-y-2 rounded-2xl border border-border bg-card p-3.5 text-xs shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                            Xato
                          </span>
                          <span className="text-muted-foreground line-through">
                            {item.original}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">
                            To'g'ri
                          </span>
                          <span className="font-bold text-foreground">{item.corrected}</span>
                          <button
                            onClick={() => speakJapaneseText(item.corrected)}
                            className="text-muted-foreground hover:text-indigo-500"
                            title="Tinglash"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                        {item.explanation && (
                          <p className="rounded-xl bg-muted/40 p-2 text-[11px] text-muted-foreground">
                            💡 {item.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Better Vocabulary / Natural Phrasing */}
              {parsedFeedback.betterVocabulary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                    <BookOpen size={15} className="text-indigo-500" /> Tabiiyroq So'z va Iboralar (
                    {parsedFeedback.betterVocabulary.length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parsedFeedback.betterVocabulary.map((vocab, idx) => (
                      <div
                        key={idx}
                        className="space-y-1 rounded-2xl border border-border bg-card p-3 text-xs shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{vocab.suggested}</span>
                          <button
                            onClick={() => speakJapaneseText(vocab.suggested)}
                            className="text-muted-foreground hover:text-indigo-500"
                            title="Tinglash"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Asl ibora: <span className="line-through">{vocab.original}</span>
                        </div>
                        {vocab.context && (
                          <p className="text-[10px] italic text-muted-foreground">
                            {vocab.context}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedFeedback.strengths.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <h5 className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} /> Kuchli Tomonlaringiz
                    </h5>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {parsedFeedback.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold text-emerald-500">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedFeedback.areasToImprove.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <h5 className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                      <Lightbulb size={14} /> Rivojlantirish Kerak
                    </h5>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {parsedFeedback.areasToImprove.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold text-indigo-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-4">
          <span className="text-xs text-muted-foreground">Yuki-sensei AI Muloqot Tahlili</span>
          <button
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            Tushunarli
          </button>
        </div>
      </div>

      {/* Interactive Shadowing & Pronunciation Evaluation Modal */}
      <ShadowingTrainerModal
        isOpen={!!activeShadowModalTarget}
        onClose={() => setActiveShadowModalTarget(null)}
        target={activeShadowModalTarget}
      />
    </div>
  );
};

export default ConversationReviewModal;
