import { MasterySkill, MasteryStatus } from '../types/mastery';
import { JlptLevel, JLPT_BENCHMARKS } from './JlptReadinessService';
import {
  LevelSkillMatrixReport,
  SkillMatrixDefinition,
  CompetencyProgress,
  CompetencyResultRecord,
  EvidenceSourceSummary,
  ActivityFormat,
} from '../types/skillMatrix';
import { MasteryEngine, MASTERY_CONFIG } from './MasteryEngine';
import { resolveCategory } from '../types/learningEvidence';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

/**
 * Skill Matrix thresholds. Keep in sync with the retention requirement documented
 * in kamchilik.md (retention >= 80%) and the Skill Matrix UI copy.
 */
export const SKILL_MATRIX_CONFIG = {
  retentionThreshold: MASTERY_CONFIG.retentionThreshold,
  multiFormatMinAccuracy: 80,
  requiredFormats: 2,
  masteryThreshold: MASTERY_CONFIG.masteredThreshold,
  recentAttemptWindow: 5,
} as const;

interface SpeakingCriteria {
  pronunciation?: number;
  fluency?: number;
  grammar?: number;
  vocabulary?: number;
  overall?: number;
}

interface NormalizedAttempt {
  skill: MasterySkill;
  format: ActivityFormat;
  accuracy: number;
  timestamp: string;
  source: string;
  competencyId?: string;
  criteria?: SpeakingCriteria;
}

const SPEAKING_COMPETENCY_CRITERIA: Record<string, keyof SpeakingCriteria> = {
  pronunciation_pitch: 'pronunciation',
  fluency_hesitation: 'fluency',
  situational_roleplay: 'overall',
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const normalizePercent = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value > 0 && value <= 10) return clampPercent(value * 10);
  return clampPercent(value);
};

const parseJsonObject = (value: unknown): Record<string, any> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const average = (values: number[]): number =>
  values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const toActivityFormat = (activityType?: string, skill?: MasterySkill): ActivityFormat => {
  switch (activityType) {
    case 'srs_review':
      return 'srs';
    case 'reading':
      return 'reading_passage';
    case 'listening':
      return 'audio';
    case 'speaking':
      return 'speech';
    case 'writing':
      return 'essay';
    case 'quiz':
    case 'vocabulary':
    case 'grammar':
    case 'diagnostic':
    default:
      return skill === 'listening' ? 'audio' : 'quiz';
  }
};

interface BaseCompetencyMeta {
  id: string;
  category: string;
  name: { uz: string; ja: string; en: string };
  description: { uz: string; ja: string; en: string };
  targetWeight: number; // proportion of total skill target
  formats: ActivityFormat[];
  benchmarkRule: string;
}

const SKILL_COMPETENCY_BLUEPRINTS: Record<MasterySkill, BaseCompetencyMeta[]> = {
  vocabulary: [
    {
      id: 'active_recall',
      category: 'recall',
      name: {
        uz: 'Faol xotiradan chiqarish (Active Recall)',
        ja: '想起・アウトプット',
        en: 'Active Recall',
      },
      description: {
        uz: "O'zbekcha yoki kontekstdan yaponcha so'zni eslab aytish va yozish",
        ja: '文脈や母国語から能動的に日本語単語を想起する力',
        en: 'Recalling and producing words from prompts or contexts',
      },
      targetWeight: 0.35,
      formats: ['srs', 'fill_in_the_blank', 'speech'],
      benchmarkRule: 'Kamida 80% aniqlik bilan eslab qolish',
    },
    {
      id: 'passive_recognition',
      category: 'recognition',
      name: {
        uz: 'Passiv tanish (Reading & Context Recognition)',
        ja: '読解・受動的認識',
        en: 'Passive Recognition',
      },
      description: {
        uz: "Yaponcha matnda so'zni ko'rganda ma'nosini tezkor tushunish",
        ja: '文章や会話の中で単語を見て即座に意味を理解する力',
        en: 'Recognizing word meanings quickly while reading or listening',
      },
      targetWeight: 0.35,
      formats: ['quiz', 'srs', 'reading_passage'],
      benchmarkRule: 'Matnda 85%+ aniqlik bilan ma’nosini aniqlash',
    },
    {
      id: 'collocations_compounds',
      category: 'collocations',
      name: {
        uz: 'Birikmalar & Jukugo (Collocations)',
        ja: 'コロケーション・熟語',
        en: 'Collocations & Jukugo',
      },
      description: {
        uz: "So'zlarning fe'llar va predloglar bilan tabiiy bog'lanishi",
        ja: '動詞や助詞との自然な結びつき・熟語の使いこなし',
        en: 'Natural pairing with verbs, particles, and compound words',
      },
      targetWeight: 0.15,
      formats: ['quiz', 'sentence_ordering'],
      benchmarkRule: 'Birikmali savollarda 80%+ natija',
    },
    {
      id: 'nuance_context',
      category: 'nuance',
      name: {
        uz: 'Kontekstual nozikliklar (Nuances)',
        ja: 'ニュアンス・使い分け',
        en: 'Nuance & Register',
      },
      description: {
        uz: "O'xshash so'zlar orasidagi farq va to'g'ri o'rinda qo'llash",
        ja: '類似語のニュアンスの違いと適切な場面での使い分け',
        en: 'Distinguishing near-synonyms and appropriate situational context',
      },
      targetWeight: 0.15,
      formats: ['quiz', 'fill_in_the_blank'],
      benchmarkRule: 'Chalg‘ituvchi javoblarda (distractors) to‘g‘ri farqlash',
    },
  ],

  grammar: [
    {
      id: 'particles',
      category: 'core',
      name: {
        uz: 'Zarrachalar (Particles - Joshi)',
        ja: '助詞の完全習得',
        en: 'Particles Mastery',
      },
      description: {
        uz: "は, が, を, に, で, へ, と, から, まで zarrachalarini xatosiz qo'llash",
        ja: '助詞（は・が・を・に・で・へなど）の機能と正確な使い分け',
        en: 'Flawless usage of Japanese case, topic, and directional particles',
      },
      targetWeight: 0.3,
      formats: ['quiz', 'fill_in_the_blank', 'sentence_ordering'],
      benchmarkRule: 'Zarrachalar testida 85%+ aniqlik',
    },
    {
      id: 'conjugations',
      category: 'verbs',
      name: { uz: 'Tuslanishlar (Conjugations)', ja: '動詞・形容詞の活用', en: 'Conjugations' },
      description: {
        uz: "Te-forma, nai-forma, shart mayllari, majhul va majburiy fe'llar",
        ja: 'て形・ない形・仮定形（ば・たら）・受身・使役の即座の変換',
        en: 'Conjugating verb bases (te, nai, conditional, passive, causative)',
      },
      targetWeight: 0.3,
      formats: ['quiz', 'fill_in_the_blank'],
      benchmarkRule: 'Tuslanish formulalarini 85%+ to‘g‘ri shakllantirish',
    },
    {
      id: 'sentence_patterns',
      category: 'patterns',
      name: {
        uz: 'Daraja formulalari (Sentence Patterns)',
        ja: '文型パターン',
        en: 'Sentence Patterns',
      },
      description: {
        uz: 'Har bir darajaga xos asosiy grammatik konstruksiyalar',
        ja: 'JLPT各レベル必須の重要文法パターンの習得',
        en: 'Level-specific standard JLPT sentence structures',
      },
      targetWeight: 0.25,
      formats: ['quiz', 'sentence_ordering'],
      benchmarkRule: 'Grammatika savollarida 85%+ o‘zlashtirish',
    },
    {
      id: 'keigo_and_register',
      category: 'register',
      name: { uz: 'Nutq uslublari & Keigo', ja: '敬語・待遇表現', en: 'Keigo & Speech Register' },
      description: {
        uz: "Oddiy, xushmuomala, sonkeigo va kenjougo uslublarini to'g'ri qo'llash",
        ja: '普通体・丁寧体・尊敬語・謙譲語の適切な使い分け',
        en: 'Honorifics, humble forms, and register appropriateness',
      },
      targetWeight: 0.15,
      formats: ['quiz', 'speech'],
      benchmarkRule: 'Situatsion muloqot va testda 80%+ natija',
    },
  ],

  kanji: [
    {
      id: 'stroke_order_writing',
      category: 'writing',
      name: {
        uz: 'Chizish tartibi & Yozuv (Stroke Order)',
        ja: '筆順・手書き認識',
        en: 'Stroke Order & Canvas',
      },
      description: {
        uz: "Chiziqlar ketma-ketligi qoidalari va ekranda to'g'ri chizish",
        ja: '正しい書き順の習得と画面上での正確なストローク入力',
        en: 'Accurate stroke sequences and tactile digital handwriting',
      },
      targetWeight: 0.25,
      formats: ['canvas', 'quiz'],
      benchmarkRule: 'Canvas mashqida 80%+ to‘g‘ri chizish',
    },
    {
      id: 'readings_onyomi_kunyomi',
      category: 'reading',
      name: {
        uz: "Onyomi & Kunyomi o'qilishlari",
        ja: '音読み・訓読み',
        en: 'Onyomi & Kunyomi Readings',
      },
      description: {
        uz: "Xitoycha va yaponcha o'qilishlarini to'g'ri farqlash va qo'llash",
        ja: '単体訓読みと熟語音読みの確実な切り替えと発音',
        en: 'Mastering Sino-Japanese and native Japanese character readings',
      },
      targetWeight: 0.35,
      formats: ['quiz', 'srs'],
      benchmarkRule: 'O‘qilish testlarida 85%+ aniqlik',
    },
    {
      id: 'radicals_meaning',
      category: 'meaning',
      name: {
        uz: "Radikallar & Asosiy ma'nolar (Radicals)",
        ja: '部首・基本意味',
        en: 'Radicals & Core Meaning',
      },
      description: {
        uz: "Bushu (radikallar) orqali kanji ma'nosini mantiqiy anglash",
        ja: '部首の成り立ちと漢字の根底にあるコア意味の理解',
        en: 'Understanding semantic and phonetic components via radicals',
      },
      targetWeight: 0.2,
      formats: ['quiz', 'srs'],
      benchmarkRule: 'Radikallar va ma’no testida 80%+ natija',
    },
    {
      id: 'confusing_kanji',
      category: 'discrimination',
      name: {
        uz: "O'xshash kanjilarni farqlash (Discrimination)",
        ja: '類似漢字の識別',
        en: 'Confusing Kanji Comparison',
      },
      description: {
        uz: "Bir-biriga o'xshash kanjilarning nozik farqlarini topish",
        ja: '形が酷似した漢字（待/持、微/徴など）の識別力',
        en: 'Differentiating visually similar and easily confused kanji',
      },
      targetWeight: 0.2,
      formats: ['quiz'],
      benchmarkRule: 'Chalg‘ituvchi kanji savollarida 85%+ aniqlik',
    },
  ],

  reading: [
    {
      id: 'short_passages',
      category: 'tandokkai',
      name: { uz: 'Qisqa matnlar (Short Passages)', ja: '短文読解', en: 'Short Passages' },
      description: {
        uz: "150-200 belgidan iborat kundalik va e'lon xabarlarini tezkor tushunish",
        ja: '150〜200字程度のメモ・指示文・短文の要点把握',
        en: 'Rapid comprehension of short instructional or notice texts',
      },
      targetWeight: 0.3,
      formats: ['reading_passage', 'quiz'],
      benchmarkRule: 'Qisqa matnlar bo‘yicha 85%+ to‘g‘ri javob',
    },
    {
      id: 'medium_long_passages',
      category: 'chuudokkai',
      name: {
        uz: "O'rta va uzun matnlar (Medium & Long)",
        ja: '中・長文読解',
        en: 'Medium & Long Passages',
      },
      description: {
        uz: '400-800 belgilik tushuntirish, insho va maqolalarning mantiqiy zanjirini tushunish',
        ja: '論理展開・段落間の関係・エッセイや論説文の正確な読解',
        en: 'Comprehending logical structure and arguments in longer texts',
      },
      targetWeight: 0.35,
      formats: ['reading_passage', 'quiz'],
      benchmarkRule: 'Mantiqiy savollarda 80%+ aniqlik',
    },
    {
      id: 'information_retrieval',
      category: 'kensaku',
      name: {
        uz: "Ma'lumot qidirish (Information Retrieval)",
        ja: '情報検索',
        en: 'Information Retrieval',
      },
      description: {
        uz: "Jadvallar, e'lonlar, qo'llanmalardan kerakli ma'lumotni tezkor topish",
        ja: 'ポスター・チラシ・案内板から条件に合う情報を迅速に検索',
        en: 'Locating specific targeted data in brochures, schedules, and charts',
      },
      targetWeight: 0.2,
      formats: ['reading_passage', 'quiz'],
      benchmarkRule: 'Vaqt mezonida 85%+ aniqlik',
    },
    {
      id: 'inferences_and_intent',
      category: 'inference',
      name: {
        uz: "Muallif maqsadi & Yashirin ma'no (Inference)",
        ja: '筆者の意図・推論',
        en: 'Inference & Author Intent',
      },
      description: {
        uz: "Matnda ochiq aytilmagan xulosa va muallifning haqiqiy nuqtai nazarini ilg'ash",
        ja: '直接書かれていない文脈上の含意や筆者の真の主張を読み取る力',
        en: 'Deducing subtext, tone, and unstated conclusions from context',
      },
      targetWeight: 0.15,
      formats: ['reading_passage', 'quiz'],
      benchmarkRule: 'Inference savollarida 80%+ muvaffaqiyat',
    },
  ],

  listening: [
    {
      id: 'task_comprehension',
      category: 'kadai_rikai',
      name: {
        uz: 'Vazifani tushunish (Task-Based Listening)',
        ja: '課題理解',
        en: 'Task Comprehension',
      },
      description: {
        uz: "Suhbatdosh nima qilishi kerakligini (keyingi qadam) to'g'ri aniqlash",
        ja: '「この後、何をしますか」等の具体的な行動タスクの把握',
        en: 'Identifying concrete action steps and next tasks from spoken dialogue',
      },
      targetWeight: 0.3,
      formats: ['audio', 'quiz'],
      benchmarkRule: 'Amaliy vazifa savollarida 85%+ aniqlik',
    },
    {
      id: 'key_point_retrieval',
      category: 'pointo_rikai',
      name: { uz: "Asosiy nuqtani ilg'ash (Key Points)", ja: 'ポイント理解', en: 'Key Points' },
      description: {
        uz: 'Sabab, vaqt, raqam va shartlar kabi tayanch detallarni ajratib olish',
        ja: '理由・条件・時間・場所などの核心ポイントの聞き取り',
        en: 'Pinpointing vital constraints (reasons, times, prerequisites)',
      },
      targetWeight: 0.3,
      formats: ['audio', 'quiz'],
      benchmarkRule: 'Detallarga yo‘naltirilgan audiolarda 80%+ natija',
    },
    {
      id: 'quick_response',
      category: 'sokuji_outou',
      name: { uz: 'Tezkor javob (Quick Response)', ja: '即時応答', en: 'Quick Response' },
      description: {
        uz: "Qisqa gapga zudlik bilan eng tabiiy va to'g'ri javobni tanlash",
        ja: '短い呼びかけに対して間髪を入れずに最も自然な返答を選ぶ',
        en: 'Instant selection of the most natural conversational reply',
      },
      targetWeight: 0.25,
      formats: ['audio', 'quiz'],
      benchmarkRule: 'Tezkor javoblarda 85%+ aniqlik',
    },
    {
      id: 'general_understanding',
      category: 'gaiyou_rikai',
      name: { uz: 'Umumiy mazmun (General Overview)', ja: '概要理解', en: 'General Overview' },
      description: {
        uz: 'Uzunroq nutq yoki suhbatning umumiy mavzusi va xulosasini tushunish',
        ja: '長めのスピーチやニュース全体の主旨・結論の的確な要約',
        en: 'Synthesizing the overall gist and conclusion of announcements',
      },
      targetWeight: 0.15,
      formats: ['audio', 'quiz'],
      benchmarkRule: 'Umumiy mazmun savollarida 80%+ aniqlik',
    },
  ],

  writing: [
    {
      id: 'sentence_scramble',
      category: 'ordering',
      name: {
        uz: 'Gap tuzish (Sentence Ordering - ★ format)',
        ja: '語順整序・並び替え',
        en: 'Sentence Ordering',
      },
      description: {
        uz: "Tarqoq so'z va zarrachalardan mantiqiy to'g'ri yaponcha gap yig'ish",
        ja: 'バラバラの単語を文法的に正しい語順（JLPT星印★問題）に並べ替える',
        en: 'Unscrambling components into correct syntax (JLPT star items)',
      },
      targetWeight: 0.4,
      formats: ['sentence_ordering', 'quiz'],
      benchmarkRule: 'Gap yig‘ish mashqlarida 85%+ aniqlik',
    },
    {
      id: 'particle_insertion',
      category: 'particles',
      name: {
        uz: "Zarrachalarni to'g'ri qo'yish (Fill Particles)",
        ja: '助詞穴埋め記述',
        en: 'Particle Fill-in',
      },
      description: {
        uz: "Gap kontekstiga qarab to'g'ri zarrachani yozma kiritish",
        ja: '文脈に合わせて適切な助詞を自ら判断して入力する',
        en: 'Supplying accurate grammatical particles into blanks',
      },
      targetWeight: 0.3,
      formats: ['fill_in_the_blank', 'quiz'],
      benchmarkRule: 'Zarracha to‘ldirishda 85%+ aniqlik',
    },
    {
      id: 'free_expression_essay',
      category: 'sakubun',
      name: {
        uz: 'Erkin insho & Fikr ifodalash (Sakubun)',
        ja: '作文・表現力',
        en: 'Sakubun & Composition',
      },
      description: {
        uz: "Mavzu bo'yicha grammatik bog'langan, tabiiy jumlalardan iborat matn yozish",
        ja: '提示されたテーマについて文法的に正しく論理的な文章を執筆する',
        en: 'Drafting structured compositions with cohesive transitions',
      },
      targetWeight: 0.3,
      formats: ['essay'],
      benchmarkRule: 'AI va mezonlar bo‘yicha 80%+ ball',
    },
  ],

  speaking: [
    {
      id: 'pronunciation_pitch',
      category: 'pronunciation',
      name: {
        uz: 'Talaffuz & Pitch Ohang (Pronunciation)',
        ja: '発音・高低アクセント',
        en: 'Pronunciation & Pitch',
      },
      description: {
        uz: "Tovushlar tozaligi, cho'ziq unlilar (chouon) va yaponcha ohang aniqligi",
        ja: '長音・促音・高低アクセント（ピッチ）の正確な発声',
        en: 'Clear phonemes, vowel lengths, geminate consonants, and pitch accent',
      },
      targetWeight: 0.3,
      formats: ['speech'],
      benchmarkRule: 'AI baholashida 80%+ talaffuz balli',
    },
    {
      id: 'fluency_hesitation',
      category: 'fluency',
      name: {
        uz: "Ravonlik & Qat'iyatlilik (Fluency)",
        ja: '流暢さ・間（ま）の制御',
        en: 'Fluency & Pacing',
      },
      description: {
        uz: "To'xtalishlarsiz, tabiiy tezlikda va ishonchli so'zlashish",
        ja: '不要な言い淀み（えーと、あの等）を抑え、自然な速度で発話する',
        en: 'Smooth speech cadence without disruptive pauses or hesitation',
      },
      targetWeight: 0.3,
      formats: ['speech'],
      benchmarkRule: 'Fluency score 7.5/10 yoki 75%+',
    },
    {
      id: 'situational_roleplay',
      category: 'roleplay',
      name: {
        uz: 'Vaziyatli muloqot (Situational Dialogue)',
        ja: '場面別ロールプレイ',
        en: 'Situational Roleplay',
      },
      description: {
        uz: "Do'konda, stantsiyada, ofisda vaziyatga mos madaniy iboralarni qo'llash",
        ja: '買い物・道案内・職場など具体的なシチュエーションに応じた対話',
        en: 'Culturally appropriate communicative response in real-life contexts',
      },
      targetWeight: 0.4,
      formats: ['speech'],
      benchmarkRule: 'Speaking sessiyalarida 80%+ vaziyatga moslik',
    },
  ],
};

export class SkillMatrixService {
  /**
   * Generates authoritative JLPT Skill Matrix report for a user and level across all 7 skills.
   */
  public static computeLevelReport(
    level: JlptLevel = 'N5',
    userId: string = 'guest',
  ): LevelSkillMatrixReport {
    const benchmark = JLPT_BENCHMARKS[level] || JLPT_BENCHMARKS.N5;
    const masteryProfile = MasteryEngine.calculateMasteryProfile(userId, 'ja');
    const allEvidence = MasteryEngine.getUserEvidence(userId, 'ja');

    const cardsArray = this.readHistoryItems([
      'study_planner_flashcards',
      `study_planner_flashcards:${userId}`,
    ]);
    const kanjiCount = cardsArray.filter((c) => /[\u4e00-\u9faf]/.test(c.front || '')).length;
    const vocabCount = Math.max(cardsArray.length, 1);

    const writingHistory = this.readHistoryItems([
      'study_planner_jlpt_writing_history',
      'study_planner_ielts_writing_history',
      'study_planner_writing_history',
      `study_planner_jlpt_writing_history:${userId}`,
      `study_planner_ielts_writing_history:${userId}`,
      `study_planner_writing_history:${userId}`,
    ]);
    const speakingHistory = this.readHistoryItems([
      'study_planner_speaking_coach_sessions',
      'study_planner_speaking_history',
      `study_planner_speaking_history_${userId}`,
      `study_planner_speaking_coach_sessions:${userId}`,
      `study_planner_speaking_history:${userId}`,
    ]);

    const allSkills: MasterySkill[] = [
      'vocabulary',
      'grammar',
      'kanji',
      'reading',
      'listening',
      'writing',
      'speaking',
    ];
    const attemptsBySkill = {} as Record<MasterySkill, NormalizedAttempt[]>;
    for (const skill of allSkills) attemptsBySkill[skill] = [];

    for (const evidence of allEvidence) {
      if (resolveCategory(evidence) === 'completion') continue;
      const format = toActivityFormat(evidence.activityType, evidence.skill);
      const metadata = (evidence.metadata || {}) as Record<string, any>;
      const criteria = parseJsonObject(metadata.criteria) || undefined;
      attemptsBySkill[evidence.skill].push({
        skill: evidence.skill,
        format,
        accuracy: normalizePercent(evidence.accuracy ?? evidence.score) ?? 0,
        timestamp: evidence.timestamp,
        source: evidence.source || evidence.activityType || 'mastery_evidence',
        competencyId: typeof metadata.competencyId === 'string' ? metadata.competencyId : undefined,
        criteria: criteria
          ? {
              pronunciation: normalizePercent(criteria.pronunciation) ?? undefined,
              fluency: normalizePercent(criteria.fluency) ?? undefined,
              grammar: normalizePercent(criteria.grammar) ?? undefined,
              vocabulary: normalizePercent(criteria.vocabulary) ?? undefined,
              overall: normalizePercent(criteria.overall) ?? undefined,
            }
          : undefined,
      });
    }

    for (const item of writingHistory) {
      const attempt = this.toWritingAttempt(item);
      if (attempt) attemptsBySkill.writing.push(attempt);
    }

    for (const item of speakingHistory) {
      const attempt = this.toSpeakingAttempt(item);
      if (attempt) attemptsBySkill.speaking.push(attempt);
    }

    const flashcardRetention = this.computeFlashcardRetention(cardsArray);

    const targetCounts: Record<MasterySkill, number> = {
      vocabulary: benchmark.vocabTarget,
      grammar: benchmark.grammarTarget,
      kanji: benchmark.kanjiTarget,
      reading: benchmark.readingTarget,
      listening: benchmark.listeningTarget,
      writing: Math.max(5, Math.round(benchmark.grammarTarget * 0.2)),
      speaking: benchmark.speakingTarget,
    };

    const routes: Record<MasterySkill, string> = {
      vocabulary: '/decks',
      grammar: '/jlpt?tab=grammar',
      kanji: '/jlpt?tab=kanji',
      reading: '/jlpt?tab=reading',
      listening: '/jlpt?tab=listening',
      writing: '/jlpt?tab=writing',
      speaking: '/coach',
    };

    const icons: Record<MasterySkill, string> = {
      vocabulary: 'BookOpen',
      grammar: 'Sparkles',
      kanji: 'PenTool',
      reading: 'FileText',
      listening: 'Headphones',
      writing: 'Edit3',
      speaking: 'Mic',
    };

    const skillsMap = {} as Record<MasterySkill, SkillMatrixDefinition>;
    let totalCompetencies = 0;
    let masteredCompetencies = 0;
    let masteredSkills = 0;
    const weaknesses: LevelSkillMatrixReport['topWeaknesses'] = [];
    const competencyResults: CompetencyResultRecord[] = [];
    const generatedAt = new Date().toISOString();

    for (const skill of allSkills) {
      const blueprints = SKILL_COMPETENCY_BLUEPRINTS[skill] || [];
      const skillTarget = targetCounts[skill];
      const skillAttempts = attemptsBySkill[skill].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const recentAccuracy = this.calculateRecentAccuracy(skillAttempts);
      const multiFormatPassed = this.hasMultiFormatEvidence(skillAttempts);

      let currentSkillCount = 0;
      if (skill === 'vocabulary') currentSkillCount = vocabCount;
      else if (skill === 'kanji') currentSkillCount = kanjiCount;
      else if (skill === 'grammar') {
        const completedLessons = safeLocalStorage.getJSON<string[]>(
          'study_planner_completed_lessons',
          [],
        );
        currentSkillCount = Math.max(skillAttempts.length * 2, completedLessons.length * 3);
      } else if (skill === 'reading' || skill === 'listening') {
        currentSkillCount = skillAttempts.length;
      } else if (skill === 'writing') {
        currentSkillCount = writingHistory.length;
      } else if (skill === 'speaking') {
        currentSkillCount = speakingHistory.length;
      }

      const baseMastery = masteryProfile.skills[skill];
      const baseScore = baseMastery ? baseMastery.score : 0;
      const countRatio = Math.min(1.0, currentSkillCount / Math.max(1, skillTarget));

      const srsAttempts = skillAttempts.filter((attempt) => attempt.format === 'srs');
      const retentionRate =
        (skill === 'vocabulary' || skill === 'kanji') && cardsArray.length > 0
          ? flashcardRetention
          : this.calculateRecentAccuracy(srsAttempts);
      const retentionPassed = retentionRate >= SKILL_MATRIX_CONFIG.retentionThreshold;

      const measuredAccuracy =
        skillAttempts.length > 0 ? recentAccuracy : baseScore > 0 ? baseScore : retentionRate;
      const effectiveScore =
        skillAttempts.length > 0 || baseScore > 0 || retentionRate > 0
          ? clampPercent(measuredAccuracy * 0.65 + countRatio * 35)
          : 0;

      const evidenceSources = this.buildEvidenceSources(skillAttempts);
      if ((skill === 'vocabulary' || skill === 'kanji') && cardsArray.length > 0) {
        evidenceSources.push({
          source: 'flashcards',
          format: 'srs',
          count: cardsArray.length,
          accuracy: flashcardRetention,
          lastUsedAt: this.getLatestTimestamp(cardsArray),
        });
      }

      const competenciesProgress: CompetencyProgress[] = blueprints.map((blueprint) => {
        totalCompetencies++;
        const targetSubCount = Math.max(1, Math.round(skillTarget * blueprint.targetWeight));
        const mappedAttempts = skillAttempts.filter((attempt) => {
          if (attempt.competencyId) return attempt.competencyId === blueprint.id;
          return blueprint.formats.includes(attempt.format);
        });
        const competencyAttempts = mappedAttempts.map((attempt) => ({
          ...attempt,
          accuracy: this.getCompetencyAttemptAccuracy(attempt, blueprint.id),
        }));
        const compAccuracy = this.calculateRecentAccuracy(competencyAttempts);
        const compMultiFormat = this.hasMultiFormatEvidence(competencyAttempts);
        const compEvidenceCount = competencyAttempts.length;
        const currentSubCount =
          compEvidenceCount > 0
            ? Math.min(targetSubCount, compEvidenceCount)
            : Math.min(targetSubCount, Math.round(currentSkillCount * blueprint.targetWeight));
        const compStatus = this.resolveStatus(
          compAccuracy,
          compMultiFormat,
          compEvidenceCount,
          currentSubCount,
        );

        if (compStatus === 'mastered') {
          masteredCompetencies++;
        } else if (compStatus === 'weak') {
          weaknesses.push({
            skill,
            competencyName: blueprint.name.uz,
            reason: `${blueprint.name.uz} ko'rsatkichi ${compAccuracy}% (maqsad: 85%+ va har bir formatda kamida ${SKILL_MATRIX_CONFIG.multiFormatMinAccuracy}%)`,
            recommendedRoute: routes[skill],
          });
        }

        const evidenceSourceNames = Array.from(
          new Set(competencyAttempts.map((attempt) => attempt.source)),
        );

        competencyResults.push({
          competencyId: blueprint.id,
          skill,
          level,
          accuracy: compAccuracy,
          status: compStatus,
          evidenceCount: compEvidenceCount,
          evidenceSources: evidenceSourceNames,
          updatedAt: generatedAt,
        });

        return {
          competencyId: blueprint.id,
          name: blueprint.name,
          category: blueprint.category,
          description: blueprint.description,
          targetCount: targetSubCount,
          currentCount: currentSubCount,
          accuracy: compAccuracy,
          evidenceCount: compEvidenceCount,
          evidenceSources: evidenceSourceNames,
          formatsTested: Array.from(new Set(competencyAttempts.map((attempt) => attempt.format))),
          status: compStatus,
          benchmarkRule: blueprint.benchmarkRule,
        };
      });

      const skillStatus = this.resolveStatus(
        effectiveScore,
        multiFormatPassed,
        skillAttempts.length,
        currentSkillCount,
      );

      if (skillStatus === 'mastered') {
        masteredSkills++;
      }

      skillsMap[skill] = {
        skill,
        level,
        title: this.getSkillTitle(skill),
        description: this.getSkillDescription(skill, level),
        overallTargetCount: skillTarget,
        currentCount: currentSkillCount,
        score: effectiveScore,
        accuracy: recentAccuracy,
        evidenceCount: skillAttempts.length,
        evidenceSources,
        multiFormatPassed,
        retentionRate,
        retentionPassed,
        status: skillStatus,
        competencies: competenciesProgress,
        practiceRoute: routes[skill],
        iconName: icons[skill],
      };
    }

    this.saveCompetencyResults(userId, level, competencyResults);

    const overallCompletionRate = Math.min(
      100,
      Math.round((masteredCompetencies / Math.max(1, totalCompetencies)) * 100),
    );

    return {
      level,
      language: 'ja',
      overallCompletionRate,
      masteredSkillsCount: masteredSkills,
      totalCompetenciesCount: totalCompetencies,
      masteredCompetenciesCount: masteredCompetencies,
      skills: skillsMap,
      topWeaknesses: weaknesses.slice(0, 5),
      generatedAt,
    };
  }

  public static getCompetencyResults(
    userId: string = 'guest',
    level?: JlptLevel,
  ): CompetencyResultRecord[] {
    const key = this.competencyResultsKey(userId);
    const records = safeLocalStorage.getJSON<CompetencyResultRecord[]>(key, []);
    if (!Array.isArray(records)) return [];
    return level ? records.filter((record) => record.level === level) : records;
  }

  private static competencyResultsKey(userId: string): string {
    return `study_planner_skill_matrix_competencies_${userId || 'guest'}_ja`;
  }

  private static saveCompetencyResults(
    userId: string,
    level: JlptLevel,
    results: CompetencyResultRecord[],
  ): void {
    const key = this.competencyResultsKey(userId);
    const existing = safeLocalStorage.getJSON<CompetencyResultRecord[]>(key, []);
    const otherLevels = Array.isArray(existing)
      ? existing.filter((record) => record.level !== level)
      : [];
    safeLocalStorage.setJSON(key, [...otherLevels, ...results]);
  }

  private static readHistoryItems(keys: string[]): any[] {
    const items = new Map<string, any>();
    for (const key of keys) {
      const records = safeLocalStorage.getJSON<any[]>(key, []);
      if (!Array.isArray(records)) continue;
      for (const record of records) {
        if (!record || typeof record !== 'object') continue;
        const itemKey = String(
          record.id ||
            `${record.createdAt || record.created_at || ''}-${record.prompt || record.persona || ''}-${record.questionText || ''}`,
        );
        if (!items.has(itemKey)) items.set(itemKey, record);
      }
    }
    return Array.from(items.values());
  }

  private static toWritingAttempt(item: any): NormalizedAttempt | null {
    const criteria = parseJsonObject(item?.criteriaBreakdown) || {};
    const numericCriteria = Object.values(criteria)
      .map((value) => normalizePercent(value))
      .filter((value): value is number => value !== null);
    const score = normalizePercent(item?.score);
    if (score === null && numericCriteria.length === 0) return null;
    return {
      skill: 'writing',
      format: 'essay',
      accuracy: numericCriteria.length > 0 ? average(numericCriteria) : (score ?? 0),
      timestamp: item.createdAt || item.created_at || new Date().toISOString(),
      source: 'writing_history',
    };
  }

  private static toSpeakingAttempt(item: any): NormalizedAttempt | null {
    const feedback = parseJsonObject(item?.feedback) || {};
    const criteria: SpeakingCriteria = {
      pronunciation:
        normalizePercent(feedback.pronunciation_score ?? item?.pronunciationScore) ?? undefined,
      fluency: normalizePercent(feedback.fluency_score ?? item?.fluencyScore) ?? undefined,
      grammar:
        normalizePercent(feedback.grammar_score ?? feedback.grammatical_range_score) ?? undefined,
      vocabulary:
        normalizePercent(feedback.vocabulary_score ?? feedback.lexical_score) ?? undefined,
      overall: normalizePercent(feedback.overall_score) ?? undefined,
    };
    const scores = Object.values(criteria).filter(
      (value): value is number => typeof value === 'number',
    );
    if (scores.length === 0) return null;
    return {
      skill: 'speaking',
      format: 'speech',
      accuracy: criteria.overall ?? average(scores),
      timestamp: item.createdAt || item.created_at || new Date().toISOString(),
      source: 'speaking_history',
      criteria,
    };
  }

  private static getCompetencyAttemptAccuracy(
    attempt: NormalizedAttempt,
    competencyId: string,
  ): number {
    if (attempt.skill === 'speaking' && attempt.criteria) {
      const criterion = SPEAKING_COMPETENCY_CRITERIA[competencyId];
      const value = criterion ? attempt.criteria[criterion] : undefined;
      if (typeof value === 'number') return value;
    }
    return attempt.accuracy;
  }

  private static calculateRecentAccuracy(attempts: NormalizedAttempt[]): number {
    if (attempts.length === 0) return 0;
    const recent = [...attempts]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-SKILL_MATRIX_CONFIG.recentAttemptWindow);
    return average(recent.map((attempt) => attempt.accuracy));
  }

  private static hasMultiFormatEvidence(attempts: NormalizedAttempt[]): boolean {
    const formats = new Map<ActivityFormat, NormalizedAttempt[]>();
    for (const attempt of attempts) {
      const list = formats.get(attempt.format) || [];
      list.push(attempt);
      formats.set(attempt.format, list);
    }
    const qualifiedFormats = Array.from(formats.values()).filter(
      (formatAttempts) =>
        this.calculateRecentAccuracy(formatAttempts) >= SKILL_MATRIX_CONFIG.multiFormatMinAccuracy,
    );
    return qualifiedFormats.length >= SKILL_MATRIX_CONFIG.requiredFormats;
  }

  private static resolveStatus(
    score: number,
    multiFormat: boolean,
    evidenceCount: number,
    currentCount: number,
  ): MasteryStatus {
    if (evidenceCount === 0) return currentCount > 0 ? 'weak' : 'not_started';
    if (score >= SKILL_MATRIX_CONFIG.masteryThreshold && multiFormat) return 'mastered';
    if (score >= MASTERY_CONFIG.proficientThreshold) return 'proficient';
    if (score >= MASTERY_CONFIG.weakThreshold) return 'developing';
    return 'weak';
  }

  private static computeFlashcardRetention(cards: any[]): number {
    if (cards.length === 0) return 0;
    const scores = cards.map((card) => {
      const factor = Number(card.easeFactor) || 2.5;
      const interval = Number(card.interval) || 0;
      return Math.min(100, Math.round((interval / 30) * 50 + (factor / 2.5) * 50));
    });
    return average(scores);
  }

  private static getLatestTimestamp(items: any[]): string | undefined {
    const timestamps = items
      .map((item) => item.updatedAt || item.createdAt || item.created_at || item.nextReviewDate)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .sort();
    return timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined;
  }

  private static buildEvidenceSources(attempts: NormalizedAttempt[]): EvidenceSourceSummary[] {
    const groups = new Map<string, NormalizedAttempt[]>();
    for (const attempt of attempts) {
      const key = `${attempt.source}|${attempt.format}`;
      const list = groups.get(key) || [];
      list.push(attempt);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([key, group]) => {
      const [source, format] = key.split('|') as [string, ActivityFormat];
      return {
        source,
        format,
        count: group.length,
        accuracy: this.calculateRecentAccuracy(group),
        lastUsedAt: this.getLatestTimestamp(group),
      };
    });
  }

  private static getSkillTitle(skill: MasterySkill): { uz: string; ja: string; en: string } {
    switch (skill) {
      case 'vocabulary':
        return { uz: "So'z Boyligi (Goi)", ja: '単語・語彙 (Goi)', en: 'Vocabulary' };
      case 'grammar':
        return { uz: 'Grammatika (Bunpou)', ja: '文法 (Bunpou)', en: 'Grammar' };
      case 'kanji':
        return { uz: 'Kanji Ierogliflari', ja: '漢字 (Kanji)', en: 'Kanji' };
      case 'reading':
        return { uz: "O'qish (Dokkai)", ja: '読解 (Dokkai)', en: 'Reading Comprehension' };
      case 'listening':
        return {
          uz: 'Tinglab tushunish (Choukai)',
          ja: '聴解 (Choukai)',
          en: 'Listening Comprehension',
        };
      case 'writing':
        return { uz: 'Yozma nutq (Sakubun)', ja: '作文・記述 (Sakubun)', en: 'Writing & Syntax' };
      case 'speaking':
        return { uz: "Og'zaki nutq (Kaiwa)", ja: '会話・発話 (Kaiwa)', en: 'Speaking & Fluency' };
    }
  }

  private static getSkillDescription(
    skill: MasterySkill,
    level: JlptLevel,
  ): { uz: string; ja: string; en: string } {
    switch (skill) {
      case 'vocabulary':
        return {
          uz: `JLPT ${level} talabidagi barcha rasmiy so'zlarni faol va passiv o'zlashtirish`,
          ja: `JLPT ${level} レベルで要求される全語彙の能動的・受動的習得`,
          en: `Comprehensive active and passive retention of all official JLPT ${level} vocabulary`,
        };
      case 'grammar':
        return {
          uz: `${level} darajasiga oid barcha sintaktik konstruksiyalar va zarrachalar aniqligi`,
          ja: `${level} レベルの全必須文型と助詞・活用パターンの正確な運用`,
          en: `Accurate usage of sentence patterns, particles, and conjugations for JLPT ${level}`,
        };
      case 'kanji':
        return {
          uz: `${level} kanjilarining yozilishi, ma'nosi va barcha o'qilishlarini to'liq bilish`,
          ja: `${level} 配当漢字の筆順、訓読み・音読み、熟語構成の完全網羅`,
          en: `Mastery of stroke orders, onyomi/kunyomi readings, and compound words for ${level}`,
        };
      case 'reading':
        return {
          uz: `${level} matnlaridan ma'lumotni tezkor qidirish va mantiqiy xulosalarni tushunish`,
          ja: `${level} 難易度の文章からの情報検索および筆者の意図・推論の理解`,
          en: `Speed, information extraction, and nuance deduction in ${level} passages`,
        };
      case 'listening':
        return {
          uz: `${level} audio dialoglari va topshiriqlarini bir eshitishda anglash`,
          ja: `${level} 聴解問題におけるタスク理解・ポイント把握・即時応答の即応力`,
          en: `Real-time task comprehension and conversational quick response at ${level}`,
        };
      case 'writing':
        return {
          uz: `${level} darajasidagi jumlalarni to'g'ri tartiblash va erkin fikr ifodalash`,
          ja: `${level} の語順整序・助詞補填およびテーマ別作文記述力`,
          en: `Sentence unscrambling, particle placement, and essay composition at ${level}`,
        };
      case 'speaking':
        return {
          uz: `${level} doirasida tabiiy talaffuz, pitch accent va erkin situatsion muloqot`,
          ja: `${level} 相当の発音・ピッチアクセント・流暢な場面別対話力`,
          en: `Pitch accent, pronunciation clarity, and fluent dialogue at ${level}`,
        };
    }
  }
}
