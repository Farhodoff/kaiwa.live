import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  ArrowRight,
  RotateCcw,
  Zap,
  Play,
  Volume2,
  Square,
} from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { DiagnosticService } from '../services/DiagnosticService';
import {
  DiagnosticMode,
  DiagnosticResult,
  AdaptiveDiagnosticState,
  DiagnosticQuestion,
} from '../types/diagnostic';
import { CurriculumLessonResolver } from '../services/CurriculumLessonResolver';
import { MasteryEngine } from '../services/MasteryEngine';
import { speakJapaneseText, stopAllAudio } from '../utils/audioTts';
import { FuriganaText } from '../components/jlpt/FuriganaText';
import { useSEO } from '../hooks/useSEO';

export const DiagnosticPage: React.FC = () => {
  useSEO({
    title: 'Yapon Tili Darajangizni Aniqlang (JLPT Diagnostika Testi)',
    description:
      "JLPT darajangizni (N5, N4, N3, N2, N1) bir necha daqiqada bepul aniqlang. Kanji, grammatika va eshitish (listening) ko'nikmalarini baholash.",
    canonical: '/diagnostic',
    keywords:
      'yapon tili darajani aniqlash, yapon tili test, JLPT test topshirish, JLPT level test online, kaiwa.live',
  });

  const { targetLevel, user } = useStudyData();
  const effectiveLang = 'ja';
  const { language } = useLanguage();
  const isUz = language !== 'en';
  const navigate = useNavigate();

  const [mode, setMode] = useState<DiagnosticMode>('standard');
  const claimedLevel = targetLevel || 'N3';
  const [step, setStep] = useState<'intro' | 'testing' | 'result'>('intro');

  // Adaptive state
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveDiagnosticState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Result state
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Stop audio when question changes
  useEffect(() => {
    stopAllAudio();
    setIsPlayingAudio(false);
  }, [currentQuestion?.id]);

  const handleToggleAudio = () => {
    if (!currentQuestion) return;
    if (isPlayingAudio) {
      stopAllAudio();
      setIsPlayingAudio(false);
    } else {
      const textToPlay = currentQuestion.audioText || currentQuestion.prompt;
      setIsPlayingAudio(true);
      speakJapaneseText(textToPlay);
      const estSeconds = Math.max(3, Math.ceil(textToPlay.length * 0.22));
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, estSeconds * 1000);
    }
  };

  const recordDiagnosticEvidence = (diagnostic: DiagnosticResult) => {
    const activeUserId = user?.id || 'guest';
    Object.values(diagnostic.skills).forEach((skill) => {
      if (!skill || skill.totalQuestions === 0) return;
      MasteryEngine.recordEvidence(activeUserId, diagnostic.language, {
        id: `diagnostic_${diagnostic.id}_${skill.skill}`,
        skill: skill.skill,
        score: skill.score,
        timestamp: diagnostic.completedAt,
        details: `Diagnostic ${diagnostic.mode}: ${skill.correctCount}/${skill.totalQuestions}`,
        type: 'performance',
      });
    });
  };

  // Check for previous result or existing session
  useEffect(() => {
    const latest = DiagnosticService.getLatestDiagnosticResult(user?.id || 'guest', effectiveLang);
    if (latest) {
      setResult(latest);
    }

    const savedSession = DiagnosticService.getSavedAdaptiveSession(
      user?.id || 'guest',
      effectiveLang,
    );
    if (savedSession && !savedSession.isCompleted && savedSession.currentQuestionId) {
      setHasSavedSession(true);
    }
  }, [effectiveLang, user?.id]);

  const handleStartTest = (isResume = false) => {
    let state: AdaptiveDiagnosticState;
    if (isResume) {
      const saved = DiagnosticService.getSavedAdaptiveSession(user?.id || 'guest', effectiveLang);
      if (saved) {
        state = saved;
      } else {
        state = DiagnosticService.initializeAdaptiveSession(
          user?.id || 'guest',
          effectiveLang,
          mode,
          claimedLevel,
        );
      }
    } else {
      state = DiagnosticService.initializeAdaptiveSession(
        user?.id || 'guest',
        effectiveLang,
        mode,
        claimedLevel,
      );
    }

    setAdaptiveState(state);
    if (state.currentQuestionId) {
      const bank = DiagnosticService.getBankForLanguage(effectiveLang);
      const q = bank.find((item) => item.id === state.currentQuestionId);
      setCurrentQuestion(q || null);
    }
    setSelectedOption(null);
    setStep('testing');
  };

  const handleZeroLevelStart = () => {
    const res = DiagnosticService.getZeroLevelResult(user?.id || 'guest', effectiveLang);
    recordDiagnosticEvidence(res);
    setResult(res);
    setStep('result');
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null || !adaptiveState || !currentQuestion) return;

    stopAllAudio();
    setIsPlayingAudio(false);

    const updatedState = DiagnosticService.processAdaptiveAnswer(
      adaptiveState,
      currentQuestion.id,
      selectedOption,
    );

    setAdaptiveState(updatedState);

    if (updatedState.isCompleted) {
      // Assessment Finished!
      const evalResult = DiagnosticService.evaluateAdaptiveSession(updatedState);
      recordDiagnosticEvidence(evalResult);
      setResult(evalResult);
      setStep('result');
    } else if (updatedState.currentQuestionId) {
      const bank = DiagnosticService.getBankForLanguage(effectiveLang);
      const nextQ = bank.find((item) => item.id === updatedState.currentQuestionId);
      setCurrentQuestion(nextQ || null);
      setSelectedOption(null);
    }
  };

  const handleStartRecommendedLesson = () => {
    if (!result) return;
    const resolved = CurriculumLessonResolver.resolveLesson(
      result.recommendedFirstLessonId,
      effectiveLang,
    );
    navigate(resolved.route);
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy':
        return isUz ? '🟢 Oson' : '🟢 Easy';
      case 'medium':
        return isUz ? "🟡 O'rtacha" : '🟡 Medium';
      case 'hard':
        return isUz ? '🔴 Murakkab' : '🔴 Hard';
      default:
        return diff;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 duration-200 animate-in fade-in md:p-8">
      {/* Step 1: Intro & Mode Selection */}
      {step === 'intro' && (
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇯🇵</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                JLPT Adaptiv Diagnostika
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground md:text-3xl">
              {isUz ? 'Haqiqiy Bilim Darajangizni Aniqlang' : 'Discover Your True Japanese Level'}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isUz
                ? 'Adaptiv dvigatel har bir javobingizga qarab savollar qiyinligini moslashtiradi va qisqa vaqt ichida aniq bilim darajangizni hisoblab beradi.'
                : 'Our real-time adaptive engine adjusts question difficulty based on your answers to rapidly gauge your true JLPT level.'}
            </p>
          </div>

          {/* Resume Banner if available */}
          {hasSavedSession && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:flex-row">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {isUz ? 'Tugallanmagan diagnostik test mavjud' : 'Unfinished Assessment Found'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isUz
                      ? "Avval to'xtagan joyingizdan davom ettirishingiz mumkin."
                      : 'You can pick up right where you left off.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStartTest(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-md transition-all hover:bg-primary/90"
              >
                <Play size={14} />
                <span>{isUz ? 'Davom Ettirish' : 'Resume Test'}</span>
              </button>
            </div>
          )}

          {/* Quick Zero-Level Option */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-md sm:flex-row">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="flex items-center justify-center gap-2 text-base font-bold text-foreground sm:justify-start">
                <span>🌱</span> {isUz ? 'Mutlaqo Yangi Boshlovchimisiz?' : 'Complete Beginner?'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isUz
                  ? "Test topshirmasdan to'g'ridan-to'g'ri boshlang'ich N5 poydevor darslaridan boshlang."
                  : 'Skip testing and start directly from foundational N5 lessons.'}
              </p>
            </div>
            <button
              onClick={handleZeroLevelStart}
              className="shrink-0 rounded-2xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
            >
              {isUz ? 'Nol Darajadan Boshlash' : 'Start from Zero'}
            </button>
          </div>

          {/* Mode Selector */}
          <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Clock size={18} className="text-primary" />
              {isUz ? 'Test Rejimini Tanlang' : 'Choose Assessment Mode'}
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => setMode('quick')}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-4 text-left transition-all ${
                  mode === 'quick'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">⚡ {isUz ? 'Tezkor' : 'Quick'}</span>
                  <span className="text-xs text-muted-foreground">6 savol</span>
                </div>
                <p className="text-xs text-muted-foreground">~10 daqiqa, tezkor yo'naltirish.</p>
              </button>

              <button
                onClick={() => setMode('standard')}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-4 text-left transition-all ${
                  mode === 'standard'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">🎯 {isUz ? 'Standart' : 'Standard'}</span>
                  <span className="text-xs font-bold text-primary">Tavsiya</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ~12 savol, muvozanatli adaptiv tahlil.
                </p>
              </button>

              <button
                onClick={() => setMode('deep')}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-4 text-left transition-all ${
                  mode === 'deep'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">🧠 {isUz ? 'Chuqur' : 'Deep'}</span>
                  <span className="text-xs text-muted-foreground">20 savol</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ~30 daqiqa, maksimal aniqlikdagi diagnostika.
                </p>
              </button>
            </div>

            <button
              onClick={() => handleStartTest(false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              <span>🚀 {isUz ? 'Adaptiv Diagnostikani Boshlash' : 'Start Adaptive Placement'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Testing Phase */}
      {step === 'testing' && adaptiveState && currentQuestion && (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
          {/* Header Progress */}
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-primary">
                {currentQuestion.skill}
              </span>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                {currentQuestion.level}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {getDifficultyLabel(adaptiveState.currentDifficulty)}
              </span>
            </div>
            <span className="text-xs font-black text-foreground">
              {adaptiveState.answeredCount + 1} / {adaptiveState.maxQuestions}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold leading-relaxed text-foreground md:text-xl">
              <FuriganaText text={currentQuestion.prompt} />
            </h3>

            {/* Listening Choukai Audio Player */}
            {(currentQuestion.skill === 'listening' || currentQuestion.audioText) && (
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 duration-200 animate-in fade-in sm:flex-row">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isPlayingAudio
                        ? 'animate-pulse bg-primary text-primary-foreground shadow-md'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {isUz ? 'Audio Tinglash (Choukai)' : 'Audio Listening (Choukai)'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isUz
                        ? 'Savol audiosini eshitish uchun tugmani bosing'
                        : 'Click to listen to the dialogue audio'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  {isPlayingAudio ? (
                    <>
                      <Square size={13} className="fill-current" />
                      <span>{isUz ? "To'xtatish" : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-current" />
                      <span>{isUz ? 'Eshitish' : 'Play Audio'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'scale-[1.01] border-primary bg-primary text-primary-foreground shadow-md'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-bold ${
                          isSelected
                            ? 'border-white/40 bg-white/20'
                            : 'border-border bg-secondary text-muted-foreground'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm font-semibold">
                        <FuriganaText text={opt} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap size={12} className="text-primary" />
              {isUz ? 'Dinamik adaptiv test' : 'Dynamic adaptive evaluation'}
            </span>

            <button
              onClick={handleNextQuestion}
              disabled={selectedOption === null}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black transition-all ${
                selectedOption !== null
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                  : 'cursor-not-allowed bg-secondary text-muted-foreground opacity-50'
              }`}
            >
              <span>
                {adaptiveState.answeredCount + 1 >= adaptiveState.maxQuestions
                  ? isUz
                    ? "Natijani Ko'rish"
                    : 'View Results'
                  : isUz
                    ? 'Keyingi Savol'
                    : 'Next Question'}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result Dashboard */}
      {step === 'result' && result && (
        <div className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                  {isUz ? 'Adaptiv Diagnostika Natijasi' : 'Adaptive Placement Result'}
                </span>
                <h2 className="pt-1 text-2xl font-black text-foreground md:text-3xl">
                  {isUz ? 'Tavsiya Etilgan Bosqich:' : 'Recommended Starting Level:'}{' '}
                  {result.recommendedStartLevel}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isUz
                    ? `Aniqlik darajasi: ${result.overallScore}%. Tizim ishonchi: ${result.overallConfidence}%.`
                    : `Diagnostic accuracy: ${result.overallScore}%. Assessment confidence: ${result.overallConfidence}%.`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-4 px-6">
                <Award size={28} className="text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {isUz ? 'Umumiy Ball' : 'Overall Score'}
                  </div>
                  <div className="text-xl font-black text-foreground">{result.overallScore}%</div>
                </div>
              </div>
            </div>

            {/* Explanation Text */}
            {result.explanation && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                {result.explanation}
              </div>
            )}

            {/* Skill Radar / Bars */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Compass size={14} />
                {isUz ? "Ko'nikmalar Kesimida Baholash" : 'Skill Profile Breakdown'}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.values(result.skills).map(
                  (sk) =>
                    sk && (
                      <div
                        key={sk.skill}
                        className="space-y-2 rounded-2xl border border-border bg-secondary/30 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-foreground">
                            {sk.skill}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              sk.status === 'strong'
                                ? 'text-emerald-500'
                                : sk.status === 'weak'
                                  ? 'text-rose-500'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {sk.score}% ({sk.estimatedLevel})
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sk.status === 'strong'
                                ? 'bg-emerald-500'
                                : sk.status === 'weak'
                                  ? 'bg-rose-500'
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${sk.score}%` }}
                          />
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {result.strengths.length > 0 && (
                <div className="space-y-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <CheckCircle2 size={14} /> {isUz ? "Kuchli Ko'nikmalar" : 'Key Strengths'}
                  </div>
                  <div className="text-xs text-muted-foreground">{result.strengths.join(', ')}</div>
                </div>
              )}

              {result.weaknesses.length > 0 && (
                <div className="space-y-1 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <div className="flex items-center gap-1 text-xs font-bold text-rose-500">
                    <AlertTriangle size={14} /> {isUz ? 'Mustahkamlash Kerak' : 'Focus Areas'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.weaknesses.join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Call to Action */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row">
              <button
                onClick={() => setStep('intro')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground sm:w-auto"
              >
                <RotateCcw size={14} />
                <span>{isUz ? 'Qayta Test Topshirish' : 'Retake Assessment'}</span>
              </button>

              <button
                onClick={handleStartRecommendedLesson}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-xs font-black text-primary-foreground shadow-lg transition-all hover:bg-primary/90 sm:w-auto"
              >
                <span>
                  🚀{' '}
                  {isUz
                    ? `Darsni Boshlash (${result.recommendedStartLevel})`
                    : `Start Learning (${result.recommendedStartLevel})`}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;
