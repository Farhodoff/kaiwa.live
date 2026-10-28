export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface JlptLevelBenchmark {
  level: JlptLevel;
  passMark: number; // out of 180
  sectionalFloor: number; // minimum points required per section (19 out of 60)
  vocabTarget: number;
  kanjiTarget: number;
  grammarTarget: number;
  readingTarget: number; // passages
  listeningTarget: number;
  speakingTarget: number;
}

export const JLPT_BENCHMARKS: Record<JlptLevel, JlptLevelBenchmark> = {
  N5: {
    level: 'N5',
    passMark: 80,
    sectionalFloor: 19,
    vocabTarget: 800,
    kanjiTarget: 100,
    grammarTarget: 40,
    readingTarget: 8,
    listeningTarget: 10,
    speakingTarget: 5,
  },
  N4: {
    level: 'N4',
    passMark: 90,
    sectionalFloor: 19,
    vocabTarget: 1500,
    kanjiTarget: 300,
    grammarTarget: 80,
    readingTarget: 12,
    listeningTarget: 15,
    speakingTarget: 10,
  },
  N3: {
    level: 'N3',
    passMark: 95,
    sectionalFloor: 19,
    vocabTarget: 3750,
    kanjiTarget: 650,
    grammarTarget: 140,
    readingTarget: 18,
    listeningTarget: 20,
    speakingTarget: 15,
  },
  N2: {
    level: 'N2',
    passMark: 90,
    sectionalFloor: 19,
    vocabTarget: 6000,
    kanjiTarget: 1000,
    grammarTarget: 200,
    readingTarget: 24,
    listeningTarget: 25,
    speakingTarget: 20,
  },
  N1: {
    level: 'N1',
    passMark: 100,
    sectionalFloor: 19,
    vocabTarget: 10000,
    kanjiTarget: 2000,
    grammarTarget: 300,
    readingTarget: 30,
    listeningTarget: 30,
    speakingTarget: 25,
  },
};

export interface UserSkillStats {
  vocabCount: number;
  vocabRetentionRate?: number; // 0-100
  kanjiCount: number;
  lessonKanjiMasteredCount?: number;
  lessonKanjiReviewedCount?: number;
  lessonKanjiTotalCount?: number;
  grammarMasteredCount: number;
  readingCompletedCount?: number;
  readingAccuracy?: number; // 0-100
  listeningCompletedCount: number;
  listeningAccuracy?: number; // 0-100
  speakingSessionsCount: number;
  speakingFluencyScore?: number; // 0-10
  mockExamHighestScore?: number; // 0-180
  unresolvedMistakesCount?: number;
  mistakesByCategory?: Partial<
    Record<'grammar' | 'kanji' | 'vocab' | 'reading' | 'listening', number>
  >;
}

export interface SkillPillarScore {
  key: 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'moji_goi';
  name: { uz: string; ja: string; en: string };
  shortName: string;
  score: number; // 0-100 normalized
  currentCount: number;
  targetCount: number;
  status: 'beginner' | 'developing' | 'proficient' | 'mastered';
}

export interface SectionalScoreEstimate {
  name: { uz: string; ja: string; en: string };
  score: number; // estimated 0-60
  maxScore: number; // 60
  floor: number; // 19
  isAtRisk: boolean; // score < 19
}

export interface JlptReadinessReport {
  level: JlptLevel;
  overallReadiness: number; // 0-100 percentage
  projectedScore: number; // 0-180
  passMark: number;
  passThresholdRatio: number; // e.g. 0.444 for N5
  passProbability: number; // 0-100
  isProjectedToPass: boolean;
  hasSectionalFailureRisk: boolean;
  radarData: { subject: string; score: number; fullMark: number }[]; // 5-item radar (backwards compatible)
  radarData4: { subject: string; score: number; fullMark: number }[]; // 4-item radar (official JLPT)
  pillars: SkillPillarScore[]; // 5 pillars
  fourPillars: SkillPillarScore[]; // 4 pillars
  sections: {
    gengoChishiki: SectionalScoreEstimate;
    dokkai: SectionalScoreEstimate;
    choukai: SectionalScoreEstimate;
  };
  weakestPillar: SkillPillarScore;
  actionableRecommendation: { uz: string; ja: string; en: string };
  unresolvedMistakesCount: number;
}

export class JlptReadinessService {
  /**
   * Calculates comprehensive readiness assessment for a target JLPT level.
   */
  static calculateReadiness(stats: UserSkillStats, level: JlptLevel = 'N5'): JlptReadinessReport {
    const benchmark = JLPT_BENCHMARKS[level] || JLPT_BENCHMARKS.N5;

    // Unresolved mistake penalties per category (deductions from skill scores, max 12 points per skill)
    const mistakePenalty = (cat: 'grammar' | 'kanji' | 'vocab' | 'reading' | 'listening') => {
      const count = stats.mistakesByCategory?.[cat] ?? 0;
      return Math.min(12, count * 2);
    };

    // 1. Calculate normalized 0-100 score per skill pillar
    // Vocabulary (Tango)
    const vocabRatio = Math.min(1.2, stats.vocabCount / benchmark.vocabTarget);
    const vocabRetention = (stats.vocabRetentionRate ?? 80) / 100;
    const rawVocabScore = Math.min(100, Math.round(vocabRatio * vocabRetention * 100));
    const vocabScore = Math.max(0, rawVocabScore - mistakePenalty('vocab'));

    // Kanji (Strokes & Recognition)
    const kanjiRatio = Math.min(1.2, stats.kanjiCount / benchmark.kanjiTarget);
    const rawKanjiScore = Math.min(100, Math.round(kanjiRatio * 100));
    const kanjiScore = Math.max(0, rawKanjiScore - mistakePenalty('kanji'));

    // Grammar (Bunpou)
    const grammarRatio = Math.min(1.2, stats.grammarMasteredCount / benchmark.grammarTarget);
    const rawGrammarScore = Math.min(100, Math.round(grammarRatio * 100));
    const grammarScore = Math.max(0, rawGrammarScore - mistakePenalty('grammar'));

    // Reading (Dokkai)
    const hasRealReading =
      stats.readingCompletedCount !== undefined && stats.readingCompletedCount > 0;
    const readingRatio = hasRealReading
      ? Math.min(1.2, stats.readingCompletedCount! / benchmark.readingTarget)
      : Math.min(1.2, (grammarScore * 0.6 + vocabScore * 0.4) / 100);
    const readingAcc = (stats.readingAccuracy ?? 75) / 100;
    const rawReadingScore = hasRealReading
      ? Math.min(100, Math.round(readingRatio * readingAcc * 100))
      : Math.round(grammarScore * 0.6 + vocabScore * 0.4);
    const readingScore = Math.max(0, rawReadingScore - mistakePenalty('reading'));

    // Listening (Choukai)
    const listeningRatio = Math.min(1.2, stats.listeningCompletedCount / benchmark.listeningTarget);
    const listeningAcc = (stats.listeningAccuracy ?? 75) / 100;
    const rawListeningScore = Math.min(100, Math.round(listeningRatio * listeningAcc * 100));
    const listeningScore = Math.max(0, rawListeningScore - mistakePenalty('listening'));

    // Speaking / Pronunciation (Kaiwa / Pitch)
    const speakingRatio = Math.min(1.2, stats.speakingSessionsCount / benchmark.speakingTarget);
    const fluencyAcc = Math.min(1, (stats.speakingFluencyScore ?? 7.0) / 10);
    const speakingScore = Math.min(100, Math.round(speakingRatio * fluencyAcc * 100));

    // Moji-Goi (Combined Vocabulary & Kanji for 4-pillar model)
    const mojiGoiScore = Math.min(100, Math.round(vocabScore * 0.6 + kanjiScore * 0.4));

    const getStatus = (score: number): 'beginner' | 'developing' | 'proficient' | 'mastered' => {
      if (score >= 85) return 'mastered';
      if (score >= 65) return 'proficient';
      if (score >= 40) return 'developing';
      return 'beginner';
    };

    // 5-Pillar breakdown (Tango, Kanji, Bunpou, Choukai, Kaiwa) for backwards compatibility & holistic practice
    const pillars: SkillPillarScore[] = [
      {
        key: 'vocabulary',
        name: { uz: "So'z Boyligi", ja: '単語・語彙', en: 'Vocabulary' },
        shortName: '単語 (Tango)',
        score: vocabScore,
        currentCount: stats.vocabCount,
        targetCount: benchmark.vocabTarget,
        status: getStatus(vocabScore),
      },
      {
        key: 'kanji',
        name: { uz: 'Kanji Iyerogliflari', ja: '漢字認識・筆記', en: 'Kanji' },
        shortName: '漢字 (Kanji)',
        score: kanjiScore,
        currentCount: stats.lessonKanjiMasteredCount ?? stats.kanjiCount,
        targetCount: stats.lessonKanjiTotalCount ?? benchmark.kanjiTarget,
        status: getStatus(kanjiScore),
      },
      {
        key: 'grammar',
        name: { uz: 'Grammatika', ja: '文法・構文', en: 'Grammar' },
        shortName: '文法 (Bunpou)',
        score: grammarScore,
        currentCount: stats.grammarMasteredCount,
        targetCount: benchmark.grammarTarget,
        status: getStatus(grammarScore),
      },
      {
        key: 'listening',
        name: { uz: 'Tinglab Tushunish', ja: '聴解・リスニング', en: 'Listening' },
        shortName: '聴解 (Choukai)',
        score: listeningScore,
        currentCount: stats.listeningCompletedCount,
        targetCount: benchmark.listeningTarget,
        status: getStatus(listeningScore),
      },
      {
        key: 'speaking',
        name: { uz: 'Nutq & Ohang', ja: '会話・アクセント', en: 'Speaking' },
        shortName: '会話 (Kaiwa)',
        score: speakingScore,
        currentCount: stats.speakingSessionsCount,
        targetCount: benchmark.speakingTarget,
        status: getStatus(speakingScore),
      },
    ];

    // Official 4-Pillar breakdown (Moji-Goi, Bunpou, Dokkai, Choukai)
    const fourPillars: SkillPillarScore[] = [
      {
        key: 'moji_goi',
        name: { uz: "Moji-Goi (So'z & Kanji)", ja: '文字・語彙', en: 'Vocabulary & Kanji' },
        shortName: '文字・語彙 (Moji-Goi)',
        score: mojiGoiScore,
        currentCount: stats.vocabCount + stats.kanjiCount,
        targetCount: benchmark.vocabTarget + benchmark.kanjiTarget,
        status: getStatus(mojiGoiScore),
      },
      {
        key: 'grammar',
        name: { uz: 'Bunpou (Grammatika)', ja: '文法・構文', en: 'Grammar' },
        shortName: '文法 (Bunpou)',
        score: grammarScore,
        currentCount: stats.grammarMasteredCount,
        targetCount: benchmark.grammarTarget,
        status: getStatus(grammarScore),
      },
      {
        key: 'reading',
        name: { uz: "Dokkai (O'qib Tushunish)", ja: '読解・長文', en: 'Reading Comprehension' },
        shortName: '読解 (Dokkai)',
        score: readingScore,
        currentCount: stats.readingCompletedCount ?? 0,
        targetCount: benchmark.readingTarget,
        status: getStatus(readingScore),
      },
      {
        key: 'listening',
        name: { uz: 'Choukai (Tinglash)', ja: '聴解・リスニング', en: 'Listening' },
        shortName: '聴解 (Choukai)',
        score: listeningScore,
        currentCount: stats.listeningCompletedCount,
        targetCount: benchmark.listeningTarget,
        status: getStatus(listeningScore),
      },
    ];

    // Weakest pillar
    const sortedPillars = [...pillars].sort((a, b) => a.score - b.score);
    const weakestPillar = sortedPillars[0];

    // 2. Sectional Estimates (each out of 60)
    // Section 1: Language Knowledge (Gengo Chishiki) = Vocab (50%) + Kanji (25%) + Grammar (25%)
    const gengoChishikiScore = Math.min(
      60,
      Math.round(((vocabScore * 0.5 + kanjiScore * 0.25 + grammarScore * 0.25) / 100) * 60),
    );

    // Section 2: Reading (Dokkai)
    // If real reading passages completed, blend them with grammar/vocab baseline
    const dokkaiScore = hasRealReading
      ? Math.min(
          60,
          Math.round(
            ((readingScore * 0.7 + (grammarScore * 0.6 + vocabScore * 0.4) * 0.3) / 100) * 60,
          ),
        )
      : Math.min(60, Math.round(((grammarScore * 0.6 + vocabScore * 0.4) / 100) * 60));

    // Section 3: Listening (Choukai) = Listening (80%) + Speaking/Pitch (20%)
    const choukaiScore = Math.min(
      60,
      Math.round(((listeningScore * 0.8 + speakingScore * 0.2) / 100) * 60),
    );

    const gengoSection: SectionalScoreEstimate = {
      name: {
        uz: 'Til Bilimi (Soʻz & Grammatika)',
        ja: '言語知識（文字・語彙・文法）',
        en: 'Language Knowledge',
      },
      score: gengoChishikiScore,
      maxScore: 60,
      floor: benchmark.sectionalFloor,
      isAtRisk: gengoChishikiScore < benchmark.sectionalFloor,
    };

    const dokkaiSection: SectionalScoreEstimate = {
      name: { uz: "O'qib Tushunish (Dokkai)", ja: '読解', en: 'Reading Comprehension' },
      score: dokkaiScore,
      maxScore: 60,
      floor: benchmark.sectionalFloor,
      isAtRisk: dokkaiScore < benchmark.sectionalFloor,
    };

    const choukaiSection: SectionalScoreEstimate = {
      name: { uz: 'Tinglab Tushunish (Choukai)', ja: '聴解', en: 'Listening' },
      score: choukaiScore,
      maxScore: 60,
      floor: benchmark.sectionalFloor,
      isAtRisk: choukaiScore < benchmark.sectionalFloor,
    };

    const hasSectionalFailureRisk =
      gengoSection.isAtRisk || dokkaiSection.isAtRisk || choukaiSection.isAtRisk;

    // 3. Projected Total Score (out of 180)
    const rawProjected = gengoChishikiScore + dokkaiScore + choukaiScore;
    // Factor in actual mock exam highest score if available
    const projectedScore =
      stats.mockExamHighestScore && stats.mockExamHighestScore > 0
        ? Math.round(rawProjected * 0.6 + stats.mockExamHighestScore * 0.4)
        : rawProjected;

    // 4. Pass Probability & Overall Readiness
    const overallReadiness = Math.min(
      100,
      Math.round(
        vocabScore * 0.25 +
          kanjiScore * 0.2 +
          grammarScore * 0.25 +
          listeningScore * 0.2 +
          speakingScore * 0.1,
      ),
    );

    let passProbability = 0;
    if (projectedScore >= benchmark.passMark && !hasSectionalFailureRisk) {
      // Scales between 70% and 98%
      const surplus = projectedScore - benchmark.passMark;
      passProbability = Math.min(98, 70 + Math.round((surplus / 40) * 28));
    } else if (hasSectionalFailureRisk) {
      // Risk of failing despite good total score
      passProbability = Math.min(45, Math.round((projectedScore / benchmark.passMark) * 40));
    } else {
      // Below pass mark
      passProbability = Math.max(5, Math.round((projectedScore / benchmark.passMark) * 65));
    }

    const isProjectedToPass = projectedScore >= benchmark.passMark && !hasSectionalFailureRisk;

    // 5. Radar Chart Data
    const radarData = pillars.map((p) => ({
      subject: p.shortName,
      score: p.score,
      fullMark: 100,
    }));

    const radarData4 = fourPillars.map((p) => ({
      subject: p.shortName,
      score: p.score,
      fullMark: 100,
    }));

    const passThresholdRatio = Math.round((benchmark.passMark / 180) * 1000) / 1000;

    const unresolvedMistakesCount =
      stats.unresolvedMistakesCount ??
      (stats.mistakesByCategory
        ? Object.values(stats.mistakesByCategory).reduce((acc, n) => acc + (n || 0), 0)
        : 0);

    // 6. Actionable Recommendation
    let actionableRecommendation = {
      uz: `JLPT ${level} imtihoniga tayyorgarlik darajangiz yuqori! Rasmiy Mock Exam sinovidan o'ting.`,
      ja: `JLPT ${level}の準備は順調です！本番模擬試験に挑戦してみましょう。`,
      en: `Your JLPT ${level} readiness is solid! Take an official Mock Exam to validate.`,
    };

    if (hasSectionalFailureRisk) {
      if (choukaiSection.isAtRisk) {
        actionableRecommendation = {
          uz: "Diqqat: Tinglash (Choukai) bo'limi 19 ballik minimal xavf ostida! Kuniga kamida 2 ta audio dialogni Audio Sync rejimida tinglang.",
          ja: '警告：聴解セクションが19点未満の足切りリスクに直面しています！Audio Syncで毎日2問以上練習してください。',
          en: 'Caution: Listening score is at risk of falling below the 19-point cutoff! Practice 2+ dialogues daily in Audio Sync.',
        };
      } else if (dokkaiSection.isAtRisk) {
        actionableRecommendation = {
          uz: "Diqqat: O'qish (Dokkai) bo'limi xavf ostida! Minna no Nihongo matnlari va grammatik tuzilmalarni takrorlang.",
          ja: '警告：読解セクションが足切りライン付近です！文法解説と長文読解を強化しましょう。',
          en: 'Caution: Reading score is near the cutoff threshold! Reinforce grammar patterns and reading passages.',
        };
      } else {
        actionableRecommendation = {
          uz: "Diqqat: Til bilimi bo'limi xavf ostida! Kunlik 10 tadan Kanji va fleshkarta takrorlashni odat qiling.",
          ja: '警告：言語知識（文字・語彙）が不足しています！漢字書き順と語彙フラッシュカードを集中復習してください。',
          en: 'Caution: Language Knowledge score is near the cutoff! Prioritize kanji strokes and vocabulary flashcards.',
        };
      }
    } else if (unresolvedMistakesCount >= 5) {
      actionableRecommendation = {
        uz: `Xatolar daftarchangizda ${unresolvedMistakesCount} ta xato to'plangan! Xatolarni tuzatmaslik imtihon ballingizni pasaytiradi.`,
        ja: `間違いノートに未復習の誤答が${unresolvedMistakesCount}件あります！早めの復習を推奨します。`,
        en: `You have ${unresolvedMistakesCount} unresolved mistakes in your vault! Review them to boost your exam score.`,
      };
    } else if (weakestPillar.score < 50) {
      actionableRecommendation = {
        uz: `Eng zaif bo'g'iningiz: ${weakestPillar.name.uz} (${weakestPillar.score}%). Ushbu soha bo'yicha kunlik mashg'ulotlarni ko'paytiring.`,
        ja: `最も苦手な分野: ${weakestPillar.name.ja} (${weakestPillar.score}%)。集中的な学習を推奨します。`,
        en: `Your weakest skill is ${weakestPillar.name.en} (${weakestPillar.score}%). Focus your next study sessions here.`,
      };
    }

    return {
      level,
      overallReadiness,
      projectedScore,
      passMark: benchmark.passMark,
      passThresholdRatio,
      passProbability,
      isProjectedToPass,
      hasSectionalFailureRisk,
      radarData,
      radarData4,
      pillars,
      fourPillars,
      sections: {
        gengoChishiki: gengoSection,
        dokkai: dokkaiSection,
        choukai: choukaiSection,
      },
      weakestPillar,
      actionableRecommendation,
      unresolvedMistakesCount,
    };
  }
}
