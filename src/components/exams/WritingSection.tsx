import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PenTool,
  Award,
} from 'lucide-react';
import { aiEvaluationService, AiEvaluationResult } from '../../services/aiEvaluationService';
import { ErrorNotificationService } from '../../services/ErrorNotificationService';

interface WritingSectionProps {
  examType: 'IELTS' | 'JLPT';
  promptText: string;
  promptId: string;
  sessionId: string;
  onSubmitted?: (result: AiEvaluationResult) => void;
}

export const WritingSection: React.FC<WritingSectionProps> = ({
  examType,
  promptText,
  promptId: _promptId,
  sessionId: _sessionId,
  onSubmitted,
}) => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isJapanese = examType === 'JLPT';
  const charCount = response.replace(/\s+/g, '').length;
  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
  const countLabel = isJapanese
    ? `Belgilar soni: ${charCount} ta (文字数)`
    : `So'zlar soni: ${wordCount}`;
  const isContentEmpty = isJapanese ? charCount === 0 : wordCount === 0;

  const handleSubmit = async () => {
    if (!response.trim() || isContentEmpty) return;
    setLoading(true);
    setError(null);

    try {
      const evalResult = await aiEvaluationService.evaluateWriting(examType, promptText, response);
      setResult(evalResult);
      if (onSubmitted) {
        onSubmitted(evalResult);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.message || "AI orqali baholashda xatolik yuz berdi. Qayta urinib ko'ring.";
      setError(errMsg);
      ErrorNotificationService.notifyError({
        title: "Writing topshirig'ini baholashda xatolik",
        message: errMsg,
        error: err,
        retryAction: () => handleSubmit(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 duration-300 animate-in fade-in">
      {/* Prompt Card */}
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
            <PenTool className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {examType} Writing Task (Insho / Sakubun)
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mavzu va Topshiriq:
            </h3>
          </div>
        </div>
        <p className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
          {promptText}
        </p>
      </div>

      {/* Editor & Results Area */}
      {!result ? (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <textarea
              rows={12}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={
                isJapanese
                  ? 'Inshongizni yapon tilida shu yerga yozing (masalan: 私は日本語を勉強しています...)...'
                  : 'Javobingizni shu yerga yozing...'
              }
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
            <div className="absolute bottom-4 right-4 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {countLabel}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || isContentEmpty}
              className="transform gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-purple-500"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {loading ? 'DeepSeek AI Tekshirmoqda...' : 'AI Tekshiruviga Yuborish 🚀'}
            </Button>
          </div>
        </div>
      ) : (
        /* AI Evaluation Result Card */
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl duration-300 animate-in fade-in dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  AI Tekshiruv Natijasi
                </h4>
                <p className="text-xs text-slate-400">DeepSeek AI Examiner Tahlili</p>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 px-6 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-wider text-indigo-500">
                <Award className="h-3.5 w-3.5" /> Umumiy Ball
              </div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {result.score}
              </div>
            </div>
          </div>

          {result.criteriaScores && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(result.criteriaScores).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {key}
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-800 dark:text-slate-200">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h5 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Batafsil Tahlil va Tavsiyalar (O'zbek
              tilida):
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
              <RefreshCw className="h-4 w-4" /> Qayta Topshirish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
