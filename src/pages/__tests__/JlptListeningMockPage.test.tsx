import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JlptListeningMockPage } from '../JlptListeningMockPage';
import { ListeningAudioSyncService } from '../../services/ListeningAudioSyncService';

// Mock context providers
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'test-user-id' },
    awardXP: vi.fn(),
    addSession: vi.fn(),
    addFlashcardsBatch: vi.fn(),
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'uz',
  }),
}));

vi.mock('../../hooks/useTTS', () => ({
  fetchTTSAudioBlob: vi
    .fn()
    .mockResolvedValue(new Blob(['dummy-mp3-audio'], { type: 'audio/mpeg' })),
  splitIntoTTSChunks: vi.fn((text: string) => [text]),
}));

vi.mock('../../utils/ai', () => ({
  cleanJapaneseTTS: vi.fn((text: string) => text),
}));

describe('JlptListeningMockPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders listening mock intro screen with level selection and modes', () => {
    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/JLPT.*聴解.*Practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Haqiqiy Imtihon/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio Sync & Shadowing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Boshlash/i })).toBeInTheDocument();
  });

  it('switches to Audio Sync & Shadowing mode on intro screen', () => {
    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    const syncModeBtn = screen.getByText(/Audio Sync & Shadowing/i).closest('button');
    expect(syncModeBtn).not.toBeNull();
    if (syncModeBtn) {
      fireEvent.click(syncModeBtn);
    }

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    fireEvent.click(startBtn);

    // In Sync mode, script subtitles should be visible by default
    expect(screen.getByText(/Sinxron Subtitrlar/i)).toBeInTheDocument();
  });

  it('starts test, toggles script visibility, and allows clicking a dialogue line', () => {
    const playLineSpy = vi.spyOn(ListeningAudioSyncService, 'getLineStartTime');

    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    fireEvent.click(startBtn);

    expect(screen.getByText(/Savol 1 \//i)).toBeInTheDocument();
    expect(screen.getByText(/Listening Audio Track/i)).toBeInTheDocument();

    // Toggle script on
    const scriptToggleBtn = screen.getByTitle("Audio skriptni ko'rsatish/yashirish");
    fireEvent.click(scriptToggleBtn);

    expect(screen.getByText(/Sinxron Subtitrlar/i)).toBeInTheDocument();

    // Find and click on a dialogue line seek button
    const seekButtons = screen.getAllByTitle(/Audioni ayni shu vaqtdan boshlash/i);
    if (seekButtons.length > 0) {
      fireEvent.click(seekButtons[0]);
    } else {
      const dialogueLine = screen.getByText(/雨が降ってきましたね/i);
      fireEvent.click(dialogueLine);
    }

    expect(playLineSpy).toHaveBeenCalled();
  });

  it('allows answering questions and navigating to next question', () => {
    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    fireEvent.click(startBtn);

    // Click on option 2
    const optionBtn = screen.getByText(/女の人の車から傘を持ってきます/i);
    fireEvent.click(optionBtn);

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /Keyingi Savol/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Savol 2 \//i)).toBeInTheDocument();
  });

  it('supports speed pills, 5-second jumps, and loop toggle in audio controls', () => {
    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    fireEvent.click(startBtn);

    // Verify speed pills: 0.8x, 1.0x, 1.2x, 1.5x
    const speedPill08 = screen.getByRole('button', { name: /0\.8x/i });
    const speedPill12 = screen.getByRole('button', { name: /1\.2x/i });
    const speedPill15 = screen.getByRole('button', { name: /1\.5x/i });

    expect(speedPill08).toBeInTheDocument();
    expect(speedPill12).toBeInTheDocument();
    expect(speedPill15).toBeInTheDocument();

    // Click 1.5x speed
    fireEvent.click(speedPill15);
    expect(speedPill15.className).toContain('bg-rose-500');

    // Verify 5-second jump buttons
    const rewind5s = screen.getByTitle(/5 soniya orqaga/i);
    const forward5s = screen.getByTitle(/5 soniya oldinga/i);
    expect(rewind5s).toBeInTheDocument();
    expect(forward5s).toBeInTheDocument();

    fireEvent.click(forward5s);
    fireEvent.click(rewind5s);

    // Verify Loop toggle
    const loopBtn = screen.getByRole('button', { name: /Loop/i });
    expect(loopBtn).toBeInTheDocument();
    fireEvent.click(loopBtn);
    expect(screen.getByText(/Loop ON/i)).toBeInTheDocument();
  });

  it('supports Furigana mode toggling (ON, Hover, OFF) on synchronized subtitles', () => {
    render(
      <MemoryRouter initialEntries={['/listening?level=N5']}>
        <JlptListeningMockPage />
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    fireEvent.click(startBtn);

    // Toggle script visibility
    const scriptToggleBtn = screen.getByTitle("Audio skriptni ko'rsatish/yashirish");
    fireEvent.click(scriptToggleBtn);

    // Verify Furigana toggle pills
    const furiganaOn = screen.getByRole('button', { name: /振 ON/i });
    const furiganaHover = screen.getByRole('button', { name: /👁️ Hover/i });
    const furiganaOff = screen.getByRole('button', { name: /🚫 OFF/i });

    expect(furiganaOn).toBeInTheDocument();
    expect(furiganaHover).toBeInTheDocument();
    expect(furiganaOff).toBeInTheDocument();

    // Switch to Furigana Always ON
    fireEvent.click(furiganaOn);
    expect(furiganaOn.className).toContain('bg-rose-500');

    // Switch to Furigana OFF
    fireEvent.click(furiganaOff);
    expect(furiganaOff.className).toContain('bg-rose-500');
  }, 15000);
});
