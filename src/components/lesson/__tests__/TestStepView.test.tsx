import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestStepView } from '../TestStepView';
import { TestQuestion } from '../../../types/lesson';

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'test-user' },
    settings: { showFurigana: true },
  }),
}));

const tts = vi.hoisted(() => ({ speakText: vi.fn(), stopSpeaking: vi.fn(), unlockAudio: vi.fn() }));
vi.mock('../../../hooks/useTTS', () => ({
  useTTS: () => ({ ...tts, isPreparingAudio: false }),
}));

describe('TestStepView', () => {
  beforeEach(() => {
    class MockAudio {
      play = vi.fn().mockResolvedValue(undefined);
      pause = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    }
    window.Audio = MockAudio as any;
  });

  const mockQuestions: TestQuestion[] = [
    {
      id: 'q1',
      question: '先生[せんせい]はだれですか？',
      options: ['田中[たなか]さんです', '机[つくえ]です', '車[くるま]です', '本[ほん]です'],
      correctAnswerIndex: 0,
      explanation: 'Odil savolga shaxs nomi javob bo‘ladi.',
      audioUrl: '/audio/minna/minna_shokyu_1_001.mp3',
      audioTitle: '1-Dars Mondai Tinglash',
    },
    {
      id: 'q2',
      question: 'これは何[なん]ですか？',
      options: ['ペンです', '先生です', '人です', '学生です'],
      correctAnswerIndex: 0,
      explanation: 'Narsa haqida so‘ralmoqda.',
    },
  ];

  it('renders Mondai listening banner and player when question has audioUrl', () => {
    render(<TestStepView instructions="Mondai savollarini yeching" questions={mockQuestions} />);

    expect(screen.getByText(/Mondai Tinglash Topshirig'i/i)).toBeInTheDocument();
    expect(screen.getByText(/1-Dars Mondai Tinglash/i)).toBeInTheDocument();
    expect(screen.getByText(/Studiya CD Audiosi/i)).toBeInTheDocument();
  });

  it('plays only the matching script and reveals it after completing the test', () => {
    const question: TestQuestion = {
      id: 'listening',
      question: 'Qayerga boradi?',
      audioScript: '駅へ 行きます。',
      options: ['駅', '学校'],
      correctAnswerIndex: 0,
      explanation: 'U bekatga boradi.',
    };
    render(<TestStepView instructions="Tinglang" questions={[question]} />);
    expect(screen.queryByText('駅へ 行きます。')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ovozni tinglash' }));
    expect(tts.speakText).toHaveBeenCalledWith('駅へ 行きます。');
    fireEvent.click(screen.getByRole('button', { name: /駅/ }));
    fireEvent.click(screen.getByRole('button', { name: /Testni Yakunlash/i }));
    expect(screen.getByText('駅へ 行きます。')).toBeInTheDocument();
  });

  it('provides furigana mode toggles (ON, Hover, OFF)', () => {
    render(<TestStepView instructions="Testni yeching" questions={mockQuestions} />);

    const onBtn = screen.getByTitle(/Barcha furiganani ko'rsatish/i);
    const hoverBtn = screen.getByTitle(/Faqat ustiga borganda ko'rsatish/i);
    const offBtn = screen.getByTitle(/Furiganani yashirish/i);

    expect(onBtn).toBeInTheDocument();
    expect(hoverBtn).toBeInTheDocument();
    expect(offBtn).toBeInTheDocument();

    fireEvent.click(onBtn);
    expect(onBtn).toHaveClass('bg-background');

    fireEvent.click(offBtn);
    expect(offBtn).toHaveClass('bg-background');
  });

  it('allows answering questions, moving forward, and completing the test', () => {
    const handleComplete = vi.fn();

    render(
      <TestStepView
        instructions="Testni yeching"
        questions={mockQuestions}
        onCompleteTest={handleComplete}
      />,
    );

    // Answer Q1 (click first option button)
    const optionsQ1 = screen
      .getAllByRole('button')
      .filter(
        (btn) => btn.className.includes('touch-manipulation') && btn.textContent?.includes('A'),
      );
    expect(optionsQ1.length).toBeGreaterThan(0);
    fireEvent.click(optionsQ1[0]);

    // Click Davom etish
    const nextBtn = screen.getByRole('button', { name: /Davom etish/i });
    fireEvent.click(nextBtn);

    // Now on Q2
    const optionsQ2 = screen
      .getAllByRole('button')
      .filter(
        (btn) => btn.className.includes('touch-manipulation') && btn.textContent?.includes('A'),
      );
    fireEvent.click(optionsQ2[0]);

    // Click Finish
    const finishBtn = screen.getByRole('button', { name: /Testni Yakunlash/i });
    fireEvent.click(finishBtn);

    expect(handleComplete).toHaveBeenCalled();
    expect(screen.getByText(/Savollar Tahlili/i)).toBeInTheDocument();
  });
});
