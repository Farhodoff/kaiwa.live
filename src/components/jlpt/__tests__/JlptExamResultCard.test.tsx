import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JlptExamResultCard } from '../JlptExamResultCard';
import { JlptScoreReport } from '../../../utils/jlptScoring';

const mockAddFlashcardsBatch = vi.fn();
const mockUser = { id: 'test-user-123', email: 'test@example.com' };
vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: mockUser,
    addFlashcardsBatch: mockAddFlashcardsBatch,
  }),
}));

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('JlptExamResultCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleReport = {
    overall_score_text: "JLPT N5: 8/10 (80%) - MUVAFFAQIYATLI (O'TDI 🎉)",
    percentage: 80,
    passed: true,
    top_3_mistakes: [
      {
        title: 'Yuklama xatosi (を vs に)',
        explanation_uz: "Harakat ob'ekti uchun 'o' o'rniga 'ni' ishlatildi.",
        correct_concept: "Har doim harakat vositasiz ob'ekti bilan を ishlatiladi.",
      },
    ],
    actionable_recommendation: 'Kunlik 10 ta grammatika qoidasini takrorlang.',
  };

  const sampleMistakes = [
    {
      questionText: '毎朝、パン _____ 食べます。',
      section: 'knowledge',
      userAnswer: 'に',
      correctAnswer: 'を',
      isCorrect: false,
      explanationUzbek: "Vositasiz to'ldiruvchi uchun 'を' yuklamasi kerak.",
    },
    {
      questionText: '学校 _____ バスで行きます。',
      section: 'knowledge',
      userAnswer: 'を',
      correctAnswer: 'へ',
      isCorrect: false,
      explanationUzbek: "Harakat yo'nalishi uchun 'へ' qo'llaniladi.",
    },
  ];

  it('renders score percentage and level properly', () => {
    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    expect(screen.getByText('JLPT N5 Imtihon Natijasi')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('shows mistakes export section and allows batch export to flashcards', async () => {
    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        mistakes={sampleMistakes}
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    expect(screen.getByText(/Xatolarni Fleshkartaga Saqlash/i)).toBeInTheDocument();
    expect(screen.getByText(/2 ta savol/i)).toBeInTheDocument();

    const exportBtn = screen.getByRole('button', { name: /Fleshkartalarga saqlash/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockAddFlashcardsBatch).toHaveBeenCalledTimes(1);
    });

    const exportedBatch = mockAddFlashcardsBatch.mock.calls[0][0];
    expect(exportedBatch).toHaveLength(2);
    expect(exportedBatch[0].front).toContain('JLPT N5 Savol (KNOWLEDGE)');
    expect(exportedBatch[0].back).toContain("To'g'ri javob:\nを");
    expect(exportedBatch[0].back).toContain('Sizning javobingiz:\nに');

    // Button should now show saved state
    expect(screen.getByText(/Saqlandi \(Anki SRS\)/i)).toBeInTheDocument();
  });

  it('toggles full mistakes detail view when clicked', () => {
    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        mistakes={sampleMistakes}
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    const toggleBtn = screen.getByText(/Barcha 2 ta xatolarni ko'rish/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Savol #1/i)).toBeInTheDocument();
    expect(screen.getByText(/毎朝、パン _____ 食べます。/i)).toBeInTheDocument();
    expect(screen.getByText(/❌ Sizning javob: に/i)).toBeInTheDocument();
    expect(screen.getByText(/✅ To'g'ri javob: を/i)).toBeInTheDocument();
  });

  it('renders official JLPT score report with sectional breakdown and passed status', () => {
    const passedJlptReport: JlptScoreReport = {
      level: 'N5',
      totalScore: 140,
      maxScore: 180,
      passMark: 80,
      passed: true,
      statusReason: 'PASSED',
      statusTextUz: "Tabriklaymiz! JLPT N5 imtihonidan muvaffaqiyatli o'tdingiz!",
      statusTextJa: '合格（ごうかく）',
      statusBadge: 'goukaku',
      sections: {
        knowledge: {
          section: 'knowledge',
          titleUz: "Til bilimi (Lug'at & Grammatika)",
          titleJa: '言語知識（文字・語彙・文法）',
          icon: '⛩️',
          score: 50,
          maxScore: 60,
          passMark: 19,
          passed: true,
          correctCount: 5,
          totalQuestions: 6,
          percentage: 83,
        },
        reading: {
          section: 'reading',
          titleUz: "O'qib tushunish (Dokkai)",
          titleJa: '読解',
          icon: '📖',
          score: 45,
          maxScore: 60,
          passMark: 19,
          passed: true,
          correctCount: 3,
          totalQuestions: 4,
          percentage: 75,
        },
        listening: {
          section: 'listening',
          titleUz: 'Tinglab tushunish (Choukai)',
          titleJa: '聴解',
          icon: '🎧',
          score: 45,
          maxScore: 60,
          passMark: 19,
          passed: true,
          correctCount: 3,
          totalQuestions: 4,
          percentage: 75,
        },
      },
      failedSections: [],
      weakestSection: 'reading',
      correctTotal: 11,
      questionsTotal: 14,
      accuracyPercentage: 79,
    };

    render(
      <JlptExamResultCard
        report={{ ...sampleReport, jlptScoreReport: passedJlptReport }}
        level="N5"
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    // Official Stamp & Scores
    expect(screen.getByText(/合格 \(GOUKAKU - O'TDI\) 🎉/i)).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument();
    expect(screen.getByText(/O'tish: 80/i)).toBeInTheDocument();
    expect(screen.getAllByText("Til bilimi (Lug'at & Grammatika)")[0]).toBeInTheDocument();
    expect(screen.getAllByText("O'qib tushunish (Dokkai)")[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tinglab tushunish (Choukai)')[0]).toBeInTheDocument();
  });

  it('renders official warning alert when failed due to sectional cutoff', () => {
    const failedCutoffReport: JlptScoreReport = {
      level: 'N1',
      totalScore: 120,
      maxScore: 180,
      passMark: 100,
      passed: false,
      statusReason: 'FAILED_SECTION_CUTOFF',
      statusTextUz: "Diqqat: Umumiy ballingiz yetarli, lekin bo'limda minimal 19 ball to'planmadi.",
      statusTextJa: '不合格',
      statusBadge: 'fugoukaku',
      sections: {
        knowledge: {
          section: 'knowledge',
          titleUz: "Til bilimi (Lug'at & Grammatika)",
          titleJa: '言語知識',
          icon: '⛩️',
          score: 60,
          maxScore: 60,
          passMark: 19,
          passed: true,
          correctCount: 10,
          totalQuestions: 10,
          percentage: 100,
        },
        reading: {
          section: 'reading',
          titleUz: "O'qib tushunish (Dokkai)",
          titleJa: '読解',
          icon: '📖',
          score: 48,
          maxScore: 60,
          passMark: 19,
          passed: true,
          correctCount: 8,
          totalQuestions: 10,
          percentage: 80,
        },
        listening: {
          section: 'listening',
          titleUz: 'Tinglab tushunish (Choukai)',
          titleJa: '聴解',
          icon: '🎧',
          score: 12,
          maxScore: 60,
          passMark: 19,
          passed: false,
          correctCount: 2,
          totalQuestions: 10,
          percentage: 20,
        },
      },
      failedSections: ['listening'],
      weakestSection: 'listening',
      correctTotal: 20,
      questionsTotal: 30,
      accuracyPercentage: 67,
    };

    render(
      <JlptExamResultCard
        report={{ ...sampleReport, jlptScoreReport: failedCutoffReport }}
        level="N1"
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    // Official Stamp shows FUGOUKAKU
    expect(screen.getByText(/不合格 \(FUGOUKAKU - O'TMADI\) ⚠️/i)).toBeInTheDocument();

    // Sectional Cutoff explanation alert
    expect(screen.getByText(/Diqqat \(Sectional Cutoff qoidasi\):/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tinglab tushunish \(Choukai\)/i)[0]).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Shaxsiy Rejani Moslashtirish/i })).toBeNull();
  });

  it('renders listening dialog script in mistake view if present', () => {
    const listeningMistake = [
      {
        questionText: 'お皿の右側に何を置きますか？',
        section: 'listening',
        userAnswer: 'フォーク',
        correctAnswer: 'スプーン',
        isCorrect: false,
        explanationUzbek: "Ayol kishi supuun (qoshiq) qo'yishni aytdi.",
        script: '女：食事の準備をしましょう。お皿の右側にスプーンを置いてください。',
      },
    ];

    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        mistakes={listeningMistake}
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    const toggleBtn = screen.getByText(/Barcha 1 ta xatolarni ko'rish/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Tinglash savoli/i)).toBeInTheDocument();
    expect(screen.getByText(/Dialog matni \(Script\):/i)).toBeInTheDocument();
    expect(screen.getByText(/お皿の右側にスプーンを置いてください。/i)).toBeInTheDocument();
  });

  it('renders certificate buttons and calls onViewCertificate when clicked', () => {
    const handleViewCert = vi.fn();
    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
        onViewCertificate={handleViewCert}
      />,
    );

    const certBtn = screen.getByTestId('view-certificate-btn');
    expect(certBtn).toBeInTheDocument();
    fireEvent.click(certBtn);
    expect(handleViewCert).toHaveBeenCalledTimes(1);
  });

  it('renders 4-pillar competence radar and targeted remediations when diagnosticAnalysis is provided', async () => {
    const reportWithDiagnostics = {
      ...sampleReport,
      diagnosticAnalysis: {
        level: 'N4',
        pillars: {
          kanji_vocab: {
            key: 'kanji_vocab' as const,
            titleUz: 'Kanji & Leksika',
            titleJa: '文字・語彙',
            icon: '🈳',
            totalQuestions: 10,
            correctCount: 8,
            accuracyPercentage: 80,
            status: 'strong' as const,
            statusTextUz: 'Yuqori natija',
            feedbackUz: 'Yaxshi',
          },
          grammar: {
            key: 'grammar' as const,
            titleUz: 'Grammatika',
            titleJa: '文法',
            icon: '⛩️',
            totalQuestions: 10,
            correctCount: 4,
            accuracyPercentage: 40,
            status: 'critical' as const,
            statusTextUz: 'Jiddiy zaiflik (<50%)',
            feedbackUz: 'Grammatikani kuchaytirish kerak.',
          },
          reading: {
            key: 'reading' as const,
            titleUz: "O'qib tushunish (Dokkai)",
            titleJa: '読解',
            icon: '📖',
            totalQuestions: 6,
            correctCount: 3,
            accuracyPercentage: 50,
            status: 'moderate' as const,
            statusTextUz: "O'rtacha daraja",
            feedbackUz: 'Matnlar mashqi kerak.',
          },
          listening: {
            key: 'listening' as const,
            titleUz: 'Tinglab tushunish (Choukai)',
            titleJa: '聴解',
            icon: '🎧',
            totalQuestions: 6,
            correctCount: 2,
            accuracyPercentage: 33,
            status: 'critical' as const,
            statusTextUz: 'Kritik zaif',
            feedbackUz: 'Audio eshitish lozim.',
          },
        },
        weakestPillar: 'listening' as const,
        criticalPillars: ['grammar', 'reading', 'listening'] as any,
        remediations: [
          {
            id: 'dokkai_n4',
            skill: 'reading' as const,
            title: '📖 JLPT N4 Dokkai: Matnlarni Tahlil Qilish',
            subtitle: "Dokkai bo'yicha maxsus mashq",
            route: '/jlpt?tab=reading&level=N4',
            estimatedMinutes: 15,
            actionText: "Matnlarni o'qish ➔",
            severity: 'high' as const,
            reasons: ['O‘qish past'],
          },
        ],
        weeklyTasks: [
          {
            id: 'task_1',
            title: '📖 JLPT N4 Dokkai: Matnlarni Tahlil Qilish',
            type: 'weakness_practice',
            estimatedMinutes: 15,
            completed: false,
            status: 'pending' as const,
            sourceType: 'ai_generated' as const,
            route: '/jlpt?tab=reading&level=N4',
            skill: 'reading' as const,
          },
        ],
        aiAdvice: "JLPT N4 bo'yicha tavsiyalar.",
      },
    };

    render(
      <JlptExamResultCard
        report={reportWithDiagnostics}
        level="N4"
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    // Verify 4-pillar competence radar is shown
    expect(screen.getByText(/4 Ustun bo'yicha Chuqur Diagnostika/i)).toBeInTheDocument();
    expect(screen.getByText(/Kanji & Leksika/i)).toBeInTheDocument();
    expect(screen.getByText(/O'qib tushunish \(Dokkai\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tinglab tushunish \(Choukai\)/i)).toBeInTheDocument();

    // Verify targeted remediation card is shown
    expect(screen.getByText(/Zaif Bo'limlar Bo'yicha Maxsus Mashqlar/i)).toBeInTheDocument();
    expect(screen.getByText(/📖 JLPT N4 Dokkai: Matnlarni Tahlil Qilish/i)).toBeInTheDocument();

    expect(screen.queryByText(/Shaxsiy Rejamga Biriktirish/i)).toBeNull();
  });

  it('starts interactive mistake drill mode and allows submitting answer', async () => {
    render(
      <JlptExamResultCard
        report={sampleReport}
        level="N5"
        mistakes={sampleMistakes}
        onRetry={vi.fn()}
        onBackToHub={vi.fn()}
      />,
    );

    const drillBtn = screen.getByRole('button', { name: /Xatolarni mashq qilish/i });
    expect(drillBtn).toBeInTheDocument();
    fireEvent.click(drillBtn);

    // Verify drill interface is mounted
    expect(screen.getByText(/Xatolar Ustida Interaktiv Mashq/i)).toBeInTheDocument();
    expect(screen.getByText(/Savol 1 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/毎朝、パン _____ 食べます。/i)).toBeInTheDocument();

    // Select correct option 'を'
    const correctOpt = screen.getByRole('button', { name: /1.*を/i });
    fireEvent.click(correctOpt);

    const checkBtn = screen.getByRole('button', { name: /Tekshirish/i });
    fireEvent.click(checkBtn);

    // Verify feedback and explanation
    expect(screen.getByText(/To'g'ri topdingiz! Barakalla./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Vositasiz to'ldiruvchi uchun 'を' yuklamasi kerak./i),
    ).toBeInTheDocument();

    // Next question
    const nextBtn = screen.getByRole('button', { name: /Keyingi savol/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Savol 2 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/学校 _____ バスで行きます。/i)).toBeInTheDocument();
  });
});
