/**
 * JLPT Rasmiy Formatdagi Ball Hisoblash va Baholash Dvigateli
 *
 * Rasmiy Yaponiya Xalqaro Jamg'armasi (Japan Foundation & JEES) mezonlari:
 * - Har bir bo'lim (Til bilimi, O'qish, Eshitish) 60 balldan, jami 180 ball.
 * - Har bir bo'lim uchun minimal o'tish balli (Sectional Cutoff / 基準点): 19/60 ball.
 * - Umumiy o'tish balli (Overall Pass Mark / 合格点):
 *   N1: 100/180
 *   N2: 90/180
 *   N3: 95/180
 *   N4: 90/180
 *   N5: 80/180
 * - Agar talaba umumiy balldan o'tsa-yu, bitta bo'limdan 19 balldan kam to'plasa -> FUGOUKAKU (不合格 / O'TMADI).
 */

export type JlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
export type JlptSectionKey = 'knowledge' | 'reading' | 'listening';

export interface JlptSectionScore {
  section: JlptSectionKey;
  titleUz: string;
  titleJa: string;
  icon: string;
  score: number; // 0..60
  maxScore: 60;
  passMark: number; // 19
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
}

export type JlptPassStatusReason =
  'PASSED' | 'FAILED_SECTION_CUTOFF' | 'FAILED_TOTAL_CUTOFF' | 'FAILED_BOTH';

export interface JlptScoreReport {
  level: JlptLevel;
  totalScore: number; // 0..180
  maxScore: 180;
  passMark: number;
  passed: boolean;
  statusReason: JlptPassStatusReason;
  statusTextUz: string;
  statusTextJa: string;
  statusBadge: 'goukaku' | 'fugoukaku';
  sections: Record<JlptSectionKey, JlptSectionScore>;
  failedSections: JlptSectionKey[];
  weakestSection: JlptSectionKey;
  correctTotal: number;
  questionsTotal: number;
  accuracyPercentage: number;
  passProbability?: number; // 0..100
}

export const JLPT_LEVEL_THRESHOLDS: Record<
  JlptLevel,
  { passMark: number; sectionPassMark: number }
> = {
  N1: { passMark: 100, sectionPassMark: 19 },
  N2: { passMark: 90, sectionPassMark: 19 },
  N3: { passMark: 95, sectionPassMark: 19 },
  N4: { passMark: 90, sectionPassMark: 19 },
  N5: { passMark: 80, sectionPassMark: 19 },
};

export const SECTION_METADATA: Record<
  JlptSectionKey,
  { titleUz: string; titleJa: string; icon: string; defaultPassMark: number }
> = {
  knowledge: {
    titleUz: "Til bilimi (Lug'at & Grammatika)",
    titleJa: '言語知識（文字・語彙・文法）',
    icon: '⛩️',
    defaultPassMark: 19,
  },
  reading: {
    titleUz: "O'qib tushunish (Dokkai)",
    titleJa: '読解',
    icon: '📖',
    defaultPassMark: 19,
  },
  listening: {
    titleUz: 'Tinglab tushunish (Choukai)',
    titleJa: '聴解',
    icon: '🎧',
    defaultPassMark: 19,
  },
};

export interface RawExamQuestionInput {
  id: number | string;
  section: JlptSectionKey;
  correctAnswer: number;
}

/**
 * JLPT Rasmiy formatdagi natijani hisoblash funksiyasi
 */
export function calculateJlptScore(
  levelInput: string,
  questions: RawExamQuestionInput[],
  userAnswers: Record<string | number, number>,
): JlptScoreReport {
  const cleanLevel: JlptLevel = (
    ['N1', 'N2', 'N3', 'N4', 'N5'].includes(levelInput?.toUpperCase())
      ? levelInput.toUpperCase()
      : 'N5'
  ) as JlptLevel;

  const thresholds = JLPT_LEVEL_THRESHOLDS[cleanLevel];
  const sectionKeys: JlptSectionKey[] = ['knowledge', 'reading', 'listening'];

  const sectionCounts: Record<JlptSectionKey, { correct: number; total: number }> = {
    knowledge: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
  };

  questions.forEach((q) => {
    const sec = q.section && sectionCounts[q.section] ? q.section : 'knowledge';
    sectionCounts[sec].total += 1;
    const ans = userAnswers[q.id];
    if (ans !== undefined && ans === q.correctAnswer) {
      sectionCounts[sec].correct += 1;
    }
  });

  // Calculate scaled scores out of 60 for each section
  const sections = {} as Record<JlptSectionKey, JlptSectionScore>;
  const failedSections: JlptSectionKey[] = [];
  let weakestSection: JlptSectionKey = 'knowledge';
  let minSectionScorePercent = 101;

  sectionKeys.forEach((sec) => {
    const data = sectionCounts[sec];
    const totalQ = data.total;
    const correctQ = data.correct;
    const pct = totalQ > 0 ? (correctQ / totalQ) * 100 : 0;
    // 60 ballik masshtab
    const scaledScore = totalQ > 0 ? Math.round((correctQ / totalQ) * 60) : 0;
    const passedSection = scaledScore >= thresholds.sectionPassMark;

    if (!passedSection) {
      failedSections.push(sec);
    }

    if (pct < minSectionScorePercent) {
      minSectionScorePercent = pct;
      weakestSection = sec;
    }

    sections[sec] = {
      section: sec,
      titleUz: SECTION_METADATA[sec].titleUz,
      titleJa: SECTION_METADATA[sec].titleJa,
      icon: SECTION_METADATA[sec].icon,
      score: scaledScore,
      maxScore: 60,
      passMark: thresholds.sectionPassMark,
      passed: passedSection,
      correctCount: correctQ,
      totalQuestions: totalQ,
      percentage: Math.round(pct),
    };
  });

  const totalScore = sections.knowledge.score + sections.reading.score + sections.listening.score;
  const correctTotal =
    sections.knowledge.correctCount +
    sections.reading.correctCount +
    sections.listening.correctCount;
  const questionsTotal =
    sections.knowledge.totalQuestions +
    sections.reading.totalQuestions +
    sections.listening.totalQuestions;
  const accuracyPercentage =
    questionsTotal > 0 ? Math.round((correctTotal / questionsTotal) * 100) : 0;

  const passedOverallScore = totalScore >= thresholds.passMark;
  const passedAllSections = failedSections.length === 0;
  const passed = passedOverallScore && passedAllSections;

  let statusReason: JlptPassStatusReason = 'PASSED';
  let statusTextUz = `Tabriklaymiz! JLPT ${cleanLevel} imtihonidan muvaffaqiyatli o'tdingiz!`;
  let statusTextJa = `合格（ごうかく）- おめでとうございます！`;

  if (!passedOverallScore && !passedAllSections) {
    statusReason = 'FAILED_BOTH';
    statusTextUz = `Umumiy ball (${totalScore}/${thresholds.passMark}) va bo'limlar minimal chegarasi (19 ball) yetmadi.`;
    statusTextJa = '不合格（ふごうかく）- 総合得点および基準点未達';
  } else if (!passedOverallScore) {
    statusReason = 'FAILED_TOTAL_CUTOFF';
    statusTextUz = `Umumiy ball yetarli emas (${totalScore}/${thresholds.passMark}). O'tish uchun kamida ${thresholds.passMark} ball kerak.`;
    statusTextJa = '不合格（ふごうかく）- 総合得点未達';
  } else if (!passedAllSections) {
    statusReason = 'FAILED_SECTION_CUTOFF';
    const failedNames = failedSections.map((s) => SECTION_METADATA[s].titleUz).join(', ');
    statusTextUz = `Diqqat: Umumiy ballingiz (${totalScore}/${thresholds.passMark}) yetarli, lekin quyidagi bo'lim(lar)da minimal 19 ball to'planmadi: ${failedNames}. JLPT rasmiy qoidasiga ko'ra imtihon topshirilmadi deb hisoblanadi.`;
    statusTextJa = '不合格（ふごうかく）- 基準点（足切り）未達';
  }

  // Statistical Pass Probability Prediction (0..100)
  let passProbability = 0;
  if (passed) {
    if (totalScore >= thresholds.passMark + 30) {
      passProbability = Math.min(
        99,
        90 +
          Math.round(
            ((totalScore - thresholds.passMark - 30) /
              Math.max(1, 180 - thresholds.passMark - 30)) *
              9,
          ),
      );
    } else if (totalScore >= thresholds.passMark + 15) {
      passProbability = 85 + Math.round(((totalScore - thresholds.passMark - 15) / 15) * 5);
    } else {
      passProbability = 75 + Math.round(((totalScore - thresholds.passMark) / 15) * 9);
    }
  } else {
    if (passedOverallScore && !passedAllSections) {
      const minFloorScore = Math.min(...failedSections.map((s) => sections[s].score));
      passProbability = Math.max(25, Math.round(55 * (minFloorScore / thresholds.sectionPassMark)));
    } else {
      const scoreRatio = Math.min(1.0, totalScore / Math.max(1, thresholds.passMark));
      passProbability = Math.round(scoreRatio * 60);
    }
  }

  return {
    level: cleanLevel,
    totalScore,
    maxScore: 180,
    passMark: thresholds.passMark,
    passed,
    statusReason,
    statusTextUz,
    statusTextJa,
    statusBadge: passed ? 'goukaku' : 'fugoukaku',
    sections,
    failedSections,
    weakestSection,
    correctTotal,
    questionsTotal,
    accuracyPercentage,
    passProbability,
  };
}
