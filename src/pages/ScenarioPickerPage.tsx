import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationScenario, ScenarioSessionResult } from '../components/speaking/scenarioTypes';
import { ScenarioService } from '../services/ScenarioService';
import {
  Sparkles,
  Play,
  Award,
  History,
  ArrowLeft,
  Plus,
  Globe,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../hooks/use-toast';
import { useSEO } from '../hooks/useSEO';

export const ScenarioPickerPage: React.FC = () => {
  useSEO({
    title: 'Yapon Tili Dialog va Muloqot Ssenariylari',
    description:
      "Hayotiy vaziyatlarda yapon tilida gapirish mashqi: restoran, do'kon (Konbini), aeroport, ish intervyusi va erkin mavzular.",
    canonical: '/scenarios',
    keywords:
      'yapon tili dialoglar, yaponcha ssenariylar, yapon tilida gapirish, yaponcha suhbat mavzulari, kaiwa live',
  });

  const navigate = useNavigate();
  const { language } = useLanguage();
  const [scenarios, setScenarios] = useState<ConversationScenario[]>(() =>
    ScenarioService.getImmediateScenarios(),
  );
  const [history, setHistory] = useState<ScenarioSessionResult[]>(() =>
    ScenarioService.getImmediateHistory(),
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingScenario, setDeletingScenario] = useState<ConversationScenario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Scenario Form State
  const [formData, setFormData] = useState({
    language: 'ja' as 'ja' | 'en',
    emoji: '💼',
    difficulty: 'N2' as ConversationScenario['difficulty'],
    category: 'business' as 'business' | 'daily' | 'travel' | 'social' | 'academic',
    title_ja: '',
    title_en: '',
    title_uz: '',
    description_uz: '',
    opening_line_ja: '',
    opening_line_en: '',
    context_prompt: '',
    key_phrases_input: '',
  });

  const refreshData = async () => {
    try {
      const list = await ScenarioService.getScenarios();
      const hist = await ScenarioService.getScenarioHistory();
      setScenarios(list);
      setHistory(hist);
    } catch (err) {
      console.debug('Scenario reload error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const list = await ScenarioService.getScenarios();
        const hist = await ScenarioService.getScenarioHistory();
        if (isMounted) {
          setScenarios(list);
          setHistory(hist);
        }
      } catch (err) {
        console.debug('Scenario background revalidation note:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const langScenarios = scenarios.filter((s) => {
    const sLang = s.language || (s.title_en ? 'en' : 'ja');
    return sLang === 'ja';
  });

  const filteredScenarios =
    selectedLevel === 'all'
      ? langScenarios
      : langScenarios.filter((s) => s.difficulty === selectedLevel);

  const handleSelectScenario = (scenario: ConversationScenario) => {
    navigate(`/speaking-coach?lang=ja&scenario=${scenario.id}`);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      language: 'ja',
      emoji: '💼',
      difficulty: 'N2',
      category: 'business',
      title_ja: '',
      title_en: '',
      title_uz: '',
      description_uz: '',
      opening_line_ja: '',
      opening_line_en: '',
      context_prompt: '',
      key_phrases_input: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveNewScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.title_ja.trim() || !formData.opening_line_ja.trim()) {
        toast({
          variant: 'destructive',
          title: "⚠️ Maydonlar to'liq emas",
          description: 'Yaponcha sarlavha va AI ochilish jumlasi kiritilishi shart.',
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.title_uz.trim() || !formData.description_uz.trim()) {
        toast({
          variant: 'destructive',
          title: "⚠️ Maydonlar to'liq emas",
          description: "O'zbekcha sarlavha va tavsif kiritilishi shart.",
        });
        setIsSubmitting(false);
        return;
      }

      const keyPhrases = formData.key_phrases_input
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const newScenario: ConversationScenario = {
        id: `custom_${Date.now()}`,
        language: 'ja',
        emoji: formData.emoji.trim() || '🎌',
        difficulty: formData.difficulty,
        category: formData.category,
        title_ja: formData.title_ja.trim(),
        title_uz: formData.title_uz.trim(),
        description_uz: formData.description_uz.trim(),
        opening_line_ja: formData.opening_line_ja.trim(),
        context_prompt:
          formData.context_prompt.trim() ||
          `あなたは親切な日本語のネイティブスピーカーです。${formData.difficulty}レベルの学習者と「${formData.title_ja}」についてロールプレイ会話を行ってください。`,
        key_phrases: keyPhrases.length > 0 ? keyPhrases : ['こんにちは', 'よろしくお願いします'],
        is_custom: true,
        created_at: new Date().toISOString(),
      };

      await ScenarioService.saveScenario(newScenario);
      await refreshData();
      setIsCreateModalOpen(false);

      toast({
        title: "✅ Ssenariy Muvaffaqiyatli Qo'shildi",
        description: `"${newScenario.title_uz}" ssenariysi ro'yxatga qo'shildi.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Xatolik yuz berdi',
        description: error?.message || 'Ssenariyni saqlashda xatolik.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScenario = async (scenario: ConversationScenario) => {
    try {
      await ScenarioService.deleteScenario(scenario.id);
      // Optimistic update
      setScenarios((prev) => prev.filter((s) => s.id !== scenario.id));
      setDeletingScenario(null);

      toast({
        title: "🗑️ Ssenariy O'chirildi",
        description: `"${scenario.title_uz || scenario.title_ja || scenario.title_en}" muvaffaqiyatli o'chirildi.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Xatolik yuz berdi',
        description: "Ssenariyni o'chirishda xatolik yuz berdi.",
      });
    }
  };

  const jaLevels = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-3 pb-16 animate-in fade-in sm:p-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-foreground shadow-sm sm:rounded-3xl sm:p-6 md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-center">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/jlpt')}
                className="cursor-pointer rounded-xl border border-border bg-muted p-1.5 text-foreground transition-all hover:bg-muted/80 sm:p-2"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="flex items-center gap-1.5 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#C9A961] sm:px-3 sm:py-1 sm:text-xs">
                <Globe size={12} />
                {language === 'ja'
                  ? '🎌 日本語シチュエーション会話'
                  : '🎌 Japanese Conversation Scenarios'}
              </span>
            </div>
            <h1 className="font-display text-xl font-black tracking-tight text-foreground sm:text-2xl md:text-3xl">
              {language === 'ja'
                ? 'シチュエーション会話練習'
                : 'Japanese Scenarios (Muloqot Ssenariylari)'}
            </h1>
            <p className="hidden max-w-xl text-xs leading-relaxed text-muted-foreground sm:block md:text-sm">
              {language === 'ja'
                ? 'ビジネス交渉、障害報告、面接、ショッピングなど、リアルな場面でAIと自由に会話練習をしましょう。'
                : 'Biznes muzokaralar, tizim nosozligi hisoboti, ish suhbati va real hayotiy ssenariylarda AI murabbiy bilan erkin muloqot qiling.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Scenario Create Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 sm:rounded-2xl sm:px-4 sm:py-2.5"
            >
              <Plus size={15} />
              <span>{language === 'ja' ? 'シナリオ作成' : "Ssenariy Qo'shish"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level Filter Tabs */}
      <div className="no-scrollbar flex items-center justify-between gap-3 overflow-x-auto border-b border-border pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {jaLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`shrink-0 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all sm:rounded-2xl sm:px-4 sm:py-2 ${
                selectedLevel === lvl
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {lvl === 'all' ? (language === 'ja' ? 'すべて' : 'Barchasi') : `JLPT ${lvl}`}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
          <Sparkles size={13} className="text-[#C9A961]" />
          <span>
            {language === 'ja'
              ? `${filteredScenarios.length} 件`
              : `${filteredScenarios.length} ta`}
          </span>
        </div>
      </div>

      {/* Scenarios Grid */}
      {scenarios.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs">
            {language === 'ja' ? 'シナリオを読み込み中...' : 'Ssenariylar yuklanmoqda...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const lastSession = history.find((h) => h.scenario_id === scenario.id);
            const title = scenario.title_ja || scenario.title_uz;

            return (
              <div
                key={scenario.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-md sm:rounded-3xl sm:p-5"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="rounded-xl bg-muted/60 p-2.5 text-2xl transition-transform group-hover:scale-110 sm:rounded-2xl sm:p-3 sm:text-3xl">
                      {scenario.emoji}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold sm:py-1 ${
                          scenario.difficulty === 'N5' || scenario.difficulty === 'N4'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : 'border-[#C9A961]/30 bg-[#C9A961]/15 text-[#C9A961]'
                        }`}
                      >
                        JLPT {scenario.difficulty}
                      </span>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingScenario(scenario);
                        }}
                        title="Ssenariyni o'chirish"
                        className="cursor-pointer rounded-xl p-1.5 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  {language !== 'ja' && scenario.title_uz && (
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      {scenario.title_uz}
                    </p>
                  )}
                  {language !== 'ja' && scenario.description_uz && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                      {scenario.description_uz}
                    </p>
                  )}

                  {/* Key Phrases */}
                  <div className="mt-4 space-y-1.5 border-t border-border/40 pt-3">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === 'ja' ? '重要フレーズ:' : 'Kalit iboralar:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scenario.key_phrases.slice(0, 3).map((kp, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-border/40 bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground"
                        >
                          {kp}
                        </span>
                      ))}
                      {scenario.key_phrases.length > 3 && (
                        <span className="self-center text-[10px] text-muted-foreground">
                          +{scenario.key_phrases.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                  {lastSession ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Award size={16} className="text-[#C9A961]" />
                      <div>
                        <span className="font-bold text-foreground">
                          {lastSession.overall_score}%
                        </span>
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {language === 'ja' ? '前回のスコア' : 'oxirgi natija'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <History size={12} />
                      <span>{language === 'ja' ? '未着手' : 'Boshlanmagan'}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectScenario(scenario)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 group-hover:scale-105"
                  >
                    <Play size={14} className="fill-current" />
                    <span>{language === 'ja' ? '会話を開始' : 'Boshlash'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Scenario Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{formData.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {language === 'ja' ? '新しい会話シナリオの作成' : 'Yangi Ssenariy Yaratish'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ja'
                      ? 'AIコーチとのロールプレイ用シナリオを追加'
                      : "AI Murabbiy uchun shaxsiy rolli ssenariy qo'shing"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="cursor-pointer rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewScenario} className="space-y-4">
              {/* Language, Difficulty, Category Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Til
                  </label>
                  <div className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground">
                    🎌 日本語 (JLPT)
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emoji: e.target.value }))}
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-center text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="💼"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Daraja (Level)
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        difficulty: e.target.value as ConversationScenario['difficulty'],
                      }))
                    }
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                  >
                    <option value="N5">JLPT N5</option>
                    <option value="N4">JLPT N4</option>
                    <option value="N3">JLPT N3</option>
                    <option value="N2">JLPT N2</option>
                    <option value="N1">JLPT N1</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Kategoriya
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value as any }))
                    }
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                  >
                    <option value="business">💼 Biznes</option>
                    <option value="daily">🍜 Kundalik</option>
                    <option value="travel">✈️ Sayohat</option>
                    <option value="social">🤝 Ijtimoiy</option>
                    <option value="academic">🎓 Akademik</option>
                  </select>
                </div>
              </div>

              {/* Target Language Title & Opening Line */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Yaponcha Sarlavha (Kanji/Kana) *
                  </label>
                  <input
                    type="text"
                    value={formData.title_ja}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title_ja: e.target.value }))}
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="例: 取引先との新規商談 (New Client Negotiation)"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    AI Murabbiyning Boshlovchi Jumlasi (Opening Line) *
                  </label>
                  <input
                    type="text"
                    value={formData.opening_line_ja}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, opening_line_ja: e.target.value }))
                    }
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="例: いつもお世話になっております。本日は新規案件についてご相談したく存じます。"
                    required
                  />
                </div>
              </div>

              {/* Uzbek Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    O'zbekcha Sarlavha *
                  </label>
                  <input
                    type="text"
                    value={formData.title_uz}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title_uz: e.target.value }))}
                    className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="Masalan: Hamkor bilan biznes shartnomani muzokara qilish"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    O'zbekcha Qisqacha Tavsif *
                  </label>
                  <textarea
                    value={formData.description_uz}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description_uz: e.target.value }))
                    }
                    rows={2}
                    className="outline-hidden w-full resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
                    placeholder="Ushbu mashqda qanday ko'nikmalar rivojlantiriladi..."
                    required
                  />
                </div>
              </div>

              {/* AI Context Prompt */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  AI Sensei uchun Kontekst Prompt (Ixtiyoriy)
                </label>
                <textarea
                  value={formData.context_prompt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, context_prompt: e.target.value }))
                  }
                  rows={2}
                  className="outline-hidden w-full resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 font-mono text-xs text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="AI roli, maqsadi va qat'iylik darajasi..."
                />
              </div>

              {/* Key Phrases */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Kalit Iboralar (vergul bilan ajrating)
                </label>
                <input
                  type="text"
                  value={formData.key_phrases_input}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, key_phrases_input: e.target.value }))
                  }
                  className="outline-hidden w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="いつもお世話になっております, 納期について, ご検討ください"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer rounded-2xl bg-muted px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Ssenariyni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                Ssenariyni o'chirishni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">
                  "
                  {deletingScenario.title_uz ||
                    deletingScenario.title_ja ||
                    deletingScenario.title_en}
                  "
                </span>{' '}
                ssenariysi ro'yxatdan o'chiriladi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingScenario(null)}
                className="cursor-pointer rounded-2xl bg-muted px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDeleteScenario(deletingScenario)}
                className="cursor-pointer rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioPickerPage;
