import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PitchAccentTrainer } from '../PitchAccentTrainer';
import * as audioTts from '../../../utils/audioTts';

vi.mock('../../../utils/audioTts', () => ({
  speakText: vi.fn(),
}));

vi.mock('../../../services/ActivityLoggingService', () => ({
  ActivityLoggingService: {
    logActivity: vi.fn().mockResolvedValue({ id: 'mock-activity-id' }),
  },
}));

vi.mock('../../../services/DailyQuestService', () => ({
  DailyQuestService: {
    incrementMetaCounter: vi.fn(),
    recordQuestProgress: vi.fn(),
  },
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));

vi.mock('../../../hooks/useTelegramWebApp', () => ({
  useTelegramWebApp: () => ({
    isTwa: false,
    webApp: null,
    user: null,
    haptics: {
      impact: vi.fn(),
      notification: vi.fn(),
      selection: vi.fn(),
    },
  }),
}));

describe('PitchAccentTrainer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<PitchAccentTrainer isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders header, tabs, and default Heiban words when isOpen is true', () => {
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Pitch Accent Studio/i)).toBeDefined();
    expect(screen.getByText(/Tokyo Standarti/i)).toBeDefined();
    expect(screen.getByText('4 Ohang Turlari')).toBeDefined();
    expect(screen.getByText('Minimal Juftliklar')).toBeDefined();
    expect(screen.getByText(/Quloq Mashqi \(Quiz\)/i)).toBeDefined();

    // Default tab should show Heiban explanation
    expect(screen.getByText(/Heiban \(Tekis\) Qoidasi va Zarrachalar:/i)).toBeDefined();
  });

  it('switches between 4 pitch types in the Types tab', () => {
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} />);

    // Click Atamadaka filter chip
    const atamadakaBtn = screen.getByRole('button', { name: /頭高型 ①/i });
    fireEvent.click(atamadakaBtn);

    expect(screen.getByText(/Atamadaka \(Boshida baland\) Qoidasi va Zarrachalar:/i)).toBeDefined();
  });

  it('filters dictionary words based on search query', () => {
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Ushbu turdagi so'zni qidiring/i);
    fireEvent.change(searchInput, { target: { value: 'sakana' } });

    // Should find 魚
    expect(screen.getByText('魚')).toBeDefined();
  });

  it('switches to Minimal Pairs tab and displays homophone contrast cards', () => {
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} />);

    const pairsTab = screen.getByRole('button', { name: /Minimal Juftliklar/i });
    fireEvent.click(pairsTab);

    // Minimal pairs should be shown (e.g. 雨 vs 飴)
    expect(screen.getByText(/Minimal Juftliklar Nima Uchun Muhim\?/i)).toBeDefined();
    expect(screen.getAllByText('雨').length).toBeGreaterThan(0);
    expect(screen.getAllByText('飴').length).toBeGreaterThan(0);
    expect(screen.getAllByText('箸').length).toBeGreaterThan(0);
    expect(screen.getAllByText('橋').length).toBeGreaterThan(0);
  });

  it('switches to Ear Quiz tab and allows answering questions', () => {
    const onAwardXP = vi.fn();
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} onAwardXP={onAwardXP} />);

    const quizTab = screen.getByRole('button', { name: /Quloq Mashqi/i });
    fireEvent.click(quizTab);

    expect(screen.getByText(/Talaffuzni tinglang va qolipini toping:/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Ovozni Tinglash/i })).toBeDefined();

    // Answer with one of the 4 choices
    const heibanChoice = screen.getByRole('button', { name: /Heiban \(Tekis\)/i });
    fireEvent.click(heibanChoice);

    // Result feedback should appear
    expect(screen.getByRole('button', { name: /Keyingi savol|Natijani ko'rish/i })).toBeDefined();
  });

  it('triggers TTS audio playback when audio button is clicked', () => {
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} />);

    // Click on audio button of a word
    const audioButtons = screen.getAllByTitle('Talaffuzni tinglash');
    expect(audioButtons.length).toBeGreaterThan(0);
    fireEvent.click(audioButtons[0]);

    expect(audioTts.speakText).toHaveBeenCalledWith(expect.any(String), 'ja-JP');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PitchAccentTrainer isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByTitle('Yopish');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('completes full quiz, awards XP, and displays completion summary', async () => {
    const onAwardXP = vi.fn().mockResolvedValue(undefined);
    render(<PitchAccentTrainer isOpen={true} onClose={vi.fn()} onAwardXP={onAwardXP} />);

    const quizTab = screen.getByRole('button', { name: /Quloq Mashqi/i });
    fireEvent.click(quizTab);

    // Answer 5 questions to reach completion
    for (let i = 0; i < 5; i++) {
      const choice = screen.getByRole('button', { name: /Heiban \(Tekis\)/i });
      fireEvent.click(choice);

      const nextBtn = screen.getByRole('button', { name: /Keyingi savol|Natijani ko'rish/i });
      fireEvent.click(nextBtn);
    }

    expect(await screen.findByText('Mashq Yakunlandi!')).toBeInTheDocument();
    await waitFor(() => {
      expect(onAwardXP).toHaveBeenCalledWith(15);
    });
  });
});
