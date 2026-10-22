/**
 * JLPT Rasmiy Bo'limli Taymer Konfiguratsiyasi va Qoidalari
 * (Official Sectioned Timed Exam Specifications)
 *
 * Japan Foundation & JEES standartlari bo'yicha rasmiy vaqt mezonlari:
 * - N5: Moji/Goi (20 min) -> Bunpou/Dokkai (40 min) -> Choukai (30 min)
 * - N4: Moji/Goi (25 min) -> Bunpou/Dokkai (55 min) -> Choukai (35 min)
 * - N3: Moji/Goi (30 min) -> Bunpou/Dokkai (70 min) -> Choukai (40 min)
 * - N2: Gengo Chishiki + Dokkai bitta blok (105 min) -> Choukai (50 min)
 * - N1: Gengo Chishiki + Dokkai bitta blok (110 min) -> Choukai (60 min)
 *
 * N2/N1 da Language Knowledge va Reading alohida taymerga ega emas: ular
 * bitta rasmiy vaqt blokida ochiladi. Shu sababli vaqt bloklari `block`
 * maydoni bilan, savol bo'limlari esa `sections` maydoni bilan modellashtiriladi.
 */

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type JlptExamMode = 'practice' | 'official_timed';
export type SectionKey = 'knowledge' | 'reading' | 'listening';
export type ExamBlockKey = 'knowledge' | 'language_reading' | 'reading' | 'listening';

export interface SectionTimingSpec {
  /** Legacy anchor: blokdagi birinchi savol bo'limi. */
  section: SectionKey;
  /** Taymer blokining yagona kaliti. */
  block: ExamBlockKey;
  /** Ushbu taymer blokida ochiq savol bo'limlari. */
  sections: SectionKey[];
  order: number;
  titleJa: string;
  titleUz: string;
  shortLabel: string;
  icon: string;
  officialMinutes: number;
  simulationSeconds: number; // 25 talik sinov uchun qulaylashtirilgan real vaqt
  officialSeconds: number; // To'liq rasmiy imtihon vaqti
  descriptionUz: string;
}

export interface JlptTimingBlockConfig {
  block: ExamBlockKey;
  officialMinutes: number;
  simulationMinutes: number;
}

export type JlptTimingConfig = Partial<Record<JlptLevel, JlptTimingBlockConfig[]>>;

export const JLPT_CONTENT_SECTION_META: Record<
  SectionKey,
  { titleJa: string; titleUz: string; shortLabel: string }
> = {
  knowledge: {
    titleJa: '言語知識',
    titleUz: 'Til bilimi va Grammatika',
    shortLabel: 'Gengo Chishiki',
  },
  reading: {
    titleJa: '読解',
    titleUz: 'O‘qish (Dokkai)',
    shortLabel: 'Dokkai',
  },
  listening: {
    titleJa: '聴解',
    titleUz: 'Tinglab tushunish (Choukai)',
    shortLabel: 'Choukai',
  },
};

export const JLPT_CONTENT_SECTIONS: SectionKey[] = ['knowledge', 'reading', 'listening'];

export const JLPT_SECTION_SPECS: Record<JlptLevel, SectionTimingSpec[]> = {
  N5: [
    {
      section: 'knowledge',
      block: 'knowledge',
      sections: ['knowledge'],
      order: 1,
      titleJa: '言語知識（文字・語彙）',
      titleUz: 'Til bilimi (Iyeroglif va Lug‘at)',
      shortLabel: '1. Moji & Goi',
      icon: 'BookOpen',
      officialMinutes: 20,
      simulationSeconds: 15 * 60,
      officialSeconds: 20 * 60,
      descriptionUz: 'Iyerogliflar o‘qilishi, so‘z tanlash va lug‘at boyligi sinovi.',
    },
    {
      section: 'reading',
      block: 'reading',
      sections: ['reading'],
      order: 2,
      titleJa: '言語知識（文法）・読解',
      titleUz: 'Grammatika va O‘qish (Dokkai)',
      shortLabel: '2. Bunpou & Dokkai',
      icon: 'FileText',
      officialMinutes: 40,
      simulationSeconds: 20 * 60,
      officialSeconds: 40 * 60,
      descriptionUz: 'Gap tuzilishi, grammatik qoidalar va matnlarni tushunish.',
    },
    {
      section: 'listening',
      block: 'listening',
      sections: ['listening'],
      order: 3,
      titleJa: '聴解',
      titleUz: 'Tinglab tushunish (Choukai)',
      shortLabel: '3. Choukai',
      icon: 'Headphones',
      officialMinutes: 30,
      simulationSeconds: 15 * 60,
      officialSeconds: 30 * 60,
      descriptionUz: 'Studiya CD audiosi orqali savollarga to‘g‘ri javob berish.',
    },
  ],
  N4: [
    {
      section: 'knowledge',
      block: 'knowledge',
      sections: ['knowledge'],
      order: 1,
      titleJa: '言語知識（文字・語彙）',
      titleUz: 'Til bilimi (Iyeroglif va Lug‘at)',
      shortLabel: '1. Moji & Goi',
      icon: 'BookOpen',
      officialMinutes: 25,
      simulationSeconds: 15 * 60,
      officialSeconds: 25 * 60,
      descriptionUz: 'N4 bazaviy kanji va so‘z boyligi sinovi.',
    },
    {
      section: 'reading',
      block: 'reading',
      sections: ['reading'],
      order: 2,
      titleJa: '言語知識（文法）・読解',
      titleUz: 'Grammatika va O‘qish (Dokkai)',
      shortLabel: '2. Bunpou & Dokkai',
      icon: 'FileText',
      officialMinutes: 55,
      simulationSeconds: 25 * 60,
      officialSeconds: 55 * 60,
      descriptionUz: 'Kundalik matnlar, xatlar va N4 grammatikasi tahlili.',
    },
    {
      section: 'listening',
      block: 'listening',
      sections: ['listening'],
      order: 3,
      titleJa: '聴解',
      titleUz: 'Tinglab tushunish (Choukai)',
      shortLabel: '3. Choukai',
      icon: 'Headphones',
      officialMinutes: 35,
      simulationSeconds: 15 * 60,
      officialSeconds: 35 * 60,
      descriptionUz: 'Haqiqiy Shin Kanzen Master N4 CD audio dialoglari.',
    },
  ],
  N3: [
    {
      section: 'knowledge',
      block: 'knowledge',
      sections: ['knowledge'],
      order: 1,
      titleJa: '言語知識（文字・語彙）',
      titleUz: 'Til bilimi (Iyeroglif va Lug‘at)',
      shortLabel: '1. Moji & Goi',
      icon: 'BookOpen',
      officialMinutes: 30,
      simulationSeconds: 18 * 60,
      officialSeconds: 30 * 60,
      descriptionUz: 'O‘rta darajadagi 500 Mon va Shin Kanzen leksikasi.',
    },
    {
      section: 'reading',
      block: 'reading',
      sections: ['reading'],
      order: 2,
      titleJa: '言語知識（文法）・読解',
      titleUz: 'Grammatika va O‘qish (Dokkai)',
      shortLabel: '2. Bunpou & Dokkai',
      icon: 'FileText',
      officialMinutes: 70,
      simulationSeconds: 30 * 60,
      officialSeconds: 70 * 60,
      descriptionUz: 'Chuu-bun va e’lonlar asosidagi murakkabroq matnlar tahlili.',
    },
    {
      section: 'listening',
      block: 'listening',
      sections: ['listening'],
      order: 3,
      titleJa: '聴解',
      titleUz: 'Tinglab tushunish (Choukai)',
      shortLabel: '3. Choukai',
      icon: 'Headphones',
      officialMinutes: 40,
      simulationSeconds: 20 * 60,
      officialSeconds: 40 * 60,
      descriptionUz: 'Haqiqiy N3 studiya CD audiosi.',
    },
  ],
  N2: [
    {
      section: 'knowledge',
      block: 'language_reading',
      sections: ['knowledge', 'reading'],
      order: 1,
      titleJa: '言語知識（文字・語彙・文法）・読解',
      titleUz: 'Til bilimi, Grammatika va O‘qish',
      shortLabel: '1. Gengo Chishiki & Dokkai',
      icon: 'BookOpen',
      officialMinutes: 105,
      simulationSeconds: 45 * 60,
      officialSeconds: 105 * 60,
      descriptionUz:
        'Rasmiy N2 imtihonida til bilimi va o‘qish bitta 105 daqiqalik blokda topshiriladi.',
    },
    {
      section: 'listening',
      block: 'listening',
      sections: ['listening'],
      order: 2,
      titleJa: '聴解',
      titleUz: 'Tinglab tushunish (Choukai)',
      shortLabel: '2. Choukai',
      icon: 'Headphones',
      officialMinutes: 50,
      simulationSeconds: 20 * 60,
      officialSeconds: 50 * 60,
      descriptionUz: 'Shin Kanzen Master N2 audio CD dagi tezkor dialoglar.',
    },
  ],
  N1: [
    {
      section: 'knowledge',
      block: 'language_reading',
      sections: ['knowledge', 'reading'],
      order: 1,
      titleJa: '言語知識（文字・語彙・文法）・読解',
      titleUz: 'Til bilimi, Grammatika va O‘qish',
      shortLabel: '1. Gengo Chishiki & Dokkai',
      icon: 'BookOpen',
      officialMinutes: 110,
      simulationSeconds: 45 * 60,
      officialSeconds: 110 * 60,
      descriptionUz:
        'Rasmiy N1 imtihonida til bilimi va o‘qish bitta 110 daqiqalik blokda topshiriladi.',
    },
    {
      section: 'listening',
      block: 'listening',
      sections: ['listening'],
      order: 2,
      titleJa: '聴解',
      titleUz: 'Tinglab tushunish (Choukai)',
      shortLabel: '2. Choukai',
      icon: 'Headphones',
      officialMinutes: 60,
      simulationSeconds: 20 * 60,
      officialSeconds: 60 * 60,
      descriptionUz: 'Akademik ma’ruzalar va murakkab suhbatlar.',
    },
  ],
};

function clampMinutes(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(300, Math.max(1, Math.round(parsed)));
}

/**
 * Admin kiritgan override'larni xavfsiz formatga keltiradi.
 * Noto'g'ri blok yoki qiymatlar e'tiborsiz qoldiriladi.
 */
export function normalizeTimingConfig(
  level: JlptLevel,
  config?: JlptTimingBlockConfig[] | null,
): JlptTimingBlockConfig[] | null {
  if (!Array.isArray(config) || config.length === 0) return null;
  const defaults = JLPT_SECTION_SPECS[level] || JLPT_SECTION_SPECS.N5;
  const normalized: JlptTimingBlockConfig[] = [];

  defaults.forEach((spec) => {
    const entry = config.find((item) => item?.block === spec.block);
    if (!entry) return;
    normalized.push({
      block: spec.block,
      officialMinutes: clampMinutes(entry.officialMinutes, spec.officialMinutes),
      simulationMinutes: clampMinutes(
        entry.simulationMinutes,
        Math.round(spec.simulationSeconds / 60),
      ),
    });
  });

  return normalized.length > 0 ? normalized : null;
}

/** Berilgan level uchun standart admin konfiguratsiyasi. */
export function getDefaultTimingConfig(level: JlptLevel): JlptTimingBlockConfig[] {
  const specs = JLPT_SECTION_SPECS[level] || JLPT_SECTION_SPECS.N5;
  return specs.map((spec) => ({
    block: spec.block,
    officialMinutes: spec.officialMinutes,
    simulationMinutes: Math.round(spec.simulationSeconds / 60),
  }));
}

/**
 * Standart spetsifikatsiyalarga admin override'larini qo'llaydi.
 */
export function resolveTimingSpecs(
  level: JlptLevel,
  config?: JlptTimingConfig | null,
): SectionTimingSpec[] {
  const specs = JLPT_SECTION_SPECS[level] || JLPT_SECTION_SPECS.N5;
  const levelConfig = normalizeTimingConfig(level, config?.[level]);

  return specs
    .map((spec) => {
      const override = levelConfig?.find((item) => item.block === spec.block);
      if (!override) return { ...spec, sections: [...spec.sections] };
      return {
        ...spec,
        sections: [...spec.sections],
        officialMinutes: override.officialMinutes,
        officialSeconds: override.officialMinutes * 60,
        simulationSeconds: override.simulationMinutes * 60,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/** Berilgan savol bo'limi qaysi taymer blokida ekanini topadi. */
export function getTimingBlockForSection(
  level: JlptLevel,
  section: SectionKey,
  config?: JlptTimingConfig | null,
): SectionTimingSpec | null {
  const specs = resolveTimingSpecs(level, config);
  return specs.find((spec) => spec.sections.includes(section)) || null;
}

export function isSectionInBlock(spec: SectionTimingSpec, section: SectionKey): boolean {
  return spec.sections.includes(section);
}

export function getBlockDurationSeconds(
  spec: SectionTimingSpec,
  useFullOfficialTime: boolean = false,
): number {
  return useFullOfficialTime ? spec.officialSeconds : spec.simulationSeconds;
}

/**
 * Berilgan daraja va savol bo'limi uchun taymer bloki vaqtini olish (sekundlarda).
 * N2/N1 da knowledge va reading bir xil 105/110 daqiqalik blokni qaytaradi.
 */
export function getSectionDurationSeconds(
  level: JlptLevel,
  section: SectionKey,
  useFullOfficialTime: boolean = false,
  config?: JlptTimingConfig | null,
): number {
  const target = getTimingBlockForSection(level, section, config);
  if (!target) return 1200;
  return getBlockDurationSeconds(target, useFullOfficialTime);
}

/** Berilgan daraja uchun ketma-ket taymer bloklari. */
export function getOrderedSections(
  level: JlptLevel,
  config?: JlptTimingConfig | null,
): SectionTimingSpec[] {
  return resolveTimingSpecs(level, config);
}

/** Savol bo'limi joylashgan taymer blokining indeksi (0, 1, 2). */
export function getSectionIndex(
  level: JlptLevel,
  section: SectionKey,
  config?: JlptTimingConfig | null,
): number {
  const ordered = getOrderedSections(level, config);
  const idx = ordered.findIndex((spec) => spec.sections.includes(section));
  return idx >= 0 ? idx : 0;
}

/** Joriy blokdan keyingi blokning birinchi savol bo'limi. */
export function getNextSectionKey(
  level: JlptLevel,
  currentSection: SectionKey,
  config?: JlptTimingConfig | null,
): SectionKey | null {
  const ordered = getOrderedSections(level, config);
  const currentIdx = ordered.findIndex((spec) => spec.sections.includes(currentSection));
  if (currentIdx >= 0 && currentIdx < ordered.length - 1) {
    return ordered[currentIdx + 1].sections[0];
  }
  return null;
}

/** Joriy blokdan keyingi taymer bloki. */
export function getNextTimingBlock(
  level: JlptLevel,
  currentSection: SectionKey,
  config?: JlptTimingConfig | null,
): SectionTimingSpec | null {
  const ordered = getOrderedSections(level, config);
  const currentIdx = ordered.findIndex((spec) => spec.sections.includes(currentSection));
  return currentIdx >= 0 ? ordered[currentIdx + 1] || null : null;
}

/** Joriy taymer blokining barcha savol bo'limlari. */
export function getCurrentBlockSections(
  level: JlptLevel,
  currentSection: SectionKey,
  config?: JlptTimingConfig | null,
): SectionKey[] {
  return getTimingBlockForSection(level, currentSection, config)?.sections || [currentSection];
}

/** Official rejimda bo'lim ochiqmi yoki yo'qmi (oldindan ochish taqiqlanadi). */
export function canOpenSectionInOfficialMode(
  level: JlptLevel,
  targetSection: SectionKey,
  activeSection: SectionKey,
  sealedSections: SectionKey[],
  config?: JlptTimingConfig | null,
): boolean {
  const ordered = getOrderedSections(level, config);
  const targetBlockIdx = ordered.findIndex((spec) => spec.sections.includes(targetSection));
  const activeBlockIdx = ordered.findIndex((spec) => spec.sections.includes(activeSection));
  if (targetBlockIdx < 0 || activeBlockIdx < 0) return false;

  const targetBlock = ordered[targetBlockIdx];
  const isTargetBlockSealed = targetBlock.sections.every((sec) => sealedSections.includes(sec));
  if (isTargetBlockSealed) return false;

  return targetBlockIdx === activeBlockIdx;
}

/** Umumiy imtihon vaqti (barcha bloklar yig'indisi). */
export function getTotalExamSeconds(
  level: JlptLevel,
  useFullOfficialTime: boolean = false,
  config?: JlptTimingConfig | null,
): number {
  return getOrderedSections(level, config).reduce(
    (sum, spec) => sum + getBlockDurationSeconds(spec, useFullOfficialTime),
    0,
  );
}

/** UI/report uchun vaqt modeli tavsifi. */
export function getTimingModelLabel(
  level: JlptLevel,
  mode: JlptExamMode,
  useFullOfficialTime: boolean = false,
): string {
  if (mode === 'practice') return `Practice (erkin taymer, ${level})`;
  return useFullOfficialTime
    ? `Official timed (to‘liq rasmiy, ${level})`
    : `Official timed (simulyatsiya, ${level})`;
}
