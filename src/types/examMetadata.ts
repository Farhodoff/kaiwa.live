export type ExamLicenseType = 'original' | 'cc-by' | 'cc-by-sa' | 'public-domain' | 'restricted';

export interface ExamSourceLicenseMeta {
  sourceName?: string;
  sourceUrl?: string;
  author?: string;
  licenseType: ExamLicenseType;
  copyrightConfirmed: boolean;
  isOfficialJlpt?: boolean;
}

export interface LicenseConfigMeta {
  id: ExamLicenseType;
  name: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  isRestricted: boolean;
  requiresAttribution: boolean;
}

export const LICENSE_CONFIG: Record<ExamLicenseType, LicenseConfigMeta> = {
  original: {
    id: 'original',
    name: 'Original Mualliflik (Platforma)',
    shortLabel: 'Original',
    description: "Platforma mualliflari yoki o'qituvchilar tomonidan yaratilgan original material.",
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    isRestricted: false,
    requiresAttribution: false,
  },
  'cc-by': {
    id: 'cc-by',
    name: 'Creative Commons Attribution (CC BY)',
    shortLabel: 'CC BY',
    description: 'Muallifni ko‘rsatgan holda erkin foydalanish, tarqatish va moslashtirish mumkin.',
    badgeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    isRestricted: false,
    requiresAttribution: true,
  },
  'cc-by-sa': {
    id: 'cc-by-sa',
    name: 'Creative Commons Attribution-ShareAlike (CC BY-SA)',
    shortLabel: 'CC BY-SA',
    description:
      'Mualliflik ko‘rsatiladi va o‘zgartirilgan versiyalar ham aynan shu litsenziyada tarqatiladi.',
    badgeClass: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    isRestricted: false,
    requiresAttribution: true,
  },
  'public-domain': {
    id: 'public-domain',
    name: 'Ommaviy Mulk (Public Domain / CC0)',
    shortLabel: 'Public Domain',
    description: 'Hech qanday mualliflik cheklovlarisiz ommaga ochiq bo‘lgan material.',
    badgeClass: 'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400',
    isRestricted: false,
    requiresAttribution: false,
  },
  restricted: {
    id: 'restricted',
    name: 'Cheklangan / Mualliflik huquqi bilan himoyalangan (Restricted)',
    shortLabel: 'Restricted ⚠️',
    description:
      'Foydalanish ruxsati cheklangan, nashr qilishdan oldin ogohlantirish talab qilinadi.',
    badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
    isRestricted: true,
    requiresAttribution: true,
  },
};

export const OFFICIAL_JLPT_ORGANIZATIONS = [
  'japan foundation',
  'jees',
  'the japan foundation',
  'japan educational exchanges and services',
  'jlpt.jp',
  'official jlpt',
];

/**
 * Normalizes input license string to a valid ExamLicenseType
 */
export function normalizeLicenseType(raw?: string | null): ExamLicenseType {
  if (!raw) return 'original';
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (clean === 'ccby' || clean === 'creativecommonby') return 'cc-by';
  if (clean === 'ccbysa' || clean === 'creativecommonbysa') return 'cc-by-sa';
  if (clean === 'publicdomain' || clean === 'cc0' || clean === 'pd') return 'public-domain';
  if (clean === 'restricted' || clean === 'copyrighted' || clean === 'allrightsreserved')
    return 'restricted';
  if (clean === 'original' || clean === 'proprietary') return 'original';
  return 'original';
}

/**
 * Validates that an exam or question is not falsely marked as "Official JLPT".
 * Only materials authentically published by JEES or The Japan Foundation can carry this flag.
 */
export function validateJlptOfficialStatus(meta: {
  isOfficialJlpt?: boolean;
  sourceName?: string;
  title?: string;
}): { isValid: boolean; warning?: string; error?: string } {
  if (!meta.isOfficialJlpt) {
    return { isValid: true };
  }

  const src = (meta.sourceName || '').trim().toLowerCase();
  const isRecognized = OFFICIAL_JLPT_ORGANIZATIONS.some((org) => src.includes(org));

  if (!isRecognized) {
    return {
      isValid: false,
      error:
        "Faqat rasmiy tashkilotchilar (Japan Foundation / JEES) tomonidan chiqarilgan materiallar 'Official JLPT' deb belgilanishi mumkin. Uchinchi tomon mock/amaliyot testlari uchun bu belgini olib tashlang.",
    };
  }

  return { isValid: true };
}

/**
 * Generates user-facing attribution text for mock exam pages.
 */
export function formatAttribution(meta: {
  sourceName?: string | null;
  sourceUrl?: string | null;
  author?: string | null;
  licenseType?: ExamLicenseType | string | null;
  isOfficialJlpt?: boolean;
}): {
  displayTitle: string;
  sourceText: string;
  licenseMeta: LicenseConfigMeta;
  disclaimer: string;
  hasAttribution: boolean;
} {
  const normLicense = normalizeLicenseType(meta.licenseType);
  const licenseMeta = LICENSE_CONFIG[normLicense];
  const parts: string[] = [];

  if (meta.sourceName?.trim()) {
    parts.push(`Manba: ${meta.sourceName.trim()}`);
  }
  if (meta.author?.trim()) {
    parts.push(`Muallif: ${meta.author.trim()}`);
  }

  const hasAttribution = Boolean(
    meta.sourceName?.trim() || meta.author?.trim() || licenseMeta.requiresAttribution,
  );

  let disclaimer =
    "Ushbu sinov JLPT formati asosida tuzilgan o'quv-amaliyot materialidir (Japan Foundation / JEES rasmiy imtihoni emas).";
  if (meta.isOfficialJlpt) {
    disclaimer =
      'Ushbu material The Japan Foundation / JEES tomonidan nashr etilgan rasmiy JLPT namunalariga asoslangan.';
  }

  return {
    displayTitle:
      parts.join(' • ') || (meta.isOfficialJlpt ? 'Rasmiy JLPT Namunasi' : 'Mock Sinov Materiali'),
    sourceText: parts.join(' • '),
    licenseMeta,
    disclaimer,
    hasAttribution,
  };
}
