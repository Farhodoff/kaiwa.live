import React, { useState } from 'react';
import {
  X,
  Award,
  AlertCircle,
  CheckCircle,
  Sparkles,
  BookOpen,
  Download,
  Volume2,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import { SessionAnalysisReport, cleanJapaneseTTS } from '../../utils/ai';
import { ErrorVaultService } from '../../services/ErrorVaultService';
import { useStudyData } from '../../context/StudyPlannerContext';
import { toast } from '../../hooks/use-toast';
import { escapeHtml } from '../../utils/escapeHtml';
import { downloadReportAsPNG } from '../../utils/reportExport';

interface SessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SessionAnalysisReport | null;
  isLoading: boolean;
  personaTitle: string;
}

export const SessionReportModal: React.FC<SessionReportModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  personaTitle,
}) => {
  const { addFlashcardsBatch } = useStudyData();
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const handleExportToFlashcards = async () => {
    if (!report || (!report.grammar_corrections?.length && !report.better_vocabulary?.length)) {
      toast({
        title: "ℹ️ Xatolar yo'q",
        description: 'Ushbu sessiyada saqlash uchun grammatik xatolar topilmadi.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const isJapanese = (report.user_level_jp && report.user_level_jp.includes('JLPT')) || false;
      const lang = isJapanese ? 'ja' : 'en';

      const directCards = (report.grammar_corrections || []).map((g) => ({
        front: `❌ Qoidani tuzating (${lang.toUpperCase()}):\n"${g.original}"`,
        back: `✅ To'g'ri variant:\n"${g.corrected}"\n\n💡 Tushuntirish:\n${g.explanation}`,
      }));

      const vocabCards = (report.better_vocabulary || []).map((v) => ({
        front: `🧠 Lug'at takomillashtirish (${lang.toUpperCase()}):\n"${v.original}"`,
        back: `✨ Tavsiya etilgan ibora:\n"${v.suggested}"\n\n📖 Kontekst:\n${v.context}`,
      }));

      const vaultCards = ErrorVaultService.convertErrorsToFlashcards(lang);
      const allCards = [...directCards, ...vocabCards, ...vaultCards];

      // Remove duplicates by front text
      const uniqueCards = allCards.filter(
        (card, index, self) => index === self.findIndex((c) => c.front === card.front),
      );

      if (uniqueCards.length > 0) {
        await addFlashcardsBatch(uniqueCards);
        toast({
          title: '🎴 Fleshkartalar Yaratildi!',
          description: `${uniqueCards.length} ta xatolar to'plami Flashcardlar bo'limiga qo'shildi va DB ga saqlandi.`,
        });
      }
    } catch (e) {
      console.error('Error exporting cards:', e);
      toast({
        title: '❌ Xatolik',
        description: 'Fleshkartalarni saqlashda xatolik yuz berdi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const playWordAudio = (word: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const isJa = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(word);
      const cleanWord = isJa ? cleanJapaneseTTS(word) : word.trim();
      if (!cleanWord) return;
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = isJa ? 'ja-JP' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('Speech play error:', e);
    }
  };

  const handlePrintReport = () => {
    if (!report) return;
    const existingFrame = document.getElementById('print-report-frame');
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-report-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const eT = escapeHtml(personaTitle);
    const reportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Speaking Coach Tahlil Hisoboti - ${eT}</title>
                <style>
                    @media print {
                        @page { margin: 15mm; }
                        body { font-family: system-ui, -apple-system, sans-serif; color: #111827; background: #fff; }
                    }
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111827; background: #fff; }
                    h1 { color: #4f46e5; font-size: 24px; margin-bottom: 4px; }
                    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
                    .score-card { background: #4f46e5; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
                    .score { font-size: 36px; font-weight: bold; }
                    .section-title { font-size: 18px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
                    .box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 8px; margin-bottom: 12px; }
                    .green { color: #059669; font-weight: bold; }
                    .red { color: #dc2626; text-decoration: line-through; }
                    .item-list { padding-left: 20px; }
                    .item-list li { margin-bottom: 6px; }
                </style>
            </head>
            <body>
                <h1>🌸 Nihongo Talk — Speaking Coach Tahlil Hisoboti</h1>
                <div class="subtitle">Ssenariy: <strong>${eT}</strong> | Sana: ${new Date().toLocaleDateString('uz-UZ')}</div>

                <div class="score-card">
                    <div>Umumiy Band / Fluency Bali</div>
                    <div class="score">${(report.overall_score || report.fluency_score || 7.0).toFixed(1)} / 9.0</div>
                    <div style="font-size: 13px; opacity: 0.9;">${report.user_level_jp || report.user_level_eng || 'CEFR B2'}</div>
                </div>

                <div class="section-title">💡 Umumiy Xulosa</div>
                <div class="box">${escapeHtml(report.overall_feedback)}</div>

                <div class="section-title">✅ Kuchli Jihatlar</div>
                <ul class="item-list">
                    ${(report.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
                </ul>

                <div class="section-title">🎯 Rivojlantirish Kerak Bo'lgan Jihatlar</div>
                <ul class="item-list">
                    ${(report.areas_to_improve || []).map((a) => `<li>${escapeHtml(a)}</li>`).join('')}
                </ul>

                ${
                  report.grammar_corrections && report.grammar_corrections.length > 0
                    ? `
                        <div class="section-title">📚 Grammatik Xatolar & Tuzatishlar</div>
                        ${report.grammar_corrections
                          .map(
                            (g) => `
                            <div class="box">
                                <div><span class="red">❌ ${escapeHtml(g.original)}</span> ➔ <span class="green">✅ ${escapeHtml(g.corrected)}</span></div>
                                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">💡 ${escapeHtml(g.explanation)}</div>
                            </div>
                        `,
                          )
                          .join('')}
                    `
                    : ''
                }

                ${
                  report.better_vocabulary && report.better_vocabulary.length > 0
                    ? `
                        <div class="section-title">✨ Tavsiya Etilgan Yuqori Darajali Lug'atlar</div>
                        ${report.better_vocabulary
                          .map(
                            (v) => `
                            <div class="box">
                                <div>Oddiy: ${escapeHtml(v.original)} ➔ <strong style="color: #7c3aed;">✨ ${escapeHtml(v.suggested)}</strong></div>
                                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(v.context)}</div>
                            </div>
                        `,
                          )
                          .join('')}
                    `
                    : ''
                }
            </body>
            </html>
        `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(reportHtml);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 400);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl duration-200 animate-in zoom-in-95 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-600 dark:text-indigo-400">
              <Award size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Suhbat Tahlili & Natijalari
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ssenariy: <span className="font-semibold text-indigo-500">{personaTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
              <p className="font-medium text-gray-500 dark:text-gray-400">
                Sun'iy intellekt suhbatingizni tahlil qilmoqda...
              </p>
            </div>
          ) : report ? (
            <>
              {/* Score & Level & Overall Feedback Banner */}
              <div className="space-y-4">
                {/* Overall Level Badge Banner */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white shadow-xl md:flex-row">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                      <Sparkles size={32} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                        Umumiy Natija va Daraja
                      </span>
                      <h3 className="text-2xl font-extrabold">
                        {report.user_level_jp || 'JLPT N4'}
                      </h3>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/20 px-5 py-2.5 text-2xl font-black tracking-tight backdrop-blur-md">
                    {(report.overall_score || report.fluency_score || 7.0).toFixed(1)}{' '}
                    <span className="text-xs font-normal opacity-80">/ 9.0</span>
                  </div>
                </div>

                {/* 6 Rubric Criteria Breakdown Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      📚 Lexical
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.lexical_score || 7.0).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      So'z boyligi
                    </span>
                  </div>

                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      ⚖️ Grammar
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.grammar_score || 7.0).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      Grammatika
                    </span>
                  </div>

                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      🗣️ Fluency
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.fluency_score || 7.0).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      Ravonlik
                    </span>
                  </div>

                  <div className="rounded-2xl border border-pink-500/20 bg-pink-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                      🎙️ Accent
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.pronunciation_score || 7.5).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      Talaffuz
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      ✨ Nuance
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.naturalness_score || 7.5).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      Tabiiylik
                    </span>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      ⏱️ Pauses
                    </span>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {(report.hesitation_score || 7.5).toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-gray-400">/ 9.0</span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                      Duduqlanishsiz
                    </span>
                  </div>
                </div>

                {/* Overall Feedback */}
                <div className="rounded-2xl border border-gray-200/60 bg-gray-50 p-5 dark:border-gray-700/60 dark:bg-gray-800/60">
                  <h4 className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                    <Sparkles size={16} className="text-indigo-500" />
                    Umumiy Tahlil va Xulosa
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    {report.overall_feedback}
                  </p>
                </div>
              </div>

              {/* Strengths & Areas to Improve */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={18} /> Kuchli Jihatlaringiz
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {report.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                    <AlertCircle size={18} /> Rivojlantirish Kerak Boyicha Maslahatlar
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {report.areas_to_improve.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 text-amber-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pronunciation Feedback & Errors */}
              {((report.pronunciation_errors && report.pronunciation_errors.length > 0) ||
                report.pronunciation_feedback) && (
                <div className="space-y-3 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5 dark:bg-rose-950/10">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-400">
                    <Volume2 size={18} />
                    Talaffuz va Intonatsiya Tahlili
                  </h4>
                  {report.pronunciation_feedback && (
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      {report.pronunciation_feedback}
                    </p>
                  )}
                  {report.pronunciation_errors && report.pronunciation_errors.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                      {report.pronunciation_errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="group relative space-y-1 rounded-xl border border-rose-500/20 bg-white p-3 text-xs dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-black text-rose-600 dark:text-rose-400">
                              "{err.word}"
                            </span>
                            <button
                              onClick={() => playWordAudio(err.word)}
                              className="flex items-center gap-1 rounded-lg bg-rose-500/10 p-1 text-[10px] font-bold text-rose-500 transition-colors hover:bg-rose-500/20"
                              title="To'g'ri talaffuzni eshitish"
                            >
                              <Volume2 size={12} />
                              <span>Eshitish</span>
                            </button>
                          </div>
                          <span className="block text-[10px] text-muted-foreground">
                            💡 {err.correctionHelp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grammar Corrections */}
              {report.grammar_corrections.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                    <BookOpen size={18} className="text-indigo-500" />
                    Grammatik Xatolar va Tuzatishlar ({report.grammar_corrections.length})
                  </h4>
                  <div className="space-y-3">
                    {report.grammar_corrections.map((item, idx) => (
                      <div
                        key={idx}
                        className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/80"
                      >
                        <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row sm:items-center">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="rounded-md bg-red-500/10 px-2 py-0.5 font-mono text-red-500 line-through dark:text-red-400">
                              ❌ {item.original}
                            </span>
                            <span className="hidden text-gray-400 sm:inline">➔</span>
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              ✅ {item.corrected}
                            </span>
                          </div>
                          <button
                            onClick={() => playWordAudio(item.corrected)}
                            className="flex shrink-0 items-center gap-1 self-start rounded-lg bg-emerald-500/10 p-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400 sm:self-auto"
                            title="To'g'ri gapni eshitish"
                          >
                            <Volume2 size={13} />
                            <span>Audioni tinglash</span>
                          </button>
                        </div>
                        <p className="text-xs italic text-gray-500 dark:text-gray-400">
                          💡 {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Better Vocabulary Suggestions */}
              {report.better_vocabulary.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                    <Sparkles size={18} className="text-purple-500" />
                    Lug'at Boyligini Oshirish (Native / Band 8+ Iboralar)
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {report.better_vocabulary.map((vocab, idx) => (
                      <div
                        key={idx}
                        className="space-y-2 rounded-2xl border border-purple-500/15 bg-purple-500/5 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Oddiy:{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {vocab.original}
                            </span>
                          </div>
                          <button
                            onClick={() => playWordAudio(vocab.suggested)}
                            className="flex items-center gap-1 rounded-lg bg-purple-500/10 p-1 text-[10px] font-bold text-purple-600 transition-colors hover:bg-purple-500/20 dark:text-purple-400"
                            title="Band 8+ iborani eshitish"
                          >
                            <Volume2 size={12} />
                            <span>Eshitish</span>
                          </button>
                        </div>
                        <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          ✨ {vocab.suggested}
                        </div>
                        <div className="pt-1 text-xs text-gray-600 dark:text-gray-400">
                          {vocab.context}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">Hisobot topilmadi.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/80">
          {report && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportToFlashcards}
                disabled={isExporting}
                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
                title="Xatolarni Fleshkartalar bo'limiga saqlash"
              >
                <Copy size={18} />
                {isExporting ? 'Saqlanmoqda...' : 'Xatolardan Flashcard Yaratish 🎴'}
              </button>

              <button
                type="button"
                disabled={isDownloadingImage}
                onClick={async () => {
                  try {
                    setIsDownloadingImage(true);
                    await downloadReportAsPNG(report, personaTitle);
                    toast({
                      title: '🖼️ Rasm Yuklandi!',
                      description: 'Sertifikat kartasi PNG formatida muvaffaqiyatli saqlandi.',
                    });
                  } catch (err) {
                    console.error('PNG export error:', err);
                    toast({
                      variant: 'destructive',
                      title: 'Xatolik',
                      description: 'Rasmni generatsiya qilishda xatolik yuz berdi.',
                    });
                  } finally {
                    setIsDownloadingImage(false);
                  }
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                title="Natijani ijtimoiy tarmoqlar uchun PNG rasm qilib saqlash"
              >
                <ImageIcon size={18} />
                {isDownloadingImage ? 'Yuklanmoqda...' : 'Rasm Yuklash (PNG)'}
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                title="PDF yoki qog'ozda chop etish"
              >
                <Download size={18} />
                PDF / Chop Etish
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-indigo-700"
          >
            Tushunarli, Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReportModal;
