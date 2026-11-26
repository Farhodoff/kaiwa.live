import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import StudyModePage from '../StudyModePage';
import { Rating } from '../../utils/srs';
import { FlashcardStudySession } from '../../components/decks/FlashcardStudySession';

const { review } = vi.hoisted(() => ({ review: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: null,
    loading: false,
    subjects: [
      { id: 'ja-deck', name: 'JLPT N5' },
      { id: 'en-deck', name: 'English' },
    ],
    flashcards: [
      {
        id: 'ja-card',
        subjectId: 'ja-deck',
        front: '食べる',
        back: 'Yemoq',
        repetitions: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '2020-01-01',
      },
      {
        id: 'en-card',
        subjectId: 'en-deck',
        front: 'Meticulous',
        back: 'Sinchkov',
        repetitions: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '2020-01-02',
      },
    ],
    reviewFlashcard: review,
    updateFlashcard: vi.fn(),
    deleteFlashcard: vi.fn(),
  }),
}));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
vi.mock('../../utils/audioTts', () => ({ speakText: vi.fn() }));

function Destination() {
  const [params] = useSearchParams();
  const location = useLocation();
  const lang = params.get('lang');
  return (
    <>
      <span data-testid="destination">
        {location.pathname}
        {location.search}
      </span>
      <span data-testid="plan">{JSON.stringify(location.state)}</span>
      <FlashcardStudySession
        subjectId={params.get('study')}
        cardLanguage={lang === 'ja' || lang === 'en' ? lang : undefined}
        onClose={vi.fn()}
      />
    </>
  );
}
function show(path: string, state = null as unknown) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: path.split('?')[0],
          search: path.includes('?') ? '?' + path.split('?')[1] : '',
          state,
        },
      ]}
    >
      <Routes>
        <Route path="/study-mode" element={<StudyModePage />} />
        <Route path="/study-mode/:subjectId" element={<StudyModePage />} />
        <Route path="/flashcards/study/:subjectId" element={<StudyModePage />} />
        <Route path="/flashcards" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Single flashcard study entry', () => {
  it.each(['/study-mode/ja-deck', '/flashcards/study/ja-deck', '/flashcards?study=ja-deck'])(
    'opens the same deck and saves the same rating via %s',
    async (path) => {
      review.mockClear();
      show(path);
      expect(await screen.findByTestId('study-card')).toHaveTextContent('食べる');
      expect(screen.queryByText('Meticulous')).toBeNull();
      expect(screen.getByTestId('destination')).toHaveTextContent('/flashcards?study=ja-deck');
      fireEvent.click(screen.getByTestId('study-card'));
      fireEvent.click(screen.getByRole('button', { name: /Yaxshi \(Good\)/ }));
      await waitFor(() => expect(review).toHaveBeenCalledTimes(1));
      expect(review).toHaveBeenCalledWith('ja-card', Rating.GOOD);
      expect(await screen.findByText(/Mashg'ulot Yakunlandi/)).toBeInTheDocument();
    },
  );

  it('preserves language filters and linked plan state across the redirect', async () => {
    const state = { personalPlanTask: { planId: 'plan', taskId: 'review' } };
    show('/study-mode?lang=ja', state);
    expect(await screen.findByTestId('study-card')).toHaveTextContent('食べる');
    expect(screen.queryByText('Meticulous')).toBeNull();
    expect(screen.getByTestId('destination')).toHaveTextContent('lang=ja');
    expect(screen.getByTestId('plan')).toHaveTextContent(JSON.stringify(state));
  });

  it('opens global review with the same scope as the deck list', async () => {
    show('/study-mode');
    await screen.findByTestId('study-card');
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
  });

  it('keeps the diagnostic deck query scoped to its deck', async () => {
    show('/study-mode?deck=en-deck');
    expect(await screen.findByTestId('study-card')).toHaveTextContent('Meticulous');
    expect(screen.getByTestId('destination')).toHaveTextContent('study=en-deck');
    expect(screen.getByTestId('destination')).not.toHaveTextContent('deck=');
  });
});
