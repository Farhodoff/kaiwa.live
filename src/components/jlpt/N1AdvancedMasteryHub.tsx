import React, { useState } from 'react';
import {
  Newspaper,
  GraduationCap,
  Briefcase,
  Crown,
  Scale,
  SearchCheck,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import {
  N1_EDITORIAL_SHASETSU,
  N1_ACADEMIC_ARTICLES,
  N1_BUSINESS_CORRESPONDENCE,
  N1_KEIGO_VERB_MATRIX,
  N1_NIJYUU_KEIGO_TRAPS,
  N1_KEIGO_DRILLS,
  N1_NUANCE_COMPARISONS,
  N1_INFERENCE_QUESTIONS,
  N1EditorialPassage,
  N1AcademicArticle,
  N1BusinessEmailScenario,
} from '../../data/n1AdvancedContent';
import FuriganaText from './FuriganaText';
import { speakText } from '../../utils/audioTts';
import { useStudyData } from '../../context/StudyPlannerContext';

export type N1MasterySection =
  'editorial' | 'academic' | 'business' | 'keigo' | 'nuances' | 'inference';

export const N1AdvancedMasteryHub: React.FC = () => {
  const { awardXP } = useStudyData();

  const [activeSection, setActiveSection] = useState<N1MasterySection>('editorial');

  // Editorial Section State
  const [selectedEditorialIndex, setSelectedEditorialIndex] = useState(0);
  const [editorialAnswers, setEditorialAnswers] = useState<Record<string, number>>({});
  const [showEditorialTranslation, setShowEditorialTranslation] = useState(false);

  // Academic Section State
  const [selectedAcademicIndex, setSelectedAcademicIndex] = useState(0);
  const [academicAnswers, setAcademicAnswers] = useState<Record<string, number>>({});
  const [showAcademicTranslation, setShowAcademicTranslation] = useState(false);

  // Business Section State
  const [selectedBusinessIndex, setSelectedBusinessIndex] = useState(0);
  const [bizDrillAnswers, setBizDrillAnswers] = useState<Record<string, number>>({});

  // Keigo Drill State
  const [keigoAnswers, setKeigoAnswers] = useState<Record<string, number>>({});

  // Nuance Drill State
  const [selectedNuanceIndex, setSelectedNuanceIndex] = useState(0);
  const [nuanceAnswers, setNuanceAnswers] = useState<Record<string, number>>({});

  // Inference State
  const [selectedInferenceIndex, setSelectedInferenceIndex] = useState(0);
  const [inferenceAnswers, setInferenceAnswers] = useState<Record<string, number>>({});

  const currentEditorial: N1EditorialPassage = N1_EDITORIAL_SHASETSU[selectedEditorialIndex];
  const currentAcademic: N1AcademicArticle = N1_ACADEMIC_ARTICLES[selectedAcademicIndex];
  const currentBusiness: N1BusinessEmailScenario =
    N1_BUSINESS_CORRESPONDENCE[selectedBusinessIndex];
  const currentNuance = N1_NUANCE_COMPARISONS[selectedNuanceIndex];
  const currentInference = N1_INFERENCE_QUESTIONS[selectedInferenceIndex];

  const handleEditorialAnswer = (questionId: string, optionIndex: number) => {
    setEditorialAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    const q = currentEditorial.questions.find((item) => item.id === questionId);
    if (q && optionIndex === q.correctIndex) {
      awardXP(15);
    }
  };

  const handleAcademicAnswer = (questionId: string, optionIndex: number) => {
    setAcademicAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    const q = currentAcademic.questions.find((item) => item.id === questionId);
    if (q && optionIndex === q.correctIndex) {
      awardXP(20);
    }
  };

  const handleBizDrillAnswer = (drillId: string, optionIndex: number, correctIndex: number) => {
    setBizDrillAnswers((prev) => ({ ...prev, [drillId]: optionIndex }));
    if (optionIndex === correctIndex) {
      awardXP(15);
    }
  };

  const handleKeigoDrillAnswer = (drillId: string, optionIndex: number, correctIndex: number) => {
    setKeigoAnswers((prev) => ({ ...prev, [drillId]: optionIndex }));
    if (optionIndex === correctIndex) {
      awardXP(15);
    }
  };

  const handleNuanceAnswer = (nuanceId: string, optionIndex: number, correctIndex: number) => {
    setNuanceAnswers((prev) => ({ ...prev, [nuanceId]: optionIndex }));
    if (optionIndex === correctIndex) {
      awardXP(15);
    }
  };

  const handleInferenceAnswer = (infId: string, optionIndex: number, isCorrect: boolean) => {
    setInferenceAnswers((prev) => ({ ...prev, [infId]: optionIndex }));
    if (isCorrect) {
      awardXP(25);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-linear-to-br relative overflow-hidden rounded-3xl border border-primary/20 from-card via-card/90 to-primary/5 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black tracking-wide text-primary">
              <Crown size={13} className="text-amber-500" />
              <span>N1 ADVANCED ACADEMIC & EXECUTIVE HUB</span>
            </div>
            <h2 className="font-display text-2xl font-black text-foreground md:text-3xl">
              N1 Oliy Daraja: Shasetsu, Keigo, Nuanslar va Implicit Dokkai
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yaponiyaning yetakchi tahririyat maqolalari, ilmiy-falsafiy matnlar, korporativ Keigo
              va nozik ma&apos;no farqlarini qamrab oluvchi professional tayyorgarlik moduli.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border/70 pb-2">
        <button
          onClick={() => setActiveSection('editorial')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'editorial'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Newspaper size={15} />
          <span>社説・論説 (Shasetsu)</span>
        </button>

        <button
          onClick={() => setActiveSection('academic')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'academic'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <GraduationCap size={15} />
          <span>学術・論文 (Akademik)</span>
        </button>

        <button
          onClick={() => setActiveSection('business')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'business'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Briefcase size={15} />
          <span>ビジネス・契約書 (Biznes)</span>
        </button>

        <button
          onClick={() => setActiveSection('keigo')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'keigo'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Crown size={15} />
          <span>至高の敬語 (Keigo Tizimi)</span>
        </button>

        <button
          onClick={() => setActiveSection('nuances')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'nuances'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Scale size={15} />
          <span>類義語・ニュアンス比較</span>
        </button>

        <button
          onClick={() => setActiveSection('inference')}
          className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeSection === 'inference'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <SearchCheck size={15} />
          <span>言外の意味・推論 (Implicit Dokkai)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. EDITORIAL & SHASETSU SECTION */}
      {/* ========================================================================= */}
      {activeSection === 'editorial' && (
        <div className="space-y-6">
          {/* Article Selector Chips */}
          <div className="flex flex-wrap gap-2">
            {N1_EDITORIAL_SHASETSU.map((article, idx) => (
              <button
                key={article.id}
                onClick={() => {
                  setSelectedEditorialIndex(idx);
                  setShowEditorialTranslation(false);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedEditorialIndex === idx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Newspaper size={14} />
                <span className="line-clamp-1">
                  {article.title.replace(/\[.*?\]/g, '').substring(0, 24)}...
                </span>
              </button>
            ))}
          </div>

          {/* Active Article Viewer */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-500">
                    {currentEditorial.editorialSource}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tavsiya etilgan vaqt: {currentEditorial.recommendedMinutes} daqiqa
                  </span>
                </div>
                <h3 className="font-display text-lg font-black text-foreground md:text-xl">
                  <FuriganaText text={currentEditorial.title} mode="hover" />
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    speakText(currentEditorial.japaneseContent.replace(/\[.*?\]/g, ''))
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
                  title="Audio eshitish"
                >
                  <Volume2 size={14} className="text-primary" />
                  <span>TTS O&apos;qish</span>
                </button>
                <button
                  onClick={() => setShowEditorialTranslation(!showEditorialTranslation)}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                >
                  <span>
                    {showEditorialTranslation ? "O'zbekchani yashirish" : "Tarjimani ko'rish"}
                  </span>
                </button>
              </div>
            </div>

            {/* Core Theme Summary Callout */}
            <div className="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs leading-relaxed text-sky-950 dark:text-sky-200">
              <span className="font-bold text-sky-600 dark:text-sky-400">
                Asosiy tahririyat g&apos;oyasi:{' '}
              </span>
              {currentEditorial.keyThemeUz}
            </div>

            {/* Japanese Content */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 font-serif text-base leading-loose tracking-wide text-foreground">
              <FuriganaText text={currentEditorial.japaneseContent} mode="hover" />
            </div>

            {/* Uzbek Translation */}
            {showEditorialTranslation && (
              <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                  O&apos;zbekcha tahliliy tarjima:
                </div>
                <p>{currentEditorial.uzbekTranslation}</p>
              </div>
            )}

            {/* N1 Vocabulary Highlights Drawer */}
            <div className="mt-6 border-t border-border/60 pt-5">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <Sparkles size={14} className="text-amber-500" />
                <span>Matndagi muhim N1 leksikasi (語彙解説)</span>
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {currentEditorial.vocabularyHighlights.map((vocab, vIdx) => (
                  <div
                    key={vIdx}
                    className="shadow-2xs rounded-xl border border-border/70 bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{vocab.word}</span>
                      <span className="text-[11px] text-muted-foreground">【{vocab.reading}】</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-primary">{vocab.meaningUz}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{vocab.nuanceNote}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dokkai Questions */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <h4 className="mb-4 text-sm font-black text-foreground">
                Dokkai Tahliliy Savollari ({currentEditorial.questions.length})
              </h4>
              <div className="space-y-6">
                {currentEditorial.questions.map((q, qIdx) => {
                  const selectedOpt = editorialAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;
                  return (
                    <div
                      key={q.id}
                      className="shadow-2xs rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="mb-3 font-bold text-foreground">
                        <span className="mr-2 font-black text-primary">Q{qIdx + 1}.</span>
                        <FuriganaText text={q.questionText} mode="hover" />
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = selectedOpt === optIdx;
                          const isCorrect = optIdx === q.correctIndex;

                          let btnStyle =
                            'border-border/80 bg-background hover:bg-muted text-foreground';
                          if (isAnswered) {
                            if (isCorrect) {
                              btnStyle =
                                'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                            } else if (isChosen) {
                              btnStyle =
                                'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={isAnswered}
                              onClick={() => handleEditorialAnswer(q.id, optIdx)}
                              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-all ${btnStyle}`}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold">
                                {optIdx + 1}
                              </span>
                              <div className="flex-1">
                                <FuriganaText text={opt} mode="hover" />
                              </div>
                              {isAnswered && isCorrect && (
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                              )}
                              {isAnswered && isChosen && !isCorrect && (
                                <XCircle size={16} className="shrink-0 text-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">Izoh: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACADEMIC & PHILOSOPHICAL ARTICLES */}
      {/* ========================================================================= */}
      {activeSection === 'academic' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {N1_ACADEMIC_ARTICLES.map((article, idx) => (
              <button
                key={article.id}
                onClick={() => {
                  setSelectedAcademicIndex(idx);
                  setShowAcademicTranslation(false);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedAcademicIndex === idx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <GraduationCap size={14} />
                <span className="line-clamp-1">{article.title.substring(0, 26)}...</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-500">
                  {currentAcademic.academicDomain}
                </span>
                <h3 className="mt-1 font-display text-lg font-black text-foreground md:text-xl">
                  <FuriganaText text={currentAcademic.title} mode="hover" />
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(currentAcademic.japaneseContent.replace(/\[.*?\]/g, ''))}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
                >
                  <Volume2 size={14} className="text-primary" />
                  <span>Tinglash</span>
                </button>
                <button
                  onClick={() => setShowAcademicTranslation(!showAcademicTranslation)}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                >
                  <span>
                    {showAcademicTranslation ? "O'zbekchani yashirish" : "Tarjimani ko'rish"}
                  </span>
                </button>
              </div>
            </div>

            {/* Logical Dialectic Framework (Thesis -> Antinomy -> Synthesis) */}
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  1. Asosiy Tezis (テーゼ)
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {currentAcademic.thesisSummaryUz}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                  2. Ziddiyat / Antiteza (アンチテーゼ)
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {currentAcademic.counterArgumentUz}
                </div>
              </div>
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5">
                <div className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400">
                  3. Xulosa / Sintez (ジンテーゼ)
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {currentAcademic.synthesisUz}
                </div>
              </div>
            </div>

            {/* Academic Japanese Text */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 font-serif text-base leading-loose tracking-wide text-foreground">
              <FuriganaText text={currentAcademic.japaneseContent} mode="hover" />
            </div>

            {showAcademicTranslation && (
              <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                  Ilmiy tarjima:
                </div>
                <p>{currentAcademic.uzbekTranslation}</p>
              </div>
            )}

            {/* Academic Terminology */}
            <div className="mt-6 border-t border-border/60 pt-5">
              <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                Akademik Falsafiy Atamalar (学術用語)
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {currentAcademic.academicTerminology.map((term, tIdx) => (
                  <div key={tIdx} className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="font-bold text-foreground">
                      {term.term}{' '}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        【{term.reading}】
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{term.definitionUz}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Questions */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <h4 className="mb-4 text-sm font-black text-foreground">
                Ilmiy Mantiqiy Savollar ({currentAcademic.questions.length})
              </h4>
              <div className="space-y-6">
                {currentAcademic.questions.map((q, qIdx) => {
                  const selectedOpt = academicAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;
                  return (
                    <div
                      key={q.id}
                      className="shadow-2xs rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="mb-3 font-bold text-foreground">
                        <span className="mr-2 font-black text-primary">Q{qIdx + 1}.</span>
                        <FuriganaText text={q.questionText} mode="hover" />
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = selectedOpt === optIdx;
                          const isCorrect = optIdx === q.correctIndex;
                          let btnStyle =
                            'border-border/80 bg-background hover:bg-muted text-foreground';
                          if (isAnswered) {
                            if (isCorrect) {
                              btnStyle =
                                'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                            } else if (isChosen) {
                              btnStyle =
                                'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                            }
                          }
                          return (
                            <button
                              key={optIdx}
                              disabled={isAnswered}
                              onClick={() => handleAcademicAnswer(q.id, optIdx)}
                              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-all ${btnStyle}`}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold">
                                {optIdx + 1}
                              </span>
                              <div className="flex-1">
                                <FuriganaText text={opt} mode="hover" />
                              </div>
                              {isAnswered && isCorrect && (
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                              )}
                              {isAnswered && isChosen && !isCorrect && (
                                <XCircle size={16} className="shrink-0 text-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {isAnswered && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">Izoh: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BUSINESS & CONTRACT CORRESPONDENCE */}
      {/* ========================================================================= */}
      {activeSection === 'business' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {N1_BUSINESS_CORRESPONDENCE.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedBusinessIndex(idx)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedBusinessIndex === idx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Briefcase size={14} />
                <span className="line-clamp-1">{item.title.replace(/\[.*?\]/g, '')}</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-4 border-b border-border/60 pb-4">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-500">
                {currentBusiness.category.replace('_', ' ')}
              </span>
              <h3 className="mt-1 font-display text-lg font-black text-foreground md:text-xl">
                <FuriganaText text={currentBusiness.title} mode="hover" />
              </h3>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-bold text-foreground">Kimdan: </span>
                  {currentBusiness.senderRole}
                </div>
                <div>
                  <span className="font-bold text-foreground">Kimga: </span>
                  {currentBusiness.recipientRole}
                </div>
              </div>
            </div>

            {/* Etiquette Rules */}
            <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-950 dark:text-amber-200">
              <div className="mb-1 font-bold text-amber-600 dark:text-amber-400">
                Yaponiya korporativ yozishma qoidalari:
              </div>
              <ul className="list-inside list-disc space-y-1">
                {currentBusiness.etiquetteNotesUz.map((note, nIdx) => (
                  <li key={nIdx}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Contract Clauses if present */}
            {currentBusiness.contractClauses && (
              <div className="mb-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Shartnoma moddalari tahlili (契約条項)
                </h4>
                {currentBusiness.contractClauses.map((clause, cIdx) => (
                  <div key={cIdx} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="mb-2 font-bold text-foreground">
                      <span className="mr-2 text-primary">{clause.clauseNumber}:</span>
                      <FuriganaText text={clause.clauseTitle} mode="hover" />
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 p-3 font-serif text-xs leading-relaxed text-foreground">
                      <FuriganaText text={clause.japaneseText} mode="hover" />
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {clause.uzbekExplanation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Email Japanese Body */}
            <div className="whitespace-pre-line rounded-2xl border border-border/80 bg-background/50 p-5 font-serif text-sm leading-loose tracking-wide text-foreground">
              <FuriganaText text={currentBusiness.japaneseContent} mode="hover" />
            </div>

            {/* Correction Drills */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <h4 className="mb-2 text-sm font-black text-foreground">
                Biznes Keigo Tuzatish Mashqlari (ビジネス敬語修正ドリル)
              </h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Qo&apos;pol yoki noo&apos;rin gaplarni korporativ mezonlarga mos oliy darajadagi
                yapon biznes tiliga aylantiring.
              </p>

              <div className="space-y-6">
                {currentBusiness.correctionDrills.map((drill) => {
                  const userChoice = bizDrillAnswers[drill.id];
                  const answered = userChoice !== undefined;
                  return (
                    <div
                      key={drill.id}
                      className="shadow-2xs rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-950 dark:text-rose-200">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          ❌ Noo&apos;rin / qo&apos;pol ifoda:{' '}
                        </span>
                        {drill.inappropriateSentence}
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {drill.issueExplanationUz}
                        </div>
                      </div>

                      <div className="mb-2 text-xs font-bold text-foreground">
                        Eng to&apos;g&apos;ri executive-darajadagi Keigo variantini tanlang:
                      </div>

                      <div className="space-y-2">
                        {drill.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === drill.correctIndex;
                          const isChosen = userChoice === optIdx;

                          let style =
                            'border-border/80 bg-background hover:bg-muted text-foreground';
                          if (answered) {
                            if (isCorrect) {
                              style =
                                'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                            } else if (isChosen) {
                              style =
                                'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={answered}
                              onClick={() =>
                                handleBizDrillAnswer(drill.id, optIdx, drill.correctIndex)
                              }
                              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-all ${style}`}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold">
                                {optIdx + 1}
                              </span>
                              <div className="flex-1">{opt}</div>
                              {answered && isCorrect && (
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                              )}
                              {answered && isChosen && !isCorrect && (
                                <XCircle size={16} className="shrink-0 text-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">Izoh: </span>
                          {drill.explanationUz}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADVANCED KEIGO SYSTEM */}
      {/* ========================================================================= */}
      {activeSection === 'keigo' && (
        <div className="space-y-6">
          {/* Keigo Master Matrix */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <h3 className="mb-2 font-display text-lg font-black text-foreground md:text-xl">
              N1 Mezonidagi Asosiy Fe&apos;llar Keigo Matritsasi (敬語対比表)
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Sonkeigo (boshqalarni ulug&apos;lash), Kenjougo I (boshqalarga yo&apos;naltirilgan
              o&apos;z harakatini pasaytirish) va Kenjougo II / Teichougo (tinglovchi oldida
              o&apos;zini kamtar tutish).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground">
                    <th className="p-2.5 font-bold">Oddiy Fe&apos;l</th>
                    <th className="p-2.5 font-bold">尊敬語 (Sonkeigo)</th>
                    <th className="p-2.5 font-bold">謙譲語I (Kenjougo I)</th>
                    <th className="p-2.5 font-bold">丁重語 (Teichougo)</th>
                    <th className="p-2.5 font-bold">Ehtiyot bo&apos;ling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {N1_KEIGO_VERB_MATRIX.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold text-foreground">
                        {row.baseVerb}
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {row.meaningUz}
                        </div>
                      </td>
                      <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.sonkeigo}
                      </td>
                      <td className="p-2.5 font-semibold text-sky-600 dark:text-sky-400">
                        {row.kenjougoI}
                      </td>
                      <td className="p-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                        {row.kenjougoII}
                      </td>
                      <td className="p-2.5 text-[11px] text-muted-foreground">
                        {row.criticalPitfallUz}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nijyuu Keigo & Common Pitfalls */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <h3 className="mb-2 font-display text-lg font-black text-foreground">
              二重敬語 (Nijyuu-Keigo) va Jamiyatda Ko&apos;p Uchraydigan Xatolar
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Ortiqcha hurmat tufayli qoidalarni buzib qo&apos;yish (敬語過剰) yoki mijoz oldida
              o&apos;z rahbari familiyasiga hurmat qo&apos;shib yuborish tuzoqlari.
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {N1_NIJYUU_KEIGO_TRAPS.map((trap) => (
                <div
                  key={trap.id}
                  className="shadow-2xs rounded-2xl border border-border/80 bg-background/50 p-4"
                >
                  <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-rose-500">
                    {trap.trapType}
                  </span>
                  <div className="mt-2 text-xs font-bold text-rose-600 line-through dark:text-rose-400">
                    {trap.incorrectSentence}
                  </div>
                  <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {trap.correctSentence}
                  </div>
                  <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {trap.explanationUz}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Situational Keigo Drills */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <h3 className="mb-4 font-display text-lg font-black text-foreground">
              Real Korporativ Muloqot Mashqlari ({N1_KEIGO_DRILLS.length})
            </h3>
            <div className="space-y-6">
              {N1_KEIGO_DRILLS.map((drill) => {
                const userChoice = keigoAnswers[drill.id];
                const answered = userChoice !== undefined;

                return (
                  <div
                    key={drill.id}
                    className="shadow-2xs rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="mb-2 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Vaziyat: </span>
                      {drill.scenarioUz}
                    </div>
                    <div className="mb-3 font-bold text-foreground">
                      <FuriganaText text={drill.questionPrompt} mode="hover" />
                    </div>

                    <div className="space-y-2">
                      {drill.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === drill.correctIndex;
                        const isChosen = userChoice === optIdx;

                        let style = 'border-border/80 bg-background hover:bg-muted text-foreground';
                        if (answered) {
                          if (isCorrect) {
                            style =
                              'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                          } else if (isChosen) {
                            style =
                              'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={answered}
                            onClick={() =>
                              handleKeigoDrillAnswer(drill.id, optIdx, drill.correctIndex)
                            }
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-all ${style}`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold">
                              {optIdx + 1}
                            </span>
                            <div className="flex-1">
                              <FuriganaText text={opt} mode="hover" />
                            </div>
                            {answered && isCorrect && (
                              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                            )}
                            {answered && isChosen && !isCorrect && (
                              <XCircle size={16} className="shrink-0 text-rose-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">Izoh: </span>
                        {drill.explanationUz}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYNONYMS & NUANCES LAB */}
      {/* ========================================================================= */}
      {activeSection === 'nuances' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {N1_NUANCE_COMPARISONS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedNuanceIndex(idx)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedNuanceIndex === idx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Scale size={14} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <h3 className="font-display text-lg font-black text-foreground md:text-xl">
              {currentNuance.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {currentNuance.coreDifferenceUz}
            </p>

            {/* Side-by-Side Comparative Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentNuance.comparativeDetails.map((det, dIdx) => (
                <div
                  key={dIdx}
                  className="shadow-2xs flex flex-col justify-between rounded-2xl border border-border/80 bg-background/50 p-4"
                >
                  <div>
                    <div className="text-sm font-bold text-primary">{det.expression}</div>
                    <div className="mt-2 text-xs leading-relaxed text-foreground">
                      {det.exactNuanceUz}
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <div>
                        <span className="font-bold text-foreground">Qoida: </span>
                        {det.volitionRule}
                      </div>
                      <div>
                        <span className="font-bold text-foreground">Uslub: </span>
                        {det.tone}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border/50 pt-3">
                    <div className="text-[11px] font-bold text-muted-foreground">Misol:</div>
                    <div className="font-serif text-xs text-foreground">
                      <FuriganaText text={det.exampleJp} mode="hover" />
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{det.exampleUz}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drill Challenge */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <h4 className="mb-2 text-sm font-black text-foreground">
                Nuans Sezgirligi Mashqi (ニュアンス直感テスト)
              </h4>
              <div className="shadow-2xs rounded-2xl border border-border bg-card p-4">
                <div className="mb-1 text-sm font-bold text-foreground">
                  <FuriganaText text={currentNuance.drillQuestion.promptJp} mode="hover" />
                </div>
                <div className="mb-3 text-xs text-muted-foreground">
                  {currentNuance.drillQuestion.promptUz}
                </div>

                {(() => {
                  const userChoice = nuanceAnswers[currentNuance.id];
                  const answered = userChoice !== undefined;
                  const correctIdx = currentNuance.drillQuestion.correctIndex;

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                        {currentNuance.drillQuestion.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === correctIdx;
                          const isChosen = userChoice === optIdx;

                          let style =
                            'border-border/80 bg-background hover:bg-muted text-foreground';
                          if (answered) {
                            if (isCorrect) {
                              style =
                                'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                            } else if (isChosen) {
                              style =
                                'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={answered}
                              onClick={() =>
                                handleNuanceAnswer(currentNuance.id, optIdx, correctIdx)
                              }
                              className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all ${style}`}
                            >
                              <span>{opt}</span>
                              {answered && isCorrect && (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              )}
                              {answered && isChosen && !isCorrect && (
                                <XCircle size={16} className="text-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">Izoh: </span>
                          {currentNuance.drillQuestion.explanationUz}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. IMPLICIT MEANING & INFERENCE DOKKAI */}
      {/* ========================================================================= */}
      {activeSection === 'inference' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {N1_INFERENCE_QUESTIONS.map((inf, idx) => (
              <button
                key={inf.id}
                onClick={() => setSelectedInferenceIndex(idx)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedInferenceIndex === idx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <SearchCheck size={14} />
                <span>{inf.passageTitle.replace(/\[.*?\]/g, '').substring(0, 22)}...</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-4 border-b border-border/60 pb-3">
              <span className="rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-fuchsia-500">
                JLPT Oliy Daraja: Yashirin Ma&apos;no &amp; Xulosa (言外の意味)
              </span>
              <h3 className="mt-1 font-display text-lg font-black text-foreground md:text-xl">
                <FuriganaText text={currentInference.passageTitle} mode="hover" />
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Tahlil yo&apos;nalishi: </span>
                {currentInference.inferenceTheme}
              </p>
            </div>

            {/* Passage Text */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 font-serif text-sm leading-loose tracking-wide text-foreground">
              <FuriganaText text={currentInference.passageJp} mode="hover" />
            </div>

            <div className="mt-3 rounded-2xl border border-border/80 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">O&apos;zbekcha kontekst: </span>
              {currentInference.passageUz}
            </div>

            {/* Inference Question Prompt */}
            <div className="mt-6 border-t border-border/60 pt-5">
              <div className="mb-2 text-sm font-bold text-foreground">
                <FuriganaText text={currentInference.questionJp} mode="hover" />
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                {currentInference.questionUz}
              </div>

              {(() => {
                const userChoice = inferenceAnswers[currentInference.id];
                const answered = userChoice !== undefined;

                return (
                  <div className="space-y-3">
                    {currentInference.options.map((opt, optIdx) => {
                      const isChosen = userChoice === optIdx;
                      let style = 'border-border/80 bg-background hover:bg-muted text-foreground';

                      if (answered) {
                        if (opt.isCorrect) {
                          style =
                            'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold';
                        } else if (isChosen) {
                          style = 'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-300';
                        }
                      }

                      return (
                        <div key={optIdx} className="space-y-1">
                          <button
                            disabled={answered}
                            onClick={() =>
                              handleInferenceAnswer(currentInference.id, optIdx, opt.isCorrect)
                            }
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-all ${style}`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold">
                              {optIdx + 1}
                            </span>
                            <div className="flex-1">
                              <div>{opt.textJp}</div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {opt.textUz}
                              </div>
                            </div>
                            {answered && opt.isCorrect && (
                              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                            )}
                            {answered && isChosen && !opt.isCorrect && (
                              <XCircle size={16} className="shrink-0 text-rose-500" />
                            )}
                          </button>

                          {answered && (
                            <div className="ml-8 rounded-lg border border-border/60 bg-muted/20 p-2 text-[11px] text-muted-foreground">
                              <span className="font-bold text-foreground">
                                Tuzoq turi: {opt.trapType}
                              </span>
                              <div className="mt-0.5">{opt.distractorRationaleUz}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {answered && (
                      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                        <div className="mb-1 flex items-center gap-1.5 font-bold text-primary">
                          <Lightbulb size={14} />
                          <span>Mantiqiy Isbot Zanjiri (論理の推論プロセス):</span>
                        </div>
                        {currentInference.logicalProofChainUz}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default N1AdvancedMasteryHub;
