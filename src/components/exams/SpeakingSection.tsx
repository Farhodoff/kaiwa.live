import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { aiEvaluationService, AiEvaluationResult } from '../../services/aiEvaluationService';

interface SpeakingSectionProps {
  examType: 'IELTS' | 'JLPT';
  promptText: string;
  promptId: string;
  sessionId: string;
  onSubmitted?: (result: AiEvaluationResult) => void;
}

export const SpeakingSection: React.FC<SpeakingSectionProps> = ({
  examType,
  promptText,
  promptId: _promptId,
  sessionId: _sessionId,
  onSubmitted,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Brauzeringiz nutqni tanib olishni (Speech Recognition) qo'llab-quvvatlamaydi. Javobingizni matn ko'rinishida yozib kiriting.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = examType === 'JLPT' ? 'ja-JP' : 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Mikrofonni ishga tushirishda xatolik.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const evalResult = await aiEvaluationService.evaluateSpeakingTranscript(
        examType,
        promptText,
        transcript,
      );
      setResult(evalResult);
      if (onSubmitted) {
        onSubmitted(evalResult);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "AI orqali baholashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 duration-300 animate-in fade-in">
      {/* Prompt Card */}
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
            <Mic className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {examType} Speaking Task (Nutq / Kaiwa)
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Mavzu va Savol:</h3>
          </div>
        </div>
        <p className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
          {promptText}
        </p>
      </div>

      {/* Recording Area */}
      {!result ? (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="my-4 flex justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex h-24 w-24 transform items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/30 transition hover:scale-105 hover:from-rose-500 hover:to-amber-400"
              >
                <Mic className="h-10 w-10" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-slate-900 text-white shadow-xl ring-8 ring-rose-500/30"
              >
                <Square className="h-10 w-10 text-rose-500" />
              </button>
            )}
          </div>

          <p className="text-xs font-bold text-slate-400">
            {isRecording
              ? "🔴 Yozib olinmoqda... To'xtatish uchun tugmani bosing"
              : '🎙️ Gapirishni boshlash uchun mikrofonga bosing'}
          </p>

          <div className="mt-4">
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Ovoziz matnga aylantiriladi yoki matn ko'rinishida yozishingiz mumkin..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !transcript.trim()}
              className="gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-3 font-bold text-white shadow-lg shadow-rose-500/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {loading ? 'DeepSeek AI Baholamoqda...' : 'AI Baholashiga Yuborish 🚀'}
            </Button>
          </div>
        </div>
      ) : (
        /* Evaluation Result */
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl duration-300 animate-in fade-in dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Speaking AI Natijasi
                </h4>
                <p className="text-xs text-slate-400">DeepSeek AI Examiner Tahlili</p>
              </div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-amber-500/10 px-6 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-wider text-rose-500">
                <Award className="h-3.5 w-3.5" /> Ball
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {result.score}
              </div>
            </div>
          </div>

          {/* 6 Rubric Criteria Breakdown */}
          {result.criteriaScores && (
            <div className="space-y-3">
              <h5 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">
                <Award className="h-4 w-4 text-amber-500" /> JLPT / Speaking Baholash Mezonlari
                (Rubric):
              </h5>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  {
                    key: 'pronunciation',
                    label: 'Talaffuz & Urg‘u',
                    icon: '🎙️',
                    desc: 'Tovushlar va pitch accent',
                  },
                  {
                    key: 'fluency',
                    label: 'Ravonlik & Tezlik',
                    icon: '🗣️',
                    desc: 'Nutq oqimi va tezligi',
                  },
                  {
                    key: 'grammar',
                    label: 'Grammatik Aniqlik',
                    icon: '⚖️',
                    desc: 'Qoidalar va qo‘shimchalar',
                  },
                  {
                    key: 'vocabulary',
                    label: 'Lug‘at Boyligi',
                    icon: '📚',
                    desc: 'Darajaga mos so‘zlar',
                  },
                  {
                    key: 'naturalness',
                    label: 'Tabiiylik & Nuans',
                    icon: '✨',
                    desc: 'Jonli yaponcha iboralar',
                  },
                  {
                    key: 'hesitation',
                    label: 'Ruxsatli Pauza',
                    icon: '⏱️',
                    desc: 'Duduqlanishsiz ravonlik',
                  },
                ].map((crit) => {
                  const scoreVal = (result.criteriaScores as any)?.[crit.key];
                  return (
                    <div
                      key={crit.key}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-rose-500/30 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{crit.icon}</span> {crit.label}
                        </span>
                        <span className="font-mono text-rose-600 dark:text-rose-400">
                          {typeof scoreVal === 'number' ? scoreVal : '—'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-slate-400">{crit.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h5 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-rose-500" /> Tahlil va Xatolar ustida ishlash:
            </h5>
            <p className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-5 font-sans text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
              {result.feedback}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setResult(null)}
              className="gap-2 rounded-xl font-bold"
            >
              <RefreshCw className="h-4 w-4" /> Qayta Gapirib Ko'rish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
