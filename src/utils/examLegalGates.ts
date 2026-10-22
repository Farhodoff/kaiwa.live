/**
 * Task 18 — legal / copyright gates for exam publishing.
 *
 * Centralizes every hard block that must be cleared before an exam can be
 * published, so the workflow service, the bulk import window and the question
 * editor all speak the same language about *which field* is missing.
 *
 * Rules:
 *  - `copyright_confirmed` must be true — otherwise publishing is blocked.
 *  - `restricted` license can never be published; it needs an explicit legal
 *    approval that the product does not grant automatically.
 *  - Attribution licenses (cc-by, cc-by-sa) require source name, author and a
 *    traceable source URL.
 *  - `public-domain` requires a source name (provenance).
 *  - `original` platform material only *warns* about missing metadata.
 *  - `is_official_jlpt` requires a recognized official source AND a source URL.
 *  - A provided but malformed source URL is always a hard error.
 */

import {
  normalizeLicenseType,
  validateJlptOfficialStatus,
  type ExamLicenseType,
} from '../types/examMetadata';

export type LegalGateField =
  | 'copyright_confirmed'
  | 'license_type'
  | 'source_name'
  | 'source_url'
  | 'author'
  | 'is_official_jlpt';

export interface LegalGate {
  id: string;
  field: LegalGateField;
  /** Human readable field name (Uzbek) shown in the admin UI. */
  label: string;
  /** Full message surfaced in validation errors / warnings. */
  message: string;
  /** Blocking gates prevent publishing; non-blocking gates are advisory. */
  blocking: boolean;
}

export const LEGAL_FIELD_LABELS: Record<LegalGateField, string> = {
  copyright_confirmed: 'Mualliflik huquqi roziligi (copyright_confirmed)',
  license_type: 'Litsenziya turi (license_type)',
  source_name: 'Manba nomi (source_name)',
  source_url: 'Manba havolasi (source_url)',
  author: 'Muallif / nashriyot (author)',
  is_official_jlpt: 'Rasmiy JLPT belgisi (is_official_jlpt)',
};

export interface LegalGateInput {
  copyrightConfirmed?: boolean | null;
  licenseType?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  author?: string | null;
  isOfficialJlpt?: boolean | null;
  title?: string | null;
}

const ATTRIBUTION_LICENSES: ExamLicenseType[] = ['cc-by', 'cc-by-sa'];

function isValidSourceUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return Boolean(url.hostname) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Evaluates every legal gate for an exam. Blocking gates must be resolved
 * before the exam can move to `published`.
 */
export function evaluateLegalGates(input: LegalGateInput): LegalGate[] {
  const gates: LegalGate[] = [];

  const licenseType = normalizeLicenseType(input.licenseType);
  const sourceName = (input.sourceName || '').trim();
  const sourceUrl = (input.sourceUrl || '').trim();
  const author = (input.author || '').trim();
  const isOfficial = Boolean(input.isOfficialJlpt);

  // 1. Copyright confirmation — always mandatory.
  if (input.copyrightConfirmed !== true) {
    gates.push({
      id: 'copyright_not_confirmed',
      field: 'copyright_confirmed',
      label: LEGAL_FIELD_LABELS.copyright_confirmed,
      message:
        "Mualliflik huquqi tasdiqlanmagan: 'Mualliflik huquqi roziligi' katakchasini belgilash shart. Tasdiqlanmagan material nashr qilinmaydi.",
      blocking: true,
    });
  }

  // 2. Restricted license — never publishable without explicit legal approval.
  if (licenseType === 'restricted') {
    gates.push({
      id: 'restricted_license',
      field: 'license_type',
      label: LEGAL_FIELD_LABELS.license_type,
      message:
        "Cheklangan litsenziya ('restricted'): nashr qilish uchun aniq huquqiy ruxsat (legal approval) talab qilinadi. Platforma bu ruxsatni avtomatik bermaydi — litsenziyani o'zgartiring yoki huquqiy tasdiqlovchi admin tomonidan tasdiqlang.",
      blocking: true,
    });
  }

  // 3. Attribution metadata for licenses that require it.
  const requiresAttribution = ATTRIBUTION_LICENSES.includes(licenseType);
  const requiresProvenance = licenseType === 'public-domain';

  if (requiresAttribution || requiresProvenance) {
    if (!sourceName) {
      gates.push({
        id: 'missing_source_name',
        field: 'source_name',
        label: LEGAL_FIELD_LABELS.source_name,
        message: `Manba nomi (source_name) kiritilmagan. '${licenseType}' litsenziyasi uchun manba majburiy.`,
        blocking: true,
      });
    }
  } else if (!sourceName) {
    gates.push({
      id: 'recommended_source_name',
      field: 'source_name',
      label: LEGAL_FIELD_LABELS.source_name,
      message:
        'Manba nomi (source_name) kiritilmagan. Original material uchun ixtiyoriy, lekin attribution uchun tavsiya etiladi.',
      blocking: false,
    });
  }

  if (requiresAttribution && !author) {
    gates.push({
      id: 'missing_author',
      field: 'author',
      label: LEGAL_FIELD_LABELS.author,
      message: `Muallif / nashriyot (author) kiritilmagan. '${licenseType}' litsenziyasi uchun muallifni ko'rsatish majburiy.`,
      blocking: true,
    });
  } else if (!author && licenseType !== 'restricted') {
    gates.push({
      id: 'recommended_author',
      field: 'author',
      label: LEGAL_FIELD_LABELS.author,
      message: 'Muallif / nashriyot (author) kiritilmagan. Tavsiya etiladi.',
      blocking: false,
    });
  }

  if (requiresAttribution && !sourceUrl) {
    gates.push({
      id: 'missing_source_url',
      field: 'source_url',
      label: LEGAL_FIELD_LABELS.source_url,
      message: `Manba havolasi (source_url) kiritilmagan. '${licenseType}' litsenziyasi uchun manba havolasi majburiy.`,
      blocking: true,
    });
  } else if (!sourceUrl && !isOfficial) {
    gates.push({
      id: 'recommended_source_url',
      field: 'source_url',
      label: LEGAL_FIELD_LABELS.source_url,
      message: 'Manba havolasi (source_url) kiritilmagan. Tavsiya etiladi.',
      blocking: false,
    });
  }

  // 4. A malformed URL is always wrong.
  if (sourceUrl && !isValidSourceUrl(sourceUrl)) {
    gates.push({
      id: 'invalid_source_url',
      field: 'source_url',
      label: LEGAL_FIELD_LABELS.source_url,
      message:
        "Manba havolasi (source_url) noto'g'ri formatda. To'g'ri http:// yoki https:// bilan boshlanadigan to'liq manzil kiriting.",
      blocking: true,
    });
  }

  // 5. Official JLPT claims require a verifiable official source.
  if (isOfficial) {
    const officialCheck = validateJlptOfficialStatus({
      isOfficialJlpt: true,
      sourceName: sourceName || undefined,
      title: input.title || undefined,
    });
    if (!officialCheck.isValid && officialCheck.error) {
      gates.push({
        id: 'official_jlpt_unverified',
        field: 'is_official_jlpt',
        label: LEGAL_FIELD_LABELS.is_official_jlpt,
        message: officialCheck.error,
        blocking: true,
      });
    }
    if (!sourceUrl) {
      gates.push({
        id: 'official_missing_source_url',
        field: 'source_url',
        label: LEGAL_FIELD_LABELS.source_url,
        message:
          'Rasmiy JLPT belgisi uchun manba havolasi (source_url) majburiy — materialning rasmiy manbasini tasdiqlash uchun havola kiritish shart.',
        blocking: true,
      });
    }
  }

  return gates;
}

/** Only the gates that block publishing. */
export function blockingLegalGates(gates: LegalGate[]): LegalGate[] {
  return gates.filter((gate) => gate.blocking);
}

/** Unique list of fields that still block publishing. */
export function missingLegalFields(gates: LegalGate[]): LegalGateField[] {
  const fields: LegalGateField[] = [];
  for (const gate of blockingLegalGates(gates)) {
    if (!fields.includes(gate.field)) fields.push(gate.field);
  }
  return fields;
}

/** Short, human readable summary of what is still missing. */
export function describeMissingLegalFields(gates: LegalGate[]): string[] {
  return blockingLegalGates(gates).map((gate) => gate.label);
}
