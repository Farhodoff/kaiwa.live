export type JlptQuestionType =
  | 'vocabulary_meaning'
  | 'kanji_reading'
  | 'grammar_fill_blank'
  | 'sentence_ordering'
  | 'synonym_nuance'
  | 'reading_main_idea'
  | 'reading_detail'
  | 'reading_inference'
  | 'listening_situation'
  | 'listening_intention'
  | 'listening_summary';

export type JlptQuestionSection = 'knowledge' | 'reading' | 'listening';

export type JlptQuestionAnswerMode = 'single_choice' | 'sentence_ordering';

export interface JlptQuestionTypeDefinition {
  type: JlptQuestionType;
  section: JlptQuestionSection;
  labelUz: string;
  labelJa: string;
  shortLabel: string;
  instructionUz: string;
  answerMode: JlptQuestionAnswerMode;
  requiresPassage: boolean;
  requiresAudio: boolean;
  suggestedOptionCount: number;
  schema: {
    fields: Array<{
      key: string;
      labelUz: string;
      kind: 'text' | 'options' | 'fragments' | 'correct_order' | 'star_position' | 'passage';
      required: boolean;
    }>;
  };
}

export const JLPT_QUESTION_TYPES: JlptQuestionType[] = [
  'vocabulary_meaning',
  'kanji_reading',
  'grammar_fill_blank',
  'sentence_ordering',
  'synonym_nuance',
  'reading_main_idea',
  'reading_detail',
  'reading_inference',
  'listening_situation',
  'listening_intention',
  'listening_summary',
];

const CHOICE_SCHEMA = {
  fields: [
    { key: 'question_text', labelUz: 'Savol matni', kind: 'text' as const, required: true },
    { key: 'options', labelUz: 'Javob variantlari', kind: 'options' as const, required: true },
    {
      key: 'correct_answer',
      labelUz: "To'g'ri javob",
      kind: 'text' as const,
      required: true,
    },
  ],
};

const ORDERING_SCHEMA = {
  fields: [
    { key: 'question_text', labelUz: 'Ko‘rsatma matni', kind: 'text' as const, required: true },
    {
      key: 'fragments',
      labelUz: '4 ta gap bo‘lagi',
      kind: 'fragments' as const,
      required: true,
    },
    {
      key: 'correct_order',
      labelUz: 'To‘g‘ri tartib (masalan: 2,4,1,3)',
      kind: 'correct_order' as const,
      required: true,
    },
    {
      key: 'star_position',
      labelUz: 'Yulduzcha o‘rni (1-4)',
      kind: 'star_position' as const,
      required: true,
    },
  ],
};

const DEFINITIONS: Record<JlptQuestionType, JlptQuestionTypeDefinition> = {
  vocabulary_meaning: {
    type: 'vocabulary_meaning',
    section: 'knowledge',
    labelUz: "So‘z ma'nosi",
    labelJa: '語彙の意味',
    shortLabel: 'Vocabulary meaning',
    instructionUz: 'Bo‘sh joyga mos keladigan so‘zning ma’nosini tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  kanji_reading: {
    type: 'kanji_reading',
    section: 'knowledge',
    labelUz: 'Kanji o‘qilishi',
    labelJa: '漢字の読み方',
    shortLabel: 'Kanji reading',
    instructionUz: 'Belgilangan kanjining to‘g‘ri o‘qilishini tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  grammar_fill_blank: {
    type: 'grammar_fill_blank',
    section: 'knowledge',
    labelUz: 'Grammatika bo‘sh joy',
    labelJa: '文法（穴埋め）',
    shortLabel: 'Grammar fill-in',
    instructionUz: 'Qavs ichidagi bo‘sh joyga mos grammatik shaklni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  sentence_ordering: {
    type: 'sentence_ordering',
    section: 'knowledge',
    labelUz: 'Gap tartibi',
    labelJa: '文の組み立て',
    shortLabel: 'Sentence ordering',
    instructionUz:
      'Gap bo‘laklarini to‘g‘ri tartibda joylashtiring va ★ o‘rniga tushadigan bo‘lakni aniqlang.',
    answerMode: 'sentence_ordering',
    requiresPassage: false,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: ORDERING_SCHEMA,
  },
  synonym_nuance: {
    type: 'synonym_nuance',
    section: 'knowledge',
    labelUz: 'Sinonim va nuance',
    labelJa: '類義語・ニュアンス',
    shortLabel: 'Synonym & nuance',
    instructionUz:
      'Ma’nosi jihatidan eng yaqin sinonim yoki nuance jihatdan mos variantni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  reading_main_idea: {
    type: 'reading_main_idea',
    section: 'reading',
    labelUz: 'Matn asosiy fikri',
    labelJa: '読解（主旨）',
    shortLabel: 'Reading main idea',
    instructionUz: 'Matnning asosiy fikrini ifodalovchi variantni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: true,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  reading_detail: {
    type: 'reading_detail',
    section: 'reading',
    labelUz: 'Matn detali',
    labelJa: '読解（詳細）',
    shortLabel: 'Reading detail',
    instructionUz: 'Matnda keltirilgan aniq ma’lumotga mos variantni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: true,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  reading_inference: {
    type: 'reading_inference',
    section: 'reading',
    labelUz: 'Matndan xulosa',
    labelJa: '読解（推論）',
    shortLabel: 'Reading inference',
    instructionUz: 'Matnga asoslanib, mantiqiy xulosa chiqaring.',
    answerMode: 'single_choice',
    requiresPassage: true,
    requiresAudio: false,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  listening_situation: {
    type: 'listening_situation',
    section: 'listening',
    labelUz: 'Vaziyatni tushunish',
    labelJa: '聴解（状況理解）',
    shortLabel: 'Listening situation',
    instructionUz: 'Audio vaziyatiga ko‘ra eng mos javobni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: true,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  listening_intention: {
    type: 'listening_intention',
    section: 'listening',
    labelUz: 'So‘zlovchi niyati',
    labelJa: '聴解（話し手の意図）',
    shortLabel: 'Listening intention',
    instructionUz: 'So‘zlovchining haqiqiy niyati yoki maqsadini aniqlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: true,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
  listening_summary: {
    type: 'listening_summary',
    section: 'listening',
    labelUz: 'Audio xulosasi',
    labelJa: '聴解（概要理解）',
    shortLabel: 'Listening summary',
    instructionUz: 'Audio mazmunini umumlashtiruvchi eng mos variantni tanlang.',
    answerMode: 'single_choice',
    requiresPassage: false,
    requiresAudio: true,
    suggestedOptionCount: 4,
    schema: CHOICE_SCHEMA,
  },
};

export const JLPT_QUESTION_TYPE_DEFINITIONS = DEFINITIONS;

const TYPE_ALIASES: Record<string, JlptQuestionType> = {
  vocabulary: 'vocabulary_meaning',
  vocab: 'vocabulary_meaning',
  vocabulary_meaning: 'vocabulary_meaning',
  meaning: 'vocabulary_meaning',
  kanji: 'kanji_reading',
  kanji_reading: 'kanji_reading',
  reading_kanji: 'kanji_reading',
  grammar: 'grammar_fill_blank',
  grammar_fill_blank: 'grammar_fill_blank',
  fill_in_blank: 'grammar_fill_blank',
  fill_in_the_blank: 'grammar_fill_blank',
  sentence_order: 'sentence_ordering',
  sentence_ordering: 'sentence_ordering',
  ordering: 'sentence_ordering',
  sentence_ordering_question: 'sentence_ordering',
  synonym: 'synonym_nuance',
  synonyms: 'synonym_nuance',
  synonym_nuance: 'synonym_nuance',
  nuance: 'synonym_nuance',
  reading_main_idea: 'reading_main_idea',
  main_idea: 'reading_main_idea',
  reading_main: 'reading_main_idea',
  reading_detail: 'reading_detail',
  detail: 'reading_detail',
  reading_inference: 'reading_inference',
  inference: 'reading_inference',
  reading_infer: 'reading_inference',
  listening_situation: 'listening_situation',
  listening_situation_comprehension: 'listening_situation',
  situation: 'listening_situation',
  listening_intention: 'listening_intention',
  listening_speaker_intention: 'listening_intention',
  speaker_intention: 'listening_intention',
  intention: 'listening_intention',
  listening_summary: 'listening_summary',
  listening_summary_comprehension: 'listening_summary',
  summary: 'listening_summary',
};

const normalizeToken = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const getDefaultQuestionTypeForSection = (section?: string | null): JlptQuestionType => {
  const normalized = normalizeToken(section);
  if (normalized.includes('listen') || normalized.includes('choukai')) return 'listening_situation';
  if (normalized.includes('read') || normalized.includes('dokkai')) return 'reading_main_idea';
  return 'vocabulary_meaning';
};

export const normalizeJlptQuestionType = (
  value?: string | null,
  section?: string | null,
): JlptQuestionType => {
  const token = normalizeToken(value);
  if (TYPE_ALIASES[token]) return TYPE_ALIASES[token];

  if (token.includes('sentence') && token.includes('order')) return 'sentence_ordering';
  if (token.includes('組み立て')) return 'sentence_ordering';
  if (token.includes('kanji') || token.includes('漢字')) return 'kanji_reading';
  if (token.includes('類義') || token.includes('ニュアンス')) return 'synonym_nuance';
  if (token.includes('文法') || token.includes('穴埋')) return 'grammar_fill_blank';
  if (token.includes('語彙') || token.includes('意味')) return 'vocabulary_meaning';
  if (token.includes('推論')) return 'reading_inference';
  if (token.includes('詳細') || token.includes('内容')) return 'reading_detail';
  if (token.includes('主旨')) return 'reading_main_idea';
  if (token.includes('意図')) return 'listening_intention';
  if (token.includes('概要')) return 'listening_summary';
  if (token.includes('聴解') || token.includes('状況')) return 'listening_situation';
  if (token.includes('synonym') || token.includes('nuance')) return 'synonym_nuance';
  if (token.includes('grammar') || token.includes('fill')) return 'grammar_fill_blank';
  if (token.includes('vocab') || token.includes('meaning')) return 'vocabulary_meaning';
  if (token.includes('inference') || token.includes('infer')) return 'reading_inference';
  if (token.includes('detail')) return 'reading_detail';
  if (token.includes('main') || token.includes('idea')) return 'reading_main_idea';
  if (token.includes('intention') || token.includes('intent')) return 'listening_intention';
  if (token.includes('summary')) return 'listening_summary';
  if (token.includes('listen') || token.includes('situation')) return 'listening_situation';

  return getDefaultQuestionTypeForSection(section);
};

export const getJlptQuestionTypeDefinition = (
  type?: string | null,
  section?: string | null,
): JlptQuestionTypeDefinition => DEFINITIONS[normalizeJlptQuestionType(type, section)];

export const normalizeQuestionSection = (section?: string | null): JlptQuestionSection => {
  const token = normalizeToken(section);
  if (token.includes('listen') || token.includes('choukai')) return 'listening';
  if (token === 'reading' || token.includes('read') || token.includes('dokkai')) return 'reading';
  return 'knowledge';
};

export const getQuestionTypesForSection = (
  section?: string | null,
): JlptQuestionTypeDefinition[] => {
  const normalized = normalizeQuestionSection(section);
  return JLPT_QUESTION_TYPES.map((type) => DEFINITIONS[type]).filter(
    (definition) => definition.section === normalized,
  );
};

export const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // Fall back to delimiter parsing.
    }
  }
  return trimmed
    .split(/\s*\|\s*|\s*;\s*|\s*,\s*|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseNumberList = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.map((item) => Number(item));
  if (typeof value === 'number') return [value];
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => Number(item));
    } catch {
      // Fall back to delimiter parsing.
    }
  }
  return trimmed
    .split(/\s*(?:,|;|\||\s|-|→|>)\s*/)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
};

export interface SentenceOrderingData {
  fragments: string[];
  correctOrder: number[];
  starPosition: number;
  prefix?: string;
  suffix?: string;
}

export const parseSentenceOrderingData = (input: {
  fragments?: unknown;
  options?: unknown;
  correctOrder?: unknown;
  correct_order?: unknown;
  starPosition?: unknown;
  star_position?: unknown;
  prefix?: unknown;
  suffix?: unknown;
}): SentenceOrderingData => {
  const fragments = parseStringList(input.fragments ?? input.options);
  const rawOrder = parseNumberList(input.correctOrder ?? input.correct_order ?? []);
  const isOneBased =
    rawOrder.length > 0 &&
    !rawOrder.includes(0) &&
    rawOrder.every((value) => value >= 1 && value <= fragments.length);
  const correctOrder = isOneBased ? rawOrder.map((value) => value - 1) : rawOrder;
  const starRaw = Number(input.starPosition ?? input.star_position ?? 3);
  return {
    fragments,
    correctOrder,
    starPosition: Number.isFinite(starRaw) ? starRaw : 3,
    prefix: input.prefix ? String(input.prefix) : undefined,
    suffix: input.suffix ? String(input.suffix) : undefined,
  };
};

export const isValidSentenceOrdering = (data: SentenceOrderingData): boolean => {
  if (data.fragments.length !== 4) return false;
  if (data.correctOrder.length !== 4) return false;
  if (new Set(data.correctOrder).size !== 4) return false;
  if (data.correctOrder.some((index) => index < 0 || index > 3)) return false;
  if (!Number.isInteger(data.starPosition) || data.starPosition < 1 || data.starPosition > 4) {
    return false;
  }
  return true;
};

export const buildJlptQuestionPayload = (input: {
  type: string;
  options?: string[];
  correctAnswer?: string;
  correctIndex?: number;
  fragments?: string[];
  correctOrder?: number[];
  starPosition?: number;
  prefix?: string;
  suffix?: string;
}): Record<string, unknown> => {
  const type = normalizeJlptQuestionType(input.type);
  if (type === 'sentence_ordering') {
    return {
      version: 1,
      type,
      fragments: input.fragments || input.options || [],
      correct_order: input.correctOrder || [],
      star_position: input.starPosition || 3,
      prefix: input.prefix || '',
      suffix: input.suffix || '',
    };
  }
  return {
    version: 1,
    type,
    options: input.options || [],
    correct_index: input.correctIndex ?? -1,
    correct_answer: input.correctAnswer || '',
  };
};
