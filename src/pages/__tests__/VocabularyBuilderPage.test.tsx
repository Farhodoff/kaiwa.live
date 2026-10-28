import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { VocabularyBuilderPage } from '../VocabularyBuilderPage';
import { generateAIResponse } from '../../utils/ai/aiCore';

const mockAddFlashcard = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { email: 'fsoyilov@gmail.com' },
    primaryLanguage: 'en',
    subjects: [{ id: 'subj-1', name: 'English C1' }],
    addFlashcard: mockAddFlashcard,
  }),
}));

vi.mock('../../utils/ai/aiCore', async () => {
  const actual = await vi.importActual<any>('../../utils/ai/aiCore');
  return {
    ...actual,
    generateAIResponse: vi.fn(),
  };
});

describe('VocabularyBuilderPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders header, search bar, and sample topic buttons', async () => {
    await act(async () => {
      render(<VocabularyBuilderPage />);
    });

    expect(screen.getByText(/Smart Vocabulary Builder/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/So'z kiritib Enter bosing/i)).toBeInTheDocument();
    expect(screen.getByText('勉強 (N5)')).toBeInTheDocument();
  });

  it('performs AI search when sample button is clicked', async () => {
    const mockResponse = JSON.stringify({
      word: '約束',
      language: 'ja',
      phonetic: 'やくそく (yakusoku)',
      level: 'N4',
      partOfSpeech: 'noun / suru-verb',
      uzbekTranslation: "va'da, kelishuv",
      definition: 'Kelajakda bajarishga berilgan so‘z yoki ahd.',
      synonyms: ['契り', '契機'],
      collocations: ['約束を守る'],
      examples: [
        {
          sentence: '友達と約束を守りました。',
          translation: 'Do‘stim bilan bergan va’dani bajardim.',
        },
      ],
    });

    vi.mocked(generateAIResponse).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<VocabularyBuilderPage />);
    });

    const sampleBtn = screen.getByText('約束 (N4)');
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/va'da, kelishuv/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/友達と約束を守りました。/i)).toBeInTheDocument();
  });

  it("creates flashcard when Fleshkartalarga Qo'shish button is clicked", async () => {
    const mockResponse = JSON.stringify({
      word: 'resilient',
      language: 'en',
      phonetic: '/rɪˈzɪl.jənt/',
      level: 'B2',
      partOfSpeech: 'adjective',
      uzbekTranslation: 'bosh egmas, chidamli',
      definition: 'Able to withstand difficult conditions.',
      synonyms: ['tough', 'adaptable'],
      collocations: ['resilient economy'],
      examples: [{ sentence: 'He is resilient.', translation: 'U chidamli.' }],
    });

    vi.mocked(generateAIResponse).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<VocabularyBuilderPage />);
    });

    const input = screen.getByPlaceholderText(/So'z kiritib Enter bosing/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'resilient' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    await waitFor(() => {
      expect(screen.getByText(/bosh egmas, chidamli/i)).toBeInTheDocument();
    });

    const addFlashcardBtn = screen.getByRole('button', { name: /Fleshkard.*qo'shish/i });
    await act(async () => {
      fireEvent.click(addFlashcardBtn);
    });

    expect(mockAddFlashcard).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: 'subj-1',
        front: expect.stringContaining('resilient'),
      }),
    );
  });

  it('displays pitch accent badge and opens PitchAccentModal for Japanese word', async () => {
    await act(async () => {
      render(<VocabularyBuilderPage />);
    });

    // Default word is 維持 (N2, Japanese, Heiban ⓪)
    const pitchButton = screen.getByRole('button', { name: /Ohang/i });
    expect(pitchButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pitchButton);
    });

    expect(screen.getByText(/Pitch Accent \(アクセント\) Tahlili/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Heiban \(平板型 ⓪ - Tekis\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('verifies that Fan tanlang dropdown is removed and level filter + random suggestion buttons exist', async () => {
    await act(async () => {
      render(<VocabularyBuilderPage />);
    });

    // Check that "Fan tanlang" or "単語帳を選択:" dropdown is completely absent
    expect(screen.queryByText(/Fan tanlang:/i)).toBeNull();
    expect(screen.queryByText(/単語帳を選択:/i)).toBeNull();

    // Check level chips exist
    expect(screen.getByRole('button', { name: 'Barchasi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'N5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'N1' })).toBeInTheDocument();

    // Check random word suggestion button
    expect(screen.getByRole('button', { name: /Yangi tavsiya/i })).toBeInTheDocument();

    // Check slow pronunciation button
    expect(screen.getByRole('button', { name: /Sekin/i })).toBeInTheDocument();
  });
});
