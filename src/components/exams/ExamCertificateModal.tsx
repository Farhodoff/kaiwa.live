import React from 'react';
import { Button } from '../ui/Button';
import { Award, CheckCircle2, Download, Sparkles, X } from 'lucide-react';

interface ExamCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  examType: string;
  overallScore: string | number;
  sectionScores: {
    reading?: number | string;
    listening?: number | string;
    writing?: number | string;
    speaking?: number | string;
  };
  aiFeedback?: string;
  userName?: string;
  dateStr?: string;
}

export const ExamCertificateModal: React.FC<ExamCertificateModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  examType,
  overallScore,
  sectionScores,
  aiFeedback,
  userName = 'Foydalanuvchi',
  dateStr = new Date().toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl space-y-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Border Box */}
        <div className="space-y-6 rounded-2xl border-4 border-double border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 p-6 text-center">
          {/* Badge Icon */}
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Rasmiy Imtihon Sertifikati
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
              {examTitle}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Toifa: {examType} • Sana: {dateStr}
            </p>
          </div>

          {/* Score Showcase */}
          <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Umumiy Natija
              </span>
              <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {overallScore}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Egasining Ismi
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                {userName}
              </span>
            </div>
          </div>

          {/* Breakdown by Sections */}
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {sectionScores.reading !== undefined && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                  Reading (読解)
                </span>
                <span className="text-base font-black text-emerald-600">
                  {sectionScores.reading}
                </span>
              </div>
            )}
            {sectionScores.listening !== undefined && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                  Listening (聴解)
                </span>
                <span className="text-base font-black text-blue-600">
                  {sectionScores.listening}
                </span>
              </div>
            )}
            {sectionScores.writing !== undefined && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                  Writing (作文)
                </span>
                <span className="text-base font-black text-purple-600">
                  {sectionScores.writing}
                </span>
              </div>
            )}
            {sectionScores.speaking !== undefined && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                  Speaking (会話)
                </span>
                <span className="text-base font-black text-rose-600">{sectionScores.speaking}</span>
              </div>
            )}
          </div>

          {/* AI Feedback Section */}
          {aiFeedback && (
            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" /> AI Evaluator Xulosasi:
              </div>
              <p className="max-h-32 overflow-y-auto font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {aiFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-xl font-bold">
            <Download className="h-4 w-4" /> Yuklab Olish / Chop Etish
          </Button>
          <Button onClick={onClose} className="gap-2 rounded-xl bg-indigo-600 font-bold text-white">
            <CheckCircle2 className="h-4 w-4" /> Yopish
          </Button>
        </div>
      </div>
    </div>
  );
};
