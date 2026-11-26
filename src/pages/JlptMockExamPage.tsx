import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Volume2,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldAlert,
  Timer,
  X,
  LayoutGrid,
  Flag,
  ExternalLink,
} from 'lucide-react';
import { formatAttribution } from '../types/examMetadata';
import { Button } from '../components/ui/Button';
import { HistoryService } from '../services/HistoryService';
import {
  evaluateMockExamSession,
  ExamDiagnosticReport,
  ExamQuestionAnswer,
} from '../utils/ai/examEvaluator';
import { JlptExamResultCard } from '../components/jlpt/JlptExamResultCard';
import { ExamCertificateModal } from '../components/exams/ExamCertificateModal';
import { MasteryEngine } from '../services/MasteryEngine';
import { calculateJlptScore } from '../utils/jlptScoring';
import { DailyQuestService } from '../services/DailyQuestService';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { ExamService, ExamListItem, NormalizedExam } from '../services/ExamService';
import { JLPT_MOCK_EXAM_DATA, ExamQuestion } from '../data/jlptMockExamData';
import { toast } from '../hooks/use-toast';
import { ErrorNotificationService } from '../services/ErrorNotificationService';
import {
  MistakeVaultService,
  MistakeCategory,
  MistakeLevel,
} from '../services/MistakeVaultService';
import {
  getSectionDurationSeconds,
  getOrderedSections,
  getSectionIndex,
  getNextTimingBlock,
  getTimingBlockForSection,
  getBlockDurationSeconds,
  canOpenSectionInOfficialMode,
  getTotalExamSeconds,
  getTimingModelLabel,
  JLPT_CONTENT_SECTIONS,
  JLPT_CONTENT_SECTION_META,
  JlptExamMode,
  SectionKey,
  JlptTimingConfig,
} from '../utils/jlptExamTiming';
import { JlptTimingConfigService } from '../services/JlptTimingConfigService';
import { resolveAudioUrl } from '../utils/audioUrl';
import { speakJapaneseText, stopAllAudio } from '../utils/audioTts';
import { TimedSkillAssessmentService, TimedSkill } from '../services/TimedSkillAssessmentService';
import { getListeningAudioPolicy } from '../utils/mockListeningAudioPolicy';

import { useExamDeadline } from '../hooks/useExamDeadline';
import {
  clearExamDraft,
  countExamAnswers,
  readExamDraft,
  saveExamDraft,
  secondsUntil,
  ExamDraft,
} from '../utils/examSession';

function shortExamLabel(exam: ExamListItem, language: string): string {
  const variant = language === 'ja' ? 'テスト' : language === 'en' ? 'Variant' : 'Variant';
  if (exam.id.startsWith('builtin_')) {
    if (exam.id.endsWith('_random'))
      return language === 'ja'
        ? 'ランダム'
        : language === 'en'
          ? 'Mixed questions'
          : 'Aralash savollar';
    return `${variant} ${exam.id.endsWith('_set3') ? 'C' : exam.id.endsWith('_set2') ? 'B' : 'A'}`;
  }
  return (
    exam.title
      .replace(/^JLPT\s*N[1-5]\s*/i, '')
      .replace(/^Rasmiy Mock Test/i, 'Sinov')
      .trim() || exam.title
  );
}

interface CompletedTimingModel {
  label: string;
  mode: JlptExamMode;
  format: 'official' | 'simulation' | 'practice';
  level: string;
  totalMinutes: number;
  blockCount: number;
}

const JlptMockExamContent: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, awardXP, targetLevel } = useStudyData();
  const owner = user?.id || 'guest';
  const [savedDraft, setSavedDraft] = useState(() => readExamDraft(owner));
  const [deadline, setDeadline] = useState<number | null>(null);
  const submissionRef = useRef(false);
  const sessionRunningRef = useRef(false);
  const attemptIdRef = useRef(0);
  const [draftSaveFailed, setDraftSaveFailed] = useState(false);
  const urlLevel = searchParams.get('level')?.toUpperCase();
  const initialLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' =
    urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel)
      ? (urlLevel as any)
      : ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel)
        ? (targetLevel as 'N5' | 'N4' | 'N3' | 'N2' | 'N1')
        : 'N5';

  const { language } = useLanguage();
  const [level, setLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(initialLevel);
  const [step, setStep] = useState<'intro' | 'exam' | 'report'>('intro');
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  // Auth can resolve after the page's first render. Refresh the resumable draft
  // for the resolved account so a signed-in learner never sees the guest draft.
  useEffect(() => {
    if (step === 'intro') setSavedDraft(readExamDraft(owner));
  }, [owner, step]);

  // Available Exams from Supabase DB
  const [availableExams, setAvailableExams] = useState<ExamListItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState<boolean>(true);
  const [activeExam, setActiveExam] = useState<NormalizedExam | null>(null);
  const [isStartingExam, setIsStartingExam] = useState<boolean>(false);
  const [noRepeatPeriodDays, setNoRepeatPeriodDays] = useState<number>(() =>
    ExamService.getNoRepeatPeriodDays(),
  );

  // Official Sectioned Exam Mode State
  const [examMode, setExamMode] = useState<JlptExamMode>('official_timed');
  const isLegacySectionExam = selectedExamId.startsWith('exam_jlpt_');
  useEffect(() => {
    if (step === 'intro' && isLegacySectionExam) setExamMode('practice');
  }, [step, isLegacySectionExam]);
  const [useFullOfficialTime, setUseFullOfficialTime] = useState<boolean>(false);
  const [sealedSections, setSealedSections] = useState<SectionKey[]>([]);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number>(1200);
  const [sectionTotalDuration, setSectionTotalDuration] = useState<number>(1200);
  const [showSectionTransitionModal, setShowSectionTransitionModal] = useState<boolean>(false);
  const [timingConfig, setTimingConfig] = useState<JlptTimingConfig>(() =>
    JlptTimingConfigService.getCachedConfig(),
  );
  const [completedTimingModel, setCompletedTimingModel] = useState<CompletedTimingModel | null>(
    null,
  );
  const examStartTimeRef = useRef<number>(Date.now());
  const questionStartedAtRef = useRef<Map<number, number>>(new Map());
  const recordedQuestionIdsRef = useRef<Set<number>>(new Set());

  // Interactive Question Matrix & Flagging State
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const toggleFlagQuestion = (qId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const scrollToQuestion = (qId: number) => {
    const el = document.getElementById(`exam-q-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-rose-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-rose-500');
      }, 2000);
    }
  };

  useEffect(() => {
    if (urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel)) {
      setLevel(urlLevel as any);
    }
  }, [urlLevel]);

  useEffect(() => {
    let mounted = true;
    JlptTimingConfigService.loadConfig()
      .then((config) => {
        if (mounted && !sessionRunningRef.current) setTimingConfig(config);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch published exams for current level from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchExams = async () => {
      setLoadingExams(true);
      try {
        const list = await ExamService.getPublishedJlptExams(level);
        if (isMounted) {
          const defaultVariants: ExamListItem[] = [
            {
              id: `builtin_${level.toLowerCase()}`,
              title: `JLPT ${level} Rasmiy Mock Test — Variant A (1-to'plam)`,
              description: `Rasmiy formatdagi ${level} daraja yapon tili imtihoni (Variant A).`,
              type: `JLPT ${level}`,
              level,
              isPublished: true,
              createdAt: new Date().toISOString(),
              totalQuestions: 25,
              isOfficialJlpt: true,
            },
            {
              id: `builtin_${level.toLowerCase()}_set2`,
              title: `JLPT ${level} Rasmiy Mock Test — Variant B (2-to'plam: 500 Mon & Shin Kanzen)`,
              description: `500 Mon va Shin Kanzen asosidagi ${level} daraja imtihon simulyatori (Variant B).`,
              type: `JLPT ${level}`,
              level,
              isPublished: true,
              createdAt: new Date().toISOString(),
              totalQuestions: 25,
              isOfficialJlpt: true,
            },
            {
              id: `builtin_${level.toLowerCase()}_set3`,
              title: `JLPT ${level} Rasmiy Mock Test — Variant C (3-to'plam: Speed Master & Choukai Masterclass)`,
              description: `Speed Master va Choukai Masterclass asosidagi ${level} daraja imtihon simulyatori (Variant C).`,
              type: `JLPT ${level}`,
              level,
              isPublished: true,
              createdAt: new Date().toISOString(),
              totalQuestions: 25,
              isOfficialJlpt: true,
            },
            {
              id: `builtin_${level.toLowerCase()}_random`,
              title: `JLPT ${level} 🎲 Aqlli Dinamik Variant (Smart Dynamic Simulator)`,
              description: `Barcha to'plamlardan saralangan, takrorlanmaydigan savollar bilan tuzilgan yangi simulyatsiya.`,
              type: `JLPT ${level}`,
              level,
              isPublished: true,
              createdAt: new Date().toISOString(),
              totalQuestions: 25,
              isOfficialJlpt: false,
            },
          ];

          const combinedList = [...list];
          defaultVariants.forEach((v) => {
            if (!combinedList.some((e) => e.id === v.id)) {
              combinedList.push(v);
            }
          });

          setAvailableExams(combinedList);
          const urlExamId = searchParams.get('examId');
          if (urlExamId) {
            setSelectedExamId(urlExamId);
          } else if (combinedList.length > 0) {
            setSelectedExamId(combinedList[0].id);
          }
        }
      } catch (err) {
        console.warn('JlptMockExamPage: Error fetching exams:', err);
        if (isMounted) {
          ErrorNotificationService.notifyError({
            title: 'Imtihonlarni yuklashda xatolik',
            message: `${level} darajasidagi testlar ro'yxatini yuklab bo'lmadi. Qayta urinib ko'ring.`,
            error: err,
            retryAction: () => fetchExams(),
          });
        }
      } finally {
        if (isMounted) setLoadingExams(false);
      }
    };
    fetchExams();
    return () => {
      isMounted = false;
    };
  }, [level, searchParams]);

  // Active Section State
  const [activeSection, setActiveSection] = useState<'knowledge' | 'reading' | 'listening'>(
    'knowledge',
  );
  const [userAnswers, setUserAnswers] = useState<{ [qId: number]: number }>({});

  // Timer & Status (for Practice mode)
  const [timeLeft, setTimeLeft] = useState(3000); // default 50 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [syntheticListeningAttempt, setSyntheticListeningAttempt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Diagnostic Report State
  const [diagnosticReport, setDiagnosticReport] = useState<ExamDiagnosticReport | null>(null);
  const [mistakes, setMistakes] = useState<ExamQuestionAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Questions from active loaded exam (strictly for the selected level)
  const levelQuestions: ExamQuestion[] = activeExam?.questions || JLPT_MOCK_EXAM_DATA[level] || [];
  const knowledgeQuestions = levelQuestions.filter((q) => q.section === 'knowledge');
  const readingQuestions = levelQuestions.filter((q) => q.section === 'reading');
  const listeningQuestions = levelQuestions.filter((q) => q.section === 'listening');

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopAllAudio();
    };
  }, []);

  // Background audio preloading when activeSection is 'listening'
  useEffect(() => {
    if (step === 'exam' && activeSection === 'listening') {
      listeningQuestions.forEach((q) => {
        if (q.audioUrl && !q.audioUrl.includes('soundhelix.com')) {
          const preAudio = new Audio();
          preAudio.preload = 'auto';
          preAudio.src = resolveAudioUrl(q.audioUrl);
        }
      });
    }
  }, [step, activeSection, listeningQuestions]);

  const scrollExamToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }
  };

  const sealCurrentBlockAndAdvance = (automatic: boolean) => {
    if (audioRef.current) audioRef.current.pause();
    stopAllAudio();
    setIsPlaying(false);
    setPlayingAudioId(null);

    const currentBlock = getTimingBlockForSection(level, activeSection, timingConfig);
    const sectionsToSeal = currentBlock?.sections || [activeSection];
    const nextBlock = getNextTimingBlock(level, activeSection, timingConfig);

    if (nextBlock) {
      setSealedSections((prev) => Array.from(new Set([...prev, ...sectionsToSeal])));
      const nextSection = nextBlock.sections[0];
      setActiveSection(nextSection);
      const nextDuration = getBlockDurationSeconds(nextBlock, useFullOfficialTime);
      const nextDeadline =
        (automatic && deadline !== null ? deadline : Date.now()) + nextDuration * 1000;
      setDeadline(nextDeadline);
      setSectionTimeLeft(secondsUntil(nextDeadline));
      setSectionTotalDuration(nextDuration);
      toast({
        title: automatic ? '⏰ Blok vaqti tugadi!' : '✅ Blok muhrlandi!',
        description: `${nextBlock.shortLabel} blokiga o'tildi. ${
          sectionsToSeal.length > 1 ? 'Language Knowledge va Reading ' : 'Oldingi bo‘lim '
        }qayta ochilmaydi.`,
      });
      scrollExamToTop();
      return;
    }

    toast({
      title: '⏰ Rasmiy imtihon vaqti yakunlandi!',
      description: 'Barcha bloklar topshirildi. Natijangiz hisoblanmoqda...',
    });
    handleSubmitExam();
  };

  useExamDeadline(
    deadline,
    isTimerRunning && step === 'exam',
    (remaining) => {
      if (examMode === 'official_timed') setSectionTimeLeft(remaining);
      else setTimeLeft(remaining);
    },
    () => {
      if (examMode === 'official_timed') sealCurrentBlockAndAdvance(true);
      else void handleSubmitExam();
    },
  );

  const handleAdvanceSectionClick = () => {
    const nextBlock = getNextTimingBlock(level, activeSection, timingConfig);
    if (!nextBlock) {
      handleSubmitExam();
      return;
    }
    setShowSectionTransitionModal(true);
  };

  const handleConfirmAdvanceSection = () => {
    setShowSectionTransitionModal(false);
    sealCurrentBlockAndAdvance(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const latestDraftRef = useRef<ExamDraft | null>(null);
  useEffect(() => {
    latestDraftRef.current =
      step === 'exam' && activeExam && deadline !== null && !submissionRef.current
        ? {
            version: 2,
            owner,
            exam: activeExam,
            answers: userAnswers,
            flags: [...flaggedQuestions],
            activeSection,
            sealedSections,
            mode: examMode,
            fullTime: useFullOfficialTime,
            timingConfig,
            deadline,
            startedAt: examStartTimeRef.current,
            sectionDuration: sectionTotalDuration,
            syntheticListening: syntheticListeningAttempt,
          }
        : null;
  }, [
    step,
    owner,
    activeExam,
    deadline,
    userAnswers,
    flaggedQuestions,
    activeSection,
    sealedSections,
    examMode,
    useFullOfficialTime,
    timingConfig,
    sectionTotalDuration,
    syntheticListeningAttempt,
  ]);

  const persistDraft = useCallback(() => {
    const current = latestDraftRef.current;
    if (!current || submissionRef.current) return;
    const saved = saveExamDraft(current);
    setDraftSaveFailed(!saved);
  }, []);

  useEffect(() => {
    persistDraft();
  }, [
    persistDraft,
    step,
    activeExam,
    deadline,
    userAnswers,
    flaggedQuestions,
    activeSection,
    sealedSections,
    examMode,
    useFullOfficialTime,
    timingConfig,
    syntheticListeningAttempt,
  ]);
  useEffect(() => {
    const save = () => persistDraft();
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      // Avoid setting React state during teardown, and never recreate a submitted draft.
      if (latestDraftRef.current && !submissionRef.current) saveExamDraft(latestDraftRef.current);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, [persistDraft]);

  const resumeExam = () => {
    const draft = readExamDraft(owner);
    if (!draft) {
      setSavedDraft(null);
      return;
    }
    submissionRef.current = false;
    sessionRunningRef.current = true;
    attemptIdRef.current += 1;
    questionStartedAtRef.current.clear();
    recordedQuestionIdsRef.current.clear();
    setLevel(draft.exam.level);
    setSearchParams({ level: draft.exam.level, examId: draft.exam.id }, { replace: true });
    setActiveExam(draft.exam);
    setSelectedExamId(draft.exam.id);
    setUserAnswers(draft.answers);
    setFlaggedQuestions(new Set(draft.flags));
    setActiveSection(draft.activeSection);
    setSealedSections(draft.sealedSections);
    setExamMode(draft.mode);
    setUseFullOfficialTime(draft.fullTime);
    setTimingConfig(draft.timingConfig);
    setSectionTotalDuration(draft.sectionDuration);
    setSyntheticListeningAttempt(draft.syntheticListening);
    examStartTimeRef.current = draft.startedAt;
    setDeadline(draft.deadline);
    setSectionTimeLeft(secondsUntil(draft.deadline));
    setTimeLeft(secondsUntil(draft.deadline));
    setMistakes([]);
    setDiagnosticReport(null);
    setCompletedTimingModel(null);
    setStep('exam');
    setIsTimerRunning(true);
  };

  const handleStartExam = async () => {
    setIsStartingExam(true);
    setSyntheticListeningAttempt(false);
    questionStartedAtRef.current.clear();
    recordedQuestionIdsRef.current.clear();
    try {
      const examData = await ExamService.getExamWithQuestions(
        selectedExamId || `builtin_${level.toLowerCase()}`,
        level,
      );

      const loadedQuestions = examData?.questions || JLPT_MOCK_EXAM_DATA[level] || [];
      if (loadedQuestions.length === 0) {
        toast({
          variant: 'destructive',
          title: '❌ Savollar topilmadi',
          description: `${level} darajasi uchun imtihon savollari bazada mavjud emas. Boshqa darajaga yashirincha o'tish cheklangan.`,
        });
        return;
      }
      setActiveExam(examData);
      setLevel(examData.level);
      setSearchParams({ level: examData.level, examId: examData.id }, { replace: true });

      if (examData.generationWarnings && examData.generationWarnings.length > 0) {
        const hasShortage = examData.generationWarnings.some((warning) =>
          warning.includes('kerak edi'),
        );
        toast({
          variant: hasShortage ? 'destructive' : 'default',
          title: hasShortage ? '⚠️ Savollar yetarli emas' : 'ℹ️ No-repeat ogohlantirishi',
          description: examData.generationWarnings.join(' '),
        });
      }

      submissionRef.current = false;
      sessionRunningRef.current = true;
      attemptIdRef.current += 1;
      setSavedDraft(null);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setMistakes([]);
      setDiagnosticReport(null);
      setCompletedTimingModel(null);
      setStep('exam');
      examStartTimeRef.current = Date.now();
      const isPartial = new Set(loadedQuestions.map((q) => q.section)).size < 3;
      const mode = isPartial ? 'practice' : examMode;
      setExamMode(mode);
      const firstSec = isPartial
        ? loadedQuestions[0].section
        : getOrderedSections(examData.level, timingConfig)[0]?.sections[0] || 'knowledge';
      setActiveSection(firstSec);
      setSealedSections([]);
      const duration =
        mode === 'official_timed'
          ? getSectionDurationSeconds(examData.level, firstSec, useFullOfficialTime, timingConfig)
          : examData.timeLimitSeconds;
      setSectionTimeLeft(duration);
      setTimeLeft(duration);
      setSectionTotalDuration(duration);
      setDeadline(Date.now() + duration * 1000);
      setIsTimerRunning(true);
    } catch (err: any) {
      console.error('Failed to load exam:', err);
      toast({
        variant: 'destructive',
        title: '❌ Imtihonni yuklashda xatolik',
        description:
          err?.message ||
          `${level} darajasidagi imtihonni yuklab bo'lmadi. Iltimos, qaytadan urinib ko'ring.`,
      });
    } finally {
      setIsStartingExam(false);
    }
  };

  const handleOptionSelect = (question: ExamQuestion, optionIdx: number) => {
    const qId = question.id;
    if (!questionStartedAtRef.current.has(qId)) questionStartedAtRef.current.set(qId, Date.now());
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // Synthetic speech is practice support only. A scored, timed mock must never
  // silently replace the recorded track because the attempt would not be comparable.
  const handlePlayAudio = (qId: number, url?: string, _script?: string) => {
    const audioPolicy = getListeningAudioPolicy(examMode, url, _script);
    if (isPlaying && playingAudioId === qId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopAllAudio();
      setIsPlaying(false);
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopAllAudio();

    if (audioPolicy === 'original' && url) {
      try {
        const audio = new Audio(resolveAudioUrl(url));
        audioRef.current = audio;
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setPlayingAudioId(qId);
          })
          .catch((err) => {
            if (err?.name === 'AbortError') return;
            console.warn('Audio play failed:', err);
            if (
              audioPolicy === 'original' &&
              examMode === 'practice' &&
              _script &&
              _script.trim()
            ) {
              setIsPlaying(true);
              setPlayingAudioId(qId);
              setSyntheticListeningAttempt(true);
              speakJapaneseText(_script);
              toast({
                title: 'Mashq rejimidagi sintetik audio',
                description: 'Bu tinglash natijasi standart mock imtihon bilan taqqoslanmaydi.',
              });
            } else {
              setIsPlaying(false);
              setPlayingAudioId(null);
              toast({
                title: 'Audio xatosi',
                description:
                  examMode === 'official_timed'
                    ? 'Rasmiy mock uchun original audio kerak. Qayta urinib ko‘ring.'
                    : 'Ushbu audio trekni ijro etib bo‘lmadi.',
                variant: 'destructive',
              });
            }
          });
        audio.onended = () => {
          setIsPlaying(false);
          setPlayingAudioId(null);
        };
        audio.onerror = () => {
          console.warn('Audio load error');
          if (examMode === 'practice' && _script && _script.trim()) {
            setIsPlaying(true);
            setPlayingAudioId(qId);
            setSyntheticListeningAttempt(true);
            speakJapaneseText(_script);
            toast({
              title: 'Mashq rejimidagi sintetik audio',
              description: 'Bu tinglash natijasi standart mock imtihon bilan taqqoslanmaydi.',
            });
          } else {
            setIsPlaying(false);
            setPlayingAudioId(null);
            toast({
              title: 'Audio xatosi',
              description: 'Audio trekni yuklab bo‘lmadi.',
              variant: 'destructive',
            });
          }
        };
      } catch {
        setIsPlaying(false);
        setPlayingAudioId(null);
      }
    } else if (audioPolicy === 'synthetic_practice' && _script) {
      setIsPlaying(true);
      setPlayingAudioId(qId);
      setSyntheticListeningAttempt(true);
      speakJapaneseText(_script);
      toast({
        title: 'Mashq rejimidagi sintetik audio',
        description: 'Bu tinglash natijasi standart mock imtihon bilan taqqoslanmaydi.',
      });
    } else {
      setIsPlaying(false);
      setPlayingAudioId(null);
      toast({
        title: 'Audio mavjud emas',
        description: 'Ushbu savol uchun audio yoki skript topilmadi.',
      });
    }
  };

  const handleSubmitExam = async () => {
    if (submissionRef.current) return;
    submissionRef.current = true;
    const submittedAttempt = attemptIdRef.current;
    sessionRunningRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopAllAudio();
    setIsPlaying(false);
    setPlayingAudioId(null);
    setIsTimerRunning(false);
    // Record final answers at submission, so changing a selection does not leave
    // the first answer recorded as the result. Keep unanswered questions as skips.
    for (const question of levelQuestions) {
      if (recordedQuestionIdsRef.current.has(question.id)) continue;
      const skill: TimedSkill =
        question.section === 'reading'
          ? 'reading'
          : question.section === 'listening'
            ? 'listening'
            : 'knowledge';
      TimedSkillAssessmentService.record(
        {
          level,
          skill,
          questionId: question.originalId ?? String(question.id),
          correct: userAnswers[question.id] === question.correctAnswer,
          skipped: userAnswers[question.id] === undefined,
          durationMs: Math.max(
            0,
            Date.now() -
              (questionStartedAtRef.current.get(question.id) ?? examStartTimeRef.current),
          ),
        },
        user?.id,
      );
      recordedQuestionIdsRef.current.add(question.id);
    }
    const timingBlocks = getOrderedSections(level, timingConfig);
    setCompletedTimingModel({
      label: getTimingModelLabel(level, examMode, useFullOfficialTime),
      mode: examMode,
      format:
        examMode === 'practice' ? 'practice' : useFullOfficialTime ? 'official' : 'simulation',
      level,
      totalMinutes:
        examMode === 'official_timed'
          ? Math.round(getTotalExamSeconds(level, useFullOfficialTime, timingConfig) / 60)
          : Math.round((activeExam?.timeLimitSeconds || 3000) / 60),
      blockCount: examMode === 'official_timed' ? timingBlocks.length : 1,
    });
    clearExamDraft(owner);
    latestDraftRef.current = null;
    setSavedDraft(null);
    setStep('report');
    setIsAnalyzing(true);

    const durSecs = Math.max(10, Math.round((Date.now() - examStartTimeRef.current) / 1000));

    const questionAnswers: ExamQuestionAnswer[] = levelQuestions.map((q) => {
      const userIdx = userAnswers[q.id];
      const isCorr = userIdx === q.correctAnswer;
      return {
        questionId: String(q.id),
        questionText: q.questionText,
        section: q.section,
        options: q.options,
        userAnswer: userIdx !== undefined ? q.options[userIdx] : 'Javob berilmagan',
        correctAnswer: q.options[q.correctAnswer],
        isCorrect: isCorr,
        explanationUzbek: q.explanationUzbek,
        audioUrl: q.audioUrl,
        script: q.script,
      };
    });

    // Track wrong questions for flashcard export
    const wrongAnswers = questionAnswers.filter((q) => !q.isCorrect);
    setMistakes(wrongAnswers);

    // Persist wrong questions automatically into Mistake Vault Notebook
    try {
      const wrongExamQuestions = levelQuestions.filter(
        (q) => userAnswers[q.id] !== q.correctAnswer,
      );
      if (wrongExamQuestions.length > 0) {
        const mapSectionToCategory = (sec: string): MistakeCategory => {
          if (sec === 'choukai' || sec === 'listening') return 'listening';
          if (sec === 'dokkai' || sec === 'reading') return 'reading';
          if (sec === 'moji_goi' || sec === 'vocab') return 'vocab';
          return 'grammar';
        };

        MistakeVaultService.recordBatch(
          wrongExamQuestions.map((q) => ({
            userId: user?.id,
            source: 'mock_exam',
            level: (level || 'N5') as MistakeLevel,
            category: mapSectionToCategory(q.section),
            title: `JLPT ${level} Mock — ${q.section}`,
            questionText: q.questionText,
            passageText: q.script || undefined,
            audioUrl: q.audioUrl,
            options: q.options,
            userAnswer: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1,
            correctAnswer: q.correctAnswer,
            explanationUzbek: q.explanationUzbek || '',
          })),
          user?.id,
        );
      }
    } catch (e) {
      console.warn('Failed to record mistakes to MistakeVaultService:', e);
    }

    // Record question IDs to ensure no-repeat logic in subsequent dynamic exams
    try {
      ExamService.recordAnsweredQuestions(levelQuestions.map((q) => q.originalId ?? String(q.id)));
    } catch (e) {
      console.warn('Failed to record answered questions in ExamService:', e);
    }

    const jlptScoreReport = calculateJlptScore(level, levelQuestions, userAnswers);
    const counts = countExamAnswers(levelQuestions, userAnswers);
    const completeExam = new Set(levelQuestions.map((q) => q.section)).size === 3;
    const percentage = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
    const basicReport: ExamDiagnosticReport = {
      overall_score_text: `${counts.correct}/${counts.total} (${percentage}%)`,
      percentage,
      passed: completeExam ? jlptScoreReport.passed : percentage >= 60,
      top_3_mistakes: [],
      actionable_recommendation:
        counts.wrong + counts.skipped > 0
          ? 'Xato va javobsiz savollarni takrorlang, keyin mavzuga qayting.'
          : 'Keyingi sinovda bilimingizni mustahkamlang.',
      jlptScoreReport: completeExam ? jlptScoreReport : undefined,
    };
    // Correctness and history never depend on an AI response.
    setDiagnosticReport(basicReport);
    setIsAnalyzing(false);
    try {
      await HistoryService.saveMockExam({
        examType: 'jlpt',
        level,
        score: counts.correct,
        totalQuestions: counts.total,
        bandScore: completeExam ? jlptScoreReport.totalScore : percentage,
      });
    } catch (error) {
      console.error('Could not save exam result:', error);
      toast({
        variant: 'destructive',
        title: 'Natija tarixga saqlanmadi',
        description: 'Natijangiz ekranda qoladi. Internet ulanishini tekshiring.',
      });
    }
    if (awardXP && counts.correct + counts.wrong > 0) void awardXP(100).catch(() => {});
    try {
      DailyQuestService.recordMockScore(owner, percentage);
    } catch {}
    const observedSections: SectionKey[] = ['knowledge', 'reading', 'listening'];
    for (const section of observedSections) {
      const questions = levelQuestions.filter((question) => question.section === section);
      if (!questions.length || (section === 'listening' && syntheticListeningAttempt)) continue;
      const result = countExamAnswers(questions, userAnswers);
      if (result.correct + result.wrong === 0) continue;
      const skills: ('grammar' | 'vocabulary' | 'reading' | 'listening')[] =
        section === 'knowledge' ? ['grammar', 'vocabulary'] : [section];
      for (const skill of skills) {
        MasteryEngine.recordEvidence(owner, 'ja', {
          id: `jlpt_mock_${level}_${skill}_${examStartTimeRef.current}`,
          skill,
          score: Math.round((result.correct / result.total) * 100),
          timestamp: new Date().toISOString(),
          details: `JLPT ${level} ${section}: ${result.correct}/${result.total}`,
          type: 'performance',
        });
      }
    }
    try {
      const report = await evaluateMockExamSession(
        `JLPT ${level}`,
        questionAnswers,
        durSecs,
        completeExam ? jlptScoreReport : undefined,
      );
      if (attemptIdRef.current === submittedAttempt) {
        setDiagnosticReport({
          ...report,
          percentage,
          passed: basicReport.passed,
          jlptScoreReport: basicReport.jlptScoreReport,
        });
      }
    } catch (error) {
      console.error('AI analysis unavailable; keeping scored result:', error);
    } finally {
      if (attemptIdRef.current === submittedAttempt) setIsAnalyzing(false);
    }
  };

  const answerCounts = countExamAnswers(levelQuestions, userAnswers);

  const orderedSections = getOrderedSections(level, timingConfig);
  const currentSectionIndex = getSectionIndex(level, activeSection, timingConfig);
  const currentSpec = getTimingBlockForSection(level, activeSection, timingConfig);
  const nextSectionSpec = getNextTimingBlock(level, activeSection, timingConfig);

  const activeSectionQuestions =
    activeSection === 'knowledge'
      ? knowledgeQuestions
      : activeSection === 'reading'
        ? readingQuestions
        : listeningQuestions;
  const currentBlockQuestions = levelQuestions.filter((q) =>
    currentSpec?.sections.includes(q.section),
  );
  const answeredInSection = activeSectionQuestions.filter(
    (q) => userAnswers[q.id] !== undefined,
  ).length;
  const totalInSection = activeSectionQuestions.length;
  const unansweredInSection = totalInSection - answeredInSection;
  const answeredInBlock = currentBlockQuestions.filter(
    (q) => userAnswers[q.id] !== undefined,
  ).length;
  const unansweredInBlock = currentBlockQuestions.length - answeredInBlock;

  const isWarningTime =
    examMode === 'official_timed'
      ? sectionTimeLeft <= 300 && sectionTimeLeft > 60
      : timeLeft <= 300 && timeLeft > 60;
  const isCriticalTime = examMode === 'official_timed' ? sectionTimeLeft <= 60 : timeLeft <= 60;

  return (
    <div
      className={
        embedded
          ? 'space-y-6'
          : 'mx-auto max-w-5xl space-y-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:p-8 md:pb-8 2xl:max-w-6xl 3xl:max-w-7xl 3xl:p-12'
      }
    >
      {/* Navigation Header */}
      {(!embedded || step !== 'intro') && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <button
            aria-label={
              language === 'uz'
                ? 'Darslarga qaytish'
                : language === 'ja'
                  ? 'レッスンに戻る'
                  : 'Back to lessons'
            }
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              stopAllAudio();
              navigate('/jlpt');
            }}
            className="rounded-xl border border-border p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-extrabold text-rose-600 dark:text-rose-400">
            🎌{' '}
            {language === 'ja'
              ? 'JLPT こうしき もぎしけん'
              : 'JLPT Official Mock Simulator (模擬試験)'}
          </span>
        </div>
      )}

      {step === 'intro' && savedDraft && (
        <section
          aria-label="Tugallanmagan sinov"
          className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <div>
            <h2 className="font-semibold">Tugallanmagan sinov</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {savedDraft.exam.title} · {Object.keys(savedDraft.answers).length}/
              {savedDraft.exam.questions.length} ta javob
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Javoblar shu brauzerda saqlanadi. Sinov vaqti sahifa yopiq bo‘lganda ham davom etadi.
            </p>
          </div>
          <Button onClick={resumeExam}>Davom ettirish</Button>
        </section>
      )}
      {step === 'exam' && draftSaveFailed && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
        >
          Javoblarni shu brauzerda saqlab bo‘lmadi. Sahifani yopmang.{' '}
          <button className="underline" onClick={persistDraft}>
            Qayta saqlash
          </button>
        </p>
      )}
      {/* STEP 1: INTRO */}
      {step === 'intro' && (
        <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {language === 'ja'
                ? 'テストの設定'
                : language === 'en'
                  ? 'Set up your practice exam'
                  : 'Sinovni tanlang'}
            </h2>
          </div>

          {/* Level Selector */}
          <div className="grid grid-cols-5 gap-2">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
              <button
                key={lvl}
                aria-pressed={level === lvl}
                onClick={() => {
                  setLevel(lvl);
                  const params = new URLSearchParams(searchParams);
                  params.set('level', lvl);
                  params.delete('examId');
                  setSelectedExamId('');
                  setLoadingExams(true);
                  setSearchParams(params);
                }}
                className={`min-h-11 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                  level === lvl
                    ? 'border-rose-500 bg-primary text-primary-foreground shadow-md shadow-rose-500/20'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Available Mock Exams Selector */}
          <div className="space-y-3 text-left">
            {!loadingExams &&
              selectedExamId &&
              !availableExams.some((exam) => exam.id === selectedExamId) && (
                <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  Havola orqali tanlangan sinov · JLPT {level}
                  {isLegacySectionExam ? ' · Alohida bo‘lim mashqi' : ''}
                </p>
              )}
            <label className="block space-y-2 text-sm font-medium">
              <span>{language === 'ja' ? 'テスト' : language === 'en' ? 'Test' : 'Sinov'}</span>
              <select
                aria-label={language === 'ja' ? 'テスト' : language === 'en' ? 'Test' : 'Sinov'}
                value={selectedExamId}
                disabled={loadingExams}
                onChange={(event) => setSelectedExamId(event.target.value)}
                className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 pr-8 text-base text-foreground disabled:opacity-50 sm:text-sm"
              >
                {loadingExams && <option value="">Yuklanmoqda…</option>}
                {!loadingExams &&
                  selectedExamId &&
                  !availableExams.some((ex) => ex.id === selectedExamId) && (
                    <option value={selectedExamId}>JLPT {level} · Alohida sinov</option>
                  )}
                {availableExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {shortExamLabel(ex, language)}
                  </option>
                ))}
              </select>
            </label>
            {(() => {
              const selected = availableExams.find((ex) => ex.id === selectedExamId);
              return selected?.sourceName || selected?.author ? (
                <p className="text-xs text-muted-foreground">
                  Manba: {selected.sourceName || selected.author}
                </p>
              ) : null;
            })()}
          </div>

          {selectedExamId.endsWith('_random') && (
            <details className="rounded-xl border border-border p-3">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
                Aralash variant sozlamalari
              </summary>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">Takrorlanmaslik davri</div>
                  <div className="text-sm text-muted-foreground">
                    So'nggi shu davr ichida ishlangan savollar yangi variantda iloji boricha
                    takrorlanmaydi.
                  </div>
                </div>
                <select
                  data-testid="jlpt-no-repeat-period"
                  aria-label="Takrorlanmaslik davri"
                  value={noRepeatPeriodDays}
                  onChange={(event) => {
                    const days = Number(event.target.value);
                    setNoRepeatPeriodDays(days);
                    ExamService.setNoRepeatPeriodDays(days);
                  }}
                  className="min-h-11 rounded-lg border border-input bg-card px-3 py-2 text-base font-bold text-foreground sm:text-sm"
                >
                  <option value={0}>O'chirilgan</option>
                  <option value={7}>7 kun</option>
                  <option value={14}>14 kun</option>
                  <option value={30}>30 kun</option>
                  <option value={60}>60 kun</option>
                  <option value={90}>90 kun</option>
                </select>
              </div>
            </details>
          )}

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">
              {language === 'ja' ? 'モード' : language === 'en' ? 'Mode' : 'Rejim'}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    mode: 'official_timed',
                    label: language === 'ja' ? '試験' : language === 'en' ? 'Exam' : 'Imtihon',
                  },
                  {
                    mode: 'practice',
                    label: language === 'ja' ? '練習' : language === 'en' ? 'Practice' : 'Mashq',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  aria-pressed={examMode === item.mode}
                  disabled={item.mode === 'official_timed' && isLegacySectionExam}
                  onClick={() => setExamMode(item.mode)}
                  className={`min-h-12 rounded-xl border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${examMode === item.mode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {examMode === 'official_timed'
                ? language === 'ja'
                  ? '時間制限あり。終了したブロックには戻れません。'
                  : language === 'en'
                    ? 'Timed blocks. Completed blocks cannot be reopened.'
                    : 'Vaqt cheklangan. Yakunlangan bo‘limga qaytib bo‘lmaydi.'
                : language === 'ja'
                  ? 'セクションを自由に切り替えられます。'
                  : language === 'en'
                    ? 'Move freely between sections.'
                    : 'Bo‘limlar orasida erkin o‘tish mumkin.'}
            </p>
            {examMode === 'official_timed' && (
              <label className="block space-y-2 text-sm font-medium">
                <span>{language === 'ja' ? '時間' : language === 'en' ? 'Time' : 'Vaqt'}</span>
                <select
                  aria-label={language === 'ja' ? '時間' : language === 'en' ? 'Time' : 'Vaqt'}
                  value={useFullOfficialTime ? 'full' : 'short'}
                  onChange={(event) => setUseFullOfficialTime(event.target.value === 'full')}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                >
                  <option value="short">
                    {language === 'ja' ? '短縮' : language === 'en' ? 'Short' : 'Qisqa sinov'} ·{' '}
                    {Math.round(getTotalExamSeconds(level, false, timingConfig) / 60)}{' '}
                    {language === 'ja' ? '分' : language === 'en' ? 'min' : 'daqiqa'}
                  </option>
                  <option value="full">
                    {language === 'ja'
                      ? '本番の時間'
                      : language === 'en'
                        ? 'Full time'
                        : 'To‘liq vaqt'}{' '}
                    · {Math.round(getTotalExamSeconds(level, true, timingConfig) / 60)}{' '}
                    {language === 'ja' ? '分' : language === 'en' ? 'min' : 'daqiqa'}
                  </option>
                </select>
              </label>
            )}
          </fieldset>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {language === 'ja'
              ? '結果は練習用の目安であり、公式のJLPT得点ではありません。'
              : language === 'en'
                ? 'Results are practice estimates, not official JLPT scores.'
                : 'Natija mashq uchun. Bu rasmiy JLPT bahosi emas.'}
          </p>

          <Button
            disabled={isStartingExam || loadingExams}
            onClick={handleStartExam}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-rose-500/20 hover:bg-primary/90 disabled:opacity-50"
          >
            {isStartingExam ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Imtihon tayyorlanmoqda...
              </span>
            ) : language === 'ja' ? (
              '始める'
            ) : language === 'en' ? (
              'Start'
            ) : (
              'Boshlash'
            )}
          </Button>
        </div>
      )}

      {/* STEP 2: ACTIVE EXAM */}
      {step === 'exam' && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-rose-500">
                JLPT {level} Full Simulation Exam
              </span>
              <span className="hidden h-4 w-px bg-border sm:inline-block" />
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                {examMode === 'official_timed' ? '🏛️ Rasmiy Bo‘limli Rejim' : '⚡ Erkin Mashq'}
              </span>
            </div>

            {/* Countdown timer pill */}
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-sm font-extrabold transition-all ${
                isCriticalTime
                  ? 'animate-pulse border-red-500 bg-red-500/10 text-red-600 shadow-md shadow-red-500/20 dark:text-red-400'
                  : isWarningTime
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Clock size={16} />
              <span>
                {examMode === 'official_timed' ? formatTime(sectionTimeLeft) : formatTime(timeLeft)}
              </span>
              <span className="font-sans text-[10px] font-normal opacity-80">
                {examMode === 'official_timed' ? "(Bo'lim vaqti)" : '(Umumiy)'}
              </span>
            </div>
          </div>

          {/* Section Timeline Tracker (Official Timed Mode) */}
          {examMode === 'official_timed' && (
            <div className="space-y-3.5 rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                      {`${currentSectionIndex + 1} / ${orderedSections.length}-BO‘LIM`}
                    </span>
                    <h3 className="text-sm font-black text-foreground">
                      {currentSpec?.titleJa} — {currentSpec?.titleUz}
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{currentSpec?.descriptionUz}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-bold text-muted-foreground">
                    Javoblar: <strong className="text-foreground">{answeredInBlock}</strong> /{' '}
                    {currentBlockQuestions.length}
                  </span>
                  {isCriticalTime && (
                    <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-[10px] font-black text-red-600 dark:text-red-400">
                      <AlertTriangle size={11} /> 1 daqiqadan kam!
                    </span>
                  )}
                  {!isCriticalTime && isWarningTime && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
                      <Clock size={11} /> 5 daqiqadan kam!
                    </span>
                  )}
                </div>
              </div>

              {/* Section Timeline Cards */}
              <div className="grid grid-cols-3 gap-2">
                {orderedSections.map((sec) => {
                  const isSealed = sec.sections.every((section) =>
                    sealedSections.includes(section),
                  );
                  const isActive = sec.sections.includes(activeSection);

                  return (
                    <div
                      key={sec.block}
                      className={`flex flex-col justify-between gap-1 rounded-2xl border p-3 transition-all sm:flex-row sm:items-center ${
                        isActive
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 shadow-sm ring-1 ring-rose-500/30 dark:text-rose-400'
                          : isSealed
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-muted/20 text-muted-foreground/60'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {isSealed ? (
                          <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                        ) : isActive ? (
                          <Timer size={15} className="shrink-0 animate-pulse text-rose-500" />
                        ) : (
                          <Lock size={15} className="shrink-0 text-muted-foreground/60" />
                        )}
                        <span className="truncate text-xs font-black">{sec.shortLabel}</span>
                      </div>
                      <span className="text-[10px] font-bold">
                        {isSealed
                          ? 'Muhrlangan'
                          : isActive
                            ? formatTime(sectionTimeLeft)
                            : 'Qulflangan'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar of Section Time */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCriticalTime
                      ? 'animate-pulse bg-red-500'
                      : isWarningTime
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (sectionTimeLeft / (sectionTotalDuration || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Section Switcher Tabs */}
          <div className="flex border-b border-border text-xs">
            {JLPT_CONTENT_SECTIONS.map((section) => {
              const meta = JLPT_CONTENT_SECTION_META[section];
              const sectionBlock = getTimingBlockForSection(level, section, timingConfig);
              const isSealed =
                sealedSections.includes(section) ||
                Boolean(sectionBlock?.sections.every((item) => sealedSections.includes(item)));
              const isActive = activeSection === section;
              const targetBlockIndex = getSectionIndex(level, section, timingConfig);
              const isUpcoming =
                examMode === 'official_timed' && targetBlockIndex > currentSectionIndex;
              const isLocked =
                examMode === 'official_timed' &&
                !isActive &&
                !canOpenSectionInOfficialMode(
                  level,
                  section,
                  activeSection,
                  sealedSections,
                  timingConfig,
                );

              return (
                <button
                  key={section}
                  onClick={() => {
                    if (examMode === 'official_timed' && !isActive) {
                      if (isSealed || targetBlockIndex < currentSectionIndex) {
                        toast({
                          title: "🔒 Bo'lim muhrlangan",
                          description:
                            'Ushbu blok yakunlangan. Javoblar qat’iy saqlangan va qayta ochilmaydi.',
                        });
                        return;
                      }
                      if (isUpcoming || isLocked) {
                        toast({
                          title: "🔒 Bo'lim qulflangan",
                          description:
                            'Japan Foundation qoidalariga ko‘ra, keyingi blok oldingi blok yakunlangach ochiladi.',
                        });
                        return;
                      }
                    }
                    setActiveSection(section);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 font-bold transition-all ${
                    isActive
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : isSealed
                        ? 'border-transparent text-emerald-600 dark:text-emerald-400'
                        : isLocked
                          ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                          : 'border-transparent text-muted-foreground'
                  }`}
                >
                  {isSealed ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : isLocked ? (
                    <Lock size={14} />
                  ) : section === 'knowledge' ? (
                    <FileText size={14} />
                  ) : section === 'reading' ? (
                    <BookOpen size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  <span>{meta.titleJa}</span>
                  {isSealed && (
                    <span className="text-[10px] font-normal text-emerald-500">(Muhrlandi)</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive Question Grid Matrix */}
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-rose-500" />
                <h4 className="text-xs font-black text-foreground">
                  Savollar ({answeredInSection} / {totalInSection} javob berildi)
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Javob berilgan (
                  {answeredInSection})
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Belgilangan (
                  {
                    [...flaggedQuestions].filter((id) =>
                      activeSectionQuestions.some((q) => q.id === id),
                    ).length
                  }
                  )
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span> Qolgan (
                  {unansweredInSection})
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {activeSectionQuestions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    aria-label={`${idx + 1}-savol${isAnswered ? ', javob berilgan' : ''}${isFlagged ? ', belgilangan' : ''}`}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                      isAnswered
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 shadow-xs dark:text-emerald-400'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-muted'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950 shadow-xs">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions area according to active section */}
          <div className="space-y-4">
            {activeSection === 'knowledge' &&
              knowledgeQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  id={`exam-q-${q.id}`}
                  className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                      {`Q${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFlagQuestion(q.id)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        flaggedQuestions.has(q.id)
                          ? 'border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Flag
                        size={12}
                        className={flaggedQuestions.has(q.id) ? 'fill-current' : ''}
                      />
                      <span>{flaggedQuestions.has(q.id) ? 'Belgilandi ⭐' : 'Belgilash'}</span>
                    </button>
                  </div>
                  <h4 className="font-serif text-xs font-black text-foreground">
                    {q.questionText}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id] === optIdx;
                      const isOptionDisabled =
                        examMode === 'official_timed' && sealedSections.includes('knowledge');
                      return (
                        <button
                          key={optIdx}
                          disabled={isOptionDisabled}
                          onClick={() => handleOptionSelect(q, optIdx)}
                          className={`rounded-xl border p-3 text-center text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                          } ${isOptionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {activeSection === 'reading' &&
              readingQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  id={`exam-q-${q.id}`}
                  className="grid grid-cols-1 gap-6 transition-all duration-300 md:grid-cols-2"
                >
                  <div className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                      <h4 className="text-xs font-extrabold text-foreground">
                        読解 (Reading Passage)
                      </h4>
                      <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                        {`Q${idx + 1}`}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap font-serif text-xs leading-relaxed text-muted-foreground">
                      {q.passageText}
                    </p>
                  </div>
                  <div className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="font-serif text-xs font-black text-foreground">Savol:</span>
                      <button
                        type="button"
                        onClick={() => toggleFlagQuestion(q.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          flaggedQuestions.has(q.id)
                            ? 'border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Flag
                          size={12}
                          className={flaggedQuestions.has(q.id) ? 'fill-current' : ''}
                        />
                        <span>{flaggedQuestions.has(q.id) ? 'Belgilandi ⭐' : 'Belgilash'}</span>
                      </button>
                    </div>
                    <h4 className="font-serif text-xs font-black text-foreground">
                      {q.questionText}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;
                        const isOptionDisabled =
                          examMode === 'official_timed' && sealedSections.includes('reading');
                        return (
                          <button
                            key={optIdx}
                            disabled={isOptionDisabled}
                            onClick={() => handleOptionSelect(q, optIdx)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                            } ${isOptionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 size={15} className="text-rose-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

            {activeSection === 'listening' &&
              listeningQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  id={`exam-q-${q.id}`}
                  className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                        {`Q${idx + 1}`}
                      </span>
                      <h4 className="text-xs font-black text-foreground">
                        聴解 (Listening Question)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFlagQuestion(q.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          flaggedQuestions.has(q.id)
                            ? 'border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Flag
                          size={12}
                          className={flaggedQuestions.has(q.id) ? 'fill-current' : ''}
                        />
                        <span>{flaggedQuestions.has(q.id) ? 'Belgilandi ⭐' : 'Belgilash'}</span>
                      </button>
                      {(() => {
                        const isThisPlaying = isPlaying && playingAudioId === q.id;
                        return (
                          <button
                            onClick={() => handlePlayAudio(q.id, q.audioUrl, q.script)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white shadow transition-all ${
                              isThisPlaying
                                ? 'animate-pulse bg-amber-600 hover:bg-amber-700'
                                : 'bg-rose-500 hover:bg-rose-600'
                            }`}
                          >
                            <Volume2 size={15} />{' '}
                            {isThisPlaying ? "Audio to'xtatish" : 'Audio eshitish'} 🎧
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-serif text-xs font-bold text-foreground">
                      {q.questionText}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;
                        const isOptionDisabled =
                          examMode === 'official_timed' && sealedSections.includes('listening');
                        return (
                          <button
                            key={optIdx}
                            disabled={isOptionDisabled}
                            onClick={() => handleOptionSelect(q, optIdx)}
                            className={`rounded-xl border p-3 text-center text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                            } ${isOptionDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Bottom Actions */}
          <div className="pt-6">
            {examMode === 'official_timed' ? (
              nextSectionSpec ? (
                <div className="space-y-2">
                  <Button
                    onClick={handleAdvanceSectionClick}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700"
                  >
                    <span>
                      {`${currentSectionIndex + 1}-blokni muhrlash va ${nextSectionSpec?.shortLabel}ga o‘tish ⏩`}
                    </span>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    🔒 Eslatma: Keyingi bo‘limga o‘tgach, joriy bo‘lim javoblari qat‘iy muhrlanadi
                    va orqaga qaytib bo‘lmaydi.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitExam}
                  className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700"
                >
                  Imtihonni Yakunlash & Natijani Baholash 🎯
                </Button>
              )
            ) : (
              <Button
                onClick={handleSubmitExam}
                className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-rose-700"
              >
                Imtihonni Yakunlash & Natijani Baholash 🎯
              </Button>
            )}
          </div>

          {/* User-facing Attribution & Legal Disclaimer Footer (Task 7) */}
          {(() => {
            const attr = formatAttribution({
              sourceName: activeExam?.sourceName,
              sourceUrl: activeExam?.sourceUrl,
              author: activeExam?.author,
              licenseType: activeExam?.licenseType,
              isOfficialJlpt: activeExam?.isOfficialJlpt,
            });
            return (
              <div className="rounded-2xl border border-border bg-card/60 p-4 text-xs text-muted-foreground shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${attr.licenseMeta.badgeClass}`}
                    >
                      {attr.licenseMeta.shortLabel}
                    </span>
                    <span className="font-semibold text-foreground">
                      {attr.hasAttribution ? attr.displayTitle : 'Yapon tili o‘quv platformasi'}
                    </span>
                    {activeExam?.sourceUrl && (
                      <a
                        href={activeExam.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
                      >
                        <ExternalLink size={11} /> Asl manba
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {activeExam?.isOfficialJlpt
                      ? '🏛️ Rasmiy format'
                      : '📖 O‘quv-amaliyot materiali'}
                  </span>
                </div>
                <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                  ⚖️ {attr.disclaimer}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* STEP 3: REPORT */}
      {step === 'report' &&
        (isAnalyzing ? (
          <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-border bg-card p-8 py-20 text-center shadow-xl">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent shadow-md" />
            <h3 className="text-base font-extrabold text-foreground">
              🤖 AI Coach imtihon natijangizni va xatolarni tahlil qilmoqda...
            </h3>
            <p className="text-xs text-muted-foreground">
              Xatolaringiz o'rganilmoqda va tavsiyalar tayyorlanmoqda.
            </p>
          </div>
        ) : diagnosticReport ? (
          <>
            <section
              aria-label="Javoblar natijasi"
              className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-semibold">Sinov natijasi</h2>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <p>
                  To‘g‘ri <strong className="block text-xl">{answerCounts.correct}</strong>
                </p>
                <p>
                  Xato <strong className="block text-xl">{answerCounts.wrong}</strong>
                </p>
                <p>
                  Javobsiz <strong className="block text-xl">{answerCounts.skipped}</strong>
                </p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {answerCounts.total} ta savol asosida. 180 ballik ko‘rsatkich — mashq uchun taxmin,
                rasmiy JLPT natijasi emas.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-primary">
                <button onClick={() => navigate('/flashcards?tab=mistakes')}>
                  Xatolarni mashq qilish →
                </button>
                <button onClick={() => navigate('/progress?tab=history')}>
                  Natijalar tarixi →
                </button>
              </div>
            </section>
            {completedTimingModel && (
              <div
                data-testid="jlpt-timing-model-summary"
                className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 text-xs shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-foreground">
                    <Clock size={16} className="text-rose-500" />
                    Ishlatilgan vaqt modeli: {completedTimingModel.label}
                  </div>
                  <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">
                    {completedTimingModel.format}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {completedTimingModel.level} • {completedTimingModel.totalMinutes} daqiqa •{' '}
                  {completedTimingModel.mode === 'official_timed'
                    ? `${completedTimingModel.blockCount} ta mustaqil vaqt bloki`
                    : 'Yagona umumiy taymer, bo‘limlar erkin almashinadi'}
                  {completedTimingModel.level === 'N2' || completedTimingModel.level === 'N1'
                    ? ' • Language Knowledge + Reading bitta blokda'
                    : ''}
                </p>
              </div>
            )}
            <JlptExamResultCard
              report={diagnosticReport}
              level={level}
              mistakes={mistakes}
              onRetry={() => setStep('intro')}
              onBackToHub={() => navigate('/jlpt')}
              onViewCertificate={() => setShowCertificate(true)}
            />

            {/* User-facing Attribution & Legal Disclaimer on Report View (Task 7) */}
            {(() => {
              const attr = formatAttribution({
                sourceName: activeExam?.sourceName,
                sourceUrl: activeExam?.sourceUrl,
                author: activeExam?.author,
                licenseType: activeExam?.licenseType,
                isOfficialJlpt: activeExam?.isOfficialJlpt,
              });
              return (
                <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-border bg-card/60 p-4 text-xs text-muted-foreground shadow-sm 2xl:max-w-5xl 3xl:max-w-6xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${attr.licenseMeta.badgeClass}`}
                      >
                        {attr.licenseMeta.shortLabel}
                      </span>
                      <span className="font-semibold text-foreground">
                        {attr.hasAttribution ? attr.displayTitle : 'Yapon tili o‘quv platformasi'}
                      </span>
                      {activeExam?.sourceUrl && (
                        <a
                          href={activeExam.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
                        >
                          <ExternalLink size={11} /> Manba havolasi
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {activeExam?.isOfficialJlpt
                        ? '🏛️ Rasmiy format'
                        : '📖 O‘quv-amaliyot materiali'}
                    </span>
                  </div>
                  <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                    ⚖️ {attr.disclaimer}
                  </p>
                </div>
              );
            })()}

            <ExamCertificateModal
              isOpen={showCertificate}
              onClose={() => setShowCertificate(false)}
              examTitle={activeExam?.title || `JLPT ${level} Rasmiy Mock Imtihon`}
              examType={`JLPT ${level}`}
              overallScore={
                diagnosticReport.jlptScoreReport
                  ? `${diagnosticReport.jlptScoreReport.totalScore} / 180 (${diagnosticReport.jlptScoreReport.passed ? "O'TDI" : "O'TMADI"})`
                  : `${diagnosticReport.percentage}% (${diagnosticReport.passed ? "O'TDI" : "O'TMADI"})`
              }
              sectionScores={{
                reading:
                  diagnosticReport.jlptScoreReport?.sections?.reading?.score !== undefined
                    ? `${diagnosticReport.jlptScoreReport.sections.reading.score} / 60`
                    : undefined,
                listening:
                  diagnosticReport.jlptScoreReport?.sections?.listening?.score !== undefined
                    ? `${diagnosticReport.jlptScoreReport.sections.listening.score} / 60`
                    : undefined,
                writing:
                  diagnosticReport.jlptScoreReport?.sections?.knowledge?.score !== undefined
                    ? `${diagnosticReport.jlptScoreReport.sections.knowledge.score} / 60`
                    : undefined,
              }}
              userName={
                (user as any)?.user_metadata?.full_name ||
                (user as any)?.user_metadata?.name ||
                (user?.email ? user.email.split('@')[0] : "O'quvchi")
              }
              aiFeedback={diagnosticReport.actionable_recommendation}
            />
          </>
        ) : null)}

      {/* Section Transition & Sealing Modal */}
      {showSectionTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md space-y-5 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={20} />
                <h3 className="text-sm font-extrabold text-foreground">
                  Blokni Muhrlash va Keyingisiga O'tish
                </h3>
              </div>
              <button
                onClick={() => setShowSectionTransitionModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <p className="leading-relaxed">
                Haqiqiy Japan Foundation / JLPT qoidalariga ko'ra,{' '}
                <strong className="text-foreground">{currentSpec?.shortLabel}</strong> bo'limi
                yakunlanadi va javoblaringiz qat'iy{' '}
                <strong className="text-rose-500">muhrlanadi</strong>.
              </p>

              <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-3">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Belgilangan savollar:</span>
                  <span className={unansweredInBlock > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                    {answeredInBlock} / {currentBlockQuestions.length} ta
                  </span>
                </div>
                {unansweredInBlock > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={13} />
                    <span>{unansweredInBlock} ta savolga javob belgilanmagan!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Barcha savollar to'liq belgilandi!</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
                ⚠️ Keyingi bo'limga o'tgach, ushbu bo'limga qaytish va javoblarni o'zgartirish
                imkoni bo'lmaydi.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSectionTransitionModal(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Davom etish (Ortga)
              </button>
              <button
                onClick={handleConfirmAdvanceSection}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white shadow transition-all hover:bg-amber-700"
              >
                Ha, Muhrlab O'tish ⏩
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Remount on account changes so an in-memory exam cannot cross account boundaries. */
export const JlptMockExamPage: React.FC<{ embedded?: boolean }> = (props) => {
  const { user } = useStudyData();
  return <JlptMockExamContent key={user?.id || 'guest'} {...props} />;
};

export default JlptMockExamPage;
