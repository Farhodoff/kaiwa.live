import React, { useState } from 'react';
import {
  X,
  Clock,
  BookOpen,
  Calendar,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import {
  SpeakingConversationHistoryService,
  SpeakingConversationSession,
} from '../../services/SpeakingConversationHistoryService';

interface SpeakingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakText?: (text: string) => void;
}

export const SpeakingHistoryModal: React.FC<SpeakingHistoryModalProps> = ({
  isOpen,
  onClose,
  onSpeakText,
}) => {
  const [sessions, setSessions] = useState<SpeakingConversationSession[]>(() =>
    SpeakingConversationHistoryService.getSessions(),
  );
  const [selectedSession, setSelectedSession] = useState<SpeakingConversationSession | null>(null);

  // Refresh sessions whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSessions(SpeakingConversationHistoryService.getSessions());
      setSelectedSession(null);
      // Seamlessly fetch server records for multi-device synchronization
      SpeakingConversationHistoryService.fetchSessionsFromServer()
        .then((merged) => {
          setSessions(merged);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    SpeakingConversationHistoryService.deleteSession(id);
    const updated = SpeakingConversationHistoryService.getSessions();
    setSessions(updated);
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaking-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md animate-in fade-in sm:p-4"
    >
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0b1f] text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {selectedSession ? (
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-white/10"
                aria-label="Orqaga"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Clock size={18} />
              </div>
            )}
            <div>
              <h2 id="speaking-history-title" className="text-sm font-bold text-white sm:text-base">
                {selectedSession ? selectedSession.scenarioTitle : 'Suhbatlar Tarixi'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {selectedSession
                  ? `${selectedSession.dateFormatted} • Davomiyligi: ${selectedSession.durationFormatted}`
                  : `${sessions.length} ta saqlangan suhbat`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-white/10"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {selectedSession ? (
            /* Detailed View of a Selected Session */
            <div className="space-y-5">
              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="text-[11px] text-slate-400">Xabarlar</div>
                  <div className="text-base font-bold text-white">
                    {selectedSession.messages.length}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="text-[11px] text-slate-400">Tuzatilgan xatolar</div>
                  <div className="text-base font-bold text-emerald-400">
                    {selectedSession.errors.length}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="text-[11px] text-slate-400">Yangi so&apos;zlar</div>
                  <div className="text-base font-bold text-rose-300">
                    {selectedSession.newWords.length}
                  </div>
                </div>
              </div>

              {/* Transcription List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  To&apos;liq Transkripsiya
                </h3>
                <div className="max-h-[380px] space-y-2.5 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 p-3 sm:p-4">
                  {selectedSession.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-xs border border-primary/40 bg-primary/25 text-white'
                            : 'rounded-tl-xs border border-white/10 bg-slate-900/90 text-slate-100'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] opacity-75">
                          <span>{msg.role === 'user' ? 'Siz' : 'Sensei'}</span>
                          {msg.role === 'assistant' && onSpeakText && (
                            <button
                              type="button"
                              onClick={() => onSpeakText(msg.content)}
                              className="transition hover:text-primary"
                              title="Qayta tinglash"
                            >
                              <Volume2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Green correction under user message */}
                        {msg.role === 'user' && msg.corrected && (
                          <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2 text-[11px]">
                            <div className="flex items-start gap-1 font-semibold text-emerald-400">
                              <span>✓</span>
                              <span>{msg.corrected}</span>
                            </div>
                            {msg.explanation_uz && (
                              <div className="pl-3 text-[10px] italic text-slate-300">
                                {msg.explanation_uz}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Words Section */}
              {selectedSession.newWords.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300">
                    <BookOpen size={14} />
                    <span>Uchragan Yangi So&apos;zlar</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedSession.newWords.map((w, wIdx) => (
                      <div
                        key={wIdx}
                        className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs"
                      >
                        <div>
                          <div className="flex items-baseline gap-1.5 font-bold text-white">
                            <span>{w.word}</span>
                            {w.reading && (
                              <span className="text-[10px] font-normal text-rose-300">
                                ({w.reading})
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-300">
                            {w.translation_uz}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : sessions.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Clock size={38} className="mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-white">
                Hozircha saqlangan suhbatlar yo&apos;q
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Sharchani bosib birinchi ovozli suhbatingizni boshlang. Suhbat tugagach, to&apos;liq
                tarix bu yerda saqlanadi.
              </p>
            </div>
          ) : (
            /* List of Sessions */
            <div className="space-y-2.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-white">
                        {session.scenarioTitle}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                        <Clock size={10} />
                        {session.durationFormatted}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {session.dateFormatted}
                      </span>
                      {session.errors.length > 0 && (
                        <span className="font-medium text-emerald-400">
                          ✓ {session.errors.length} ta tuzatish
                        </span>
                      )}
                      {session.newWords.length > 0 && (
                        <span className="font-medium text-rose-300">
                          📖 {session.newWords.length} ta yangi so&apos;z
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, session.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                      title="O'chirish"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight
                      size={18}
                      className="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingHistoryModal;
