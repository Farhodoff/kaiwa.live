import { describe, it, expect } from 'vitest';
import { CurriculumCoverageReportService } from '../CurriculumCoverageReportService';
import type { Lesson } from '../../types/lesson';

describe('CurriculumCoverageReportService Unit Tests', () => {
  const sampleLesson: Lesson = {
    id: 'ja-n2-u1-l1',
    courseId: 'japanese',
    unitId: 'ja-n2-u1',
    unitTitle: 'N2 Unit 1',
    language: 'ja',
    level: 'N2',
    lessonNumber: 1,
    title: 'Parallel Oʻzgarish Qoidalari',
    description: 'N2 parallel oʻzgarish grammatikalari',
    estimatedDurationMinutes: 30,
    steps: [
      {
        id: 'ja-n2-u1-l1-s1',
        title: 'Learn',
        type: 'learn',
        estimatedMinutes: 10,
        learnData: {
          title: 'Learn Step',
          explanation: 'Grammar explanation',
          vocabulary: [
            {
              term: '衰える',
              reading: 'otoroeru',
              meaning: 'Zaiflashmoq',
              exampleSentence: '体力が衰える。',
            },
            {
              term: '深刻化',
              reading: 'shinkokuka',
              meaning: 'Jiddiylashuv',
              exampleSentence: '少子高齢化が深刻化する。',
            },
            {
              term: '変容する',
              reading: 'henyou suru',
              meaning: 'Oʻzgarmoq',
              exampleSentence: '生活様式が変容した。',
            },
            {
              term: '推移する',
              reading: 'suii suru',
              meaning: 'Siljimoq',
              exampleSentence: '為替レートの推移。',
            },
            {
              term: '連動する',
              reading: 'rendou suru',
              meaning: 'Bogʻliq holda oʻzgarmoq',
              exampleSentence: '物価に連動する。',
            },
          ],
          grammarRules: [
            {
              pattern: '〜につれて / 〜にしたがって',
              meaning: 'Boshqa hodisa oʻzgargani sari parallel oʻzgarish',
              usageNotes: 'Natural changes',
              examples: [
                {
                  sentence: '年を取るにつれて体力が衰える。',
                  translation: 'Yosh oʻtgan sari quvvat ketadi.',
                },
              ],
            },
          ],
        },
      },
      {
        id: 'ja-n2-u1-l1-s2',
        title: 'Practice',
        type: 'practice',
        estimatedMinutes: 10,
        practiceData: {
          instructions: 'Mashqlarni bajaring',
          exercises: Array.from({ length: 12 }, (_, i) => ({
            id: `ex-${i}`,
            type: 'multiple-choice',
            prompt: `Exercise ${i + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            explanation: 'Exp',
          })),
        },
      },
      {
        id: 'ja-n2-u1-l1-s3',
        title: 'Test',
        type: 'test',
        estimatedMinutes: 10,
        testData: {
          instructions: 'Savollarga javob bering',
          passingScorePercentage: 80,
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `q-${i}`,
            question: `Question ${i + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
            explanation: 'Exp',
          })),
        },
      },
    ],
  };

  it('1. audits a single lesson accurately across vocabulary, grammar, kanji and exercises', () => {
    const audit = CurriculumCoverageReportService.auditLesson(sampleLesson);

    expect(audit.lessonId).toBe('ja-n2-u1-l1');
    expect(audit.vocabularyCount).toBe(5);
    expect(audit.vocabularyWithExampleCount).toBe(5);
    expect(audit.grammarRuleCount).toBe(1);
    expect(audit.practiceCount).toBe(12);
    expect(audit.testCount).toBe(10);
    expect(audit.coverageScore).toBeGreaterThanOrEqual(80);
    expect(audit.coveredSkills).toContain('vocabulary');
    expect(audit.coveredSkills).toContain('grammar');
  });

  it('2. audits entire N2 level (all 30 lessons) from canonical loaders', async () => {
    const n2Summary = await CurriculumCoverageReportService.auditLevel('N2');

    expect(n2Summary.level).toBe('N2');
    expect(n2Summary.totalLessons).toBe(30);
    expect(n2Summary.totalVocabulary).toBeGreaterThan(100);
    expect(n2Summary.totalGrammarRules).toBeGreaterThanOrEqual(30);
    expect(n2Summary.totalPracticeExercises).toBeGreaterThan(300);
    expect(n2Summary.totalTestQuestions).toBeGreaterThan(250);
    expect(n2Summary.averageCoverageScore).toBeGreaterThanOrEqual(75);
  });

  it('3. audits entire N1 level (all 30 lessons) from canonical loaders', async () => {
    const n1Summary = await CurriculumCoverageReportService.auditLevel('N1');

    expect(n1Summary.level).toBe('N1');
    expect(n1Summary.totalLessons).toBe(30);
    expect(n1Summary.totalVocabulary).toBeGreaterThan(100);
    expect(n1Summary.totalGrammarRules).toBeGreaterThanOrEqual(30);
    expect(n1Summary.totalPracticeExercises).toBeGreaterThan(300);
    expect(n1Summary.totalTestQuestions).toBeGreaterThan(250);
    expect(n1Summary.averageCoverageScore).toBeGreaterThanOrEqual(75);
  });

  it('4. generates comprehensive report and exports clean markdown', async () => {
    const report = await CurriculumCoverageReportService.generateComprehensiveReport();

    expect(report.overallSummary.totalLessons).toBe(60); // 30 N2 + 30 N1
    expect(report.overallSummary.totalVocabulary).toBeGreaterThan(200);
    expect(report.overallSummary.overallAverageScore).toBeGreaterThanOrEqual(75);

    const markdown = CurriculumCoverageReportService.formatMarkdownReport(report);
    expect(markdown).toContain('# JLPT N2 va N1 Darslari Qamrov Hisoboti');
    expect(markdown).toContain('N2 Darajasi Qamrovi');
    expect(markdown).toContain('N1 Darajasi Qamrovi');
    expect(markdown).toContain('| Dars # | Dars Nomi |');
  });
});
