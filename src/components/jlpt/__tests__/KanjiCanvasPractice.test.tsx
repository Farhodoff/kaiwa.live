import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KanjiCanvasPractice } from '../KanjiCanvasPractice';
import { KanjiPracticeService } from '../../../services/KanjiPracticeService';
import * as writing from '../../../services/KanjiWritingEvaluator';
import { LessonKanjiService } from '../../../services/LessonKanjiService';

const mockAwardXP = vi.fn();

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    awardXP: mockAwardXP,
  }),
}));

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'uz',
  }),
}));

vi.mock('../../../utils/audioTts', () => ({
  speakText: vi.fn(),
}));

describe('KanjiCanvasPractice Component', () => {
  const reference = [
    [
      { x: 60, y: 40 },
      { x: 60, y: 250 },
    ],
    [
      { x: 60, y: 40 },
      { x: 240, y: 40 },
      { x: 240, y: 250 },
    ],
    [
      { x: 60, y: 140 },
      { x: 240, y: 140 },
    ],
    [
      { x: 60, y: 250 },
      { x: 240, y: 250 },
    ],
  ];
  const drawReference = () => {
    const canvas = screen.getByLabelText('Kanji yozish maydoni');
    reference.forEach((points) => {
      fireEvent.mouseDown(canvas, { clientX: points[0].x, clientY: points[0].y });
      points
        .slice(1)
        .forEach((point) => fireEvent.mouseMove(canvas, { clientX: point.x, clientY: point.y }));
      fireEvent.mouseUp(canvas);
    });
  };
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(KanjiPracticeService, 'getStrokeData').mockReturnValue({
      paths: ['M1 1L2 2', 'M1 1L2 2', 'M1 1L2 2', 'M1 1L2 2'],
      numbers: [],
    });
    vi.spyOn(writing, 'sampleKanjiPaths').mockReturnValue(reference);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  it('renders correctly with default N5 active kanji, readings, and meanings', () => {
    render(<KanjiCanvasPractice />);

    expect(screen.getByText(/Interaktiv Kanji Canvas/i)).toBeInTheDocument();
    // Default kanji is '日'
    expect(screen.getByRole('heading', { level: 4, name: '日' })).toBeInTheDocument();
    expect(screen.getByText(/Quyosh/i)).toBeInTheDocument();
    expect(screen.getByText(/音読み/i)).toBeInTheDocument();
    expect(screen.getByText(/訓読み/i)).toBeInTheDocument();
    expect(screen.getByText('日本', { exact: true })).toBeInTheDocument();
  });

  it('switches levels and updates quick kanji chips tray', () => {
    render(<KanjiCanvasPractice />);

    const n4Btn = screen.getByRole('button', { name: 'N4' });
    fireEvent.click(n4Btn);

    // Quick pills should show N4 kanjis like '会'
    const kaiBtn = screen.getByRole('button', { name: '会' });
    expect(kaiBtn).toBeInTheDocument();

    fireEvent.click(kaiBtn);
    expect(screen.getByRole('heading', { level: 4, name: '会' })).toBeInTheDocument();
  });

  it('searches kanjis by character or meaning in the search input', () => {
    render(<KanjiCanvasPractice />);

    const searchInput = screen.getByPlaceholderText(/Kanji, o'qilishi yoki ma'nosi/i);
    fireEvent.change(searchInput, { target: { value: 'oy' } });

    // Should find '月' (Oy / Month)
    const moonBtn = screen.getByRole('button', { name: '月' });
    expect(moonBtn).toBeInTheDocument();

    fireEvent.click(moonBtn);
    expect(screen.getByRole('heading', { level: 4, name: '月' })).toBeInTheDocument();
  });

  it('switches between practice modes: Qolip (Ghost), Xotira (Blind), and Qadam (Step)', () => {
    render(<KanjiCanvasPractice />);

    const blindBtn = screen.getByRole('button', { name: 'Xotira' });
    fireEvent.click(blindBtn);
    expect(blindBtn).toHaveClass('bg-card');

    const stepBtn = screen.getByRole('button', { name: 'Qadam' });
    fireEvent.click(stepBtn);
    expect(stepBtn).toHaveClass('bg-card');

    const ghostBtn = screen.getByRole('button', { name: 'Qolip' });
    fireEvent.click(ghostBtn);
    expect(ghostBtn).toHaveClass('bg-card');
  });

  it('cycles animation speeds and toggles play/pause controls', () => {
    vi.useFakeTimers();
    render(<KanjiCanvasPractice />);

    const speedBtn = screen.getByTitle(/Tezlikni o'zgartirish/i);
    expect(speedBtn).toHaveTextContent('1x');
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent('1.5x');
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent('0.5x');

    const playBtn = screen.getByRole('button', { name: /Tartib/i });
    fireEvent.click(playBtn);
    expect(screen.getByRole('button', { name: /Pauza/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    vi.useRealTimers();
  });

  it('does not award XP or save progress for a blank drawing', () => {
    render(<KanjiCanvasPractice />);
    fireEvent.click(screen.getByRole('button', { name: /Mashqni Yakunlash/i }));
    expect(mockAwardXP).not.toHaveBeenCalled();
    expect(screen.getByText(/Avval kanjini yozing/)).toBeInTheDocument();
    expect(LessonKanjiService.getAllUserProgress('guest')).toHaveLength(0);
  });

  it('evaluates writing, saves lesson-scoped results, and only rewards a character once', () => {
    render(<KanjiCanvasPractice initialKanji="日" lessonId="ja-minna-l1" hideProgressPanel />);
    drawReference();
    fireEvent.click(screen.getByRole('button', { name: /Mashqni Yakunlash/i }));
    expect(LessonKanjiService.getProgress('guest', 'ja-minna-l1', '日')).toMatchObject({
      writingAccuracy: 100,
      strokeOrderPassed: true,
      totalWrittenCount: 1,
    });
    expect(mockAwardXP).toHaveBeenCalledExactlyOnceWith(15);
    expect(screen.getByText(/Ajoyib! Mashq yakunlandi/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Tozalash'));
    drawReference();
    fireEvent.click(screen.getByRole('button', { name: /Mashqni Yakunlash/i }));
    expect(mockAwardXP).toHaveBeenCalledTimes(1);
    expect(LessonKanjiService.getProgress('guest', 'ja-minna-l1', '日')?.totalWrittenCount).toBe(2);
  });

  it('does not invent a score when SVG geometry is unavailable', () => {
    vi.spyOn(writing, 'sampleKanjiPaths').mockReturnValue(null);
    render(<KanjiCanvasPractice hideProgressPanel />);
    drawReference();
    fireEvent.click(screen.getByRole('button', { name: /Mashqni Yakunlash/i }));
    expect(mockAwardXP).not.toHaveBeenCalled();
    expect(screen.getByText(/baholash hozir mavjud emas/)).toBeInTheDocument();
    expect(LessonKanjiService.getAllUserProgress('guest')).toHaveLength(0);
  });
});
