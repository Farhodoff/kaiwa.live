import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';
vi.mock('../../stores', () => ({
  useRatingModalStore: (selector: (value: any) => unknown) =>
    selector({
      isOpen: false,
      isSubmitting: false,
      closeModal: vi.fn(),
      openModal: vi.fn(),
      submitReview: vi.fn(),
    }),
}));
vi.mock('../feedback', () => ({ RatingReviewModal: () => null }));
vi.mock('../GlobalAnnouncementBanner', () => ({ GlobalAnnouncementBanner: () => null }));
vi.mock('../../hooks/useKeyboardOffset', () => ({
  useKeyboardOffset: () => ({ isKeyboardOpen: false }),
}));
describe('Compact app navigation', () => {
  it('keeps settings accessible without persistent language or theme switches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList);
    render(
      <MemoryRouter initialEntries={['/jlpt']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/jlpt" element={<div>Lesson content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: /Baholash|Ilovani baholash/ })).toBeNull();
    expect(screen.queryByText('kaiwa')).toBeNull();
    expect(screen.queryByText('会話 • AI 日本語')).toBeNull();
    expect(screen.getByText('Lesson content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sozlamalar' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('button', { name: 'Mavzuni almashtirish' })).toBeNull();
    expect(screen.queryByRole('button', { name: /UZ|Switch to English|日本語/ })).toBeNull();
  });
  it.each([
    ['/speaking-coach', 'AI suhbat'],
    ['/scenarios', 'Ssenariylar'],
    ['/lesson/ja-minna-l3', 'Darslar'],
  ])(
    'highlights the correct sidebar section at %s and preserves the expanded preference',
    (path, label) => {
      localStorage.setItem('study_planner_sidebar_collapsed', 'false');
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="*" element={<div>Page content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      const navigation = screen.getByRole('navigation', { name: 'Asosiy bo‘limlar' });
      expect(within(navigation).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        within(navigation)
          .getAllByRole('link')
          .filter((link) => link.getAttribute('aria-current') === 'page'),
      ).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Sidebar-ni yopish' })).toBeInTheDocument();
    },
  );
});
