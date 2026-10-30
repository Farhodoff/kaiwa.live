import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KanjiProgressPanel } from '../KanjiProgressPanel';
import { LessonKanjiService } from '../../../services/LessonKanjiService';
import { KanjiPracticeService } from '../../../services/KanjiPracticeService';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('KanjiProgressPanel', () => {
  it('shows distinct lesson/general mastery and opens the due item in its original scope', async () => {
    const onPractice = vi.fn();
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct', new Date('2026-01-01'));
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct', new Date('2026-01-02'));
    render(<KanjiProgressPanel userId="guest" level="N5" onPractice={onPractice} />);
    await waitFor(() => expect(screen.getByText('Umumiy JLPT kanji')).toBeInTheDocument());
    expect(screen.getByText('Lesson kanji')).toBeInTheDocument();
    expect(screen.getByText('Bugun qayta ko‘rish kerak (1)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Yozib takrorlash: 日' }));
    expect(onPractice).toHaveBeenCalledWith(
      expect.objectContaining({ kanji: '日', lessonId: 'jlpt-N5' }),
    );
  });
  it('shows all due levels in ALL mode and filters when a specific level is selected', async () => {
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct', new Date('2026-01-01'));
    const n4Kanji = KanjiPracticeService.getKanjisByLevel('N4')[0].kanji;
    LessonKanjiService.recordReview('guest', 'jlpt-N4', n4Kanji, 'correct', new Date('2026-01-01'));
    const view = render(<KanjiProgressPanel userId="guest" level="ALL" onPractice={vi.fn()} />);
    await screen.findByText('Bugun qayta ko‘rish kerak (2)');
    expect(screen.queryByText('Umumiy JLPT kanji')).not.toBeInTheDocument();
    view.rerender(<KanjiProgressPanel userId="guest" level="N5" onPractice={vi.fn()} />);
    await screen.findByText('Umumiy JLPT kanji');
    expect(screen.getByRole('button', { name: 'Yozib takrorlash: 日' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `Yozib takrorlash: ${n4Kanji}` }),
    ).not.toBeInTheDocument();
  });

  it('requires confirmation and leaves unrelated lesson completion and XP untouched', async () => {
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct');
    localStorage.setItem('other-progress', 'keep');
    render(<KanjiProgressPanel userId="guest" level="N5" onPractice={vi.fn()} />);
    await screen.findByText('Lesson kanji');
    fireEvent.click(screen.getByRole('button', { name: 'Progressni reset qilish' }));
    expect(LessonKanjiService.getAllUserProgress('guest')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(LessonKanjiService.getAllUserProgress('guest')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Progressni reset qilish' }));
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Ha, barcha Kanji mashqlarini reset qilish' }),
      ),
    );
    expect(LessonKanjiService.getAllUserProgress('guest')).toEqual([]);
    expect(localStorage.getItem('other-progress')).toBe('keep');
  });
  it('exports only the selected account and revokes the temporary download URL', async () => {
    LessonKanjiService.recordReview('export-user', 'jlpt-N5', '日', 'correct');
    LessonKanjiService.recordReview('other-user', 'jlpt-N5', '月', 'correct');
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe('application/json');
      return 'blob:kanji-export';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      },
    );
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toMatch(/^kanji-progress-\d{4}-\d{2}-\d{2}\.json$/);
      expect(this.href).toBe('blob:kanji-export');
    });
    render(<KanjiProgressPanel userId="export-user" level="N5" onPractice={vi.fn()} />);
    await screen.findByText('Lesson kanji');
    fireEvent.click(screen.getByRole('button', { name: 'JSON eksport' }));
    expect(download).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(JSON.parse(text)).toMatchObject({
      userId: 'export-user',
      totalCount: 1,
      items: [{ kanji: '日' }],
    });
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:kanji-export'),
    );
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('shows cached results on sync failure and allows retry', async () => {
    const sync = vi
      .spyOn(LessonKanjiService, 'syncAllProgressFromDatabase')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct', new Date('2026-01-01'));
    render(<KanjiProgressPanel userId="guest" level="N5" onPractice={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server progressi yuklanmadi');
    expect(screen.getByRole('button', { name: 'Yozib takrorlash: 日' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Qayta yuklash' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it('keeps the confirmation and local progress when reset fails', async () => {
    vi.spyOn(LessonKanjiService, 'resetProgressAndSync').mockRejectedValue(
      new Error('Reset uchun internet kerak.'),
    );
    LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct');
    render(<KanjiProgressPanel userId="guest" level="N5" onPractice={vi.fn()} />);
    await screen.findByText('Lesson kanji');
    fireEvent.click(screen.getByRole('button', { name: 'Progressni reset qilish' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Ha, barcha Kanji mashqlarini reset qilish' }),
    );
    expect(await screen.findByText('Reset uchun internet kerak.')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(LessonKanjiService.getAllUserProgress('guest')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Ha, barcha Kanji mashqlarini reset qilish' }),
    ).toBeEnabled();
  });

  it('updates the due list on progress events and removes listeners after unmount', async () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const view = render(<KanjiProgressPanel userId="guest" level="N5" onPractice={vi.fn()} />);
    await screen.findByText('Lesson kanji');
    expect(screen.getByText('Bugun qayta ko‘rish kerak (0)')).toBeInTheDocument();
    await act(async () => {
      LessonKanjiService.recordReview('guest', 'jlpt-N5', '日', 'correct', new Date('2026-01-01'));
    });
    expect(screen.getByText('Bugun qayta ko‘rish kerak (1)')).toBeInTheDocument();
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith('kanji-progress-updated', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('does not expose the previous account’s due list after switching users', async () => {
    LessonKanjiService.recordReview('a', 'jlpt-N5', '日', 'correct', new Date('2026-01-01'));
    const view = render(<KanjiProgressPanel userId="a" level="N5" onPractice={vi.fn()} />);
    await screen.findByRole('button', { name: 'Yozib takrorlash: 日' });
    view.rerender(<KanjiProgressPanel userId="b" level="N5" onPractice={vi.fn()} />);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Yozib takrorlash: 日' }),
      ).not.toBeInTheDocument(),
    );
  });
});
