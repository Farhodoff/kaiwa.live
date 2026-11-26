import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DecksPage from '../DecksPage';
import FlashcardForm from '../FlashcardForm';

const fixture = vi.hoisted(() => ({
  user: null as null | { email: string },
  subjects: [{ id: 'deck', name: 'Shaxsiy test to‘plami', color: '#f00', schedule: [] }],
  addFlashcard: vi.fn(),
  addSubject: vi.fn(),
}));
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: fixture.user,
    subjects: fixture.subjects,
    flashcards: [],
    importFlashcards: vi.fn(),
    addSubject: fixture.addSubject,
    addFlashcard: fixture.addFlashcard,
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
    addFlashcardsBatch: vi.fn(),
  }),
}));
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'uz', t: (key: string) => key }),
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../hooks/useFlashcardImport', () => ({
  useFlashcardImport: () => ({
    handleImport: vi.fn(),
    downloadTemplate: vi.fn(),
    isImporting: false,
  }),
}));
vi.mock('../../services/PresetDeckService', () => ({
  PresetDeckService: { getStandaloneAlbums: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../components/decks/AdminFlashcardManager', () => ({
  AdminFlashcardManager: () => null,
}));
vi.mock('../../components/decks/AdminPresetAuditorModal', () => ({
  AdminPresetAuditorModal: () => null,
}));
vi.mock('../../components/decks/AdminAlbumCreatorModal', () => ({
  AdminAlbumCreatorModal: () => null,
}));

function show(path = '/flashcards') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/flashcards" element={<DecksPage />} />
        <Route path="/flashcards/new" element={<FlashcardForm />} />
      </Routes>
    </MemoryRouter>,
  );
}
const tools = ['AI Konspekt & Quiz', 'AI Generator', 'Extractor', 'Import', 'Anki Eksport'];
describe('Admin-only flashcard creation tools', () => {
  beforeEach(() => {
    fixture.user = null;
    vi.clearAllMocks();
  });

  it.each([null, { email: 'student@example.com' }])(
    'hides management tools for %s while keeping review and library available',
    (user) => {
      fixture.user = user;
      show();
      expect(screen.getByRole('heading', { name: 'Takrorlash' })).toBeInTheDocument();
      expect(screen.queryByText('Kartalarni boshqarish')).toBeNull();
      tools.forEach((tool) => expect(screen.queryByText(tool)).toBeNull());
      expect(screen.queryByTitle('AI bilan yaratish')).toBeNull();
      expect(screen.queryByRole('link', { name: /flashcards.addManual/ })).toBeNull();
      expect(document.querySelector('a[href^="/flashcards/new"]')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /flashcards.library/ }));
    },
  );

  it('keeps every requested management tool available to admins', () => {
    fixture.user = { email: 'admin@kaiwa.live' };
    show();
    fireEvent.click(screen.getByText('Kartalarni boshqarish'));
    tools.forEach((tool) => expect(screen.getByText(tool)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /flashcards.addManual/ })).toHaveAttribute(
      'href',
      '/flashcards/new',
    );
    expect(screen.getByTitle('AI bilan yaratish')).toBeInTheDocument();
  });

  it('redirects non-admin direct visits to manual card creation', () => {
    fixture.user = { email: 'student@example.com' };
    show('/flashcards/new?subjectId=deck');
    expect(screen.queryByRole('heading', { name: 'Yangi Fleshkarta' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Takrorlash' })).toBeInTheDocument();
    expect(fixture.addFlashcard).not.toHaveBeenCalled();
    expect(fixture.addSubject).not.toHaveBeenCalled();
  });

  it('allows admins to open manual card creation directly', () => {
    fixture.user = { email: 'admin@kaiwa.live' };
    show('/flashcards/new');
    expect(screen.getByRole('heading', { name: 'Yangi Fleshkarta' })).toBeInTheDocument();
  });
});
