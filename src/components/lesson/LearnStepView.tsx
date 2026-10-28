import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Volume2,
  BookOpen,
  CheckCircle2,
  Info,
  Lightbulb,
  MessageSquare,
  Play,
  Pause,
  Disc,
} from 'lucide-react';
import { LearnContent, Lesson, LessonKanji, SupportedLanguage } from '../../types/lesson';
import { speakText, speakJapaneseText } from '../../utils/audioTts';
import { FuriganaText } from '../jlpt/FuriganaText';
import { ListeningAudioSyncService } from '../../services/ListeningAudioSyncService';
import { resolveAudioUrl } from '../../utils/audioUrl';
import { LessonKanjiService, LessonKanjiProgress } from '../../services/LessonKanjiService';

const formatAudioTime = (seconds: number) => {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface LearnStepViewProps {
  content: LearnContent;
  language: SupportedLanguage;
  lesson?: Lesson;
  userId?: string;
}

export const LearnStepView: React.FC<LearnStepViewProps> = ({
  content,
  language,
  lesson,
  userId = 'guest',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vocab' | 'grammar' | 'kanji' | 'dialogue'>(
    'all',
  );
  const lessonKanji = useMemo<LessonKanji[]>(
    () => (lesson ? LessonKanjiService.getLessonKanji(lesson) : []),
    [lesson],
  );
  const [kanjiProgress, setKanjiProgress] = useState<LessonKanjiProgress[]>([]);

  useEffect(() => {
    if (!lesson || lessonKanji.length === 0) {
      setKanjiProgress([]);
      return;
    }
    setKanjiProgress(LessonKanjiService.getLessonProgress(userId, lesson.id, lessonKanji));
  }, [lesson, lessonKanji, userId]);

  const getKanjiProgress = (kanji: string) =>
    kanjiProgress.find((progress) => progress.kanji === kanji);

  const handleKanjiReview = (kanji: string, result: 'correct' | 'incorrect') => {
    if (!lesson) return;
    const progress = LessonKanjiService.recordReview(userId, lesson.id, kanji, result);
    setKanjiProgress((current) => [...current.filter((item) => item.kanji !== kanji), progress]);
  };
  const [playingLineIdx, setPlayingLineIdx] = useState<number | null>(null);
  const [isAutoPlayingDialogue, setIsAutoPlayingDialogue] = useState(false);
  const autoPlayTimeoutRef = useRef<any>(null);

  // Studio MP3 CD Audio Player State
  const studioAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingStudioAudio, setIsPlayingStudioAudio] = useState(false);
  const [studioAudioCurrentTime, setStudioAudioCurrentTime] = useState(0);
  const [studioAudioDuration, setStudioAudioDuration] = useState(0);
  const [studioPlaybackRate, setStudioPlaybackRate] = useState<number>(1.0);

  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (studioAudioRef.current) {
        studioAudioRef.current.pause();
        studioAudioRef.current.src = '';
        studioAudioRef.current = null;
      }
    };
  }, []);

  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active dialogue line into view smoothly
  useEffect(() => {
    if (playingLineIdx !== null && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [playingLineIdx]);

  const dialogueLineSegments = useMemo(() => {
    if (!content.dialogue?.lines) return [];
    return ListeningAudioSyncService.calculateLineTimeSegments(
      content.dialogue.lines,
      studioAudioDuration || (studioAudioRef.current?.duration ?? 0),
    );
  }, [content.dialogue?.lines, studioAudioDuration]);

  // Stop audio on content change
  useEffect(() => {
    if (studioAudioRef.current) {
      studioAudioRef.current.pause();
      studioAudioRef.current = null;
    }
    setIsPlayingStudioAudio(false);
    setStudioAudioCurrentTime(0);
    setStudioAudioDuration(0);
  }, [content]);

  const handleSpeak = (text: string) => {
    if (language === 'ja') {
      speakJapaneseText(text);
    } else {
      speakText(text, 'en-US');
    }
  };

  const handleSeekStudioToLine = (idx: number) => {
    if (!content.dialogue?.audioUrl || !content.dialogue.lines) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    setIsAutoPlayingDialogue(false);

    const startTime = ListeningAudioSyncService.getLineStartTime(
      content.dialogue.lines,
      idx,
      studioAudioRef.current?.duration || studioAudioDuration || 0,
    );

    if (!studioAudioRef.current) {
      const audio = new Audio(resolveAudioUrl(content.dialogue.audioUrl));
      audio.playbackRate = studioPlaybackRate;
      studioAudioRef.current = audio;

      audio.ontimeupdate = () => {
        setStudioAudioCurrentTime(audio.currentTime);
        if (content.dialogue?.lines && content.dialogue.lines.length > 0) {
          const activeIdx = ListeningAudioSyncService.getActiveLineIndex(
            content.dialogue.lines,
            audio.currentTime,
            audio.duration || 0,
          );
          setPlayingLineIdx(activeIdx);
        }
      };
      audio.onloadedmetadata = () => {
        if (!isNaN(audio.duration)) {
          setStudioAudioDuration(audio.duration);
        }
        audio.currentTime = startTime;
        setStudioAudioCurrentTime(startTime);
        setPlayingLineIdx(idx);
      };
      audio.onended = () => {
        setIsPlayingStudioAudio(false);
        setStudioAudioCurrentTime(0);
        setPlayingLineIdx(null);
      };
      audio.onerror = () => {
        setIsPlayingStudioAudio(false);
      };
    }

    const audio = studioAudioRef.current;
    audio.playbackRate = studioPlaybackRate;
    audio.currentTime = startTime;
    setStudioAudioCurrentTime(startTime);
    setPlayingLineIdx(idx);

    audio
      .play()
      .then(() => {
        setIsPlayingStudioAudio(true);
      })
      .catch(() => {
        setIsPlayingStudioAudio(false);
      });
  };

  const handlePlaySingleLine = (idx: number, text: string) => {
    if (content.dialogue?.audioUrl && isPlayingStudioAudio && studioAudioRef.current) {
      handleSeekStudioToLine(idx);
      return;
    }

    if (isPlayingStudioAudio && studioAudioRef.current) {
      studioAudioRef.current.pause();
      setIsPlayingStudioAudio(false);
    }
    if (isAutoPlayingDialogue) {
      setIsAutoPlayingDialogue(false);
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    }
    setPlayingLineIdx(idx);
    speakJapaneseText(text);
    setTimeout(
      () => {
        setPlayingLineIdx((curr) => (curr === idx ? null : curr));
      },
      Math.max(2000, text.length * 180),
    );
  };

  const handleToggleStudioAudio = () => {
    if (!content.dialogue?.audioUrl) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    setIsAutoPlayingDialogue(false);
    setPlayingLineIdx(null);

    if (isPlayingStudioAudio && studioAudioRef.current) {
      studioAudioRef.current.pause();
      setIsPlayingStudioAudio(false);
      return;
    }

    if (!studioAudioRef.current) {
      const audio = new Audio(resolveAudioUrl(content.dialogue.audioUrl));
      audio.playbackRate = studioPlaybackRate;
      studioAudioRef.current = audio;

      audio.ontimeupdate = () => {
        setStudioAudioCurrentTime(audio.currentTime);
        if (content.dialogue?.lines && content.dialogue.lines.length > 0) {
          const activeIdx = ListeningAudioSyncService.getActiveLineIndex(
            content.dialogue.lines,
            audio.currentTime,
            audio.duration || 0,
          );
          setPlayingLineIdx(activeIdx);
        }
      };
      audio.onloadedmetadata = () => {
        if (!isNaN(audio.duration)) {
          setStudioAudioDuration(audio.duration);
        }
      };
      audio.onended = () => {
        setIsPlayingStudioAudio(false);
        setStudioAudioCurrentTime(0);
        setPlayingLineIdx(null);
      };
      audio.onerror = () => {
        setIsPlayingStudioAudio(false);
      };
    }

    const audio = studioAudioRef.current;
    audio.playbackRate = studioPlaybackRate;
    audio
      .play()
      .then(() => {
        setIsPlayingStudioAudio(true);
      })
      .catch(() => {
        setIsPlayingStudioAudio(false);
      });
  };

  const handleSeekStudioAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setStudioAudioCurrentTime(newTime);
    if (studioAudioRef.current) {
      studioAudioRef.current.currentTime = newTime;
    }
  };

  const handleTogglePlaybackRate = () => {
    const nextRate = studioPlaybackRate === 1.0 ? 0.8 : studioPlaybackRate === 0.8 ? 1.2 : 1.0;
    setStudioPlaybackRate(nextRate);
    if (studioAudioRef.current) {
      studioAudioRef.current.playbackRate = nextRate;
    }
  };

  const handleTogglePlayAllDialogue = () => {
    if (content.dialogue?.audioUrl) {
      handleToggleStudioAudio();
      return;
    }

    if (isAutoPlayingDialogue) {
      setIsAutoPlayingDialogue(false);
      setPlayingLineIdx(null);
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (!content.dialogue || content.dialogue.lines.length === 0) return;

    setIsAutoPlayingDialogue(true);
    let currentIdx = 0;

    const playNext = () => {
      if (!content.dialogue || currentIdx >= content.dialogue.lines.length) {
        setIsAutoPlayingDialogue(false);
        setPlayingLineIdx(null);
        return;
      }

      const line = content.dialogue.lines[currentIdx];
      setPlayingLineIdx(currentIdx);
      speakJapaneseText(line.japanese);

      const durationMs = Math.max(2200, line.japanese.length * 180 + 1000);
      currentIdx++;
      autoPlayTimeoutRef.current = setTimeout(playNext, durationMs);
    };

    playNext();
  };

  const isDialoguePlaying = isPlayingStudioAudio || isAutoPlayingDialogue;

  return (
    <div className="mx-auto max-w-3xl space-y-6 duration-200 animate-in fade-in">
      {/* Header / Intro Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <BookOpen size={16} />
          <span>{content.subtitle || 'Dars Mavzusi'}</span>
        </div>
        <h2 className="mb-2 break-words text-xl font-black tracking-tight text-foreground sm:mb-3 sm:text-2xl md:text-3xl">
          <FuriganaText text={content.title} />
        </h2>
        <p className="break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <FuriganaText text={content.explanation} />
        </p>

        {/* Key Takeaways */}
        {content.keyPoints && content.keyPoints.length > 0 && (
          <div className="mt-4 space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3.5 sm:mt-5 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Lightbulb size={14} />
              <span>Muhim Qoidalar:</span>
            </div>
            <ul className="space-y-1.5">
              {content.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                  <span className="break-words">
                    <FuriganaText text={point} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filter Tabs if multiple sections exist */}
      {((content.vocabulary && content.grammarRules) ||
        content.dialogue ||
        lessonKanji.length > 0) && (
        <div className="scrollbar-none flex touch-pan-x items-center gap-1.5 overflow-x-auto border-b border-border pb-2 sm:gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 cursor-pointer touch-manipulation select-none rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Barchasi
          </button>
          {content.vocabulary && content.vocabulary.length > 0 && (
            <button
              onClick={() => setActiveTab('vocab')}
              className={`shrink-0 cursor-pointer touch-manipulation select-none rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                activeTab === 'vocab'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              Lug'at ({content.vocabulary.length})
            </button>
          )}
          {content.grammarRules && content.grammarRules.length > 0 && (
            <button
              onClick={() => setActiveTab('grammar')}
              className={`shrink-0 cursor-pointer touch-manipulation select-none rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                activeTab === 'grammar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              Grammatika ({content.grammarRules.length})
            </button>
          )}
          {lessonKanji.length > 0 && (
            <button
              onClick={() => setActiveTab('kanji')}
              className={`shrink-0 cursor-pointer touch-manipulation select-none rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                activeTab === 'kanji'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              Kanji ({lessonKanji.length})
            </button>
          )}
          {content.dialogue && (
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                activeTab === 'dialogue'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <MessageSquare size={13} />
              <span>Dialog ({content.dialogue.lines.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Kanji Section */}
      {(activeTab === 'all' || activeTab === 'kanji') && lessonKanji.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
              <span>🈴 Dars Kanji</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({lessonKanji.length} ta)
              </span>
            </h3>
            <span className="text-xs text-muted-foreground">
              To'g'ri javoblar 2 marta takrorlansa o'zlashtirilgan hisoblanadi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lessonKanji.map((item) => {
              const progress = getKanjiProgress(item.kanji);
              return (
                <div
                  key={item.kanji}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl font-black leading-none text-primary">
                        {item.kanji}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground">{item.meaningUz}</div>
                        {item.onyomi && (
                          <div className="text-xs text-muted-foreground">On: {item.onyomi}</div>
                        )}
                        {item.kunyomi && (
                          <div className="text-xs text-muted-foreground">Kun: {item.kunyomi}</div>
                        )}
                        {item.strokeCount && (
                          <div className="text-[11px] text-muted-foreground">
                            Chiziqlar: {item.strokeCount}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSpeak(item.kanji)}
                      className="rounded-xl bg-secondary/80 p-2 text-muted-foreground transition-all hover:bg-primary/15 hover:text-primary"
                      title="Kanji talaffuzini eshitish"
                      aria-label={`Kanji talaffuzi: ${item.kanji}`}
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {item.examples && item.examples.length > 0 && (
                    <div className="mt-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                      {item.examples.slice(0, 2).map((example) => (
                        <div
                          key={`${item.kanji}-${example.word}`}
                          className="flex justify-between gap-2"
                        >
                          <span className="font-semibold text-foreground">
                            <FuriganaText text={example.word} />{' '}
                            <span className="font-normal text-primary">{example.reading}</span>
                          </span>
                          <span className="text-right">{example.meaning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        progress?.mastered ? 'text-emerald-500' : 'text-muted-foreground'
                      }`}
                    >
                      {progress?.mastered
                        ? 'O‘zlashtirilgan'
                        : progress
                          ? `${progress.correctAttempts}/${progress.attempts} to‘g‘ri`
                          : 'Hali ko‘rilmagan'}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleKanjiReview(item.kanji, 'incorrect')}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-rose-400 hover:text-rose-500"
                      >
                        Qayta ko‘rish
                      </button>
                      <button
                        onClick={() => handleKanjiReview(item.kanji, 'correct')}
                        className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Bilaman
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vocabulary Section */}
      {(activeTab === 'all' || activeTab === 'vocab') &&
        content.vocabulary &&
        content.vocabulary.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
              <span>📚 Yangi So'zlar</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({content.vocabulary.length} ta)
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {content.vocabulary.map((vocab, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                >
                  <div>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-black text-foreground">
                          <FuriganaText text={vocab.term} />
                        </div>
                        {vocab.reading && (
                          <div className="text-xs font-medium text-primary">{vocab.reading}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSpeak(vocab.term)}
                        className="rounded-xl bg-secondary/80 p-2 text-muted-foreground transition-all hover:bg-primary/15 hover:text-primary"
                        title="Talaffuzni eshitish"
                        aria-label={`Talaffuz: ${vocab.term}`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground/80">
                      {vocab.meaning}
                    </div>
                  </div>

                  {vocab.exampleSentence && (
                    <div className="mt-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between font-medium text-foreground/90">
                        <span>
                          <FuriganaText text={vocab.exampleSentence} />
                        </span>
                        <button
                          onClick={() => handleSpeak(vocab.exampleSentence!)}
                          className="p-0.5 text-muted-foreground hover:text-primary"
                          title="Jumlani tinglash"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                      {vocab.exampleTranslation && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {vocab.exampleTranslation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Grammar Section */}
      {(activeTab === 'all' || activeTab === 'grammar') &&
        content.grammarRules &&
        content.grammarRules.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
              <span>📖 Grammatika Qoidalari</span>
            </h3>

            <div className="space-y-3">
              {content.grammarRules.map((grammar, idx) => (
                <div
                  key={idx}
                  className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                      Qolip #{idx + 1}
                    </span>
                    <div className="text-base font-bold text-foreground">
                      <FuriganaText text={grammar.pattern} />
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-primary/90">
                    Ma'nosi: <span className="font-normal text-foreground">{grammar.meaning}</span>
                  </div>

                  {grammar.usageNotes && (
                    <p className="rounded-xl bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                      <FuriganaText text={grammar.usageNotes} />
                    </p>
                  )}

                  {grammar.examples && grammar.examples.length > 0 && (
                    <div className="space-y-2 border-t border-border/60 pt-2">
                      <div className="text-xs font-bold text-muted-foreground">Misollar:</div>
                      {grammar.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="flex items-start justify-between gap-2 rounded-xl bg-secondary/30 p-2.5 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-foreground">
                              <FuriganaText text={ex.sentence} />
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {ex.translation}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSpeak(ex.sentence)}
                            className="shrink-0 p-1 text-muted-foreground transition-all hover:text-primary"
                            title="Tinglash"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Dialogue / Kaiwa Section */}
      {(activeTab === 'all' || activeTab === 'dialogue') &&
        content.dialogue &&
        content.dialogue.lines &&
        content.dialogue.lines.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
                <MessageSquare size={16} className="text-primary" />
                <span>💬 Amaliy Dialog (Kaiwa)</span>
                {content.dialogue.title && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    — {content.dialogue.title}
                  </span>
                )}
              </h3>

              <button
                onClick={handleTogglePlayAllDialogue}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
                  isDialoguePlaying
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                title={isDialoguePlaying ? "To'xtatish" : 'Ketma-ket tinglash'}
              >
                {isDialoguePlaying ? (
                  <>
                    <Pause size={14} />
                    <span>To'xtatish</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>
                      {content.dialogue.audioUrl ? 'CD Audioni tinglash' : 'Barchasini tinglash'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Authentic Studio Audio Player Bar */}
            {content.dialogue.audioUrl && (
              <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleStudioAudio}
                    aria-label={
                      isPlayingStudioAudio ? "To'xtatish" : 'Studiyaviy CD audioni tinglash'
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    {isPlayingStudioAudio ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} className="ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                        <Disc size={12} className={isPlayingStudioAudio ? 'animate-spin' : ''} />
                        Haqiqiy Studiya CD Audiosi
                      </span>
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {formatAudioTime(studioAudioCurrentTime)} /{' '}
                        {formatAudioTime(studioAudioDuration)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                      {content.dialogue.titleJa || content.dialogue.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-3 sm:max-w-xs">
                  <input
                    type="range"
                    min="0"
                    max={studioAudioDuration || 100}
                    step="0.1"
                    value={studioAudioCurrentTime}
                    onChange={handleSeekStudioAudio}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary"
                    aria-label="Audio progress"
                  />
                  <button
                    onClick={handleTogglePlaybackRate}
                    className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                    title="Ijro tezligi"
                  >
                    {studioPlaybackRate}x
                  </button>
                </div>
              </div>
            )}

            {content.dialogue.situationUz && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/90">
                <span className="font-bold text-primary">Vaziyat (Situatsiya): </span>
                <span>{content.dialogue.situationUz}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {content.dialogue.lines.map((line, idx) => {
                const isPlaying = playingLineIdx === idx;
                const lineStart = dialogueLineSegments[idx]?.start ?? 0;
                return (
                  <div
                    key={idx}
                    ref={isPlaying ? activeLineRef : undefined}
                    onClick={() => {
                      if (content.dialogue?.audioUrl) {
                        handleSeekStudioToLine(idx);
                      }
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                      content.dialogue?.audioUrl ? 'cursor-pointer' : ''
                    } ${
                      isPlaying
                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/40'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-0.5 text-xs font-black text-foreground">
                            {line.speaker}
                          </span>
                          {line.speakerRoleUz && (
                            <span className="text-[11px] font-medium text-muted-foreground">
                              ({line.speakerRoleUz})
                            </span>
                          )}
                          {content.dialogue?.audioUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeekStudioToLine(idx);
                              }}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold transition-all ${
                                isPlaying
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'bg-muted/70 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                              }`}
                              title="Audioni shu vaqtdan boshlash (Seek)"
                            >
                              ⏱ {formatAudioTime(lineStart)}
                            </button>
                          )}
                          {isPlaying && (
                            <span className="inline-flex animate-pulse items-center gap-1 text-[11px] font-semibold text-primary">
                              <Volume2 size={12} />
                              Ijroda...
                            </span>
                          )}
                        </div>

                        <div className="text-base font-bold text-foreground">
                          <FuriganaText text={line.japanese} />
                        </div>

                        {line.romaji && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {line.romaji}
                          </div>
                        )}

                        <div className="pt-1 text-xs font-medium text-foreground/85">
                          {line.uzbek}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlaySingleLine(idx, line.japanese)}
                        className={`shrink-0 rounded-xl p-2 transition-all ${
                          isPlaying
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary/80 text-muted-foreground hover:bg-primary/15 hover:text-primary'
                        }`}
                        title="Ushbu gapni tinglash"
                        aria-label={`Tinglash: ${line.speaker}`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Cultural or Practical Note */}
      {content.culturalNotes && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-xs leading-relaxed text-foreground/90">
            <span className="font-bold text-amber-500">Muhim eslatma: </span>
            <FuriganaText text={content.culturalNotes} />
          </div>
        </div>
      )}
    </div>
  );
};
