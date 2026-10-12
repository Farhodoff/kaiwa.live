import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeStepView } from '../PracticeStepView';
import { PracticeExercise } from '../../../types/lesson';

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'test-user' },
    settings: { showFurigana: true },
  }),
}));

describe('PracticeStepView (Seamless Test & Exercise Flow)', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  const mockExercises: PracticeExercise[] = [
    {
      id: 'ex1',
      type: 'multiple-choice',
      prompt: '___ は 本[ほん]を 読[よ]みます。 (Men kitob oʻqiyman)',
      options: ['私[わたし]', '猫[ねこ]', '車[くるま]', '机[つくえ]'],
      correctAnswer: 0,
      explanation: 'Birinchi shaxs uchun 「私」 toʻgʻri olmoshdir.',
    },
    {
      id: 'ex2',
      type: 'multiple-choice',
      prompt: 'これ は ___ です。 (Bu qalamdir)',
      options: ['椅子[いす]', 'ペン', '林檎[りんご]', '犬[いぬ]'],
      correctAnswer: 1,
      explanation: 'Qalam yapon tilida 「ペン」 deyiladi.',
    },
  ];

  it('renders interactive practice exercise with furigana options', () => {
    render(<PracticeStepView instructions="Bo'sh joyni to'ldiring" exercises={mockExercises} />);

    expect(screen.getByText(/Interaktiv Amaliy Mashq/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Barcha furiganani ko'rsatish/i)).toBeInTheDocument();
  });

  it('allows answering exercises seamlessly, navigating, and viewing detailed end-of-exercise feedback', () => {
    const handleCompleteExercise = vi.fn();
    const handleIncorrectAnswer = vi.fn();
    const handleNextStep = vi.fn();

    render(
      <PracticeStepView
        instructions="Bo'sh joyni to'ldiring"
        exercises={mockExercises}
        onCompleteExercise={handleCompleteExercise}
        onIncorrectAnswer={handleIncorrectAnswer}
        onNextStep={handleNextStep}
      />,
    );

    // Answer Ex 1 (select Option A)
    const optionsEx1 = screen.getAllByRole('button').filter((b) => b.textContent?.includes('A'));
    expect(optionsEx1.length).toBeGreaterThan(0);
    fireEvent.click(optionsEx1[0]);

    // Navigate to Ex 2 via Davom etish
    const continueBtn = screen.getByRole('button', { name: /Davom etish/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/2 \/ 2/i)).toBeInTheDocument();

    // Answer Ex 2 (select Option B)
    const optionsEx2 = screen.getAllByRole('button').filter((b) => b.textContent?.includes('B'));
    expect(optionsEx2.length).toBeGreaterThan(0);
    fireEvent.click(optionsEx2[0]);

    // Finish exercises
    const finishBtn = screen.getByRole('button', { name: /Natijalarni Ko'rish/i });
    fireEvent.click(finishBtn);

    // Verifies completion screen
    expect(
      screen.getByText(/Amaliy Mashqlar Yakunlandi!|Mashqlarni Qayta Ko'rib Chiqing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mashqlar Tahlili va To'g'ri Javoblar/i)).toBeInTheDocument();
    expect(handleCompleteExercise).toHaveBeenCalledTimes(2);

    // Verify proceed button
    const nextStepBtn = screen.getByRole('button', { name: /Dars Testiga O'tish/i });
    expect(nextStepBtn).toBeInTheDocument();
    fireEvent.click(nextStepBtn);
    expect(handleNextStep).toHaveBeenCalled();
  });

  it('supports retry to restart exercises from beginning', () => {
    render(<PracticeStepView instructions="Bo'sh joyni to'ldiring" exercises={mockExercises} />);

    // Select Ex 1
    const optionsEx1 = screen.getAllByRole('button').filter((b) => b.textContent?.includes('A'));
    fireEvent.click(optionsEx1[0]);

    // Davom etish
    fireEvent.click(screen.getByRole('button', { name: /Davom etish/i }));

    // Select Ex 2
    const optionsEx2 = screen.getAllByRole('button').filter((b) => b.textContent?.includes('B'));
    fireEvent.click(optionsEx2[0]);

    // Natijalarni ko'rish
    fireEvent.click(screen.getByRole('button', { name: /Natijalarni Ko'rish/i }));

    // Click Retry
    const retryBtn = screen.getByRole('button', { name: /Mashqlarni Qayta Bajarish/i });
    fireEvent.click(retryBtn);

    // Back to first question
    expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();
  });
});
