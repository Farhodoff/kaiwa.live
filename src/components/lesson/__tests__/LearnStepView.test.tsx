import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LearnStepView } from '../LearnStepView';
import { LearnContent, Lesson } from '../../../types/lesson';
import * as audioTts from '../../../utils/audioTts';

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    settings: { showFurigana: true },
  }),
}));

describe('LearnStepView Component with Dialogue Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioTts, 'speakJapaneseText').mockImplementation(() => {});
    vi.spyOn(audioTts, 'speakText').mockImplementation(() => {});
  });

  const mockContent: LearnContent = {
    title: '1-dars: Tanishuv',
    subtitle: '第1課：自己紹介',
    explanation: 'Tanishuv darsi haqida batafsil maʼlumot.',
    keyPoints: ['1-qoida: は zarrachasi', '2-qoida: です qoʻshimchasi'],
    vocabulary: [
      {
        term: 'わたし',
        reading: 'わたし',
        meaning: 'men',
        exampleSentence: 'わたしは 学生[がくせい] です。',
        exampleTranslation: 'Men talabaman.',
      },
    ],
    grammarRules: [
      {
        pattern: 'OT 1 は OT 2 です',
        meaning: 'OT 1 OT 2 dir (tasdiq)',
        examples: [
          {
            sentence: 'わたしは マイク・ミラー です。',
            translation: 'Men Mayk Miller bo‘laman.',
          },
        ],
      },
    ],
    dialogue: {
      title: '初めまして (Tanishuv)',
      situationUz: 'Kompaniyada yangi xodim tanishuvi.',
      lines: [
        {
          id: 'line-1',
          speaker: '佐藤',
          speakerRoleUz: 'Sato xonim',
          japanese: 'おはようございます。',
          romaji: 'Ohayou gozaimasu.',
          uzbek: 'Xayrli tong!',
        },
        {
          id: 'line-2',
          speaker: 'ミラー',
          speakerRoleUz: 'Mayk Miller',
          japanese: '初めまして。マイク・ミラーです。',
          romaji: 'Hajimemashite. Maiku Miraa desu.',
          uzbek: 'Tanishganimdan xursandman. Men Mayk Miller.',
        },
      ],
    },
  };

  const mockLesson: Lesson = {
    id: 'ja-minna-l1',
    courseId: 'japanese-n5',
    unitId: 'ja-minna-u1',
    unitTitle: 'Unit 1',
    language: 'ja',
    level: 'N5',
    lessonNumber: 1,
    title: 'Tanishuv',
    description: 'Test lesson',
    estimatedDurationMinutes: 10,
    steps: [
      {
        id: 'ja-minna-l1-s1',
        title: 'Learn',
        type: 'learn',
        estimatedMinutes: 10,
        learnData: mockContent,
      },
    ],
  };

  it('renders lesson headers, key points, vocab and grammar', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    expect(screen.getByText('1-dars: Tanishuv')).toBeInTheDocument();
    expect(screen.getByText('第1課：自己紹介')).toBeInTheDocument();
    expect(screen.getByText(/1-qoida: は zarrachasi/)).toBeInTheDocument();
    expect(screen.getByText('OT 1 は OT 2 です')).toBeInTheDocument();
  });

  it('renders dialogue tab button with line count', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    const dialogueTab = screen.getByRole('button', { name: /Dialog \(2\)/i });
    expect(dialogueTab).toBeInTheDocument();
  });

  it('renders dialogue lines, situation, and speaker roles correctly', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    expect(screen.getByText('💬 Amaliy Dialog (Kaiwa)')).toBeInTheDocument();
    expect(screen.getByText('Kompaniyada yangi xodim tanishuvi.')).toBeInTheDocument();
    expect(screen.getByText('佐藤')).toBeInTheDocument();
    expect(screen.getByText('(Sato xonim)')).toBeInTheDocument();
    expect(screen.getByText('Xayrli tong!')).toBeInTheDocument();
    expect(screen.getByText('Ohayou gozaimasu.')).toBeInTheDocument();
  });

  it('calls speakJapaneseText when single line listen button is clicked', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    const speakBtn = screen.getByRole('button', { name: /Tinglash: 佐藤/i });
    fireEvent.click(speakBtn);

    expect(audioTts.speakJapaneseText).toHaveBeenCalledWith('おはようございます。');
  });

  it('toggles continuous autoplay dialogue playback', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    const playAllBtn = screen.getByRole('button', { name: /Barchasini tinglash/i });
    expect(playAllBtn).toBeInTheDocument();

    fireEvent.click(playAllBtn);

    // First line should be spoken
    expect(audioTts.speakJapaneseText).toHaveBeenCalledWith('おはようございます。');
    // Button switches to pause state
    expect(screen.getByRole('button', { name: /To'xtatish/i })).toBeInTheDocument();

    // Clicking again stops autoplay
    fireEvent.click(screen.getByRole('button', { name: /To'xtatish/i }));
    expect(screen.getByRole('button', { name: /Barchasini tinglash/i })).toBeInTheDocument();
  });

  it('switches tabs between All, Vocab, Grammar, and Dialogue', () => {
    render(<LearnStepView content={mockContent} language="ja" />);

    // Click Dialogue tab
    const dialogueTab = screen.getByRole('button', { name: /Dialog \(2\)/i });
    fireEvent.click(dialogueTab);

    // Dialogue is visible
    expect(screen.getByText('💬 Amaliy Dialog (Kaiwa)')).toBeInTheDocument();
    // Vocab header should be hidden when filtered to dialogue
    expect(screen.queryByText("📚 Yangi So'zlar")).not.toBeInTheDocument();

    // Click Vocab tab
    const vocabTab = screen.getByRole('button', { name: /Lug'at/i });
    fireEvent.click(vocabTab);

    expect(screen.getByText("📚 Yangi So'zlar")).toBeInTheDocument();
    expect(screen.queryByText('💬 Amaliy Dialog (Kaiwa)')).not.toBeInTheDocument();
  });

  it('renders lesson kanji and records review progress', () => {
    render(
      <LearnStepView content={mockContent} language="ja" lesson={mockLesson} userId="test-user" />,
    );

    expect(screen.getByRole('button', { name: /Kanji \(2\)/i })).toBeInTheDocument();
    expect(screen.getByText('学')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Bilaman' })[0]);
    expect(screen.getByText('1/1 to‘g‘ri')).toBeInTheDocument();
  });

  it('renders authentic studio CD audio player when audioUrl is present', async () => {
    const contentWithStudioAudio: LearnContent = {
      ...mockContent,
      dialogue: {
        ...mockContent.dialogue!,
        audioUrl: '/audio/minna/minna_shokyu_1_001.mp3',
      },
    };

    // Mock window.Audio as a constructor class
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();
    class MockAudio {
      play = playMock;
      pause = pauseMock;
      playbackRate = 1;
      currentTime = 0;
      duration = 60;
      src = '';
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    }
    window.Audio = MockAudio as any;

    render(<LearnStepView content={contentWithStudioAudio} language="ja" />);

    // Renders CD audio badge and CD audio button
    expect(screen.getByText(/Haqiqiy Studiya CD Audiosi/i)).toBeInTheDocument();
    const playBtns = screen.getAllByRole('button', { name: /CD Audioni tinglash/i });
    expect(playBtns.length).toBeGreaterThanOrEqual(1);

    // Clicking play triggers audio play
    await act(async () => {
      fireEvent.click(playBtns[0]);
    });
    expect(playMock).toHaveBeenCalled();
  });
});
