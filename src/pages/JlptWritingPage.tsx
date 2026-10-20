import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Award,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateAIResponse, extractJsonFromAiResponse } from '../utils/ai/aiCore';
import { useStudyData } from '../context/StudyPlannerContext';
import { toast } from '../hooks/use-toast';
import { HistoryService } from '../services/HistoryService';
import { ErrorNotificationService } from '../services/ErrorNotificationService';

interface SakubunHistoryItem {
  id: string;
  taskType: string;
  prompt: string;
  essay: string;
  score: number;
  criteriaBreakdown?: {
    kanjiRating?: string;
    suggestions?: string[];
    correctedText?: string;
  };
  feedback?: string;
  createdAt: string;
}

export const JlptWritingPage: React.FC = () => {
  const navigate = useNavigate();
  const { awardXP, user } = useStudyData();

  const [essayText, setEssayText] = useState('');
  const [targetLevel, setTargetLevel] = useState('N3');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [historyList, setHistoryList] = useState<SakubunHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    kanjiRating: string;
    grammarFeedback: string;
    correctedText: string;
    suggestions: string[];
  } | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const records = await HistoryService.getWritingHistory(20);
      setHistoryList((records || []) as SakubunHistoryItem[]);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, user]);

  const handleEvaluate = async () => {
    if (!essayText.trim()) return;
    setIsEvaluating(true);

    try {
      const prompt = `
            Act as an expert Japanese Essay (Sakubun 作文) and Grammar Evaluator.
            Evaluate this Japanese text written for target JLPT level ${targetLevel} (appropriate for JLPT grammar/vocab practice, EJU, and academic/workplace writing):
            "${essayText}"

            Output ONLY a JSON response in Uzbek:
            {
                "score": number (0-100),
                "kanjiRating": "A'lo / Qoniqarli / Ko'proq Kanji ishlatish kerak",
                "grammarFeedback": "Desu/Masu va grammatik shakllar haqida batafsil o'zbekcha baho",
                "correctedText": "Tog'rilangan ideal yaponcha shakli (Furigana bilan)",
                "suggestions": ["Tavsiya 1", "Tavsiya 2"]
            }
            `;

      const rawRes = await generateAIResponse([{ role: 'user', content: prompt }], {
        isJson: true,
      });
      const parsed = extractJsonFromAiResponse<{
        score?: number;
        kanjiRating?: string;
        grammarFeedback?: string;
        correctedText?: string;
        suggestions?: string[];
      }>(rawRes);

      if (!parsed || typeof parsed.score !== 'number' || isNaN(parsed.score)) {
        throw new Error(
          "AI baholash javobini to'g'ri tahlil qilib bo'lmadi. Iltimos, qayta urinib ko'ring.",
        );
      }

      const evalData = {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        kanjiRating: parsed.kanjiRating || 'Qoniqarli',
        grammarFeedback: parsed.grammarFeedback || 'Grammatik konstruksiyalar tahlil qilindi.',
        correctedText: parsed.correctedText || essayText,
        suggestions:
          Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
            ? parsed.suggestions
            : ['Grammatik shakllarni bir maromda saqlashga e’tibor bering.'],
      };

      setResult(evalData);

      // Persist to database & local safe storage
      await HistoryService.saveWritingHistory({
        taskType: `sakubun_${targetLevel.toLowerCase()}`,
        prompt: `Sakubun (${targetLevel} darajasi)`,
        essay: essayText,
        score: evalData.score,
        criteriaBreakdown: {
          kanjiRating: evalData.kanjiRating,
          suggestions: evalData.suggestions,
          correctedText: evalData.correctedText,
        },
        feedback: evalData.grammarFeedback,
      });

      await awardXP(100);
      await loadHistory();
      toast({ title: '✅ Sakubun baholandi va tarixingizga saqlandi! (+100 XP)' });
    } catch (e: any) {
      console.error('[JlptWritingPage] Evaluation error:', e);
      ErrorNotificationService.notifyError({
        title: 'Inshoni baholashda xatolik yuz berdi',
        message:
          e?.message || "AI baholash serveri javob bermadi. Qayta urinish tugmasini bosib ko'ring.",
        error: e,
        retryAction: () => handleEvaluate(),
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:p-8 md:pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/jlpt')}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> JLPT Hub'ga qaytish
        </button>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-500">
          📝 Sakubun (作文) Evaluator
        </span>
      </div>

      <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black text-foreground">
              Sakubun (作文) Insho va Grammatika Tahlili
            </h2>
            <p className="text-xs text-muted-foreground">
              Yaponcha insho yoki matningizni kiriting va AI bahosini oling (EJU, Rirekisho va erkin
              yozish amaliyoti)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Target:</span>
            <div className="flex gap-1">
              {['N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTargetLevel(lvl)}
                  className={`rounded-xl px-3 py-1 text-xs font-extrabold transition-all ${
                    targetLevel === lvl
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-xs text-muted-foreground">
          <span className="text-base leading-none">💡</span>
          <span>
            JLPT rasmiy testida insho bo'limi mavjud bo'lmasa-da, Sakubun yozish grammatika, kanji
            va so'z boyligini erkin qo'llash (shuningdek EJU va ish suhbatlariga tayyorlanish) uchun
            eng foydali amaliyotdir.
          </span>
        </div>

        <textarea
          rows={8}
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          placeholder="Yaponcha insho yoki matningizni shu yerga kiritasiz... (Masalan: わたしの名前は... 日本語の勉強が好きです。)"
          className="w-full rounded-2xl border border-input bg-background p-4 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-amber-500"
        />

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating || !essayText.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-sm font-extrabold text-white shadow-lg transition-all hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
        >
          {isEvaluating ? <Sparkles size={18} className="animate-spin" /> : <Send size={18} />}
          <span>{isEvaluating ? 'Sakubun AI Tahlil Qilmoqda...' : 'Inshoni Tekshirish 📝'}</span>
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2 text-lg font-black text-foreground">
              <Award className="text-amber-500" size={24} /> Sakubun Natijasi:{' '}
              <span className="text-amber-500">{result.score} / 100</span>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              Kanji: {result.kanjiRating}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">
              Grammatika va Stilistika Tahlili:
            </h4>
            <p className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
              {result.grammarFeedback}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">
              Tavsiya etilgan Mukammal Varianti:
            </h4>
            <div className="whitespace-pre-wrap rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium leading-relaxed text-amber-700 dark:text-amber-300">
              {result.correctedText}
            </div>
          </div>
        </div>
      )}

      {/* Submission History Section */}
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-md">
        <button
          onClick={() => setShowHistory((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-sm font-black text-foreground"
        >
          <div className="flex items-center gap-2">
            <History size={18} className="text-amber-500" />
            <span>Mening Sakubun Tarixim ({historyList.length})</span>
          </div>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div className="space-y-3 pt-2">
            {historyList.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Hozircha saqlangan insholar yo'q. Yuqorida yangi insho yozib sinab ko'ring!
              </p>
            ) : (
              historyList.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-border bg-muted/20 transition-all"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/40"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            {item.prompt || 'JLPT Insho'}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            Ball: {item.score}/100
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{item.essay}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock size={12} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-border/60 bg-card p-4 text-xs">
                        <div>
                          <span className="font-bold text-muted-foreground">Yozilgan matn:</span>
                          <p className="mt-1 rounded-xl bg-muted/40 p-3 leading-relaxed text-foreground">
                            {item.essay}
                          </p>
                        </div>
                        {item.feedback && (
                          <div>
                            <span className="font-bold text-muted-foreground">AI Tahlili:</span>
                            <p className="mt-1 rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
                              {item.feedback}
                            </p>
                          </div>
                        )}
                        {item.criteriaBreakdown?.correctedText && (
                          <div>
                            <span className="font-bold text-muted-foreground">
                              Mukammal varianti:
                            </span>
                            <p className="mt-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-300">
                              {item.criteriaBreakdown.correctedText}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JlptWritingPage;
