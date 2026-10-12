import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Award,
  Volume2,
  BookOpen,
  CheckCircle2,
  FileText,
  Database,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldAlert,
  Timer,
  X,
  LayoutGrid,
  Flag,
} from 'lucide-react';
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
import {
  MistakeVaultService,
  MistakeCategory,
  MistakeLevel,
} from '../services/MistakeVaultService';
import {
  JLPT_SECTION_SPECS,
  getSectionDurationSeconds,
  getOrderedSections,
  getSectionIndex,
  getNextSectionKey,
  JlptExamMode,
  SectionKey,
} from '../utils/jlptExamTiming';
import { resolveAudioUrl } from '../utils/audioUrl';
import { speakJapaneseText, stopAllAudio } from '../utils/audioTts';

const DRAFT_EXAM_STORAGE_KEY = 'jlpt_mock_exam_draft_v1';

export const JlptMockExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlLevel = searchParams.get('level')?.toUpperCase();
  const initialLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' =
    urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel) ? (urlLevel as any) : 'N5';

  const { user, awardXP } = useStudyData();
  const { language } = useLanguage();
  const [level, setLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(initialLevel);
  const [step, setStep] = useState<'intro' | 'exam' | 'report'>('intro');
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  // Available Exams from Supabase DB
  const [availableExams, setAvailableExams] = useState<ExamListItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState<boolean>(true);
  const [activeExam, setActiveExam] = useState<NormalizedExam | null>(null);
  const [isStartingExam, setIsStartingExam] = useState<boolean>(false);

  // Official Sectioned Exam Mode State
  const [examMode, setExamMode] = useState<JlptExamMode>('official_timed');
  const [useFullOfficialTime, setUseFullOfficialTime] = useState<boolean>(false);
  const [sealedSections, setSealedSections] = useState<SectionKey[]>([]);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number>(1200);
  const [sectionTotalDuration, setSectionTotalDuration] = useState<number>(1200);
  const [showSectionTransitionModal, setShowSectionTransitionModal] = useState<boolean>(false);
  const examStartTimeRef = useRef<number>(Date.now());

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

  // Fetch published exams for current level from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchExams = async () => {
      setLoadingExams(true);
      try {
        const list = await ExamService.getPublishedJlptExams(level);
        if (isMounted) {
          setAvailableExams(list);
          const urlExamId = searchParams.get('examId');
          if (urlExamId && list.some((e) => e.id === urlExamId)) {
            setSelectedExamId(urlExamId);
          } else if (list.length > 0) {
            setSelectedExamId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('JlptMockExamPage: Error fetching exams:', err);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Diagnostic Report State
  const [diagnosticReport, setDiagnosticReport] = useState<ExamDiagnosticReport | null>(null);
  const [mistakes, setMistakes] = useState<ExamQuestionAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Questions from active loaded exam (or fallback)
  const levelQuestions: ExamQuestion[] =
    activeExam?.questions || JLPT_MOCK_EXAM_DATA[level] || JLPT_MOCK_EXAM_DATA['N5'];
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

  // Timer Effect (handles both official sectioned timer and practice single timer)
  useEffect(() => {
    let timer: any;
    if (isTimerRunning) {
      if (examMode === 'official_timed') {
        if (sectionTimeLeft > 0) {
          timer = setInterval(() => setSectionTimeLeft((prev) => prev - 1), 1000);
        } else if (sectionTimeLeft === 0) {
          handleSectionTimeExpired();
        }
      } else {
        if (timeLeft > 0) {
          timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
          handleSubmitExam();
        }
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, examMode, sectionTimeLeft, timeLeft]);

  const handleSectionTimeExpired = () => {
    if (audioRef.current) audioRef.current.pause();
    stopAllAudio();
    setIsPlaying(false);
    setPlayingAudioId(null);

    const nextSec = getNextSectionKey(level, activeSection);
    if (nextSec) {
      setSealedSections((prev) => (prev.includes(activeSection) ? prev : [...prev, activeSection]));
      setActiveSection(nextSec);
      const nextDuration = getSectionDurationSeconds(level, nextSec, useFullOfficialTime);
      setSectionTimeLeft(nextDuration);
      setSectionTotalDuration(nextDuration);
      const nextSpec = JLPT_SECTION_SPECS[level].find((s) => s.section === nextSec);
      toast({
        title: "⏰ Bo'lim vaqti tugadi!",
        description: `Oldingi bo'lim muhrlandi. Yangi bo'lim boshlandi: ${nextSpec?.titleUz || nextSec}`,
      });
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {}
      }
    } else {
      toast({
        title: '⏰ Rasmiy imtihon vaqti yakunlandi!',
        description: "Barcha bo'limlar topshirildi. Natijangiz hisoblanmoqda...",
      });
      handleSubmitExam();
    }
  };

  const handleAdvanceSectionClick = () => {
    const nextSec = getNextSectionKey(level, activeSection);
    if (!nextSec) {
      handleSubmitExam();
      return;
    }
    setShowSectionTransitionModal(true);
  };

  const handleConfirmAdvanceSection = () => {
    setShowSectionTransitionModal(false);
    if (audioRef.current) audioRef.current.pause();
    stopAllAudio();
    setIsPlaying(false);
    setPlayingAudioId(null);

    const nextSec = getNextSectionKey(level, activeSection);
    if (nextSec) {
      setSealedSections((prev) => (prev.includes(activeSection) ? prev : [...prev, activeSection]));
      setActiveSection(nextSec);
      const nextDuration = getSectionDurationSeconds(level, nextSec, useFullOfficialTime);
      setSectionTimeLeft(nextDuration);
      setSectionTotalDuration(nextDuration);
      const nextSpec = JLPT_SECTION_SPECS[level].find((s) => s.section === nextSec);
      toast({
        title: "✅ Bo'lim muhrlandi!",
        description: `${nextSpec?.shortLabel || nextSec} bo'limiga o'tildi. Orqaga qaytib bo'lmaydi.`,
      });
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {}
      }
    } else {
      handleSubmitExam();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-save active exam draft to localStorage with throttling
  // Answers, section changes, and transitions save immediately; timer updates save every 15s or on window exit
  const latestDraftRef = useRef({
    level,
    selectedExamId,
    userAnswers,
    activeSection,
    sealedSections,
    examMode,
    sectionTimeLeft,
    timeLeft,
  });

  useEffect(() => {
    latestDraftRef.current = {
      level,
      selectedExamId,
      userAnswers,
      activeSection,
      sealedSections,
      examMode,
      sectionTimeLeft,
      timeLeft,
    };
  }, [
    level,
    selectedExamId,
    userAnswers,
    activeSection,
    sealedSections,
    examMode,
    sectionTimeLeft,
    timeLeft,
  ]);

  const persistDraft = () => {
    const cur = latestDraftRef.current;
    if (step === 'exam' && Object.keys(cur.userAnswers).length > 0) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            DRAFT_EXAM_STORAGE_KEY,
            JSON.stringify({
              level: cur.level,
              examId: cur.selectedExamId,
              userAnswers: cur.userAnswers,
              activeSection: cur.activeSection,
              sealedSections: cur.sealedSections,
              examMode: cur.examMode,
              sectionTimeLeft: cur.sectionTimeLeft,
              timeLeft: cur.timeLeft,
              timestamp: Date.now(),
            }),
          );
        }
      } catch {}
    }
  };

  // Immediate save on user interaction or section transition
  useEffect(() => {
    persistDraft();
  }, [step, level, selectedExamId, userAnswers, activeSection, sealedSections, examMode]);

  // Periodic save for timer updates (every 15 seconds) to avoid writing to disk every second
  useEffect(() => {
    if (step === 'exam' && (sectionTimeLeft % 15 === 0 || timeLeft % 15 === 0)) {
      persistDraft();
    }
  }, [step, sectionTimeLeft, timeLeft]);

  // Persist on beforeunload or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      persistDraft();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step]);

  const handleStartExam = async () => {
    setIsStartingExam(true);
    try {
      const examData = await ExamService.getExamWithQuestions(
        selectedExamId || `builtin_${level.toLowerCase()}`,
        level,
      );
      setActiveExam(examData);

      // Check for valid existing draft for this level
      let restoredAnswers: { [qId: number]: number } = {};
      let restoredActiveSection: 'knowledge' | 'reading' | 'listening' | null = null;
      let restoredSealedSections: SectionKey[] | null = null;
      let restoredSectionTime: number | null = null;
      let restoredTimeLeft: number | null = null;

      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(DRAFT_EXAM_STORAGE_KEY);
          if (raw) {
            const draft = JSON.parse(raw);
            const isFresh = Date.now() - (draft.timestamp || 0) < 4 * 60 * 60 * 1000;
            if (
              isFresh &&
              draft.level === level &&
              draft.userAnswers &&
              Object.keys(draft.userAnswers).length > 0
            ) {
              restoredAnswers = draft.userAnswers;
              if (draft.activeSection) restoredActiveSection = draft.activeSection;
              if (Array.isArray(draft.sealedSections))
                restoredSealedSections = draft.sealedSections;
              if (typeof draft.sectionTimeLeft === 'number' && draft.sectionTimeLeft > 0) {
                restoredSectionTime = draft.sectionTimeLeft;
              }
              if (typeof draft.timeLeft === 'number' && draft.timeLeft > 0) {
                restoredTimeLeft = draft.timeLeft;
              }
              toast({
                title: 'Qoralama tiklandi',
                description: `${Object.keys(restoredAnswers).length} ta belgilangan javobingiz muvaffaqiyatli tiklandi.`,
              });
            }
          }
        }
      } catch {}

      setUserAnswers(restoredAnswers);
      setMistakes([]);
      setStep('exam');
      examStartTimeRef.current = Date.now();

      const ordered = getOrderedSections(level);
      const firstSec = ordered[0].section;
      setActiveSection(restoredActiveSection || firstSec);
      setSealedSections(restoredSealedSections || []);

      if (examMode === 'official_timed') {
        const duration =
          restoredSectionTime ??
          getSectionDurationSeconds(level, restoredActiveSection || firstSec, useFullOfficialTime);
        setSectionTimeLeft(duration);
        setSectionTotalDuration(
          getSectionDurationSeconds(level, restoredActiveSection || firstSec, useFullOfficialTime),
        );
      } else {
        setTimeLeft(restoredTimeLeft ?? examData.timeLimitSeconds);
      }
      setIsTimerRunning(true);
    } catch (err) {
      console.error('Failed to load exam:', err);
    } finally {
      setIsStartingExam(false);
    }
  };

  const handleOptionSelect = (qId: number, optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // Listening Audio with Native Audio Player and Seamless Fallback
  const handlePlayAudio = (qId: number, url?: string, _script?: string) => {
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

    if (url && url.trim() !== '' && !url.includes('soundhelix.com')) {
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
            console.warn('Audio play failed, falling back to speech synthesis:', err);
            if (_script && _script.trim()) {
              setIsPlaying(true);
              setPlayingAudioId(qId);
              speakJapaneseText(_script);
              toast({
                title: 'AI Ovozli Fallback',
                description: 'Audio trek yuklanmadi, matn sinxron o‘qib berilmoqda.',
              });
            } else {
              setIsPlaying(false);
              setPlayingAudioId(null);
              toast({
                title: 'Audio xatosi',
                description: 'Ushbu audio trekni ijro etib bo‘lmadi.',
                variant: 'destructive',
              });
            }
          });
        audio.onended = () => {
          setIsPlaying(false);
          setPlayingAudioId(null);
        };
        audio.onerror = () => {
          console.warn('Audio load error, falling back to speech synthesis');
          if (_script && _script.trim()) {
            setIsPlaying(true);
            setPlayingAudioId(qId);
            speakJapaneseText(_script);
            toast({
              title: 'AI Ovozli Fallback',
              description: 'Audio trek yuklanmadi, matn sinxron o‘qib berilmoqda.',
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
    } else if (_script && _script.trim()) {
      setIsPlaying(true);
      setPlayingAudioId(qId);
      speakJapaneseText(_script);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopAllAudio();
    setIsPlaying(false);
    setPlayingAudioId(null);
    setIsTimerRunning(false);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DRAFT_EXAM_STORAGE_KEY);
      }
    } catch {}
    setStep('report');
    setIsAnalyzing(true);

    const durSecs = Math.max(10, Math.round((Date.now() - examStartTimeRef.current) / 1000));

    const questionAnswers: ExamQuestionAnswer[] = levelQuestions.map((q) => {
      const userIdx = userAnswers[q.id];
      const isCorr = userIdx === q.correctAnswer;
      return {
        questionText: q.questionText,
        section: q.section,
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

    // Calculate official JLPT score report with sectional cutoffs
    const jlptScoreReport = calculateJlptScore(level, levelQuestions, userAnswers);

    try {
      const report = await evaluateMockExamSession(
        `JLPT ${level}`,
        questionAnswers,
        durSecs,
        jlptScoreReport,
      );
      setDiagnosticReport(report);

      await HistoryService.saveMockExam({
        examType: 'jlpt',
        level: level,
        score: jlptScoreReport.totalScore,
        totalQuestions: levelQuestions.length,
      });

      // Award XP for completing a full mock exam
      if (awardXP) {
        awardXP(100).catch(() => {});
      }
      try {
        DailyQuestService.recordMockScore(
          user?.id,
          Math.min(100, Math.round((jlptScoreReport.totalScore / 180) * 100)),
        );
      } catch {}

      // Register evidence for JLPT Level Progression (All 4 pillars)
      const activeUserId = user?.id || 'guest';
      const diagPillars = report.diagnosticAnalysis?.pillars;

      // 1. Reading (Dokkai) evidence
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_mock_${level}_reading_${Date.now()}`,
        skill: 'reading',
        score: jlptScoreReport.sections.reading?.percentage ?? 50,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Mock Dokkai: ${jlptScoreReport.sections.reading?.score}/60 ball (${jlptScoreReport.sections.reading?.percentage}%)`,
        type: 'performance',
      });

      // 2. Listening (Choukai) evidence
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_mock_${level}_listening_${Date.now()}`,
        skill: 'listening',
        score: jlptScoreReport.sections.listening?.percentage ?? 50,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Mock Choukai: ${jlptScoreReport.sections.listening?.score}/60 ball (${jlptScoreReport.sections.listening?.percentage}%)`,
        type: 'performance',
      });

      // 3. Grammar evidence
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_mock_${level}_grammar_${Date.now()}`,
        skill: 'grammar',
        score:
          diagPillars?.grammar.accuracyPercentage ??
          jlptScoreReport.sections.knowledge?.percentage ??
          50,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Mock Grammar: ${diagPillars?.grammar.accuracyPercentage ?? jlptScoreReport.sections.knowledge?.percentage}% aniqlik`,
        type: 'performance',
      });

      // 4. Vocabulary / Kanji evidence
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_mock_${level}_vocab_${Date.now()}`,
        skill: 'vocabulary',
        score:
          diagPillars?.kanji_vocab.accuracyPercentage ??
          jlptScoreReport.sections.knowledge?.percentage ??
          50,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Mock Kanji & Vocab: ${diagPillars?.kanji_vocab.accuracyPercentage ?? jlptScoreReport.sections.knowledge?.percentage}% aniqlik`,
        type: 'performance',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const orderedSections = getOrderedSections(level);
  const currentSectionIndex = getSectionIndex(level, activeSection);
  const currentSpec = JLPT_SECTION_SPECS[level].find((s) => s.section === activeSection);
  const nextSectionKey = getNextSectionKey(level, activeSection);
  const nextSectionSpec = nextSectionKey
    ? JLPT_SECTION_SPECS[level].find((s) => s.section === nextSectionKey)
    : null;

  const activeSectionQuestions =
    activeSection === 'knowledge'
      ? knowledgeQuestions
      : activeSection === 'reading'
        ? readingQuestions
        : listeningQuestions;
  const answeredInSection = activeSectionQuestions.filter(
    (q) => userAnswers[q.id] !== undefined,
  ).length;
  const totalInSection = activeSectionQuestions.length;
  const unansweredInSection = totalInSection - answeredInSection;

  const isWarningTime =
    examMode === 'official_timed'
      ? sectionTimeLeft <= 300 && sectionTimeLeft > 60
      : timeLeft <= 300 && timeLeft > 60;
  const isCriticalTime = examMode === 'official_timed' ? sectionTimeLeft <= 60 : timeLeft <= 60;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:p-8 md:pb-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
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

      {/* STEP 1: INTRO */}
      {step === 'intro' && (
        <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-md">
            <Award size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">
              {language === 'ja' ? 'JLPT ほんばん もぎしけん' : 'JLPT Full Simulation Exam'}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {language === 'ja'
                ? 'げんごちしき（たんご・ぶんぽう）、どっかい、ちょうかいの ほんばん もぎしけん。180てん まんてん。'
                : "Lug'at/Grammatika (言語知識), O'qish (読解) va Tinglash (聴解) bo'limlaridan iborat rasmiy imtihon simulyatori. 180 ballik reyting tizimi."}
            </p>
          </div>

          {/* Level Selector */}
          <div className="grid grid-cols-5 gap-2">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`rounded-xl border py-3 text-xs font-black transition-all ${
                  level === lvl
                    ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Available Mock Exams Selector */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {language === 'ja' ? 'もぎテストを えらぶ' : 'Mavjud Imtihonni Tanlang:'}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {availableExams.length} ta test mavjud
              </span>
            </div>

            {loadingExams ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 size={16} className="animate-spin text-rose-500" />
                <span>Imtihonlar bazadan yuklanmoqda...</span>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {availableExams.map((ex) => {
                  const isSelected = selectedExamId === ex.id;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExamId(ex.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 shadow-md ring-1 ring-rose-500/30'
                          : 'border-border bg-muted/20 hover:border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{ex.title}</span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <Database size={10} />{' '}
                              {ex.id.startsWith('builtin_') ? 'Oflayn Baza' : 'Rasmiy DB'}
                            </span>
                          </div>
                          {ex.description && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {ex.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-border'
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={13} />}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText size={12} className="text-rose-500" /> 3 bo'lim (Goi, Dokkai,
                          Choukai)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-rose-500" /> 180 ballik rasmiy format
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejimni tanlash (Exam Mode Selection) */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {language === 'ja' ? 'しけんモードを えらぶ' : 'Imtihon Rejimini Tanlang:'}
              </span>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                {examMode === 'official_timed' ? '🏛️ Rasmiy Rejim' : '⚡ Tezkor Mashq'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Official Sectioned Timed Mode */}
              <div
                onClick={() => setExamMode('official_timed')}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  examMode === 'official_timed'
                    ? 'border-rose-500 bg-rose-500/10 shadow-md ring-1 ring-rose-500/30'
                    : 'border-border bg-muted/20 hover:border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <h4 className="text-xs font-extrabold text-foreground">
                      Rasmiy Bo'limli Taymer
                    </h4>
                  </div>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      examMode === 'official_timed'
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-border'
                    }`}
                  >
                    {examMode === 'official_timed' && <CheckCircle2 size={11} />}
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Japan Foundation qoidalari: har bir bo'limga alohida taymer, o'tilgan bo'limlar
                  muhrlanadi, qaytish taqiqlanadi.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                    🔒 Muhrlash tizimi
                  </span>
                  <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                    ⏱️ Alohida taymer
                  </span>
                </div>
              </div>

              {/* Practice Mode */}
              <div
                onClick={() => setExamMode('practice')}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  examMode === 'practice'
                    ? 'border-rose-500 bg-rose-500/10 shadow-md ring-1 ring-rose-500/30'
                    : 'border-border bg-muted/20 hover:border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <h4 className="text-xs font-extrabold text-foreground">Erkin Mashq Rejimi</h4>
                  </div>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      examMode === 'practice'
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-border'
                    }`}
                  >
                    {examMode === 'practice' && <CheckCircle2 size={11} />}
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Bo'limlar o'rtasida erkin harakatlanish, yagona umumiy taymer va istalgan savolga
                  qayta javob berish imkoniyati.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-600 dark:text-sky-400">
                    🔄 Erkin navigatsiya
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    ⏳ Yagona taymer
                  </span>
                </div>
              </div>
            </div>

            {/* If official_timed is selected, show timing configuration option */}
            {examMode === 'official_timed' && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">Vaqt formati</div>
                  <div className="text-[11px] text-muted-foreground">
                    {useFullOfficialTime
                      ? `To'liq rasmiy JLPT vaqti (${JLPT_SECTION_SPECS[level].reduce((acc, s) => acc + s.officialMinutes, 0)} daqiqa)`
                      : `Moslashtirilgan sinov vaqti (${Math.round(JLPT_SECTION_SPECS[level].reduce((acc, s) => acc + s.simulationSeconds, 0) / 60)} daqiqa)`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseFullOfficialTime((prev) => !prev)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    useFullOfficialTime
                      ? 'bg-rose-600 text-white'
                      : 'border border-border bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {useFullOfficialTime ? 'To‘liq Rasmiy' : 'Tezkor Sinov'}
                </button>
              </div>
            )}
          </div>

          <Button
            disabled={isStartingExam}
            onClick={handleStartExam}
            className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-50"
          >
            {isStartingExam ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Imtihon tayyorlanmoqda...
              </span>
            ) : language === 'ja' ? (
              'もぎしけんを スタート 🚀'
            ) : (
              'Mock Imtihonni Boshlash 🚀'
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
                    Javoblar: <strong className="text-foreground">{answeredInSection}</strong> /{' '}
                    {totalInSection}
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
                  const isSealed = sealedSections.includes(sec.section);
                  const isActive = activeSection === sec.section;

                  return (
                    <div
                      key={sec.section}
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
            {orderedSections.map((sec) => {
              const isSealed = sealedSections.includes(sec.section);
              const isActive = activeSection === sec.section;
              const isUpcoming = examMode === 'official_timed' && !isSealed && !isActive;

              return (
                <button
                  key={sec.section}
                  onClick={() => {
                    if (examMode === 'official_timed') {
                      if (isUpcoming) {
                        toast({
                          title: "🔒 Bo'lim qulflangan",
                          description:
                            "Japan Foundation qoidalariga ko'ra, oldingi bo'lim yakunlangach ochiladi.",
                        });
                        return;
                      }
                      if (isSealed) {
                        toast({
                          title: "🔒 Bo'lim muhrlangan",
                          description: "Ushbu bo'lim yakunlangan, javoblar qat'iy saqlangan.",
                        });
                        return;
                      }
                    }
                    setActiveSection(sec.section);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 font-bold transition-all ${
                    isActive
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : isSealed
                        ? 'border-transparent text-emerald-600 dark:text-emerald-400'
                        : isUpcoming
                          ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                          : 'border-transparent text-muted-foreground'
                  }`}
                >
                  {isSealed ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : isUpcoming ? (
                    <Lock size={14} />
                  ) : sec.section === 'knowledge' ? (
                    <FileText size={14} />
                  ) : sec.section === 'reading' ? (
                    <BookOpen size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  <span>{sec.titleJa}</span>
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
                  Savollar Matritsasi ({answeredInSection} / {totalInSection} javob berildi)
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
                    onClick={() => scrollToQuestion(q.id)}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-black transition-all hover:scale-105 active:scale-95 sm:h-9 sm:w-9 ${
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
                          onClick={() => handleOptionSelect(q.id, optIdx)}
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
                            onClick={() => handleOptionSelect(q.id, optIdx)}
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
                            onClick={() => handleOptionSelect(q.id, optIdx)}
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
              nextSectionKey ? (
                <div className="space-y-2">
                  <Button
                    onClick={handleAdvanceSectionClick}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700"
                  >
                    <span>
                      {`${currentSectionIndex + 1}-bo‘limni muhrlash va ${nextSectionSpec?.shortLabel}ga o‘tish ⏩`}
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
            <JlptExamResultCard
              report={diagnosticReport}
              level={level}
              mistakes={mistakes}
              onRetry={() => setStep('intro')}
              onBackToHub={() => navigate('/jlpt')}
              onViewCertificate={() => setShowCertificate(true)}
            />

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
                  Bo'limni Muhrlash va Keyingisiga O'tish
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
                  <span className={unansweredInSection > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                    {answeredInSection} / {totalInSection} ta
                  </span>
                </div>
                {unansweredInSection > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={13} />
                    <span>{unansweredInSection} ta savolga javob belgilanmagan!</span>
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

export default JlptMockExamPage;
