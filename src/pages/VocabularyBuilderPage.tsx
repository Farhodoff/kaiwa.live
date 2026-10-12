import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Volume2,
  Plus,
  Check,
  Bookmark,
  History,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { generateAIResponse, extractJsonFromAiResponse } from '../utils/ai/aiCore';
import { speakText } from '../utils/audioTts';
import { useStudyData } from '../context/StudyPlannerContext';
import { FuriganaText } from '../components/jlpt/FuriganaText';
import { supabase } from '../lib/supabase';
import { toDeterministicUUID } from '../utils/uuid';
import { isSuperAdmin } from '../utils/admin';
import { useLanguage } from '../context/LanguageContext';
import { findLanguageSubject, getOrEnsureLanguageSubject } from '../utils/subjectResolver';
import { PitchAccentService, PitchAccentInfo } from '../services/PitchAccentService';
import { PitchAccentModal } from '../components/speaking/PitchAccentModal';
import { PitchAccentTrainer } from '../components/speaking/PitchAccentTrainer';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

export interface VocabWordDetails {
  word: string;
  language: 'en' | 'ja';
  phonetic?: string;
  furigana?: string;
  level: string; // e.g. B2, C1, C2, N3, N2, N1
  partOfSpeech: string;
  uzbekTranslation: string;
  definition: string;
  synonyms: string[];
  collocations: string[];
  examples: { sentence: string; translation: string }[];
}

export const VocabularyBuilderPage: React.FC = () => {
  const { user, subjects, addFlashcard, addSubject, primaryLanguage } = useStudyData();
  const { language } = useLanguage();
  const { haptics } = useTelegramWebApp();
  const isSuper = isSuperAdmin(user?.email, user?.role);

  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [pitchTrainerOpen, setPitchTrainerOpen] = useState(false);

  const BUILTIN_VOCAB_DB: Record<string, VocabWordDetails> = {
    維持: {
      word: '維持',
      language: 'ja',
      phonetic: 'いじ (iji)',
      furigana: '維[い]持[じ]',
      level: 'N2',
      partOfSpeech: '名詞・サ変 (Noun, suru verb)',
      uzbekTranslation: 'Saqlab turish, davom ettirish (Hold/Maintenance)',
      definition: '物事の状態をそのまま保ち続けること。衰えたり失われたりしないように支えること。',
      synonyms: ['保持 (ほじ)', '存続 (そんぞく)', '継続 (けいぞく)', '保全 (ほぜん)'],
      collocations: ['現状を維持する', '健康を維持する', '良好な関係を維持する', '維持管理費'],
      examples: [
        {
          sentence: '高いモチベーションを長期的に維持することが、JLPT合格において最も重要です。',
          translation:
            "Yuqori motivatsiyani uzoq muddat saqlab turish til o'rganishda eng muhim omildir.",
        },
        {
          sentence: 'この歴史的な日本庭園は、市民の協力によって美しく維持されています。',
          translation: "Ushbu tarixiy bog' shahar aholisi ko'magida chiroyli saqlab turilmoqda.",
        },
        {
          sentence: '健康と体力を維持するため、毎朝30分の運動を欠かさず行っています。',
          translation: "Sog'lik va quvvatni saqlash uchun har kuni ertalab mashq qilaman.",
        },
      ],
    },
    挑戦: {
      word: '挑戦',
      language: 'ja',
      phonetic: 'ちょうせん (chousen)',
      furigana: '挑[ちょう]戦[せん]',
      level: 'N2',
      partOfSpeech: '名詞・サ変 (Noun, suru verb)',
      uzbekTranslation: "Sinov, chaqiruv, o'zini sinab ko'rish (Challenge)",
      definition: '困難な事柄や新しい領域に積極的に立ち向かうこと。',
      synonyms: ['チャレンジ (challenge)', '試み (こころみ)', '立ち向かう (たちむかう)'],
      collocations: ['新しい挑戦', '限界に挑戦する', '難関試験に挑戦する'],
      examples: [
        {
          sentence: '失敗を恐れず、常に新しい分野へ挑戦し続ける姿勢が大切です。',
          translation: "Xatolardan qo'rqmay, doimo yangi sohalarga intilish muhimdir.",
        },
        {
          sentence: '彼は今年、JLPT N1の合格を目指して全力で挑戦しています。',
          translation:
            "U bu yil JLPT N1 darajasini qo'lga kiritish uchun bor kuchi bilan harakat qilmoqda.",
        },
      ],
    },
    勉強: {
      word: '勉強',
      language: 'ja',
      phonetic: 'べんきょう (benkyou)',
      furigana: '勉[べん]強[きょう]',
      level: 'N5',
      partOfSpeech: '名詞・サ変 (Noun, suru verb)',
      uzbekTranslation: "O'qish, o'rganish, saboq (Study)",
      definition: '学問や技術を身につけるために努力すること。経験から教訓を得ること。',
      synonyms: ['学習 (がくしゅう)', '学問 (がくもん)', '研究 (けんきゅう)'],
      collocations: ['日本語を勉強する', '勉強に励む', '大変勉強になりました'],
      examples: [
        {
          sentence: '毎晩AIコーチと一緒に日本語の発音と会話を勉強しています。',
          translation: "Har oqshom AI ustoz bilan birga yapon tili talaffuzini o'rganaman.",
        },
        {
          sentence: '今回のプロジェクトは、私にとって非常に大きな勉強になりました。',
          translation: "Bu galgi loyiha men uchun juda katta saboq bo'ldi.",
        },
      ],
    },
  };

  const [query, setQuery] = useState('維持');
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<VocabWordDetails | null>(
    () => BUILTIN_VOCAB_DB['維持'],
  );

  const currentPitchInfo: PitchAccentInfo | null = React.useMemo(() => {
    if (!currentResult || currentResult.language !== 'ja') return null;
    return PitchAccentService.getPitchAccent(
      currentResult.word,
      currentResult.furigana || currentResult.phonetic,
    );
  }, [currentResult]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isAddedToFlashcards, setIsAddedToFlashcards] = useState(false);

  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'history'>('search');
  const [history, setHistory] = useState<VocabWordDetails[]>(() => [BUILTIN_VOCAB_DB['維持']]);
  const [savedWords, setSavedWords] = useState<VocabWordDetails[]>([]);

  const SAMPLE_WORDS = [
    { label: '勉強 (N5)', query: '勉強' },
    { label: '約束 (N4)', query: '約束' },
    { label: '習慣 (N3)', query: '習慣' },
    { label: '維持 (N2)', query: '維持' },
    { label: '挑戦 (N2)', query: '挑戦' },
    { label: '継続 (N1)', query: '継続' },
    { label: '妥協 (N1)', query: '妥協' },
  ];

  useEffect(() => {
    // Load from localStorage as fallback
    try {
      const h = localStorage.getItem('study_planner_vocab_history');
      if (h) setHistory(JSON.parse(h));

      const s = localStorage.getItem('study_planner_vocab_saved');
      if (s) setSavedWords(JSON.parse(s));
    } catch (e) {
      console.error(e);
    }

    // Load from Supabase DB (user_saved_vocabulary table + metadata fallback)
    const fetchDbVocab = async () => {
      try {
        const targetUserId = user?.id;
        if (!targetUserId) return;

        // 1. Fetch saved words from user_saved_vocabulary table
        const { data: dbSavedRows, error: dbErr } = await supabase
          .from('user_saved_vocabulary')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!dbErr && dbSavedRows && dbSavedRows.length > 0) {
          const mappedSaved: VocabWordDetails[] = dbSavedRows.map((r) => ({
            word: r.term,
            language: (r.language || 'ja') as 'en' | 'ja',
            reading: r.reading || undefined,
            furigana: r.reading || undefined,
            level: 'N3',
            partOfSpeech: '',
            uzbekTranslation: r.meaning,
            definition: r.meaning,
            synonyms: [],
            collocations: [],
            examples: r.example_sentence
              ? [{ sentence: r.example_sentence, translation: r.example_translation || '' }]
              : [],
          }));
          setSavedWords(mappedSaved);
          localStorage.setItem('study_planner_vocab_saved', JSON.stringify(mappedSaved));
        } else if (user.user_metadata?.vocab_saved) {
          // Fallback to user_metadata
          const dbS = user.user_metadata.vocab_saved;
          setSavedWords(dbS);
          localStorage.setItem('study_planner_vocab_saved', JSON.stringify(dbS));
        }

        if (user.user_metadata?.vocab_history) {
          const dbH = user.user_metadata.vocab_history;
          setHistory(dbH);
          localStorage.setItem('study_planner_vocab_history', JSON.stringify(dbH));
        }
      } catch (err) {
        console.warn('Failed to fetch DB vocab state:', err);
      }
    };
    fetchDbVocab();
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      const isJa = !isSuper || primaryLanguage === 'ja';
      const matched = findLanguageSubject(subjects, isJa ? 'ja' : 'en');
      setSelectedSubjectId(matched ? matched.id : subjects[0].id);
    }
  }, [subjects, selectedSubjectId, isSuper, primaryLanguage]);

  const handleSearch = async (targetQuery?: string) => {
    const searchTerm = (targetQuery || query).trim();
    if (!searchTerm) return;

    haptics.impact('light');
    setIsSearching(true);
    setErrorMsg(null);
    setIsAddedToFlashcards(false);

    // Check local preloaded entries for instant zero-latency dictionary hit
    if (BUILTIN_VOCAB_DB[searchTerm]) {
      const hit = BUILTIN_VOCAB_DB[searchTerm];
      setCurrentResult(hit);
      setIsSearching(false);
      const updatedHistory = [
        hit,
        ...history.filter((h) => h.word.toLowerCase() !== hit.word.toLowerCase()),
      ].slice(0, 30);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('study_planner_vocab_history', JSON.stringify(updatedHistory));
      } catch (e) {}
      return;
    }

    const prompt = `You are a professional linguist and dictionary expert for JLPT Japanese language students.
Analyze the following word or phrase: "${searchTerm}".

Return ONLY a raw valid JSON object (no markdown, no backticks) with this structure:
{
  "word": "${searchTerm}",
  "language": "en" | "ja",
  "phonetic": "IPA pronunciation or hiragana/romaji",
  "furigana": "Kanji[Furigana] format if Japanese, or empty string",
  "level": "B1" | "B2" | "C1" | "C2" | "N5" | "N4" | "N3" | "N2" | "N1",
  "partOfSpeech": "noun / verb / adjective / etc",
  "uzbekTranslation": "To'g'ri va aniq o'zbekcha tarjimasi",
  "definition": "Simple English/Japanese dictionary definition",
  "synonyms": ["synonym1", "synonym2", "synonym3", "synonym4"],
  "collocations": ["collocation 1", "collocation 2", "collocation 3"],
  "examples": [
    { "sentence": "Example sentence 1 in original language", "translation": "O'zbekcha tarjimasi 1" },
    { "sentence": "Example sentence 2 in original language", "translation": "O'zbekcha tarjimasi 2" },
    { "sentence": "Example sentence 3 in original language", "translation": "O'zbekcha tarjimasi 3" }
  ]
}`;

    try {
      const res = await generateAIResponse(
        [
          {
            role: 'system',
            content:
              'You are a dictionary JSON API provider. Return ONLY raw valid JSON object without markdown fences.',
          },
          { role: 'user', content: prompt },
        ],
        { isJson: true },
      );

      const parsed = extractJsonFromAiResponse<VocabWordDetails>(res);
      if (!parsed || !parsed.word) {
        throw new Error('Failed to parse dictionary structure');
      }
      setCurrentResult(parsed);

      // Pre-select matching subject for the analyzed word language
      const matchedSubject = findLanguageSubject(subjects, parsed.language || 'ja');
      if (matchedSubject) {
        setSelectedSubjectId(matchedSubject.id);
      }

      // Add to history
      const updatedHistory = [
        parsed,
        ...history.filter((h) => h.word.toLowerCase() !== parsed.word.toLowerCase()),
      ].slice(0, 30);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('study_planner_vocab_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn(e);
      }
      if (user) {
        supabase.auth
          .updateUser({ data: { vocab_history: updatedHistory } })
          .catch((err) => console.warn(err));
      }
    } catch (err: any) {
      console.error('Vocab search error:', err);
      if (BUILTIN_VOCAB_DB[searchTerm]) {
        setCurrentResult(BUILTIN_VOCAB_DB[searchTerm]);
      } else {
        setErrorMsg(
          language === 'ja'
            ? '単語の分析中にエラーが発生しました。もう一度お試しください。'
            : "So'zni tahlil qilishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSaveWord = (wordObj: VocabWordDetails) => {
    haptics.selection();
    const isSaved = savedWords.some((w) => w.word.toLowerCase() === wordObj.word.toLowerCase());
    let updated: VocabWordDetails[];
    if (isSaved) {
      updated = savedWords.filter((w) => w.word.toLowerCase() !== wordObj.word.toLowerCase());
    } else {
      updated = [wordObj, ...savedWords];
    }
    setSavedWords(updated);
    try {
      localStorage.setItem('study_planner_vocab_saved', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (user?.id) {
      const uuid = toDeterministicUUID(`vocab_${user.id}_${wordObj.word.toLowerCase()}`);
      if (!isSaved) {
        // Insert into user_saved_vocabulary table
        supabase
          .from('user_saved_vocabulary')
          .upsert({
            id: uuid,
            user_id: user.id,
            language: wordObj.language || 'ja',
            term: wordObj.word,
            reading: wordObj.furigana || wordObj.phonetic || null,
            meaning: wordObj.uzbekTranslation || wordObj.definition,
            example_sentence: wordObj.examples?.[0]?.sentence || null,
            example_translation: wordObj.examples?.[0]?.translation || null,
            is_saved: true,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.warn('[VocabularyBuilderPage] DB upsert error:', error);
          });
      } else {
        // Delete from user_saved_vocabulary table
        supabase
          .from('user_saved_vocabulary')
          .delete()
          .eq('id', uuid)
          .then(({ error }) => {
            if (error) console.warn('[VocabularyBuilderPage] DB delete error:', error);
          });
      }

      // Fallback metadata update
      supabase.auth
        .updateUser({ data: { vocab_saved: updated } })
        .catch((err) => console.warn(err));
    }
  };

  const handleCreateFlashcard = async () => {
    if (!currentResult) return;
    haptics.notification('success');

    let targetSubId = selectedSubjectId;
    if (!targetSubId) {
      targetSubId = await getOrEnsureLanguageSubject(
        subjects,
        addSubject,
        currentResult.language || 'ja',
      );
      setSelectedSubjectId(targetSubId);
    }

    const front =
      currentResult.furigana ||
      `${currentResult.word} (${currentResult.partOfSpeech}) [${currentResult.level}]`;
    const back = `Tarjimasi: ${currentResult.uzbekTranslation}\nTa'rifi: ${currentResult.definition}\nCollocations: ${currentResult.collocations.join(', ')}\n\nMisol: ${currentResult.examples[0]?.sentence || ''}`;

    await addFlashcard({
      subjectId: targetSubId || undefined,
      front,
      back,
    });

    setIsAddedToFlashcards(true);
    setTimeout(() => setIsAddedToFlashcards(false), 3000);

    // Record activity in ActivityLoggingService
    try {
      await ActivityLoggingService.logActivity(
        {
          activityType: 'flashcards',
          activityTitle: `Lug'atdan yangi so'z: ${currentResult.word}`,
          durationMinutes: 1,
          itemsCount: 1,
          xpEarned: 10,
          metadata: {
            word: currentResult.word,
            level: currentResult.level,
            subjectId: targetSubId,
          },
        },
        user?.id,
      );
    } catch (e) {
      console.warn('[VocabularyBuilderPage] Failed to log activity:', e);
    }
  };

  const isCurrentSaved = currentResult
    ? savedWords.some((w) => w.word.toLowerCase() === currentResult.word.toLowerCase())
    : false;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pb-16 md:p-8">
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">AI Lug‘at</span> — yangi so‘z tahlili uchun.
          Tayyor JLPT ro‘yxatlar Goi bo‘limida.
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptics.selection();
              setPitchTrainerOpen(true);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-500 transition-all hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-400"
          >
            <TrendingUp size={14} />
            <span>Pitch Accent Studio</span>
          </button>
          <a
            href="/jlpt?tab=goi"
            className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
          >
            Goi ro‘yxatiga o‘tish
          </a>
        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-xs">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {language === 'ja' ? 'AI単語帳・辞書ビルダー' : 'Smart Vocabulary Builder'}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {language === 'ja'
                ? 'JLPTの単語をリアルタイムでAI分析。意味・例文・類語・漢字の読み方を瞬時に学習できます。'
                : "JLPT N5–N1 yapon tili lug'at boyligingizni oshiring, Kanji, sinonimlar va misollar o'rganing."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl border border-border bg-muted/60 p-1.5">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search size={14} /> {language === 'ja' ? '検索' : 'Qidiruv'}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark size={14} />{' '}
            {language === 'ja'
              ? `保存済み (${savedWords.length})`
              : `Saqlanganlar (${savedWords.length})`}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={14} /> {language === 'ja' ? '履歴' : 'Tarix'}
          </button>
        </div>
      </div>

      {/* TAB 1: SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input Bar */}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={
                    language === 'ja'
                      ? '単語を入力してEnter（例: 勉強, 維持, 習慣, 挑戦）...'
                      : "So'z kiritib Enter bosing (masalan: 勉強, 維持, 習慣, 挑戦)..."
                  }
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={isSearching || !query.trim()}
                className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {isSearching ? (
                  <Sparkles size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                <span>
                  {isSearching
                    ? language === 'ja'
                      ? '分析中...'
                      : 'Tahlil qilinmoqda...'
                    : language === 'ja'
                      ? 'AI分析'
                      : 'AI Tahlil'}
                </span>
              </button>
            </div>

            {/* Sample topics */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {language === 'ja' ? 'おすすめ単語:' : 'Namunalar:'}
              </span>
              {SAMPLE_WORDS.map((w, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(w.query);
                    handleSearch(w.query);
                  }}
                  className="cursor-pointer rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95"
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-500">
              {errorMsg}
            </div>
          )}

          {/* Search Result Card */}
          {currentResult && (
            <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              {/* Word Top Header */}
              <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-3xl font-black text-foreground">
                      {currentResult.furigana ? (
                        <FuriganaText text={currentResult.furigana} />
                      ) : (
                        currentResult.word
                      )}
                    </h2>
                    <span className="rounded-full border border-[#C9A961]/30 bg-[#C9A961]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#C9A961]">
                      {currentResult.level}
                    </span>
                    <span className="font-serif text-xs italic text-muted-foreground">
                      ({currentResult.partOfSpeech})
                    </span>
                    {currentPitchInfo && (
                      <button
                        onClick={() => {
                          haptics.selection();
                          setPitchModalOpen(true);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-extrabold text-indigo-500 transition-all hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-400"
                        title="Tokyo standarti bo'yicha Pitch Accent (Ohang) grafigini ko'rish"
                      >
                        <TrendingUp size={13} />
                        <span>
                          {currentPitchInfo.pitchTypeNameUz} [{currentPitchInfo.pitchPatternNumber}]
                        </span>
                      </button>
                    )}
                  </div>
                  {currentResult.phonetic && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {currentResult.phonetic}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentPitchInfo && (
                    <button
                      onClick={() => {
                        haptics.selection();
                        setPitchModalOpen(true);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs font-bold text-indigo-500 transition-all hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-400"
                      title="Pitch Accent Tahlili"
                    >
                      <TrendingUp size={18} />
                      <span>{language === 'ja' ? 'アクセント' : 'Ohang'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      haptics.impact('light');
                      speakText(
                        currentResult.word,
                        currentResult.language === 'ja' ? 'ja-JP' : 'en-US',
                      );
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-muted p-3 text-xs font-bold text-foreground transition-all hover:bg-muted/80 active:scale-95"
                  >
                    <Volume2 size={18} className="text-primary" />
                    <span>{language === 'ja' ? '発音' : 'Talaffuz'}</span>
                  </button>
                  <button
                    onClick={() => toggleSaveWord(currentResult)}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all active:scale-95 ${
                      isCurrentSaved
                        ? 'border-[#C9A961]/40 bg-[#C9A961]/15 text-[#C9A961]'
                        : 'border-border bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Bookmark size={18} className={isCurrentSaved ? 'fill-current' : ''} />
                    <span>
                      {language === 'ja'
                        ? isCurrentSaved
                          ? '保存済み'
                          : '保存する'
                        : isCurrentSaved
                          ? 'Saqlangan'
                          : 'Saqlash'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Uzbek / Japanese Translation & Definition */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1 rounded-2xl border border-l-4 border-border border-l-primary bg-card p-5 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    {language === 'ja' ? '主な意味・対訳' : "O'zbekcha Tarjima"}
                  </span>
                  <p className="text-xl font-bold text-foreground">
                    {currentResult.uzbekTranslation}
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl border border-border bg-muted/30 p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === 'ja' ? '定義・解説' : "Ta'rif (Definition)"}
                  </span>
                  <p className="text-sm font-medium text-foreground">{currentResult.definition}</p>
                </div>
              </div>

              {/* Synonyms & Collocations */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {currentResult.synonyms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {language === 'ja' ? '類義語・同義語' : 'Sinonimlar'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentResult.synonyms.map((syn, i) => (
                        <span
                          key={i}
                          className="rounded-xl border border-border bg-muted px-3 py-1 text-xs font-bold text-foreground"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentResult.collocations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {language === 'ja'
                        ? 'コロケーション・連語'
                        : "Collocations (So'z birikmalari)"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentResult.collocations.map((col, i) => (
                        <span
                          key={i}
                          className="rounded-xl border border-border bg-muted/80 px-3 py-1 text-xs font-semibold text-foreground"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Example Sentences — first visible, rest collapsed on mobile */}
              {currentResult.examples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {language === 'ja'
                      ? '実践例文'
                      : `Kontekstual Misollar (${currentResult.examples.length} ta gap)`}
                  </h4>
                  <div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-bold italic text-foreground">
                      1. "{currentResult.examples[0].sentence}"
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      ➔ {currentResult.examples[0].translation}
                    </p>
                  </div>
                  {currentResult.examples.length > 1 && (
                    <details className="rounded-2xl border border-border bg-muted/20">
                      <summary className="cursor-pointer p-4 text-xs font-bold text-primary">
                        {language === 'ja'
                          ? `他の例文 (${currentResult.examples.length - 1}件)`
                          : `Yana ${currentResult.examples.length - 1} ta misol`}
                      </summary>
                      <div className="space-y-3 px-4 pb-4">
                        {currentResult.examples.slice(1).map((ex, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-xs font-bold italic text-foreground">
                              {i + 2}. "{ex.sentence}"
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                              ➔ {ex.translation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* 1-Click Flashcard Creator Bar — open to all users (Discover -> SRS) */}
              {
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-bold text-muted-foreground">
                      {language === 'ja' ? '単語帳を選択:' : 'Fan tanlang:'}
                    </span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCreateFlashcard}
                    disabled={isAddedToFlashcards}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                      isAddedToFlashcards
                        ? 'bg-emerald-500 text-white'
                        : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90'
                    }`}
                  >
                    {isAddedToFlashcards ? (
                      <>
                        <Check size={16} />
                        <span>{language === 'ja' ? '追加完了！' : "Qo'shildi!"}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>
                          {language === 'ja' ? 'フラッシュカードに追加' : "Fleshkardga qo'shish"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              }
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED WORDS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedWords.length === 0 ? (
            <div className="space-y-2 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <Bookmark size={32} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">Saqlangan so'zlar yo'q</p>
              <p className="text-xs text-muted-foreground">
                Qidiruv davomida so'zlarni saqlab qo'yishingiz mumkin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedWords.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C9A961]">
                        {item.level}
                      </span>
                      <h3 className="mt-0.5 font-display text-xl font-black text-foreground">
                        {item.furigana ? <FuriganaText text={item.furigana} /> : item.word}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleSaveWord(item)}
                      className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-primary"
                      title="Saqlanganlardan o'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-foreground">{item.uzbekTranslation}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {item.definition}
                  </p>
                  <button
                    onClick={() => {
                      setCurrentResult(item);
                      setActiveTab('search');
                    }}
                    className="flex cursor-pointer items-center gap-1 pt-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Batafsil ko'rish <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="space-y-2 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <History size={32} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">Qidiruv tarixi bo'sh</p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentResult(item);
                    setActiveTab('search');
                  }}
                  className="flex cursor-pointer items-center justify-between p-4 transition-all hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[#C9A961]/30 bg-[#C9A961]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#C9A961]">
                      {item.level}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-foreground">
                        {item.furigana ? <FuriganaText text={item.furigana} /> : item.word}
                      </span>
                      <span className="ml-3 text-xs text-muted-foreground">
                        {item.uzbekTranslation}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pitch Accent Detail Modal */}
      <PitchAccentModal
        isOpen={pitchModalOpen}
        onClose={() => setPitchModalOpen(false)}
        accentInfo={currentPitchInfo}
        onOpenStudio={() => setPitchTrainerOpen(true)}
      />

      {/* Interactive Pitch Accent Studio Modal */}
      <PitchAccentTrainer isOpen={pitchTrainerOpen} onClose={() => setPitchTrainerOpen(false)} />
    </div>
  );
};

export default VocabularyBuilderPage;
