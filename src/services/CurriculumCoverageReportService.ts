import type { Lesson } from '../types/lesson';
import { LEVEL_LOADERS } from '../data/curriculum/curriculumLessons';
import { LessonKanjiService } from './LessonKanjiService';

export interface LessonCoverageAudit {
  lessonId: string;
  lessonNumber: number;
  title: string;
  level: string;
  unitId: string;
  vocabularyCount: number;
  vocabularyWithExampleCount: number;
  grammarRuleCount: number;
  kanjiCount: number;
  hasReading: boolean;
  readingItemCount: number;
  hasListening: boolean;
  listeningItemCount: number;
  practiceCount: number;
  testCount: number;
  coverageScore: number; // 0 to 100
  coveredSkills: Array<'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening'>;
  missingSkills: Array<'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening'>;
}

export interface LevelCoverageSummary {
  level: 'N2' | 'N1';
  totalLessons: number;
  totalVocabulary: number;
  totalGrammarRules: number;
  totalKanji: number;
  totalPracticeExercises: number;
  totalTestQuestions: number;
  lessonsWithReadingCount: number;
  lessonsWithListeningCount: number;
  averageCoverageScore: number;
  lessons: LessonCoverageAudit[];
}

export interface CurriculumCoverageReport {
  generatedAt: string;
  levels: LevelCoverageSummary[];
  overallSummary: {
    totalLevels: number;
    totalLessons: number;
    totalVocabulary: number;
    totalGrammarRules: number;
    totalKanji: number;
    totalPracticeExercises: number;
    totalTestQuestions: number;
    overallAverageScore: number;
  };
}

export const CurriculumCoverageReportService = {
  /**
   * Audits a single lesson across all 5 pedagogical pillars:
   * Vocabulary, Grammar, Kanji, Reading (Dokkai), and Listening (Choukai).
   */
  auditLesson(lesson: Lesson): LessonCoverageAudit {
    let vocabularyCount = 0;
    let vocabularyWithExampleCount = 0;
    let grammarRuleCount = 0;
    let readingItemCount = 0;
    let listeningItemCount = 0;
    let practiceCount = 0;
    let testCount = 0;

    for (const step of lesson.steps || []) {
      if (step.type === 'learn') {
        const vocabList = step.learnData?.vocabulary || [];
        vocabularyCount += vocabList.length;
        vocabularyWithExampleCount += vocabList.filter(
          (v) => Boolean(v.exampleSentence?.trim()) && Boolean(v.meaning?.trim()),
        ).length;

        const grammarList = step.learnData?.grammarRules || [];
        grammarRuleCount += grammarList.length;

        // Check if learn step includes reading passage or dialogue
        if (
          step.learnData?.dialogue?.lines?.length ||
          step.title.toLowerCase().includes('dokkai') ||
          step.title.toLowerCase().includes('reading')
        ) {
          readingItemCount += 1;
        }
      }

      if (step.type === 'practice') {
        const exercises = step.practiceData?.exercises || [];
        practiceCount += exercises.length;
        for (const ex of exercises) {
          const prompt = (ex.prompt || '').toLowerCase();
          const category = (ex.category || '').toLowerCase();
          if (
            category.includes('reading') ||
            prompt.includes('o‘qib') ||
            prompt.includes('matn') ||
            prompt.includes('dokkai')
          ) {
            readingItemCount += 1;
          }
          if (
            category.includes('listening') ||
            prompt.includes('eshit') ||
            prompt.includes('choukai') ||
            prompt.includes('audio')
          ) {
            listeningItemCount += 1;
          }
        }
      }

      if (step.type === 'test') {
        const questions = step.testData?.questions || [];
        testCount += questions.length;
        for (const q of questions) {
          const text = (q.question || '').toLowerCase();
          if (text.includes('dokkai') || text.includes('o‘qish') || text.includes('matn')) {
            readingItemCount += 1;
          }
          if (text.includes('choukai') || text.includes('tinglash') || text.includes('audio')) {
            listeningItemCount += 1;
          }
        }
      }
    }

    const kanjiList = LessonKanjiService.getLessonKanji(lesson);
    const kanjiCount = kanjiList.length;

    // Evaluate 5 skills
    const coveredSkills: LessonCoverageAudit['coveredSkills'] = [];
    const missingSkills: LessonCoverageAudit['missingSkills'] = [];

    if (vocabularyCount >= 5) coveredSkills.push('vocabulary');
    else missingSkills.push('vocabulary');

    if (grammarRuleCount >= 1) coveredSkills.push('grammar');
    else missingSkills.push('grammar');

    if (kanjiCount >= 3) coveredSkills.push('kanji');
    else missingSkills.push('kanji');

    if (readingItemCount >= 1) coveredSkills.push('reading');
    else missingSkills.push('reading');

    if (listeningItemCount >= 1) coveredSkills.push('listening');
    else missingSkills.push('listening');

    // Score calculation (weighting: Vocab 25%, Grammar 25%, Kanji 20%, Practice/Test 20%, Reading/Listening 10%)
    let score = 0;
    if (vocabularyCount >= 5) score += 25;
    else score += (vocabularyCount / 5) * 25;

    if (grammarRuleCount >= 1) score += 25;
    else score += 10; // partial baseline

    if (kanjiCount >= 3) score += 20;
    else score += (kanjiCount / 3) * 20;

    const totalExercises = practiceCount + testCount;
    if (totalExercises >= 15) score += 20;
    else score += (totalExercises / 15) * 20;

    if (readingItemCount > 0) score += 5;
    if (listeningItemCount > 0) score += 5;

    const coverageScore = Math.min(100, Math.round(score));

    return {
      lessonId: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      level: lesson.level,
      unitId: lesson.unitId,
      vocabularyCount,
      vocabularyWithExampleCount,
      grammarRuleCount,
      kanjiCount,
      hasReading: readingItemCount > 0,
      readingItemCount,
      hasListening: listeningItemCount > 0,
      listeningItemCount,
      practiceCount,
      testCount,
      coverageScore,
      coveredSkills,
      missingSkills,
    };
  },

  /**
   * Loads and audits all lessons of a specific level (e.g. N2 or N1).
   */
  async auditLevel(level: 'N2' | 'N1'): Promise<LevelCoverageSummary> {
    const loader = LEVEL_LOADERS[level];
    if (!loader) {
      throw new Error(`Noma'lum daraja: ${level}`);
    }
    const lessons = await loader();
    const auditedLessons = lessons.map((l) => this.auditLesson(l));

    const totalLessons = auditedLessons.length;
    const totalVocabulary = auditedLessons.reduce((acc, l) => acc + l.vocabularyCount, 0);
    const totalGrammarRules = auditedLessons.reduce((acc, l) => acc + l.grammarRuleCount, 0);
    const totalKanji = auditedLessons.reduce((acc, l) => acc + l.kanjiCount, 0);
    const totalPracticeExercises = auditedLessons.reduce((acc, l) => acc + l.practiceCount, 0);
    const totalTestQuestions = auditedLessons.reduce((acc, l) => acc + l.testCount, 0);
    const lessonsWithReadingCount = auditedLessons.filter((l) => l.hasReading).length;
    const lessonsWithListeningCount = auditedLessons.filter((l) => l.hasListening).length;
    const averageCoverageScore = totalLessons
      ? Math.round(auditedLessons.reduce((acc, l) => acc + l.coverageScore, 0) / totalLessons)
      : 0;

    return {
      level,
      totalLessons,
      totalVocabulary,
      totalGrammarRules,
      totalKanji,
      totalPracticeExercises,
      totalTestQuestions,
      lessonsWithReadingCount,
      lessonsWithListeningCount,
      averageCoverageScore,
      lessons: auditedLessons,
    };
  },

  /**
   * Generates a comprehensive curriculum coverage report for both N2 and N1.
   */
  async generateComprehensiveReport(): Promise<CurriculumCoverageReport> {
    const [n2Summary, n1Summary] = await Promise.all([
      this.auditLevel('N2'),
      this.auditLevel('N1'),
    ]);

    const levels = [n2Summary, n1Summary];
    const totalLessons = levels.reduce((acc, l) => acc + l.totalLessons, 0);
    const totalVocabulary = levels.reduce((acc, l) => acc + l.totalVocabulary, 0);
    const totalGrammarRules = levels.reduce((acc, l) => acc + l.totalGrammarRules, 0);
    const totalKanji = levels.reduce((acc, l) => acc + l.totalKanji, 0);
    const totalPracticeExercises = levels.reduce((acc, l) => acc + l.totalPracticeExercises, 0);
    const totalTestQuestions = levels.reduce((acc, l) => acc + l.totalTestQuestions, 0);
    const overallAverageScore = levels.length
      ? Math.round(levels.reduce((acc, l) => acc + l.averageCoverageScore, 0) / levels.length)
      : 0;

    return {
      generatedAt: new Date().toISOString(),
      levels,
      overallSummary: {
        totalLevels: levels.length,
        totalLessons,
        totalVocabulary,
        totalGrammarRules,
        totalKanji,
        totalPracticeExercises,
        totalTestQuestions,
        overallAverageScore,
      },
    };
  },

  /**
   * Exports the coverage report in clean GitHub Flavored Markdown.
   */
  formatMarkdownReport(report: CurriculumCoverageReport): string {
    const lines: string[] = [];

    lines.push('# JLPT N2 va N1 Darslari Qamrov Hisoboti (Coverage Report)');
    lines.push(`\n**Yaratilgan sana:** ${new Date(report.generatedAt).toLocaleString('uz-UZ')}`);
    lines.push(
      `**Umumiy o'rtacha ball:** \`${report.overallSummary.overallAverageScore} / 100\` | **Jami darslar:** ${report.overallSummary.totalLessons} ta`,
    );
    lines.push('\n---\n');

    for (const lvl of report.levels) {
      lines.push(`## 📊 ${lvl.level} Darajasi Qamrovi`);
      lines.push(`- **Darslar soni:** ${lvl.totalLessons} ta`);
      lines.push(`- **Lug‘at (Vocabulary):** ${lvl.totalVocabulary} ta so‘z`);
      lines.push(`- **Grammatika qoidalari:** ${lvl.totalGrammarRules} ta`);
      lines.push(`- **Kanji belgilari:** ${lvl.totalKanji} ta`);
      lines.push(`- **Amaliy mashqlar (Practice):** ${lvl.totalPracticeExercises} ta`);
      lines.push(`- **Test savollari (Tests):** ${lvl.totalTestQuestions} ta`);
      lines.push(`- **O‘rtacha pedagogik qamrov bali:** \`${lvl.averageCoverageScore}%\`\n`);

      lines.push(
        '| Dars # | Dars Nomi | Lug‘at | Grammatika | Kanji | Mashqlar | Testlar | Qamrov Bali |',
      );
      lines.push('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

      for (const item of lvl.lessons) {
        lines.push(
          `| ${item.lessonNumber} | ${item.title} | ${item.vocabularyCount} ta | ${item.grammarRuleCount} ta | ${item.kanjiCount} ta | ${item.practiceCount} ta | ${item.testCount} ta | **${item.coverageScore}%** |`,
        );
      }
      lines.push('\n');
    }

    return lines.join('\n');
  },
};
